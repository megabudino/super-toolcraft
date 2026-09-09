# Fine Details Image Trail Design

## Goal

A cursor-driven image trail in the Fine Details section: while the mouse moves over the section, uploaded images spawn under the cursor one after another and fade away, forming a trail (reference: the supplied stacked-cards screenshot). The Toolcraft `fine-details` workspace uploads the images and tunes every parameter live; the website stays the only renderer.

## Context (checked 2026-08-24)

- The Toolcraft workspace exists at `recraft-tools/fine-details` (protocol v3): Background, Upper/Lower Typography, Prompt position, Prompt Shadow, sticky Apply/Reset. Its practice so far, recorded in every worklog entry, is implementation plus the user's manual review — automated checks are explicitly skipped at the user's request.
- The website receiver (`fine-details-preview-boundary.tsx`, channel `recraft.fine-details`, v3) supports `settings`, `save-settings` (PUT `/api/fine-details-settings` → `fine-details-applied-settings.json` + BroadcastChannel), `save-result`, `ready`. No media, no pointer yet.
- The section (`fine-details-section.tsx`) renders: background color → grid texture (`pointer-events-none`, z-auto) → `TRY IT` / `YOUR WAY` typography (`z-[1]`, pointer-transparent) → prompt plate `[data-fine-details-prompt]` (`z-10`, interactive `AiPromptInput`). No transform scaling: at narrow viewports the section just gets shorter (`min(height px, height/1920·100vw)`) and clips.
- The hero workspace already implements the upload→bridge media pattern to reuse: `fileDrop` → runtime media assets → presentation URLs → blobs → `media` postMessage → website `hero-gallery-media-store.ts` (ingest, decode ≤2048, objectURL, GC by used refs).
- The delivery receipt for this app does not exist yet (`pnpm verify:delivery` was never run) — consistent with the recorded practice.

## Assumptions (called out because the questionnaire answer covered only the workspace location)

| Topic | Assumption |
| --- | --- |
| «Корреляция размера» | Size falloff along the trail: the newest card is at base size, each older card scales down by a step; `0 %` keeps all cards equal. A velocity-linked size is a possible later control and is listed under Out of Scope. |
| Real website default | Trail parameters ride the existing Apply/Reset JSON, but images are runtime blobs and are **not** persisted by Apply. Without images the effect is dormant on the real homepage; committing a default image set is a separate future iteration. |
| Verification | Matches this app's recorded practice: implement, update the worklog, hand off for the user's manual review. The optional proof commands are listed in the plan for whenever the user wants them. |

## Behavior Model

- **Spawning.** The engine tracks a smoothed cursor point (spring, `Smoothness` ms, `bounce: 0` — same confirmed `framer-motion@11.18.2` mechanics as the pre-footer parallax spec). Whenever that point has travelled `Spacing` px since the last spawn, the next image (cycled through the uploaded list in media order) spawns centered at the point.
- **Card life.** Enter: fade/scale-in over `Fade in` ms with a random tilt within ±`Tilt`°. After `Lifetime` ms it exits: fade/scale-out over `Fade out` ms. At most `Length` cards are alive; spawning past the cap force-exits the oldest. Cards render as plain `<img>` (object URLs from the media store), decorative (`alt=""`, `aria-hidden`), inside a `pointer-events-none absolute inset-0 overflow-hidden` layer.
- **Size.** `Card size` sets the card height in px (width follows the image aspect). `Size falloff` (0–60 %) scales cards down by age rank as newer ones spawn; rank changes animate through the same motion values.
- **Shadow.** One shared setting for all cards, mirroring the existing Prompt Shadow control set exactly: switch, offset pad (±1 → ×48 px), blur, spread, color+opacity → one `box-shadow` on every card wrapper.
- **Z-order.** The trail layer mounts immediately after the grid `div` with no z-index: above the background and grid (later sibling), below the `z-[1]` typography and the `z-10` prompt — «над фоном, под всеми элементами».
- **Prompt suppression.** The engine hit-tests the cursor against the `[data-fine-details-prompt]` rect (measured per pointer event). Inside: no spawning; live cards finish naturally. After leaving, spawning stays off for `Resume delay` ms and then returns with a `Resume ramp`: during the ramp the enter opacity/scale of new cards multiplies by an easing 0→1, so the trail starts softly. Re-entering the rect resets the timer.
- **Gates.** Master switch off, `prefers-reduced-motion: reduce`, touch pointers, or an empty image list → nothing spawns. Reduced motion reuses the shared hook pattern already present in the repo.

## Pointer Sources

Coordinates travel in section/scene pixels `{ x: 0..1920, y: 0..height }` — inside the preview iframe the layout viewport is exactly the 1920 × height wrapper, so Toolcraft pixels and section pixels coincide; on the real site the engine measures the live section rect.

