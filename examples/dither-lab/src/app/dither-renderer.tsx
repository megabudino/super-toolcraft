import * as React from "react";

import {
  createToolcraftPngExportCanvas,
  shouldIncludeToolcraftPreviewBackground,
  type ToolcraftState,
} from "@/toolcraft/runtime";
import { useToolcraft } from "@/toolcraft/runtime/react";

import {
  createDitherPreviewRenderPhases,
  DitherRenderEngine,
  drawDitherOutput,
  getDitherExportExtension,
  getDitherExportMimeType,
  getDitherSettingsFromValues,
  renderDitherImageToCanvas,
} from "./dither-effect";
import {
  ditherDefaultSourceMediaAsset,
  ditherSourceImageTarget,
} from "./dither-defaults";

const renderScaleTarget = "canvas.renderScale";
const previewRenderIntervalMs = 40;

type DitherPreviewRenderRequest = Parameters<typeof renderDitherImageToCanvas>[0];

function getSourceMediaAsset(state: ToolcraftState) {
  return (
    state.mediaAssets.find((asset) => asset.sourceTarget === ditherSourceImageTarget) ??
    null
  );
}

function getRenderScale(state: ToolcraftState): number {
  const value = Number(
    state.values[renderScaleTarget] ?? state.schema.canvas.renderScale.defaultValue ?? 1,
  );

  return Number.isFinite(value)
    ? Math.min(state.schema.canvas.renderScale.max, Math.max(state.schema.canvas.renderScale.min, value))
    : 1;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(image);
    };
    const fail = () => {
      if (settled) {
        return;
      }

      settled = true;
      reject(new Error("Could not load source image."));
    };

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", fail, { once: true });
    image.decoding = "async";
    image.src = dataUrl;

    if (typeof image.decode === "function") {
      void image.decode().then(finish, () => {
        if (image.complete && image.naturalWidth > 0) {
          finish();
        }
      });
    }
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Could not encode exported image."));
      },
      mimeType,
      quality,
    );
  });
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function DitherRenderer(): React.JSX.Element {
  const { state } = useToolcraft();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const engineRef = React.useRef<DitherRenderEngine | null>(null);
  const latestPreviewRequestRef = React.useRef<DitherPreviewRenderRequest | null>(null);
  const previewFrameRef = React.useRef<number | null>(null);
  const previewTimeoutRef = React.useRef<number | null>(null);
  const lastPreviewPaintAtRef = React.useRef(Number.NEGATIVE_INFINITY);
  if (!engineRef.current) {
    engineRef.current = new DitherRenderEngine();
  }
  const sourceAsset = getSourceMediaAsset(state);
  const [sourceImage, setSourceImage] = React.useState<HTMLImageElement | null>(null);
  const includePreviewBackground = shouldIncludeToolcraftPreviewBackground({ state });
  const settings = React.useMemo(
    () => ({
      ...getDitherSettingsFromValues(state.values),
      includeBackground: includePreviewBackground,
    }),
    [
      includePreviewBackground,
      state.values["appearance.background"],
      state.values["effect.ascii.customGlyphs"],
      state.values["effect.ascii.glyphs"],
      state.values["effect.ascii.mode"],
      state.values["effect.density"],
      state.values["effect.exposure"],
      state.values["effect.fill"],
      state.values["effect.layer.blend"],
      state.values["effect.layer.opacity"],
      state.values["effect.scatter"],
      state.values["effect.seed"],
      state.values["effect.size"],
      state.values["effect.style"],
      state.values["finish.glow"],
      state.values["finish.grain"],
      state.values["finish.noise"],
      state.values["finish.vignette"],
      state.values["duotone.base"],
      state.values["duotone.pixels"],
      state.values["duotone.preset"],
      state.values["export.includeBackground"],
      state.values["tone.brightness"],
      state.values["tone.contrast"],
      state.values["tone.hue"],
      state.values["tone.saturation"],
    ],
  );
  const renderScale = getRenderScale(state);
  const cssWidth = Math.max(1, state.canvas.size.width);
  const cssHeight = Math.max(1, state.canvas.size.height);
  const pixelWidth = Math.max(1, Math.round(cssWidth * renderScale));
  const pixelHeight = Math.max(1, Math.round(cssHeight * renderScale));

  React.useEffect(() => {
    let active = true;

    if (!sourceAsset?.dataUrl) {
      setSourceImage(null);
      return () => {
        active = false;
      };
    }

    void loadImage(sourceAsset.dataUrl).then(
      (image) => {
        if (active) {
          setSourceImage(image);
        }
      },
      () => {
        if (active) {
          setSourceImage(null);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [sourceAsset?.dataUrl]);

  React.useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    latestPreviewRequestRef.current = {
      cssHeight,
      cssWidth,
      engine: engineRef.current ?? undefined,
      pixelHeight,
      pixelWidth,
      settings,
      sourceImage,
      target: canvas,
    };

    if (previewFrameRef.current !== null || previewTimeoutRef.current !== null) {
      return undefined;
    }

    const paintLatestPreview = () => {
      previewFrameRef.current = null;
      const request = latestPreviewRequestRef.current;

      if (!request) {
        return;
      }

      const phases = createDitherPreviewRenderPhases(request);
      const paintNextPhase = () => {
        previewFrameRef.current = null;

        const phase = phases.next();
        if (!phase.done) {
          phase.value();
          previewFrameRef.current = window.requestAnimationFrame(paintNextPhase);
          return;
        }

        lastPreviewPaintAtRef.current = window.performance.now();
        if (latestPreviewRequestRef.current !== request) {
          previewFrameRef.current = window.requestAnimationFrame(paintLatestPreview);
        }
      };

      paintNextPhase();
    };
    const requestPreviewFrame = () => {
      previewTimeoutRef.current = null;
      previewFrameRef.current = window.requestAnimationFrame(paintLatestPreview);
    };
    const elapsed = window.performance.now() - lastPreviewPaintAtRef.current;
    const delay = Math.max(0, previewRenderIntervalMs - elapsed);

    if (delay === 0) {
      requestPreviewFrame();
    } else {
      previewTimeoutRef.current = window.setTimeout(requestPreviewFrame, delay);
    }

    return undefined;
  }, [cssHeight, cssWidth, pixelHeight, pixelWidth, settings, sourceImage]);

  React.useEffect(
    () => () => {
      latestPreviewRequestRef.current = null;
      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      if (previewFrameRef.current !== null) {
        window.cancelAnimationFrame(previewFrameRef.current);
        previewFrameRef.current = null;
      }
      lastPreviewPaintAtRef.current = Number.NEGATIVE_INFINITY;
    },
    [],
  );

  return (
    <canvas
      aria-label="Dither output"
      className="block h-full w-full"
      data-dither-output-canvas=""
      data-dither-source={
        !sourceAsset ? "empty" :
        sourceAsset.dataUrl === ditherDefaultSourceMediaAsset.dataUrl ? "bundled" : "custom"
      }
      data-toolcraft-product-output=""
      ref={canvasRef}
      style={{
        height: "100%",
        imageRendering: settings.style === "characters" ? "auto" : "pixelated",
        width: "100%",
      }}
    />
  );
}

export async function exportDitherImage(
  state: ToolcraftState,
  reportProgress: (progress: number) => void,
): Promise<void> {
  const settings = getDitherSettingsFromValues(state.values);
  const imageResolution =
    state.values["export.image.resolution"] === "2k" ||
    state.values["export.image.resolution"] === "4k" ||
    state.values["export.image.resolution"] === "8k"
      ? state.values["export.image.resolution"]
      : settings.imageResolution;
  const sourceAsset = getSourceMediaAsset(state);
  const sourceImage = sourceAsset ? await loadImage(sourceAsset.dataUrl) : null;

  reportProgress(0.2);

  const exportCanvas = createToolcraftPngExportCanvas({
    background: settings.background,
    includeBackground: settings.includeBackground,
    resolution: imageResolution,
    state,
    render: ({ context, cssHeight, cssWidth, pixelHeight, pixelWidth }) => {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      drawDitherOutput({
        cssHeight,
        cssWidth,
        pixelHeight,
        pixelWidth,
        renderMode: "export",
        settings: {
          ...settings,
          includeBackground: settings.includeBackground,
        },
        sourceImage,
        targetContext: context,
      });
      context.restore();
    },
  });

  reportProgress(0.72);

  const mimeType = getDitherExportMimeType(settings.imageFormat);
  const blob = await canvasToBlob(
    exportCanvas,
    mimeType,
    settings.imageFormat === "jpg" ? 0.92 : undefined,
  );
  exportCanvas.width = 1;
  exportCanvas.height = 1;

  reportProgress(0.92);
  downloadBlob(blob, `dither-${settings.style}.${getDitherExportExtension(settings.imageFormat)}`);
  reportProgress(1);
}
