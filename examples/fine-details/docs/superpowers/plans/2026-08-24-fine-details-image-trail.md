# Fine Details Image Trail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cursor-driven, uploaded-image trail to Fine Details, controlled live from Toolcraft and rendered only by the website beneath all existing content.

**Architecture:** Extend the atomic Fine Details settings contract to protocol v4, while sending image blobs and pointer positions as separate runtime-only messages. A focused client-side trail engine in the Next.js site consumes settings, a media object-URL store, and either local section pointer events or the Toolcraft pointer bridge; the existing server-rendered section remains the layout owner.

**Tech Stack:** React 19, Next.js 16 App Router, TypeScript, Toolcraft runtime, `postMessage`, `BroadcastChannel`, existing `motion@11.16.3` via `motion/react`, Tailwind CSS v4.

**Execution constraint:** Preserve the app's established workflow: update source contracts and worklog, then hand off for manual review. Do not run tests, lint, typecheck, build, browser automation, formatting, delivery verification, commit, or push unless the user later asks.

**FileDrop contract note:** The current Toolcraft image `fileDrop` owns built-in rotate/flip lifecycle even without Layers. Carry that transform metadata through the runtime-only image records and consume it in the card renderer so the app does not claim false media evidence. This adds no separate per-image control section and does not persist transforms to the website JSON.

---

### Task 1: Define the canonical trail settings and media mapping

**Files:**
- Create: `recraft-tools/fine-details/src/app/fine-details-trail-values.ts`

- [ ] **Step 1: Define targets, types, ranges, and defaults**

```ts
import type { ToolcraftMediaAsset } from "@/toolcraft/runtime";

export const fineDetailsTrailTargets = {
  cardSize: "trail.cardSize",
  enabled: "trail.enabled",
  fadeIn: "trail.fadeIn",
  fadeOut: "trail.fadeOut",
  images: "trail.images",
  length: "trail.length",
  lifetime: "trail.lifetime",
  resumeDelay: "trail.resumeDelay",
  resumeRamp: "trail.resumeRamp",
  shadowBlur: "trail.shadow.blur",
  shadowColorOpacity: "trail.shadow.colorOpacity",
  shadowEnabled: "trail.shadow.enabled",
  shadowOffset: "trail.shadow.offset",
  shadowSpread: "trail.shadow.spread",
  sizeFalloff: "trail.sizeFalloff",
  smoothness: "trail.smoothness",
  spacing: "trail.spacing",
  tilt: "trail.tilt",
} as const;

export type FineDetailsTrailImage = Readonly<{
  height: number;
  id: string;
  ref: string;
  transform: Readonly<{
    flipHorizontal: boolean;
    flipVertical: boolean;
    rotationDeg: 0 | 90 | 180 | 270;
  }>;
  width: number;
}>;

export type FineDetailsTrailSettings = Readonly<{
  cardSize: number;
  enabled: boolean;
  fadeIn: number;
  fadeOut: number;
  images: readonly FineDetailsTrailImage[];
  length: number;
  lifetime: number;
  resumeDelay: number;
  resumeRamp: number;
  shadow: Readonly<{
    blur: number;
    colorOpacity: Readonly<{ hex: string; opacity: number }>;
    enabled: boolean;
    offset: Readonly<{ x: number; y: number }>;
    spread: number;
  }>;
  sizeFalloff: number;
  smoothness: number;
  spacing: number;
  tilt: number;
}>;

export const FINE_DETAILS_TRAIL_DEFAULTS: FineDetailsTrailSettings = {
  cardSize: 160,
  enabled: true,
  fadeIn: 150,
  fadeOut: 400,
  images: [],
  length: 8,
  lifetime: 1200,
  resumeDelay: 300,
  resumeRamp: 500,
  shadow: {
    blur: 40,
    colorOpacity: { hex: "#000000", opacity: 35 },
    enabled: true,
    offset: { x: 0, y: 0.125 },
    spread: 0,
  },
  sizeFalloff: 12,
  smoothness: 200,
  spacing: 90,
  tilt: 6,
};
```

- [ ] **Step 2: Add bounded values and ordered image metadata adapters**

