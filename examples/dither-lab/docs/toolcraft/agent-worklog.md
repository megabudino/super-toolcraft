# Implementation Worklog

Active change: template-release-2026-09-09

This file records product decisions and the evidence behind them. Keep it short, factual, and current.

## Status

Mode: product

Dither is now a Toolcraft product app. It opens with the bundled Lyonecho artwork and imported dense Dots preset, accepts a custom uploaded replacement, renders fourteen reference-inspired pixel styles plus tone, texture, lens, and duotone finishes in the Toolcraft canvas, and exports PNG/JPG output.

## Decision Trail

### Iteration 7 — Default source as an image attachment

- Request: Show the existing image as an attached uploader asset, with remove and replace.
- Task type: Source media lifecycle; Tier 3 product change with a narrowly regenerated legacy runtime compatibility update.
- User-visible result: Source starts with the Lyonecho thumbnail, Replace and Remove. Removal clears the image; Undo/Redo and global/Source reset use runtime history and defaults.
- Source/reference checked: The live `/demos/dither-lab` page, the bundled PNG, upstream default-media commits `ee7322e6` and `d73b5d74`, and current `packages/toolcraft-runtime/src/state/media-state.ts`.
- Docs/contracts read: `workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `performance.md`, `renderer-technique.md`, and monorepo `starter/docs/toolcraft/core/media-upload.md`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `controls-product-coverage`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Declare schema `media.defaultAssets`; preview/export consume only `source.image` runtime media. The legacy example lacked this API, so default-media support was backported into a temporary source tree and regenerated using official generator `1bfa92c5`, preserving all unrelated runtime/UI files. Regeneration script and source snapshots are in workspace `output/dither-default-asset`; the source authority is the referenced Git history. A reproduced upstream reset bug compared only IDs, missing replaced bytes when import reused the attachment ID; shared source now compares full records, and that correction is included in regeneration.
- Alternatives rejected: Hidden renderer fallback, custom uploader, one-time import effects, special product-only removal flags, and full runtime migration.
- State/output mapping: `media.defaultAssets` seeds runtime `mediaAssets`; `media.import` replaces the source, `media.delete` clears it, history restores/removes it, and `controls.reset` / `controls.resetTargets` restore the bundled file. Preview and export both use the same source selection. Existing session-local media policy and saved effect settings remain unchanged.
- Files changed: Default media schema/state/reset compatibility files, `app-schema.ts`, `dither-renderer.tsx`, `app-acceptance.ts`, media tests, browser source lifecycle acceptance, and `package.json` functional browser gate excluding performance per root contract.
- Verification: Focused app tests 9/9; shared runtime same-ID regression failed before the correction and passed after; generated integrity passed 180 files. Final gate and source-media browser performance results recorded below after execution.
- Skipped checks: Full performance checkpoint is not applicable to this subsequent feature request; only source-media workload timing is required.
- Risks: Media remains session-local as before; page reload restores the bundled attachment.

### Iteration 1 — Dither reference port

- Request: Port https://www.dither.com/ functionality into this Toolcraft app, copy the effect settings and algorithm as closely as possible, omit presets, and use a custom user image.
- Task type: Reference runtime clone into Toolcraft.
- User-visible result: The canvas shows a custom-image Dither effect with Dither, Bayer Matrix, ASCII, Halftone, LEGO, Dots, blend, opacity, background, and 2K/4K/8K image export settings.
- Source/reference checked: Public Dither v0.1.2 site HTML, CSS, and JavaScript; local Toolcraft workflow, schema, component, acceptance, performance, and renderer docs.
- Docs/contracts read: `workflow.md`, `assembly-workflow.md`, `decision-contract.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `performance.md`, and `renderer-technique.md`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `controls-product-coverage`, `output-export-required`, `renderer-technique-inventory`, `reference-clone-source-of-truth`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Keep the public reference algorithm in Canvas 2D for parity, but run it through Toolcraft schema controls, runtime media import, canvasContent, standard background controls, standard PNG export helper, and app-specific acceptance/performance matrices.
- Alternatives rejected: Reference iframe shell, custom uploader, custom settings import/export, layers panel, timeline, saved reference presets, and silently downscaled preview/export output.
- State/output mapping: `source.image` supplies runtime media; `effect.*` values map to effect branch, size, fill, density, exposure, scatter, ASCII mode/glyphs, opacity, and blend; `export.includeBackground`, `appearance.background`, `export.image.format`, and `export.image.resolution` map to preview/export compositing and bytes.
- Files changed: `src/app/app-schema.ts`, `src/app/dither-effect.ts`, `src/app/dither-renderer.tsx`, `src/routes/index.tsx`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, app tests, and Playwright tests.
- Verification: `pnpm ai:check` and `pnpm test` were run during implementation; final verification is tracked in the delivery response.
- Skipped checks: Browser and full performance gates were deferred until the product schema, renderer, and static contract tests settled.
- Risks: Canvas 2D pixel loops can be heavy at high render scale and export resolution; browser performance tests cover the first working version before delivery.

### Iteration 2 — Browser/performance hardening

