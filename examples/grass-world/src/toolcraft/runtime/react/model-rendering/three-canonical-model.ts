import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Sphere,
  Vector3,
} from "three";

import type {
  ToolcraftModelDocument,
  ToolcraftModelPrimitive,
} from "../../model-import/canonical/model-document";

export type ToolcraftCanonicalThreeModel = Readonly<{
  geometries: readonly BufferGeometry[];
  materials: readonly MeshStandardMaterial[];
  modelRoot: Group;
  nodeObjects: ReadonlyMap<string, Group>;
}>;

export function createToolcraftThreePrewarmDocument(): ToolcraftModelDocument {
  const bounds = { max: [1, 1, 0], min: [-1, -1, 0] } as const;
  return {
    bounds,
    nodes: [{
      children: [],
      id: "toolcraft-prewarm-node",
      localMatrix: [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
      ],
      name: "Toolcraft renderer prewarm",
      primitiveIds: ["toolcraft-prewarm-primitive"],
    }],
    primitives: [{
      bounds,
      id: "toolcraft-prewarm-primitive",
      indices: new Uint32Array([0, 1, 2]),
      normals: new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
      ]),
      positions: new Float32Array([
        -1, -1, 0,
        1, -1, 0,
        0, 1, 0,
      ]),
    }],
    provenance: {
      adapterVersion: "toolcraft-render-prewarm@1",
      canonicalSchemaVersion: 1,
      operations: ["deterministic-triangulation", "sequential-indexing"],
      sourceFormat: "glb",
    },
    rootNodeIds: ["toolcraft-prewarm-node"],
    version: 1,
  };
}

function createRenderGeometryArrays(
  primitive: ToolcraftModelPrimitive,
): Readonly<{
  indices: Uint32Array;
  normals?: Float32Array;
  positions: Float32Array;
}> {
  const vertexCount = primitive.positions.length / 3;
  const referenced = new Uint8Array(vertexCount);
  let referencedCount = 0;
  for (const vertexIndex of primitive.indices) {
    if (referenced[vertexIndex] === 0) {
      referenced[vertexIndex] = 1;
      referencedCount += 1;
    }
  }
  if (referencedCount === vertexCount) {
    return {
      indices: new Uint32Array(primitive.indices),
      ...(primitive.normals
        ? { normals: new Float32Array(primitive.normals) }
        : {}),
      positions: new Float32Array(primitive.positions),
    };
  }

  const remap = new Uint32Array(vertexCount);
  const positions = new Float32Array(referencedCount * 3);
  const normals = primitive.normals
    ? new Float32Array(referencedCount * 3)
    : undefined;
  let targetVertex = 0;
  for (let sourceVertex = 0; sourceVertex < vertexCount; sourceVertex += 1) {
    if (referenced[sourceVertex] === 0) continue;
    remap[sourceVertex] = targetVertex;
    positions.set(
      primitive.positions.subarray(sourceVertex * 3, sourceVertex * 3 + 3),
      targetVertex * 3,
    );
    if (normals && primitive.normals) {
      normals.set(
        primitive.normals.subarray(sourceVertex * 3, sourceVertex * 3 + 3),
        targetVertex * 3,
      );
    }
    targetVertex += 1;
  }
  const indices = new Uint32Array(primitive.indices.length);
  for (let index = 0; index < primitive.indices.length; index += 1) {
    indices[index] = remap[primitive.indices[index]!]!;
  }
  return { indices, ...(normals ? { normals } : {}), positions };
}

function createGeometryFromRenderArrays(
  renderArrays: ReturnType<typeof createRenderGeometryArrays>,
  bounds: ToolcraftModelPrimitive["bounds"],
): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(renderArrays.positions, 3),
  );
  geometry.setIndex(new BufferAttribute(renderArrays.indices, 1));
  if (renderArrays.normals) {
    geometry.setAttribute(
      "normal",
      new BufferAttribute(renderArrays.normals, 3),
    );
  } else {
    geometry.computeVertexNormals();
  }
  geometry.boundingBox = new Box3(
    new Vector3(...bounds.min),
    new Vector3(...bounds.max),
  );
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(
    new Sphere(),
  );
  return geometry;
}

function createGeometry(primitive: ToolcraftModelPrimitive): BufferGeometry {
  return createGeometryFromRenderArrays(
    createRenderGeometryArrays(primitive),
    primitive.bounds,
  );
}

