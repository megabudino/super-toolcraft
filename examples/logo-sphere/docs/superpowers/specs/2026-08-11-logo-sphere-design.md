# Logo Sphere — Product Design

## Product intent

Build a Toolcraft editor that arranges uploaded logo cards on a convincing three-dimensional sphere. Logos shrink with depth, fade near the rear silhouette and the outer mask, and preserve their square authored artwork. Users can drag the sphere directly on the canvas, release it with inertia, play a seamless rotation from the Toolcraft timeline, change the number and spacing of visible logos, replace or reorder the source images, and export the current frame as a PNG.

The supplied screenshot is distant visual inspiration only: it establishes clean white logo cards and soft edge fading, but it is not a layout or runtime reference to clone. The 30 SVG files in `/Users/kusnizza/Desktop/logos/` are the explicit default source set.

## Experience and visual direction

- Default output is a 1920×1080 artboard with a warm white background and a centered spherical cluster.
- Logo cards are billboarded toward the viewer so brand marks remain readable. Depth is communicated through perspective scale, overlap, opacity, and draw order rather than card distortion.
- A Fibonacci sphere produces an even distribution without obvious rows. The current visible-count setting determines the number of sphere points; uploaded logos repeat cyclically when there are fewer images than points.
- Front cards are crisp and fully opaque. Rear cards become substantially smaller and dimmer along a depth curve that stays independent from the outer mask. A continuous pixel-level radial alpha mask clips the logo layer at the silhouette, so each card is feathered across its own pixels instead of disappearing when its center crosses a threshold. Mask size and feathering remain separately adjustable.
- Every supplied card stays vector-authored until the shared Canvas 2D preview/export draw. A configurable outline is drawn in screen pixels after perspective sizing, so its thickness does not grow on near cards or shrink on distant cards. Corner radius, shadow blur, and shadow offset represent card-space dimensions and therefore scale with perspective distance; rear-card opacity also attenuates the shadow.
- The canvas contains product output only. Upload, settings, timeline, history, zoom, radar, export, and reset stay in Toolcraft-owned surfaces.

## Interaction ownership

- `Canvas / sphere orbit`: primary direct manipulation. Dragging a visible logo cluster rotates the sphere; release continues with inertia. A canvas miss remains available to Toolcraft panning. The Toolcraft orientation gizmo shares the same orientation target and is never duplicated in the panel.
- `Panel / source collection`: upload, remove, and reorder source logo files through the built-in multi-image FileDrop.
- `Panel / exact appearance`: visible count, spread, card size, perspective, depth, fade mask, card contour, depth-aware corner radius/shadow, and motion behavior are panel-owned settings.
- `Timeline / transport`: play, pause, scrubbing, loop duration, and loop state use the top Toolcraft playback timeline. The renderer consumes normalized forward-only loop progress and produces a seamless 360-degree cycle.

## Controls and sections

Runtime Setup contains settings transfer, Background, Infinity canvas, Background color, finite canvas sizing, Resolution scale, and Timeline.

### Logos

- `Logo images`: multi-image FileDrop with the 30 supplied SVGs packaged as one runtime-attached vector atlas; the renderer expands it back to 30 independently projected cards. Uploads remain image-only and replace the supplied fallback collection until removed.

### Sphere

- `Visible logos`: integer workload control, 6–72, default 30.
- `Spread`: sphere radius multiplier, default 1.
- `Logo size`: base billboard size before depth scaling.
- `Depth`: Z-axis fullness and front/rear separation; lower values flatten the cluster, higher values create a rounder ball with stronger depth contrast.
- `Perspective`: camera-distance factor controlling front/rear scale contrast; the default favors a visibly spherical silhouette.
- `Distribution`: Fibonacci or Rings; Fibonacci is the default and quality baseline.

### Fade mask

- `Mask size`: radius at which outer fading begins.
- `Feather`: width/softness of the radial transition.
- `Rear opacity`: minimum opacity of the far hemisphere.

### Card style

- `Stroke width`: 0–8 px outline drawn after perspective projection, so near and far cards keep the same visible thickness.
- `Stroke color`: outline color without recoloring the authored logo.
- `Corner radius`: base card-space radius; its visible pixel radius follows the same perspective scale as the SVG card.
- `Shadow opacity`, `Shadow blur`, and `Shadow offset`: define the camera-facing card shadow. Blur and offset scale with card depth, while card depth opacity naturally weakens distant shadows.
- `Shadow color`: configurable independently from the outline.

### Motion

- `Spin axis`: Vertical, Diagonal, or Horizontal.
- `Spin amount`: revolutions per timeline loop, default 1.
- `Inertia`: release damping after pointer orbit.

### Background and export

- The authored Background source section provides `export.includeBackground` and `appearance.background`; Toolcraft consumes it into Setup.
- Image export only. The user did not request video delivery, so Video Export is absent even though the preview is animated.
- Image Export exposes PNG/JPG and 2K/4K/8K settings, with sticky `Export PNG` as the single final product action.

Every control is always applicable. The four authored entities stay in separate semantic sections and no operation is mirrored across panel and canvas.

## Architecture

