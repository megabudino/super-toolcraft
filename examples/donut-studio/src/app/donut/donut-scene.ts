import type { ToolcraftOrientationPose } from "@/toolcraft/runtime/react";
import type {
  ToolcraftRendererPipelineClient,
  ToolcraftRendererPipelinePassCacheInput,
  ToolcraftRendererPipelinePassHandle,
  ToolcraftRendererPipelinePassResult,
} from "@/toolcraft/runtime";
import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  MathUtils,
  Matrix4,
  PCFShadowMap,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  RectAreaLight,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

import { loadDonutReferenceAssets } from "./donut-assets";
import { createDonutIcingSurfaceSignature } from "./donut-icing-geometry";
import {
  DONUT_OUTPUT_COLOR_SPACE,
} from "./donut-materials";
import {
  donutPipelinePasses,
} from "./donut-pipeline";
import {
  DONUT_ASSETS,
  DONUT_CAMERA,
  DONUT_LIGHTS,
} from "./donut-reference";
import {
  createDonutProductGraph,
  type DonutGraphEvidence,
} from "./donut-scene-graph";
import type { DonutSettings } from "./donut-types";

export type DonutSceneEvidence = DonutGraphEvidence &
  Readonly<{
    antialias: boolean;
    backingHeight: number;
    backingWidth: number;
    drawingBufferPreserved: boolean;
    pixelRatio: number;
    shadowMapUpdates: number;
  }>;

export type DonutScene = Readonly<{
  dispose: () => void;
  hitTest: (clientX: number, clientY: number) => boolean;
  render: (includeBackground: boolean) => Promise<DonutSceneEvidence>;
  resize: (width: number, height: number, pixelRatio: number) => void;
  setOrientation: (orientation: ToolcraftOrientationPose) => void;
  updateSettings: (settings: DonutSettings) => Promise<void>;
}>;

export type CreateDonutSceneOptions = Readonly<{
  canvas: HTMLCanvasElement;
  height: number;
  orientation: ToolcraftOrientationPose;
  pipeline: ToolcraftRendererPipelineClient | null;
  pixelRatio: number;
  preserveDrawingBuffer?: boolean;
  settings: DonutSettings;
  width: number;
}>;

export type DonutRendererSize = Readonly<{
  height: number;
  pixelRatio: number;
  width: number;
}>;

export function resolveDonutPreserveDrawingBuffer(
  requested: boolean | undefined,
): boolean {
  return requested !== false;
}

export function resolveDonutAntialias(pixelRatio: number): boolean {
  return pixelRatio < 1.5;
}

export function resolveDonutPreviewPixelRatio(
  devicePixelRatio: number,
  renderScale: number,
  canvasZoom: number,
): number {
  return devicePixelRatio * renderScale * (canvasZoom / 100);
}

export function shouldResizeDonutRenderer(
  current: DonutRendererSize,
  next: DonutRendererSize,
): boolean {
  return (
    current.height !== next.height ||
    current.pixelRatio !== next.pixelRatio ||
    current.width !== next.width
  );
}

export function createDonutShadowInvalidationKey(
  settings: DonutSettings,
): string {
  return JSON.stringify({
    donut: settings.donut,
    icing: {
      clearMode: settings.icing.clearMode,
      coverage: settings.icing.coverage,
      detail: settings.icing.detail,
      dripAmount: settings.icing.dripAmount,
      dripFrequency: settings.icing.dripFrequency,
      enabled: settings.icing.enabled,
      flow: settings.icing.flow,
      thickness: settings.icing.thickness,
    },
    plateVisible: settings.plateVisible,
    shadowsEnabled: settings.studio.shadowsEnabled,
    sprinkles: {
      clear: settings.sprinkles.clear,
      coverage: settings.sprinkles.coverage,
      flow: settings.sprinkles.flow,
      rotation: settings.sprinkles.rotation,
      scale: settings.sprinkles.scale,
      seed: settings.sprinkles.seed,
      shape: settings.sprinkles.shape,
      sizeVariation: settings.sprinkles.sizeVariation,
      surfaceOffset: settings.sprinkles.surfaceOffset,
    },
  });
}

