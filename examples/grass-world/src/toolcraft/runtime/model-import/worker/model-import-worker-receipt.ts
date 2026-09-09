import { bytesToHex, sha256 } from "../canonical/sha256";
import type { ToolcraftModelWorkerAnalysisSummary } from "../model-import-types";
import type {
  ToolcraftModelDecodeAnalyzeWorkerResult,
  ToolcraftModelRepairWorkerResult,
  ToolcraftModelWorkerDraft,
} from "./model-import-worker-protocol";

const RECEIPT_VERSION = 1;
const RECEIPT_PREFIX = "toolcraft-model-worker-result-receipt@1";
const DRAFT_RECEIPT_PREFIX = "toolcraft-model-worker-draft-receipt@1";
export const TOOLCRAFT_MODEL_WORKER_RECEIPT_MAX_BYTES = 8 * 1024 * 1024;
const encoder = new TextEncoder();

type DecodeResultWithoutReceipt = Omit<
  ToolcraftModelDecodeAnalyzeWorkerResult,
  "receiptDigest"
>;
type RepairResultWithoutReceipt = Omit<
  ToolcraftModelRepairWorkerResult,
  "receiptDigest"
>;

export type ToolcraftModelWorkerReceiptInput = Readonly<{
  generation: number;
  jobId: string;
  repairPlanEnvelope?: Readonly<{
    byteLength: number;
    envelopeDigest: string;
    planDigest: string;
    version: 1;
  }>;
  result: DecodeResultWithoutReceipt | RepairResultWithoutReceipt;
}>;

export type ToolcraftModelWorkerDraftReceiptInput = Readonly<{
  draft: Omit<ToolcraftModelWorkerDraft, "receiptDigest">;
  generation: number;
  jobId: string;
}>;

function normalizedAnalysis(analysis: ToolcraftModelWorkerAnalysisSummary) {
  // Trust boundary: this fixed projection is intentionally the only metadata
  // admitted to a receipt. It never enumerates or stringifies a repair plan.
  return {
    analyzerVersion: analysis.analyzerVersion,
    diagnostics: analysis.diagnostics.map((diagnostic) => ({
      affectedCount: diagnostic.affectedCount,
      code: diagnostic.code,
      explanation: diagnostic.explanation,
      primitiveId: diagnostic.primitiveId ?? null,
      primitiveIndex: diagnostic.primitiveIndex ?? null,
      severity: diagnostic.severity,
    })),
    limits: {
      maxBundleFiles: analysis.limits.maxBundleFiles,
      maxDecodedBytes: analysis.limits.maxDecodedBytes,
      maxEstimatedWorkerBytes: analysis.limits.maxEstimatedWorkerBytes,
      maxNodes: analysis.limits.maxNodes,
      maxPrimitives: analysis.limits.maxPrimitives,
      maxSourceBytes: analysis.limits.maxSourceBytes,
      maxTriangles: analysis.limits.maxTriangles,
      maxVertices: analysis.limits.maxVertices,
    },
    outcome: analysis.outcome,
    profile: analysis.profile,
    statistics: {
      boundaryEdgeCount: analysis.statistics.boundaryEdgeCount,
      componentCount: analysis.statistics.componentCount,
      decodedBytes: analysis.statistics.decodedBytes,
      edgeCount: analysis.statistics.edgeCount,
      estimatedPeakWorkerBytes: analysis.statistics.estimatedPeakWorkerBytes,
      estimatedRepairBytes: analysis.statistics.estimatedRepairBytes,
      nodeCount: analysis.statistics.nodeCount,
      nonManifoldEdgeCount: analysis.statistics.nonManifoldEdgeCount,
      nonManifoldVertexCount: analysis.statistics.nonManifoldVertexCount,
      primitiveCount: analysis.statistics.primitiveCount,
      triangleCount: analysis.statistics.triangleCount,
      unusedVertexCount: analysis.statistics.unusedVertexCount,
      vertexCount: analysis.statistics.vertexCount,
    },
  };
}

