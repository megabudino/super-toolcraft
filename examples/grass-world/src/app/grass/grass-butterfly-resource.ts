import * as THREE from "three";

import {
  cloneGrassButterflyTextures,
  loadGrassButterflyTextures,
  type GrassButterflyTextures,
} from "./grass-butterfly-assets";
import {
  createGrassButterflyLayout,
  getGrassButterflyLayoutSignature,
  grassButterflyMaximumCount,
  type GrassButterflyLayout,
} from "./grass-butterfly-layout";
import type { GrassSettings } from "./grass-settings-types";

const TAU = Math.PI * 2;

type ButterflyShaderUniforms = Readonly<{
  progress: { value: number };
  wingCycles: { value: number };
}>;

export type GrassButterflyRenderResult = Readonly<{
  count: number;
  landingBlend: number;
  transitioning: boolean;
}>;

const LANDING_STAGGER_SHARE = 0.44;
const LANDING_APPROACH_SHARE = 1 - LANDING_STAGGER_SHARE;

function smoothstep01(value: number): number {
  const normalized = Math.max(0, Math.min(1, value));
  return normalized * normalized * (3 - 2 * normalized);
}

function lerpAngle(start: number, end: number, amount: number): number {
  const delta = Math.atan2(Math.sin(end - start), Math.cos(end - start));
  return start + delta * amount;
}

export function getGrassButterflyLandingProgress(
  flockProgress: number,
  landingOrder: number,
): number {
  const start =
    Math.max(0, Math.min(1, landingOrder)) * LANDING_STAGGER_SHARE;
  return smoothstep01(
    (flockProgress - start) / LANDING_APPROACH_SHARE,
  );
}

function createButterflyGeometry(): THREE.InstancedBufferGeometry {
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -0.5, 0, -0.25, 0, 0, -0.25, -0.5, 0, 0.25, 0, 0, 0.25,
        0, 0, -0.25, 0.5, 0, -0.25, 0, 0, 0.25, 0.5, 0, 0.25,
      ],
      3,
    ),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(
      Array.from({ length: 8 }, () => [0, 1, 0]).flat(),
      3,
    ),
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      [
        0, 0, 0.5, 0, 0, 1, 0.5, 1,
        0.5, 0, 1, 0, 0.5, 1, 1, 1,
      ],
      2,
    ),
  );
  geometry.setAttribute(
    "butterflyWingSide",
    new THREE.Float32BufferAttribute([-1, -1, -1, -1, 1, 1, 1, 1], 1),
  );
  geometry.setIndex([0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7]);
  geometry.setAttribute(
    "butterflyAtlasIndex",
    new THREE.InstancedBufferAttribute(
      new Float32Array(grassButterflyMaximumCount),
      1,
    ),
  );
  geometry.setAttribute(
    "butterflyWingPhase",
    new THREE.InstancedBufferAttribute(
      new Float32Array(grassButterflyMaximumCount),
      1,
    ),
  );
  geometry.setAttribute(
    "butterflyLanding",
    new THREE.InstancedBufferAttribute(
      new Float32Array(grassButterflyMaximumCount),
      1,
    ),
  );
  geometry.computeBoundingSphere();
  return geometry;
}

function patchButterflyMaterial(
  material: THREE.MeshStandardMaterial,
  uniforms: ButterflyShaderUniforms,
): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.grassButterflyProgress = uniforms.progress;
    shader.uniforms.grassButterflyWingCycles = uniforms.wingCycles;
    const declarations = `
attribute float butterflyAtlasIndex;
attribute float butterflyLanding;
attribute float butterflyWingPhase;
attribute float butterflyWingSide;
uniform float grassButterflyProgress;
uniform float grassButterflyWingCycles;
float grassButterflyWingAngle() {
  float wave = sin(6.28318530718 * (
    grassButterflyProgress * grassButterflyWingCycles + butterflyWingPhase
  ));
  float openAmount = 0.22 + 0.78 * (wave * 0.5 + 0.5);
  return mix(1.05 * openAmount, 0.1, butterflyLanding);
}
`;
    shader.vertexShader = `${declarations}\n${shader.vertexShader}`
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
float grassButterflyNormalAngle =
  butterflyWingSide * grassButterflyWingAngle();
