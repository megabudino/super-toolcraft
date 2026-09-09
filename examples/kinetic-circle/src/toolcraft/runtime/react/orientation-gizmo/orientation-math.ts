export type ToolcraftOrientationVector = readonly [number, number, number];

export type ToolcraftOrientationPose = Readonly<{
  position: readonly [number, number, number];
  up: readonly [number, number, number];
}>;

export type ToolcraftOrientationAxis = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

export type ToolcraftOrientationAxisProjection = {
  axis: ToolcraftOrientationAxis;
  depth: number;
  isFrontFacing: boolean;
  x: number;
  y: number;
};

export type ToolcraftOrientationViewBasis = {
  back: [number, number, number];
  right: [number, number, number];
  up: [number, number, number];
};

export const DEFAULT_TOOLCRAFT_ORIENTATION_POSE: ToolcraftOrientationPose = {
  position: [-1.15, 0.9, 4.75],
  up: [0, 1, 0],
};

export const TOOLCRAFT_ORIENTATION_AXES: readonly ToolcraftOrientationAxis[] = [
  "+x",
  "-x",
  "+y",
  "-y",
  "+z",
  "-z",
];

const worldUp: ToolcraftOrientationVector = [0, 1, 0];
const minimumLengthSquared = 1e-12;
const minimumGizmoLocalZ = 1e-4;
const polarEpsilon = 1e-6;

const axisVectors: Record<
  ToolcraftOrientationAxis,
  ToolcraftOrientationVector
> = {
  "+x": [1, 0, 0],
  "-x": [-1, 0, 0],
  "+y": [0, 1, 0],
  "-y": [0, -1, 0],
  "+z": [0, 0, 1],
  "-z": [0, 0, -1],
};

function cross(
  left: ToolcraftOrientationVector,
  right: ToolcraftOrientationVector,
): [number, number, number] {
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

function dot(
  left: ToolcraftOrientationVector,
  right: ToolcraftOrientationVector,
): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function length(vector: ToolcraftOrientationVector): number {
  return Math.hypot(vector[0], vector[1], vector[2]);
}

function normalize(
  vector: ToolcraftOrientationVector,
): [number, number, number] {
  const vectorLength = length(vector);

  return vectorLength <= 1e-12
    ? [0, 0, 0]
    : [
        vector[0] / vectorLength,
        vector[1] / vectorLength,
        vector[2] / vectorLength,
      ];
}

class OrientationQuaternion {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
    public w = 1,
  ) {}

  clone(): OrientationQuaternion {
    return new OrientationQuaternion(this.x, this.y, this.z, this.w);
  }

  invert(): this {
    const squared =
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;

    if (squared <= 1e-12) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
      return this;
    }

    this.x = -this.x / squared;
    this.y = -this.y / squared;
    this.z = -this.z / squared;
    this.w /= squared;
    return this;
  }

  multiply(other: OrientationQuaternion): this {
    const { w, x, y, z } = this;

    this.x = w * other.x + x * other.w + y * other.z - z * other.y;
    this.y = w * other.y - x * other.z + y * other.w + z * other.x;
    this.z = w * other.z + x * other.y - y * other.x + z * other.w;
    this.w = w * other.w - x * other.x - y * other.y - z * other.z;
    return this;
  }

  normalize(): this {
    const quaternionLength = Math.hypot(this.x, this.y, this.z, this.w);

    if (quaternionLength <= 1e-12) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
      return this;
    }

    this.x /= quaternionLength;
    this.y /= quaternionLength;
    this.z /= quaternionLength;
    this.w /= quaternionLength;
    return this;
  }

  slerp(other: OrientationQuaternion, progress: number): this {
    const amount = Math.max(0, Math.min(1, progress));
    let targetX = other.x;
    let targetY = other.y;
    let targetZ = other.z;
    let targetW = other.w;
    let cosine =
      this.x * targetX +
      this.y * targetY +
      this.z * targetZ +
      this.w * targetW;

    if (cosine < 0) {
      cosine = -cosine;
      targetX = -targetX;
      targetY = -targetY;
      targetZ = -targetZ;
      targetW = -targetW;
    }

    if (cosine > 0.9995) {
      this.x += (targetX - this.x) * amount;
      this.y += (targetY - this.y) * amount;
      this.z += (targetZ - this.z) * amount;
      this.w += (targetW - this.w) * amount;
      return this.normalize();
    }

    const angle = Math.acos(Math.max(-1, Math.min(1, cosine)));
    const sine = Math.sin(angle);
    const startScale = Math.sin((1 - amount) * angle) / sine;
    const targetScale = Math.sin(amount * angle) / sine;

    this.x = this.x * startScale + targetX * targetScale;
    this.y = this.y * startScale + targetY * targetScale;
    this.z = this.z * startScale + targetZ * targetScale;
    this.w = this.w * startScale + targetW * targetScale;
    return this.normalize();
  }
}

