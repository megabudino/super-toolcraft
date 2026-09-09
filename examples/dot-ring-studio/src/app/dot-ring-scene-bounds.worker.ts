import {
  getDotRingSceneBoundsForSnapshot,
  type DotRingSceneBoundsWorkerRequest,
  type DotRingSceneBoundsWorkerResponse,
} from "./dot-ring-scene-bounds";

const workerScope = self as unknown as {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<DotRingSceneBoundsWorkerRequest>) => void,
  ): void;
  postMessage(message: DotRingSceneBoundsWorkerResponse): void;
};

workerScope.addEventListener("message", (event) => {
  const { audioProfile, requestId, snapshot, timeRange } = event.data;

  try {
    const rect =
      getDotRingSceneBoundsForSnapshot(
        { snapshot, timeRange },
        audioProfile,
      )[0] ?? null;

    workerScope.postMessage({
      rect,
      requestId,
      status: "success",
    });
  } catch (error) {
    workerScope.postMessage({
      error: error instanceof Error ? error.message : String(error),
      requestId,
      status: "error",
    });
  }
});
