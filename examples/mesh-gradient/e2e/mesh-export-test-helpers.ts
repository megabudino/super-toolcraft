import { readFile } from "node:fs/promises";
import { expect, type Page } from "@playwright/test";

export type DownloadArtifact = {
  bytes: Uint8Array;
  fileName: string;
};

export type ImageInspection = {
  backgroundAlpha: number;
  byteLength: number;
  contentHash: string;
  height: number;
  mediaType: string;
  width: number;
};

export type SvgInspection = {
  byteLength: number;
  contentHash: string;
  embeddedHeight: number;
  embeddedWidth: number;
  height: number;
  mediaType: string;
  width: number;
};

export type VideoInspection = {
  backgroundIncluded: boolean;
  byteLength: number;
  contentHash: string;
  durationMs: number;
  frameCount: number;
  height: number;
  mediaType: string;
  width: number;
};

export async function downloadPanelArtifact(
  page: Page,
  buttonName: "Export PNG" | "Export SVG" | "Export Video",
  { proveProgress = false }: { proveProgress?: boolean } = {},
): Promise<DownloadArtifact> {
  const stickyActions = page.locator('[data-slot="toolcraft-panel-sticky-actions"]');
  if (proveProgress) {
    await stickyActions.evaluate((node) => {
      const element = node as HTMLElement & {
        __meshProgressProof?: {
          activeSeen: boolean;
          maxProgress: number;
          observer: MutationObserver;
        };
      };
      const proof = {
        activeSeen: false,
        maxProgress: 0,
        observer: null as unknown as MutationObserver,
      };
      const sample = () => {
        proof.activeSeen ||= element.getAttribute("data-sticky-footer-active") === "true";
        proof.maxProgress = Math.max(
          proof.maxProgress,
          Number(element.getAttribute("data-sticky-footer-progress")) || 0,
        );
      };
      proof.observer = new MutationObserver(sample);
      proof.observer.observe(element, { attributes: true });
      sample();
      element.__meshProgressProof = proof;
    });
  }
  const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  const download = await downloadPromise;
  const artifactPath = await download.path();
  expect(artifactPath).not.toBeNull();
  const bytes = new Uint8Array(await readFile(artifactPath!));
  expect(bytes.byteLength).toBeGreaterThan(0);
  await expect(stickyActions).not.toHaveAttribute("data-sticky-footer-active", "true", {
    timeout: 120_000,
  });
  if (proveProgress) {
    const proof = await stickyActions.evaluate((node) => {
      const element = node as HTMLElement & {
        __meshProgressProof?: {
          activeSeen: boolean;
          maxProgress: number;
          observer: MutationObserver;
        };
      };
      const result = element.__meshProgressProof;
      result?.observer.disconnect();
      delete element.__meshProgressProof;
      return result ? { activeSeen: result.activeSeen, maxProgress: result.maxProgress } : null;
    });
    expect(proof?.activeSeen).toBe(true);
    expect(proof?.maxProgress).toBeGreaterThan(0);
  }
  return { bytes, fileName: download.suggestedFilename() };
}

export async function setCanvasSize(
  page: Page,
  width: number,
  height: number,
): Promise<void> {
  for (const [target, value] of [
    ["canvas.size.width", width],
    ["canvas.size.height", height],
  ] as const) {
    const input = page
      .locator(`[data-toolcraft-control-target="${target}"]`)
      .getByRole("textbox");
    await input.fill(String(value));
    await input.press("Enter");
    await expect(input).toHaveValue(String(value));
  }
}

export async function setTimelineDuration(
  page: Page,
  durationSeconds: number,
): Promise<void> {
  await page.getByRole("button", { name: "Edit timeline duration", exact: true }).click();
  const input = page.getByRole("textbox", { name: "timeline duration" });
  await input.fill(String(durationSeconds));
  await input.press("Enter");
  await expect(
    page.getByRole("button", { name: "Edit timeline duration", exact: true }),
  ).toContainText(`${durationSeconds}s`);
}

function getImageMediaType(artifact: DownloadArtifact): string {
  return artifact.bytes[0] === 0x89 && artifact.bytes[1] === 0x50
    ? "image/png"
    : "image/jpeg";
}

export async function inspectImageArtifact(
  page: Page,
  artifact: DownloadArtifact,
): Promise<ImageInspection> {
  const base64 = Buffer.from(artifact.bytes).toString("base64");
  const mediaType = getImageMediaType(artifact);
  return page.evaluate(
    async ({ base64Value, byteLength, type }) => {
      const binary = atob(base64Value);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type }));
      const sample = document.createElement("canvas");
      sample.width = 32;
      sample.height = 18;
      const context = sample.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Image inspection canvas is unavailable.");
      context.clearRect(0, 0, sample.width, sample.height);
      context.drawImage(bitmap, 0, 0, sample.width, sample.height);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      const digest = await crypto.subtle.digest("SHA-256", pixels);
      const contentHash = Array.from(new Uint8Array(digest), (value) =>
        value.toString(16).padStart(2, "0"),
      ).join("");
      let hasTransparency = false;
      for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index]! < 255) {
          hasTransparency = true;
          break;
        }
      }
      const result = {
        backgroundAlpha: hasTransparency ? 0 : 255,
        byteLength,
        contentHash,
        height: bitmap.height,
        mediaType: type,
        width: bitmap.width,
      };
      bitmap.close();
      return result;
    },
    { base64Value: base64, byteLength: artifact.bytes.byteLength, type: mediaType },
  );
}