function applyQuaternion(
  vector: ToolcraftOrientationVector,
  quaternion: OrientationQuaternion,
): [number, number, number] {
  const [x, y, z] = vector;
  const { w, x: qx, y: qy, z: qz } = quaternion;
  const ix = w * x + qy * z - qz * y;
  const iy = w * y + qz * x - qx * z;
  const iz = w * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;

  return [
    ix * w + iw * -qx + iy * -qz - iz * -qy,
    iy * w + iw * -qy + iz * -qx - ix * -qz,
    iz * w + iw * -qz + ix * -qy - iy * -qx,
  ];
}

function quaternionFromBasis(
  right: ToolcraftOrientationVector,
  up: ToolcraftOrientationVector,
  back: ToolcraftOrientationVector,
): OrientationQuaternion {
  const m11 = right[0];
  const m12 = up[0];
  const m13 = back[0];
  const m21 = right[1];
  const m22 = up[1];
  const m23 = back[1];
  const m31 = right[2];
  const m32 = up[2];
  const m33 = back[2];
  const trace = m11 + m22 + m33;
  const quaternion = new OrientationQuaternion();

  if (trace > 0) {
    const scale = 0.5 / Math.sqrt(trace + 1);
    quaternion.w = 0.25 / scale;
    quaternion.x = (m32 - m23) * scale;
    quaternion.y = (m13 - m31) * scale;
    quaternion.z = (m21 - m12) * scale;
  } else if (m11 > m22 && m11 > m33) {
    const scale = 2 * Math.sqrt(1 + m11 - m22 - m33);
    quaternion.w = (m32 - m23) / scale;
    quaternion.x = 0.25 * scale;
    quaternion.y = (m12 + m21) / scale;
    quaternion.z = (m13 + m31) / scale;
  } else if (m22 > m33) {
    const scale = 2 * Math.sqrt(1 + m22 - m11 - m33);
    quaternion.w = (m13 - m31) / scale;
    quaternion.x = (m12 + m21) / scale;
    quaternion.y = 0.25 * scale;
    quaternion.z = (m23 + m32) / scale;
  } else {
    const scale = 2 * Math.sqrt(1 + m33 - m11 - m22);
    quaternion.w = (m21 - m12) / scale;
    quaternion.x = (m13 + m31) / scale;
    quaternion.y = (m23 + m32) / scale;
    quaternion.z = 0.25 * scale;
  }

  return quaternion.normalize();
}

function quaternionFromUnitVectors(
  fromValue: ToolcraftOrientationVector,
  toValue: ToolcraftOrientationVector,
): OrientationQuaternion {
  const from = normalize(fromValue);
  const to = normalize(toValue);
  let real = dot(from, to) + 1;
  let imaginary: [number, number, number];

  if (real < 1e-6) {
    real = 0;
    imaginary =
      Math.abs(from[0]) > Math.abs(from[2])
        ? [-from[1], from[0], 0]
        : [0, -from[2], from[1]];
  } else {
    imaginary = cross(from, to);
  }

  return new OrientationQuaternion(
    imaginary[0],
    imaginary[1],
    imaginary[2],
    real,
  ).normalize();
}

