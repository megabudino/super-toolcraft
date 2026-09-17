import { Matrix4, Vector3, type OrthographicCamera } from 'three';
import type { ToolcraftSceneRect } from '@/toolcraft/runtime';
import type { IcebergSettings } from './iceberg-controls';
import type { IcebergPose } from './iceberg-render-types';
import { getIcebergPlateOffset } from './iceberg-plates';

export const icebergSceneUnits = 200;
export const icebergViewCenter = 0.66;
const referenceRect = { x: -500, y: -700, width: 1000, height: 1400 } as const;

export function getIcebergSceneRect(settings: IcebergSettings, pose: IcebergPose): ToolcraftSceneRect {
  // The GPU height field stays within this box: peaks <= height, additive
  // cliff/erosion/detail have bounded amplitudes, and seam <= level+variation.
  // Project its corners instead of fitting the camera: world scale stays fixed.
  const halfWidth = settings.width * 0.5;
  const top = settings.seamLevel + settings.seamVariation + settings.height * Math.max(1, settings.shoulder)
    + settings.cliff + settings.erosion + settings.detail * 0.06;
  const position = new Vector3(pose.position[0], pose.position[1], pose.position[2]);
  const up = new Vector3(pose.up[0], pose.up[1], pose.up[2]);
  const basis = new Matrix4().lookAt(position, new Vector3(), up).elements;
  const padding = 8;
  let left: number = referenceRect.x, right: number = referenceRect.x + referenceRect.width;
  let upper: number = referenceRect.y, lower: number = referenceRect.y + referenceRect.height;
  const bottom = -settings.depth + getIcebergPlateOffset(0, settings.plateGap);
  for (const x of [-halfWidth, halfWidth]) for (const y of [bottom, top]) for (const z of [-halfWidth, halfWidth]) {
    const relativeY = y - icebergViewCenter;
    const screenX = (basis[0] * x + basis[1] * relativeY + basis[2] * z) * icebergSceneUnits;
    const screenY = -(basis[4] * x + basis[5] * relativeY + basis[6] * z) * icebergSceneUnits;
    left = Math.min(left, Math.floor(screenX - padding));
    right = Math.max(right, Math.ceil(screenX + padding));
    upper = Math.min(upper, Math.floor(screenY - padding));
    lower = Math.max(lower, Math.ceil(screenY + padding));
  }
  return { x: left, y: upper, width: right - left, height: lower - upper };
}

export function configureIcebergCamera(camera: OrthographicCamera, settings: IcebergSettings, pose: IcebergPose) {
  const rect = getIcebergSceneRect(settings, pose);
  camera.left = rect.x / icebergSceneUnits;
  camera.right = (rect.x + rect.width) / icebergSceneUnits;
  camera.top = -rect.y / icebergSceneUnits;
  camera.bottom = -(rect.y + rect.height) / icebergSceneUnits;
  camera.updateProjectionMatrix();
  camera.position.set(pose.position[0], pose.position[1], pose.position[2]).normalize().multiplyScalar(12);
  camera.position.y += icebergViewCenter;
  camera.up.set(pose.up[0], pose.up[1], pose.up[2]);
  camera.lookAt(0, icebergViewCenter, 0);
  camera.updateMatrixWorld();
}
