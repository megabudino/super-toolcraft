import { decodeToolcraftBuiltInControlValue } from "../../../state/control-value-codecs";
import { documentViewportLimit } from "./viewport-schema";

import { readDocumentToolbarPreferences } from "./toolbar-preferences";
import { readDocumentPage } from "./navigation";
export type DocumentViewPreferences = { background: string | null; workspace: "blanc" | "dots"; manualHeight: number | null; toolbar?: string; page?: string };
export function normalizeDocumentWorkspaceColor(value: unknown, fallback: string | null): string | null {
  const result = decodeToolcraftBuiltInControlValue({ type: "color" }, value);
  return result?.accepted ? (result.value as string) : fallback;
}
export function readDocumentViewPreferences(value: unknown): DocumentViewPreferences | undefined {
  if (!value || typeof value !== "object") return;
  const view = value as Record<string, unknown>;
  const legacyDefault = view.workspace === undefined && view.background === "#F5F5F5";
  const background = legacyDefault ? null : normalizeDocumentWorkspaceColor(view.background, null);
  const workspace = view.workspace === "blanc" ? "blanc" : "dots";
  if (
    (view.manualHeight !== null &&
      !(
        Number.isSafeInteger(view.manualHeight) &&
        (view.manualHeight as number) >= 1 &&
        (view.manualHeight as number) <= documentViewportLimit
      ))
  )
    return;
  const toolbar = readDocumentToolbarPreferences(view.toolbar);
  const page = readDocumentPage(view.page);
  return { background, workspace, manualHeight: view.manualHeight as number | null, ...(toolbar ? { toolbar } : {}), ...(page ? { page } : {}) };
}