- `app-schema.ts` declares the Toolcraft shell, runtime Setup metadata, playback timeline, controls, default media, export actions, and persistence.
- `logo-sphere-model.ts` is a pure deterministic domain module. It generates Fibonacci/ring points, rotates points from the shared orientation plus timeline phase, performs perspective projection and depth sorting, computes a stronger front/rear scale and opacity curve, and exposes deterministic radial-mask geometry.
- `logo-sphere-renderer.ts` is the canonical Canvas 2D drawing kernel shared by live preview and image export. It draws each depth-sorted SVG inside a perspective-scaled rounded clip, renders a depth-scaled shadow, adds a non-scaling screen-pixel outline, applies one `destination-in` radial gradient to the complete card layer, and places the enabled background behind the masked result.
- `logo-sphere-canvas.tsx` owns image resource preparation, the retina Canvas 2D backing, pipeline pass execution, timeline rendering, and direct orbit/inertia integration.
- `logo-sphere-pipeline.ts` compiles the one canonical renderer registration used by preview, performance assessment, fixtures, and composition.
- `app-composition.tsx` supplies `canvasContent`, `exportRenderer`, `sceneBoundsProvider`, `rendererPipelineRegistration`, and disables generic image preview because the custom renderer owns the uploaded images.

Runtime state remains the single source of truth for product settings, media order/transforms, canvas, panels, orientation, timeline, and persistence. Transient pointer velocity may remain renderer-local because it is simulated motion, but every committed orientation update writes the shared Toolcraft orientation target.

## Rendering and performance model

Grid stacking is rear hemisphere first, then a fixed descending point-index sticker order within each hemisphere; preview, orbit, playback, and export share this order, while Fibonacci/Rings retain centre-depth ordering and detail/opacity decisions always use actual `z`.

Canvas 2D is selected because the authored output contains at most 72 camera-facing vector cards and needs pixel-identical preview/export semantics. The supplied SVGs are decoded once through one source-bound atlas, then cropped as independent cards without per-frame SVG parsing. Each card uses one rounded clip, one shadowed fill, one SVG draw, and one constant-width outline before the renderer performs one frame-bounded radial alpha composite. Layout recomputes only when distribution or visible count changes; projection/composite updates on orbit, timeline, appearance controls, canvas frame, or source changes.

The performance envelope has one schema-backed workload dimension: visible logo count, interactive maximum 72. Export resolution is runtime-owned functional artifact coverage rather than an inferred measured-performance request. The selected resolution scale remains exact: live canvas backing must equal CSS size × devicePixelRatio × selected scale during interaction, playback, and steady state.

Animated work is coalesced through one requestAnimationFrame loop and pauses non-essential timeline redraw during Toolcraft viewport gestures. The renderer never lowers selected quality or visible count to meet budgets.

## Error and empty-state behavior

- Default assets mean the initial product has real content. If users remove all images, the canvas remains neutral with no fabricated placeholder or CTA.
- Unavailable or not-yet-decoded images are skipped without breaking the sphere; the renderer retries when resources become ready.
- Invalid scene bounds or export prerequisites are reported through Toolcraft runtime feedback; product code does not create its own download path.
- Reset restores supplied default logo assets and every control default. Reload restores values, media order, orientation, timeline, canvas, and panel state through runtime persistence.

## Acceptance and verification

Verification tier: Tier 4

Reason: this is the first complete product delivery and introduces schema, default media, a custom animated Canvas 2D renderer, direct spatial interaction, timeline, export, persistence, and product-specific verification.

Run: `pnpm ai:check` during development; focused Vitest tests for projection/layout; focused browser checks for controls, orbit, animation, media, render-scale backing, and export; one bare `npm run verify:delivery` at the coherent boundary; then `npm run dev` and a final browser pass.

Skip: measured performance and `npm run verify:perf`, because the request is product creation rather than a localized performance complaint or an explicit full performance audit. Video artifact checks are excluded because video delivery was not requested.

Acceptance proves:

- all 30 supplied SVG defaults contribute distinct projected card pixels through the attached atlas source;
- visible count changes the number of projected cards;
- sphere parameters change scale, spread, pronounced front/rear depth, and pixel-feathered mask outcomes without whole-card popping;
- stroke thickness remains constant across depth while corner radius, shadow blur, and shadow offset follow perspective scale;
- canvas drag and orientation gizmo update one shared orbit target;
- timeline playback changes product pixels and stitches forward-only at the loop seam;
- media reorder/removal/upload affects preview and export;
- selected render scale produces exact backing pixels during interaction, playback, and steady state;
- PNG/JPG export uses selected dimensions, background intent, and non-empty logo output;
- reset, undo/redo, persistence, and real reload preserve or restore their owned state.

## Explicit non-goals

- No video export, keyframe editing, layers panel, per-logo spatial editing, light simulation, or WebGL shader effects in this delivery. Card style is global across the sphere.
- No clone of the supplied screenshot's grid layout.
- No panel-based duplicate of sphere orbit or timeline transport.

## Unified renderer update — 2026-09-08

Approved implementation plan: `../plans/2026-09-08-unified-webgl-sphere-renderer.md`.
One full-quality WebGL2 surface replaces the three Canvas/motion quality tiers. Grid uses the existing curved surface mapper; Fibonacci and Rings retain their camera-facing geometry. Rounded clipping, constant scene-width strokes, cached depth-scaled shadows, source transforms, depth ordering, and one final radial mask are present during pause, playback, and orbit. Texture resources are retained, and backing stays at CSS × devicePixelRatio × selected scale. Export reuses this GPU renderer as an intermediate raster frame before the runtime-owned image compositor. Full Canvas 2D remains a capability fallback only. No extra controls, timeline, layers, persistence, or camera behavior changes are introduced.
