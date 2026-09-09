import { Buffer } from "node:buffer";

import type { Page } from "@playwright/test";

import {
  HERO_PREVIEW_CHANNEL,
  HERO_PREVIEW_PROTOCOL_VERSION,
} from "../src/app/hero-preview-protocol";
import { observeToolcraftDecodedPixels } from "./decoded-pixel-observation";
import type { ToolcraftImageArtifactInspection } from "./export-artifact-helpers";

export type HeroGallerySnapshotArtifact = Readonly<{
  base64: string;
  height: number;
  width: number;
}>;

export type HeroGalleryHorizontalBandInspection = Readonly<{
  centerOpaqueRatio: number;
  leftOpaqueRatio: number;
  nonBackgroundBounds: ToolcraftImageArtifactInspection["nonBackgroundBounds"];
  rightOpaqueRatio: number;
}>;

export async function requestHeroGallerySnapshot(
  page: Page,
): Promise<HeroGallerySnapshotArtifact> {
  return page.evaluate(
    ({ channel, targetOrigin, version }) =>
      new Promise<HeroGallerySnapshotArtifact>((resolve, reject) => {
        const frame = document.querySelector<HTMLIFrameElement>(
          'iframe[title="Recraft hero website preview"]',
        );
        const frameWindow = frame?.contentWindow;
        if (!frameWindow) {
          reject(new Error("The hero website preview is not ready."));
          return;
        }

        const requestId = crypto.randomUUID();
        const timeout = window.setTimeout(() => {
          window.removeEventListener("message", receive);
          reject(new Error("The hero gallery snapshot timed out."));
        }, 10_000);

        function receive(event: MessageEvent<unknown>) {
          if (
            event.source !== frameWindow ||
            event.origin !== targetOrigin ||
            typeof event.data !== "object" ||
            event.data === null
          ) {
            return;
          }
          const message = event.data as Record<string, unknown>;
          if (
            message.channel !== channel ||
            message.version !== version ||
            message.type !== "snapshot-result" ||
            message.requestId !== requestId
          ) {
            return;
          }

          window.clearTimeout(timeout);
          window.removeEventListener("message", receive);
          if (
            message.ok !== true ||
            !(message.blob instanceof Blob) ||
            typeof message.width !== "number" ||
            typeof message.height !== "number"
          ) {
            reject(
              new Error(
                typeof message.message === "string"
                  ? message.message
                  : "The hero gallery snapshot failed.",
              ),
            );
            return;
          }

          const blob = message.blob;
          const height = message.height;
          const width = message.width;
          void blob.arrayBuffer().then((buffer) => {
            const bytes = new Uint8Array(buffer);
            let binary = "";
            for (let offset = 0; offset < bytes.length; offset += 8192) {
              binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
            }
            resolve({
              base64: btoa(binary),
              height,
              width,
            });
          }, reject);
        }

        window.addEventListener("message", receive);
        frameWindow.postMessage(
          { channel, requestId, type: "snapshot", version },
          targetOrigin,
        );
      }),
    {
      channel: HERO_PREVIEW_CHANNEL,
      targetOrigin: "http://localhost:3000",
      version: HERO_PREVIEW_PROTOCOL_VERSION,
    },
  );
}

export async function inspectHeroGallerySnapshot(
  page: Page,
  artifact: HeroGallerySnapshotArtifact,
): Promise<ToolcraftImageArtifactInspection> {
  const bytes = Buffer.from(artifact.base64, "base64");
  const decoded = await page.evaluate(async (base64) => {
    const binary = atob(base64);
    const data = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([data], { type: "image/png" }));
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Unable to inspect hero gallery snapshot pixels.");
      context.imageSmoothingEnabled = false;
      context.drawImage(bitmap, 0, 0, 64, 64);
      return {
        height: bitmap.height,
        pixels: Array.from(context.getImageData(0, 0, 64, 64).data),
        width: bitmap.width,
      };
    } finally {
      bitmap.close();
    }
  }, artifact.base64);
  const observation = await observeToolcraftDecodedPixels({
    backgroundRgba: [0, 0, 0, 0],
    pixels: Uint8ClampedArray.from(decoded.pixels),
    sourceHeight: 64,
    sourceWidth: 64,
  });

  return {
    byteLength: bytes.byteLength,
    decodedPixelHash: observation.decodedPixelHash,
    height: decoded.height,
    kind: "image",
    mediaType: "image/png",
    nonBackgroundBounds: observation.nonBackgroundBounds,
    width: decoded.width,
  };
}

export async function inspectHeroGallerySnapshotHorizontalBands(
  page: Page,
  artifact: HeroGallerySnapshotArtifact,
): Promise<HeroGalleryHorizontalBandInspection> {
  const sampleWidth = 200;
  const sampleHeight = 100;
  const decoded = await page.evaluate(
    async ({ base64, height, width }) => {
      const binary = atob(base64);
      const data = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([data], { type: "image/png" }));
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Unable to inspect hero gallery edge pixels.");
        context.imageSmoothingEnabled = false;
        context.drawImage(bitmap, 0, 0, width, height);
        return Array.from(context.getImageData(0, 0, width, height).data);
      } finally {
        bitmap.close();
      }
    },
    { base64: artifact.base64, height: sampleHeight, width: sampleWidth },
  );
  const pixels = Uint8ClampedArray.from(decoded);
  const observation = await observeToolcraftDecodedPixels({
    backgroundRgba: [0, 0, 0, 0],
    pixels,
    sourceHeight: sampleHeight,
    sourceWidth: sampleWidth,
  });
  const bandWidth = Math.round(sampleWidth * 0.05);
  const centerStart = Math.floor((sampleWidth - bandWidth) / 2);

  const getOpaqueRatio = (startX: number) => {
    let opaquePixels = 0;
    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = startX; x < startX + bandWidth; x += 1) {
        if (pixels[(y * sampleWidth + x) * 4 + 3] > 24) opaquePixels += 1;
      }
    }
    return opaquePixels / (bandWidth * sampleHeight);
  };

  return {
    centerOpaqueRatio: getOpaqueRatio(centerStart),
    leftOpaqueRatio: getOpaqueRatio(0),
    nonBackgroundBounds: observation.nonBackgroundBounds,
    rightOpaqueRatio: getOpaqueRatio(sampleWidth - bandWidth),
  };
}
