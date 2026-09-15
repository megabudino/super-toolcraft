import * as THREE from "three";
import type { GlobeSettings } from "./globe-model";

export const GLOBE_RADIUS = 1;
export const VISIBLE_HORIZON_Z = 0.02;
const LINE_SURFACE_SCALE = 1;
const MIN_VISIBLE_SEGMENT_LENGTH = 0.08;

type VisibleLineSegment = {
  closed: boolean;
  points: THREE.Vector3[];
};

type LineSample = {
  local: THREE.Vector3;
  visible: boolean;
  z: number;
};


export function getOrientationQuaternion(settings: GlobeSettings): THREE.Quaternion {
  const cameraDirection = new THREE.Vector3(
    settings.orientation.position[0],
    settings.orientation.position[1],
    settings.orientation.position[2],
  ).normalize();
  return new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    cameraDirection,
  );
}

function toScaledLinePoint(point: THREE.Vector3): THREE.Vector3 {
  return point.clone().normalize().multiplyScalar(GLOBE_RADIUS * LINE_SURFACE_SCALE);
}

function interpolateHorizonPoint(from: LineSample, to: LineSample): THREE.Vector3 {
  const zDelta = to.z - from.z;
  const t = Math.abs(zDelta) < 0.000001
    ? 0.5
    : (VISIBLE_HORIZON_Z - from.z) / zDelta;
  return toScaledLinePoint(from.local.clone().lerp(to.local, Math.min(1, Math.max(0, t))));
}

function pathIsClosed(points: readonly THREE.Vector3[]): boolean {
  if (points.length < 3) {
    return false;
  }
  return points[0].distanceToSquared(points[points.length - 1]) < 0.00000001;
}

function getSegmentLength(points: readonly THREE.Vector3[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += points[index - 1].distanceTo(points[index]);
  }
  return length;
}

function appendVisibleSegment(
  segments: VisibleLineSegment[],
  points: THREE.Vector3[],
  closed: boolean,
): void {
  if (closed || getSegmentLength(points) >= MIN_VISIBLE_SEGMENT_LENGTH) {
    segments.push({ closed, points });
  }
}

export function createVisibleLineSegments(
  path: readonly [number, number, number][],
  orientation: THREE.Quaternion,
): VisibleLineSegment[] {
  if (path.length < 2) {
    return [];
  }

  const localPoints = path.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const closed = pathIsClosed(localPoints);
  const basePoints = closed ? localPoints.slice(0, -1) : localPoints;
  const samples = basePoints.map<LineSample>((local) => {
    const z = local.clone().applyQuaternion(orientation).z;
    return {
      local,
      visible: z >= VISIBLE_HORIZON_Z,
      z,
    };
  });

  if (samples.length < 2) {
    return [];
  }

  if (samples.every((sample) => sample.visible)) {
    return [
      {
        closed,
        points: samples.map((sample) => toScaledLinePoint(sample.local)),
      },
    ];
  }

  const segments: VisibleLineSegment[] = [];
  let current: THREE.Vector3[] = [];
  const edgeCount = closed ? samples.length : samples.length - 1;

  for (let index = 0; index < edgeCount; index += 1) {
    const from = samples[index];
    const to = samples[(index + 1) % samples.length];

    if (from.visible && current.length === 0) {
      current.push(toScaledLinePoint(from.local));
    }

    if (from.visible && to.visible) {
      current.push(toScaledLinePoint(to.local));
      continue;
    }

    if (from.visible && !to.visible) {
      current.push(interpolateHorizonPoint(from, to));
      if (current.length >= 2) {
        appendVisibleSegment(segments, current, false);
      }
      current = [];
      continue;
    }

    if (!from.visible && to.visible) {
      current = [interpolateHorizonPoint(from, to), toScaledLinePoint(to.local)];
    }
  }

  if (current.length >= 2) {
    appendVisibleSegment(segments, current, false);
  }

  return segments;
}