function createDonutIcingSurfaceKey(settings: DonutSettings): string {
  return createDonutIcingSurfaceSignature({
    detail: settings.icing.clearMode !== "detail",
    donut: settings.donut,
    icing: settings.icing,
  });
}

function cameraQuaternion(
  orientation: ToolcraftOrientationPose,
  target = new Quaternion(),
): Quaternion {
  const matrix = new Matrix4().lookAt(
    new Vector3(...orientation.position),
    new Vector3(...DONUT_CAMERA.target),
    new Vector3(...orientation.up),
  );
  return target.setFromRotationMatrix(matrix).normalize();
}

function applyOrientation(
  orientation: ToolcraftOrientationPose,
  rootQuaternion: Quaternion,
): void {
  const defaultCamera = cameraQuaternion({
    position: DONUT_CAMERA.defaultPosition,
    up: DONUT_CAMERA.up,
  });
  const currentCamera = cameraQuaternion(orientation);
  rootQuaternion.copy(defaultCamera).multiply(currentCamera.invert());
}

type DonutStudioRig = Readonly<{
  cool: RectAreaLight;
  key: RectAreaLight;
  shadowProxy: DirectionalLight;
  warm: RectAreaLight;
}>;

function addReferenceLights(scene: Scene): DonutStudioRig {
  RectAreaLightUniformsLib.init();
  const lights = DONUT_LIGHTS.map((source) => {
    const light = new RectAreaLight(source.color, 1, source.size, source.size);
    light.name = source.name;
    light.power = source.energy;
    light.position.set(
      source.location[0],
      source.location[2],
      -source.location[1],
    );
    light.lookAt(...DONUT_CAMERA.target);
    scene.add(light);
    return light;
  });

  const shadowProxy = new DirectionalLight("#FFF3E1", 1.35);
  shadowProxy.name = "Area.ShadowProxy";
  shadowProxy.position.set(-5, 8, 5);
  shadowProxy.castShadow = true;
  shadowProxy.shadow.mapSize.set(2048, 2048);
  shadowProxy.shadow.camera.left = -4;
  shadowProxy.shadow.camera.right = 4;
  shadowProxy.shadow.camera.top = 4;
  shadowProxy.shadow.camera.bottom = -4;
  shadowProxy.shadow.camera.near = 0.5;
  shadowProxy.shadow.camera.far = 20;
  shadowProxy.shadow.bias = -0.00015;
  shadowProxy.shadow.normalBias = 0.018;
  scene.add(shadowProxy);
  return Object.freeze({
    cool: lights[2]!,
    key: lights[0]!,
    shadowProxy,
    warm: lights[1]!,
  });
}

function updateStudio(
  scene: Scene,
  rig: DonutStudioRig,
  settings: DonutSettings,
): void {
  scene.environmentIntensity = settings.studio.environmentStrength;
  scene.environmentRotation.y = MathUtils.degToRad(
    settings.studio.environmentRotation,
  );
  scene.backgroundRotation.y = MathUtils.degToRad(
    settings.studio.environmentRotation,
  );
  for (const [light, source] of [
    [rig.key, settings.studio.key],
    [rig.warm, settings.studio.warm],
    [rig.cool, settings.studio.cool],
  ] as const) {
    light.color.set(source.color);
    light.power = light === rig.key ? source.power * 0.55 : source.power;
    light.width = source.size;
    light.height = source.size;
  }
  rig.shadowProxy.color.set(settings.studio.key.color);
  rig.shadowProxy.intensity =
    6.5 * (settings.studio.key.power / DONUT_LIGHTS[0].energy);
  rig.shadowProxy.castShadow = settings.studio.shadowsEnabled;
  rig.shadowProxy.shadow.intensity = settings.studio.shadowStrength;
  rig.shadowProxy.shadow.radius = settings.studio.shadowSoftness;
}

type DonutPassHandle = ToolcraftRendererPipelinePassHandle<
  string,
  any,
  readonly string[],
  any
>;

