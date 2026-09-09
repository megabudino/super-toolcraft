# Dither Reference Port Plan

## Product Goal

Port the public Dither pixel-effect behavior from `https://www.dither.com/` into this Toolcraft app while keeping the Toolcraft runtime shell, controls, media flow, canvas, toolbar, settings transfer, and export flow. The app is a still-image processor: users upload their own image and apply Dither-style Dither, Bayer Matrix, ASCII, Halftone, LEGO, and Dots effects. Saved presets, backgrounds, account/auth, compare, crop, video import/export, and shuffle/remix are not part of this port.

## Verification Note

Verification tier: Tier 4
Reason: Converts the neutral starter into a product app with schema controls, file upload, custom Canvas 2D renderer, PNG export, acceptance matrix, browser coverage, performance matrix, and worklog.
Run: `CI=true pnpm ai:check`, `pnpm verify:final`, `pnpm verify:perf` for the first working product checkpoint, then `pnpm dev`.
Skip: Video export checks because this implementation is a still-image product by request.

## Control Section Inventory

- Source: `source.image`; owns the user's custom image upload and media lifecycle.
- Effect: `effect.style`, `effect.size`, `effect.fill`, `effect.density`, `effect.exposure`, `effect.scatter`; owns the reference pixel-effect choice and core effect parameters.
- ASCII: `effect.ascii.mode`, `effect.ascii.glyphs`, `effect.ascii.customGlyphs`; owns ASCII-only glyph behavior and is visible only for ASCII.
- Layer: `effect.layer.opacity`, `effect.layer.blend`; owns effect overlay opacity and canvas compositing.
- Background: `export.includeBackground`, `appearance.background`; required product background controls before export settings.
- Image Export: `export.image.format`, `export.image.resolution`; required PNG/JPG and 2K/4K/8K image export settings.
- Export: sticky `Export PNG`; product delivery action only.

## Control Selection Inventory

Product need: custom source image
Value model: single image media import, preview, clear, reset
Candidate built-ins checked: `fileDrop`, `imagePicker`, `collectionActions`
Best built-in: `fileDrop`
Rejected alternatives: `imagePicker` chooses fixed assets; `collectionActions` is for user-owned repeatable item sets, not single source media.
Target: `source.image`
Required acceptance: upload, clear, reset remove source media and product output responds.

Product need: effect family
Value model: six plus none mutually exclusive modes with long labels
Candidate built-ins checked: `segmented`, `select`, `imagePicker`
Best built-in: `select`
Rejected alternatives: `segmented` exceeds option count and label-length limits; `imagePicker` is visual-asset choice, not a mode menu.
Target: `effect.style`
Required acceptance: option changes alter rendered pixels for reference modes.

Product need: reference numeric settings Size, Fill, Density, Exposure, Scatter, Opacity
Value model: bounded scalar ranges matching reference input ranges
Candidate built-ins checked: `slider`, `rangeSlider`, `rangeInput`
Best built-in: `slider`
Rejected alternatives: `rangeSlider` and `rangeInput` model lower/upper bounds; these are single values.
Targets: `effect.size`, `effect.fill`, `effect.density`, `effect.exposure`, `effect.scatter`, `effect.layer.opacity`
Required acceptance: changing each visible slider changes product output; workload controls get min/default/max performance coverage.

Product need: ASCII glyph mode and glyph set
Value model: compact mutually exclusive options; glyph set includes longer labels and custom value
Candidate built-ins checked: `segmented`, `select`, `text`
Best built-in: `select` for mode and glyph set, `text` for custom glyphs
Rejected alternatives: `segmented` for glyph set would clip and exceed option count; `code` is unnecessary for a short glyph string.
Targets: `effect.ascii.mode`, `effect.ascii.glyphs`, `effect.ascii.customGlyphs`
Required acceptance: ASCII mode, glyph set, and custom glyphs change product output when ASCII is active.

Product need: layer blend
Value model: canvas globalCompositeOperation choice
Candidate built-ins checked: `select`, `segmented`
Best built-in: `select`
Rejected alternatives: `segmented` has six choices and long labels.
Target: `effect.layer.blend`
Required acceptance: blend mode changes composited product pixels.

Product need: product background
Value model: include/exclude boolean plus free color
Candidate built-ins checked: `switch`, `checkbox`, `color`
Best built-in: `switch` plus `color`
Rejected alternatives: `checkbox` works but the required Toolcraft Background row uses a short Include switch.
Targets: `export.includeBackground`, `appearance.background`
Required acceptance: preview hides product background when Include is off; PNG alpha and background color export are proven.

Product need: image export format and resolution
Value model: compact dropdown workflow pair
Candidate built-ins checked: `select`, `segmented`
Best built-in: `select`
Rejected alternatives: `segmented` would not match required Image Export dropdown structure.
Targets: `export.image.format`, `export.image.resolution`
Required acceptance: exported file type and actual pixel dimensions change.

## Animation, Timeline, Layers, Persistence

