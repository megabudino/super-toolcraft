# Vestaboard App Design

## Goal

Build a Creative Apps Kit product app that renders a centered Vestaboard-style field: a 22 by 6 grid of editable-size rectangular tiles, each tile optionally showing one centered character.

## Product Decisions

- The board uses the real Vestaboard layout baseline: 22 columns by 6 rows.
- Tile width, tile height, gap, and corner radius are editable.
- The complete tile layer always stays centered and fully visible inside the output canvas. When tile settings would exceed the canvas, the renderer scales the board down to fit instead of clipping tiles.
- The message textarea is the permanent phrase source. Explicit newlines in the textarea become board line breaks. Lines longer than 22 cells wrap into additional board rows. The resulting phrase block is centered both horizontally and vertically on the board.
- Permanent phrase characters are not affected by random fill or opacity distribution. They render at full text opacity so they remain readable.
- Random fill controls only non-phrase cells. At Fill 0%, every non-phrase cell is empty. At Fill 100%, every non-phrase cell contains a deterministic pseudo-random character.
- Seed makes random fill, random characters, and random opacity reproducible for the current configuration.
- Symbol opacity range is a two-thumb 0-100 slider. Filler characters receive deterministic random opacity inside the selected range.
- This is a still-output app. It exposes Export PNG, no video export, no timeline, and no layers.

## Control Section Inventory

- `Board Surface`: edits the visible board entity, including tile width, tile height, gap, radius, tile fill, and tile stroke.
- `Board Text`: edits the product typography entity, including the full fontPicker compound value and text color.
- `Permanent Message`: edits the permanent phrase workflow stage through a multiline textarea.
- `Random Field`: edits the generated background field, including fill level, opacity range, and seed.
- `Background`: edits output background color and PNG background inclusion.
- `Export`: sticky footer product delivery with Export PNG.

## Approaches Considered

1. DOM preview plus Canvas 2D export. Recommended because preview text stays crisp, layout is easy to test through DOM output, and export can use the standard retina PNG helper.
2. Pure SVG preview/export. Good for geometry, but font loading and multi-line text measurement are more cumbersome in the current runtime.
3. Pure Canvas 2D preview/export. Strong for export parity, but less appropriate for text-output previews because the browser tests require native preview resolution and semantic product text.

Chosen: DOM preview plus Canvas 2D export.

## Renderer Technique Decision Matrix

- `sourceRepresentation`: `mixed`, from schema values plus deterministic procedural field generation.
- `productRepresentation`: `mixed`, because the output contains vector-like tile geometry plus text characters.
- `previewRenderer`: `dom`.
- `exportRenderer`: `canvas-2d`.
- `rendererWorkload`: `text-output`.
- `rendererStrategy`: `dom`.
- `previewExportDifferenceReason`: preview uses native DOM for crisp interactive text; export draws the same computed board model to a retina Canvas 2D PNG through `createCreativeAppsKitPngExportCanvas`.
- `whyNotAlternativeStrategies`: SVG adds text measurement complexity for little benefit; Canvas preview would rasterize semantic text; WebGL/WebGPU are unnecessary for 132 static cells.
- `fidelityRisks`: browser font rendering and Canvas 2D font rendering can differ slightly, especially with custom fonts.
- `performanceRisks`: large pasted textarea input and high output sizes can affect layout/export, so performance scenarios cover message input, tile-size drag, export, zoom, and viewport stability.

## Renderer Layer Inventory

- `backgroundLayer`: background color fill, product background, included in preview and optionally in PNG.
- `productForegroundLayer`: tile rectangles and centered characters, product foreground, included in preview and PNG.
- `exportComposite`: Canvas 2D composite of background plus board model for PNG.

## Data Flow

Creative Apps Kit owns all user-editable state in schema targets. `VestaboardRenderer` reads runtime state via `useCreativeAppsKit`, resolves typed settings, builds the deterministic board model, and renders only product output inside `canvasContent`. The route handles the sticky Export PNG action and calls the same board model renderer for PNG bytes.

## Persistence And Settings Transfer

The app uses localStorage persistence for `values`, `canvas`, and `panels` because board settings and panel placement should survive reload. It uses `settingsTransfer: "auto"` because this is a multi-section product editor with compound typography and export controls.

## Acceptance And Performance

Acceptance rows cover every visible control, canvas sizing, toolbar viewport behavior, product output, and Export PNG. Browser tests interact with the real Creative Apps Kit UI. Performance coverage includes workload scenarios for large message text and board-size controls, responsiveness scenarios for the remaining controls, export-copy timing, native preview dimensions, and viewport stability/zoom stress.

## Verification Note

Verification tier: Tier 4
Reason: Converts a starter Creative Apps Kit folder into a complete product app with schema, custom renderer, export path, acceptance matrix, performance config, browser tests, and worklog.
Run: `pnpm install` if dependencies are missing, `pnpm verify:final`, then `pnpm dev`; use the in-app browser against the local URL for final visual QA.
Skip: No final-gate checks are skipped for delivery.
