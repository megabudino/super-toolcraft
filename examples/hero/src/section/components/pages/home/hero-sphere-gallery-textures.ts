import type { HeroGalleryImageSource } from './hero-gallery-sources';

export interface HeroSphereTextureEntry {
  height: number;
  status: 'error' | 'loading' | 'ready';
  texture: WebGLTexture;
  width: number;
}

export interface HeroSphereTextureLoadingProfile {
  maxConcurrentLoads: number;
  maxTextureDimension: number;
}

export interface HeroSphereTextureCache {
  configure(profile: Readonly<HeroSphereTextureLoadingProfile>): void;
  dispose(): void;
  ensure(source: HeroGalleryImageSource, retryError?: boolean): HeroSphereTextureEntry | null;
  getReadySourceIds(sources: readonly HeroGalleryImageSource[]): string[];
  getSettledSourceIds(sources: readonly HeroGalleryImageSource[]): string[];
  sync(sources: readonly HeroGalleryImageSource[]): void;
}

const defaultLoadingProfile: HeroSphereTextureLoadingProfile = {
  maxConcurrentLoads: Number.POSITIVE_INFINITY,
  maxTextureDimension: 2048,
};

interface HeroTextureDimensions {
  height: number;
  width: number;
}

type HeroDecodedImage = HTMLImageElement | ImageBitmap;

class HeroTextureLoadCancelledError extends Error {}

interface HeroSourceImageLoad {
  cancel(): void;
  readonly cancelled: boolean;
  promise: Promise<HeroDecodedImage>;
}

interface HeroActiveTextureLoad {
  entry: HeroSphereTextureEntry;
  load: HeroSourceImageLoad;
  requeue: boolean;
  source: HeroGalleryImageSource;
}

function isHtmlImageElement(image: HeroDecodedImage): image is HTMLImageElement {
  return typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement;
}

function getDecodedDimensions(
  source: HeroGalleryImageSource,
  image: HeroDecodedImage,
): HeroTextureDimensions {
  if (isHtmlImageElement(image)) {
    return {
      height: Math.max(1, image.naturalHeight),
      width: Math.max(1, image.naturalWidth),
    };
  }
  return {
    height: Math.max(1, image.height || source.height),
    width: Math.max(1, image.width || source.width),
  };
}

function canUploadDirectly(
  source: HeroGalleryImageSource,
  dimensions: Readonly<HeroTextureDimensions>,
  maxTextureDimension: number,
) {
  return (
    source.transform.rotationDeg === 0 &&
    !source.transform.flipHorizontal &&
    !source.transform.flipVertical &&
    Math.max(dimensions.width, dimensions.height) <= maxTextureDimension
  );
}

function prepareStagingCanvas(
  source: HeroGalleryImageSource,
  image: HeroDecodedImage,
  decodedDimensions: Readonly<HeroTextureDimensions>,
  maxTextureDimension: number,
  canvas: HTMLCanvasElement,
): HeroTextureDimensions {
  const rotated = source.transform.rotationDeg === 90 || source.transform.rotationDeg === 270;
  const sourceWidth = rotated ? decodedDimensions.height : decodedDimensions.width;
  const sourceHeight = rotated ? decodedDimensions.width : decodedDimensions.height;
  const scale = Math.min(1, maxTextureDimension / Math.max(sourceWidth, sourceHeight));
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the hero gallery texture.');

  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(source.transform.flipHorizontal ? -1 : 1, source.transform.flipVertical ? -1 : 1);
  context.rotate((source.transform.rotationDeg * Math.PI) / 180);
  const drawWidth = rotated ? canvas.height : canvas.width;
  const drawHeight = rotated ? canvas.width : canvas.height;
  context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  return { height: canvas.height, width: canvas.width };
}

function createSourceImageLoad(source: HeroGalleryImageSource): HeroSourceImageLoad {
  if (source.bitmap) {
    let cancelled = false;
    return {
      cancel() {
        cancelled = true;
      },
      get cancelled() {
        return cancelled;
      },
      promise: Promise.resolve(source.bitmap),
    };
  }

  const image = new Image();
  image.decoding = 'async';
  image.src = source.textureUrl ?? source.url;
  let cancelled = false;
  let rejectCancellation: ((reason: Error) => void) | null = null;
  const cancellation = new Promise<never>((_resolve, reject) => {
    rejectCancellation = reject;
  });
  const decoded = image.decode().then(
    () => image,
    () => {
      if (image.complete && image.naturalWidth > 0) return image;
      image.src = '';
      throw new Error(`Could not load hero gallery source ${source.id}.`);
    },
  );

  return {
    cancel() {
      if (cancelled) return;
      cancelled = true;
      image.src = '';
      rejectCancellation?.(new HeroTextureLoadCancelledError());
      rejectCancellation = null;
    },
    get cancelled() {
      return cancelled;
    },
    promise: Promise.race([decoded, cancellation]),
  };
}

