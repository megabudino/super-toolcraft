# Dots Default Preset

## Product Goal

Make every value from `dither-port-settings (1).json` the product default.
First load, section reset, and global Reset controls must return to the imported
Dots look. Keep the bundled Lyonecho artwork, canvas size, upload override,
renderer, panels, export, settings transfer, and still-image behavior unchanged.

## Control Section Inventory

- `Source`: `source.image` remains the optional built-in custom-image override;
  the bundled Lyonecho artwork remains the fallback.
- `Pixel Effect`: defaults become Dots, Size 1, Fill 81, Density 8, Exposure
  189, Scatter 66, and Seed 999.
- `ASCII`, `Tone`, `Texture & Lens`, `Duotone`, `Layer`, `Background`, and
  `Image Export`: keep their current defaults because they already match the
  imported settings file.
- Runtime `Setup`: canvas stays 2048×2048 and Resolution scale stays 2×.

No new controls, custom controls, timeline, layers, media flow, or renderer
branches are required.

## Implementation Plan

1. Update the centralized typed values in `src/app/dither-defaults.ts`.
2. Bump the localStorage persistence key/version in `src/app/app-schema.ts` so
   a saved older preset cannot mask the new product defaults.
3. Update schema and browser assertions for exact first-load and Reset values.
4. Align the affected `src/app/app-performance.ts` default metadata with the
   new dense Dots baseline. If the imported workload exceeds an existing
   browser budget, preserve the rendering formula and render scale while
   splitting independent preview work across animation frames.
5. Record the decision and verification evidence in
   `docs/toolcraft/agent-worklog.md`.

## Verification Note

Verification tier: Tier 3

Reason: this is a schema/default and persistence change, but Dots at Size 1
also changes the initial Canvas 2D renderer workload and therefore needs
targeted preview responsiveness evidence.

Run: `pnpm verify:quick`; focused real-browser first-load/Reset acceptance;
targeted source-media, dense preview, and Size interaction performance
scenarios; then `pnpm verify:final`.

Skip: full `pnpm verify:perf`; this is a post-first-version default-preset
change, not a performance complaint. The directly affected default, media, and
dense-render paths receive targeted sequential coverage.