export async function inspectSvgArtifact(
  page: Page,
  artifact: DownloadArtifact,
): Promise<SvgInspection> {
  expect(artifact.fileName.toLowerCase()).toMatch(/\.svg$/);
  const base64 = Buffer.from(artifact.bytes).toString("base64");
  return page.evaluate(
    async ({ base64Value, byteLength }) => {
      const binary = atob(base64Value);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const source = new TextDecoder().decode(bytes);
      const documentNode = new DOMParser().parseFromString(source, "image/svg+xml");
      if (documentNode.querySelector("parsererror")) {
        throw new Error("SVG export is not valid XML.");
      }
      const root = documentNode.documentElement;
      if (root.localName !== "svg" || root.namespaceURI !== "http://www.w3.org/2000/svg") {
        throw new Error("SVG export is missing the SVG namespace root.");
      }
      const width = Number(root.getAttribute("width"));
      const height = Number(root.getAttribute("height"));
      if (root.getAttribute("viewBox") !== `0 0 ${width} ${height}`) {
        throw new Error("SVG export viewBox does not match its logical size.");
      }
      const images = root.getElementsByTagNameNS("http://www.w3.org/2000/svg", "image");
      if (images.length !== 1) {
        throw new Error("SVG export should contain exactly one rendered mesh image.");
      }
      const href = images[0]?.getAttribute("href") ?? "";
      if (!href.startsWith("data:image/png;base64,")) {
        throw new Error("SVG export should embed its rendered mesh as PNG data.");
      }
      const imageBinary = atob(href.slice("data:image/png;base64,".length));
      const imageBytes = Uint8Array.from(
        imageBinary,
        (character) => character.charCodeAt(0),
      );
      const bitmap = await createImageBitmap(new Blob([imageBytes], { type: "image/png" }));
      const sample = document.createElement("canvas");
      sample.width = 32;
      sample.height = 18;
      const context = sample.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("SVG inspection canvas is unavailable.");
      context.drawImage(bitmap, 0, 0, sample.width, sample.height);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      const digest = await crypto.subtle.digest("SHA-256", pixels);
      const contentHash = Array.from(new Uint8Array(digest), (value) =>
        value.toString(16).padStart(2, "0"),
      ).join("");
      const result = {
        byteLength,
        contentHash,
        embeddedHeight: bitmap.height,
        embeddedWidth: bitmap.width,
        height,
        mediaType: "image/svg+xml",
        width,
      };
      bitmap.close();
      return result;
    },
    { base64Value: base64, byteLength: artifact.bytes.byteLength },
  );
}

export async function inspectVideoArtifact(
  page: Page,
  artifact: DownloadArtifact,
): Promise<VideoInspection> {
  const base64 = Buffer.from(artifact.bytes).toString("base64");
  const mediaType = artifact.fileName.toLowerCase().endsWith(".mp4")
    ? "video/mp4"
    : "video/webm";
  return page.evaluate(
    async ({ base64Value, byteLength, type }) => {
      const binary = atob(base64Value);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type }));
      const video = document.createElement("video");
      video.muted = true;
      video.preload = "auto";
      video.src = url;
      await new Promise<void>((resolve, reject) => {
        video.addEventListener("loadedmetadata", () => resolve(), { once: true });
        video.addEventListener("error", () => reject(new Error("Video metadata did not decode.")), {
          once: true,
        });
      });
      if (!Number.isFinite(video.duration)) {
        await new Promise<void>((resolve) => {
          video.addEventListener("timeupdate", () => resolve(), { once: true });
          video.currentTime = 1e10;
        });
      }
      const duration = video.duration;
      const sampleTime = Math.max(0, Math.min(duration / 2, duration - 0.01));
      if (sampleTime > 0) {
        await new Promise<void>((resolve) => {
          video.addEventListener("seeked", () => resolve(), { once: true });
          video.currentTime = sampleTime;
        });
      }
      const sample = document.createElement("canvas");
      sample.width = 32;
      sample.height = 18;
      const context = sample.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Video inspection canvas is unavailable.");
      context.drawImage(video, 0, 0, sample.width, sample.height);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      const digest = await crypto.subtle.digest("SHA-256", pixels);
      const contentHash = Array.from(new Uint8Array(digest), (value) =>
        value.toString(16).padStart(2, "0"),
      ).join("");
      let red = 0;
      let green = 0;
      let blue = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        red += pixels[index]!;
        green += pixels[index + 1]!;
        blue += pixels[index + 2]!;
      }
      const result = {
        backgroundIncluded: green > red * 1.08 && green > blue * 1.08,
        byteLength,
        contentHash,
        durationMs: Math.max(1, Math.round(duration * 1000)),
        frameCount: Math.max(1, Math.round(duration * 30)),
        height: video.videoHeight,
        mediaType: type,
        width: video.videoWidth,
      };
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      return result;
    },
    { base64Value: base64, byteLength: artifact.bytes.byteLength, type: mediaType },
  );
}

export async function setBrightBackgroundAndLowOpacity(page: Page): Promise<void> {
  const background = page.locator(
    '[data-toolcraft-control-target="appearance.background"]',
  );
  const hex = background.getByRole("textbox", { name: "hex" });
  await hex.fill("#00CC44");
  await hex.press("Enter");
  const opacity = page.locator('[data-toolcraft-control-target="mix.opacity"]');
  const slider = opacity.getByRole("slider");
  await slider.focus();
  await slider.press("Home");
}