- Website / standalone route: `pointermove`/`pointerleave`/`pointercancel` listeners attached to the parent `<section>` from the trail layer's own ref (`closest('section')` in an effect) — the section component stays a Server Component.
- Toolcraft: the iframe stays pointer-transparent; the product wrapper forwards a frame-coalesced `pointer` message (`buttons === 0` only, leave → `active: false`), exactly like the pre-footer parallax design; a module-level pointer bridge store on the website feeds the same engine input.

## Settings Model (protocol v3 → v4)

`FineDetailsSettings` gains one atomic `trail` group; old applied JSON stays valid because the normalizer fills missing fields with defaults.

```ts
interface FineDetailsTrailShadowSettings {          // identical shape to the prompt shadow
  blur: number; colorOpacity: { hex: string; opacity: number };
  enabled: boolean; offset: { x: number; y: number }; spread: number;
}

interface FineDetailsTrailSettings {
  enabled: boolean;
  cardSize: number;      // px height, 40..400, default 160
  length: number;        // alive cards, 2..24, default 8
  sizeFalloff: number;   // %, 0..60, default 12
  spacing: number;       // px between spawns, 10..300, default 90
  tilt: number;          // deg, 0..30, default 6
  smoothness: number;    // ms cursor spring, 0..1000, default 200
  lifetime: number;      // ms, 200..10000, default 1200
  fadeIn: number;        // ms, 0..1000, default 150
  fadeOut: number;       // ms, 100..2000, default 400
  resumeDelay: number;   // ms, 0..2000, default 300
  resumeRamp: number;    // ms, 0..2000, default 500
  images: readonly { height: number; id: string; ref: string; width: number }[]; // ordered; blobs travel separately
  shadow: FineDetailsTrailShadowSettings; // defaults mirror the prompt shadow defaults
}
```

Messages (all bump to `version: 4` on both sides): existing `settings` / `save-settings` / `save-result` / `ready` carry the extended payload; new `media` (Toolcraft → website: `{ blob, id, mimeType, ref }[]`, hero shape) and new `pointer` (Toolcraft → website: `{ x, y, active }` in scene px).

Apply/Reset keep working unchanged: the trail numbers persist into `fine-details-applied-settings.json`; `images` is stripped before persisting (runtime-only), and the API normalizer accepts the payload with or without it.

## Toolcraft Controls (four new sections, 18 new controls)

| Section | Entity | Controls |
| --- | --- | --- |
| `Trail Images` | uploaded trail image set | `Images` fileDrop (`trail.images`, multiple, image, hardMax 24, recommended 16, applicability always) |
| `Trail` | image trail, workflowStage `geometry` | `Active` switch (`trail.enabled`); then conditional on it: `Card size`, `Length`, `Size falloff`, `Spacing`, `Tilt` sliders |
| `Trail Motion` | image trail, workflowStage `timing`, same `entityId` + splitReason (12 behavior controls exceed the 10-control section cap) | conditional on `trail.enabled`: `Smoothness`, `Lifetime`, `Fade in`, `Fade out`, `Resume delay`, `Resume ramp` sliders |
| `Trail Shadow` | shared card shadow | mirror of Prompt Shadow: `Shadow` switch (conditional on `trail.enabled`); `Shadow offset` vector, `Shadow blur`, `Shadow spread`, `Shadow color` colorOpacity (conditional on trail + shadow switches) |

Order roles: switches `mode`, sliders `strength`, vector/colorOpacity default — non-decreasing ranks per section. Segmented budget: n/a. All `performanceRole: "responsiveness"`. The layer/timeline panels stay absent; the trail card pool is engine state, not runtime layers.

Rejected alternatives: `collectionActions` for images (upload set is exactly the hero fileDrop media pattern; per-item value editing is not needed); a canvas-drawn Toolcraft copy of the trail (duplicate renderer, repository boundary); `pointer-events: auto` on the iframe (kills runtime pan/zoom); CSS `:hover` suppression on the plate (invisible to the bridge pointer — rect hit-testing serves both input paths); spawning from raw cursor without a spring (jittery trail, and «плавность» was explicitly requested).

## Evidence & Diagnostics

Same pixel-based reality as the pre-footer parallax spec: `expectToolcraftProductObservableToChange` hashes wrapper screenshots, so any future browser proof must arm the trail first (upload fixtures, set `Lifetime` high, move the mouse over the canvas, keyboard-only control edits). Diagnostic attributes: wrapper `data-fine-details-trail` (payload signature) and imperative `data-fine-details-pointer`; website layer `data-fine-details-trail="off|idle|active|suppressed"`, per-card `data-trail-card`. These are listed for the optional proof path; the default gate for this app remains the user's manual review.

## Out of Scope

- Persisting uploaded images to the website repository (default image set for the real homepage) — future iteration on top of Apply.
- Velocity-linked card size, per-image size/rotation overrides, click bursts, scroll-driven spawning.
- Any change to the existing v3 controls, prompt, typography, or Apply/Reset flow beyond the payload extension.
- Export, layers, timeline.
