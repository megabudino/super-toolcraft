import * as THREE from "three";

import type { HeroParams } from "../domain/hero-params";

export type HeroLights = Readonly<{
  hemisphere: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
}>;

export function createHeroLights(scene: THREE.Scene, maxShadowSize: number): HeroLights {
  const hemisphere = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  const shadowSize = Math.max(1024, Math.min(4096, maxShadowSize));
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 500;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  sun.shadow.blurSamples = 16;
  scene.add(hemisphere, sun, sun.target);
  return { hemisphere, sun };
}

export function placeSunRelativeToCamera(
  lights: HeroLights,
  camera: THREE.PerspectiveCamera,
  params: HeroParams,
): void {
  const azimuth = THREE.MathUtils.degToRad(params.light.azimuth);
  const elevation = THREE.MathUtils.degToRad(params.light.elevation);
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const direction = right
    .multiplyScalar(Math.sin(azimuth) * Math.cos(elevation))
    .add(up.multiplyScalar(Math.cos(azimuth) * Math.cos(elevation)))
    .add(forward.multiplyScalar(-Math.sin(elevation)))
    .normalize();

  lights.sun.color.set(params.light.color);
  lights.sun.intensity = params.light.intensity;
  lights.sun.castShadow = params.light.intensity > 0 && params.light.shadows;
  lights.sun.position.copy(camera.position).addScaledVector(direction, 150);
  lights.sun.target.position.copy(camera.position);
  lights.sun.shadow.radius = params.light.shadowSoftness;
  lights.hemisphere.color.set(params.light.skyColor);
  lights.hemisphere.groundColor.set(params.light.groundColor);
  lights.hemisphere.intensity = params.light.ambient;
}
