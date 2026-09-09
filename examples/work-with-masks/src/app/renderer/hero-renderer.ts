import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import type { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import { materialDefaults } from "../domain/material";
import { skyDefaults } from "../domain/sky";
import { heroEnvironmentKey, heroStructureKey, type HeroParams } from "../domain/hero-params";
import { applyCamera } from "./hero-camera";
import { createHeroLights, placeSunRelativeToCamera } from "./lights";
import { applyMaskParams, createMaskPass, isMaskPassActive } from "./masks";
import {
  applyPostParams,
  applyRibDeformationToPostPipeline,
  createPostPipeline,
  type HeroPostPipeline,
} from "./post";
import {
  applyRibDeformation,
  createRibDeformationUniforms,
  updateRibDeformationUniforms,
} from "./rib-deformation";
import { buildRibs } from "./rib-geometry";
import { createSkyMesh, makeEnvironment, updateSkyMesh, type HeroEnvironment } from "./sky";
import type { HeroRendererResource, HeroRenderFrame } from "./hero-pipeline";

export class HeroRenderer implements HeroRendererResource {
  readonly canvas: HTMLCanvasElement;
  readonly maxTileSize: number;

  private readonly camera = new THREE.PerspectiveCamera(56, 16 / 9, 0.1, 1000);
  private readonly lights;
  private readonly depthMaterial = new THREE.MeshDepthMaterial();
  private readonly deformationUniforms = createRibDeformationUniforms();
  private readonly material = new THREE.MeshPhysicalMaterial({
    clearcoat: materialDefaults.clearcoat,
    clearcoatRoughness: materialDefaults.clearcoatRoughness,
    color: materialDefaults.color,
    metalness: 0,
    roughness: materialDefaults.roughness,
  });
  private readonly post: HeroPostPipeline;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly ribs: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  private readonly scene = new THREE.Scene();
  private readonly sky = createSkyMesh(skyDefaults.gradient);
  private environment: HeroEnvironment | undefined;
  private environmentKey = "";
  private geometryKey = "";
  private height = 0;
  private shadowKey = "";
  private transparentPost:
    | Readonly<{
        composer: EffectComposer;
        dispose(): void;
        masks: ShaderPass;
      }>
    | undefined;
  private width = 0;
  private disposed = false;
  private finishPendingFrame: (() => void) | undefined;

  constructor(
    canvas: HTMLCanvasElement,
    options: Readonly<{ preserveDrawingBuffer?: boolean }> = {},
  ) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance",
      premultipliedAlpha: true,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this.maxTileSize = Math.max(1, Math.min(2048, this.renderer.capabilities.maxTextureSize));
    this.ribs = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    this.ribs.castShadow = true;
    this.ribs.customDepthMaterial = this.depthMaterial;
    this.ribs.frustumCulled = false;
    this.ribs.receiveShadow = true;
    this.scene.add(this.sky, this.ribs);
    this.lights = createHeroLights(this.scene, this.renderer.capabilities.maxTextureSize);
    this.post = createPostPipeline(this.renderer, this.scene, this.camera);
    applyRibDeformation(this.material, this.deformationUniforms);
    applyRibDeformation(this.depthMaterial, this.deformationUniforms);
    applyRibDeformationToPostPipeline(this.post, this.deformationUniforms);
  }

  private getTransparentPost() {
    if (this.transparentPost) return this.transparentPost;
    const target = new THREE.WebGLRenderTarget(1, 1, {
      samples: 4,
      type: THREE.HalfFloatType,
    });
    const composer = new EffectComposer(this.renderer, target);
    const renderPass = new RenderPass(this.scene, this.camera);
    const output = new OutputPass();
    const masks = createMaskPass();
    composer.addPass(renderPass);
    composer.addPass(output);
    composer.addPass(masks);
    this.transparentPost = {
      composer,
      dispose() {
        renderPass.dispose();
        output.dispose();
        masks.dispose();
        composer.dispose();
      },
      masks,
    };
    if (this.width > 0 && this.height > 0) composer.setSize(this.width, this.height);
    return this.transparentPost;
  }

  dispose(): void {
    this.disposed = true;
    this.finishPendingFrame?.();
    this.environment?.dispose();
    this.ribs.geometry.dispose();
    this.depthMaterial.dispose();
    this.material.dispose();
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    this.post.dispose();
    this.transparentPost?.dispose();
    this.renderer.dispose();
  }

  prepareEnvironment(params: HeroParams): void {
    const key = heroEnvironmentKey(params);
    if (key === this.environmentKey) return;
    const nextEnvironment = makeEnvironment(this.renderer, params.sky.lightGradient);
    this.environment?.dispose();
    this.environment = nextEnvironment;
    this.environmentKey = key;
    this.scene.environment = nextEnvironment.texture;
  }

  prepareGeometry(params: HeroParams): void {
    const key = heroStructureKey(params);
    if (key === this.geometryKey) return;
    const nextGeometry = buildRibs(params);
    const previousGeometry = this.ribs.geometry;
    this.ribs.geometry = nextGeometry;
    previousGeometry.dispose();
    this.geometryKey = key;
  }

  prepareFrame(params: HeroParams, frame: HeroRenderFrame): void {
    updateRibDeformationUniforms(this.deformationUniforms, params);
    applyCamera(this.camera, params, frame);
    placeSunRelativeToCamera(this.lights, this.camera, params);
    this.material.color.set(params.material.color);
    this.material.roughness = params.material.roughness;
    this.material.clearcoat = params.material.clearcoat;
    this.material.clearcoatRoughness = params.material.clearcoatRoughness;
    // The reference prototype rendered its 500-unit PMREM dome through the
    // default 100-unit capture range, which kept the IBL contribution subtle.
    // Our corrected PMREM capture sees the whole dome, so normalize the public
    // 0–4 control before applying it to avoid multiplying the reference gain.
    this.scene.environmentIntensity = params.sky.envIntensity / 5;
    this.scene.fog = new THREE.Fog(
      new THREE.Color(params.sky.fogColor),
      Math.min(params.sky.fogNear, params.sky.fogFar - 0.01),
      Math.max(params.sky.fogNear + 0.01, params.sky.fogFar),
    );
    updateSkyMesh(this.sky, params.sky.gradient);
    this.sky.visible = params.background.include;
    this.renderer.setClearColor(
      new THREE.Color(params.background.color),
      params.background.include ? 1 : 0,
    );
    this.renderer.toneMappingExposure = params.post.exposure;
    applyPostParams(this.post, params, frame);
    if (!params.background.include && isMaskPassActive(params)) {
      applyMaskParams(this.getTransparentPost().masks, params, frame);
    }
    const nextShadowKey = JSON.stringify([
      this.geometryKey,
      params.camera.position,
      params.camera.height,
      params.camera.yaw,
      params.camera.pitch,
      params.camera.roll,
      params.camera.fov,
      params.light.azimuth,
      params.light.elevation,
      params.light.intensity,
      params.light.shadowSoftness,
      params.light.shadows,
      params.structure.twist,
      params.structure.wave,
      params.structure.waveLength,
      params.structure.wavePhase,
      this.deformationUniforms.uTravel.value,
    ]);
    if (nextShadowKey !== this.shadowKey) {
      this.renderer.shadowMap.needsUpdate = true;
      this.shadowKey = nextShadowKey;
    }
  }

  render(params: HeroParams, frame: HeroRenderFrame): void {
    this.prepareGeometry(params);
    this.prepareEnvironment(params);
    this.prepareFrame(params, frame);
    this.renderPrepared(params);
  }

  renderPrepared(params: HeroParams): void {
    if (params.background.include) {
      this.post.composer.render();
    } else if (isMaskPassActive(params)) {
      this.getTransparentPost().composer.render();
    } else {
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
    }
    this.camera.clearViewOffset();
  }

  /** Back-pressure prevents zoom/playback from queuing unbounded GPU frames. */
  waitForFrame(): Promise<void> {
    const gl = this.renderer.getContext();
    if (!("fenceSync" in gl)) throw new Error("The editable wave requires WebGL 2.");
    const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!fence) return Promise.resolve();
    gl.flush();
    return new Promise(resolve => {
      let requestId: number;
      const finish = () => {
        window.cancelAnimationFrame(requestId);
        gl.deleteSync(fence);
        this.finishPendingFrame = undefined;
        resolve();
      };
      this.finishPendingFrame = finish;
      const poll = () => {
        const status = this.disposed || gl.isContextLost()
          ? gl.WAIT_FAILED : gl.clientWaitSync(fence, 0, 0);
        if (status === gl.TIMEOUT_EXPIRED) {
          requestId = window.requestAnimationFrame(poll);
          return;
        }
        finish();
      };
      requestId = window.requestAnimationFrame(poll);
    });
  }

  setSize(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    const gl = this.renderer.getContext();
    const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
    const limit = Math.min(this.renderer.capabilities.maxTextureSize, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number);
    if (width > Math.min(limit, viewport[0]) || height > Math.min(limit, viewport[1])) {
      throw new Error(`Wave preview exceeds the GPU surface limit (${width}×${height}).`);
    }
    this.renderer.setSize(width, height, false);
    if (gl.drawingBufferWidth !== width || gl.drawingBufferHeight !== height) {
      throw new Error('The GPU could not allocate the wave preview at the selected resolution.');
    }
    this.post.resize(width, height);
    this.transparentPost?.composer.setSize(width, height);
    this.width = width;
    this.height = height;
  }
}
