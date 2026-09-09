import type { CreativeAppsKitCanvasSize } from "../schema/types";

export type CreativeAppsKitImportedImageFile = {
  dataUrl: string;
  size: CreativeAppsKitCanvasSize;
};

function readFileDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(typeof reader.result === "string" ? reader.result : null);
    });
    reader.addEventListener("error", () => resolve(null));
    reader.readAsDataURL(file);
  });
}

function readImageDataUrlSize(dataUrl: string): Promise<CreativeAppsKitCanvasSize | null> {
  if (typeof Image === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const image = new Image();
    let resolved = false;
    let fallbackTimeout: number | undefined;
    const jsdomFallback =
      typeof navigator !== "undefined" &&
      navigator.userAgent.toLowerCase().includes("jsdom");
    const finish = (size: CreativeAppsKitCanvasSize | null): void => {
      if (resolved) {
        return;
      }

      resolved = true;
      if (fallbackTimeout !== undefined) {
        window.clearTimeout(fallbackTimeout);
      }
      resolve(size);
    };

    fallbackTimeout = window.setTimeout(
      () => finish(null),
      jsdomFallback ? 0 : 5000,
    );

    image.addEventListener("load", () => {
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
    });
    image.addEventListener("error", () => finish(null));
    image.src = dataUrl;
  });
}

export async function readImportedImageFile(
  file: File,
  fallbackSize: CreativeAppsKitCanvasSize,
): Promise<CreativeAppsKitImportedImageFile | null> {
  const dataUrl = await readFileDataUrl(file);

  if (!dataUrl) {
    return null;
  }

  return {
    dataUrl,
    size: (await readImageDataUrlSize(dataUrl)) ?? fallbackSize,
  };
}
