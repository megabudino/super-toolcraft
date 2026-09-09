import type {
  ToolcraftModelDocument,
  ToolcraftModelNode,
  ToolcraftModelPrimitive,
} from "./model-document";
import type { ModelDocumentMetadata } from "./model-document-codec-metadata";
import type { ModelDocumentSections } from "./model-document-codec-format";
import { throwModelDocumentCodecError } from "./model-document-codec-error";

function encodeFloat32Values(values: readonly Float32Array[]): Uint8Array {
  const componentCount = values.reduce((total, value) => total + value.length, 0);
  const bytes = new Uint8Array(componentCount * 4);
  const view = new DataView(bytes.buffer);
  let componentOffset = 0;

  for (const value of values) {
    for (let index = 0; index < value.length; index += 1) {
      view.setFloat32(componentOffset * 4, value[index]!, true);
      componentOffset += 1;
    }
  }

  return bytes;
}

function encodeUint32Values(values: readonly Uint32Array[]): Uint8Array {
  const componentCount = values.reduce((total, value) => total + value.length, 0);
  const bytes = new Uint8Array(componentCount * 4);
  const view = new DataView(bytes.buffer);
  let componentOffset = 0;

  for (const value of values) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint32(componentOffset * 4, value[index]!, true);
      componentOffset += 1;
    }
  }

  return bytes;
}

export function encodeModelDocumentPayloads(
  document: ToolcraftModelDocument,
  metadataBytes: Uint8Array,
): ModelDocumentSections {
  return {
    1: metadataBytes,
    2: encodeFloat32Values(
      document.primitives.map((primitive) => primitive.positions),
    ),
    3: encodeFloat32Values(
      document.primitives.flatMap((primitive) =>
        primitive.normals === undefined ? [] : [primitive.normals],
      ),
    ),
    4: encodeUint32Values(
      document.primitives.map((primitive) => primitive.indices),
    ),
  };
}

function decodeFloat32Slice(
  bytes: Uint8Array,
  offset: number,
  count: number,
): Float32Array {
  const values = new Float32Array(count);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let index = 0; index < count; index += 1) {
    values[index] = view.getFloat32((offset + index) * 4, true);
  }
  return values;
}

function decodeUint32Slice(
  bytes: Uint8Array,
  offset: number,
  count: number,
): Uint32Array {
  const values = new Uint32Array(count);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let index = 0; index < count; index += 1) {
    values[index] = view.getUint32((offset + index) * 4, true);
  }
  return values;
}

function copyLocalMatrix(
  values: readonly number[],
): ToolcraftModelNode["localMatrix"] {
  if (values.length !== 16) {
    throwModelDocumentCodecError(
      "invalid-metadata-shape",
      "nodes.localMatrix",
      "Canonical node localMatrix must contain exactly 16 values.",
    );
  }
  return [
    values[0]!, values[1]!, values[2]!, values[3]!,
    values[4]!, values[5]!, values[6]!, values[7]!,
    values[8]!, values[9]!, values[10]!, values[11]!,
    values[12]!, values[13]!, values[14]!, values[15]!,
  ];
}

export function decodeModelDocumentPayloads(
  metadata: ModelDocumentMetadata,
  sections: ModelDocumentSections,
): ToolcraftModelDocument {
  const primitives: ToolcraftModelPrimitive[] = metadata.primitives.map(
    (primitive) => ({
      bounds: {
        max: [...primitive.bounds.max],
        min: [...primitive.bounds.min],
      },
      id: primitive.id,
      indices: decodeUint32Slice(
        sections[4],
        primitive.indices.offset,
        primitive.indices.count,
      ),
      ...(primitive.normals === null
        ? {}
        : {
            normals: decodeFloat32Slice(
              sections[3],
              primitive.normals.offset,
              primitive.normals.count,
            ),
          }),
      positions: decodeFloat32Slice(
        sections[2],
        primitive.positions.offset,
        primitive.positions.count,
      ),
    }),
  );
  const nodes = metadata.nodes.map(
    (node): ToolcraftModelNode => ({
      children: [...node.children],
      id: node.id,
      localMatrix: copyLocalMatrix(node.localMatrix),
      name: node.name,
      primitiveIds: [...node.primitiveIds],
    }),
  );
  const repair = metadata.provenance.repair;

  return {
    bounds: {
      max: [...metadata.bounds.max],
      min: [...metadata.bounds.min],
    },
    nodes,
    primitives,
    provenance: {
      adapterVersion: metadata.provenance.adapterVersion,
      canonicalSchemaVersion: metadata.provenance.canonicalSchemaVersion,
      operations: [...metadata.provenance.operations],
      ...(repair === undefined
        ? {}
        : {
            repair: {
              algorithmVersion: repair.algorithmVersion,
              operations: [...repair.operations],
              planDigest: repair.planDigest,
              recipeId: repair.recipeId,
            },
          }),
      sourceFormat: metadata.provenance.sourceFormat,
    },
    rootNodeIds: [...metadata.rootNodeIds],
    version: metadata.version,
  };
}
