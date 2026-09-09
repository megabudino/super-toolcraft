import { renderDotsFrameFromPlan } from "./dots-render-frame";
import type {
  DotPlan,
  DotPoint,
  DotsSettings,
} from "./dots-types";

type SceneFrame = Readonly<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

type WorkerRequest =
  | Readonly<{
      exportFrame: SceneFrame;
      height: number;
      id: number;
      origin: DotPoint;
      plan: DotPlan;
      settings: DotsSettings;
      type: "initialize";
      width: number;
    }>
  | Readonly<{ id: number; progress: number; type: "render" }>;

type WorkerResponse =
  | Readonly<{ id: number; type: "ready" }>
  | Readonly<{ bitmap: ImageBitmap; id: number; type: "frame" }>
  | Readonly<{ error: string; id: number; type: "error" }>;

type VideoFrameWorkerState = Readonly<{
  canvas: OffscreenCanvas;
  context: OffscreenCanvasRenderingContext2D;
  exportFrame: SceneFrame;
  height: number;
  origin: DotPoint;
  plan: DotPlan;
  settings: DotsSettings;
  width: number;
}>;

type WorkerScope = Readonly<{
  postMessage: (message: WorkerResponse, transfer?: Transferable[]) => void;
}>;

const workerScope = self as unknown as WorkerScope;
let workerState: VideoFrameWorkerState | null = null;

function initialize(
  request: Extract<WorkerRequest, { type: "initialize" }>,
): void {
  const canvas = new OffscreenCanvas(request.width, request.height);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Dot Formation video worker requires Canvas 2D.");
  }
  workerState = {
    canvas,
    context,
    exportFrame: request.exportFrame,
    height: request.height,
    origin: request.origin,
    plan: request.plan,
    settings: request.settings,
    width: request.width,
  };
}

function render(progress: number): ImageBitmap {
  if (!workerState) {
    throw new Error("Dot Formation video worker rendered before initialization.");
  }
  const {
    canvas,
    context,
    exportFrame,
    height,
    origin,
    plan,
    settings,
    width,
  } = workerState;
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = settings.appearance.background;
  context.fillRect(0, 0, width, height);
  context.setTransform(
    width / exportFrame.width,
    0,
    0,
    height / exportFrame.height,
    (origin.x - exportFrame.x) * (width / exportFrame.width),
    (origin.y - exportFrame.y) * (height / exportFrame.height),
  );
  try {
    renderDotsFrameFromPlan(
      context as unknown as CanvasRenderingContext2D,
      settings.canvas.width,
      settings.canvas.height,
      settings,
      progress,
      plan,
      { clear: false, includeBackground: false },
    );
  } finally {
    context.restore();
  }
  return canvas.transferToImageBitmap();
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    if (request.type === "initialize") {
      initialize(request);
      workerScope.postMessage({ id: request.id, type: "ready" });
      return;
    }
    const bitmap = render(request.progress);
    workerScope.postMessage(
      { bitmap, id: request.id, type: "frame" },
      [bitmap],
    );
  } catch (error) {
    workerScope.postMessage({
      error: error instanceof Error ? error.message : String(error),
      id: request.id,
      type: "error",
    });
  }
});