function clonePose(pose: ToolcraftOrientationPose): ToolcraftOrientationPose {
  return { position: [...pose.position], up: [...pose.up] };
}

function readFiniteTuple(value: unknown): [number, number, number] | null {
  return Array.isArray(value) &&
    value.length === 3 &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
    ? [value[0], value[1], value[2]]
    : null;
}

function isUsablePose(pose: ToolcraftOrientationPose): boolean {
  return (
    length(pose.position) ** 2 > minimumLengthSquared &&
    length(pose.up) ** 2 > minimumLengthSquared &&
    length(cross(pose.up, pose.position)) ** 2 > minimumLengthSquared
  );
}

export function readToolcraftOrientationPose(
  value: unknown,
  fallback: ToolcraftOrientationPose = DEFAULT_TOOLCRAFT_ORIENTATION_POSE,
): ToolcraftOrientationPose {
  const safeFallback = isUsablePose(fallback)
    ? fallback
    : DEFAULT_TOOLCRAFT_ORIENTATION_POSE;

  if (!value || typeof value !== "object") {
    return clonePose(safeFallback);
  }

  const record = value as Record<string, unknown>;
  const position = readFiniteTuple(record.position);
  const up = readFiniteTuple(record.up);

  if (!position || !up) {
    return clonePose(safeFallback);
  }

  const pose = { position, up };

  return isUsablePose(pose) ? clonePose(pose) : clonePose(safeFallback);
}

export function getToolcraftOrientationViewBasis(
  poseValue: ToolcraftOrientationPose,
): ToolcraftOrientationViewBasis {
  const pose = readToolcraftOrientationPose(poseValue);
  const back = normalize(pose.position);
  const right = normalize(cross(pose.up, back));
  const up = normalize(cross(back, right));

  return { back, right, up };
}

function getCameraQuaternion(
  poseValue: ToolcraftOrientationPose,
): OrientationQuaternion {
  const basis = getToolcraftOrientationViewBasis(poseValue);
  return quaternionFromBasis(basis.right, basis.up, basis.back);
}

export function getToolcraftOrientationPoseFromPointerDelta(
  poseValue: ToolcraftOrientationPose,
  deltaX: number,
  deltaY: number,
  viewportHeight: number,
): ToolcraftOrientationPose {
  const pose = readToolcraftOrientationPose(poseValue);

  if (
    !Number.isFinite(deltaX) ||
    !Number.isFinite(deltaY) ||
    !Number.isFinite(viewportHeight) ||
    viewportHeight <= 0
  ) {
    return pose;
  }

  const up = normalize(pose.up);
  const alignUpToY = quaternionFromUnitVectors(up, worldUp);
  const restoreAuthoredUp = alignUpToY.clone().invert();
  const alignedPosition = applyQuaternion(pose.position, alignUpToY);
  const radius = length(alignedPosition);
  const theta =
    Math.atan2(alignedPosition[0], alignedPosition[2]) -
    (Math.PI * deltaX) / viewportHeight;
  const currentPhi = Math.acos(
    Math.max(-1, Math.min(1, alignedPosition[1] / radius)),
  );
  const phi = Math.max(
    polarEpsilon,
    Math.min(
      Math.PI - polarEpsilon,
      currentPhi - (Math.PI * deltaY) / viewportHeight,
    ),
  );
  const sinPhiRadius = Math.sin(phi) * radius;

  return {
    position: applyQuaternion(
      [
        sinPhiRadius * Math.sin(theta),
        Math.cos(phi) * radius,
        sinPhiRadius * Math.cos(theta),
      ],
      restoreAuthoredUp,
    ),
    up,
  };
}

