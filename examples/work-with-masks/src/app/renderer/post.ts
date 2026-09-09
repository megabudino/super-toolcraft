import * as THREE from "three";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

import type { HeroParams } from "../domain/hero-params";
import { applyHazeParams, createHazePass } from "./haze";
import type { HeroRenderFrame } from "./hero-pipeline";
import { applyMaskParams, createMaskPass } from "./masks";
import { applyRibDeformation, type HeroRibDeformationUniforms } from "./rib-deformation";

const HERO_GTAO_STATIC_PARAMS = {
  distanceExponent: 1,
  distanceFallOff: 1,
  samples: 24,
  scale: 1,
  screenSpaceRadius: false,
  thickness: 1,
} as const;

const HERO_GTAO_MAX_LONG_EDGE = 2048;

export function getHeroGtaoInternalSize(
  width: number,
  height: number,
): Readonly<{ height: number; width: number }> {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const scale = Math.min(1, HERO_GTAO_MAX_LONG_EDGE / Math.max(safeWidth, safeHeight));
  return {
    height: Math.max(1, Math.round(safeHeight * scale)),
    width: Math.max(1, Math.round(safeWidth * scale)),
  };
}

class HeroGtaoPass extends GTAOPass {
  override setSize(width: number, height: number): void {
    const size = getHeroGtaoInternalSize(width, height);
    super.setSize(size.width, size.height);
  }
}

export type HeroPostPipeline = Readonly<{
  bloom: UnrealBloomPass;
  bokeh: BokehPass;
  composer: EffectComposer;
  dispose(): void;
  gtao: GTAOPass;
  haze: ShaderPass;
  masks: ShaderPass;
  resize(width: number, height: number): void;
}>;

export function createPostPipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): HeroPostPipeline {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const gtao = new HeroGtaoPass(scene, camera, 1, 1);
  gtao.updateGtaoMaterial({
    ...HERO_GTAO_STATIC_PARAMS,
    radius: 1,
  });
  gtao.output = GTAOPass.OUTPUT.Default;
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.22, 1, 0.95);
  const bokeh = new BokehPass(scene, camera, {
    aperture: 0.00008,
    focus: 20,
    maxblur: 0.005,
  });
  const output = new OutputPass();
  const haze = createHazePass();
  const masks = createMaskPass();
  composer.addPass(renderPass);
  composer.addPass(gtao);
  composer.addPass(bloom);
  composer.addPass(bokeh);
  composer.addPass(output);
  composer.addPass(haze);
  composer.addPass(masks);
  return {
    bloom,
    bokeh,
    composer,
    dispose() {
      renderPass.dispose();
      gtao.dispose();
      bloom.dispose();
      bokeh.dispose();
      output.dispose();
      haze.dispose();
      masks.dispose();
      composer.dispose();
    },
    gtao,
    haze,
    masks,
    resize(width, height) {
      composer.setSize(width, height);
    },
  };
}

export function applyRibDeformationToPostPipeline(
  pipeline: HeroPostPipeline,
  uniforms: HeroRibDeformationUniforms,
): void {
  applyRibDeformation(pipeline.gtao.normalMaterial, uniforms);
  const bokehDepth = (
    pipeline.bokeh as BokehPass & {
      _materialDepth: THREE.MeshDepthMaterial;
    }
  )._materialDepth;
  applyRibDeformation(bokehDepth, uniforms);
}

export function applyPostParams(
  pipeline: HeroPostPipeline,
  params: HeroParams,
  frame: HeroRenderFrame,
): void {
  pipeline.gtao.enabled = params.post.occlusion > 0;
  // Three marks the GTAO material for recompilation whenever distanceFallOff
  // is supplied, even when the value is unchanged. Keep compile-time options
  // on retained-pipeline creation and update only this live uniform per frame.
  pipeline.gtao.updateGtaoMaterial({ radius: params.post.occlusionRadius });
  pipeline.gtao.blendIntensity = params.post.occlusion;
  pipeline.bloom.enabled = params.post.bloom > 0;
  pipeline.bloom.strength = params.post.bloom;
  pipeline.bloom.radius = 1;
  pipeline.bloom.threshold = params.post.bloomThreshold;
  pipeline.bokeh.enabled = params.post.depthOfField;
  const uniforms = pipeline.bokeh.uniforms as Record<string, { value: number } | undefined>;
  if (uniforms.focus) uniforms.focus.value = params.post.focus;
  // Bokeh offsets use local U coordinates. A crop must not shrink the lens blur.
  const cropScale = frame.fullWidth / frame.width;
  if (uniforms.aspect) uniforms.aspect.value = frame.width / frame.height;
  if (uniforms.aperture) uniforms.aperture.value = params.post.aperture * cropScale;
  if (uniforms.maxblur) uniforms.maxblur.value = params.post.maxBlur * cropScale;
  applyHazeParams(pipeline.haze, params, frame);
  applyMaskParams(pipeline.masks, params, frame);
}
