import * as THREE from "three";

import { GrassLayerResource } from "./grass-layer-resource";
import { sliceGrassLayout, type GrassLayout } from "./grass-layout";
import type { GrassLayerMaterialSettings } from "./grass-material";
import type { GrassSunPatchUniforms } from "./grass-sun-patches";
import type { GrassSurfaceEdgeFadeResource } from "./grass-surface-edge-fade";

export class GrassLightweightLayerResource {
  private readonly layer: GrassLayerResource;

  constructor(
    scene: THREE.Object3D,
    cacheKey: string,
    renderOrder: number,
    sunPatchUniforms: GrassSunPatchUniforms,
    surfaceEdgeFade: GrassSurfaceEdgeFadeResource,
  ) {
    this.layer = new GrassLayerResource(
      scene,
      cacheKey,
      renderOrder,
      sunPatchUniforms,
      surfaceEdgeFade,
    );
  }

  updateLayout(layout: GrassLayout, detailedCount: number): number {
    const start = Math.min(
      layout.count,
      Math.max(0, Math.floor(detailedCount)),
    );
    return this.layer.updateLayout(sliceGrassLayout(layout, start), 1, false);
  }

  render(settings: GrassLayerMaterialSettings, enabled: boolean): number {
    return this.layer.render(settings, {
      enabled,
      instanceLimit: Number.POSITIVE_INFINITY,
    });
  }

  getCount(): number {
    return this.layer.getCount();
  }

  dispose(): void {
    this.layer.dispose();
  }
}
