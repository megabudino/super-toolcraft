import * as THREE from "three";
import type { GrassSceneResource } from "../app-renderer-pipeline-types";
import {
  GrassButterflyResource,
  type GrassButterflyRenderResult,
} from "./grass-butterfly-resource";
import { applyGrassColorGradeSettings, createGrassColorGradeUniforms } from "./grass-color-grade";
import { createGrassGroundBlendUniforms } from "./grass-ground-blend-material";
import { createGrassGroundMaterialSet } from "./grass-ground-materials";
import { GrassGroundResource } from "./grass-ground-resource";
import { GrassGroundShadowResource } from "./grass-ground-shadow";
import { GrassLayerResource } from "./grass-layer-resource";
import { GrassLightweightLayerResource } from "./grass-lightweight-layer-resource";
import { GrassLawnClumpResource } from "./grass-lawn-clump-resource";
import { createGrassLayout } from "./grass-layout";
import type { GrassScanLayerKind } from "./grass-scan-contract";
import { createGrassBoulderLayout, createGrassScanLayout } from "./grass-scan-layout";
import { GrassScanFieldResource } from "./grass-scan-resource";
import {
  GrassLayoutSignatureRegistry,
  type GrassSceneRenderDiagnostics,
} from "./grass-scene-diagnostics";
import { GrassSceneLighting } from "./grass-scene-lighting";
import { createGrassSceneLayerMaterialSettings } from "./grass-scene-material-settings";
import { getGrassGroundGeometryKey } from "./grass-settings-signatures";
import {
  GrassShadowCadence,
  type GrassRenderPurpose,
} from "./grass-shadow-cadence";
import { GrassSurfaceEdgeFadeResource } from "./grass-surface-edge-fade";
import { GrassSurfaceTiltTransform } from "./grass-surface-tilt";
import { applyGrassSunPatchSettings, createGrassSunPatchUniforms } from "./grass-sun-patches";
import {
  applyGrassTextureMaskSettings,
  createGrassTextureMaskUniforms,
} from "./grass-texture-mask";
import type { GrassSettings } from "./grass-values";
import {
  GrassWindFrameController,
  type GrassWindFrameSettings,
} from "./grass-wind";

