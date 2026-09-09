import * as THREE from "three";

import {
  applyGrassColorGradeSettings,
  type GrassColorGradeUniforms,
} from "./grass-color-grade";
import {
  applyGrassFoliageBacklight,
  type GrassFoliageBacklightUniforms,
} from "./grass-foliage-backlight";
import {
  applyGrassGroundBlendSettings,
  applyGrassGroundBlendTextures,
  applyGrassGroundColorTints,
  type GrassGroundBlendUniforms,
} from "./grass-ground-blend-material";
import {
  grassBoulderScanAsset,
  grassCloverGroundTextures,
  grassGroundScanTextures,
  grassScanAssetFamilies,
  type GrassScanTextureSet,
} from "./grass-scan-assets";
import {
  grassScanLayerContracts,
  grassScanLayerKinds,
  type GrassScanLayerKind,
} from "./grass-scan-contract";
import {
  applyGrassReceivedShadowColor,
  type GrassReceivedShadowColorUniforms,
} from "./grass-received-shadow-color";
import type { GrassBoulderLayout, GrassScanLayout } from "./grass-scan-layout";
import {
  applyGrassScanDirectXNormalScale,
  createGrassBoulderMaterialBundle,
  createGrassScanMaterialBundle,
  type GrassScanLoadedTextureSet,
} from "./grass-scan-materials";
import type { GrassSunPatchUniforms } from "./grass-sun-patches";
import type { GrassSurfaceEdgeFadeResource } from "./grass-surface-edge-fade";
import {
  applyGrassTextureMaskSettings,
  type GrassTextureMaskUniforms,
} from "./grass-texture-mask";
import type { GrassSettings } from "./grass-values";
import {
  createGrassWindUniformSettings,
  type GrassWindFrameSettings,
} from "./grass-wind";
import {
  applyGrassWindUniformSettings,
  type GrassWindUniforms,
} from "./grass-wind-material";

type LoadedTextureSet = GrassScanLoadedTextureSet;

type LoadedScanFamily = Readonly<{
  backlightUniforms?: GrassFoliageBacklightUniforms;
  colorGradeUniforms: GrassColorGradeUniforms;
  depthMaterial: THREE.MeshDepthMaterial;
  material: THREE.MeshStandardMaterial;
  meshes: readonly THREE.InstancedMesh[];
  receivedShadowColorUniforms?: GrassReceivedShadowColorUniforms;
  textureMaskUniforms: GrassTextureMaskUniforms;
  textures: LoadedTextureSet;
  windUniforms?: GrassWindUniforms;
}>;

type LoadedBoulderFamily = Readonly<{
  colorGradeUniforms: GrassColorGradeUniforms;
  depthMaterial: THREE.MeshDepthMaterial;
  material: THREE.MeshStandardMaterial;
  mesh: THREE.Mesh;
  receivedShadowColorUniforms: GrassReceivedShadowColorUniforms;
  textureMaskUniforms: GrassTextureMaskUniforms;
  textures: LoadedTextureSet;
}>;

type GrassScanSourceCache = Readonly<{
  boulderGeometry: THREE.BufferGeometry;
  boulderTextures: LoadedTextureSet;
  families: Readonly<
    Record<
      GrassScanLayerKind,
      Readonly<{
        geometries: readonly THREE.BufferGeometry[];
        textures: LoadedTextureSet;
      }>
    >
  >;
  cloverGroundTextures: LoadedTextureSet;
  groundTextures: LoadedTextureSet;
}>;

let sharedScanSources: Promise<GrassScanSourceCache> | null = null;

function loadTextureSet(
  loader: THREE.TextureLoader,
  source: GrassScanTextureSet,
): Promise<LoadedTextureSet> {
  return Promise.all([
    loader.loadAsync(source.ao),
    loader.loadAsync(source.baseColor),
    loader.loadAsync(source.normal),
    source.opacity ? loader.loadAsync(source.opacity) : Promise.resolve(null),
    loader.loadAsync(source.roughness),
  ]).then(([ao, baseColor, normal, opacity, roughness]) => {
    baseColor.colorSpace = THREE.SRGBColorSpace;
    ao.channel = 0;
    for (const texture of [ao, baseColor, normal, opacity, roughness]) {
      if (!texture) continue;
      texture.anisotropy = 4;
      texture.flipY = false;
      texture.needsUpdate = true;
    }
    return {
      ao,
      baseColor,
      normal,
      ...(opacity ? { opacity } : {}),
      roughness,
    };
  });
}