float grassButterflyNormalCos = cos(grassButterflyNormalAngle);
float grassButterflyNormalSin = sin(grassButterflyNormalAngle);
objectNormal = vec3(
  objectNormal.x * grassButterflyNormalCos -
    objectNormal.y * grassButterflyNormalSin,
  objectNormal.x * grassButterflyNormalSin +
    objectNormal.y * grassButterflyNormalCos,
  objectNormal.z
);`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
float grassButterflyPositionAngle =
  butterflyWingSide * grassButterflyWingAngle();
float grassButterflyPositionCos = cos(grassButterflyPositionAngle);
float grassButterflyPositionSin = sin(grassButterflyPositionAngle);
float grassButterflyPositionX = transformed.x;
transformed.x = grassButterflyPositionX * grassButterflyPositionCos;
transformed.y += grassButterflyPositionX * grassButterflyPositionSin;`,
      )
      .replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
float grassButterflyAtlasCell = floor(butterflyAtlasIndex + 0.5);
vec2 grassButterflyAtlasOffset = vec2(
  mod(grassButterflyAtlasCell, 2.0) * 0.5,
  floor(grassButterflyAtlasCell / 2.0) * 0.25
);
#ifdef USE_MAP
  vMapUv = vMapUv * vec2(0.5, 0.25) + grassButterflyAtlasOffset;
#endif
#ifdef USE_ALPHAMAP
  vAlphaMapUv =
    vAlphaMapUv * vec2(0.5, 0.25) + grassButterflyAtlasOffset;
#endif
#ifdef USE_NORMALMAP
  vNormalMapUv =
    vNormalMapUv * vec2(0.5, 0.25) + grassButterflyAtlasOffset;
#endif
#ifdef USE_ROUGHNESSMAP
  vRoughnessMapUv =
    vRoughnessMapUv * vec2(0.5, 0.25) + grassButterflyAtlasOffset;
#endif`,
      );
  };
  material.customProgramCacheKey = () => "grass-butterfly-pbr-atlas-v2";
}

export class GrassButterflyResource {
  private readonly loader = new THREE.TextureLoader();
  private readonly geometry = createButterflyGeometry();
  private readonly material = new THREE.MeshStandardMaterial({
    alphaTest: 0.42,
    depthWrite: true,
    metalness: 0,
    roughness: 1,
    side: THREE.DoubleSide,
    transparent: false,
  });
  private readonly mesh = new THREE.InstancedMesh(
    this.geometry,
    this.material,
    grassButterflyMaximumCount,
  );
  private readonly uniforms: ButterflyShaderUniforms = {
    progress: { value: 0 },
    wingCycles: { value: 22 },
  };
  private readonly matrix = new THREE.Matrix4();
  private readonly position = new THREE.Vector3();
  private readonly quaternion = new THREE.Quaternion();
  private readonly scale = new THREE.Vector3();
  private readonly rotation = new THREE.Euler(0, 0, 0, "YXZ");
  private readonly approachCaptured = new Uint8Array(
    grassButterflyMaximumCount,
  );
  private readonly approachStarts = new Float32Array(
    grassButterflyMaximumCount * 4,
  );
  private layout: GrassButterflyLayout | null = null;
  private textures: GrassButterflyTextures | null = null;
  private preparePromise: Promise<string> | null = null;
  private hoverActive = false;
  private landingBlend = 0;
  private lastFrameAt = 0;

  constructor(parent: THREE.Object3D) {
    patchButterflyMaterial(this.material, this.uniforms);
    this.mesh.name = "butterfly-flock";
    this.mesh.count = 0;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    parent.add(this.mesh);
  }

