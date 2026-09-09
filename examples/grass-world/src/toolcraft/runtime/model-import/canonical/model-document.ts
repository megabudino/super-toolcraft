import type { ToolcraftModelFormat } from "../../schema/types";

export type ToolcraftModelBounds = {
  max: readonly [number, number, number];
  min: readonly [number, number, number];
};

export type ToolcraftModelCanonicalizationOperation =
  | "deterministic-triangulation"
  | "sequential-indexing";

export type ToolcraftModelRepairOperationType =
  | "compact-unused-vertices"
  | "recalculate-bounds"
  | "regenerate-normals"
  | "remove-duplicate-triangles"
  | "remove-invalid-triangles"
  | "repair-local-winding";

export type ToolcraftModelCanonicalizationProvenance = {
  adapterVersion: string;
  canonicalSchemaVersion: 1;
  operations: readonly ToolcraftModelCanonicalizationOperation[];
  repair?: {
    algorithmVersion: string;
    operations: readonly ToolcraftModelRepairOperationType[];
    planDigest: string;
    recipeId: string;
  };
  sourceFormat: ToolcraftModelFormat;
};

export type ToolcraftModelNode = {
  children: readonly string[];
  id: string;
  localMatrix: readonly [
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
    number, number, number, number,
  ];
  name: string;
  primitiveIds: readonly string[];
};

export type ToolcraftModelPrimitive = {
  bounds: ToolcraftModelBounds;
  id: string;
  indices: Uint32Array;
  normals?: Float32Array;
  positions: Float32Array;
};

export type ToolcraftModelDocument = {
  bounds: ToolcraftModelBounds;
  nodes: readonly ToolcraftModelNode[];
  primitives: readonly ToolcraftModelPrimitive[];
  provenance: ToolcraftModelCanonicalizationProvenance;
  rootNodeIds: readonly string[];
  version: 1;
};