const scanGeometryMagic = 0x314d4754;
const scanGeometryHeaderBytes = 16;
async function loadGeometry(url: string): Promise<THREE.BufferGeometry> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Megascans geometry request failed (${response.status}).`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength < scanGeometryHeaderBytes) {
    throw new Error(`Megascans geometry header is truncated: ${url}`);
  }
  const header = new DataView(buffer);
  const vertexCount = header.getUint32(4, true);
  const flags = header.getUint32(8, true);
  const hasNormals = (flags & 1) !== 0;
  const hasUvs = (flags & 2) !== 0;
  const expectedBytes =
    scanGeometryHeaderBytes +
    vertexCount * 3 * Float32Array.BYTES_PER_ELEMENT +
    (hasNormals ? vertexCount * 3 * Float32Array.BYTES_PER_ELEMENT : 0) +
    (hasUvs ? vertexCount * 2 * Float32Array.BYTES_PER_ELEMENT : 0);
  if (
    header.getUint32(0, true) !== scanGeometryMagic ||
    vertexCount === 0 ||
    vertexCount > 100_000 ||
    !hasUvs ||
    buffer.byteLength !== expectedBytes
  ) {
    throw new Error(`Megascans geometry payload is invalid: ${url}`);
  }
  let byteOffset = scanGeometryHeaderBytes;
  const positions = new Float32Array(buffer, byteOffset, vertexCount * 3);
  byteOffset += positions.byteLength;
  const normals = hasNormals
    ? new Float32Array(buffer, byteOffset, vertexCount * 3)
    : null;
  if (normals) byteOffset += normals.byteLength;
  const uvs = new Float32Array(buffer, byteOffset, vertexCount * 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  if (normals) {
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  } else {
    geometry.computeVertexNormals();
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function cloneTextureSet(source: LoadedTextureSet): LoadedTextureSet {
  const clone = (texture: THREE.Texture): THREE.Texture => {
    const copy = texture.clone();
    copy.needsUpdate = true;
    return copy;
  };
  return {
    ao: clone(source.ao),
    baseColor: clone(source.baseColor),
    normal: clone(source.normal),
    ...(source.opacity ? { opacity: clone(source.opacity) } : {}),
    roughness: clone(source.roughness),
  };
}

function getSharedScanSources(
  loader: THREE.TextureLoader,
): Promise<GrassScanSourceCache> {
  sharedScanSources ??= Promise.all([
    loadTextureSet(loader, grassGroundScanTextures),
    loadTextureSet(loader, grassCloverGroundTextures),
    loadGeometry(grassBoulderScanAsset.geometry),
    loadTextureSet(loader, grassBoulderScanAsset.textures),
    Promise.all(
      grassScanLayerKinds.map(async (kind) => {
        const assetFamily = grassScanAssetFamilies[kind];
        const [textures, geometries] = await Promise.all([
          loadTextureSet(loader, assetFamily.textures),
          Promise.all(assetFamily.variants.map((url) => loadGeometry(url))),
        ]);
        return [kind, { geometries, textures }] as const;
      }),
    ),
  ]).then(
    ([
      groundTextures,
      cloverGroundTextures,
      boulderGeometry,
      boulderTextures,
      familyEntries,
    ]) => ({
      boulderGeometry,
      boulderTextures,
      cloverGroundTextures,
      families: Object.fromEntries(
        familyEntries,
      ) as unknown as GrassScanSourceCache["families"],
      groundTextures,
    }),
  );
  return sharedScanSources;
}

function createCrossedCardGeometry(
  source: THREE.BufferGeometry,
): THREE.BufferGeometry {
  const sourcePositions = source.getAttribute("position");
  const sourceUvs = source.getAttribute("uv");
  const angles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3] as const;
  const leans = [0.3, -0.22, 0.18] as const;
  const positions = new Float32Array(sourcePositions.count * angles.length * 3);
  const uvs = new Float32Array(sourceUvs.count * angles.length * 2);
  const maximumY = Math.max(0.001, source.boundingBox?.max.y ?? 1);

  for (let copy = 0; copy < angles.length; copy += 1) {
    const cosine = Math.cos(angles[copy]);
    const sine = Math.sin(angles[copy]);
    for (let index = 0; index < sourcePositions.count; index += 1) {
      const targetPositionOffset = (copy * sourcePositions.count + index) * 3;
      const targetUvOffset = (copy * sourceUvs.count + index) * 2;
      const y = sourcePositions.getY(index);
      const heightRatio = THREE.MathUtils.clamp(y / maximumY, 0, 1);
      const x =
        sourcePositions.getX(index) * (1 + heightRatio * 0.38) +
        y * leans[copy];
      const z = sourcePositions.getZ(index);
      positions[targetPositionOffset] = x * cosine + z * sine;
      positions[targetPositionOffset + 1] = y;
      positions[targetPositionOffset + 2] = -x * sine + z * cosine;
      uvs[targetUvOffset] = sourceUvs.getX(index);
      uvs[targetUvOffset + 1] = sourceUvs.getY(index);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  source.dispose();
  return geometry;
}

function disposeTextureSet(textures: LoadedTextureSet): void {
  textures.ao.dispose();
  textures.baseColor.dispose();
  textures.normal.dispose();
  textures.opacity?.dispose();
  textures.roughness.dispose();
}

export class GrassScanFieldResource {
  private readonly group = new THREE.Group();
  private readonly textureLoader = new THREE.TextureLoader();
  private families: Readonly<
    Partial<Record<GrassScanLayerKind, LoadedScanFamily>>
  > = {};
  private boulder: LoadedBoulderFamily | null = null;
  private boulderCount = 0;
  private cloverGroundTextures: LoadedTextureSet | null = null;
  private groundTextures: LoadedTextureSet | null = null;
  private pending: Promise<string> | null = null;
  private ready = false;

  constructor(
    private readonly scene: THREE.Object3D,
    private readonly sunPatchUniforms: GrassSunPatchUniforms,
    private readonly surfaceEdgeFade: GrassSurfaceEdgeFadeResource,
  ) {
    this.group.name = "megascans-field-layers";
    this.group.renderOrder = 2;
    scene.add(this.group);
  }

  async prepare(): Promise<string> {
    if (this.ready) return "megascans-field-v3";
    if (this.pending) return this.pending;
    this.pending = (async () => {
      const sources = await getSharedScanSources(this.textureLoader);
      const groundTextures = cloneTextureSet(sources.groundTextures);
      const cloverGroundTextures = cloneTextureSet(
        sources.cloverGroundTextures,
      );
      const boulderGeometry = sources.boulderGeometry.clone();
      const boulderTextures = cloneTextureSet(sources.boulderTextures);
      const familyEntries = grassScanLayerKinds.map((kind) => {
        const source = sources.families[kind];
        const textures = cloneTextureSet(source.textures);
        const geometries = source.geometries.map((geometry) =>
          geometry.clone(),
        );
        const {
          backlightUniforms,
          colorGradeUniforms,
          depthMaterial,
          material,
          receivedShadowColorUniforms,
          textureMaskUniforms,
          windUniforms,
        } = createGrassScanMaterialBundle(
          kind,
          textures,
          this.sunPatchUniforms,
          this.surfaceEdgeFade,
        );
        const meshes = geometries.map((sourceGeometry, variantIndex) => {
          const geometry =
            kind === "tufted"
              ? createCrossedCardGeometry(sourceGeometry)
              : sourceGeometry;
          const mesh = new THREE.InstancedMesh(
            geometry,
            material,
            grassScanLayerContracts[kind].countMax,
          );
          mesh.name = `megascans-${kind}-${variantIndex + 1}`;
          mesh.count = 0;
          mesh.castShadow = true;
          mesh.customDepthMaterial = depthMaterial;
          mesh.receiveShadow = kind === "rocks";
          mesh.frustumCulled = false;
          mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          mesh.renderOrder = kind === "rocks" ? 1 : 2;
          this.group.add(mesh);
          return mesh;
        });
        return [
          kind,
          {
            ...(backlightUniforms ? { backlightUniforms } : {}),
            colorGradeUniforms,
            depthMaterial,
            material,
            meshes,
            ...(receivedShadowColorUniforms
              ? { receivedShadowColorUniforms }
              : {}),
            textureMaskUniforms,
            textures,
            ...(windUniforms ? { windUniforms } : {}),
          },
        ] as const;
      });
      this.groundTextures = groundTextures;
      this.cloverGroundTextures = cloverGroundTextures;
      this.families = Object.fromEntries(familyEntries);
      const {
        colorGradeUniforms: boulderColorGradeUniforms,
        depthMaterial: boulderDepthMaterial,
        material: boulderMaterial,
        receivedShadowColorUniforms: boulderReceivedShadowColorUniforms,
        textureMaskUniforms: boulderTextureMaskUniforms,
      } = createGrassBoulderMaterialBundle(
        boulderTextures,
        this.sunPatchUniforms,
        this.surfaceEdgeFade,
      );
      const boulderMesh = new THREE.Mesh(boulderGeometry, boulderMaterial);
      boulderMesh.name = "megascans-tundra-mossy-boulder";
      boulderMesh.castShadow = true;
      boulderMesh.customDepthMaterial = boulderDepthMaterial;
      boulderMesh.receiveShadow = true;
      boulderMesh.frustumCulled = false;
      boulderMesh.matrixAutoUpdate = false;
      boulderMesh.renderOrder = 1;
      boulderMesh.visible = false;
      this.group.add(boulderMesh);
      this.boulder = {
        colorGradeUniforms: boulderColorGradeUniforms,
        depthMaterial: boulderDepthMaterial,
        material: boulderMaterial,
        mesh: boulderMesh,
        receivedShadowColorUniforms: boulderReceivedShadowColorUniforms,
        textureMaskUniforms: boulderTextureMaskUniforms,
        textures: boulderTextures,
      };
      this.ready = true;
      return "megascans-field-v3";
    })();
    try {
      return await this.pending;
    } finally {
      this.pending = null;
    }
  }

  applyGroundMaterial(
    material: THREE.MeshStandardMaterial,
    settings: GrassSettings,
    blendUniforms: GrassGroundBlendUniforms,
  ): void {
    const textures = this.groundTextures;
    const cloverTextures = this.cloverGroundTextures;
    if (!textures || !cloverTextures) return;
    const changed = material.map !== textures.baseColor;
    material.map = textures.baseColor;
    material.aoMap = textures.ao;
    material.aoMapIntensity = 0.82;
    material.normalMap = textures.normal;
    material.roughnessMap = textures.roughness;
    applyGrassScanDirectXNormalScale(material, settings.surface.normalStrength);
    material.roughness = settings.surface.roughness;
    const repeatX =
      Math.max(0.25, settings.field.width * 0.5) *
      settings.surface.textureScale;
    const repeatY =
      Math.max(0.25, settings.field.depth * 0.5) *
      settings.surface.textureScale;
    for (const texture of Object.values(textures)) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
    }
    for (const texture of Object.values(cloverTextures)) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    }
    applyGrassGroundBlendTextures(blendUniforms, cloverTextures);
    applyGrassGroundBlendSettings(blendUniforms, settings.surface);
    applyGrassGroundColorTints(
      blendUniforms,
      settings.appearance.groundColor,
      settings.surface.clover.color,
    );
    if (changed) material.needsUpdate = true;
  }

  applyMaterialSettings(
    settings: GrassSettings,
    wind: GrassWindFrameSettings,
  ): void {
    for (const kind of grassScanLayerKinds) {
      const family = this.families[kind];
      if (!family) continue;
      const materialSettings = settings.scans[kind];
      applyGrassColorGradeSettings(
        family.colorGradeUniforms,
        materialSettings,
        settings.environment,
      );
      applyGrassTextureMaskSettings(
        family.textureMaskUniforms,
        materialSettings.textureMask,
      );
      family.material.color
        .set(materialSettings.pbrTint)
        .multiplyScalar(materialSettings.pbrBrightness);
      family.material.aoMapIntensity = materialSettings.pbrAoStrength;
      family.material.roughness = materialSettings.pbrRoughness;
      applyGrassScanDirectXNormalScale(
        family.material,
        materialSettings.pbrNormalStrength,
      );
      if (family.material instanceof THREE.MeshPhysicalMaterial) {
        family.material.sheen = materialSettings.pbrSheen;
      }
      if (family.backlightUniforms) {
        applyGrassFoliageBacklight(
          family.backlightUniforms,
          materialSettings.pbrBacklight,
        );
      }
      if (family.receivedShadowColorUniforms) {
        applyGrassReceivedShadowColor(
          family.receivedShadowColorUniforms,
          materialSettings.shadowColor,
        );
      }
      if (family.windUniforms) {
        const response =
          kind === "wild" ? 0.92 : kind === "tufted" ? 0.78 : 0.68;
        applyGrassWindUniformSettings(
          family.windUniforms,
          createGrassWindUniformSettings(wind, response),
        );
      }
    }
    if (this.boulder) {
      const materialSettings = settings.scans.boulder;
      applyGrassColorGradeSettings(
        this.boulder.colorGradeUniforms,
        materialSettings,
        settings.environment,
      );
      applyGrassTextureMaskSettings(
        this.boulder.textureMaskUniforms,
        materialSettings.textureMask,
      );
      this.boulder.material.color
        .set(materialSettings.pbrTint)
        .multiplyScalar(materialSettings.pbrBrightness);
      this.boulder.material.aoMapIntensity = materialSettings.pbrAoStrength;
      this.boulder.material.roughness = materialSettings.pbrRoughness;
      applyGrassScanDirectXNormalScale(
        this.boulder.material,
        materialSettings.pbrNormalStrength,
      );
      applyGrassReceivedShadowColor(
        this.boulder.receivedShadowColorUniforms,
        materialSettings.shadowColor,
      );
    }
  }

  updateLayer(kind: GrassScanLayerKind, layout: GrassScanLayout): number {
    const family = this.families[kind];
    if (!family) return 0;
    const variantCounts = new Uint16Array(family.meshes.length);
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const yaw = new THREE.Quaternion();
    const align = new THREE.Quaternion();
    const orientation = new THREE.Quaternion();
    const matrix = new THREE.Matrix4();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const contract = grassScanLayerContracts[kind];

    for (let index = 0; index < layout.count; index += 1) {
      const variant = Math.min(
        family.meshes.length - 1,
        layout.variants[index] ?? 0,
      );
      const targetIndex = variantCounts[variant] ?? 0;
      variantCounts[variant] = targetIndex + 1;
      const offsetIndex = index * 3;
      position.set(
        layout.offsets[offsetIndex] ?? 0,
        layout.offsets[offsetIndex + 1] ?? 0,
        layout.offsets[offsetIndex + 2] ?? 0,
      );
      normal
        .set(
          layout.normals[offsetIndex] ?? 0,
          layout.normals[offsetIndex + 1] ?? 1,
          layout.normals[offsetIndex + 2] ?? 0,
        )
        .normalize();
      yaw.setFromAxisAngle(yAxis, layout.angles[index] ?? 0);
      align.setFromUnitVectors(yAxis, normal);
      if (kind !== "rocks") align.slerp(new THREE.Quaternion(), 0.72);
      orientation.copy(align).multiply(yaw);
      const instanceScale =
        contract.baseSize * Math.max(0.01, layout.scales[index] ?? 1);
      scale.setScalar(instanceScale);
      matrix.compose(position, orientation, scale);
      const mesh = family.meshes[variant];
      mesh?.setMatrixAt(targetIndex, matrix);
    }

    family.meshes.forEach((mesh, variant) => {
      mesh.count = variantCounts[variant] ?? 0;
      mesh.visible = mesh.count > 0;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
    return layout.count;
  }

  updateBoulder(layout: GrassBoulderLayout): number {
    const boulder = this.boulder;
    if (!boulder) return 0;
    this.boulderCount = layout.count;
    boulder.mesh.visible = layout.count === 1;
    if (layout.count === 0) return 0;
    const position = new THREE.Vector3(...layout.offset);
    const normal = new THREE.Vector3(...layout.normal).normalize();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const align = new THREE.Quaternion().setFromUnitVectors(yAxis, normal);
    const yaw = new THREE.Quaternion().setFromAxisAngle(yAxis, layout.angle);
    const orientation = align.multiply(yaw);
    const scale = new THREE.Vector3().setScalar(layout.scale);
    boulder.mesh.matrix.compose(position, orientation, scale);
    boulder.mesh.matrixWorldNeedsUpdate = true;
    return 1;
  }

  setLayerVisible(kind: GrassScanLayerKind, visible: boolean): void {
    const family = this.families[kind];
    if (!family) return;
    for (const mesh of family.meshes) {
      mesh.visible = visible && mesh.count > 0;
    }
  }

  setBoulderVisible(visible: boolean): void {
    if (!this.boulder) return;
    this.boulder.mesh.visible = visible && this.boulderCount === 1;
  }

  dispose(): void {
    this.scene.remove(this.group);
    for (const family of Object.values(this.families)) {
      if (!family) continue;
      for (const mesh of family.meshes) {
        this.group.remove(mesh);
        mesh.geometry.dispose();
      }
      family.material.dispose();
      family.depthMaterial.dispose();
      disposeTextureSet(family.textures);
    }
    if (this.boulder) {
      this.group.remove(this.boulder.mesh);
      this.boulder.mesh.geometry.dispose();
      this.boulder.material.dispose();
      this.boulder.depthMaterial.dispose();
      disposeTextureSet(this.boulder.textures);
    }
    if (this.cloverGroundTextures) {
      disposeTextureSet(this.cloverGroundTextures);
    }
    if (this.groundTextures) disposeTextureSet(this.groundTextures);
    this.families = {};
    this.boulder = null;
    this.boulderCount = 0;
    this.cloverGroundTextures = null;
    this.groundTextures = null;
    this.ready = false;
  }
}
