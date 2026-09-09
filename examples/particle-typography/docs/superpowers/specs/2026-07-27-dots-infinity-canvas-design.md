# Dots Animation Infinity Canvas Design

## Goal

Add the runtime-owned Infinity canvas mode to Dots Animation while preserving
the existing finite 1080×1350 default, deterministic particle animation,
background rules, persistence, and image/video export behavior.

## Verification Classification

Verification lifecycle: ordinary delivery with a broad generated-framework
refresh.

Reason: The app must refresh its signed generated Toolcraft framework copy and
adapt a custom Canvas 2D renderer plus PNG and video export to the new
world-space scene-bounds contract.

Run: focused Vitest coverage for schema, scene bounds, renderer/export mapping,
and acceptance; focused Playwright coverage for mode/restoration and bounded
image/video export; one protected `npm run verify:delivery`; then
`npm run dev` and an agent-controlled browser check.

Skip: full `npm run verify:perf` because the request is functional canvas
behavior, not an explicit full-performance certification request.

## Existing State And Root Cause

- `appSchema.canvas.sizing.mode` is already `editable-output`, which is the
  correct product contract.
- The generated app contains an older signed Toolcraft runtime that predates
  `canvas.infinity`, so changing the product schema alone cannot expose the
  control.
- Product code must not patch `src/toolcraft` or recreate the switch in an
  app-authored section.

## Considered Approaches

1. Refresh the generated framework copy from the current monorepo starter and
   adapt the product renderer to the current Infinity contract. This is the
   selected approach because it preserves signed integrity and keeps shared
   behavior runtime-owned.
2. Add a product `switch` that writes a local Infinity-like value. Rejected
   because it duplicates a runtime Setup target and cannot remove the real
   artboard safely.
3. Patch the copied files under `src/toolcraft`. Rejected because generated
   runtime source is immutable and protected by the integrity manifest.

## Architecture

### Framework Refresh

Generate a fresh standalone app from the current `primeui-v2` starter in a
temporary directory. Synchronize its signed framework, runtime, UI, contract
docs, host, verification scripts, and integrity metadata into Dots Animation
while preserving the app's product-owned source, tests, worklog, specs, plans,
package identity, and local verification state. Reinstall only if the refreshed
dependency manifest or lockfile changes.

### Runtime Setup Ownership

Keep `canvas.sizing.mode: "editable-output"` in `app-schema.ts`. The refreshed
runtime inserts `canvas.infinity` in the mandatory Setup block. Timeline and
Infinity canvas share the runtime-owned Timeline-first row, and the product
does not declare either control.

The existing persistence policy already includes `canvas`, so finite/infinite
mode, dormant finite size, zoom, and offset restore through the runtime
persistence path.

### Canonical Dots Scene Bounds

Add one product-owned scene-bounds module. It reads the same committed
Toolcraft state and deterministic dot plan used by rendering.

- For a still frame, it evaluates all dot centers, maximum visible radii,
  glow extent, and active trail samples at the current timeline progress.
- For video, it evaluates the exact bounded 30 fps export-frame sequence over the requested
  time range and unions every sampled frame into one stable envelope.
- Coordinates are world-space with the dormant finite canvas centered on the
  Toolcraft world origin.
- Bounds are padded only by visible dot, glow, and trail extents; the
  configurable product background does not expand the infinite scene.
- Invalid or empty data returns no rectangle, allowing the runtime to produce
  its typed scene-bounds failure.

`appComposition.sceneBoundsProvider` exposes this calculation through the
supported runtime boundary.

### Preview Rendering

Finite mode remains unchanged: the renderer fills the runtime finite canvas.

In infinite mode:

- the runtime removes the finite artboard and sizing controls;
- `shouldIncludeToolcraftPreviewBackground` suppresses the product background;
- the product canvas is positioned at the current world-space scene bounds;
- the render context translates the existing local dot coordinates into that
  tight canvas, so dots, glow, and trails are not clipped by the dormant finite
  frame.

No canvas UI, helper text, or product-authored toggle is added.

### Image And Video Export

Both sticky actions resolve the export frame through
`context.resolveSceneExportFrame`.

- PNG resolves the current-time scene frame and passes it to
  `createToolcraftPngExportCanvas`. Both normal and streamed PNG rendering
  translate local dot coordinates through the resolved world-space frame.
- Video resolves one scene frame for the entire `0..duration` time range,
  passes it to `getToolcraftVideoExportSize`, and uses the same transform for
  every encoded frame.
- Finite exports retain the full finite canvas frame.
- Infinite exports use the tight product envelope.
- PNG respects Include; video always keeps the configured background.

## Acceptance And Tests

Typed acceptance contains three runtime entries:

- `mode-and-restoration` with viewport-side-effect evidence;
- `scene-bounds-image-export` with exported-bytes evidence;
- `scene-bounds-video-export` with exported-bytes evidence.

Focused browser proof must establish:

1. Infinity canvas appears in Setup.
2. Enabling it removes the finite artboard and finite size controls.
3. The scene remains visible, transparent outside product pixels, pannable,
   undoable/redoable, persisted through reload, and returns to the exact
   dormant finite size when disabled.
4. Infinite PNG dimensions match the current scene bounds rather than the
   finite 1080×1350 frame.
5. Infinite video uses one nonempty time-range envelope, preserves duration and
   background, and differs from finite output dimensions.

Scene-bounds unit tests cover current-frame bounds, time-range union,
world-space centering, glow/trail padding, and deterministic output.

## Worklog And Impact Ownership

Record one Decision Trail entry with the request, refreshed framework source,
contract rules, state/output mapping, rejected local-control/runtime-patch
alternatives, verification command, and remaining risks.

The new scene-bounds module is performance-owned by preview, image export, and
video export passes. Schema, acceptance metadata, and composition wiring remain
functional ownership unless measurement shows a renderer-pass semantic change.
