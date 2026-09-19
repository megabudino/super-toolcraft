import { getToolcraftFiniteArtboardRect, type ToolcraftSceneRect } from "../scene";
import type { ReadonlyToolcraftState } from "../state/readonly-state";

export const TOOLCRAFT_MAX_EXPORT_EDGE_PX = 8192;
export const TOOLCRAFT_MAX_EXPORT_PIXELS =
  TOOLCRAFT_MAX_EXPORT_EDGE_PX * TOOLCRAFT_MAX_EXPORT_EDGE_PX;

export type ToolcraftExportFrame = ToolcraftSceneRect;

export type ToolcraftSceneExportFailure = Readonly<{
  code:
    | "empty-scene"
    | "scene-bounds-unavailable"
    | "scene-export-too-large";
  message: string;
  ok: false;
}>;

export type ToolcraftArtifactSize = Readonly<{
  height: number;
  width: number;
}>;

/** Infinity affects the workspace, never the saved artifact boundary. */
export function resolveToolcraftExportFrame(
  state: ReadonlyToolcraftState,
): ToolcraftExportFrame {
  return getToolcraftFiniteArtboardRect(state.canvas.size);
}

export function validateToolcraftArtifactSize(
  size: ToolcraftArtifactSize,
): Readonly<{ ok: true }> | ToolcraftSceneExportFailure {
  const valid =
    Number.isInteger(size.width) &&
    Number.isInteger(size.height) &&
    size.width > 0 &&
    size.height > 0 &&
    size.width <= TOOLCRAFT_MAX_EXPORT_EDGE_PX &&
    size.height <= TOOLCRAFT_MAX_EXPORT_EDGE_PX &&
    size.width * size.height <= TOOLCRAFT_MAX_EXPORT_PIXELS;

  return valid
    ? { ok: true }
    : {
        code: "scene-export-too-large",
        message: `Export must fit within ${TOOLCRAFT_MAX_EXPORT_EDGE_PX} px per edge and ${TOOLCRAFT_MAX_EXPORT_PIXELS} total pixels.`,
        ok: false,
      };
}

export class ToolcraftSceneExportError extends Error {
  readonly feedback: ToolcraftSceneExportFailure;

  constructor(feedback: ToolcraftSceneExportFailure) {
    super(feedback.message);
    this.name = "ToolcraftSceneExportError";
    this.feedback = feedback;
  }
}