async function recordMemoizedPass<Handle extends DonutPassHandle>(
  pipeline: ToolcraftRendererPipelineClient | null,
  pass: Handle,
  cacheInput: ToolcraftRendererPipelinePassCacheInput<Handle>,
): Promise<void> {
  if (!pipeline) return;
  const result = undefined as ToolcraftRendererPipelinePassResult<Handle>;
  await pipeline.runPass(pass, cacheInput, () => result);
  await pipeline.runPass(pass, cacheInput, () => result);
}

export async function createDonutScene({
  canvas,
  height: initialHeight,
  orientation: initialOrientation,
  pipeline,
  pixelRatio: initialPixelRatio,
  preserveDrawingBuffer,
  settings: initialSettings,
  width: initialWidth,
}: CreateDonutSceneOptions): Promise<DonutScene> {
  const drawingBufferPreserved =
    resolveDonutPreserveDrawingBuffer(preserveDrawingBuffer);
  const antialias = resolveDonutAntialias(initialPixelRatio);
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias,
    canvas,
    powerPreference: "high-performance",
    preserveDrawingBuffer: drawingBufferPreserved,
  });
  renderer.outputColorSpace = DONUT_OUTPUT_COLOR_SPACE;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const { environment, foodTextures, root: referenceRoot } =
    await loadDonutReferenceAssets();
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  for (const texture of Object.values(foodTextures)) {
    texture.anisotropy = Math.min(8, Math.max(1, maxAnisotropy));
  }

  const scene = new Scene();
  scene.environment = environment;
  const studioRig = addReferenceLights(scene);
  updateStudio(scene, studioRig, initialSettings);

  const camera = new PerspectiveCamera(
    DONUT_CAMERA.fov,
    initialWidth / initialHeight,
    DONUT_CAMERA.near,
    DONUT_CAMERA.far,
  );
  camera.position.set(...DONUT_CAMERA.defaultPosition);
  camera.up.set(...DONUT_CAMERA.up);
  camera.lookAt(...DONUT_CAMERA.target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const graph = createDonutProductGraph(
    referenceRoot,
    initialSettings,
    foodTextures,
  );
  scene.add(graph.root);
  applyOrientation(initialOrientation, graph.root.quaternion);
  graph.root.updateMatrixWorld(true);
  scene.updateMatrixWorld(true);

  let width = Math.max(1, initialWidth);
  let height = Math.max(1, initialHeight);
  let pixelRatio = Math.max(0.25, Math.min(8, initialPixelRatio));
  let settings = initialSettings;
  let disposed = false;
  let shadowMapUpdates = 0;
  let baseKey = JSON.stringify(initialSettings.donut);
  let icingKey = createDonutIcingSurfaceKey(initialSettings);
  let sprinkleKey = JSON.stringify({
    icingSurface: icingKey,
    sprinkles: initialSettings.sprinkles,
  });
  let shadowKey = createDonutShadowInvalidationKey(initialSettings);
  let orientationKey = JSON.stringify(initialOrientation);

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  await recordMemoizedPass(pipeline, donutPipelinePasses.sceneBootstrap, {
    "brown_photostudio_02_1k.hdr": DONUT_ASSETS.environment,
    "donut-reference.bin": DONUT_ASSETS.geometry,
    "megascans-donut-basecolor-2k.jpg": DONUT_ASSETS.materialBaseColor,
    "megascans-donut-normal-2k.jpg": DONUT_ASSETS.materialNormal,
    "megascans-donut-roughness-2k.jpg": DONUT_ASSETS.materialRoughness,
  });
  await recordMemoizedPass(pipeline, donutPipelinePasses.baseGeometry, {
    "donut shape settings": baseKey,
  });
  await recordMemoizedPass(pipeline, donutPipelinePasses.icingGeometry, {
    "donut shape settings": baseKey,
    "icing geometry settings": icingKey,
  });
  await recordMemoizedPass(pipeline, donutPipelinePasses.sprinkleLayout, {
    "donut shape settings": baseKey,
    "icing surface settings": icingKey,
    "sprinkle settings": sprinkleKey,
  });

  const raycaster = new Raycaster();
  const pointer = new Vector2();

  return Object.freeze({
    dispose: () => {
      if (disposed) return;
      disposed = true;
      graph.dispose();
      environment.dispose();
      for (const texture of Object.values(foodTextures)) texture.dispose();
      scene.clear();
      renderer.dispose();
    },
    hitTest: (clientX, clientY) => {
      if (disposed) return false;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(graph.root, true).length > 0;
    },
    render: async (includeBackground) => {
      if (disposed) {
        return {
          ...graph.getEvidence(),
          antialias,
          backingHeight: 0,
          backingWidth: 0,
          drawingBufferPreserved,
          pixelRatio,
          shadowMapUpdates,
        };
      }
      const showEnvironmentBackdrop =
        includeBackground && settings.studio.environmentBackdrop;
      scene.background = showEnvironmentBackdrop ? environment : null;
      scene.backgroundBlurriness = settings.studio.environmentBlur;
      scene.backgroundIntensity = 1;
      renderer.setClearColor(
        new Color(settings.background.color),
        includeBackground ? 1 : 0,
      );
      const work = () => {
        const refreshesShadowMap =
          studioRig.shadowProxy.castShadow && renderer.shadowMap.needsUpdate;
        renderer.render(scene, camera);
        if (refreshesShadowMap) shadowMapUpdates += 1;
      };
      if (pipeline) {
        await pipeline.runPass(
          donutPipelinePasses.previewRender,
          undefined,
          work,
        );
      } else {
        work();
      }
      return Object.freeze({
        ...graph.getEvidence(),
        antialias,
        backingHeight: canvas.height,
        backingWidth: canvas.width,
        drawingBufferPreserved,
        pixelRatio,
        shadowMapUpdates,
      });
    },
    resize: (nextWidth, nextHeight, nextPixelRatio) => {
      if (disposed) return;
      const nextSize = {
        height: Math.max(1, nextHeight),
        pixelRatio: Math.max(0.25, Math.min(8, nextPixelRatio)),
        width: Math.max(1, nextWidth),
      };
      if (
        !shouldResizeDonutRenderer(
          { height, pixelRatio, width },
          nextSize,
        )
      ) {
        return;
      }
      ({ height, pixelRatio, width } = nextSize);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    setOrientation: (orientation) => {
      if (disposed) return;
      const nextOrientationKey = JSON.stringify(orientation);
      if (nextOrientationKey === orientationKey) return;
      orientationKey = nextOrientationKey;
      applyOrientation(orientation, graph.root.quaternion);
      graph.root.updateMatrixWorld(true);
      renderer.shadowMap.needsUpdate = true;
    },
    updateSettings: async (nextSettings) => {
      if (disposed) return;
      const nextBaseKey = JSON.stringify(nextSettings.donut);
      const nextIcingKey = createDonutIcingSurfaceKey(nextSettings);
      const nextSprinkleKey = JSON.stringify({
        icingSurface: nextIcingKey,
        sprinkles: nextSettings.sprinkles,
      });
      const nextShadowKey = createDonutShadowInvalidationKey(nextSettings);
      graph.updateSettings(nextSettings);
      settings = nextSettings;
      updateStudio(scene, studioRig, nextSettings);
      if (nextShadowKey !== shadowKey) {
        shadowKey = nextShadowKey;
        renderer.shadowMap.needsUpdate = true;
      }
      if (nextBaseKey !== baseKey) {
        baseKey = nextBaseKey;
        await recordMemoizedPass(pipeline, donutPipelinePasses.baseGeometry, {
          "donut shape settings": baseKey,
        });
      }
      if (nextIcingKey !== icingKey) {
        icingKey = nextIcingKey;
        await recordMemoizedPass(pipeline, donutPipelinePasses.icingGeometry, {
          "donut shape settings": baseKey,
          "icing geometry settings": icingKey,
        });
      }
      if (nextSprinkleKey !== sprinkleKey) {
        sprinkleKey = nextSprinkleKey;
        await recordMemoizedPass(pipeline, donutPipelinePasses.sprinkleLayout, {
          "donut shape settings": baseKey,
          "icing surface settings": nextIcingKey,
          "sprinkle settings": sprinkleKey,
        });
      }
    },
  });
}
