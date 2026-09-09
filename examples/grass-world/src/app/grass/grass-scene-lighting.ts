import * as THREE from "three";

import {
  loadGrassHdrEnvironment,
  type GrassHdrLightingProfile,
} from "./grass-hdr";
import {
  getGrassEnvironmentLightingTuning,
  getGrassHdriPresetSource,
  type GrassEnvironmentLightingTuning,
  type GrassHdriSource,
} from "./grass-hdri";
import type { GrassSettings } from "./grass-settings-types";

export type GrassSceneLightingState = Readonly<{
  contrast: number;
  direction: readonly [number, number];
  environmentRotationY: number;
  tint: readonly [number, number, number];
}>;

export class GrassSceneLighting {
  private readonly group = new THREE.Group();
  private readonly ambientLight = new THREE.HemisphereLight();
  private readonly keyLight = new THREE.DirectionalLight();
  private readonly rimLight = new THREE.DirectionalLight();
  private readonly authoredFillColor = new THREE.Color();
  private readonly authoredKeyColor = new THREE.Color();
  private readonly authoredRimColor = new THREE.Color();
  private readonly environmentRotation = new THREE.Euler(0, 0, 0, "XYZ");
  private readonly pmremGenerator: THREE.PMREMGenerator;
  private environmentRenderTarget: THREE.WebGLRenderTarget | null = null;
  private environmentLighting: GrassHdrLightingProfile = {
    ambientColor: [0.82, 0.9, 0.84],
    ambientStrength: 1,
    keyColor: [1, 0.95, 0.82],
    keyDirection: [-0.4, 0.8, 0.45],
    keyStrength: 1.5,
  };
  private environmentLightingTuning: GrassEnvironmentLightingTuning =
    getGrassEnvironmentLightingTuning(getGrassHdriPresetSource("meadow"));
  private environmentKey = "";
  private environmentRequestId = 0;
  private pendingEnvironment: Readonly<{
    key: string;
    promise: Promise<string>;
  }> | null = null;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly renderer: THREE.WebGLRenderer,
  ) {
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();
    this.ambientLight.groundColor.set(0x102017);
    this.group.add(this.ambientLight, this.keyLight, this.rimLight);
    this.scene.add(this.group);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.bias = -0.00035;
    this.keyLight.shadow.normalBias = 0.025;
    this.keyLight.shadow.camera.near = 0.1;
    this.keyLight.shadow.camera.far = 32;
    this.keyLight.shadow.camera.left = -8;
    this.keyLight.shadow.camera.right = 8;
    this.keyLight.shadow.camera.top = 8;
    this.keyLight.shadow.camera.bottom = -8;
  }

  private async loadEnvironmentSource(source: GrassHdriSource): Promise<
    Readonly<{
      lighting: GrassHdrLightingProfile;
      target: THREE.WebGLRenderTarget;
    }>
  > {
    const environment = await loadGrassHdrEnvironment(source.url);
    const texture = environment.texture;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const target = this.pmremGenerator.fromEquirectangular(texture);
    texture.dispose();
    return { lighting: environment.lighting, target };
  }

  async prepareEnvironment(settings: GrassSettings): Promise<string> {
    const requestedSource = settings.environment.source;
    if (
      this.environmentKey === requestedSource.cacheKey &&
      this.environmentRenderTarget
    ) {
      return this.environmentKey;
    }
    if (this.pendingEnvironment?.key === requestedSource.cacheKey) {
      return this.pendingEnvironment.promise;
    }
    const requestId = ++this.environmentRequestId;
    const promise = (async () => {
      let effectiveSource = requestedSource;
      let loaded: Awaited<ReturnType<typeof this.loadEnvironmentSource>>;
      try {
        loaded = await this.loadEnvironmentSource(effectiveSource);
      } catch (error) {
        if (effectiveSource.kind !== "custom") throw error;
        console.warn(
          `Custom HDRI ${effectiveSource.fileName} could not be decoded; using the selected preset.`,
          error,
        );
        effectiveSource = getGrassHdriPresetSource(settings.environment.preset);
        loaded = await this.loadEnvironmentSource(effectiveSource);
      }
      if (requestId !== this.environmentRequestId) {
        loaded.target.dispose();
        return this.environmentKey;
      }
      this.environmentRenderTarget?.dispose();
      this.environmentRenderTarget = loaded.target;
      this.environmentLighting = loaded.lighting;
      this.environmentLightingTuning =
        getGrassEnvironmentLightingTuning(effectiveSource);
      this.environmentKey = requestedSource.cacheKey;
      return `${this.environmentKey}:${effectiveSource.cacheKey}`;
    })();
    this.pendingEnvironment = { key: requestedSource.cacheKey, promise };
    try {
      return await promise;
    } finally {
      if (this.pendingEnvironment?.promise === promise) {
        this.pendingEnvironment = null;
      }
    }
  }

  apply(
    settings: GrassSettings,
    includeBackground: boolean,
  ): GrassSceneLightingState {
    this.environmentRotation.set(
      THREE.MathUtils.degToRad(settings.environment.rotationX),
      THREE.MathUtils.degToRad(settings.environment.rotation),
      THREE.MathUtils.degToRad(settings.environment.rotationZ),
      "XYZ",
    );
    const profile = this.environmentLighting;
    const tuning = this.environmentLightingTuning;
    const keyDirection = new THREE.Vector3(...profile.keyDirection).applyEuler(
      this.environmentRotation,
    );
    keyDirection.y = Math.max(0.18, Math.abs(keyDirection.y));
    keyDirection.normalize();
    const horizontal = new THREE.Vector2(keyDirection.x, keyDirection.z);
    if (horizontal.lengthSq() < 0.0001) horizontal.set(1, 0);
    else horizontal.normalize();

    const intensity = settings.environment.intensity;
    this.authoredFillColor.set(settings.environment.fillColor);
    this.ambientLight.color
      .setRGB(...profile.ambientColor)
      .lerp(this.authoredFillColor, 0.82);
    this.ambientLight.groundColor
      .setRGB(...profile.ambientColor)
      .multiplyScalar(0.18);
    this.ambientLight.intensity =
      profile.ambientStrength *
      intensity *
      0.24 *
      tuning.ambient *
      settings.environment.fillStrength;
    this.authoredKeyColor.set(settings.environment.keyColor);
    this.keyLight.color
      .setRGB(...profile.keyColor)
      .lerp(this.authoredKeyColor, 0.72);
    this.keyLight.intensity =
      profile.keyStrength *
      intensity *
      0.88 *
      tuning.key *
      settings.environment.keyStrength;
    this.keyLight.position.copy(keyDirection).multiplyScalar(12);
    this.authoredRimColor.set(settings.environment.rimColor);
    this.rimLight.color
      .setRGB(...profile.ambientColor)
      .lerp(this.authoredRimColor, 0.78);
    this.rimLight.intensity =
      profile.ambientStrength *
      intensity *
      0.46 *
      tuning.rim *
      settings.environment.rimStrength;
    this.rimLight.position
      .set(-keyDirection.x, 0.42, -keyDirection.z)
      .normalize()
      .multiplyScalar(10);
    this.group.visible = intensity > 0;

    const background = new THREE.Color(settings.scene.background);
    const environmentTexture = this.environmentRenderTarget?.texture ?? null;
    this.scene.environment = environmentTexture;
    this.scene.environmentIntensity =
      intensity * tuning.environmentFill * settings.environment.fillStrength;
    this.scene.environmentRotation.copy(this.environmentRotation);
    this.scene.backgroundRotation.copy(this.environmentRotation);
    this.scene.backgroundBlurriness = settings.environment.backgroundBlur;
    this.scene.backgroundIntensity = Math.max(0.15, intensity);
    this.scene.background =
      includeBackground && settings.environment.visible && environmentTexture
        ? environmentTexture
        : includeBackground
          ? background
          : null;
    this.renderer.setClearColor(background, includeBackground ? 1 : 0);
    this.renderer.toneMappingExposure =
      tuning.exposure * settings.environment.exposure;

    return {
      contrast: tuning.stylizedContrast,
      direction: [horizontal.x, horizontal.y],
      environmentRotationY: this.environmentRotation.y,
      tint: profile.ambientColor.map((channel, index) =>
        THREE.MathUtils.clamp(
          channel * 0.72 + profile.keyColor[index]! * 0.28,
          0,
          1,
        ),
      ) as [number, number, number],
    };
  }

  dispose(): void {
    this.environmentRequestId += 1;
    this.environmentRenderTarget?.dispose();
    this.pmremGenerator.dispose();
    this.scene.remove(this.group);
  }
}
