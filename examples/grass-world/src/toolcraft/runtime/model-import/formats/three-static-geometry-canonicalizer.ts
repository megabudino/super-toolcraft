import {
  BufferGeometry,
  type Object3D,
} from "three";

import type { ToolcraftSourceAssetFeedback } from "../../source-assets/source-asset-types";
import type {
  ToolcraftModelBounds,
  ToolcraftModelCanonicalizationOperation,
  ToolcraftModelDocument,
} from "../canonical/model-document";
import {
  getValidatedToolcraftModelDocumentSnapshot,
  ToolcraftModelDocumentValidationError,
} from "../canonical/model-document-validation";
import type {
  ToolcraftModelDecodeContext,
  ToolcraftModelDecodeResult,
} from "../model-import-types";
import {
  checkedThreeStaticGeometryTotal,
  copyThreeStaticGeometryPrimitive,
  getThreeStaticGeometryAttributeArray,
  getThreeStaticGeometryLocalMatrix,
  threeStaticGeometryFailure,
  throwIfThreeStaticGeometryAborted,
  type ThreeStaticGeometryFormat,
  type ThreeStaticGeometryPrimitivePlan,
  validateThreeStaticGeometryLimits,
} from "./obj-stl-ply-model-format-adapter-support";

type CanonicalizationOptions = Readonly<{
  adapterVersion: string;
  limits: ToolcraftModelDecodeContext["limits"];
  operations?: readonly ToolcraftModelCanonicalizationOperation[];
  signal: AbortSignal;
  sourceByteLength: number;
  sourceFormat: ThreeStaticGeometryFormat;
}>;
type GeometryPlan = ThreeStaticGeometryPrimitivePlan & Readonly<{
  geometry: BufferGeometry;
}>;

function checkpoint(signal: AbortSignal, index: number): void {
  if ((index & 255) === 0) throwIfThreeStaticGeometryAborted(signal);
}

function collectObjectNodes(
  root: Object3D,
  options: CanonicalizationOptions,
): readonly Object3D[] {
  const nodes: Object3D[] = [];
  const seen = new Set<Object3D>();
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop()!;
    checkpoint(options.signal, nodes.length);
    if (seen.has(node)) {
      return threeStaticGeometryFailure(
        "geometry",
        "invalid-object-hierarchy",
        "The decoded Three object hierarchy contains a repeated node.",
      );
    }
    seen.add(node);
    nodes.push(node);
    if (nodes.length > options.limits.maxNodes) {
      return threeStaticGeometryFailure(
        "resource-limit",
        "max-nodes-exceeded",
        `Canonical hierarchy exceeds maxNodes ${options.limits.maxNodes}.`,
      );
    }
    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      stack.push(node.children[index]!);
    }
  }
  return nodes;
}

function resourceCategory(code: string): ToolcraftSourceAssetFeedback["category"] {
  return code.startsWith("max-") || code.startsWith("estimated-") ||
      code.startsWith("decoded-") || code === "invalid-limit-options"
    ? "resource-limit"
    : "geometry";
}