function createMergedNodeGeometry(
  primitives: readonly ToolcraftModelPrimitive[],
): BufferGeometry {
  const parts = primitives.map(createRenderGeometryArrays);
  const vertexCount = parts.reduce(
    (total, part) => total + part.positions.length / 3,
    0,
  );
  const indexCount = parts.reduce(
    (total, part) => total + part.indices.length,
    0,
  );
  const positions = new Float32Array(vertexCount * 3);
  const hasCompleteNormals = parts.every(({ normals }) => normals !== undefined);
  const normals = hasCompleteNormals
    ? new Float32Array(vertexCount * 3)
    : undefined;
  const indices = new Uint32Array(indexCount);
  let indexOffset = 0;
  let vertexOffset = 0;

  for (const part of parts) {
    positions.set(part.positions, vertexOffset * 3);
    if (normals && part.normals) {
      normals.set(part.normals, vertexOffset * 3);
    }
    for (let index = 0; index < part.indices.length; index += 1) {
      indices[indexOffset + index] = part.indices[index]! + vertexOffset;
    }
    indexOffset += part.indices.length;
    vertexOffset += part.positions.length / 3;
  }

  const bounds = primitives.reduce(
    (merged, primitive) => ({
      max: [
        Math.max(merged.max[0], primitive.bounds.max[0]),
        Math.max(merged.max[1], primitive.bounds.max[1]),
        Math.max(merged.max[2], primitive.bounds.max[2]),
      ] as const,
      min: [
        Math.min(merged.min[0], primitive.bounds.min[0]),
        Math.min(merged.min[1], primitive.bounds.min[1]),
        Math.min(merged.min[2], primitive.bounds.min[2]),
      ] as const,
    }),
    primitives[0]!.bounds,
  );
  return createGeometryFromRenderArrays(
    { indices, ...(normals ? { normals } : {}), positions },
    bounds,
  );
}

