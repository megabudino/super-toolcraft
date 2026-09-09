import type { ToolcraftModelWorkerResponse } from "./model-import-worker-protocol";
import type { ToolcraftModelWorkerValidationContext } from "./model-import-worker-protocol-validation";
import { createToolcraftModelWorkerReceiptFrame } from "./model-import-worker-receipt";
import type { ToolcraftModelWorkerAsyncSha256 } from "./model-import-worker-result-verification";

type ResultResponse = Extract<ToolcraftModelWorkerResponse, { kind: "result" }>;

export type ToolcraftModelWorkerResultVerificationOutcome =
  | "invalid"
  | "stale"
  | "verified";

export async function verifyToolcraftModelWorkerResult(
  response: ResultResponse,
  context: ToolcraftModelWorkerValidationContext,
  sha256: ToolcraftModelWorkerAsyncSha256,
  isCurrent: () => boolean,
): Promise<ToolcraftModelWorkerResultVerificationOutcome> {
  try {
    // The trusted worker owns semantic decoding. Main authenticates each opaque
    // transfer independently and hashes only the bounded receipt projection.
    const canonicalDigest = await sha256(response.result.canonicalDocument);
    if (!isCurrent()) return "stale";
    if (canonicalDigest !== response.result.canonicalDocumentDigest) return "invalid";

    if (response.result.operation === "decode-and-analyze" &&
        response.result.repairPlanEnvelope !== undefined) {
      const envelope = response.result.repairPlanEnvelope;
      const envelopeDigest = await sha256(envelope.bytes);
      if (!isCurrent()) return "stale";
      if (envelopeDigest !== envelope.envelopeDigest) return "invalid";
    }

    const receiptFrame = createToolcraftModelWorkerReceiptFrame({
      generation: response.generation,
      jobId: response.jobId,
      ...(context.expectedRepairPlanEnvelope === undefined
        ? {}
        : { repairPlanEnvelope: context.expectedRepairPlanEnvelope }),
      result: response.result,
    });
    const receiptDigest = await sha256(receiptFrame);
    if (!isCurrent()) return "stale";
    return receiptDigest === response.result.receiptDigest
      ? "verified"
      : "invalid";
  } catch {
    return isCurrent() ? "invalid" : "stale";
  }
}
