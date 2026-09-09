import { strToU8, zip } from "fflate";
import type { ToolcraftImageAsset, ToolcraftState } from "@/toolcraft/runtime";

import galleryWebglSource from "./spiral-gallery-gl.ts?raw";
import galleryEngineSource from "./spiral-gallery-resource.ts?raw";
import gallerySettingsSource from "./spiral-gallery-settings.ts?raw";
import galleryDeckSource from "./spiral-gallery-stack.ts?raw";
import galleryTypesSource from "./spiral-gallery-types.ts?raw";
import {
  readSpiralGallerySettings,
  selectSpiralGalleryImages,
} from "./spiral-gallery-settings";

type CodeExportImage = Readonly<{
  fileName: string;
  id: string;
  mimeType: string;
  src: string;
  transform: Readonly<{
    flipHorizontal: boolean;
    flipVertical: boolean;
    rotationDeg: number;
  }>;
}>;

export type SpiralGalleryCodeConfig = Readonly<{
  canvas: Readonly<{
    height: number;
    renderScale: number;
    width: number;
  }>;
  images: readonly CodeExportImage[];
  packageName: "image-gallery-section";
  schemaVersion: 1;
  values: Readonly<Record<string, unknown>>;
}>;

type CodeArchiveOptions = Readonly<{
  fetchAsset?: (url: string) => Promise<Response>;
  reportProgress?: (progress: number) => void;
}>;

const portableSectionSource = `import * as React from "react";

import { galleryConfig } from "./gallery.config";
import { createImageGalleryResource } from "./image-gallery-engine";
import type { ToolcraftState } from "./host-adapter";
import "./image-gallery-section.css";

function createGalleryState(): ToolcraftState {
  return {
    canvas: { size: galleryConfig.canvas },
    mediaAssets: galleryConfig.images.map((image) => ({
      assetKind: "image" as const,
      dataUrl: image.src,
      fileName: image.fileName,
      id: image.id,
      layerId: image.id,
      mimeType: image.mimeType,
      position: { x: 0, y: 0 },
      sourceTarget: "source.images",
      transform: image.transform,
    })),
    values: { ...galleryConfig.values },
  };
}

export function ImageGallerySection(): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const stateRef = React.useRef<ToolcraftState>(createGalleryState());
  const includeBackground = galleryConfig.values["export.includeBackground"] === true;
  const background = String(galleryConfig.values["appearance.background"] ?? "#EDEDED");

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resource = createImageGalleryResource(canvas);
    let active = true;
    let frame = 0;
    let pending = false;

    const schedule = () => {
      if (!active || pending) return;
      pending = true;
      frame = requestAnimationFrame(render);
    };
    const render = (now: number) => {
      pending = false;
      const snapshot = resource.render({ includeBackground, now, state: stateRef.current });
      if (!snapshot.texturesReady) void resource.ready().then(schedule);
      if (!snapshot.settled) schedule();
    };

    let pointerId: number | null = null;
    let previousY = 0;
    const updatePointer = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      resource.setPointer(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      );
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      resource.nudge("wheel", event.deltaY);
      schedule();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || galleryConfig.images.length === 0) return;
      event.preventDefault();
      pointerId = event.pointerId;
      previousY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.focus({ preventScroll: true });
      resource.setDragging(true);
      updatePointer(event);
      schedule();
    };
    const onPointerMove = (event: PointerEvent) => {
      updatePointer(event);
      if (pointerId !== event.pointerId) return;
      event.preventDefault();
      resource.nudge("drag", previousY - event.clientY);
      previousY = event.clientY;
      schedule();
    };
    const endPointer = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      resource.setDragging(false);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      schedule();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (galleryConfig.images.length === 0) return;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        resource.nudge("key", -1);
        schedule();
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        resource.nudge("key", 1);
        schedule();
      }
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("lostpointercapture", endPointer);
    window.addEventListener("keydown", onKeyDown);
    schedule();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("lostpointercapture", endPointer);
      window.removeEventListener("keydown", onKeyDown);
      resource.dispose();
    };
  }, [includeBackground]);

  return (
    <section
      className="image-gallery-section"
      style={{
        "--image-gallery-aspect": String(galleryConfig.canvas.width / galleryConfig.canvas.height),
        "--image-gallery-background": background,
      } as React.CSSProperties}
    >
      {includeBackground ? <div className="image-gallery-section__background" /> : null}
      <canvas
        ref={canvasRef}
        aria-label="Interactive image gallery"
        className="image-gallery-section__canvas"
        role="img"
        tabIndex={0}
      />
    </section>
  );
}
`;