export function projectToolcraftOrientationAxes(
  poseValue: ToolcraftOrientationPose,
  center = 35,
  reach = 24.5,
): ToolcraftOrientationAxisProjection[] {
  const basis = getToolcraftOrientationViewBasis(poseValue);
  const forward: ToolcraftOrientationVector = [
    -basis.back[0],
    -basis.back[1],
    -basis.back[2],
  ];

  return TOOLCRAFT_ORIENTATION_AXES.map((axis) => {
    const vector = axisVectors[axis];
    const depth = dot(vector, forward);

    return {
      axis,
      depth,
      isFrontFacing: depth < 0,
      x: center + dot(vector, basis.right) * reach,
      y: center - dot(vector, basis.up) * reach,
    };
  });
}

export function getToolcraftOrientationPoseFromGizmoPointer(
  poseValue: ToolcraftOrientationPose,
  axis: ToolcraftOrientationAxis,
  pointerX: number,
  pointerY: number,
  center: number,
  reach: number,
  cameraLocalZSign: -1 | 1,
): ToolcraftOrientationPose {
  const pose = readToolcraftOrientationPose(poseValue);
  let localX = (pointerX - center) / reach;
  let localY = (center - pointerY) / reach;
  const radialLength = Math.hypot(localX, localY);
  const maximumRadialLength = Math.sqrt(1 - minimumGizmoLocalZ ** 2);

  if (radialLength > maximumRadialLength) {
    const radialScale = maximumRadialLength / radialLength;
    localX *= radialScale;
    localY *= radialScale;
  }

  const targetLocalAxis = normalize([
    localX,
    localY,
    cameraLocalZSign *
      Math.sqrt(
        Math.max(
          minimumGizmoLocalZ ** 2,
          1 - localX * localX - localY * localY,
        ),
      ),
  ]);
  const cameraQuaternion = getCameraQuaternion(pose);
  const currentLocalAxis = normalize(
    applyQuaternion(axisVectors[axis], cameraQuaternion.clone().invert()),
  );
  const localCorrection = quaternionFromUnitVectors(
    targetLocalAxis,
    currentLocalAxis,
  );
  const nextCameraQuaternion = cameraQuaternion
    .clone()
    .multiply(localCorrection)
    .normalize();
  const radius = length(pose.position);

  return {
    position: applyQuaternion([0, 0, radius], nextCameraQuaternion),
    up: normalize(applyQuaternion([0, 1, 0], nextCameraQuaternion)),
  };
}

export function snapToolcraftOrientationPose(
  poseValue: ToolcraftOrientationPose,
  axis: ToolcraftOrientationAxis,
): ToolcraftOrientationPose {
  const radius = length(readToolcraftOrientationPose(poseValue).position);

  switch (axis) {
    case "+x":
      return { position: [radius, 0, 0], up: [0, 1, 0] };
    case "-x":
      return { position: [-radius, 0, 0], up: [0, 1, 0] };
    case "+y":
      return { position: [0, radius, 0], up: [0, 0, -1] };
    case "-y":
      return { position: [0, -radius, 0], up: [0, 0, 1] };
    case "+z":
      return { position: [0, 0, radius], up: [0, 1, 0] };
    case "-z":
      return { position: [0, 0, -radius], up: [0, 1, 0] };
  }
}

export function easeToolcraftOrientationSnap(progress: number): number {
  const value = Math.max(0, Math.min(1, progress));
  return value < 0.5
    ? 2 * value * value
    : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

export function interpolateToolcraftOrientationPose(
  startValue: ToolcraftOrientationPose,
  endValue: ToolcraftOrientationPose,
  progress: number,
): ToolcraftOrientationPose {
  const start = readToolcraftOrientationPose(startValue);
  const end = readToolcraftOrientationPose(endValue, start);
  const radius = length(start.position);
  const quaternion = getCameraQuaternion(start).slerp(
    getCameraQuaternion(end),
    Math.max(0, Math.min(1, progress)),
  );

  return {
    position: applyQuaternion([0, 0, radius], quaternion),
    up: normalize(applyQuaternion([0, 1, 0], quaternion)),
  };
}
