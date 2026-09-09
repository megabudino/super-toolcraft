import * as THREE from "three";

import { createGrassBladeGeometry } from "./grass-geometry";
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

export class GrassLayerResource {
  private geometry: THREE.InstancedBufferGeometry | null = null;
  private readonly materials: GrassLayerMaterialSet;
  private mesh: THREE.Mesh | null = null;
  private count = 0;

  constructor(
    private readonly scene: THREE.Object3D,
    cacheKey: string,
    private readonly renderOrder: number,
    sunPatchUniforms: GrassSunPatchUniforms,
    surfaceEdgeFade: GrassSurfaceEdgeFadeResource,
  ) {
    this.materials = createGrassLayerMaterialSet(
      cacheKey,
      sunPatchUniforms,
      surfaceEdgeFade,
    );
  }

  updateLayout(
    layout: GrassLayout,
    curveResolution: number,
    use3d: boolean,
  ): number {
    this.count = layout.count;
    this.geometry?.dispose();
    this.geometry = createGrassBladeGeometry(layout, curveResolution, use3d);
    if (this.mesh) this.scene.remove(this.mesh);
    this.mesh = new THREE.Mesh(this.geometry, this.materials.pbr);
    this.mesh.castShadow = this.renderOrder === 2;
    this.mesh.customDepthMaterial = this.materials.depth;
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
    this.mesh.renderOrder = this.renderOrder;
    this.scene.add(this.mesh);
    return this.count;
  }

  render(
    settings: GrassLayerMaterialSettings,
    options: Readonly<{
      enabled: boolean;
      instanceLimit: number;
    }>,
  ): number {
    applyGrassLayerMaterialSettings(this.materials, settings);
    const renderedCount = options.enabled
      ? Math.min(this.count, Math.max(0, Math.floor(options.instanceLimit)))
      : 0;
    if (this.geometry) this.geometry.instanceCount = renderedCount;
    if (this.mesh) {
      this.mesh.visible = options.enabled;
    }
    return renderedCount;
  }

  getCount(): number {
    return this.count;
  }

  dispose(): void {
    if (this.mesh) this.scene.remove(this.mesh);
    this.geometry?.dispose();
    disposeGrassLayerMaterialSet(this.materials);
  }
}