Export `createFineDetailsTrailImagesFromMediaAssets(mediaAssets)` and
`createFineDetailsTrailFromValues(values, images)`. The image adapter filters to ready/restoring image assets whose `sourceTarget` is `trail.images`, preserves runtime order, maps `asset.size`, `id`, `resourceRef`, and normalized rotate/flip metadata, and caps the array at 24. The settings adapter uses these exact bounds:

```ts
cardSize: 40..400
length: 2..24, rounded
sizeFalloff: 0..60
spacing: 10..300
tilt: 0..30
smoothness: 0..1000
lifetime: 200..10000
fadeIn: 0..1000
fadeOut: 100..2000
resumeDelay: 0..2000
resumeRamp: 0..2000
shadow.blur: 0..100
shadow.offset.x/y: -1..1
shadow.spread: -32..32
shadow.colorOpacity.opacity: 0..100
```

Invalid or missing values fall back to `FINE_DETAILS_TRAIL_DEFAULTS`; valid numbers are clamped. Uppercase six-digit hex values are accepted for the shadow color.

### Task 2: Add the four Toolcraft control sections

**Files:**
- Create: `recraft-tools/fine-details/src/app/fine-details-trail-control-sections.ts`
- Modify: `recraft-tools/fine-details/src/app/app-schema.ts`

- [ ] **Step 1: Build reusable exact slider and applicability records**

```ts
const always = { mode: "always" } as const;
const trailActive = {
  all: [{ equals: true, target: fineDetailsTrailTargets.enabled }],
  mode: "conditional",
} as const;
const trailShadowActive = {
  all: [
    { equals: true, target: fineDetailsTrailTargets.enabled },
    { equals: true, target: fineDetailsTrailTargets.shadowEnabled },
  ],
  mode: "conditional",
} as const;

function trailSlider(options: {
  applicability: typeof trailActive | typeof trailShadowActive;
  defaultValue: number;
  label: string;
  max: number;
  min: number;
  step: number;
  target: string;
  unit: "%" | "deg" | "ms" | "px";
}) {
  return {
    ...options,
    orderRole: "strength" as const,
    performanceReason: `${options.label} must update the website trail immediately.`,
    performanceRole: "responsiveness" as const,
    sliderValueKind: "continuous" as const,
    type: "slider" as const,
    variant: "continuous" as const,
  };
}
```

- [ ] **Step 2: Export `fineDetailsTrailControlSections` with all 18 controls**

Create the sections in this exact order and with these exact settings:

| Section | Control | Target | Range / type |
| --- | --- | --- | --- |
| Trail Images | Images | `trail.images` | `fileDrop`, image, multiple, default `[]`, hard max 24, recommended max 16 |
| Trail | Active | `trail.enabled` | always-visible switch, `orderRole: "mode"` |
| Trail | Card size | `trail.cardSize` | 40–400px, step 1 |
| Trail | Length | `trail.length` | 2–24, step 1 |
| Trail | Size falloff | `trail.sizeFalloff` | 0–60%, step 1 |
| Trail | Spacing | `trail.spacing` | 10–300px, step 1 |
| Trail | Tilt | `trail.tilt` | 0–30deg, step 1 |
| Trail Motion | Smoothness | `trail.smoothness` | 0–1000ms, step 10 |
| Trail Motion | Lifetime | `trail.lifetime` | 200–10000ms, step 50 |
| Trail Motion | Fade in | `trail.fadeIn` | 0–1000ms, step 10 |
| Trail Motion | Fade out | `trail.fadeOut` | 100–2000ms, step 10 |
| Trail Motion | Resume delay | `trail.resumeDelay` | 0–2000ms, step 10 |
| Trail Motion | Resume ramp | `trail.resumeRamp` | 0–2000ms, step 10 |
| Trail Shadow | Shadow | `trail.shadow.enabled` | switch conditional on `trail.enabled`, `orderRole: "mode"` |
| Trail Shadow | Shadow offset | `trail.shadow.offset` | screen vector conditional on both switches |
| Trail Shadow | Shadow blur | `trail.shadow.blur` | 0–100px, step 1 |
| Trail Shadow | Shadow spread | `trail.shadow.spread` | -32–32px, step 1 |
| Trail Shadow | Shadow color | `trail.shadow.colorOpacity` | colorOpacity conditional on both switches |

All controls except Images and Active use the applicability gates above. Reserve the shared acceptance entity id `fine-details-image-trail` for `Trail` and `Trail Motion`; Task 8 adds workflow stages `geometry` and `timing` plus an explicit split reason stating that twelve behavior controls exceed the ten-control section limit.

