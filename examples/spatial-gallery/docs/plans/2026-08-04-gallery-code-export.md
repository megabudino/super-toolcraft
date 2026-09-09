# Image Gallery Code Export

Verification tier: Tier 3
Reason: The sticky delivery action and export pass change from raster image encoding to an agent-ready source ZIP, while the live WebGL renderer, controls, media limits, timeline, and layers remain unchanged.
Run: Focused code-export/unit coverage, the exact code-download browser scenario, the canonical export completion path if the protected runner requires it, and a live browser inspection at the saved app URL.
Skip: Full unit, browser, and performance matrices; no preview pass, animation-frame work, GPU resource lifecycle, or workload boundary changes.

## Product Behavior

- Replace the visible `Export PNG` action with one sticky `Export Code` action.
- Remove the now-unused `Image Export` format/resolution section.
- Keep `Background`: its Include/color values affect the live preview and are serialized into the exported integration config.
- Download `image-gallery-agent-kit.zip` containing:
  - `AGENT-INTEGRATION.md` with a concrete agent task, adapter map, invariants, and acceptance checklist;
  - `README.md` for a human integrator;
  - `gallery.config.json` with the current canvas, layout, card, depth, physics, interaction, view, background, and media-transform values;
  - `manifest.json` describing the package and its entry points;
  - the current bounded image set under `public/image-gallery-assets/` in runtime order;
  - a runnable `src/ImageGallerySection.tsx` plus the tested physical-bend WebGL, gallery resource, settings adapter, Deck physics, host types, and CSS under `src/`.
- The exported package is intentionally agent-ready rather than Toolcraft-bound: the guide requires the target agent to preserve the verified shader/physics core and replace only Toolcraft state/lifecycle adapters with the destination project's conventions.

## Implementation

1. Update `src/app/app-schema.ts` and `src/app/app-acceptance-data.ts` for the new `download-output` action, removed image-format controls, retained Background, updated product summary, and code-package acceptance.
2. Replace the raster handler in `src/app/spiral-gallery/spiral-gallery-export.ts` with ZIP assembly using `fflate`, current runtime settings/media, raw renderer source snapshots, progress reporting, and a browser download.
3. Retarget the existing `spiral.export` pipeline pass and `src/app/app-performance.ts` from image pixels to the bounded source-package download without changing preview/resource passes.
4. Update focused unit and Playwright coverage to inspect the ZIP entries, current config/layout/media order, physical-bend shader source, agent guide, and sticky progress behavior.
5. Update `src/app/app-performance-impact.json` only if module ownership changes, then record the delivery in `docs/toolcraft/agent-worklog.md`.

## Boundaries

- Renderer output: unchanged live WebGL image gallery.
- Controls: existing Gallery, Layout, Flow, Deck, Cards, Depth, Physics, Interaction, View, and Background sections; Image Export removed.
- Timeline/layers: remain disabled.
- Persistence/settings transfer: unchanged v8 runtime persistence and built-in settings import/export.
- Delivery: code ZIP replaces PNG by explicit user request; no hidden or secondary raster export remains.
