# Complete Visible Export Design

## Goal

Make Shaders image export contain the same product composition that is visible
on the canvas, including the default or user-supplied Button Image icon and its
position, scale, transform, and blend mode.

## Root Cause

The live preview resolves the source, glass texture, and Button Image assets and
passes all three images and their Toolcraft media transforms to
`LiquidGlassRenderRuntime`. The route-owned PNG/JPG action duplicates that
assembly but resolves only the source and glass texture. Because it never passes
`buttonImage` or `buttonImageTransform`, the shader disables the Button Image
layer during export even though the layer remains visible in preview.

The product already owns `renderLiquidGlassExportCanvas`, which resolves all
three media roles and renders them through the same WebGL pipeline. The defect is
therefore an export orchestration mismatch, not a shader or default-icon asset
problem.

## Design

Keep `createToolcraftPngExportCanvas` as the owner of output dimensions,
background handling, PNG/JPG handoff, and resolution selection. Before the final
2D export canvas is composed, allocate a WebGL canvas at the selected export
pixel size and render it with `renderLiquidGlassExportCanvas`. The route then
draws that completed WebGL surface into the standard export canvas.

This makes `renderLiquidGlassExportCanvas` the single product-level export
assembly path for source media, texture media, Button Image media, media
transforms, glass settings, text, background, and shader output. The live preview
and exported artifact continue to use separate renderer instances, but both
consume the same product inputs.

No schema, defaults, controls, persistence, runtime copy, or shader program
changes are required.

## Data Flow

1. The Export PNG action reads current image format, image resolution, and liquid
   glass settings from Toolcraft state.
2. The standard export-size helper resolves the exact selected pixel dimensions.
3. `renderLiquidGlassExportCanvas` resolves source, texture, and Button Image
   assets plus their transforms, then renders the complete product into a WebGL
   canvas at those dimensions.
4. `createToolcraftPngExportCanvas` applies the normal background/resolution
   contract and copies the completed product surface into the downloadable 2D
   canvas.
5. Existing blob creation and download behavior produces the selected PNG or JPG.

## Error Handling

Retain the current export Promise and progress reporting. Asset decode or WebGL
render failures reject the action instead of downloading a partial artifact.
Missing media remains valid: each absent optional asset is passed as `null`, and
the renderer omits only that layer.

## Acceptance And Verification

Add focused browser coverage to the existing image-export test:

- export a scene with the visible default Button Image icon;
- remove the Button Image and export the same scene again;
- decode both downloaded images and assert that pixels in the icon region differ;
- retain the existing filename, byte-size, PNG/JPG MIME, and resolution checks.

Verification tier: Tier 3, because exported renderer bytes change.

Run the narrow export-focused app checks and browser acceptance needed to prove
the fix. Skip the full performance suite and unrelated browser matrix, per the
request to avoid heavy verification. Deploy the completed `examples/glass` app
as a Vercel preview and return its URL.

## Out Of Scope

- changing the default icon or Button Image controls;
- changing visual shader behavior;
- changing export formats or resolution choices;
- changing Toolcraft runtime/template source;
- production deployment.
