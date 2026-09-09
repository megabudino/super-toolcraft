import * as THREE from "three";

import {
  createGrassLawnClumpGeometry,
  getGrassLawnClumpCount,
  GRASS_LAWN_BLADES_PER_CLUMP,
} from "./grass-lawn-clump-geometry";
import type { GrassLayout } from "./grass-layout";
import {
  applyGrassLayerMaterialSettings,
  createGrassLayerMaterialSet,
  disposeGrassLayerMaterialSet,
  type GrassLayerMaterialSettings,
  type GrassLayerMaterialSet,
} from "./grass-material";
import type { GrassSunPatchUniforms } from "./grass-sun-patches";
import type { GrassSurfaceEdgeFadeResource } from "./grass-surface-edge-fade";

export type GrassLawnClumpRenderCount = Readonly<{
  clumps: number;
  detailedClumps: number;
  detailedEquivalentBlades: number;
  equivalentBlades: number;
  lightweightEquivalentBlades: number;
  lightweightClumps: number;
}>;

export class GrassLawnClumpResource {
  private detailedCount = 0;
  private detailedGeometry: THREE.InstancedBufferGeometry | null = null;
  private detailedMesh: THREE.Mesh | null = null;
  private equivalentCount = 0;
  private lightweightCount = 0;
  private lightweightGeometry: THREE.InstancedBufferGeometry | null = null;
  private lightweightMesh: THREE.Mesh | null = null;
  private readonly materials: GrassLayerMaterialSet;

  constructor(
    private readonly scene: THREE.Object3D,
    sunPatchUniforms: GrassSunPatchUniforms,
    surfaceEdgeFade: GrassSurfaceEdgeFadeResource,
  ) {
    this.materials = createGrassLayerMaterialSet(
      "lawn-clump",
      sunPatchUniforms,
      surfaceEdgeFade,
      { clump: true },
    );
  }

  private createMesh(
    geometry: THREE.InstancedBufferGeometry,
    renderOrder: number,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(geometry, this.materials.pbr);
    mesh.castShadow = false;
    mesh.customDepthMaterial = this.materials.depth;
    mesh.frustumCulled = false;
    mesh.receiveShadow = true;
    mesh.renderOrder = renderOrder;
    this.scene.add(mesh);
    return mesh;
  }

  updateLayout(
    layout: GrassLayout,
    options: Readonly<{ detailBladeCount: number; fieldArea: number }>,
  ): number {
    this.equivalentCount = layout.count;
    const totalClumps = getGrassLawnClumpCount(layout.count);
    this.detailedCount = Math.min(
      totalClumps,
      getGrassLawnClumpCount(options.detailBladeCount),
    );
    this.lightweightCount = totalClumps - this.detailedCount;

    if (this.detailedMesh) this.scene.remove(this.detailedMesh);
    if (this.lightweightMesh) this.scene.remove(this.lightweightMesh);
    this.detailedGeometry?.dispose();
    this.lightweightGeometry?.dispose();

    this.detailedGeometry = createGrassLawnClumpGeometry(layout, {
      clumpCount: this.detailedCount,
      fieldArea: options.fieldArea,
      quality: "detailed",
    });
    this.lightweightGeometry = createGrassLawnClumpGeometry(layout, {
      clumpCount: this.lightweightCount,
      fieldArea: options.fieldArea,
      quality: "lightweight",
      startClump: this.detailedCount,
    });
    this.detailedMesh = this.createMesh(this.detailedGeometry, 1);
    this.lightweightMesh = this.createMesh(this.lightweightGeometry, 0.9);
    return totalClumps;
  }

  render(
    settings: GrassLayerMaterialSettings,
    options: Readonly<{ enabled: boolean }>,
  ): GrassLawnClumpRenderCount {
    applyGrassLayerMaterialSettings(this.materials, settings);
    if (this.detailedGeometry) {
      this.detailedGeometry.instanceCount = options.enabled
        ? this.detailedCount
        : 0;
    }
    if (this.lightweightGeometry) {
      this.lightweightGeometry.instanceCount = options.enabled
        ? this.lightweightCount
        : 0;
    }
    if (this.detailedMesh) this.detailedMesh.visible = options.enabled;
    if (this.lightweightMesh) this.lightweightMesh.visible = options.enabled;
    const clumps = options.enabled
      ? this.detailedCount + this.lightweightCount
      : 0;
    const equivalentBlades = options.enabled
      ? Math.min(this.equivalentCount, clumps * GRASS_LAWN_BLADES_PER_CLUMP)
      : 0;
    const detailedEquivalentBlades = options.enabled
      ? Math.min(
          equivalentBlades,
          this.detailedCount * GRASS_LAWN_BLADES_PER_CLUMP,
        )
      : 0;
    return {
      clumps,
      detailedClumps: options.enabled ? this.detailedCount : 0,
      detailedEquivalentBlades,
      equivalentBlades,
      lightweightEquivalentBlades: equivalentBlades - detailedEquivalentBlades,
      lightweightClumps: options.enabled ? this.lightweightCount : 0,
    };
  }

  dispose(): void {
    if (this.detailedMesh) this.scene.remove(this.detailedMesh);
    if (this.lightweightMesh) this.scene.remove(this.lightweightMesh);
    this.detailedGeometry?.dispose();
    this.lightweightGeometry?.dispose();
    disposeGrassLayerMaterialSet(this.materials);
  }
}
