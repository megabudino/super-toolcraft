import type { ToolcraftState } from "../../../state/types";

export type DocumentLocation = Readonly<{
  current: string | null;
  pending: string | null;
  status: "loading" | "ready" | "failed";
  error?: string;
}>;
export type DocumentNavigationPort = Readonly<{
  getSnapshot(): DocumentLocation;
  subscribe(changed: () => void): () => void;
  navigate(path: string): void;
}>;

export function readDocumentPage(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") ||
      value.length > 2048 || /[\\\s\u0000-\u001f]/u.test(value)) return;
  try {
    const url = new URL(value, "https://toolcraft.invalid");
    if (url.origin === "https://toolcraft.invalid") return url.pathname + url.search + url.hash;
  } catch { /* Invalid stored address is ignored. */ }
}

export function reduceDocumentLocation(state: ToolcraftState, command: { path: string }) {
  const path = readDocumentPage(command.path);
  const view = state.canvas.documentView;
  if (!view || !path || path === view.page) return state;
  return { ...state, canvas: { ...state.canvas, documentView: { ...view, page: path } } };
}
