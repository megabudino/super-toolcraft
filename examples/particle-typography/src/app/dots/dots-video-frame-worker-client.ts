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

type PendingRequest = Readonly<{
  reject: (error: Error) => void;
  resolve: (bitmap?: ImageBitmap) => void;
}>;

export type DotsVideoFrameWorker = Readonly<{
  dispose: () => void;
  render: (progress: number) => Promise<ImageBitmap>;
}>;

export async function createDotsVideoFrameWorker(input: Readonly<{
  exportFrame: SceneFrame;
  height: number;
  origin: DotPoint;
  plan: DotPlan;
  settings: DotsSettings;
  width: number;
}>): Promise<DotsVideoFrameWorker | null> {
  if (
    typeof Worker === "undefined" ||
    typeof OffscreenCanvas === "undefined" ||
    typeof ImageBitmap === "undefined"
  ) {
    return null;
  }

  const worker = new Worker(
    new URL("./dots-video-frame-worker.ts", import.meta.url),
    { type: "module" },
  );
  const pending = new Map<number, PendingRequest>();
  let disposed = false;
  let requestId = 0;

  const rejectAll = (error: Error): void => {
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  };
  worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const request = pending.get(response.id);
    if (!request) {
      if (response.type === "frame") response.bitmap.close();
      return;
    }
    pending.delete(response.id);
    if (response.type === "error") {
      request.reject(new Error(response.error));
      return;
    }
    request.resolve(response.type === "frame" ? response.bitmap : undefined);
  });
  worker.addEventListener("error", (event) => {
    rejectAll(new Error(event.message || "Dot Formation video worker failed."));
  });

  const request = (message: WorkerRequest): Promise<ImageBitmap | undefined> =>
    new Promise((resolve, reject) => {
      if (disposed) {
        reject(new Error("Dot Formation video worker is already disposed."));
        return;
      }
      pending.set(message.id, { reject, resolve });
      worker.postMessage(message);
    });

  const initializeId = ++requestId;
  try {
    await request({
      ...input,
      id: initializeId,
      type: "initialize",
    });
  } catch (error) {
    disposed = true;
    worker.terminate();
    rejectAll(
      error instanceof Error
        ? error
        : new Error("Dot Formation video worker failed to initialize."),
    );
    throw error;
  }

  return {
    dispose: () => {
      if (disposed) return;
      disposed = true;
      worker.terminate();
      rejectAll(new Error("Dot Formation video worker was disposed."));
    },
    render: async (progress) => {
      const bitmap = await request({
        id: ++requestId,
        progress,
        type: "render",
      });
      if (!bitmap) {
        throw new Error("Dot Formation video worker returned no frame.");
      }
      return bitmap;
    },
  };
}
