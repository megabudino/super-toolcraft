/** The package validates its own snapshot. Runtime bounds and clones the storage envelope. */
export function readDocumentToolbarPreferences(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 16384) return;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return value;
  } catch {
    /* invalid persisted data */
  }
}

export function reduceDocumentToolbarPreferences(
  state: import("../../../state/types").ToolcraftState,
  command: { snapshot: unknown },
) {
  if (!state.canvas.documentView) return state;
  let encoded: string | undefined;
  try {
    encoded = readDocumentToolbarPreferences(JSON.stringify(command.snapshot));
  } catch {
    return state;
  }
  if (!encoded || encoded === state.canvas.documentView.toolbar) return state;
  return {
    ...state,
    canvas: { ...state.canvas, documentView: { ...state.canvas.documentView, toolbar: encoded } },
  };
}
