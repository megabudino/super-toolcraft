import type { ToolcraftState } from "../../state/types";
import type { ToolcraftModelRenderHost } from "./model-render-binding";
import { getToolcraftVisibleModelExportRequests } from "./model-render-state";

export type ToolcraftRenderModelsToCanvas = (
  canvas: HTMLCanvasElement,
) => Promise<number>;

function exportPixelRatio(
  state: ToolcraftState,
  canvas: HTMLCanvasElement,
): number {
  const widthRatio = canvas.width / state.canvas.size.width;
  const heightRatio = canvas.height / state.canvas.size.height;
  const ratio = Math.min(widthRatio, heightRatio);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
}

export async function renderToolcraftModelsToCanvas(
  host: ToolcraftModelRenderHost | null,
  state: ToolcraftState,
  canvas: HTMLCanvasElement,
): Promise<number> {
  if (!host) return 0;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Toolcraft model export requires a 2D target canvas.");
  }
  const requests = getToolcraftVisibleModelExportRequests(state);
  const pixelRatio = exportPixelRatio(state, canvas);

  for (const request of requests) {
    await host.renderExport(request, {
      height: state.canvas.size.height,
      onRendered: (source) => {
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
      },
      pixelRatio,
      width: state.canvas.size.width,
    });
  }

  return requests.length;
}