const portableCssSource = `.image-gallery-section {
  --image-gallery-aspect: 1.7777778;
  --image-gallery-background: #d8d5cb;
  position: relative;
  width: 100%;
  aspect-ratio: var(--image-gallery-aspect);
  overflow: hidden;
  isolation: isolate;
  background: transparent;
}

.image-gallery-section__background,
.image-gallery-section__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.image-gallery-section__background { background: var(--image-gallery-background); }
.image-gallery-section__canvas {
  z-index: 1;
  display: block;
  outline: none;
  touch-action: none;
}
`;

const hostAdapterSource = `export type ToolcraftPoint = { x: number; y: number };
export type ToolcraftCanvasSize = { height: number; width: number };
export type ToolcraftMediaTransform = {
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotationDeg?: number;
};
export type ToolcraftImageAsset = {
  assetKind: "image";
  dataUrl: string;
  fileName: string;
  id: string;
  layerId: string;
  mimeType: string;
  position: ToolcraftPoint;
  size?: ToolcraftCanvasSize;
  sourceTarget?: string;
  transform?: ToolcraftMediaTransform;
};
export type ToolcraftState = {
  canvas: { size: ToolcraftCanvasSize };
  mediaAssets: ToolcraftImageAsset[];
  values: Record<string, unknown>;
};
`;

const readmeSource = `# Image Gallery Section

This package contains a reusable React image-gallery section with the exported
images and the exact current gallery settings.

1. Copy \`src/*\` into a focused folder in your React project.
2. Copy \`public/image-gallery-assets/*\` into the same public path.
3. Import and render \`ImageGallerySection\`.
4. In Next.js App Router, add \`"use client";\` to the component file.

The section depends only on React and browser WebGL. See
\`AGENT-INTEGRATION.md\` for the integration contract.
`;

const agentGuideSource = `# Agent Integration Task

Integrate the packaged \`ImageGallerySection\` into the target project after
inspecting its framework, routing, styling, asset, and component conventions.

## Required invariants

1. Preserve both vertex-shader bends: cylindrical X curvature and speed-signed
   vertical edge pull. Do not replace them with flat CSS transforms.
2. Preserve wheel, vertical drag, Arrow keys, inertia, snapping, pointer
   parallax, press depth/shrink, invert direction, and weighted Deck motion.
3. Keep both Flow and Deck renderer branches.
4. Preserve image order and per-image rotate/flip transforms from the config.
5. Create and dispose one WebGL resource per mounted section and clean up every
   requestAnimationFrame and event listener.
6. Do not add editor UI, captions, dots, shadows outside the authored card
   shadows, or source branding inside the section.

## Acceptance

- Every packaged image renders with no broken URL.
- Initial values match \`gallery.config.json\`.
- Wheel, drag, keys, Flow, Deck, card shadows, and both bends remain functional.
- Mount/unmount leaves no animation frame, listener, or WebGL resource alive.
- The target project builds at desktop and narrow widths.
`;

function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function fileExtension(asset: ToolcraftImageAsset): string {
  const extension = asset.fileName.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]{2,5}$/u.test(extension)) return extension;
  return (
    {
      "image/avif": "avif",
      "image/gif": "gif",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/svg+xml": "svg",
      "image/webp": "webp",
    }[asset.mimeType] ?? "bin"
  );
}