- [ ] **Step 3: Insert the sections after Background**

Import `fineDetailsTrailControlSections` in `app-schema.ts` and spread it immediately after the existing Background section. Keep the typography, prompt, prompt shadow, and Website sections unchanged.

### Task 3: Upgrade the Toolcraft protocol and render pipeline to v4

**Files:**
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-protocol.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-pipeline.ts`

- [ ] **Step 1: Extend settings and add media/pointer messages**

Set `FINE_DETAILS_PREVIEW_VERSION = 4`, add `trail: FineDetailsTrailSettings` to
`FineDetailsPreviewSettings`, and build it from values and ordered images. Add:

```ts
export type FineDetailsPreviewMediaItem = Readonly<{
  blob: Blob;
  id: string;
  mimeType: string;
  ref: string;
}>;

export type FineDetailsPreviewMediaMessage = Readonly<{
  channel: typeof FINE_DETAILS_PREVIEW_CHANNEL;
  images: readonly FineDetailsPreviewMediaItem[];
  type: "media";
  version: typeof FINE_DETAILS_PREVIEW_VERSION;
}>;

export type FineDetailsPreviewPointerMessage = Readonly<{
  channel: typeof FINE_DETAILS_PREVIEW_CHANNEL;
  payload: Readonly<{ active: boolean; x: number; y: number }>;
  type: "pointer";
  version: typeof FINE_DETAILS_PREVIEW_VERSION;
}>;
```

Export `createFineDetailsPreviewMediaMessage(images)` and
`createFineDetailsPreviewPointerMessage(pointer)` alongside the existing message creators.

- [ ] **Step 2: Register the media pass and trail invalidations**

Add every non-image trail target to `previewSettingsTargets`. Add a `media-sync` preprocess pass invalidated only by `trail.images`, and add a `media-import` interaction that invalidates both `media-sync` and `preview-sync`. Pan/zoom must invalidate neither pass. Advance the pipeline runtime id to `fine-details-external-preview-v4`.

### Task 4: Send runtime images and scene-pixel pointer input from Toolcraft

**Files:**
- Create: `recraft-tools/fine-details/src/app/fine-details-preview-media-sync.tsx`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.tsx`

- [ ] **Step 1: Implement the bounded media sync component**

Mirror the Hero media bridge: accept the filtered trail assets, iframe window, revision, and a sent-ref set; obtain presentation URLs with `useToolcraftMediaPresentationUrls`; fetch only unsent ready images with one abortable batch; post `createFineDetailsPreviewMediaMessage`; mark sent refs only after posting. Abort on unmount and clear sent refs when the iframe reloads.

- [ ] **Step 2: Build preview settings from canonical media order**

Select `state.mediaAssets`, filter by `fineDetailsTrailTargets.images`, derive image metadata with `createFineDetailsTrailImagesFromMediaAssets`, and pass those images into `createFineDetailsPreviewSettingsFromValues(values, height, images)`.

- [ ] **Step 3: Forward coalesced pointer positions in scene pixels**

Add wrapper refs equivalent to Pre-footer's bridge. On non-touch `pointermove` with `buttons === 0`, map the wrapper rect to `{x: 0..1920, y: 0..settings.height}`, retain only the latest point, and post at most once per animation frame. On leave/cancel/unmount/reload send `{active:false,x:0,y:0}` and cancel the pending frame.

Expose:

```tsx
data-fine-details-trail={JSON.stringify(settings.trail)}
data-fine-details-pointer={active ? `${x.toFixed(2)}:${y.toFixed(2)}` : "rest"}
```

Keep the iframe itself pointer-transparent so Toolcraft pan and zoom retain ownership.

### Task 5: Extend website settings while keeping old JSON and runtime-only images safe

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-applied-settings.json`
- Modify: `recraft-v4-styles/src/features/fine-details-settings/server/update-fine-details-settings.ts`

- [ ] **Step 1: Mirror the trail types, defaults, and bounds**

Add `FineDetailsTrailSettings` and `trail` to `FineDetailsSettings`, matching Task 1 exactly. Set `enabled: true`, `images: []`, numeric defaults from the spec, and prompt-shadow-equivalent shadow defaults.

- [ ] **Step 2: Normalize missing trail data compatibly**

Implement `normalizeTrail(value)` so an absent `trail` group and absent fields use defaults, preserving compatibility with existing v3 JSON. If a present field has the wrong type, reject it. Clamp numeric values to Task 1 bounds; cap images at 24; require finite non-negative dimensions, non-empty `id`/`ref` strings, boolean flips, and a rotation of 0/90/180/270.

- [ ] **Step 3: Define a persisted shape without image refs**

```ts
export type PersistedFineDetailsSettings = Omit<FineDetailsSettings, 'trail'> & {
  trail: Omit<FineDetailsTrailSettings, 'images'>;
};