- Animation Intent Inventory: mode `none`; effects are still image filters with no playback, scrub, duration, loop, or export-at-time behavior.
- Layers: disabled; the product has one source image and one generated effect layer, not user-editable layer objects.
- Persistence: localStorage for `values`, `canvas`, and `panels`; media blobs are intentionally not persisted.
- Settings transfer: `auto`; the app exceeds the complexity threshold and should import/export settings through the runtime Setup section.

## Renderer Technique Decision Matrix

- sourceRepresentation: `image-media`
- productRepresentation: `pixel`
- previewRenderer: `canvas-2d`
- exportRenderer: `canvas-2d`
- rendererWorkload: `pixel-output`
- rendererStrategy: `canvas-2d`
- whyNotAlternativeStrategies: DOM/SVG cannot reproduce per-pixel dithering and sampled raster effects; WebGL/WebGPU were evaluated as candidates by contract, but the reference source is Canvas 2D, first-port parity depends on matching its CPU canvas formulas exactly, and performance will be measured with 1920x1080 media, high-density controls, renderScale 2, viewport zoom, and export stress before delivery.
- fidelityRisks: browser font availability can shift ASCII glyph metrics; random scatter must be deterministic per render seed for stable previews/tests; export uses final output dimensions while preview uses renderScale backing pixels.
- performanceRisks: CPU pixel loops and dense ASCII can create long tasks on 4K/8K exports; preview must cache decoded media and coalesce work rather than re-decoding on every slider drag; keeping Canvas 2D requires measured WebGL/WebGPU alternative evidence through the first performance checkpoint.

Renderer Layer Inventory:

- productForegroundLayer: product effect canvas, kind `product-foreground`, content `bitmap-media`, `dense-pattern`, `text`, `composite`, renderer `canvas-2d`, primitive count `high`, export mode `included`, ui selector `[data-dither-output-canvas]`.
- exportComposite: offscreen export canvas, kind `export-composite`, content `bitmap-media`, `dense-pattern`, `text`, `composite`, renderer `canvas-2d`, primitive count `high`, export mode `included`.

## Render Pipeline Inventory

- Pass `decode-source`: decode current `source.image` media data URL into cached `HTMLImageElement`; cache key `source.image.mediaId`, `source.image.dataUrl`.
- Pass `sample-source`: draw source into a scaled sampling canvas and read `ImageData`; cache key `source.image.mediaId`, `canvas.size.width`, `canvas.size.height`, `canvas.renderScale`, `effect.style`, `effect.size`, `effect.density`.
- Pass `pixel-effect`: produce the effect overlay using Dither formulas; cache key `effect.style`, `effect.size`, `effect.fill`, `effect.density`, `effect.exposure`, `effect.scatter`, `effect.ascii.mode`, `effect.ascii.glyphs`, `effect.ascii.customGlyphs`, `canvas.renderScale`.
- Pass `composite-preview`: composite background, source image, and effect overlay with layer opacity/blend into the visible canvas; cache key `appearance.background`, `export.includeBackground`, `effect.layer.opacity`, `effect.layer.blend`, `canvas.renderScale`.
- Pass `export-image`: render the same pipeline into `createToolcraftPngExportCanvas`; cache key `export.image.format`, `export.image.resolution`, `export.includeBackground`, `appearance.background`, current source/effect state.

Interaction invalidation:

- `media-import` invalidates `decode-source`, `sample-source`, `pixel-effect`, `composite-preview`.
- `control-drag` for `effect.size`, `effect.fill`, `effect.density`, `effect.exposure`, `effect.scatter`, `canvas.renderScale` invalidates `sample-source`, `pixel-effect`, `composite-preview` and must not invalidate `decode-source`.
- `control-change` for `effect.style`, `effect.ascii.mode`, `effect.ascii.glyphs`, `effect.ascii.customGlyphs`, `effect.layer.opacity`, `effect.layer.blend`, `appearance.background`, `export.includeBackground`, `export.image.format`, `export.image.resolution` invalidates only the required downstream passes and must not invalidate `decode-source` unless source media changes.
- `viewport-drag` and `viewport-zoom` invalidate no render passes; Toolcraft transforms the canvas shell.
- `export` invalidates `export-image` only and reuses decoded source.

## Implementation Plan

1. Update `src/app/app-schema.ts` with product schema, controls, persistence, settings transfer, canvas render scale, and sticky export action.
2. Add `src/app/dither-effect.ts` with typed renderer/export helpers ported from Dither formulas.
3. Add `src/app/dither-renderer.tsx` with Toolcraft state/media consumption, preview canvas drawing, and `exportDitherImage`.
4. Update `src/routes/index.tsx` to render `ToolcraftApp` with `canvasContent`, `renderDefaultCanvasMedia={false}`, and async `onPanelAction`.
5. Update `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, `src/app/app-schema.test.ts`, and browser tests for controls, media lifecycle, export, persistence, and performance.
6. Replace starter worklog with product decisions and verification evidence.
