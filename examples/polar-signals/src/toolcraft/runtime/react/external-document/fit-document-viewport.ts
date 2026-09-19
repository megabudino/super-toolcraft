import type { ToolcraftDocumentSession } from "../../modules/built-ins/external-site/document-port";

const intrinsicHeightError =
  "Automatic height is unavailable: this page's layout depends on viewport height or its intrinsic bounds could not be verified. Width and website controls remain available.";

/** Verify a measured content candidate without collapsing the live document to discover it. */
export async function fitDocumentViewport({
  width,
  height,
  manualHeight = null,
  measure,
  setHeight,
  isCurrent,
}: {
  width: number;
  height: number;
  manualHeight?: number | null;
  measure: ToolcraftDocumentSession["measureViewport"];
  setHeight(height: number): void;
  isCurrent(): boolean;
}): Promise<number> {
  async function read(at: number, observe = false) {
    if (!isCurrent()) throw new Error("Website viewport measurement was superseded.");
    setHeight(at);
    const result = await measure({ width, height: at, observe });
    if (!isCurrent()) throw new Error("Website viewport measurement was superseded.");
    return result;
  }
  const visibleHeight = manualHeight === null ? height : Math.min(height, manualHeight);
  let result = await read(visibleHeight, manualHeight !== null);
  if (manualHeight !== null && result.contentHeight > visibleHeight) return result.contentHeight;
  for (let attempt = 0; attempt < 3; attempt++) {
    const hint = result.intrinsicHeight;
    const candidate = hint !== undefined && Number.isSafeInteger(hint) && hint > 0 && hint <= result.contentHeight
      ? hint : result.contentHeight;
    // A DOM hint is never publication authority. Check both sides of the fit,
    // using a one-pixel lower sample instead of resetting the live frame to 1px.
    const lower = await read(candidate === 1 ? 2 : candidate - 1);
    const final = await read(candidate, manualHeight === null);
    if (lower.contentHeight === candidate && final.contentHeight === candidate) {
      if (manualHeight === null) return candidate;
      const observed = await read(Math.min(manualHeight, candidate), true);
      if (observed.contentHeight === candidate) return candidate;
      result = observed;
    } else {
      // A viewport floor without a usable intrinsic hint cannot be solved safely
      // by repeatedly shrinking the visible page. Preserve it and report why.
      if (final.contentHeight === candidate && lower.contentHeight < candidate &&
          final.intrinsicHeight === undefined) throw new Error(intrinsicHeightError);
      result = final;
    }
  }
  throw new Error(intrinsicHeightError);
}