const PBR_GROUND_ALBEDO_SCALE = 0.74;
const PBR_GROUND_ENVIRONMENT_RESPONSE = 0.68;
export type GrassRenderDiagnostics = GrassSceneRenderDiagnostics;
export class GrassSceneRenderer implements GrassSceneResource {
  readonly canvas: HTMLCanvasElement;
  private readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly surfaceRoot = new THREE.Group();
  private readonly sunPatchUniforms = createGrassSunPatchUniforms();
  private readonly tallLayer: GrassLayerResource;
  private readonly tallCoverageLayer: GrassLightweightLayerResource;
  private readonly lawnLayer: GrassLayerResource;
  private readonly lawnClumps: GrassLawnClumpResource;
  private readonly butterflies: GrassButterflyResource;
  private readonly scanField: GrassScanFieldResource;
  private readonly groundDepthMaterial: THREE.MeshDepthMaterial;
  private readonly groundMaterial: THREE.MeshStandardMaterial;
  private readonly ground: GrassGroundResource;
  private readonly groundColorGradeUniforms = createGrassColorGradeUniforms();
  private readonly groundBlendUniforms = createGrassGroundBlendUniforms();
  private readonly surfaceEdgeFade = new GrassSurfaceEdgeFadeResource();
  private readonly groundTextureMaskUniforms = createGrassTextureMaskUniforms();
  private readonly groundShadow: GrassGroundShadowResource;
  private readonly lighting: GrassSceneLighting;
  private currentWidth = 0;
  private currentHeight = 0;
  private currentScale = 0;
  private lastRenderedTallCount = 0;
  private lastRenderedLawnCount = 0;
  private lastRenderedLawnClumpCount = 0;
  private lastRenderedDetailedLawnCount = 0;
  private lastRenderedDetailedTallCount = 0;
  private lastRenderedLightweightLawnCount = 0;
  private lastRenderedLightweightTallCount = 0;
  private lastRenderedBoulderCount = 0;
  private readonly layoutSignatures = new GrassLayoutSignatureRegistry();
  private readonly raycaster = new THREE.Raycaster();
  private readonly shadowCadence = new GrassShadowCadence();
  private readonly windController = new GrassWindFrameController();
  private lastWindFrame: GrassWindFrameSettings | null = null;
  private lastButterflyFrame: GrassButterflyRenderResult = {
    count: 0,
    landingBlend: 0,
    transitioning: false,
  };
  private readonly surfaceTilt = new GrassSurfaceTiltTransform();
  constructor(
    canvas: HTMLCanvasElement,
    options: Readonly<{ antialias?: boolean }> = {},
  ) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: options.antialias ?? true,
      canvas,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.lighting = new GrassSceneLighting(this.scene, this.renderer);
    this.scene.add(this.surfaceRoot);
    this.groundShadow = new GrassGroundShadowResource(this.scene);
    this.lawnLayer = new GrassLayerResource(
      this.surfaceRoot,
      "lawn",
      1,
      this.sunPatchUniforms,
      this.surfaceEdgeFade,
    );
    this.lawnClumps = new GrassLawnClumpResource(
      this.surfaceRoot,
      this.sunPatchUniforms,
      this.surfaceEdgeFade,
    );
    this.tallLayer = new GrassLayerResource(
      this.surfaceRoot,
      "tall",
      2,
      this.sunPatchUniforms,
      this.surfaceEdgeFade,
    );
    this.tallCoverageLayer = new GrassLightweightLayerResource(
      this.surfaceRoot,
      "tall-lightweight",
      2,
      this.sunPatchUniforms,
      this.surfaceEdgeFade,
    );
    this.scanField = new GrassScanFieldResource(
      this.surfaceRoot,
      this.sunPatchUniforms,
      this.surfaceEdgeFade,
    );
    this.butterflies = new GrassButterflyResource(this.surfaceRoot);
    const groundMaterials = createGrassGroundMaterialSet(
      this.sunPatchUniforms,
      this.groundColorGradeUniforms,
      this.groundTextureMaskUniforms,
      this.groundBlendUniforms,
      this.surfaceEdgeFade,
    );
    this.groundMaterial = groundMaterials.surface;
    this.groundDepthMaterial = groundMaterials.depth;
    this.ground = new GrassGroundResource(
      this.surfaceRoot,
      this.groundMaterial,
      this.groundDepthMaterial,
    );
  }
  async prepareEnvironment(settings: GrassSettings): Promise<string> {
    return this.lighting.prepareEnvironment(settings);
  }
  async prepareScans(): Promise<string> {
    return this.scanField.prepare();
  }
  async prepareButterflies(): Promise<string> {
    return this.butterflies.prepare();
  }
  updateGround(settings: GrassSettings): string {
    this.ground.update(settings);
    return getGrassGroundGeometryKey(settings);
  }
  updateTallLayout(settings: GrassSettings): number {
    const layout = createGrassLayout(settings, "tall");
    this.layoutSignatures.update("tall", layout);
    const count = this.tallLayer.updateLayout(
      layout,
      settings.blade.curveResolution,
      settings.blade.use3d,
    );
    this.tallCoverageLayer.updateLayout(layout, settings.preview.bladeCount);
    return count;
  }

  updateLawnLayout(settings: GrassSettings): number {
    const layout = createGrassLayout(settings, "lawn");
    this.layoutSignatures.update("lawn", layout);
    const count = this.lawnLayer.updateLayout(
      layout,
      settings.lawn.curveResolution,
      settings.lawn.use3d,
    );
    this.lawnClumps.updateLayout(layout, {
      detailBladeCount: settings.preview.lawnBladeCount,
      fieldArea: settings.field.width * settings.field.depth,
    });
    return count;
  }

  updateLayout(settings: GrassSettings): number {
    return this.updateTallLayout(settings) + this.updateLawnLayout(settings);
  }

  updateScanLayout(kind: GrassScanLayerKind, settings: GrassSettings): number {
    const layout = createGrassScanLayout(kind, settings);
    this.layoutSignatures.update(kind, layout);
    const count = this.scanField.updateLayer(
      kind,
      layout,
    );
    if (kind === "rocks") {
      const boulderLayout = createGrassBoulderLayout(settings);
      this.layoutSignatures.update("boulder", {
        count: boulderLayout.count,
        offsets: Float32Array.from(boulderLayout.offset),
      });
      this.lastRenderedBoulderCount = this.scanField.updateBoulder(
        boulderLayout,
      );
    }
    return count;
  }

  getBoulderCount(): number {
    return this.lastRenderedBoulderCount;
  }

  getGroundMinimumHeight(): number {
    return this.ground.getMinimumHeight();
  }

  getLayoutSignature(): string {
    return this.layoutSignatures.toString();
  }

  updateScanLayouts(settings: GrassSettings): number {
    return (
      this.updateScanLayout("tufted", settings) +
      this.updateScanLayout("wild", settings) +
      this.updateScanLayout("white", settings) +
      this.updateScanLayout("yellow", settings) +
      this.updateScanLayout("rocks", settings)
    );
  }

  updateButterflyLayout(settings: GrassSettings): string {
    return this.butterflies.updateLayout(settings);
  }

  private resize(width: number, height: number, renderScale: number): void {
    const pixelWidth = Math.max(1, Math.round(width * renderScale));
    const pixelHeight = Math.max(1, Math.round(height * renderScale));
    if (
      pixelWidth !== this.currentWidth ||
      pixelHeight !== this.currentHeight ||
      renderScale !== this.currentScale
    ) {
      this.currentWidth = pixelWidth;
      this.currentHeight = pixelHeight;
      this.currentScale = renderScale;
      this.renderer.setSize(pixelWidth, pixelHeight, false);
    }
  }

  private updateCamera(settings: GrassSettings): void {
    const maximumField = Math.max(settings.field.width, settings.field.depth);
    const cameraDistance = 8 + maximumField * 0.55;
    const orientation = settings.view.orientation;
    const position = new THREE.Vector3(...orientation.position).normalize();
    const up = new THREE.Vector3(...orientation.up).normalize();
    this.camera.aspect = this.currentWidth / Math.max(1, this.currentHeight);
    this.camera.position.copy(position.multiplyScalar(cameraDistance));
    this.camera.up.copy(up);
    this.camera.lookAt(0, 0.46, 0);
    this.camera.updateProjectionMatrix();
  }

  render(
    settings: GrassSettings,
    progress: number,
    width: number,
    height: number,
    renderScale: number,
    includeBackground: boolean,
    options: Readonly<{
      purpose: GrassRenderPurpose;
      shadowStaticKey?: string;
    }>,
  ): number {
    this.resize(width, height, renderScale);
    const [surfaceTiltX, surfaceTiltZ] = this.surfaceTilt.resolve(
      options.purpose,
    );
    this.surfaceRoot.rotation.set(surfaceTiltX, 0, surfaceTiltZ, "XYZ");
    const sceneLighting = this.lighting.apply(settings, includeBackground);
    applyGrassSunPatchSettings(
      this.sunPatchUniforms,
      settings.environment.sunPatches,
      sceneLighting.environmentRotationY,
    );
    const windFrame = this.windController.resolve(
      settings.wind,
      progress,
      options.purpose,
    );
    this.lastWindFrame = windFrame;
    const lawnMaterialSettings = createGrassSceneLayerMaterialSettings({
      layer: "lawn",
      lighting: sceneLighting,
      settings,
      wind: windFrame,
    });
    const lawnEnabled = settings.lawn.enabled;
    const fullLawnCount = this.lawnLayer.render(lawnMaterialSettings, {
      enabled: lawnEnabled && options.purpose === "export",
      instanceLimit: Number.POSITIVE_INFINITY,
    });
    const liveLawnCount = this.lawnClumps.render(lawnMaterialSettings, {
      enabled: lawnEnabled && options.purpose === "interactive-preview",
    });
    this.lastRenderedLawnClumpCount = liveLawnCount.clumps;
    this.lastRenderedDetailedLawnCount =
      options.purpose === "export"
        ? fullLawnCount
        : liveLawnCount.detailedEquivalentBlades;
    this.lastRenderedLightweightLawnCount =
      options.purpose === "interactive-preview"
        ? liveLawnCount.lightweightEquivalentBlades
        : 0;
    this.lastRenderedLawnCount =
      options.purpose === "export"
        ? fullLawnCount
        : liveLawnCount.equivalentBlades;
    const tallMaterialSettings = createGrassSceneLayerMaterialSettings({
      layer: "tall",
      lighting: sceneLighting,
      settings,
      wind: windFrame,
    });
    const tallEnabled = settings.grass.enabled;
    const detailedTallCount = this.tallLayer.render(tallMaterialSettings, {
      enabled: tallEnabled,
      instanceLimit:
        options.purpose === "export"
          ? Number.POSITIVE_INFINITY
          : settings.preview.bladeCount,
    });
    const lightweightTallCount = this.tallCoverageLayer.render(
      tallMaterialSettings,
      tallEnabled && options.purpose === "interactive-preview",
    );
    this.lastRenderedDetailedTallCount = detailedTallCount;
    this.lastRenderedLightweightTallCount =
      options.purpose === "interactive-preview" ? lightweightTallCount : 0;
    this.lastRenderedTallCount =
      options.purpose === "export"
        ? detailedTallCount
        : detailedTallCount + lightweightTallCount;
    this.scanField.applyGroundMaterial(
      this.groundMaterial,
      settings,
      this.groundBlendUniforms,
    );
    this.scanField.applyMaterialSettings(settings, windFrame);
    this.scanField.setLayerVisible("tufted", settings.scans.tufted.enabled);
    this.scanField.setLayerVisible("wild", settings.scans.wild.enabled);
    this.scanField.setLayerVisible("white", settings.scans.white.enabled);
    this.scanField.setLayerVisible("yellow", settings.scans.yellow.enabled);
    this.scanField.setLayerVisible("rocks", settings.scans.rocks.enabled);
    this.scanField.setBoulderVisible(settings.scans.boulder.enabled);
    applyGrassColorGradeSettings(
      this.groundColorGradeUniforms,
      settings.surface,
      settings.environment,
    );
    applyGrassTextureMaskSettings(
      this.groundTextureMaskUniforms,
      settings.surface.textureMask,
    );
    this.surfaceEdgeFade.apply(settings);
    this.groundMaterial.color.set(settings.appearance.groundColor);
    this.groundMaterial.color.multiplyScalar(PBR_GROUND_ALBEDO_SCALE);
    this.groundMaterial.envMapIntensity = PBR_GROUND_ENVIRONMENT_RESPONSE;
    this.ground.apply(settings);
    this.groundShadow.update(settings);
    this.updateCamera(settings);
    this.lastButterflyFrame = this.butterflies.render(
      settings,
      progress,
      performance.now(),
      options.purpose === "interactive-preview",
    );
    const shadowStaticKey = options.shadowStaticKey ?? "";
    const shadowDeformationKey = `${settings.wind.mode}:${windFrame.activation.toFixed(4)}:${windFrame.directionAngle.toFixed(3)}:${windFrame.progress.toFixed(5)}`;
    const shadowDue = this.shadowCadence.shouldUpdate({
      deformationKey: shadowDeformationKey,
      now: performance.now(),
      purpose: options.purpose,
      staticKey: shadowStaticKey,
    });
    this.renderer.shadowMap.needsUpdate = shadowDue;
    this.renderer.render(this.scene, this.camera);
    return this.lastRenderedTallCount + this.lastRenderedLawnCount;
  }

  projectPointerToTerrain(
    clientX: number,
    clientY: number,
    bounds: DOMRectReadOnly,
  ): readonly [number, number] | null {
    if (
      !this.ground.getMesh() ||
      bounds.width <= 0 ||
      bounds.height <= 0 ||
      !Number.isFinite(clientX) ||
      !Number.isFinite(clientY)
    ) {
      return null;
    }
    const pointer = new THREE.Vector2(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.camera.updateMatrixWorld(true);
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.ground.getMesh()!, false)[0];
    return hit ? [hit.point.x, hit.point.z] : null;
  }

  hitTest(clientX: number, clientY: number, bounds: DOMRectReadOnly): boolean {
    return this.projectPointerToTerrain(clientX, clientY, bounds) !== null;
  }

  setPointerWindState(active: boolean, directionAngle?: number): void {
    this.windController.setPointerState(active, directionAngle);
  }

  setSurfaceTilt(rotationX: number, rotationZ: number): void {
    this.surfaceTilt.set(rotationX, rotationZ);
  }

  setButterflyHoverActive(active: boolean): boolean {
    return this.butterflies.setHoverActive(active);
  }

  isButterflyTransitioning(): boolean {
    return this.butterflies.isTransitioning();
  }

  getRenderDiagnostics(): GrassRenderDiagnostics {
    return {
      butterflyCount: this.lastButterflyFrame.count,
      butterflyLandingBlend: this.lastButterflyFrame.landingBlend,
      butterflyTransitioning: this.lastButterflyFrame.transitioning,
      calls: this.renderer.info.render.calls,
      clumpCount: this.lastRenderedLawnClumpCount,
      detailedLawnBlades: this.lastRenderedDetailedLawnCount,
      detailedTallBlades: this.lastRenderedDetailedTallCount,
      equivalentLawnBlades: this.lastRenderedLawnCount,
      lightweightLawnBlades: this.lastRenderedLightweightLawnCount,
      lightweightTallBlades: this.lastRenderedLightweightTallCount,
      shadowUpdated: this.shadowCadence.lastUpdated,
      ...this.surfaceTilt.getRenderDiagnostics(),
      triangles: this.renderer.info.render.triangles,
      windActivation: this.lastWindFrame?.activation ?? 0,
      windDirectionAngle: this.lastWindFrame?.directionAngle ?? 0,
      windPointerActive: this.lastWindFrame?.pointerActive ?? false,
    };
  }

  getBladeCount(): number {
    return this.tallLayer.getCount() + this.lawnLayer.getCount();
  }

  getTallBladeCount(): number {
    return this.tallLayer.getCount();
  }

  getLawnBladeCount(): number {
    return this.lawnLayer.getCount();
  }

  getRenderedTallBladeCount(): number {
    return this.lastRenderedTallCount;
  }

  getRenderedLawnBladeCount(): number {
    return this.lastRenderedLawnCount;
  }

  dispose(): void {
    this.lighting.dispose();
    this.tallLayer.dispose();
    this.tallCoverageLayer.dispose();
    this.lawnLayer.dispose();
    this.lawnClumps.dispose();
    this.butterflies.dispose();
    this.scanField.dispose();
    this.groundShadow.dispose();
    this.ground.dispose();
    this.groundDepthMaterial.dispose();
    this.groundMaterial.dispose();
    this.renderer.dispose();
  }
}