function portableImageName(asset: ToolcraftImageAsset, index: number): string {
  const stem = asset.fileName
    .replace(/\.[^.]+$/u, "")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .toLowerCase();
  return `${String(index + 1).padStart(2, "0")}-${stem || "image"}.${fileExtension(asset)}`;
}

export function createSpiralGalleryCodeConfig(
  state: ToolcraftState,
  assets = selectSpiralGalleryImages(state),
): SpiralGalleryCodeConfig {
  const settings = readSpiralGallerySettings(state);
  return {
    canvas: settings.canvas,
    images: assets.map((asset, index) => ({
      fileName: asset.fileName,
      id: `gallery-image-${index + 1}`,
      mimeType: asset.mimeType,
      src: `/image-gallery-assets/${portableImageName(asset, index)}`,
      transform: {
        flipHorizontal: asset.transform?.flipHorizontal === true,
        flipVertical: asset.transform?.flipVertical === true,
        rotationDeg: asset.transform?.rotationDeg ?? 0,
      },
    })),
    packageName: "image-gallery-section",
    schemaVersion: 1,
    values: {
      "appearance.background": settings.background,
      "canvas.renderScale": settings.canvas.renderScale,
      "card.cornerRadius": settings.card.cornerRadius,
      "card.curveRadius": settings.card.curveRadius,
      "card.height": settings.card.height,
      "card.width": settings.card.width,
      "depth.focusFalloff": settings.depth.focusFalloff,
      "depth.focusFloor": settings.depth.focusFloor,
      "depth.minScale": settings.depth.minScale,
      "depth.scaleFalloff": settings.depth.scaleFalloff,
      "depth.tiltDegrees": degrees(settings.depth.tiltRadians),
      "export.includeBackground": state.values["export.includeBackground"] === true,
      "interaction.invertDirection": settings.interaction.invertDirection,
      "interaction.parallax": settings.interaction.parallax,
      "interaction.pressDepth": settings.interaction.pressDepth,
      "interaction.pressShrink": settings.interaction.pressShrink,
      "layout.mode": settings.layout.mode,
      "shadow.blur": settings.shadow.blur,
      "shadow.color": {
        hex: settings.shadow.colorHex,
        opacity: Math.round(settings.shadow.opacity * 100),
      },
      "shadow.offset": {
        x: settings.shadow.offsetX.toFixed(2),
        y: settings.shadow.offsetY.toFixed(2),
      },
      "physics.dragSpeed": settings.physics.dragSpeed,
      "physics.flexResponse": settings.physics.flexResponse,
      "physics.flexStrength": settings.physics.flexStrength,
      "physics.inertia": settings.physics.inertia,
      "physics.keyStep": settings.physics.keyStep,
      "physics.snapStrength": settings.physics.snapStrength,
      "physics.wheelSpeed": settings.physics.wheelSpeed,
      "spiral.depth": settings.spiral.depth,
      "spiral.depthOffset": settings.spiral.depthOffset,
      "spiral.radius": settings.spiral.radius,
      "spiral.repetitions": settings.spiral.repetitions,
      "spiral.taper": settings.spiral.taper,
      "spiral.twistDegrees": degrees(settings.spiral.twistRadians),
      "spiral.verticalGap": settings.spiral.verticalGap,
      "stack.backTiltDegrees": degrees(settings.stack.backTiltRadians),
      "stack.depthStep": settings.stack.depthStep,
      "stack.fallDistance": settings.stack.fallDistance,
      "stack.fallTiltDegrees": degrees(settings.stack.fallTiltRadians),
      "stack.gap": settings.stack.gap,
      "stack.scrollWeight": settings.stack.scrollWeight,
      "view.cameraDistance": settings.view.cameraDistance,
      "view.perspective": settings.view.perspective,
      "view.portraitScale": settings.view.portraitScale,
      "view.sceneOffset": settings.view.sceneOffset,
    },
  };
}

function textFile(value: string): Uint8Array {
  return strToU8(value);
}