  prepare(): Promise<string> {
    this.preparePromise ??= loadGrassButterflyTextures(this.loader).then(
      (sources) => {
        if (this.textures) return "butterflies-pbr-1k";
        const textures = cloneGrassButterflyTextures(sources);
        this.textures = textures;
        this.material.map = textures.baseColor;
        this.material.alphaMap = textures.opacity;
        this.material.normalMap = textures.normal;
        this.material.normalScale.set(0.72, 0.72);
        this.material.roughnessMap = textures.roughness;
        this.material.needsUpdate = true;
        return "butterflies-pbr-1k";
      },
    );
    return this.preparePromise;
  }

  updateLayout(settings: GrassSettings): string {
    const layout = createGrassButterflyLayout(settings);
    this.layout = layout;
    const atlasAttribute = this.geometry.getAttribute(
      "butterflyAtlasIndex",
    ) as THREE.InstancedBufferAttribute;
    const phaseAttribute = this.geometry.getAttribute(
      "butterflyWingPhase",
    ) as THREE.InstancedBufferAttribute;
    const landingAttribute = this.geometry.getAttribute(
      "butterflyLanding",
    ) as THREE.InstancedBufferAttribute;
    for (let index = 0; index < layout.count; index += 1) {
      atlasAttribute.setX(index, layout.atlasIndices[index]!);
      phaseAttribute.setX(index, layout.phases[index]!);
      landingAttribute.setX(index, 0);
    }
    this.approachCaptured.fill(0);
    atlasAttribute.needsUpdate = true;
    landingAttribute.needsUpdate = true;
    phaseAttribute.needsUpdate = true;
    this.mesh.count = settings.butterflies.enabled ? layout.count : 0;
    return getGrassButterflyLayoutSignature(layout);
  }

  setHoverActive(active: boolean): boolean {
    if (this.hoverActive === active) return false;
    this.hoverActive = active;
    this.lastFrameAt = 0;
    return true;
  }

  isTransitioning(): boolean {
    const target = this.hoverActive ? 1 : 0;
    return Math.abs(this.landingBlend - target) > 0.0001;
  }

  getLandingBlend(): number {
    return this.landingBlend;
  }