export function createPersistedFineDetailsSettings(
  settings: FineDetailsSettings,
): PersistedFineDetailsSettings {
  const { images: _images, ...trail } = settings.trail;
  return { ...settings, trail };
}
```

Use this helper before the API writes JSON. The applied JSON contains the trail numbers and shadow but no `images` property. The normalizer reconstructs `images: []` when reading it.

### Task 6: Add website media/pointer stores and protocol receivers

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-trail-media-store.ts`
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-trail-pointer-store.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-preview-boundary.tsx`

- [ ] **Step 1: Add the media object-URL store**

Follow the Hero store lifecycle under Fine Details-specific names: ingest unique blob refs, create object URLs, decode dimensions with `createImageBitmap` capped to a 2048px longest edge, publish revision changes through `subscribe/getSnapshot`, mark active refs used, and after five seconds revoke URLs/delete entries not referenced by current settings. Expose only `status`, dimensions, id/ref, and `objectUrl` to the trail renderer.

- [ ] **Step 2: Add the pointer bridge store**

Store one immutable `{active,x,y}` snapshot with `useSyncExternalStore` helpers. Export `setFineDetailsTrailPointer`, `resetFineDetailsTrailPointer`, `subscribeFineDetailsTrailPointer`, and client/server snapshots; ignore non-finite coordinates.

- [ ] **Step 3: Validate and receive protocol v4 messages**

Set the boundary version to 4. Validate `media` batches as at most 24 Blob-backed image records, and `pointer` as a boolean plus finite scene coordinates. In the existing trusted-parent receiver, ingest media and update/reset the pointer store before handling settings and save commands. Reset pointer state when the boundary unmounts.

- [ ] **Step 4: Strip images during Apply without breaking the live iframe**

Send `createPersistedFineDetailsSettings(settings)` to the API. Normalize the returned persisted payload, then merge `requestedSettings.trail.images` back only into the current iframe state for Apply. Broadcast the persisted image-free settings to adjacent website tabs. Reset uses defaults and therefore clears the live image list.

### Task 7: Implement the website-owned image trail engine

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-section.tsx`

- [ ] **Step 1: Define the client engine state**

Use `motion/react` (`m`, `AnimatePresence`, `useMotionValue`, `useSpring`) and the existing `usePrefersReducedMotion` hook. Each spawned card records:

```ts
type TrailCard = {
  id: number;
  imageRef: string;
  rampStrength: number;
  rotation: number;
  x: number;
  y: number;
};
```

Keep one cyclic image index, one monotonic card id, the last spawn point, lifetime timeout ids, prompt suppression timestamps, and raw/smoothed pointer motion values. Rebuild the spring with `{ bounce: 0, duration: smoothness / 1000 }`; when smoothness is zero, write/read the raw point directly.

- [ ] **Step 2: Unify local and bridge pointer sources**

From the trail layer ref, attach `pointermove`, `pointerleave`, and `pointercancel` to `closest('section')`. Local events use live section pixels; touch input deactivates the engine. Subscribe to the bridge pointer store and prefer it while active. For every new point, measure `[data-fine-details-prompt]` relative to the section and update suppression state.

- [ ] **Step 3: Spawn, cap, expire, and rank cards**

On animation frames while active, spawn after the smoothed point travels at least `spacing`. Cycle configured image refs in their declared order, skipping entries not ready in the media store. Center the card at the point and select rotation uniformly within `±tilt`. Keep the newest `length` records and schedule removal after `lifetime`; clear all timers on unmount or when the feature gates off.

For age rank `0` newest, use:

```ts
const rankScale = Math.max(0.1, 1 - (rank * settings.sizeFalloff) / 100);
```

This prevents negative/inverted scales at the allowed 60% step while preserving the specified per-rank falloff.