export function canonicalizeThreeStaticGeometry(
  input: Object3D | BufferGeometry,
  options: CanonicalizationOptions,
): ToolcraftModelDecodeResult {
  throwIfThreeStaticGeometryAborted(options.signal);
  validateThreeStaticGeometryLimits(options.limits);
  const directGeometry = input instanceof BufferGeometry ? input : undefined;
  const sourceNodes = directGeometry ? [] : collectObjectNodes(input as Object3D, options);
  const geometryByNode = new Map<Object3D, BufferGeometry>();
  if (!directGeometry) {
    for (const node of sourceNodes) {
      if ((node as Object3D & { isMesh?: boolean }).isMesh !== true) continue;
      const geometry = (node as Object3D & { geometry?: unknown }).geometry;
      if (!(geometry instanceof BufferGeometry)) {
        return threeStaticGeometryFailure(
          "geometry",
          "invalid-buffer-geometry",
          "A decoded mesh does not expose BufferGeometry.",
        );
      }
      geometryByNode.set(node, geometry);
    }
  }

  const geometries = directGeometry
    ? [directGeometry]
    : [...new Set(geometryByNode.values())];
  if (geometries.length === 0) {
    return threeStaticGeometryFailure(
      "geometry",
      "no-renderable-static-geometry",
      "The source contains no static triangle geometry.",
    );
  }
  if (geometries.length > options.limits.maxPrimitives) {
    return threeStaticGeometryFailure(
      "resource-limit",
      "max-primitives-exceeded",
      `Canonical geometry exceeds maxPrimitives ${options.limits.maxPrimitives}.`,
    );
  }

  const plans: GeometryPlan[] = [];
  const loadedBuffers = new Set<ArrayBufferLike>();
  let canonicalBytes = 0;
  let triangles = 0;
  let vertices = 0;
  for (const geometry of geometries) {
    throwIfThreeStaticGeometryAborted(options.signal);
    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");
    const index = geometry.getIndex();
    if (!position || position.itemSize !== 3 || !Number.isSafeInteger(position.count) || position.count <= 0) {
      return threeStaticGeometryFailure(
        "geometry",
        "invalid-position-attribute",
        "Every decoded primitive requires nonempty XYZ position data.",
      );
    }
    if (normal && (normal.itemSize !== 3 || normal.count !== position.count)) {
      return threeStaticGeometryFailure(
        "geometry",
        "normal-count-mismatch",
        "Decoded normals must match the XYZ position count.",
      );
    }
    const indexCount = index?.count ?? position.count;
    if (!Number.isSafeInteger(indexCount) || indexCount <= 0 || indexCount % 3 !== 0) {
      return threeStaticGeometryFailure(
        "geometry",
        "invalid-triangle-cardinality",
        "Decoded primitives must contain complete triangle triples.",
      );
    }
    vertices = checkedThreeStaticGeometryTotal(
      vertices,
      position.count,
      options.limits.maxVertices,
      "max-vertices-exceeded",
      "Canonical vertices",
    );
    triangles = checkedThreeStaticGeometryTotal(
      triangles,
      indexCount / 3,
      options.limits.maxTriangles,
      "max-triangles-exceeded",
      "Canonical triangles",
    );
    const primitiveBytes = position.count * (normal ? 24 : 12) + indexCount * 4;
    canonicalBytes = checkedThreeStaticGeometryTotal(
      canonicalBytes,
      primitiveBytes,
      options.limits.maxDecodedBytes,
      "decoded-byte-limit-exceeded",
      "Canonical geometry bytes",
    );
    for (const attribute of [...Object.values(geometry.attributes), index]) {
      if (!attribute) continue;
      loadedBuffers.add(getThreeStaticGeometryAttributeArray(attribute).buffer);
    }
    plans.push({
      geometry,
      index,
      ...(normal ? { normal } : {}),
      position,
      primitiveId: `primitive:${plans.length}`,
    });
  }

  let loadedBytes = 0;
  for (const buffer of loadedBuffers) {
    loadedBytes = checkedThreeStaticGeometryTotal(
      loadedBytes,
      buffer.byteLength,
      options.limits.maxEstimatedWorkerBytes,
      "estimated-worker-memory-limit-exceeded",
      "Decoded Three geometry memory",
    );
  }
  const nodeCount = directGeometry ? 1 : sourceNodes.length;
  const estimatedPeak = options.sourceByteLength * 4 + loadedBytes + canonicalBytes * 2 +
    nodeCount * 256 + plans.length * 192;
  checkedThreeStaticGeometryTotal(
    0,
    estimatedPeak,
    options.limits.maxEstimatedWorkerBytes,
    "estimated-worker-memory-limit-exceeded",
    "Static geometry worker memory",
  );

  const primitives = plans.map((plan) =>
    copyThreeStaticGeometryPrimitive(plan, options.signal)
  );
  const primitiveIds = new Map(plans.map((plan) => [plan.geometry, plan.primitiveId]));
  const nodeIds = new Map(sourceNodes.map((node, index) => [node, `node:${index}`]));
  const nodes: ToolcraftModelDocument["nodes"] = directGeometry
    ? [{
        children: [],
        id: "node:0",
        localMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        name: "",
        primitiveIds: ["primitive:0"],
      }]
    : sourceNodes.map((node) => ({
        children: node.children.map((child) => nodeIds.get(child)!),
        id: nodeIds.get(node)!,
        localMatrix: getThreeStaticGeometryLocalMatrix(node),
        name: node.name,
        primitiveIds: geometryByNode.has(node)
          ? [primitiveIds.get(geometryByNode.get(node)!)!]
          : [],
      }));
  const operations = [...(options.operations ?? [])];
  if (plans.some(({ index }) => index === null)) {
    operations.push("sequential-indexing");
  }
  const document: ToolcraftModelDocument = {
    bounds: primitives.reduce<ToolcraftModelBounds>(
      (bounds, primitive) => ({
        max: bounds.max.map((value, axis) =>
          Math.max(value, primitive.bounds.max[axis]!)) as [number, number, number],
        min: bounds.min.map((value, axis) =>
          Math.min(value, primitive.bounds.min[axis]!)) as [number, number, number],
      }),
      primitives[0]!.bounds,
    ),
    nodes,
    primitives,
    provenance: {
      adapterVersion: options.adapterVersion,
      canonicalSchemaVersion: 1,
      operations,
      sourceFormat: options.sourceFormat,
    },
    rootNodeIds: ["node:0"],
    version: 1,
  };

  throwIfThreeStaticGeometryAborted(options.signal);
  try {
    return {
      diagnostics: [],
      document: getValidatedToolcraftModelDocumentSnapshot(document, options.limits),
    };
  } catch (error) {
    if (error instanceof ToolcraftModelDocumentValidationError) {
      return threeStaticGeometryFailure(
        resourceCategory(error.code),
        error.code,
        error.message,
      );
    }
    throw error;
  }
}
