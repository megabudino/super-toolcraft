import type { StudioRoomTileImageTransform } from "./studio-room-values";

export const STUDIO_ROOM_PREVIEW_IMAGE_MAX_AXIS_PX = 1024;
export const STUDIO_ROOM_PREVIEW_IMAGE_WEBP_QUALITY = 0.86;

export type StudioRoomPreviewImageDerivative = Readonly<{
  blob: Blob;
  height: number;
  mimeType: string;
  width: number;
}>;

export function getStudioRoomPreviewImageDimensions({
  height,
  rotationDeg,
  width,
}: Readonly<{ height: number; rotationDeg: number; width: number }>) {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const scale = Math.min(
    1,
    STUDIO_ROOM_PREVIEW_IMAGE_MAX_AXIS_PX / Math.max(safeWidth, safeHeight),
  );
  const scaledWidth = Math.max(1, Math.round(safeWidth * scale));
  const scaledHeight = Math.max(1, Math.round(safeHeight * scale));
  const quarterTurn = rotationDeg === 90 || rotationDeg === 270;
  return {
    height: quarterTurn ? scaledWidth : scaledHeight,
    resized: scale < 1,
    width: quarterTurn ? scaledHeight : scaledWidth,
  } as const;
}

export async function createStudioRoomPreviewImageDerivative({
  blob,
  signal,
  transform,
}: Readonly<{
  blob: Blob;
  signal: AbortSignal;
  transform: StudioRoomTileImageTransform;
}>): Promise<StudioRoomPreviewImageDerivative> {
  if (signal.aborted) throw new DOMException("Preview media sync was aborted.", "AbortError");
  const bitmap = await createImageBitmap(blob);
  try {
    const dimensions = getStudioRoomPreviewImageDimensions({
      height: bitmap.height,
      rotationDeg: transform.rotationDeg,
      width: bitmap.width,
    });
    const needsTransform =
      transform.rotationDeg !== 0 || transform.flipHorizontal || transform.flipVertical;
    if (!dimensions.resized && !needsTransform) {
      return {
        blob,
        height: dimensions.height,
        mimeType: blob.type || "image/png",
        width: dimensions.width,
      };
    }

    const canvas = new OffscreenCanvas(dimensions.width, dimensions.height);
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("Could not create the Studio Room preview image context.");

    const quarterTurn = transform.rotationDeg === 90 || transform.rotationDeg === 270;
    const drawWidth = quarterTurn ? dimensions.height : dimensions.width;
    const drawHeight = quarterTurn ? dimensions.width : dimensions.height;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.translate(dimensions.width / 2, dimensions.height / 2);
    context.scale(transform.flipHorizontal ? -1 : 1, transform.flipVertical ? -1 : 1);
    context.rotate((transform.rotationDeg * Math.PI) / 180);
    context.drawImage(bitmap, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    const derivativeBlob = await canvas.convertToBlob({
      quality: STUDIO_ROOM_PREVIEW_IMAGE_WEBP_QUALITY,
      type: "image/webp",
    });
    if (signal.aborted) throw new DOMException("Preview media sync was aborted.", "AbortError");
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