- [ ] **Step 4: Implement prompt suppression and the resume envelope**

Inside the prompt: state is `suppressed` and no cards spawn. On exit, block spawning until `resumeDelay` elapses. During the following `resumeRamp`, capture
`easeOutCubic(clamp((now-rampStart)/resumeRamp,0,1))` as each new card's `rampStrength`; a zero ramp yields 1 immediately. Re-entry clears the pending resume window. Existing cards keep their natural lifetime and exit.

- [ ] **Step 5: Render the cards and diagnostics**

Render a `pointer-events-none absolute inset-0 overflow-hidden` layer. Each card is a centered motion wrapper with shared box shadow and a plain decorative `<img alt="" aria-hidden="true">`; card height is `cardSize` and width follows the transformed source aspect. Apply the uploaded record's 0/90/180/270 rotation and horizontal/vertical flips on an inner wrapper, while the outer motion wrapper owns random tilt and age scale. Enter uses `fadeIn`, exit uses `fadeOut`, and rank-scale changes animate as new records arrive.

Set layer state to `off`, `idle`, `active`, or `suppressed` through `data-fine-details-trail`; add `data-trail-card` to every wrapper. Gates producing `off`: disabled switch, reduced motion, touch source, or no images.

- [ ] **Step 6: Mount at the required z-order**

Render `<FineDetailsImageTrail settings={settings.trail} />` immediately after the grid div and before both `z-[1]` typography groups. Keep the prompt at `z-10`, do not change the section's responsive height/clipping, and do not make the trail layer interactive.

### Task 8: Update acceptance, performance, source snapshots, and worklog

**Files:**
- Modify: `recraft-tools/fine-details/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/fine-details/src/app/app-performance.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.product.test.ts`
- Modify: `recraft-tools/fine-details/e2e/product-fine-details-preview.spec.ts`
- Modify: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Declare every control and media lifecycle**

Add acceptance entries for all 18 controls. The Images entry uses `componentType: "fileDrop"`, `evidence: "media-lifecycle"`, interaction id `panel-trail-images`, and coverage for upload, remove, reset, rotate, flip, transform-output, reorder, and order-output. Add panel interaction ownership for the uploaded collection and scalar properties. Add section inventory entries for Trail Images, the shared Trail geometry/timing entity, and Trail Shadow with the exact targets and split metadata from Task 2.

- [ ] **Step 2: Describe bounded runtime cost**

Add a `trail-card-count` workload dimension sourced from `trail.length`, default 8, interactive max 24. Add the media-sync pass, object-URL/decode lifecycle, frame-coalesced pointer messages, reduced-motion gate, prompt hit-test, and bounded 24-card DOM pool to performance risks. Advance fixture/runtime copy to protocol v4.

- [ ] **Step 3: Update source-level protocol snapshots**

Update product-test expected section titles, protocol number, default trail shape, and media/pointer creators. Update the e2e Apply expectation so persisted settings include trail numbers/shadow but exclude images, and change save-result listeners to version 4. Add diagnostic source expectations for wrapper pointer/trail attributes and website trail states without executing the suite.

- [ ] **Step 4: Record the decision trail**

Append the requested effect, media/pointer ownership, protocol v4, runtime-only images, exact gates, DOM z-order, bounded performance model, and manual-review/no-checks instruction to `agent-worklog.md`.

### Task 9: Manual handoff and optional proof commands

**Files:**
- Review manually: Toolcraft `http://127.0.0.1:3006/`
- Review manually: Website `http://localhost:3000/`

- [ ] **Step 1: Hand off these manual checks**

Ask the user to upload mixed-aspect images, move over the canvas, cross the prompt, tune all four sections, verify reduced-motion/touch suppression if convenient, use Apply in an adjacent tab, and confirm Reset clears both the numeric settings and runtime images.

- [ ] **Step 2: Keep automated proof optional**

Do not run these commands in the normal delivery. If the user explicitly requests stronger verification later, use:

```bash
pnpm -C recraft-tools/fine-details exec vitest run src/app/fine-details-preview.product.test.ts
pnpm -C recraft-tools/fine-details exec playwright test e2e/product-fine-details-preview.spec.ts
```

Expected: protocol/settings/media/pointer source contracts pass, followed by a browser proof of upload, pointer spawning, suppression/resume, Apply, and Reset.
