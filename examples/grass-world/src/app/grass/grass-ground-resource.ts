import * as THREE from "three";

import { createGrassGroundGeometry } from "./grass-geometry";
import type { GrassSettings } from "./grass-settings-types";

export class GrassGroundResource {
  private geometry: THREE.PlaneGeometry | null = null;
  private minimumHeight = 0;
  private mesh: THREE.Mesh | null = null;

  constructor(
    private readonly parent: THREE.Object3D,
    private readonly material: THREE.MeshStandardMaterial,
    private readonly depthMaterial: THREE.MeshDepthMaterial,
  ) {}

  update(settings: GrassSettings): void {
    this.geometry?.dispose();
    this.geometry = createGrassGroundGeometry(settings);
    const positions = this.geometry.getAttribute("position");
    this.minimumHeight = Number.POSITIVE_INFINITY;
    for (let index = 0; index < positions.count; index += 1) {
      this.minimumHeight = Math.min(this.minimumHeight, positions.getY(index));
    }
    if (this.mesh) this.parent.remove(this.mesh);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = this.depthMaterial;
    this.mesh.receiveShadow = true;
    this.mesh.renderOrder = 0;
    this.parent.add(this.mesh);
  }

  apply(settings: GrassSettings): void {
    if (!this.mesh) return;
    this.mesh.receiveShadow = settings.surface.receiveShadows;
    this.mesh.visible = settings.field.showGround;
  }

  getMesh(): THREE.Mesh | null {
    return this.mesh;
  }

  getMinimumHeight(): number {
    return Number.isFinite(this.minimumHeight) ? this.minimumHeight : 0;
  }

  dispose(): void {
    if (this.mesh) this.parent.remove(this.mesh);
    this.geometry?.dispose();
    this.geometry = null;
    this.mesh = null;
    this.minimumHeight = 0;
  }
}
