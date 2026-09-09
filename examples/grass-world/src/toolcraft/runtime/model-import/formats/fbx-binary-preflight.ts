import type { ToolcraftModelDecodeContext } from "../model-import-types";
import {
  checkedThreeStaticGeometryTotal,
  threeStaticGeometryFailure,
  throwIfThreeStaticGeometryAborted,
} from "./obj-stl-ply-model-format-adapter-support";
import {
  isFbxNullRecord,
  parseFbxBinaryProperty,
  readFbxBinaryName,
  readFbxUint64,
  requireFbxBinaryRange,
  type FbxBinaryPreflightState,
} from "./fbx-binary-preflight-reader";

const FBX_BINARY_MAGIC = "Kaydara FBX Binary  \0\x1a\0";
const UNSUPPORTED_NODE_NAMES = new Set([
  "AnimationCurve",
  "AnimationCurveNode",
  "AnimationLayer",
  "AnimationStack",
  "Deformer",
  "Pose",
  "Texture",
  "Video",
]);

function parseNode(
  bytes: Uint8Array,
  view: DataView,
  offset: number,
  version: number,
  parentEnd: number,
  state: FbxBinaryPreflightState,
  context: ToolcraftModelDecodeContext,
): number {
  throwIfThreeStaticGeometryAborted(context.signal);
  const wide = version >= 7500;
  const headerLength = wide ? 25 : 13;
  requireFbxBinaryRange(offset, headerLength, parentEnd);
  const readCount = (at: number) =>
    wide ? readFbxUint64(view, at) : view.getUint32(at, true);
  const endOffset = readCount(offset);
  const propertyCount = readCount(offset + (wide ? 8 : 4));
  const propertyBytes = readCount(offset + (wide ? 16 : 8));
  const nameLength = view.getUint8(offset + (wide ? 24 : 12));
  if (endOffset === 0) return offset + headerLength;
  if (endOffset <= offset || endOffset > parentEnd) {
    return threeStaticGeometryFailure(
      "format",
      "invalid-fbx-node-range",
      "FBX binary node offsets must stay within their parent.",
    );
  }
  const nameOffset = offset + headerLength;
  const nodeName = readFbxBinaryName(bytes, nameOffset, nameLength);
  if (UNSUPPORTED_NODE_NAMES.has(nodeName)) {
    return threeStaticGeometryFailure(
      "format",
      "unsupported-fbx-feature",
      `Geometry-only FBX import does not accept ${nodeName} nodes.`,
    );
  }
  state.nodeCount = checkedThreeStaticGeometryTotal(
    state.nodeCount,
    1,
    context.limits.maxNodes,
    "max-nodes-exceeded",
    "FBX nodes",
  );

  let cursor = nameOffset + nameLength;
  const propertyEnd = cursor + propertyBytes;
  requireFbxBinaryRange(cursor, propertyBytes, endOffset);
  for (let index = 0; index < propertyCount; index += 1) {
    cursor = parseFbxBinaryProperty(
      view,
      cursor,
      propertyEnd,
      nodeName,
      state,
      context.limits,
    );
  }
  if (cursor !== propertyEnd) {
    return threeStaticGeometryFailure(
      "format",
      "invalid-fbx-property-list",
      "FBX binary property bytes do not match the declared property count.",
    );
  }
  while (cursor < endOffset) {
    const nullLength = wide ? 25 : 13;
    if (
      endOffset - cursor === nullLength &&
      isFbxNullRecord(bytes, cursor, nullLength)
    ) {
      cursor = endOffset;
      break;
    }
    const next = parseNode(
      bytes,
      view,
      cursor,
      version,
      endOffset,
      state,
      context,
    );
    if (next <= cursor) {
      return threeStaticGeometryFailure(
        "format",
        "invalid-fbx-node-progress",
        "FBX binary child traversal did not advance.",
      );
    }
    cursor = next;
  }
  return cursor;
}

export function isBinaryFbx(source: ArrayBuffer): boolean {
  if (source.byteLength < FBX_BINARY_MAGIC.length) return false;
  return readFbxBinaryName(
    new Uint8Array(source),
    0,
    FBX_BINARY_MAGIC.length,
  ) === FBX_BINARY_MAGIC;
}

export function preflightBinaryFbx(
  source: ArrayBuffer,
  context: ToolcraftModelDecodeContext,
): void {
  const bytes = new Uint8Array(source);
  const view = new DataView(source);
  requireFbxBinaryRange(0, 27, bytes.byteLength);
  const version = view.getUint32(23, true);
  if (version < 6400 || version > 7700) {
    return threeStaticGeometryFailure(
      "format",
      "unsupported-fbx-version",
      `FBX binary version ${version} is outside the supported range.`,
    );
  }
  const state: FbxBinaryPreflightState = {
    arrayBytes: 0,
    nodeCount: 0,
    vertexCoordinates: 0,
  };
  let cursor = 27;
  const nullLength = version >= 7500 ? 25 : 13;
  while (cursor + nullLength <= bytes.byteLength) {
    throwIfThreeStaticGeometryAborted(context.signal);
    if (isFbxNullRecord(bytes, cursor, nullLength)) break;
    cursor = parseNode(
      bytes,
      view,
      cursor,
      version,
      bytes.byteLength,
      state,
      context,
    );
  }
  if (state.vertexCoordinates === 0 || state.vertexCoordinates % 3 !== 0) {
    return threeStaticGeometryFailure(
      "geometry",
      "invalid-fbx-vertices",
      "FBX requires complete nonempty XYZ vertex coordinates.",
    );
  }
  checkedThreeStaticGeometryTotal(
    0,
    source.byteLength * 4 + state.arrayBytes * 8,
    context.limits.maxEstimatedWorkerBytes,
    "estimated-worker-memory-limit-exceeded",
    "FBX preflight worker memory",
  );
}
