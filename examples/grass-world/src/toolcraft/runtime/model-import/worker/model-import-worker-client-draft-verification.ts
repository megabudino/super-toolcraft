import type { ToolcraftModelWorkerResponse } from "./model-import-worker-protocol";
import { createToolcraftModelWorkerDraftReceiptFrame } from "./model-import-worker-receipt";
import type { ToolcraftModelWorkerAsyncSha256 } from "./model-import-worker-result-verification";

type DraftResponse = Extract<ToolcraftModelWorkerResponse, { kind: "draft" }>;

export type ToolcraftModelWorkerDraftVerificationOutcome =
  | "invalid"
  | "stale"
  | "verified";

export async function verifyToolcraftModelWorkerDraft(
  response: DraftResponse,
  sha256: ToolcraftModelWorkerAsyncSha256,
  isCurrent: () => boolean,
): Promise<ToolcraftModelWorkerDraftVerificationOutcome> {
  try {
    const canonicalDigest = await sha256(response.draft.canonicalDocument);
    if (!isCurrent()) return "stale";
    if (canonicalDigest !== response.draft.canonicalDocumentDigest) return "invalid";

    const receiptDigest = await sha256(createToolcraftModelWorkerDraftReceiptFrame({
      draft: response.draft,
      generation: response.generation,
      jobId: response.jobId,
    }));
    if (!isCurrent()) return "stale";
    return receiptDigest === response.draft.receiptDigest
      ? "verified"
      : "invalid";
  } catch {
    return isCurrent() ? "invalid" : "stale";
  }
}
