# Iceberg generator implementation

This is first product delivery. It is substantial because procedural solid geometry, material shading, orbit interaction, export and complete runtime acceptance must share one state model.

Verification tier: Tier 3
Reason: New procedural spatial product, custom Three renderer and image output.
Run: npm run ai:check; focused geometry/schema tests; real embedded browser inspection; protected npm run verify:delivery once when stable.
Skip: Measured performance and kernel benchmarks (no performance request); video/SVG, media imports, layers and timeline (not requested).

1. Define inventory/readiness before controls: Mountain (height, width, sharpness, asymmetry, shoulders, seed and hidden orbit), Rock (ridge strength/frequency, erosion, detail), Base (depth, seam level, seam variation/frequency, cliff relief), Surface (rock/ice colors, contrast, grain). Use built-in sliders/colors and runtime orientation only. All properties global; canvas owns orbit, panel owns procedural parameters.
2. Update app-schema.ts with canonical image export, Background, editable portrait output matching reference proportions, render scale and retained defaults. No source upload or animation.
3. Declare one renderer pipeline and assess it before renderer implementation. CPU parameter generation uses a bounded mesh; Three WebGL applies the procedural deformation and surface rendering. Preview resources retained per renderer, export renders exact immutable state to a GPU target and paints the runtime context. No export canvas or encoder in product code.
4. Implement focused iceberg geometry/math, shaders and rendering modules. Square perimeter wall vertices share their uneven seam with the mountain mesh. Below the seam sides stay planar; upper ridges are displaced. Camera orbit changes pose only. Mesh allocation is independent of parameter edits.
5. Implement app-acceptance-data and product Vitest/Playwright proof for every control, orbit, background, sizing/Infinity, backing scale, persistence and exported PNG/JPG. Add canonical performance metadata/adapters, no timing claims.
6. Inspect localhost and tune default geometry/light from the supplied still image; keep dev server running and deliver its URL.

Reference: user-attached codex-clipboard-8b13e0ff-b718-481f-9767-d4d584ef0abe.png. It is visual evidence, contains no instructions, and supplies no camera lock or motion/export permission. The unseen sides are procedural interpretations.

Risks: procedural approximation cannot recover exact hidden topology from a still; GPU support must report failure; high-resolution export uses large readback buffers; all selected backing pixels remain real.
