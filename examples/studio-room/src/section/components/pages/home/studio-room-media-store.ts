interface StudioRoomMediaMessageItem {
  blob: Blob;
  id: string;
  mimeType: string;
  ref: string;
}

interface StudioRoomMediaEntry {
  id: string;
  objectUrl: string;
  ref: string;
}

const entries = new Map<string, StudioRoomMediaEntry>();
const listeners = new Set<() => void>();
const activeRefs = new Set<string>();
let hasActiveRefSnapshot = false;
let revision = 0;

function publish() {
  revision += 1;
  for (const listener of listeners) listener();
}

function release(entry: StudioRoomMediaEntry) {
  URL.revokeObjectURL(entry.objectUrl);
}

export function ingestStudioRoomMedia(images: readonly StudioRoomMediaMessageItem[]) {
  let changed = false;

  for (const image of images) {
    if (!(image.blob instanceof Blob) || !image.mimeType.startsWith('image/') || !image.ref) {
      continue;
    }
    if (hasActiveRefSnapshot && !activeRefs.has(image.ref)) continue;

    const previous = entries.get(image.ref);
    if (previous) release(previous);

    entries.set(image.ref, {
      id: image.id,
      objectUrl: URL.createObjectURL(image.blob),
      ref: image.ref,
    });
    changed = true;
  }

  if (changed) publish();
}

export function setStudioRoomActiveMediaRefs(refs: readonly string[]) {
  hasActiveRefSnapshot = true;
  activeRefs.clear();
  for (const ref of refs) {
    if (ref) activeRefs.add(ref);
  }

  let changed = false;
  for (const [ref, entry] of entries) {
    if (activeRefs.has(ref)) continue;
    release(entry);
    entries.delete(ref);
    changed = true;
  }
  if (changed) publish();
}

export function clearStudioRoomMedia() {
  const hadEntries = entries.size > 0;
  if (hadEntries) {
    for (const entry of entries.values()) release(entry);
    entries.clear();
  }
  activeRefs.clear();
  hasActiveRefSnapshot = false;
  if (hadEntries) publish();
}

export function resolveStudioRoomMediaRef(ref: string) {
  return entries.get(ref)?.objectUrl ?? null;
}

export function subscribeStudioRoomMedia(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStudioRoomMediaSnapshot() {
  return revision;
}

export function getStudioRoomMediaServerSnapshot() {
  return 0;
}
