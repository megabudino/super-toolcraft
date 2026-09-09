interface FineDetailsTrailMediaMessageItem {
  blob: Blob;
  id: string;
  mimeType: string;
  ref: string;
}

export interface FineDetailsTrailMediaEntry {
  height: number;
  id: string;
  lastUsed: number;
  objectUrl: string;
  ref: string;
  status: 'decoding' | 'error' | 'ready';
  warmup?: HTMLImageElement;
  width: number;
}

const entries = new Map<string, FineDetailsTrailMediaEntry>();
const listeners = new Set<() => void>();
let revision = 0;
let gcTimer: ReturnType<typeof setTimeout> | null = null;
let warmupQueue = Promise.resolve();

function publish() {
  revision += 1;
  for (const listener of listeners) listener();
}

function releaseEntry(entry: FineDetailsTrailMediaEntry) {
  const warmup = entry.warmup;
  entry.warmup = undefined;
  warmup?.removeAttribute('src');
  URL.revokeObjectURL(entry.objectUrl);
}

async function warmupEntry(entry: FineDetailsTrailMediaEntry) {
  if (entries.get(entry.ref) !== entry || entry.status !== 'ready') return;

  try {
    const warmup = new Image();
    warmup.decoding = 'async';
    warmup.src = entry.objectUrl;
    entry.warmup = warmup;
    await warmup.decode();
  } catch {}
}

function enqueueWarmup(entry: FineDetailsTrailMediaEntry) {
  warmupQueue = warmupQueue.then(() => warmupEntry(entry));
}

async function decodeEntry(entry: FineDetailsTrailMediaEntry, blob: Blob) {
  try {
    if (typeof createImageBitmap === 'function') {
      const derivative = await createImageBitmap(blob);
      entry.width = derivative.width;
      entry.height = derivative.height;
      derivative.close();
    } else {
      const dimensions = await new Promise<{ height: number; width: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ height: image.naturalHeight, width: image.naturalWidth });
        image.onerror = () => reject(new Error('Could not decode the trail image.'));
        image.src = entry.objectUrl;
      });
      entry.width = dimensions.width;
      entry.height = dimensions.height;
    }
    entry.status = 'ready';
    enqueueWarmup(entry);
  } catch {
    entry.status = 'error';
  }
  publish();
}

export function ingestFineDetailsTrailMedia(images: readonly FineDetailsTrailMediaMessageItem[]) {
  for (const image of images) {
    if (!(image.blob instanceof Blob) || image.ref.length === 0) {
      continue;
    }

    const previous = entries.get(image.ref);
    if (previous) releaseEntry(previous);

    const entry: FineDetailsTrailMediaEntry = {
      height: 0,
      id: image.id,
      lastUsed: Date.now(),
      objectUrl: URL.createObjectURL(image.blob),
      ref: image.ref,
      status: 'decoding',
      width: 0,
    };
    entries.set(image.ref, entry);
    void decodeEntry(entry, image.blob);
  }
  publish();
}

export function getFineDetailsTrailMediaEntry(ref: string) {
  return entries.get(ref);
}

export function clearFineDetailsTrailMedia() {
  if (gcTimer !== null) clearTimeout(gcTimer);
  gcTimer = null;
  for (const entry of entries.values()) releaseEntry(entry);
  entries.clear();
  publish();
}

export function markFineDetailsTrailMediaRefsUsed(refs: readonly string[]) {
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
      releaseEntry(entry);
      entries.delete(ref);
    }
    publish();
  }, 5000);
}

export function subscribeFineDetailsTrailMedia(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFineDetailsTrailMediaSnapshot() {
  return revision;
}

export function getFineDetailsTrailMediaServerSnapshot() {
  return 0;
}
