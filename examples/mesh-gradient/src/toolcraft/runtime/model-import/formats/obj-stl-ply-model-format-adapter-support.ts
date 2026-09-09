import {
  Matrix4,
  type BufferAttribute,
  type InterleavedBufferAttribute,
  type Object3D,
} from "three";

import type { ToolcraftModelFormat } from "../../schema/types";
import type { ToolcraftSourceAssetFeedback } from "../../source-assets/source-asset-types";
import type {
  ToolcraftModelBounds,
  ToolcraftModelDocument,
  ToolcraftModelPrimitive,
} from "../canonical/model-document";
import { TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS } from "../model-import-limit-values";
import type { ToolcraftModelDecodeContext } from "../model-import-types";

export type ThreeStaticGeometryFormat = Extract<
  ToolcraftModelFormat,
  "fbx" | "obj" | "ply" | "stl"
>;
export type ThreeStaticGeometryAttribute =
  | BufferAttribute
  | InterleavedBufferAttribute;
export type ThreeStaticGeometryPrimitivePlan = Readonly<{
  index: BufferAttribute | null;
  normal?: ThreeStaticGeometryAttribute;
  position: ThreeStaticGeometryAttribute;
  primitiveId: string;
}>;

const arrayBufferByteLength = Object.getOwnPropertyDescriptor(
  ArrayBuffer.prototype,
  "byteLength",
)!.get!;

export class ToolcraftThreeStaticGeometryError
  extends Error
  implements ToolcraftSourceAssetFeedback
{
  readonly category: ToolcraftSourceAssetFeedback["category"];
  readonly code: string;

  constructor(
    category: ToolcraftSourceAssetFeedback["category"],
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "ToolcraftThreeStaticGeometryError";
    this.category = category;
    this.code = code;
  }
}

export function threeStaticGeometryFailure(
  category: ToolcraftSourceAssetFeedback["category"],
  code: string,
  message: string,
): never {
  throw new ToolcraftThreeStaticGeometryError(category, code, message);
}

export function throwIfThreeStaticGeometryAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  throw signal.reason ?? new DOMException("Model decode was cancelled.", "AbortError");
}

function checkpoint(signal: AbortSignal, index: number): void {
  if ((index & 255) === 0) throwIfThreeStaticGeometryAborted(signal);
}

export function getThreeStaticGeometryAttributeArray(
  attribute: ThreeStaticGeometryAttribute,
): ArrayBufferView {
  return "isInterleavedBufferAttribute" in attribute &&
      attribute.isInterleavedBufferAttribute
    ? attribute.data.array
    : attribute.array;
}

function boundsForPositions(positions: Float32Array): ToolcraftModelBounds {
  const min: [number, number, number] = [positions[0]!, positions[1]!, positions[2]!];
  const max: [number, number, number] = [...min];
  for (let offset = 3; offset < positions.length; offset += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], positions[offset + axis]!);
      max[axis] = Math.max(max[axis], positions[offset + axis]!);
    }
  }
  return { max, min };
}

function copyVec3(
  attribute: ThreeStaticGeometryAttribute,
  label: "normal" | "position",
  signal: AbortSignal,
): Float32Array {
  const copy = new Float32Array(attribute.count * 3);
  for (let index = 0; index < attribute.count; index += 1) {
    checkpoint(signal, index);
    const values = [attribute.getX(index), attribute.getY(index), attribute.getZ(index)];
    for (let axis = 0; axis < 3; axis += 1) {
      const value = values[axis]!;
      copy[index * 3 + axis] = value;
      if (!Number.isFinite(value) || !Number.isFinite(copy[index * 3 + axis])) {
        return threeStaticGeometryFailure(
          "geometry",
          `non-finite-${label}`,
          `Decoded ${label} data must contain only finite Float32 values.`,
        );
      }
    }
  }
  return copy;
}

function copyIndices(
  plan: ThreeStaticGeometryPrimitivePlan,
  signal: AbortSignal,
): Uint32Array {
  const count = plan.index?.count ?? plan.position.count;
  const indices = new Uint32Array(count);
  for (let index = 0; index < count; index += 1) {
    checkpoint(signal, index);
    const value = plan.index?.getX(index) ?? index;
    if (!Number.isInteger(value) || value < 0 || value >= plan.position.count) {
      return threeStaticGeometryFailure(
        "geometry",
        "index-out-of-range",
        "Decoded triangle indices must be integers within the position range.",
      );
    }
    indices[index] = value;
  }
  return indices;
}