  render(
    settings: GrassSettings,
    progress: number,
    now: number,
    interactive: boolean,
  ): GrassButterflyRenderResult {
    const layout = this.layout;
    const enabled =
      settings.butterflies.enabled && Boolean(layout) && settings.butterflies.count > 0;
    this.mesh.visible = enabled && Boolean(this.textures);
    this.mesh.count = enabled ? Math.min(layout!.count, settings.butterflies.count) : 0;
    if (!enabled || !layout) {
      return {
        count: 0,
        landingBlend: this.landingBlend,
        transitioning: this.isTransitioning(),
      };
    }

    if (interactive) {
      const target = this.hoverActive ? 1 : 0;
      if (this.lastFrameAt > 0) {
        const deltaSeconds = Math.max(0, (now - this.lastFrameAt) / 1_000);
        const step =
          deltaSeconds / Math.max(0.2, settings.butterflies.landingTime);
        if (this.landingBlend < target) {
          this.landingBlend = Math.min(target, this.landingBlend + step);
        } else if (this.landingBlend > target) {
          this.landingBlend = Math.max(target, this.landingBlend - step);
        }
      }
      this.lastFrameAt = now;
    } else {
      this.landingBlend = 0;
      this.lastFrameAt = 0;
    }
    if (!this.hoverActive && this.landingBlend <= 0.0001) {
      this.approachCaptured.fill(0);
    }

    const landing = this.landingBlend;
    const flightCycles = settings.butterflies.flightCycles;
    const sizeSpan =
      settings.butterflies.sizeMax - settings.butterflies.sizeMin;
    const heightSpan =
      settings.butterflies.heightMax - settings.butterflies.heightMin;
    const landingAttribute = this.geometry.getAttribute(
      "butterflyLanding",
    ) as THREE.InstancedBufferAttribute;

    for (let index = 0; index < this.mesh.count; index += 1) {
      const phase = layout.phases[index]!;
      const angle = TAU * (progress * flightCycles + phase);
      const anchorX = layout.anchors[index * 2]!;
      const anchorZ = layout.anchors[index * 2 + 1]!;
      const radius = layout.orbitRadii[index]!;
      const flightX = anchorX + Math.cos(angle) * radius;
      const flightZ =
        anchorZ +
        Math.sin(angle * (index % 2 === 0 ? 1 : 2) + phase * TAU) * radius;
      const height =
        settings.butterflies.heightMin +
        heightSpan * layout.verticalFactors[index]!;
      const bob =
        Math.sin(TAU * (progress * (flightCycles + 1) + phase)) *
        height *
        0.09;
      const groundClearance =
        0.008 +
        (settings.butterflies.sizeMin +
          sizeSpan * layout.sizeFactors[index]!) *
          0.018;
      const flightY =
        layout.anchorHeights[index]! +
        groundClearance +
        height +
        bob;
      const size =
        settings.butterflies.sizeMin +
        sizeSpan * layout.sizeFactors[index]!;
      const flightHeading =
        layout.headings[index]! +
        angle +
        Math.sin(angle * 2 + phase * TAU) * 0.25;
      const localLanding = getGrassButterflyLandingProgress(
        landing,
        layout.landingOrders[index]!,
      );
      let x = flightX;
      let y = flightY;
      let z = flightZ;
      let heading = flightHeading;
      let pitch = 0;
      let bank = 0;

      if (localLanding > 0) {
        const startOffset = index * 4;
        if (
          this.approachCaptured[index] === 0 ||
          !this.hoverActive
        ) {
          this.approachCaptured[index] = 1;
          this.approachStarts[startOffset] = flightX;
          this.approachStarts[startOffset + 1] = flightY;
          this.approachStarts[startOffset + 2] = flightZ;
          this.approachStarts[startOffset + 3] = flightHeading;
        }
        const startX = this.approachStarts[startOffset]!;
        const startY = this.approachStarts[startOffset + 1]!;
        const startZ = this.approachStarts[startOffset + 2]!;
        const startHeading = this.approachStarts[startOffset + 3]!;
        const eased = smoothstep01(localLanding);
        const dx = anchorX - startX;
        const dz = anchorZ - startZ;
        const distance = Math.max(0.0001, Math.hypot(dx, dz));
        const curveSign =
          layout.landingOrders[index]! >= 0.5 ? 1 : -1;
        const curve =
          Math.sin(Math.PI * eased) *
          Math.min(radius * 0.82, distance * 0.48) *
          curveSign;
        const targetY = layout.anchorHeights[index]! + groundClearance;
        const descent = smoothstep01((eased - 0.08) / 0.84);

        x = startX + dx * eased + (-dz / distance) * curve;
        z = startZ + dz * eased + (dx / distance) * curve;
        y =
          startY +
          (targetY - startY) * descent +
          Math.sin(Math.PI * eased) * height * 0.07;
        heading = lerpAngle(
          startHeading,
          layout.headings[index]!,
          eased,
        );
        pitch = Math.sin(Math.PI * eased) * 0.3;
        bank = Math.sin(Math.PI * eased) * curveSign * 0.24;
      }

      this.position.set(x, y, z);
      this.rotation.set(pitch, heading, bank, "YXZ");
      this.quaternion.setFromEuler(this.rotation);
      this.scale.setScalar(size);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.mesh.setMatrixAt(index, this.matrix);
      landingAttribute.setX(index, localLanding);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    landingAttribute.needsUpdate = true;
    this.uniforms.progress.value = progress;
    this.uniforms.wingCycles.value = settings.butterflies.wingCycles;

    return {
      count: this.mesh.count,
      landingBlend: landing,
      transitioning: this.isTransitioning(),
    };
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
    if (this.textures) {
      this.textures.baseColor.dispose();
      this.textures.normal.dispose();
      this.textures.opacity.dispose();
      this.textures.roughness.dispose();
    }
  }
}
