# Default Artwork And Preset

## Product Goal

Use `Lyonecho Blog Cover Art.png` as the bundled source shown when no custom
upload exists. Make every value from `dither-port-settings.json` the schema
default so first load, section reset, and global Reset controls return to the same
look. Keep custom image upload, persistence, settings transfer, and export working.

## Control Section Inventory

- `Source`: `source.image` remains the built-in `fileDrop`; it is an optional
  custom replacement for the bundled artwork.
- `Pixel Effect`: defaults become Halftone, Size 33, Fill 74, Density 3,
  Exposure 200, Scatter 66, and Seed 999.
- `ASCII`: inactive defaults become Filled and Hacker, matching the preset file.
- `Tone`: defaults become Brightness 108, Contrast 100, Saturation 100, Hue 0.
- `Texture & Lens`: defaults become Glow 0, Noise 0, Grain 22, Vignette 0.
- `Duotone`, `Layer`, `Background`, and `Image Export`: defaults remain aligned
  with the imported preset values.
- Runtime `Setup`: canvas starts at 2048×2048 and Resolution scale remains 2×.

No new controls, custom controls, timeline, or layers are required.

## Implementation Plan

1. Copy the supplied PNG into `public/assets` and define typed app defaults in
   `src/app/dither-defaults.ts`.
2. Read those constants from `src/app/app-schema.ts`; set the canvas size,
   control defaults, Source help text, and bump local persistence to `v2`.
3. Make `src/app/dither-renderer.tsx` use the bundled artwork only when runtime
   `mediaAssets` has no custom image. Preview and export therefore share the same
   fallback, while uploads continue to override it.
4. Update the Source acceptance contract and browser test to prove first-load
   output, custom override, Clear fallback, and Reset fallback. Add a schema test
   that verifies the JSON-derived default map.
5. Update performance fixtures whose declared heaviest media baseline must now
   cover the real 2048×2048 default source.
6. Record the decision and evidence in `docs/toolcraft/agent-worklog.md`.

## Verification Note

Verification tier: Tier 3

Reason: schema defaults, persistence version, intrinsic canvas size, bundled media
fallback, preview/export source selection, acceptance, and the real default media
workload change.

Run: `pnpm verify:quick`; focused browser checks for default source, Clear/Reset,
settings transfer, persistence, export, and default stress preview; targeted
media/preview performance scenarios; then `pnpm verify:final`.

Skip: full `pnpm verify:perf`; this is a default-content iteration after the first
working version, not a reported performance problem. The changed 2048×2048 media,
preview, slider, viewport, and export paths receive targeted sequential coverage.