- Request: Finish the Toolcraft port under the app verification contract and prove visible product entities through browser/performance coverage.
- Task type: Renderer and browser performance stabilization.
- User-visible result: Effect controls, background, settings transfer, persistence, PNG/JPG export, render scale, and viewport zoom remain functional in the real browser suite.
- Source/reference checked: Existing Toolcraft perf validators, browser traces, product observable hashes, and Dither reference render structure.
- Docs/contracts read: `workflow.md`, `performance.md`, `renderer-technique.md`, `acceptance-testing.md`, and the local app performance/acceptance validators.
- Contract rules applied: `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `canvas-surface-preserved`, and `workflow-required`.
- Decision: Preserve Canvas 2D parity while optimizing equivalent implementation details: Dither now scales a low-resolution error-diffusion buffer with nearest-neighbor drawImage instead of looping every backing pixel, ASCII renders in logical canvas units and scales to backing pixels, whitespace glyphs are skipped, and preview settings are memoized so viewport zoom does not rerun the pixel pipeline.
- Alternatives rejected: Lowering renderScale, downsampling export, hiding high-cost controls, or replacing the reference algorithm with a different renderer.
- State/output mapping: Control values still map through `getDitherSettingsFromValues`; the renderer now avoids invalidation when only viewport state changes.
- Files changed: `src/app/dither-effect.ts`, `src/app/dither-renderer.tsx`, `src/app/app-performance.ts`, `e2e/app-controls.spec.ts`, `e2e/performance-helpers.ts`, `playwright.config.ts`, and `package.json`.
- Verification: `pnpm test:browser` passed 62/62 after the stabilization pass; `pnpm verify:perf` passed 3/3 performance metadata tests and 23/23 browser performance tests; `pnpm verify:final` passed.
- Skipped checks: None for this iteration; browser coverage and stress scenarios were rerun after the renderer/performance changes.
- Risks: ASCII CJK font fallback can spike first-use timing, so Japanese glyphs remain covered functionally while performance glyph-switch uses a non-CJK ramp.

### Iteration 3 — Reference settings audit

- Request: Re-check that the visible reference effect settings were copied as closely as possible.
- Task type: Schema/control parity audit.
- User-visible result: ASCII control labels now follow the reference's `Style`, `Preset`, and `Chars` naming, custom chars default to empty reference behavior, and the blend select follows the reference order: Normal, Screen, Overlay, Color Dodge, Multiply.
- Source/reference checked: Current `https://www.dither.com/` HTML and `script.js` effect control definitions.
- Docs/contracts read: `workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, Toolcraft brainstorming/writing-plans/systematic-debugging skills.
- Contract rules applied: `controls-product-coverage`, `controls-layout-heuristics`, `reference-clone-source-of-truth`, `acceptance-product-observable`, and `workflow-required`.
- Decision: Correct only effect-setting metadata and defaults that diverged from the reference while preserving the Toolcraft-owned Image Export resolution menu.
- Alternatives rejected: Adding reference presets, auth/pro flows, crop/share/remix controls, video export, background library, or the full CSS filter panel during this effect-settings audit.
- State/output mapping: `effect.ascii.mode`, `effect.ascii.glyphs`, `effect.ascii.customGlyphs`, and `effect.layer.blend` keep the same runtime targets; changed labels/defaults alter visible control parity without changing renderer ownership.
- Files changed: `src/app/app-schema.ts`, `src/app/dither-effect.ts`, `src/app/app-performance.ts`, `src/app/app-acceptance.ts`, `e2e/app-controls.spec.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: `pnpm test` passed 164/164; targeted browser smoke passed 11/11 for ASCII Style/Preset/Chars, Blending Mode, settings transfer, persistence, and related perf smoke.
- Skipped checks: Full perf is skipped because renderer workload and pixel pipeline are unchanged.
- Risks: Reference export resolution choices include HD/Full HD/2K/4K, while Toolcraft contract requires 2K/4K/8K image export controls for generated still apps.

### Iteration 4 — Reference algorithm parity audit

- Request: Re-check the Dither reference algorithm and make the rendered result behavior match 1:1.
- Task type: Renderer/canvas parity correction.
- User-visible result: Dither, Bayer, ASCII, Halftone, LEGO, Dots, scatter, blend, and export rendering now follow the live app reference algorithm more closely.
- Source/reference checked: Live `https://app.dither.com/` HTML and `script.js` from June 29, 2026, especially `renderEffect`, `renderDitherBlend`, `renderBayer`, `renderCharacters*`, `renderHalftone`, `renderLego`, `renderDots`, `getScatterOpacity`, and export rendering paths.
- Docs/contracts read: `workflow.md`, `decision-contract.md`, `renderer-technique.md`, `performance.md`, `acceptance-testing.md`, and Toolcraft brainstorming/writing-plans/systematic-debugging skills.
- Contract rules applied: `reference-clone-source-of-truth`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Replace deterministic/test-friendly approximations with reference behavior: Math.random scatter and dynamic ASCII spread, reference ASCII sampling density, mode-specific ASCII ramps, full-resolution ASCII export sampling, and per-output-pixel Floyd-Steinberg Dither output.
- Alternatives rejected: Keeping seeded scatter, nearest-neighbor low-canvas Dither upscale, full-CSS-resolution preview ASCII sampling, or lowering renderScale/export resolution to recover performance.
- State/output mapping: `effect.style`, `effect.size`, `effect.fill`, `effect.density`, `effect.exposure`, `effect.scatter`, `effect.ascii.*`, and `effect.layer.*` feed the same Canvas 2D branches, but those branches now mirror the reference math and randomization path.
- Files changed: `src/app/dither-effect.ts`, `src/app/dither-renderer.tsx`, `src/app/app-performance.ts`, and `docs/toolcraft/agent-worklog.md`.
- Verification: `pnpm verify:quick` passed; targeted Playwright renderer/performance set passed 23/23 for effect branches, ASCII branches, blend, export, export resolution, and image-export budget.
- Skipped checks: Full `pnpm verify:perf` skipped because this was a Tier 3 targeted renderer parity pass after the first working version; targeted workload/export scenarios for touched paths were run.
- Risks: Reference `Math.random` means repeated renders can differ for Scatter and Dynamic/Filled ASCII, matching the source app but making exact pixel snapshots intentionally non-stable.

