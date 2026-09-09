import type {
  ToolcraftModelFormat,
  ToolcraftModelImportLimits,
  ToolcraftModelTopologyProfile,
} from "../schema/types";
import type { ToolcraftSourceAssetFeedback } from "../source-assets/source-asset-types";
import type { ToolcraftModelDocument } from "./canonical/model-document";

export type ToolcraftModelAssetLifecycle =
  | "clean"
  | "fixed"
  | "repairable"
  | "restoring"
  | "unavailable";

export type ToolcraftModelDiagnostic = {
  affectedCount: number;
  code: string;
  explanation: string;
  primitiveId?: string;
  severity: "fatal" | "info" | "repairable" | "warning";
};

export type ToolcraftModelAnalysisSummary = {
  boundaryEdges: number;
  diagnostics: readonly ToolcraftModelDiagnostic[];
  disconnectedComponents: number;
  nonManifoldEdges: number;
  outcome: "clean" | "fatal" | "repairable";
  repairPlanRef?: string;
  triangles: number;
  vertices: number;
};

export type ToolcraftModelTopologySeverity =
  | "fatal"
  | "info"
  | "repairable"
  | "warning";

export type ToolcraftModelTopologyDiagnosticCode =
  | "boundary-edges"
  | "diagnostics-truncated"
  | "disconnected-components"
  | "duplicate-triangles"
  | "empty-primitive"
  | "inconsistent-local-winding"
  | "indices-out-of-range"
  | "invalid-document-bounds"
  | "invalid-index-cardinality"
  | "invalid-index-data"
  | "invalid-position-cardinality"
  | "invalid-primitive-bounds"
  | "non-finite-positions"
  | "non-manifold-edges"
  | "non-manifold-vertices"
  | "non-orientable-component"
  | "no-renderable-triangles"
  | "normals-count-mismatch"
  | "normals-missing"
  | "normals-non-finite"
  | "normals-zero-length"
  | "repeated-index-triangles"
  | "resource-estimate"
  | "resource-limit-exceeded"
  | "unused-vertices"
  | "zero-area-triangles";

export type ToolcraftModelTopologyDiagnostic = Readonly<{
  affectedCount: number;
  code: ToolcraftModelTopologyDiagnosticCode;
  explanation: string;
  primitiveId?: string;
  primitiveIndex?: number;
  severity: ToolcraftModelTopologySeverity;
}>;

export type ToolcraftModelTopologyStatistics = Readonly<{
  boundaryEdgeCount: number;
  componentCount: number;
  decodedBytes: number;
  edgeCount: number;
  estimatedPeakWorkerBytes: number;
  estimatedRepairBytes: number;
  nodeCount: number;
  nonManifoldEdgeCount: number;
  nonManifoldVertexCount: number;
  primitiveCount: number;
  triangleCount: number;
  unusedVertexCount: number;
  vertexCount: number;
}>;

export type ToolcraftModelAnalysisOutcome =
  | "clean"
  | "fatal"
  | "repairable"
  | "warning";

export type ToolcraftModelWorkerAnalysisSummary = Readonly<{
  analyzerVersion: string;
  diagnostics: readonly ToolcraftModelTopologyDiagnostic[];
  limits: Readonly<ToolcraftModelImportLimits>;
  outcome: ToolcraftModelAnalysisOutcome;
  profile: ToolcraftModelTopologyProfile;
  statistics: ToolcraftModelTopologyStatistics;
}>;

export type ToolcraftModelAssetRecord = {
  activeDocumentRef: string;
  analysis: ToolcraftModelAnalysisSummary;
  appliedRepairRecipeId?: string;
  lastRepairError?: ToolcraftSourceAssetFeedback;
  lifecycle: ToolcraftModelAssetLifecycle;
  originalDocumentRef: string;
  originalAnalysis: ToolcraftModelAnalysisSummary;
  repairedDocumentRef?: string;
  sourceBundleDigest: string;
  sourceBundleRef: string;
  topologyProfile: ToolcraftModelTopologyProfile;
};

export type ToolcraftModelSourceFile = {
  byteLength: number;
  contentDigest: string;
  displayName: string;
  mimeType: string;
  path: string;
  resourceRef: string;
};

export type ToolcraftModelSourceBundle = {
  adapter: {
    adapterVersion: string;
    format: ToolcraftModelFormat;
    rootExtension: string;
  };
  aggregateByteLength: number;
  aggregateDigest: string;
  rootPath: string;
  sourceFiles: readonly ToolcraftModelSourceFile[];
};

export type ToolcraftModelSourceBundleTransfer = {
  aggregateDigest: string;
  rootPath: string;
  sourceFiles: readonly {
    bytes: ArrayBuffer;
    contentDigest: string;
    mimeType: string;
    path: string;
  }[];
};

export type ToolcraftModelDecodeContext = {
  bundle: ToolcraftModelSourceBundleTransfer;
  limits: ToolcraftModelImportLimits;
  signal: AbortSignal;
};

export type ToolcraftModelDecodeResult = {
  diagnostics: readonly ToolcraftModelDiagnostic[];
  document: ToolcraftModelDocument;
};

export type ToolcraftModelFormatAdapter = {
  adapterVersion: string;
  decode: (
    context: ToolcraftModelDecodeContext,
  ) => Promise<ToolcraftModelDecodeResult>;
  format: ToolcraftModelFormat;
  rootExtensions: readonly string[];
  workerCapable: true;
};
