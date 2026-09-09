# Dither V2 — Expressive Still Effects

## Product Goal

Bring the current still-image editor closer to Dither v1.4 by adding a composable
tone, texture, lens, and duotone stack plus visually distinct pixel effects. Keep
Toolcraft as the shell and preserve source upload, intrinsic-media sizing,
persistence, settings transfer, background handling, and PNG/JPG export.

Animation is intentionally deferred. This iteration exposes no transport, timeline,
duration, loop, or video export behavior.

## Verification Note

Verification tier: Tier 3
Reason: schema targets, custom Canvas 2D renderer passes, effect workload, preview,
and export output all change; the shared Toolcraft runtime does not change.
Run: `pnpm verify:quick`, targeted Playwright acceptance for new effects/tone/texture/
duotone, targeted preview/control/export performance scenarios, then `pnpm verify:final`.
Skip: full `pnpm verify:perf`; this is a post-first-version feature pass and the user
did not report performance problems. Animation, timeline, and video checks are out of
scope because the product remains still-output.

## Control Section Inventory

- `Source`: `source.image`. Owns the single custom image and media lifecycle.
- `Pixel Effect`: `effect.style`, `effect.size`, `effect.fill`, `effect.density`,
  `effect.exposure`, `effect.scatter`, `effect.seed`. Owns effect choice, geometry,
  thresholding, intensity, reproducible scatter, and effect workload.
- `ASCII`: `effect.ascii.mode`, `effect.ascii.glyphs`,
  `effect.ascii.customGlyphs`. Remains conditional on ASCII.
- `Tone`: `tone.brightness`, `tone.contrast`, `tone.saturation`, `tone.hue`.
  Owns source-wide color adjustment before pixel rendering.
- `Texture & Lens`: `finish.noise`, `finish.grain`, `finish.glow`,
  `finish.vignette`. Owns the final expressive surface pass.
- `Duotone`: `duotone.preset`, `duotone.pixels`, `duotone.base`. Owns named
  two-color mappings and editable custom ink/paper colors.
- `Layer`: `effect.layer.opacity`, `effect.layer.blend`. Owns effect compositing.
- `Background`: existing include/color pair directly before export settings.
- `Image Export`: existing format/resolution pair.
- `Export`: existing sticky `Export PNG` action.

All controls use built-in Toolcraft controls. No custom control renderer is needed.
Settings transfer remains `auto`; persistence continues to include values, canvas,
and panels.

## Renderer Technique Decision

- Source representation: decoded image media.
- Product representation: dense raster pixels plus Canvas 2D text/geometry.
- Preview renderer: Canvas 2D, retained for reference parity and mixed pixel/text
  primitives.
- Export renderer: Canvas 2D using the standard Toolcraft export helper.
- Strategy: modular Canvas 2D render engine with a two-entry retained effect cache,
  lazy scratch surfaces, deterministic coordinate noise, and 24 ms preview update
  coalescing for high-frequency controls.
- GPU decision: WebGL/WebGPU remains the candidate for a later animated or heavier
  filter stack. This still pass uses native Canvas filters, small deterministic noise
  tiles, and bounded grid primitives; targeted stress evidence must pass without
  reducing render scale or export quality.

## Render Pipeline Inventory

1. `prepare-source`: decode-owned image is drawn through brightness, contrast,
   saturation, and hue filters into a retained source canvas. Invalidated by media,
   output size, render scale, or `tone.*`.
2. `sample-source`: retained sample canvas produces ImageData at the effect-specific
   grid size. Invalidated by prepared source, style, size, density, or render size.
3. `pixel-effect`: a typed effect registry renders Dither, Bayer, ASCII, Halftone,
   LEGO, Dots, Pixel Art, Cross-Stitch, Voxel, Lattice, or Hex Grid. Invalidated by
   effect settings or sample output.
4. `composite`: prepared source, effect opacity, and blend are composed directly to
   the target; the standard 100% Normal path reuses a source-baked overlay.
   Invalidated by layer targets or upstream passes.
5. `finish`: duotone, deterministic noise/grain, screen-bloom glow, and vignette are applied;
   the product background is then placed behind the output.
   Invalidated by `duotone.*`, `finish.*`, seed, or composite output.
6. `export`: the same pipeline renders at selected 2K/4K/8K dimensions through
   `createToolcraftPngExportCanvas`.

Viewport drag/zoom invalidates no product pass.

## Implementation Steps

1. Split settings/types, render utilities, and effect implementations out of the
   current 1k-line renderer module; keep `dither-effect.ts` as the orchestration
   boundary.
2. Add retained render-engine surfaces and deterministic seeded noise.
3. Add schema sections and target parsing for expressive still controls.
4. Update acceptance rows, product readiness/reference metadata, performance
   inventory, workload targets, and targeted scenarios.
5. Extend automated and browser tests for every new visible entity and export parity.
6. Update `docs/toolcraft/agent-worklog.md`, run the Tier 3 checks, and verify the
   running app in a real browser.
