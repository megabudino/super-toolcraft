export function canvasToDonutBlob(
  canvas: HTMLCanvasElement,
  mimeType: "image/jpeg" | "image/png",
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.size > 0) {
          resolve(blob);
        } else {
          reject(new Error("The donut image encoder returned an empty file."));
        }
      },
      mimeType,
      quality,
    );
  });
}

export function downloadDonutBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