export function copyThreeStaticGeometryPrimitive(
  plan: ThreeStaticGeometryPrimitivePlan,
  signal: AbortSignal,
): ToolcraftModelPrimitive {
  const positions = copyVec3(plan.position, "position", signal);
  return {
    bounds: boundsForPositions(positions),
    id: plan.primitiveId,
    indices: copyIndices(plan, signal),
    ...(plan.normal ? { normals: copyVec3(plan.normal, "normal", signal) } : {}),
    positions,
  };
}

export function getThreeStaticGeometryLocalMatrix(
  node: Object3D,
): ToolcraftModelDocument["nodes"][number]["localMatrix"] {
  const matrix = node.matrixAutoUpdate
    ? new Matrix4().compose(node.position, node.quaternion, node.scale)
    : node.matrix;
  const values = matrix.toArray();
  if (values.some((value) => !Number.isFinite(value))) {
    return threeStaticGeometryFailure(
      "geometry",
      "non-finite-node-transform",
      "Decoded node transforms must contain only finite values.",
    );
  }
  return values as ToolcraftModelDocument["nodes"][number]["localMatrix"];
}

export function checkedThreeStaticGeometryTotal(
  current: number,
  additional: number,
  limit: number,
  code: string,
  label: string,
): number {
  if (
    !Number.isSafeInteger(current) ||
    !Number.isSafeInteger(additional) ||
    current < 0 ||
    additional < 0 ||
    current > limit - additional
  ) {
    return threeStaticGeometryFailure(
      "resource-limit",
      code,
      `${label} exceeds the configured limit ${limit}.`,
    );
  }
  return current + additional;
}

export function validateThreeStaticGeometryLimits(
  limits: ToolcraftModelDecodeContext["limits"],
): void {
  for (const name of Object.keys(
    TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS,
  ) as Array<keyof typeof TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS>) {
    const value = limits[name];
    if (
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      value > TOOLCRAFT_MODEL_IMPORT_LIMIT_CEILINGS[name]
    ) {
      return threeStaticGeometryFailure(
        "resource-limit",
        "invalid-import-limits",
        `Model import limit ${name} is outside its protected integer range.`,
      );
    }
  }
}

function getArrayBufferByteLength(value: unknown): number | undefined {
  try {
    return arrayBufferByteLength.call(value) as number;
  } catch {
    return undefined;
  }
}

export function readThreeStaticGeometryRoot(
  context: ToolcraftModelDecodeContext,
  format: ThreeStaticGeometryFormat,
): ArrayBuffer {
  throwIfThreeStaticGeometryAborted(context.signal);
  validateThreeStaticGeometryLimits(context.limits);
  const files = context.bundle?.sourceFiles;
  if (!Array.isArray(files) || files.length !== 1) {
    return threeStaticGeometryFailure(
      "bundle",
      "invalid-static-geometry-bundle",
      `The ${format.toUpperCase()} adapter requires exactly one root file.`,
    );
  }
  const rootPath = context.bundle.rootPath;
  const root = files[0];
  const byteLength = getArrayBufferByteLength(root?.bytes);
  if (
    typeof rootPath !== "string" ||
    !rootPath.toLowerCase().endsWith(`.${format}`) ||
    root?.path !== rootPath ||
    byteLength === undefined
  ) {
    return threeStaticGeometryFailure(
      "bundle",
      "invalid-static-geometry-root",
      `The ${format.toUpperCase()} root file is missing or invalid.`,
    );
  }
  if (byteLength === 0) {
    return threeStaticGeometryFailure(
      "format",
      `empty-${format}`,
      `The ${format.toUpperCase()} source is empty.`,
    );
  }
  if (byteLength > context.limits.maxSourceBytes) {
    return threeStaticGeometryFailure(
      "resource-limit",
      "source-byte-limit-exceeded",
      `The source exceeds maxSourceBytes ${context.limits.maxSourceBytes}.`,
    );
  }
  if (byteLength > context.limits.maxDecodedBytes) {
    return threeStaticGeometryFailure(
      "resource-limit",
      "decoded-byte-limit-exceeded",
      `The source exceeds maxDecodedBytes ${context.limits.maxDecodedBytes}.`,
    );
  }
  checkedThreeStaticGeometryTotal(
    byteLength,
    byteLength,
    context.limits.maxEstimatedWorkerBytes,
    "estimated-worker-memory-limit-exceeded",
    "Static geometry source memory",
  );
  try {
    const snapshot = new Uint8Array(byteLength);
    snapshot.set(new Uint8Array(root.bytes));
    return snapshot.buffer;
  } catch {
    return threeStaticGeometryFailure(
      "resource-unavailable",
      "static-geometry-source-unavailable",
      "The model source buffer could not be snapshotted safely.",
    );
  }
}
