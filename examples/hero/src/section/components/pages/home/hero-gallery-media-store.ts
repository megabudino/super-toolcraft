interface HeroGalleryMediaMessageItem {
  blob: Blob;
  id: string;
  mimeType: string;
  ref: string;
}

export interface HeroGalleryMediaEntry {
  bitmap: ImageBitmap | null;
  blob: Blob;
  height: number;
  id: string;
  lastUsed: number;
  objectUrl: string;
  status: 'decoding' | 'error' | 'ready';
  width: number;
}

const entries = new Map<string, HeroGalleryMediaEntry>();
const listeners = new Set<() => void>();
let revision = 0;
let gcTimer: ReturnType<typeof setTimeout> | null = null;

function publish() {
  revision += 1;
  for (const listener of listeners) listener();
}

async function decodeEntry(entry: HeroGalleryMediaEntry) {
  try {
    if (typeof createImageBitmap === 'function') {
      const original = await createImageBitmap(entry.blob);
      entry.width = original.width;
      entry.height = original.height;
      const scale = Math.min(1, 2048 / Math.max(original.width, original.height));
      const resizeWidth = Math.max(1, Math.round(original.width * scale));
      const resizeHeight = Math.max(1, Math.round(original.height * scale));
      if (resizeWidth === original.width && resizeHeight === original.height) {
        entry.bitmap = original;
      } else {
        entry.bitmap = await createImageBitmap(entry.blob, {
          resizeHeight,
          resizeQuality: 'high',
          resizeWidth,
        });
        original.close();
      }
    } else {
      const dimensions = await new Promise<{ height: number; width: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ height: image.naturalHeight, width: image.naturalWidth });
        image.onerror = () => reject(new Error('Could not decode the gallery image.'));
        image.src = entry.objectUrl;
      });
      entry.width = dimensions.width;
      entry.height = dimensions.height;
    }
    if (![...entries.values()].includes(entry)) {
      entry.bitmap?.close();
      return;
    }
    entry.status = 'ready';
  } catch {
    entry.status = 'error';
  }
  publish();
}

export function ingestHeroGalleryMedia(images: readonly HeroGalleryMediaMessageItem[]) {
  for (const image of images) {
    if (!(image.blob instanceof Blob) || image.ref.length === 0 || entries.has(image.ref)) continue;
    const entry: HeroGalleryMediaEntry = {
      bitmap: null,
      blob: image.blob,
      height: 0,
      id: image.id,
      lastUsed: Date.now(),
      objectUrl: URL.createObjectURL(image.blob),
      status: 'decoding',
      width: 0,
    };
    entries.set(image.ref, entry);
    void decodeEntry(entry);
  }
  publish();
}

export function getHeroGalleryMediaEntry(ref: string) {
  return entries.get(ref);
}

export function releaseHeroGalleryMedia(refs: readonly string[]) {
  for (const ref of refs) {
    const entry = entries.get(ref);
    if (!entry) continue;
    entries.delete(ref);
    entry.bitmap?.close();
    URL.revokeObjectURL(entry.objectUrl);
  }
  if (entries.size === 0 && gcTimer !== null) {
    clearTimeout(gcTimer);
    gcTimer = null;
  }
  publish();
}

export function getHeroGalleryMediaItems(refs: readonly string[]): HeroGalleryMediaMessageItem[] {
  return refs.flatMap((ref) => {
    const entry = entries.get(ref);
    return entry
      ? [{ blob: entry.blob, id: entry.id, mimeType: entry.blob.type, ref }]
      : [];
  });
}

export function markHeroGalleryMediaRefsUsed(refs: readonly string[]) {
  const now = Date.now();
  const active = new Set(refs);
  for (const ref of active) {
    const entry = entries.get(ref);
    if (entry) entry.lastUsed = now;
  }

  if (gcTimer !== null) clearTimeout(gcTimer);
  gcTimer = setTimeout(() => {
    const expiry = Date.now() - 5000;
    for (const [ref, entry] of entries) {
      if (active.has(ref) || entry.lastUsed > expiry) continue;
      entry.bitmap?.close();
      URL.revokeObjectURL(entry.objectUrl);
      entries.delete(ref);
    }
    publish();
  }, 5000);
}

export function subscribeHeroGalleryMedia(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHeroGalleryMediaSnapshot() {
  return revision;
}

export function getHeroGalleryMediaServerSnapshot() {
  return 0;
}
