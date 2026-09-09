# Glow Slider Live Update — Design

## Problem

The `Glow` slider updates the runtime target `ink.glow`, but the poster preview
continues to use a cached `poster-scene`. The renderer pipeline does not declare
`ink.glow` as a scene input, cache key, or invalidator, so moving the slider does
not rebuild the scene and the SVG glow filter remains absent.

## Design

Keep `ink.glow` as the single source of truth and add it to the canonical
`poster-scene` target inventory and cache input. The existing `readConfig` path
will continue to normalize the percentage to `scene.glow`, and the existing
`GlowFilter` will react to the refreshed scene. No local React state or
renderer bypass will be introduced.

The control remains panel-owned. The canvas remains the output and direct
element-manipulation surface.

## Alternatives

- Bypass the pipeline and render glow from `immediateScene`: rejected because it
  would create two scene authorities and hide invalidation defects.
- Keep a separate local glow value in the canvas: rejected because reset,
  persistence, import/export, and acceptance must remain runtime-state driven.

## Verification

Verification tier: Tier 3

Reason: The change modifies renderer pipeline inputs, cache invalidation, and
the visible canvas response to a continuous slider.

Run:

- A failing renderer-pipeline unit test proving `ink.glow` participates in the
  scene cache key and cache input.
- A dedicated `browser: glow slider updates the poster filter live`
  acceptance scenario proving the live slider changes the foreground filter
  and creates the SVG glow filter.
- Typecheck and exact affected `poster-scene` performance proof through
  `npm run verify:delivery`.

Skip:

- Full performance certification; this is an ordinary targeted renderer fix,
  not an explicit request for a complete audit.

## Acceptance

Moving `Glow` above zero immediately adds the SVG glow filter to the poster
foreground. Moving it back to zero removes the filter. All other controls,
composition data, canvas interaction, and export behavior remain unchanged.