export function createHeroSphereTextureCache(
  gl: WebGLRenderingContext,
  schedule: () => void,
  onSettled?: () => void,
): HeroSphereTextureCache {
  const entries = new Map<string, HeroSphereTextureEntry>();
  const pendingLoads: Array<{
    entry: HeroSphereTextureEntry;
    source: HeroGalleryImageSource;
  }> = [];
  const activeLoads = new Set<HeroActiveTextureLoad>();
  let disposed = false;
  let loadingProfile = defaultLoadingProfile;
  let stagingCanvas: HTMLCanvasElement | null = null;

  const getStagingCanvas = () => {
    stagingCanvas ??= document.createElement('canvas');
    return stagingCanvas;
  };

  const settle = (
    source: HeroGalleryImageSource,
    entry: HeroSphereTextureEntry,
    status: 'error' | 'ready',
  ) => {
    if (disposed || entries.get(source.key) !== entry) return;
    entry.status = status;
    schedule();
    onSettled?.();
  };

  const releaseActiveLoad = (activeLoad: HeroActiveTextureLoad) => {
    if (!activeLoads.delete(activeLoad)) return;
    startPendingLoads();
  };

  const cancelActiveLoad = (activeLoad: HeroActiveTextureLoad, requeue = false) => {
    if (!activeLoads.has(activeLoad)) return;
    if (requeue && !activeLoad.requeue && entries.get(activeLoad.source.key) === activeLoad.entry) {
      activeLoad.requeue = true;
      pendingLoads.push({ entry: activeLoad.entry, source: activeLoad.source });
    }
    activeLoad.load.cancel();
    releaseActiveLoad(activeLoad);
  };

  const cancelLoadsForEntry = (entry: HeroSphereTextureEntry) => {
    for (const activeLoad of activeLoads) {
      if (activeLoad.entry === entry) cancelActiveLoad(activeLoad);
    }
  };

  const runLoad = async (
    source: HeroGalleryImageSource,
    entry: HeroSphereTextureEntry,
    activeLoad: HeroActiveTextureLoad,
  ) => {
    let image: HeroDecodedImage | undefined;
    try {
      image = await activeLoad.load.promise;
      if (activeLoad.load.cancelled || disposed || entries.get(source.key) !== entry) return;
      try {
        const decodedDimensions = getDecodedDimensions(source, image);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, entry.texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        if (canUploadDirectly(source, decodedDimensions, loadingProfile.maxTextureDimension)) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          entry.width = decodedDimensions.width;
          entry.height = decodedDimensions.height;
        } else {
          const canvas = getStagingCanvas();
          try {
            const preparedDimensions = prepareStagingCanvas(
              source,
              image,
              decodedDimensions,
              loadingProfile.maxTextureDimension,
              canvas,
            );
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
            entry.width = preparedDimensions.width;
            entry.height = preparedDimensions.height;
          } finally {
            canvas.width = 0;
            canvas.height = 0;
          }
        }

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      } catch {
        settle(source, entry, 'error');
        return;
      }
      settle(source, entry, 'ready');
    } catch (error) {
      if (!(error instanceof HeroTextureLoadCancelledError)) settle(source, entry, 'error');
    } finally {
      if (image && isHtmlImageElement(image)) image.src = '';
      releaseActiveLoad(activeLoad);
    }
  };

  function startPendingLoads() {
    if (disposed) return;
    while (activeLoads.size < loadingProfile.maxConcurrentLoads) {
      const pending = pendingLoads.shift();
      if (!pending) return;
      if (entries.get(pending.source.key) !== pending.entry) continue;
      const activeLoad = {
        entry: pending.entry,
        load: createSourceImageLoad(pending.source),
        requeue: false,
        source: pending.source,
      };
      activeLoads.add(activeLoad);
      void runLoad(pending.source, pending.entry, activeLoad);
    }
  }

  const ensure = (source: HeroGalleryImageSource, retryError = false) => {
    const existing = entries.get(source.key);
    if (existing) {
      if (existing.status !== 'error' || !source.url || !retryError) return existing;
      gl.deleteTexture(existing.texture);
      entries.delete(source.key);
    }
    const texture = gl.createTexture();
    if (!texture) return null;
    const entry: HeroSphereTextureEntry = {
      height: 1,
      status: 'loading',
      texture,
      width: 1,
    };
    entries.set(source.key, entry);
    pendingLoads.push({ entry, source });
    startPendingLoads();
    return entry;
  };

  return {
    configure(profile) {
      loadingProfile = {
        maxConcurrentLoads: Number.isFinite(profile.maxConcurrentLoads)
          ? Math.max(1, Math.floor(profile.maxConcurrentLoads))
          : Number.POSITIVE_INFINITY,
        maxTextureDimension: Math.max(1, Math.floor(profile.maxTextureDimension)),
      };
      const allowedActiveLoads = loadingProfile.maxConcurrentLoads;
      if (Number.isFinite(allowedActiveLoads) && activeLoads.size > allowedActiveLoads) {
        for (const activeLoad of [...activeLoads].slice(allowedActiveLoads)) {
          cancelActiveLoad(activeLoad, true);
        }
      }
      startPendingLoads();
    },
    dispose() {
      disposed = true;
      pendingLoads.length = 0;
      for (const activeLoad of activeLoads) cancelActiveLoad(activeLoad);
      if (stagingCanvas) {
        stagingCanvas.width = 0;
        stagingCanvas.height = 0;
        stagingCanvas = null;
      }
      for (const entry of entries.values()) gl.deleteTexture(entry.texture);
      entries.clear();
    },
    ensure,
    getReadySourceIds(sources) {
      return sources
        .filter((source) => entries.get(source.key)?.status === 'ready')
        .map((source) => source.id);
    },
    getSettledSourceIds(sources) {
      return sources
        .filter((source) => {
          const status = entries.get(source.key)?.status;
          return status === 'ready' || status === 'error';
        })
        .map((source) => source.id);
    },
    sync(sources) {
      for (const source of sources) ensure(source, true);
      const activeKeys = new Set(sources.map((source) => source.key));
      for (const [key, entry] of entries) {
        if (activeKeys.has(key)) continue;
        cancelLoadsForEntry(entry);
        gl.deleteTexture(entry.texture);
        entries.delete(key);
      }
    },
  };
}
