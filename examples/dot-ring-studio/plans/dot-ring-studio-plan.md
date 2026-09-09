# Dot Ring Studio Plan

## Verification Note

Verification tier: Tier 4
Reason: Major post-generation iteration with schema controls, custom Canvas 2D waveform math, timeline loop behavior, PNG/video export coverage, acceptance, browser, and performance coverage.
Run: `pnpm verify:final`, then `pnpm dev`.
Skip: `pnpm install` unless dependency or lockfile state changes.

## Iteration 2 Fix Plan

- Reference analysis: re-sample the ffmpeg-extracted frames by angular/radial bins to confirm active-sector direction, width, and amplitude split.
- Schema: split color controls into a `Bead Colors` section with five color targets and spread; replace the single waveform amplitude with Speed, Rotation, Sector angle, Active amp, and Calm amp.
- Renderer: keep Canvas 2D but replace low-frequency lobe deformation with a clockwise active sector, higher-frequency local waveform ripples, calmer circumference movement, and whole-cycle phase values that close at the timeline loop boundary.
- Acceptance: add product rows for every new visible control and update state/output tests.
- Performance: keep density/rows/radius/canvas/video resolution as workload controls; add responsiveness coverage for five colors and the new waveform controls.
- Browser: verify color changes, motion controls at a non-zero scrubbed frame, seamless timeline playback behavior, export dimensions, and performance budgets.

## Renderer Technique Decision Matrix

- sourceRepresentation: `procedural-data`
- productRepresentation: `vector`
- previewRenderer: `canvas-2d`
- exportRenderer: `canvas-2d`
- rendererWorkload: `vector-output`
- rendererStrategy: `canvas-2d`
- whyNotAlternativeStrategies: SVG was rejected because dense animated bead geometry would create hundreds to thousands of animated nodes; DOM was rejected because the product is geometric output rather than UI; WebGL was rejected until Canvas 2D performance evidence fails because the current workload is circles and fills, not pixel-output shading.
- fidelityRisks: Canvas rasterizes vector bead geometry, so preview and export must draw at native output size with retina export dimensions.
- performanceRisks: Density, rows, canvas size, UHD pixel-budgeted 4K video export, playback frames, drag, and zoom can expose frame gaps.
- export/copy product-quality: PNG and video use the same draw function as preview; PNG background inclusion is delegated to the standard Toolcraft export helper.

## Renderer Layer Inventory

- backgroundLayer: kind `background`, renderer `canvas-2d`, content `composite`, primitiveCount `low`, exportMode `included`.
- productForegroundLayer: kind `product-foreground`, renderer `canvas-2d`, content `geometry` and `dense-pattern`, primitiveCount `high`, exportMode `included`, uiSelector `[data-dot-ring-canvas]`.
- exportComposite: Preview, PNG, and video draw the same background and foreground semantics into one canvas for performance while keeping the layer inventory mirrored in `app-performance.ts`.