### Iteration 5 — Full performance checkpoint

- Request: Check the app performance after the reference algorithm parity pass.
- Task type: Full browser performance verification and targeted renderer optimization.
- User-visible result: Media import, source replacement, effect controls, ASCII controls, blend, background, render scale, viewport zoom, and image export all pass the app performance budgets.
- Source/reference checked: `pnpm verify:perf` output, failing Playwright traces for `source-image-change` and `media-import`, `src/app/dither-effect.ts`, `src/app/app-performance.ts`, and Toolcraft performance docs.
- Docs/contracts read: `workflow.md`, `performance.md`, `renderer-technique.md`, `acceptance-testing.md`, and Toolcraft systematic-debugging guidance.
- Contract rules applied: `performance-coverage-levels`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- Decision: Preserve the reference Dither mapping while replacing the expensive per-output-pixel ImageData write with exact span fills derived from the same `floor(x / scaleX)` and `floor(y / scaleY)` boundaries. This keeps the selected render scale and output fidelity instead of downsampling.
- Alternatives rejected: Lowering `canvas.renderScale`, reducing source media dimensions, relaxing budgets, switching the default style, or restoring browser nearest-neighbor low-resolution upscale.
- State/output mapping: `effect.style = dither-blend` still uses Floyd-Steinberg error diffusion at sampled resolution; each dithered source cell now fills the exact output pixel span it owned in the previous loop.
- Files changed: `src/app/dither-effect.ts` and `docs/toolcraft/agent-worklog.md`.
- Verification: Initial `pnpm verify:perf` found 2 media-related frame-gap failures; after the span-fill fix, targeted media perf passed 2/2 and full `pnpm verify:perf` passed 3/3 metadata checks plus 23/23 browser perf scenarios.
- Skipped checks: None for the performance checkpoint; the full perf gate was rerun after the fix.
- Risks: Dither preview remains CPU Canvas 2D and may still be the highest-risk path on significantly slower hardware, but current required fixtures pass without reducing quality.

### Iteration 6 — Expressive still-effects architecture

