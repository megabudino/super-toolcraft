# Renderer Technique

Choose render technology per product layer. Do not choose a renderer because it is convenient; choose it from product output semantics, reference behavior, fidelity, and workload.

## Strategy Guide

- DOM: native product text, editable text, accessible product labels, low-count structured markup.
- SVG: crisp vector shapes, lines, icons, product foreground geometry, handles, and hit targets.
- Canvas 2D: medium raster compositing, text-to-canvas export, simple procedural previews, export passes.
- WebGL or WebGPU: dense pixels, shaders, image processing, high-resolution procedural output, large particle fields, heavy animated backgrounds.
- Mixed: use separate layers when background, product foreground, editing handles, and export composite have different semantics.

Dense backgrounds may use Canvas 2D, WebGL, or WebGPU when the spec names primitive count and performance reason. A dense raster background does not justify rasterizing low-count foreground geometry or text.

## Required Matrix

Custom renderer specs and `src/app/app-performance.ts` must mirror the decision:

- `sourceRepresentation`;
- `productRepresentation`;
- `previewRenderer`;
- `exportRenderer`;
- `rendererWorkload`;
- `rendererStrategy`;
- `whyNotAlternativeStrategies`;
- `fidelityRisks`;
- `performanceRisks`.

If text or vector output is intentionally rasterized, include `intentionalRasterizationReason`. If preview and export renderers differ, include `previewExportDifferenceReason`. If a reference runtime renderer changes, include `referenceRendererChangeReason`.

## Layer Inventory

Custom renderer specs must classify product layers when they exist:

- `background`;
- `product-foreground`;
- `editing-handles`;
- `export-composite`.

Mirror these in `rendererTechnique.layers` with visible `uiSelector` values for browser verification.

Editing handles should be DOM/SVG overlays, must not appear in export/copy output, and must write through runtime state.
