# Dual PNG And Code Export

Verification tier: Tier 3
Reason: The visible sticky delivery actions, renderer export pass, browser artifact semantics, and targeted export performance path must support both raster image delivery and an agent-ready source package.
Run: Focused schema/export unit tests, exact PNG/background, code-package, and Deck export browser scenarios, the canonical `spiral.export` browser-performance path, TypeScript, and a live browser check at the saved app URL.
Skip: Full unit, browser, and performance matrices; preview rendering, interaction physics, media limits, timeline, layers, and GPU resource lifecycle remain unchanged.

## Product Behavior

- Keep Export Code and restore Export PNG as two sticky actions in one delivery row.
- Restore the `Image Export` section directly after `Background` with the built-in Format and Resolution selects.
- Format options: PNG and JPG. Resolution options: 2K, 4K, and 8K. Defaults: PNG and 4K.
- Export the current selected layout, current physical state, media order, rotate/flip transforms, card bending, camera, and optional background.
- Keep settings transfer, v8 persistence, all gallery controls, timeline/layer policy, and the live WebGL preview unchanged.

## Control Section Inventory Change

- `Background`: optional product/export background, targets `export.includeBackground` and `appearance.background`.
- `Image Export`: raster delivery settings, targets `export.image.format` and `export.image.resolution`, grouped because both configure the one still-image delivery workflow.
- Sticky actions: `export.png` / `Export PNG` and `export.code` / `Export Code`, both using the standard export icon.

## Implementation

1. Restore the image-export schema and add both sticky actions to the current product surface and acceptance inventory.
2. Keep the agent-ready ZIP builder and add the standard Toolcraft PNG export canvas plus the shared WebGL resource render/export lifecycle; dispatch by action value.
3. Make `spiral.export` and performance coverage consume both `export.png` and `export.code`, with raster work still modeled by repetition count.
4. Keep code-package inspection and restore focused Playwright helpers/specs that decode PNG/JPG and prove background alpha, dimensions, format, Deck parity, ZIP contents, and determinate sticky progress.
5. Update the worklog and verify only the exact affected paths.

## Boundaries

- Renderer preview: unchanged retained WebGL resource and physical bending.
- Canvas/output: image-only gallery; no editor UI or labels in export.
- Timeline/layers: remain disabled.
- Persistence/settings transfer: unchanged v8 policy; restored targets receive schema defaults when absent.
- Code package: remains exposed and tested alongside raster export.