- Request: Make the effects materially more expressive, using `https://app.dither.com/` as the primary reference, after a thermo-nuclear maintainability review.
- Task type: Tier 3 schema, renderer, canvas output, export, acceptance, and targeted performance iteration.
- User-visible result: Style now exposes Pixel Art, Dither, Bayer Matrix, ASCII, Halftone, Dots, LEGO, Cross-Stitch, Voxel, Lattice, and Hex Grid plus None. New Tone, Texture & Lens, and Duotone sections add brightness, contrast, saturation, hue, deterministic Noise/Grain, screen-bloom Glow, Vignette, five named two-color looks, and custom Pixels/Base colors.
- Source/reference checked: Live Dither v1.4 UI and behavior at `https://app.dither.com/`; the current app schema, renderer, acceptance/performance matrices, browser traces, and local Toolcraft workflow/renderer/performance contracts.
- Docs/contracts read: `workflow.md`, `assembly-workflow.md`, `decision-contract.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `performance.md`, `renderer-technique.md`, and the required brainstorming, writing-plans, systematic-debugging, and browser skills.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `controls-product-coverage`, `controls-layout-heuristics`, `renderer-technique-inventory`, `reference-clone-source-of-truth`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Replace the 1,096-line effect monolith with typed settings/types, render utilities, a typed effect registry, focused Dither/ASCII/grid modules, and a retained `DitherRenderEngine`. Reuse the same engine for preview and the same pipeline for export. Use seeded coordinate noise so preview, persistence, undo/redo, and export remain stable.
- Alternatives rejected: Adding animation without Toolcraft playback/video export, patching copied runtime files, introducing custom controls for built-in slider/select/color behavior, weakening renderScale, downsampling the preview, retaining random frame-to-frame Scatter, or adding more branches to the original monolith.
- State/output mapping: `tone.*` invalidates the optional prepared source; `effect.*` invalidates the registered pixel pass; `effect.layer.*` changes source/effect compositing; `duotone.*` and `finish.*` change the final target pass; `effect.seed` deterministically drives Scatter, Noise, and Grain; preview background remains runtime-controlled and export uses the standard resolution helper.
- Renderer evidence: Browser output tests changed real canvas hashes for all style branches and every new control. Noise/Grain initially exposed a persistent scratch `destination-in` state; the texture pass now scopes and restores its context state. The retained engine uses a two-entry effect-overlay cache for fast style returns, reuses the active overlay during same-style slider drags, allocates tone/scratch surfaces lazily, applies Glow as a bounded screen-bloom pass, and coalesces high-frequency preview updates for 24 ms without changing render scale or export quality.
- Files changed: `src/app/app-schema.ts`, `src/app/dither-effect.ts`, `src/app/dither-renderer.tsx`, `src/app/dither-settings.ts`, `src/app/dither-types.ts`, `src/app/dither-utils.ts`, `src/app/dither-effects/*`, acceptance/performance config and tests, Playwright tests, this worklog, and `docs/toolcraft/dither-v2-plan.md`.
- Verification: `pnpm verify:quick` passed 164/164; targeted real-browser acceptance passed all 15 touched output/export tests; targeted new performance scenarios passed, including Glow and five repeated Fill drags with 1920x1080 media at renderScale 2; browser acceptance/performance metadata passed 18/18; final `pnpm verify:final` passed 164/164 static tests, production build, and 86/86 browser scenarios.
- Skipped checks: Full `pnpm verify:perf` is skipped because this is a post-first-version feature pass and the user did not report a performance problem; touched renderer paths use targeted stress scenarios instead.
- Risks: Animation, playback presets, and video export from Dither v1.4 remain intentionally deferred because they require a complete Toolcraft playback/video contract, not decorative local state.

### Iteration 7 — Live slider preview

- Request: Update product settings while a slider is moving instead of waiting for control release.
- Task type: Tier 3 control-drag and Canvas 2D preview scheduling correction.
- User-visible result: Existing sliders repaint the product canvas during pointer movement and continue following a held drag; the latest value still receives a final preview frame.
- Source/reference checked: Real Playwright pointer-drag evidence, `SliderControl` live `onValueChange`, ControlsPanel runtime dispatch, `DitherRenderer` scheduling, and the retained Canvas 2D render engine.
- Docs/contracts read: `workflow.md`, `decision-contract.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, `acceptance-testing.md`, and the required brainstorming, writing-plans, systematic-debugging, and browser skills.
- Contract rules applied: `controls-product-coverage`, `acceptance-product-observable`, `renderer-technique-inventory`, `performance-coverage-levels`, and `workflow-required`.
- Decision: Replace the cancel-on-change 24 ms trailing debounce with a retained leading/trailing scheduler. It stores the newest render request, paints the first available animation frame, follows continuing changes at a bounded 40 ms interval, and cancels scheduled work only during unmount cleanup.
- Alternatives rejected: Committing slider state only on release; rendering every historical pointer value; retaining the trailing-only debounce; lowering `canvas.renderScale`; changing export quality; or patching copied Toolcraft slider/runtime behavior that already emits live values correctly.
- State/output mapping: Each Toolcraft slider `onValueChange` updates runtime state; `DitherRenderer` replaces its latest request ref and schedules the retained engine; the engine paints current settings into the product canvas before `pointerup`. Export still renders the final runtime state directly and is not throttled.
- Files changed: `src/app/dither-renderer.tsx`, `e2e/app-controls.spec.ts`, `docs/toolcraft/live-slider-preview-plan.md`, and this worklog.
- Verification: Focused browser reproduction first recorded zero canvas paints during 48 held-pointer moves; after the scheduler and Strict Mode cleanup correction, the strengthened live Size test passed 3/3 and proved two distinct product frames before `pointerup`. `pnpm verify:quick` passed 164/164; two sequential repeats of live Size plus Size, Fill, Glow, Opacity, and Resolution scale performance scenarios passed 12/12; `pnpm verify:final` passed 164/164 static tests, production build, and 86/86 browser scenarios.
- Skipped checks: Full `pnpm verify:perf` is skipped because the request corrects update timing rather than reporting a performance regression; directly affected high-frequency workload paths receive targeted sequential performance coverage.
- Risks: On slow hardware, a dense Canvas 2D effect may display fewer intermediate frames than a lightweight effect, but the scheduler always prefers the newest value and does not silently reduce render scale or output fidelity.

### Iteration 8 — Expressive effect overhaul and reference parity

- Request: Current effects look weak and raw compared to app.dither.com; study every effect and make each one as strong as the reference or stronger.
- Task type: Tier 3 renderer/effect-algorithm rework across the registered pixel-effect family, plus schema option additions.
- User-visible result: All pixel styles now render as punchy standalone artwork over the product background instead of a faint overlay on the source photo; Floyd-Steinberg dither uses serpentine error diffusion with vivid normalized pixel colors; Bayer renders chunky per-cell ordered patterns; new Noise Dither and LED styles match the reference's flagship organic dither and glowing LED-panel looks; halftone gains a full 0-to-overlap dot ramp on an offset print grid; LEGO becomes a full plate mosaic with beveled studs; pixel art posterizes with density-driven palette depth; voxel extrudes brightness-lit columns; cross-stitch, lattice, and hex grid gain thread shading, tone-weighted line engraving, and honeycomb mosaics; ASCII maps bright areas to dense glyphs (previously inverted), with larger readable glyph sizes; Glow becomes a true blurred bloom.
- Source/reference checked: dither.com marketing pages describing the reference effect family (Noise Dither, ASCII variants, Lego, Voxel, Halftone, Dots, Bayer 8x8, LED, duotone) and side-by-side offline Chromium render harness snapshots of every style before and after the rework.
- Docs/contracts read: `AGENTS.md`, `workflow.md`, `decision-contract.md`, `renderer-technique.md`, `performance.md`, `acceptance-testing.md`.
- Contract rules applied: `controls-product-coverage`, `acceptance-product-observable`, `renderer-technique-inventory`, `performance-coverage-levels`, `reference-clone-source-of-truth`, and `workflow-required`.
- Decision: Fix the grid-cell walk that double-applied the cell step (sampling every ~9th snapshot texel and drawing sparse oversized primitives), remove the destination-over source-photo backing so effects replace the source at full opacity while Layer opacity/blend below 100 percent still composites the effect over the prepared source, add a shared exposure/density tone pipeline (`mapTone` + `getDensityContrast`) and a `vividRgb` color-normalization helper, route binary dithers through sample-resolution ImageData with nearest-neighbor blits, and add a micro-cell ImageData fast path for all grid styles once cells fall under 2.6 output pixels so extreme Size values stay within frame budgets.
- Alternatives rejected: Keeping the photo-behind compositing (it muted every effect and diverges from the reference look); per-output-pixel Bayer loops (slower and blurrier than per-cell blocks); rotating the halftone screen by 45 degrees with resampling (row offset achieves the print feel without a second sampling pass); shadow-blur-based LED glow (per-cell shadowBlur is far over budget versus the additive second pass); clamping or downsampling render scale for performance (contract forbids silent quality cuts).
- State/output mapping: `effect.style` gains `noise-dither` and `led` options mapped through `ditherEffectStyles`, the effect registry, and the schema select; `effect.fill` now biases Bayer/Noise threshold coverage smoothly and gates lit LEDs; `effect.density` drives the shared contrast curve plus pixel-art palette depth; `effect.scatter` stays hidden for all binary dithers including Noise Dither; Layer opacity/blend semantics preserve output-changing behavior for every acceptance scenario.
- Files changed: `src/app/dither-utils.ts`, `src/app/dither-types.ts`, `src/app/dither-effect.ts`, `src/app/dither-effects/{dither,grid,ascii,plans,index}.ts`, `src/app/app-schema.ts`, `src/app/app-acceptance.ts`, `e2e/app-controls.spec.ts`, and this worklog.
- Verification: Offline Chromium harness rendered every style plus control sweeps (size, fill, density, exposure, scatter, seed, duotone, glow) before/after; scoped `tsc` typechecks passed for the effect modules and for schema/acceptance/performance against the runtime core; stress timings measured in Chromium at 1920x1080 renderScale-2-equivalent: halftone Size 100 1158ms -> 64ms, LED Size 100 1636ms -> 202ms, pixel art Size 100 495ms -> 129ms, dots Size 50 drag 75ms, ASCII stress 65ms cold, all drag-stressed scenarios within their frame budgets.
- Skipped checks: Full `pnpm verify:quick`/`pnpm test:browser` could not run in the working sandbox because the npm registry was unreachable there; the suite must be run locally before delivery is considered final.
- Risks: The composite change alters default-look expectations for saved projects (effects no longer sit on the photo at Layer opacity 100); duotone and finish passes now operate on higher-contrast input, so extreme presets read stronger than before.

### Iteration 9 — True reference parity from decompiled bundle

- Request: Verify against the actual app.dither.com implementation ("study their code, not the look") and match it.
- Task type: Tier 3 renderer parity rework driven by primary-source evidence.
- User-visible result: Every shared style now follows the reference implementation exactly at matching settings: effects composite over the visible filtered source image (reference layers image-canvas z0 under effect-canvas z1); grid styles use the reference cell-count sizing `max(20, 75 + (80 - size) * 1.2)` so larger Size gives chunkier cells; dither keeps `10 - size * 0.09` sampling with raster-order Floyd-Steinberg (threshold 0.5, 7/16-3/16-5/16-1/16), gamma `pow(lum, 1 / (1 + density/10 * 0.5))`, and lit pixels colored `source * exposure * 3`; Bayer uses the reference 8x8 matrix with `pow(tone, 0.85)` and block size `round((2 + size*0.08) * 0.2)`; halftone renders 45-degree rotated diamond dots at `halfCell * 0.85 * (0.6 + 0.4 lum) * densityContrast`; dots become radial-gradient spheres with +80 highlight and -60 rim at color x1.5; LEGO returns to variable-size tiles `(0.3 + 0.9 lum) * 2` with vertical plate gradients, bevels, shadowed radial-gradient studs, ring, and specular; voxel extrudes `(0.15 + 1.1 lum)` columns with per-face gradients; LED matches cell x0.78 rounded pixels with dark 0.82-alpha ring, tone-gated radial glow, and no unlit floor; pixel art uses density-driven gaps `density/10 * cell * 0.18`; lattice becomes the reference plexus mesh (14 + (100-size)*0.9 columns, 4-direction links, distance/luminance-weighted line alpha, node dots); cross-stitch gains the fabric grid underlay, luminance-scaled multi-thread stitches, and the screen-curve exposure response; hex grid becomes an offset honeycomb with glow halos, vertical gradients, and edge bevels; ASCII restores the reference `(1 - pow(lum, 1/(1 + density/10 * 1.5))) * length` glyph ramp with dark-boosted colors, reference preset strings, font `max(4, 2 + size * 0.26)`, and font-sized step; Glow is the reference bright-pass bloom (`(lum - 0.4)/0.6` extraction, `glow% * 40px` blur, screen at `1.5 x glow%`).
- Source/reference checked: The live production bundle `app.dither.com/assets/index-XleTfLX_.js` (459,772 bytes, fetched in-page via Claude in Chrome and read function-by-function: hr/dr/ur/mr/pc/hc/gc/pr/bc/yc, h0/g0/f0, Ke/Jt/Kt, glow module, style registry, blend map, factory defaults after Reset), plus live captures of Dither, Halftone, Dots, LEGO, Voxel, ASCII, Cross-Stitch, Lattice, and Pixel Art on an identical uploaded test image at identical settings (size 10, fill 50, density 5, exposure 100).
- Docs/contracts read: `workflow.md`, `decision-contract.md`, `renderer-technique.md`, `performance.md`, `acceptance-testing.md`, and the required brainstorming, writing-plans, systematic-debugging, and browser skills.
- Contract rules applied: `reference-clone-source-of-truth`, `renderer-technique-inventory`, `performance-coverage-levels`, `acceptance-product-observable`, `workflow-required`.
- Decision: Port the reference formulas verbatim where deterministic, replace the reference's unseeded `Math.random()` scatter/jitter with the existing seeded `coordinateNoise` (visually equivalent, deterministic for tests), and add a two-tier level-of-detail scheme the reference lacks: sub-2.6-output-pixel cells render through sample-resolution ImageData blits, and sub-10-css-pixel cells render flat primitive variants without per-cell gradients/bevels (indistinguishable at those sizes, keeps drag within frame budgets where the reference implementation measures 300-800 ms).
- Alternatives rejected: Keeping the Iteration 8 stylized interpretations (diverged from the reference look the user asked to match); replacing the photo-under-effect composite with background-only compositing (contradicts the reference DOM layering); porting unseeded randomness (breaks deterministic acceptance evidence); copying reference per-cell cost without LOD (BUDGET: measured 826 ms LEGO / 1636 ms LED frames).
- State/output mapping: Controls keep existing targets; `effect.size` now maps to reference cell counts for grid styles (Size 1 = densest 170-cell grid, Size 100 = 51 cells) while dither/ASCII keep their reference formulas; `effect.fill` adds a threshold bias for Bayer/Noise Dither (reference shows Fill for Bayer but ignores it — superset kept at default-parity); duotone remains the existing post-pass (reference paints paper/ink inside each renderer — noted as a known difference, off by default).
- Files changed: `src/app/dither-effects/{plans,dither,grid,ascii,index}.ts`, `src/app/dither-effect.ts`, `src/app/dither-utils.ts`, `src/app/app-performance.ts` (Size/ASCII/stress fixtures now name Size 1 and LEGO as the heavy cases), and this worklog.
- Verification: Scoped `tsc` passes for effect modules and schema/acceptance/performance; Chromium harness renders of all 14 styles at reference-equivalent scale match the live captures per style; measured stress timings at 1920x1080 renderScale-2-equivalent after LOD: LEGO Size 1 fill 100 826->117 ms cold / 79 ms drag, voxel 734->134 ms, hex 343->71 ms, stitch 262->131 ms, dots drag 66 ms, halftone Size 1 fill 100 82 ms, ASCII Size 1 density 10 99 ms cold / 22 ms drag, glow 100 63 ms — all within declared budgets; LED remains 229 ms drag (not part of any drag-stress scenario; reference implementation is slower).
- Skipped checks: `pnpm verify:quick`/`pnpm test:browser` still cannot run in the cloud sandbox (npm registry unreachable); run locally before delivery. LED and Hex Grid could not be captured live (PRO-gated in the reference); their ports follow the decompiled functions hc/bc verbatim.
- Risks: Reference parity restores the subtle factory-default look (effects melt into the photo at neutral filters; the reference's showcase punch comes from its Looks presets that raise Size/Fill and add dim/blur/vignette filters); if a bolder default is wanted later, raise default Fill or add a base-softening control rather than changing the ported formulas.

### Iteration 10 — Bundled Lyonecho default preset

- Request: Make the supplied `Lyonecho Blog Cover Art.png` image and `dither-port-settings.json` values the app defaults.
- Task type: Tier 3 bundled media, schema defaults, canvas sizing, persistence migration, preview renderer, acceptance, and targeted performance iteration.
- User-visible result: A clean launch now opens the 2048×2048 Lyonecho artwork at 2× preview scale with Halftone, Size 33, Fill 74, Density 3, Exposure 200, Scatter 66, Seed 999, Brightness 108, Grain 22, and the supplied export/background values. Custom uploads temporarily replace the bundled source; Clear and Reset restore the bundled source, and Reset restores the imported control values.
- Source/reference checked: `/Users/kusnizza/Downloads/dither-port-settings.json`, `/Users/kusnizza/Desktop/Lyonecho Blog Cover Art.png`, the current Toolcraft media/persistence/reset behavior, real Playwright canvas snapshots, and targeted 2048×2048 performance measurements.
- Docs/contracts read: `workflow.md`, `assembly-workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `performance.md`, and the required brainstorming, writing-plans, systematic-debugging, and browser skills.
- Contract rules applied: `canvas-surface-preserved`, `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Bundle the user-provided PNG as an app asset and treat it as the renderer fallback whenever Toolcraft has no custom source media. Keep FileDrop as an optional runtime-owned override, centralize all imported values in typed app defaults, set the intrinsic starting canvas to 2048×2048, and migrate persistence from v1 to v2 so prior saved values cannot mask the new defaults.
- Alternatives rejected: Encoding a 6.9 MB data URL into the schema, patching copied Toolcraft runtime initial-state APIs for one app, persisting media outside the runtime policy, inventing a custom uploader, silently lowering `canvas.renderScale`, or stretching a lower-resolution preview backing canvas.
- State/output mapping: The bundled `/assets/lyonecho-blog-cover-art.png` supplies preview/export source pixels when `source.image` has no runtime media; a runtime upload takes precedence; `effect.*`, `tone.*`, `finish.*`, `duotone.*`, background, image export, canvas size, and render scale defaults map directly from the supplied settings JSON.
- Files changed: `public/assets/lyonecho-blog-cover-art.png`, `src/app/dither-defaults.ts`, `src/app/app-schema.ts`, `src/app/dither-renderer.tsx`, `src/app/dither-effect.ts`, acceptance/performance config and tests, Playwright tests, `docs/toolcraft/default-artwork-preset-plan.md`, and this worklog.
- Verification: Exact schema defaults passed unit coverage; the focused real-browser lifecycle test proves the bundled 4096×4096 backing output, visible default controls, custom override, Clear fallback, and Reset to Size 33; targeted 2048×2048 source replacement, media import, worst-case preview, viewport zoom, and export performance scenarios pass; `pnpm verify:final` passed 165/165 static tests, the production build, and 86/86 sequential real-browser scenarios.
- Skipped checks: Full `pnpm verify:perf` is skipped because this is a post-first-version preset/default change and the user did not report a performance complaint; all directly touched media, preview, zoom, and export workload paths receive targeted performance coverage.
- Risks: The bundled PNG adds about 6.9 MB to the app and the 2048×2048 default at renderScale 2 creates a 4096×4096 backing canvas. Preview work is split across resize, prepare/effect, composite, and finish RAF phases so main-thread frame gaps stay within the existing budgets without reducing output fidelity.

### Iteration 11 — Dense Dots default preset

- Request: Make `/Users/kusnizza/Downloads/dither-port-settings (1).json` the app defaults.
- Task type: Tier 3 schema defaults, Reset behavior, persistence migration, acceptance, and targeted default-render workload verification.
- User-visible result: A clean launch and Reset now select Dots with Size 1, Fill 81, Density 8, and Exposure 189. The bundled Lyonecho image, Scatter 66, Seed 999, tone/finish/duotone/background/export values, 2048×2048 canvas, and 2× render scale remain unchanged because they already match the supplied file.
- Source/reference checked: `/Users/kusnizza/Downloads/dither-port-settings (1).json`, centralized typed app defaults, schema persistence, real browser default/Reset behavior, and dense 2048×2048 preview performance scenarios.
- Docs/contracts read: `workflow.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, and the required brainstorming and writing-plans skills.
- Contract rules applied: `controls-product-coverage`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- Decision: Change only the five imported values that differ from the current typed defaults and migrate local persistence from v2 to v3. Keep the existing bundled source and all matching values unchanged; align performance metadata with the new dense starting state. The dense Dots render keeps its exact formula but now splits its row walk into two preview phases; an in-flight frame finishes before the scheduler starts the newest request, preserving live slider output.
- Alternatives rejected: Runtime-importing the JSON on every load, copying defaults into route-local state, retaining persistence v2 and allowing old saved values to mask the requested defaults, changing the bundled image, or reducing render scale to offset the denser Dots workload.
- State/output mapping: `ditherDefaultValues` supplies schema `defaultValue` entries; first load and `controls.reset` use those entries; `effect.style`, `effect.size`, `effect.fill`, `effect.density`, and `effect.exposure` flow through the existing typed renderer settings into preview and export; persistence v3 stores later user edits without loading obsolete v2 state. Preview-only Dots phases write the same rows into the same overlay before compose, while synchronous export continues through the unchanged complete effect renderer.
- Files changed: `src/app/dither-defaults.ts`, `src/app/app-schema.ts`, `src/app/app-schema.test.ts`, `src/app/app-performance.ts`, `src/app/dither-effect.ts`, `src/app/dither-renderer.tsx`, `src/app/dither-effects/grid.ts`, `src/app/dither-effects/index.ts`, `src/app/dither-effects/types.ts`, `e2e/app-controls.spec.ts`, `docs/toolcraft/dots-default-preset-plan.md`, and this worklog.
- Verification: `pnpm verify:quick` passed 165/165 static tests; focused real-browser defaults/Reset, source replacement, media import, live Size drag, and dense preview scenarios passed 5/5, with a separate regression rerun passing 3/3; final `pnpm verify:final` passed 165/165 static tests, the production build, and 86/86 sequential browser scenarios.
- Skipped checks: Full `pnpm verify:perf` is skipped because this is a post-first-version preset change and the user did not report a performance problem; directly affected default/media/dense-render paths receive targeted sequential coverage.
- Risks: Dots at Size 1 is a denser initial Canvas 2D workload than the previous Halftone Size 33 preset; the existing phased preview pipeline must stay within browser budgets at 2048×2048 and renderScale 2.


### Template release repair — 2026-09-09

- Change ID: template-release-2026-09-09
- Entry type: focused
- Request: Make every gallery app cloneable through the published Toolcraft CLI and verify installation/startup.
- Changed owner: Upstream example snapshot packaging, integrity restoration, and public distribution metadata.
- User-visible result: The `dither-lab` template is admitted as a complete standalone snapshot; original framework hashes remain authoritative. Canonical identity regeneration, where needed, uses the upstream identity generator.
- Verification: Source template admission passed. Published dependency installation and browser startup results are recorded in the upstream `docs/template-release-report.md`; these smoke checks do not claim renderer or export certification.
- Risks: Historical templates retain their original runtime and workflow versions.

## Decisions

### Renderer

- Decision: Use a custom Canvas 2D renderer inside `ToolcraftApp canvasContent`.
- Reason: The reference effect is per-pixel/per-cell raster processing with canvas compositing.
- Evidence: Dither reference behavior uses raster sampling, text/geometry primitives, and compositing; the local typed registry implements those branches while the retained engine owns optional tone preparation, two effect overlays, sample/scratch reuse, target composition, and high-frequency preview coalescing.

### Timeline

- Decision: No timeline.
- Reason: Dither is a still-image effect editor with no product playback, scrub, or keyframe behavior.
- Evidence: `panels.timeline` is omitted and `appTransferMode.referenceTimeline.mode` is `none`.

### Layers

- Decision: No Layers panel.
- Reason: The product has one uploaded source image and one generated effect composite, not user-managed layer entities.
- Evidence: `panels.layers` is omitted; layer-like opacity/blend are schema controls for the effect composite.

### Controls

- Decision: Use built-in Toolcraft controls grouped as Source, Pixel Effect, ASCII, Tone, Texture & Lens, Duotone, Layer, Background, Image Export, and Export.
- Reason: Built-ins cover file upload, selects, sliders, switch, color, settings transfer, and sticky export actions.
- Evidence: `src/app/app-schema.ts` has no custom control renderers.

### Export

- Decision: Still product export uses sticky `Export PNG`, with format and 2K/4K/8K resolution controls.
- Reason: Toolcraft requires still products to expose PNG export and image export settings; JPG is an additional encoder path behind the same output action.
- Evidence: `exportDitherImage` calls `createToolcraftPngExportCanvas` with runtime background and image resolution.

### Performance

- Decision: Declare Canvas 2D pixel-output workload with stress fixtures for source media, render scale, heavy effect controls, viewport stability, and export; browser tests run sequentially so budgets are measured without worker noise.
- Reason: High-density image processing is the main risk surface.
- Evidence: `src/app/app-performance.ts` defines renderer pipeline passes and browser-backed performance scenarios; `DitherRenderer` coalesces stale requests while retaining leading and periodic live slider frames.

## Evidence

- Source reviewed: Dither public runtime and local Toolcraft docs.
- Product behavior: Custom image import, effect controls, background include/color, settings transfer, persistence, and export.
- Renderer pipeline: Decode source, optionally prepare tone, sample source, render/cached registered pixel effect, compose to target, apply duotone/texture/lens, place background behind output, export image.

## Verification

- Completed browser gate: `pnpm test:browser` passed 62/62.
- Completed performance checkpoint: `pnpm verify:perf` passed.
- Completed final gate: `pnpm verify:final` passed.
- Completed settings audit gate: `pnpm test` passed and targeted Playwright smoke passed 11/11.
- Completed algorithm parity gate: `pnpm verify:quick` passed and targeted Playwright renderer/performance smoke passed 23/23.
- Completed performance re-check: `pnpm verify:perf` passed 3/3 performance metadata tests and 23/23 browser performance scenarios.
- Completed expressive still-effects gate: `pnpm verify:final` passed 164/164 static tests, production build, and 86/86 sequential real-browser scenarios.
- Completed live slider preview gate: `pnpm verify:final` passed 164/164 static tests, production build, and 86/86 sequential real-browser scenarios, including held-pointer live output and high-frequency performance coverage.
- Completed bundled Lyonecho preset gate: `pnpm verify:final` passed 165/165 static tests, production build, and 86/86 sequential real-browser scenarios, including exact defaults, bundled/custom source lifecycle, 2048×2048 media stress, 4096×4096 preview backing pixels, and 2K/4K export dimensions.
- Local dev: `pnpm dev` after final checks.

## Risks

- Risk: CPU Canvas 2D can exceed budgets on 1920x1080 source media at renderScale 2 and dense ASCII.
- Mitigation: Stress fixtures and browser performance tests cover heavy source media, render scale, dense controls, viewport zoom, and export.
- Risk: Browser fonts can alter ASCII glyph metrics.
- Mitigation: Renderer uses explicit mono/font fallbacks and tests assert product-output changes rather than exact glyph pixels.
- Risk: Animation presets and video export remain absent from the Dither v1.4 reference surface.
- Mitigation: The current product is explicitly still-output; motion will be added only with runtime playback transport, video export, and corresponding browser/performance coverage.


## 2026-08-05 — Canonical product identity and deployment path

- User-visible result: Renamed the standalone product to `Dither Lab` and aligned its repository package plus public demo base to `dither-lab`. Product rendering, controls, defaults, and export behavior remain unchanged.
- Request: Apply the approved complete rename across code, folders, gallery identity, and deployment wiring without preserving old route aliases.
- Source/reference checked: The approved complete-app-renaming design and implementation plan, the current standalone package metadata, Vite/router base handling, `vercel.json`, identity metadata, and active acceptance/deployment assertions.
- Contract rules applied: Broad identity/deployment migration because the directory and public deployment identity change across the generated app boundary. Existing product-domain modules remain semantically named; the external Vercel stage must retain the current Project ID.
- State/output mapping: Package name, HTML title, control/acceptance identity, persistence/settings-transfer namespace where present, Vite base, public asset prefix, and Vercel rewrites now use `dither-lab`. Changed persistence namespaces intentionally reset prior browser-local settings.
- Verification: Canonical package/title/base audit and every available standalone `demo-deployment.test.mjs` passed for this migration batch.
- Risks: Old demo paths are intentionally absent; no compatibility redirect is retained.

### Default attachment verification — 2026-09-08

- `TOOLCRAFT_TEST_PORT=3470 pnpm verify:final`: passed docs/integrity (180 framework files), 4 script tests, 168 unit tests, production build, and 51 functional browser tests.
- `TOOLCRAFT_TEST_PORT=3471 pnpm exec playwright test e2e/app-controls.spec.ts --grep 'browser perf: source image workload changes preview' --workers=1`: passed (6 seconds total).
- Shared runtime: 15 targeted media state/reset/import/history tests and TypeScript check passed. The new same-ID replacement test was reproduced failing before the fix.
- `npm run build -- --base /demos/dither-lab/`: passed; the existing large-chunk advisory remains.
- Agent-browser screenshot confirms the original image thumbnail, removal button, and matching rendered output. Browser evidence: workspace `output/dither-default-asset/attached.png`.
- Environment setup: the already installed agent-browser skill was linked into the ignored local skill lookup for the legacy AI gate. Local dependencies were cloned into the worktree to keep Vite font URLs within its allow list. The asset base now safely defaults to `/` when imported by Node-based browser test discovery; Vite still supplies the deployed base.