function portableSource(
  source: string,
  replacements: readonly (readonly [string, string])[],
): string {
  return [
    ...replacements,
    ["SpiralGallery", "ImageGallery"] as const,
    ["spiralGallery", "imageGallery"] as const,
    ["SPIRAL_GALLERY", "IMAGE_GALLERY"] as const,
    ["SpiralGl", "ImageGalleryGl"] as const,
  ].reduce((result, [from, to]) => result.replaceAll(from, to), source);
}

function zipFiles(files: Record<string, Uint8Array>): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    zip(files, { level: 6 }, (error, archive) => {
      if (error) reject(error);
      else resolve(archive);
    });
  });
}

export async function createSpiralGalleryCodeArchive(
  state: ToolcraftState,
  options: CodeArchiveOptions = {},
): Promise<Uint8Array> {
  const assets = selectSpiralGalleryImages(state);
  const config = createSpiralGalleryCodeConfig(state, assets);
  const fetchAsset = options.fetchAsset ?? ((url: string) => fetch(url));
  const reportProgress = options.reportProgress ?? (() => undefined);
  const files: Record<string, Uint8Array> = {
    "AGENT-INTEGRATION.md": textFile(agentGuideSource),
    "README.md": textFile(readmeSource),
    "gallery.config.json": textFile(`${JSON.stringify(config, null, 2)}\n`),
    "manifest.json": textFile(
      `${JSON.stringify(
        {
          assetCount: assets.length,
          entryComponent: "src/ImageGallerySection.tsx",
          packageName: config.packageName,
          publicAssetDirectory: "public/image-gallery-assets",
          schemaVersion: config.schemaVersion,
          sourceKind: "agent-ready-react-section",
        },
        null,
        2,
      )}\n`,
    ),
    "src/ImageGallerySection.tsx": textFile(portableSectionSource),
    "src/gallery.config.ts": textFile(
      `export const galleryConfig = ${JSON.stringify(config, null, 2)} as const;\n`,
    ),
    "src/host-adapter.ts": textFile(hostAdapterSource),
    "src/image-gallery-deck.ts": textFile(galleryDeckSource),
    "src/image-gallery-engine.ts": textFile(
      portableSource(galleryEngineSource, [
        ['"@/toolcraft/runtime"', '"./host-adapter"'],
        ['"./spiral-gallery-gl"', '"./image-gallery-webgl"'],
        ['"./spiral-gallery-settings"', '"./image-gallery-settings-adapter"'],
        ['"./spiral-gallery-stack"', '"./image-gallery-deck"'],
        ['"./spiral-gallery-types"', '"./image-gallery-types"'],
      ]),
    ),
    "src/image-gallery-section.css": textFile(portableCssSource),
    "src/image-gallery-settings-adapter.ts": textFile(
      portableSource(gallerySettingsSource, [
        ['"@/toolcraft/runtime"', '"./host-adapter"'],
        ['"./spiral-gallery-stack"', '"./image-gallery-deck"'],
        ['"./spiral-gallery-types"', '"./image-gallery-types"'],
      ]),
    ),
    "src/image-gallery-types.ts": textFile(
      portableSource(galleryTypesSource, [
        ['"@/toolcraft/runtime"', '"./host-adapter"'],
      ]),
    ),
    "src/image-gallery-webgl.ts": textFile(portableSource(galleryWebglSource, [])),
  };

  reportProgress(0.08);
  for (const [index, asset] of assets.entries()) {
    const response = await fetchAsset(asset.dataUrl);
    if (!response.ok) throw new Error(`Could not package ${asset.fileName}.`);
    const fileName = config.images[index]?.src.split("/").pop();
    if (!fileName) throw new Error("The code export asset name is invalid.");
    files[`public/image-gallery-assets/${fileName}`] = new Uint8Array(
      await response.arrayBuffer(),
    );
    reportProgress(0.08 + ((index + 1) / Math.max(assets.length, 1)) * 0.64);
  }

  reportProgress(0.78);
  const archive = await zipFiles(files);
  reportProgress(0.96);
  return archive;
}