function envelopeFor(
  input: ToolcraftModelWorkerReceiptInput,
): ToolcraftModelWorkerReceiptInput["repairPlanEnvelope"] {
  const envelope = input.result.operation === "decode-and-analyze"
    ? input.result.repairPlanEnvelope
    : undefined;
  return envelope === undefined ? input.repairPlanEnvelope : {
    byteLength: envelope.bytes.byteLength,
    envelopeDigest: envelope.envelopeDigest,
    planDigest: envelope.planDigest,
    version: envelope.version,
  };
}

export function createToolcraftModelWorkerReceiptFrame(
  input: ToolcraftModelWorkerReceiptInput,
): Uint8Array<ArrayBuffer> {
  const envelope = envelopeFor(input);
  const planDigest = input.result.operation === "repair"
    ? input.result.repairPlanDigest
    : envelope?.planDigest ?? null;
  const metadata = encoder.encode(JSON.stringify({
    analysis: normalizedAnalysis(input.result.analysis),
    canonicalDocument: {
      byteLength: input.result.canonicalDocument.byteLength,
      digest: input.result.canonicalDocumentDigest,
    },
    generation: input.generation,
    jobId: input.jobId,
    operation: input.result.operation,
    repairPlan: envelope === undefined
      ? { envelopeByteLength: 0, envelopeDigest: null, planDigest, version: null }
      : {
          envelopeByteLength: envelope.byteLength,
          envelopeDigest: envelope.envelopeDigest,
          planDigest,
          version: envelope.version,
        },
    version: RECEIPT_VERSION,
  }));
  const prefix = encoder.encode(RECEIPT_PREFIX);
  if (8 + prefix.byteLength + metadata.byteLength >
      TOOLCRAFT_MODEL_WORKER_RECEIPT_MAX_BYTES) {
    throw new Error("Model worker receipt metadata exceeds its protected limit.");
  }
  const frame = new Uint8Array(8 + prefix.byteLength + metadata.byteLength);
  const header = new DataView(frame.buffer);
  header.setUint32(0, prefix.byteLength, true);
  header.setUint32(4, metadata.byteLength, true);
  frame.set(prefix, 8);
  frame.set(metadata, 8 + prefix.byteLength);
  return frame;
}

export function createToolcraftModelWorkerDraftReceiptFrame(
  input: ToolcraftModelWorkerDraftReceiptInput,
): Uint8Array<ArrayBuffer> {
  const metadata = encoder.encode(JSON.stringify({
    canonicalDocument: {
      byteLength: input.draft.canonicalDocument.byteLength,
      digest: input.draft.canonicalDocumentDigest,
    },
    generation: input.generation,
    jobId: input.jobId,
    operation: "decode-draft",
    version: RECEIPT_VERSION,
  }));
  const prefix = encoder.encode(DRAFT_RECEIPT_PREFIX);
  if (8 + prefix.byteLength + metadata.byteLength >
      TOOLCRAFT_MODEL_WORKER_RECEIPT_MAX_BYTES) {
    throw new Error("Model worker draft receipt metadata exceeds its protected limit.");
  }
  const frame = new Uint8Array(8 + prefix.byteLength + metadata.byteLength);
  const header = new DataView(frame.buffer);
  header.setUint32(0, prefix.byteLength, true);
  header.setUint32(4, metadata.byteLength, true);
  frame.set(prefix, 8);
  frame.set(metadata, 8 + prefix.byteLength);
  return frame;
}

export function digestToolcraftModelWorkerBytes(
  value: ArrayBuffer | Uint8Array,
): string {
  const bytes = value instanceof Uint8Array
    ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    : new Uint8Array(value);
  return `sha256:${bytesToHex(sha256(bytes))}`;
}

export function createToolcraftModelWorkerReceiptDigest(
  input: ToolcraftModelWorkerReceiptInput,
): string {
  return digestToolcraftModelWorkerBytes(
    createToolcraftModelWorkerReceiptFrame(input),
  );
}

export function createToolcraftModelWorkerDraftReceiptDigest(
  input: ToolcraftModelWorkerDraftReceiptInput,
): string {
  return digestToolcraftModelWorkerBytes(
    createToolcraftModelWorkerDraftReceiptFrame(input),
  );
}
