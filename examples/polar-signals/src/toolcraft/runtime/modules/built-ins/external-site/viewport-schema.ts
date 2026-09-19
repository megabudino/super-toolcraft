import type { ToolcraftCanvasSchema } from "../../../schema/types";
import type { ResolvedToolcraftCanvasBehavior } from "../../contributions/canvas-behavior-contributions";

export const documentViewportDefaults = {
  width: 1920,
  height: 1080,
  background: "#D4D4D4",
} as const;
export const documentViewportTargets = {
  page: "canvas.documentPage",
  width: "canvas.size.width",
  height: "canvas.size.height",
  background: "canvas.workspaceColor",
  workspace: "canvas.workspaceBackground",
} as const;
export const documentViewportLimit = 1_000_000;

/** The module, not an application route, selects the workspace profile. */
export function resolveExternalDocumentCanvas(
  canvas: ToolcraftCanvasSchema,
  behaviors: readonly ResolvedToolcraftCanvasBehavior[],
): ToolcraftCanvasSchema {
  if (!behaviors.some((item) => item.behavior === "external-document")) return canvas;
  return {
    ...canvas,
    sizing: { mode: "external-document" },
    renderScale: false,
    size: {
      width: documentViewportDefaults.width,
      height: documentViewportDefaults.height,
      unit: "px",
    },
  };
}
