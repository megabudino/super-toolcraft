import * as THREE from "three";

import type { HeroParams } from "../domain/hero-params";
import type { HeroRenderFrame } from "./hero-pipeline";

export function applyCamera(
  camera: THREE.PerspectiveCamera,
  params: HeroParams,
  frame: HeroRenderFrame,
): void {
  const yaw = THREE.MathUtils.degToRad(params.camera.yaw);
  const pitch = THREE.MathUtils.degToRad(params.camera.pitch);
  const direction = new THREE.Vector3(
    Math.cos(pitch) * Math.sin(yaw),
    Math.sin(pitch),
    -Math.cos(pitch) * Math.cos(yaw),
  );
  camera.position.set(
    params.camera.position.x * 60,
    params.camera.height,
    params.camera.position.y * 60,
  );
  camera.up.set(0, 1, 0);
  camera.fov = params.camera.fov;
  camera.aspect = frame.projectionAspect ?? frame.fullWidth / Math.max(1, frame.fullHeight);
  camera.lookAt(camera.position.clone().add(direction));
  camera.rotateZ(THREE.MathUtils.degToRad(params.camera.roll));
  if (
    frame.tileX !== 0 ||
    frame.tileY !== 0 ||
    frame.width !== frame.fullWidth ||
    frame.height !== frame.fullHeight
  ) {
    camera.setViewOffset(
      frame.fullWidth,
      frame.fullHeight,
      frame.tileX,
      frame.tileY,
      frame.width,
      frame.height,
    );
    // setViewOffset overwrites aspect; keep the authored logical projection.
    camera.aspect = frame.projectionAspect ?? camera.aspect;
  } else {
    camera.clearViewOffset();
  }
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}