function hashTypedArrayBytes(value: Uint32Array | Float32Array): number {
  const bytes = new Uint8Array(
    value.buffer,
    value.byteOffset,
    value.byteLength,
  );
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function areTypedArraysEqual(
  left: Uint32Array | Float32Array | undefined,
  right: Uint32Array | Float32Array | undefined,
): boolean {
  if (left === undefined || right === undefined) return left === right;
  return left.length === right.length &&
    left.every((value, index) => Object.is(value, right[index]));
}

function areRenderEquivalentPrimitives(
  left: ToolcraftModelPrimitive,
  right: ToolcraftModelPrimitive,
): boolean {
  return areTypedArraysEqual(left.indices, right.indices) &&
    areTypedArraysEqual(left.normals, right.normals) &&
    areTypedArraysEqual(left.positions, right.positions);
}

function deduplicateRenderEquivalentPrimitives(
  primitives: readonly ToolcraftModelPrimitive[],
): readonly ToolcraftModelPrimitive[] {
  const candidatesByFingerprint = new Map<string, ToolcraftModelPrimitive[]>();
  const unique: ToolcraftModelPrimitive[] = [];
  for (const primitive of primitives) {
    const fingerprint = [
      primitive.indices.length,
      hashTypedArrayBytes(primitive.indices),
      primitive.normals?.length ?? 0,
      primitive.normals ? hashTypedArrayBytes(primitive.normals) : 0,
      primitive.positions.length,
      hashTypedArrayBytes(primitive.positions),
    ].join(":");
    const candidates = candidatesByFingerprint.get(fingerprint) ?? [];
    if (candidates.some((candidate) =>
      areRenderEquivalentPrimitives(candidate, primitive)
    )) {
      continue;
    }
    candidates.push(primitive);
    candidatesByFingerprint.set(fingerprint, candidates);
    unique.push(primitive);
  }
  return unique;
}

function collectRenderableNodeIds(
  document: ToolcraftModelDocument,
): ReadonlySet<string> {
  const nodeIds = new Set(document.nodes.map(({ id }) => id));
  const parentByChild = new Map<string, string>();

  for (const node of document.nodes) {
    for (const childId of node.children) {
      if (!nodeIds.has(childId)) {
        throw new Error(`Canonical model child node \"${childId}\" is unavailable.`);
      }
      parentByChild.set(childId, node.id);
    }
  }
  for (const rootNodeId of document.rootNodeIds) {
    if (!nodeIds.has(rootNodeId)) {
      throw new Error(`Canonical model root node \"${rootNodeId}\" is unavailable.`);
    }
  }

  const renderable = new Set(
    document.nodes
      .filter(({ primitiveIds }) => primitiveIds.length > 0)
      .map(({ id }) => id),
  );
  const pending = [...renderable];
  for (let index = 0; index < pending.length; index += 1) {
    const parentId = parentByChild.get(pending[index]!);
    if (parentId && !renderable.has(parentId)) {
      renderable.add(parentId);
      pending.push(parentId);
    }
  }
  return renderable;
}

export function buildToolcraftCanonicalThreeModel(
  document: ToolcraftModelDocument,
  createMaterial: (
    primitive: ToolcraftModelPrimitive,
  ) => MeshStandardMaterial,
  mergeNodePrimitives: boolean,
): ToolcraftCanonicalThreeModel {
  const geometries: BufferGeometry[] = [];
  const materials: MeshStandardMaterial[] = [];
  const renderableNodeIds = collectRenderableNodeIds(document);
  const primitiveById = new Map(
    document.primitives.map((primitive) => [primitive.id, primitive]),
  );
  const nodeObjects = new Map<string, Group>();
  for (const node of document.nodes) {
    if (!renderableNodeIds.has(node.id)) continue;
    const object = new Group();
    object.name = node.name;
    object.matrixAutoUpdate = false;
    object.matrix.fromArray(node.localMatrix);
    const nodePrimitives = node.primitiveIds.map((primitiveId) => {
      const primitive = primitiveById.get(primitiveId);
      if (!primitive) {
        throw new Error(`Canonical model primitive \"${primitiveId}\" is unavailable.`);
      }
      return primitive;
    });
    if (mergeNodePrimitives && nodePrimitives.length > 0) {
      const uniquePrimitives = deduplicateRenderEquivalentPrimitives(
        nodePrimitives,
      );
      const geometry = uniquePrimitives.length === 1
        ? createGeometry(uniquePrimitives[0]!)
        : createMergedNodeGeometry(uniquePrimitives);
      const material = materials[0] ?? createMaterial(uniquePrimitives[0]!);
      material.depthWrite = true;
      if (materials.length === 0) materials.push(material);
      geometries.push(geometry);
      const mesh = new Mesh(geometry, material);
      mesh.name = uniquePrimitives.length === 1
        ? uniquePrimitives[0]!.id
        : `${node.id}:merged-primitives`;
      object.add(mesh);
    } else {
      for (const primitive of nodePrimitives) {
        const geometry = createGeometry(primitive);
        const material = createMaterial(primitive);
        material.depthWrite = true;
        geometries.push(geometry);
        materials.push(material);
        const mesh = new Mesh(geometry, material);
        mesh.name = primitive.id;
        object.add(mesh);
      }
    }
    nodeObjects.set(node.id, object);
  }

  for (const node of document.nodes) {
    const object = nodeObjects.get(node.id);
    if (!object) continue;
    for (const childId of node.children) {
      const child = nodeObjects.get(childId);
      if (child) object.add(child);
    }
  }

  const modelRoot = new Group();
  modelRoot.name = "Toolcraft canonical model";
  for (const rootNodeId of document.rootNodeIds) {
    const root = nodeObjects.get(rootNodeId);
    if (root) modelRoot.add(root);
  }

  return { geometries, materials, modelRoot, nodeObjects };
}

export function createToolcraftThreeModelScene(modelRoot: Group): {
  camera: PerspectiveCamera;
  fitRoot: Group;
  scene: Scene;
} {
  const scene = new Scene();
  const fitRoot = new Group();
  fitRoot.name = "Toolcraft source-preserving display fit";
  fitRoot.add(modelRoot);
  scene.add(fitRoot);
  scene.add(new HemisphereLight(0xffffff, 0x5b6470, 1.7));
  const keyLight = new DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);
  return {
    camera: new PerspectiveCamera(45, 1, 0.01, 1_000),
    fitRoot,
    scene,
  };
}

export function disposeToolcraftCanonicalThreeModel(
  model: Pick<
    ToolcraftCanonicalThreeModel,
    "geometries" | "materials" | "modelRoot"
  >,
): void {
  for (const geometry of model.geometries) geometry.dispose();
  for (const material of model.materials) material.dispose();
  model.modelRoot.clear();
}
