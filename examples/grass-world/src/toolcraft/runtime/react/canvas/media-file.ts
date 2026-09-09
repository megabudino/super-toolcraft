import type { ToolcraftCanvasSize } from "../../schema/types";

export type ToolcraftImportedImageFile = {
  dataUrl: string;
  size: ToolcraftCanvasSize;
};

export type ToolcraftImportedFile = {
  dataUrl: string;
};

function createAbortError(): Error {
  const error = new Error("Media file reading was cancelled");
  error.name = "AbortError";
  return error;
}

function readFileDataUrl(
  file: File,
  signal?: AbortSignal,
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let settled = false;

    const cleanup = (): void => {
      reader.removeEventListener("abort", handleReaderAbort);
      reader.removeEventListener("error", handleError);
      reader.removeEventListener("load", handleLoad);
      signal?.removeEventListener("abort", handleSignalAbort);
    };
    const finish = (value: string | null): void => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };
    const finishAborted = (): void => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(createAbortError());
    };
    const handleLoad = (): void => {
      finish(typeof reader.result === "string" ? reader.result : null);
    };
    const handleError = (): void => finish(null);
    const handleReaderAbort = (): void => finishAborted();
    const handleSignalAbort = (): void => {
      try {
        reader.abort();
      } finally {
        finishAborted();
      }
    };

    reader.addEventListener("abort", handleReaderAbort);
    reader.addEventListener("error", handleError);
    reader.addEventListener("load", handleLoad);
    signal?.addEventListener("abort", handleSignalAbort, { once: true });
    if (signal?.aborted) {
      handleSignalAbort();
      return;
    }

    try {
      reader.readAsDataURL(file);
    } catch {
      finish(null);
    }
  });
}

function readImageDataUrlSize(
  dataUrl: string,
  signal?: AbortSignal,
): Promise<ToolcraftCanvasSize | null> {
  if (signal?.aborted) {
    return Promise.reject(createAbortError());
  }
  if (typeof Image === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    let resolved = false;
    let fallbackTimeout: number | undefined;
    const jsdomFallback =
      typeof navigator !== "undefined" &&
      navigator.userAgent.toLowerCase().includes("jsdom");
    const cleanup = (): void => {
      if (fallbackTimeout !== undefined) {
        window.clearTimeout(fallbackTimeout);
        fallbackTimeout = undefined;
      }
      image.removeEventListener("error", handleError);
      image.removeEventListener("load", handleLoad);
      signal?.removeEventListener("abort", handleAbort);
    };
    const finish = (size: ToolcraftCanvasSize | null): void => {
      if (resolved) {
        return;
      }

      resolved = true;
      cleanup();
      resolve(size);
    };
    const handleAbort = (): void => {
      if (resolved) {
        return;
      }

      resolved = true;
      cleanup();
      image.src = "";
      reject(createAbortError());
    };
    const handleLoad = (): void => {
      const width = Math.round(image.naturalWidth || image.width);
      const height = Math.round(image.naturalHeight || image.height);

      finish(
        width > 0 && height > 0
          ? {
              height,
              unit: "px",
              width,
            }
          : null,
      );
    };
    const handleError = (): void => finish(null);

    fallbackTimeout = window.setTimeout(
      () => finish(null),
      jsdomFallback ? 0 : 5000,
    );
    image.addEventListener("error", handleError);
    image.addEventListener("load", handleLoad);
    signal?.addEventListener("abort", handleAbort, { once: true });
    image.src = dataUrl;
  });
}

export function isToolcraftImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(avif|gif|heic|heif|jpe?g|png|svg|tiff?|webp)$/i.test(file.name)
  );
}

export async function readImportedFile(
  file: File,
  signal?: AbortSignal,
): Promise<ToolcraftImportedFile | null> {
  const dataUrl = await readFileDataUrl(file, signal);

  return dataUrl ? { dataUrl } : null;
}

export async function readImportedImageFile(
  file: File,
  fallbackSize: ToolcraftCanvasSize,
  signal?: AbortSignal,
): Promise<ToolcraftImportedImageFile | null> {
  const dataUrl = await readFileDataUrl(file, signal);

  if (!dataUrl) {
    return null;
  }

  return {
    dataUrl,
    size: (await readImageDataUrlSize(dataUrl, signal)) ?? fallbackSize,
  };
}
