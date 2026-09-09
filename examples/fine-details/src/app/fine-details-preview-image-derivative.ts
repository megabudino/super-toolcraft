export const FINE_DETAILS_PREVIEW_IMAGE_CARD_AXIS_PX = 800;
export const FINE_DETAILS_PREVIEW_IMAGE_LONG_AXIS_PX = 1600;
export const FINE_DETAILS_PREVIEW_IMAGE_WEBP_QUALITY = 0.86;

type QuarterTurn = 0 | 90 | 180 | 270;

export type FineDetailsPreviewImageDerivative = Readonly<{
  blob: Blob;
  height: number;
  mimeType: string;
  width: number;
}>;

export function normalizeFineDetailsPreviewImageRotation(
  rotationDeg: number | undefined,
): QuarterTurn {
  return rotationDeg === 90 || rotationDeg === 180 || rotationDeg === 270
    ? rotationDeg
    : 0;
}

export function getFineDetailsPreviewImageDimensions({
  height,
  rotationDeg,
  width,
}: Readonly<{
  height: number;
  rotationDeg: number | undefined;
  width: number;
}>) {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const rotation = normalizeFineDetailsPreviewImageRotation(rotationDeg);
  const cardAxis = rotation === 90 || rotation === 270 ? safeWidth : safeHeight;
  const longAxis = Math.max(safeWidth, safeHeight);
  const scale = Math.min(
    1,
    FINE_DETAILS_PREVIEW_IMAGE_CARD_AXIS_PX / cardAxis,
    FINE_DETAILS_PREVIEW_IMAGE_LONG_AXIS_PX / longAxis,
  );

  return {
    height: Math.max(1, Math.round(safeHeight * scale)),
    resized: scale < 1,
    width: Math.max(1, Math.round(safeWidth * scale)),
  } as const;
}

function abortError() {
  return typeof DOMException === "function"
    ? new DOMException("Preview image processing was aborted.", "AbortError")
    : new Error("Preview image processing was aborted.");
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw abortError();
}

function encodeCanvasAsWebp(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    throwIfAborted(signal);
    canvas.toBlob(
      (blob) => {
        if (signal.aborted) {
          reject(abortError());
          return;
        }
        if (!blob) {
          reject(new Error("Could not encode the Fine Details preview image."));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      FINE_DETAILS_PREVIEW_IMAGE_WEBP_QUALITY,
    );
  });
}

export async function createFineDetailsPreviewImageDerivative({
  blob,
  rotationDeg,
  signal,
}: Readonly<{
  blob: Blob;
  rotationDeg: number | undefined;
  signal: AbortSignal;
}>): Promise<FineDetailsPreviewImageDerivative> {
  throwIfAborted(signal);
  const bitmap = await createImageBitmap(blob);

  try {
    throwIfAborted(signal);
    const dimensions = getFineDetailsPreviewImageDimensions({
      height: bitmap.height,
      rotationDeg,
      width: bitmap.width,
    });

    if (!dimensions.resized) {
      return {
        blob,
        height: dimensions.height,
        mimeType: blob.type || "image/png",
        width: dimensions.width,
      };
    }

    const canvas = document.createElement("canvas");
    canvas.height = dimensions.height;
    canvas.width = dimensions.width;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Could not create the Fine Details preview image context.");
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);
    const derivativeBlob = await encodeCanvasAsWebp(canvas, signal);

    return {
      blob: derivativeBlob,
      height: dimensions.height,
      mimeType: "image/webp",
      width: dimensions.width,
    };
  } finally {
    bitmap.close();
  }
}
