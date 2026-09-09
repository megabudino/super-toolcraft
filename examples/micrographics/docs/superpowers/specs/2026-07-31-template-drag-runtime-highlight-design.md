# Template Drag Runtime Highlight Design

## Problem

Dragging a template tile from the Template Library toward the poster can turn the whole Toolcraft canvas blue as if it were a file-drop target. The previous fix stopped the product SVG's `dragover` and asserted the runtime state only after `drop`; it therefore missed the visible interval while the pointer was still held over the outer canvas area.

## Root cause

`appSchema.canvas.upload` currently enables the runtime canvas upload surface. That surface treats every native drag entering the canvas as an upload candidate and sets `data-drag-over="true"`, including the custom `application/x-toolcraft-micrograph-template` drag owned by Micrographics. The poster SVG can stop later bubbling events, but it cannot undo highlight state already entered while the pointer crossed the canvas margin before reaching the SVG.

This is also an ownership overlap. Template drop belongs to the product canvas, while source-photo import already has the dedicated `source.image` file-drop control in the Source Photo panel.

## Chosen design

Disable generic runtime upload on the Micrographics canvas with `canvas.upload: false`. Keep the existing product-owned template MIME handling and placement logic unchanged. Source photos remain uploadable, transformable, removable, and resettable through the existing Source Photo control.

Add a browser regression that starts a real native drag from a template tile, moves across a runtime-canvas point outside the poster, and asserts `data-drag-over="false"` before releasing the mouse. It then moves onto the poster, releases, and proves the template was inserted. This covers the user-visible held-drag phase that the previous after-drop assertion missed.

## Alternatives considered

- Keep `canvas.upload: true` and stop propagation only on the SVG: rejected because the outer canvas may already have entered the highlighted state before the drag reaches the SVG.
- Reach into the runtime DOM and clear or hide its overlay from product code: rejected because it crosses the generated runtime boundary and depends on private markup/state.
- Replace native drag-and-drop with a custom pointer transport: rejected as unnecessary; the existing product MIME drop works once the competing generic upload surface is removed.

## Verification

Verification tier: Tier 3.

Reason: the change modifies canvas drag ownership and must be proven in a real browser while the pointer is held before `drop`.

Run the focused `browser: direct micrographics placement` scenario first as a failing regression and then after the fix. Finish with the exact impact-derived protected delivery selectors. A separate full performance certification is skipped because no renderer workload, animation, or export path changes.
