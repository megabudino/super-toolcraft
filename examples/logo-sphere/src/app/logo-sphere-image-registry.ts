import type { ToolcraftMediaAsset } from "@/toolcraft/runtime";

import {
  logoSphereAtlasCellSize,
  logoSphereAtlasColumns,
  logoSphereAuthoredCanvasSize,
  logoSphereAuthoredCardCrop,
  logoSphereDefaultAtlasId,
  logoSphereDefaultLogoCount,
} from "./logo-sphere-assets";
import type { LogoSphereImageSource } from "./logo-sphere-renderer";

type LogoSphereSourceAsset = Exclude<
  ToolcraftMediaAsset,
  { assetKind: "model" }
>;

type RegistryEntry = {
  bitmap?: HTMLCanvasElement;
  image: HTMLImageElement;
  ready: boolean;
  settled: Promise<void>;
  url: string;
  vector: boolean;
};

// Drawing the SVG atlas directly forces browsers to re-rasterize vector
// source on every drawImage; baking it once into a bitmap keeps per-frame
// card drawing a plain blit. 2x resolution keeps cards crisp at retina and
// export scales.
const ATLAS_RASTER_SCALE = 2;

// Uploaded SVG logos hit the same per-drawImage re-rasterization (measured
// ~12x the per-frame cost of a bitmap source, and worse under the grid mesh
// where every card issues several clipped draws), so every vector entry is
// baked once too. The target edge keeps logo cards crisp through retina and
// export scales while bounding per-logo memory; tiny authored canvases (the
// supplied logos are 82px) upscale to the target so they stay sharp.
const VECTOR_RASTER_TARGET_EDGE = 1024;
const VECTOR_RASTER_MAX_EDGE = 2048;

function rasterizeAtlas(image: HTMLImageElement): HTMLCanvasElement | undefined {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, image.naturalWidth * ATLAS_RASTER_SCALE);
    canvas.height = Math.max(1, image.naturalHeight * ATLAS_RASTER_SCALE);
    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } catch {
    return undefined;
  }
}

function rasterizeVectorImage(
  image: HTMLImageElement,
): HTMLCanvasElement | undefined {
  try {
    const naturalWidth = Math.max(1, image.naturalWidth);
    const naturalHeight = Math.max(1, image.naturalHeight);
    const longestEdge = Math.max(naturalWidth, naturalHeight);
    const scale = Math.min(
      VECTOR_RASTER_MAX_EDGE / longestEdge,
      Math.max(1, VECTOR_RASTER_TARGET_EDGE / longestEdge),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } catch {
    return undefined;
  }
}

const entries = new Map<string, RegistryEntry>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function createEntry(id: string, url: string, vector: boolean): RegistryEntry {
  const image = new Image();
  image.decoding = "async";
  const entry: RegistryEntry = {
    image,
    ready: false,
    settled: Promise.resolve(),
    url,
    vector,
  };
  entry.settled = new Promise<void>((resolve) => {
    const finish = (ready: boolean) => {
      if (ready) {
        if (id === logoSphereDefaultAtlasId) {
          entry.bitmap = rasterizeAtlas(image);
        } else if (entry.vector) {
          entry.bitmap = rasterizeVectorImage(image);
        }
      }
      entry.ready = ready;
      notify();
      resolve();
    };

    image.addEventListener("load", () => finish(true), { once: true });
    image.addEventListener("error", () => finish(false), { once: true });
  });
  entries.set(id, entry);
  image.src = url;

  if (image.complete && image.naturalWidth > 0) {
    entry.ready = true;
  }

  return entry;
}

function isLogoSphereSourceAsset(
  asset: ToolcraftMediaAsset,
): asset is LogoSphereSourceAsset {
  return (
    ((asset.assetKind === "image" && asset.sourceTarget === "logos.sources") ||
      (asset.assetKind === "file" &&
        asset.sourceTarget === "logos.defaults" &&
        asset.mimeType === "image/svg+xml")) &&
    asset.lifecycle !== "unavailable"
  );
}

function isVectorSourceAsset(asset: LogoSphereSourceAsset): boolean {
  return (
    asset.mimeType === "image/svg+xml" || /\.svg$/i.test(asset.fileName ?? "")
  );
}

export function syncLogoSphereImageRegistry(
  mediaAssets: readonly ToolcraftMediaAsset[],
  presentationUrls: ReadonlyMap<string, string>,
): void {
  const desired = new Map(
    mediaAssets
      .filter(isLogoSphereSourceAsset)
      .flatMap((asset) => {
        const url = presentationUrls.get(asset.id);
        return url
          ? [[asset.id, { url, vector: isVectorSourceAsset(asset) }] as const]
          : [];
      }),
  );

  for (const [id, entry] of entries) {
    const desiredEntry = desired.get(id);
    if (desiredEntry?.url === entry.url) {
      continue;
    }
    entry.image.src = "";
    entries.delete(id);
  }

  for (const [id, { url, vector }] of desired) {
    if (!entries.has(id)) {
      createEntry(id, url, vector);
    }
  }

  notify();
}

export function clearLogoSphereImageRegistry(): void {
  entries.forEach((entry) => {
    entry.image.src = "";
  });
  entries.clear();
  notify();
}

export function subscribeLogoSphereImageRegistry(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReadyLogoSphereImages(
  mediaAssets: readonly ToolcraftMediaAsset[],
): readonly LogoSphereImageSource[] {
  return mediaAssets
    .filter(isLogoSphereSourceAsset)
    .flatMap<LogoSphereImageSource>((asset) => {
    const entry = entries.get(asset.id);

    if (!entry?.ready) {
      return [];
    }
    if (asset.id === logoSphereDefaultAtlasId) {
      const rasterScale = entry.bitmap ? ATLAS_RASTER_SCALE : 1;
      const cellSize = logoSphereAtlasCellSize * rasterScale;
      const cropScale = cellSize / logoSphereAuthoredCanvasSize;
      const cropOffsetX = logoSphereAuthoredCardCrop.x * cropScale;
      const cropOffsetY = logoSphereAuthoredCardCrop.y * cropScale;
      const cropSize = logoSphereAuthoredCardCrop.size * cropScale;

      return Array.from({ length: logoSphereDefaultLogoCount }, (_, index) => ({
        id: `${asset.id}:${index}`,
        image: entry.bitmap ?? entry.image,
        sourceRect: {
          height: cropSize,
          width: cropSize,
          x: (index % logoSphereAtlasColumns) * cellSize + cropOffsetX,
          y:
            Math.floor(index / logoSphereAtlasColumns) * cellSize + cropOffsetY,
        },
        transform: asset.assetKind === "image" ? asset.transform : undefined,
      }));
    }

    return [
      {
        id: asset.id,
        image: entry.bitmap ?? entry.image,
        transform: asset.assetKind === "image" ? asset.transform : undefined,
      },
    ];
    });
}

export async function waitForLogoSphereImages(
  mediaAssets: readonly ToolcraftMediaAsset[],
): Promise<readonly LogoSphereImageSource[]> {
  const pending = mediaAssets
    .filter(isLogoSphereSourceAsset)
    .flatMap((asset) => {
      const entry = entries.get(asset.id);
      return entry ? [entry.settled] : [];
    });

  await Promise.all(pending);
  return getReadyLogoSphereImages(mediaAssets);
}
