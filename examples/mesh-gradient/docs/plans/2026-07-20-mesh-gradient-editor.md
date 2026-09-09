# Mesh Gradient Editor — implementation plan

## Product specification

Build a Toolcraft-native editor for creating and animating mesh gradients. The
canvas starts with a real editable gradient, not an upload placeholder. Users
edit mesh nodes directly on the canvas, change the grid and palette from the
controls panel, tune interpolation and finishing, preview a seamless procedural
loop through the Toolcraft playback timeline, and export both still and animated
output.

Reference decisions:

- `meshgradient.com`: keep direct node dragging and separate color influence
  from visible output deformation, but combine both into one clearer canvas.
- `colorflow.ls.graphics`: use a rectangular grid, edge pinning, selectable
  color interpolation, global color correction, and procedural point/color
  animation.
- `feralui.dev/gradients`: use editable on-canvas color points plus broad
  controls for scale, distortion, swirl, speed/motion, soften, and noise.

## Product model

- One mesh entity, so Layers stay disabled.
- Editable-output canvas, default 1920×1080, raster render scale enabled.
- A bounded rectangular grid (2–4 columns × 2–4 rows). Each node owns a color,
  normalized position, influence radius, and strength. Direct dragging writes
  the same Toolcraft runtime target used by undo, reset, persistence, rendering,
  and export.
- WebGL2 full-canvas shader for continuous weighted color mixing with selectable
  sRGB, linear-RGB, and OKLab interpolation; Canvas 2D remains the export/readback
  surface.
- Playback timeline with a seamless forward loop. Procedural motion is derived
  from timeline progress and seeded integer harmonics so the first and last
  frames stitch.
- Local-storage persistence for user-edited values, canvas settings, and timeline
  settings. Settings transfer remains runtime-owned.

## Control section inventory

1. `Mesh` — grid topology, edge pinning, point collection actions, shuffle/reset
   geometry. Owns the mesh entity and direct editing workflow.
2. `Selected Point` — selected node color, radius, and strength. Visible only
   when a point is selected; owns one node's appearance and influence.
3. `Mixing` — interpolation, blend softness, warp, and swirl. Owns how the mesh
   field is combined.
4. `Color Correction` — exposure, contrast, hue, saturation, and lightness.
5. `Motion` — position drift, color drift, motion scale/cycles, randomness, and
   easing. Owns procedural animation; transport stays in the top timeline.
6. Runtime-required `Background`, `Image Export`, and `Video Export` sections.
7. Sticky `Export PNG` and `Export Video` panel actions.

Use built-in schema controls first: select/segmented, switch, slider, color,
collection/actions, and panelActions. Canvas point handles are renderer-owned,
textless editing overlays rather than custom panel controls.

## Files and implementation order

1. Update `src/app/app-schema.ts` with editable-output canvas, playback timeline,
   persistence, sections, defaults, conditional visibility, export settings,
   sticky actions, and `appControlSectionInventory` targets.
2. Add focused product modules under `src/app/mesh-gradient/` for mesh defaults,
   color conversion/math, the canonical renderer pipeline registration, WebGL2
   renderer, canvas handles, timeline evaluation, and PNG/video export.
3. Update `src/app/app-composition.tsx` to supply the custom canvas output,
   renderer registration, and panel action handlers without replacing runtime
   surfaces.
4. Update `src/app/app-acceptance-data.ts` to product readiness with coverage for
   all controls, canvas node dragging, conditional selected-point controls,
   background, persistence, playback loop, canvas sizing, and both exports.
5. Update `src/app/app-performance.ts`,
   `src/app/app-performance-impact.json`, and focused app-owned tests/e2e for the
   canonical shader pass, grid-size workload, animation, slider response, drag,
   zoom, PNG, and video paths.
6. Replace the starter entries in `docs/toolcraft/agent-worklog.md` with the
   reference evidence, decisions, mappings, verification tier, and final proof.

## Verification note

Verification tier: Tier 4

Reason: This converts a neutral generated starter into a complete animated
custom-renderer product with direct canvas manipulation, persistence, timeline,
PNG/video export, acceptance metadata, and performance envelopes.

Run: `npm run ai:check`; targeted Vitest and browser checks during development;
renderer-plan assessment and `npm run verify:kernel` only if the assessment
requires it; one final `npm run verify:delivery`; then `npm run dev` and a real
browser inspection of node dragging, controls, timeline, canvas zoom/pan,
background, reset/undo, persistence reload, and both exports.

Skip: Layers and media upload because the product has one procedural mesh and no
source-material workflow. Keyframes are deferred; this delivery uses the
Toolcraft playback timeline for a procedural seamless loop.

## Canvas mesh editing iteration

User-visible result: remove the spatial point map from the controls panel and
make the canvas the single place for selecting, moving, and curving the mesh.
The interaction follows the inspected ColorFlow reference: a selected node
reveals four mirrored Bezier handles, node movement deforms the connected grid,
and handle movement changes both the visible grid and the rendered color field.

Implementation order:

1. Replace the custom `Position Map` control with a built-in `Edit mesh` switch
   in `Topology`; the switch hides nodes, grid curves, and tangent handles while
   preserving the mesh and exported output.
2. Extend the persisted `mesh.points` value with sanitized horizontal and
   vertical tangent vectors, including backward-compatible defaults for saved
   layouts that predate tangent editing.
3. Render cubic grid paths and four textless tangent handles around the selected
   node. Route node and handle gestures through runtime values, grouped history,
   pointer capture, edge pinning, undo, reset, and persistence.
4. Feed tangent vectors into the existing WebGL pass so curve editing changes
   the actual gradient mixing rather than only the editing overlay.
5. Remove the obsolete custom renderer and panel-map styling; align acceptance,
   schema tests, browser tests, renderer invalidation, performance ownership,
   and the product worklog with the canvas-only editor.

Verification tier: Tier 4

Reason: This changes the canonical canvas interaction model, persisted mesh
shape, WebGL output, editing overlay, and renderer invalidation paths.

Run: `npm run ai:check`; targeted schema/model/acceptance tests; focused browser
checks for the switch, node drag, tangent drag, undo, export cleanliness, pan
fall-through when hidden, and console errors; affected renderer performance
paths; one `npm run verify:delivery`; then `npm run dev` and a final real-browser
inspection.

Skip: Layers, upload, and timeline redesign because this iteration changes the
editor surface and curve geometry without changing the one-mesh product model,
source flow, or existing playback/export intent.

## Exact ColorFlow point mechanics correction

User-visible result: replace the earlier approximation with the point and curve
mechanics observed in the current public ColorFlow runtime. Point dragging keeps
the pointer's initial offset instead of snapping the node center under the
pointer. With `Fix edges` off, every node can move freely beyond the output
bounds. With it on, every perimeter node is hidden from editing and completely
locked. Moving a node translates its four relative Bezier handles without
changing them.

Reference behavior recorded from `https://colorflow.ls.graphics/` on
2026-07-20:

- every rectangular-grid node stores four independent normalized vectors:
  `handleLeft`, `handleRight`, `handleUp`, and `handleDown`;
- unavailable perimeter directions start at `{x: 0, y: 0}` and are not rendered;
- `smooth` / “Mirror Angle” replaces the opposite handle with the exact negated
  vector while dragging; `corner` / “No mirroring” leaves it unchanged;
- a point double-click toggles those modes; returning to `smooth` resets the
  horizontal and vertical pairs to the reference's averaged axis-aligned form;
- point and handle drags are delta-based from pointer-down, so grabbing the edge
  of a hit target never causes a jump;
- grid curves use the directional handle that faces the neighboring point;
- the gradient surface is a tessellated Coons patch per grid cell. Vertex color
  is bilinear within each patch and the rendered surface deforms with the same
  curves shown by the editor.

Implementation order:

1. Replace the symmetric `horizontal` / `vertical` tangent schema with four
   directional handles plus `smooth | corner`, including migration from the
   previous saved shape and a persistence version bump.
2. Make point and handle gestures delta-based, allow unbounded normalized point
   positions, hide and lock all edge nodes when `Fix edges` is enabled, and add
   the reference double-click mode toggle.
3. Render only non-zero directional handles with reference-sized visible dots
   and enlarged transparent hit targets; build every guide curve from its
   facing pair.
4. Replace the radial weighted-field shader with CPU tessellation of the same
   Coons patches consumed by a retained WebGL vertex/index pipeline. Preserve
   timeline motion, color correction, background, image export, and video export
   through the same canonical render function.
5. Update acceptance and browser proof for no-jump movement, free out-of-bounds
   dragging, fixed-edge locking/hiding, exact handle mirroring, visible curve
   deformation, renderer output, undo, reload, and export cleanliness.

Verification tier: Tier 4

Reason: This corrects the persisted geometry model, all canvas geometry gestures,
the product renderer, export pixels, and performance-owned renderer passes in
one coherent post-generation rewrite.

Run: focused model and acceptance Vitest; typecheck and build; focused Playwright
for mesh editing and export cleanliness; browser inspection against ColorFlow at
equivalent node/handle gestures; affected performance paths; one
`npm run verify:delivery`; then `npm run dev`.

Skip: Layers, upload, topology redesign, and timeline redesign. They do not
participate in the requested point mechanics correction.

## ColorFlow canvas and renderer parity correction

User-visible result: make the editable canvas sharp at the selected Resolution
scale and make the editor occupy the canvas like the deployed ColorFlow
reference instead of showing one cropped center node over a stretched low-
resolution preview.

Reference evidence recorded from `https://colorflow.ls.graphics/` on
2026-07-20:

- the default mesh/output coordinate space is 800×600 with three rows and four
  columns, and the desktop viewport fits that output between the side panels;
- the preview uses a Three.js WebGL renderer with antialiasing, pixel ratio
  `min(devicePixelRatio, 2)`, and `setSize()` from a `ResizeObserver`;
- at a 789×592 CSS size and DPR 2, the live backing canvas is 1578×1184;
- the editor is a single SVG enlarged by 1000 CSS pixels on every side with a
  padded viewBox, `overflow: visible`, and constant-screen-size geometry;
- nodes use a 44px transparent hit radius, a 12px colored visible circle, white
  outline, and subtle dark outer ring; grid curves use a dark 2px underlay plus
  a white 1px overlay;
- idle geometry uses tessellation level 64 and `setDragging(true)` temporarily
  lowers it to 16 until the pointer gesture ends.

Root cause in the current implementation:

- `interactivePreviewMaxWidth = 640` permanently reduced the canvas backing to
  640×360 and CSS stretched it over a 1920×1080 output;
- the backing calculation multiplied DPR and Toolcraft Resolution scale even
  though the Toolcraft scale already owns the 1×–2× backing-pixel choice;
- the editor layer used `overflow: hidden` on the product root, so every edge
  node and half of its hit target were clipped;
- the 1920×1080 initial canvas was shown at runtime 100% zoom, while the
  reference starts from its explicit 800×600 source size and therefore fits in
  the available viewport.

Implementation order:

1. Change the reference-derived initial canvas to 800×600, bump persistence so
   stale 1920×1080/selected-node defaults do not mask the corrected editor, and
   align canvas-size acceptance fixtures.
2. Remove the 640px cap and size the live backing canvas to observed CSS size ×
   selected Toolcraft Resolution scale, preserving the user's chosen 1×–2×
   quality without an extra DPR multiplier.
3. Replace the clipped HTML overlay with one expanded SVG whose normalized
   viewBox, hit circles, colored nodes, double-stroke curves, tangent lines, and
   tangent handles follow the measured ColorFlow geometry.
4. Start with no selected node; select on pointer-down, reveal handles only for
   that node, and keep the already-ported delta drag, out-of-bounds, fixed-edge,
   smooth/corner, undo, reset, and persistence semantics.
5. Render Coons patches at tessellation 64 while idle and 16 during point or
   handle drag, returning to 64 on pointer-up/cancel without reducing backing
   resolution.
6. Update performance technique text, impact ownership, focused unit/browser
   acceptance, worklog evidence, and inspect backing/CSS/SVG geometry against
   the live reference at the same viewport.

Verification tier: Tier 4

Reason: The batch changes initial canvas sizing, persisted defaults, preview
backing pixels, the full editing overlay, geometry workload during gestures,
and the performance-owned renderer path. The user also explicitly reported a
quality/performance regression, so this delivery qualifies for the protected
explicit-performance refresh path.

Run: `npm run ai:check`; focused model/schema/acceptance Vitest; typecheck and
build; focused browser checks for sharp backing ratio, all edge-node hit areas,
selection/drag/handle release, 64→16→64 tessellation, undo, reload, viewport
pan/zoom, and export cleanliness; one
`npm run verify:delivery -- --reason=explicit-performance-work`; then
`npm run dev` and a final same-viewport comparison with ColorFlow.

Skip: Layers, upload, control-panel redesign, timeline transport redesign, and
export format changes because none are needed to correct canvas/editor parity.

## Exact ColorFlow selection, overflow, and deletion parity

User-visible result: the mesh editor behaves like ColorFlow rather than like a
bounded canvas widget. Points, tangent handles, guide curves, marquee, and
multi-selection may remain visible and interactive outside the artwork bounds;
the artwork itself stays clipped to the output rectangle. A selected point can
be deleted with Delete or Backspace using ColorFlow's topology-preserving
row/column rule.

Reference evidence recorded from `https://colorflow.ls.graphics/` and the
provided screenshot
`codex-clipboard-d34eb334-1ea7-458d-ad3b-edc643574581.png` on 2026-07-20:

- the editor SVG extends 1000 CSS pixels past every artwork edge and uses a
  correspondingly padded viewBox;
- the SVG belongs to the transformed canvas world but is not clipped by the
  output rectangle, while the rendered gradient remains clipped;
- plain pointer-down replaces selection, Shift adds, and Command/Ctrl toggles;
- dragging a selected member of a multi-selection moves every selected point by
  the same unbounded delta;
- dragging empty editor space creates a marquee; Shift-marquee adds to the
  existing selection and plain background interaction clears it first;
- tangent handles appear only when exactly one point is selected; point
  double-click still toggles smooth/corner handle behavior;
- Delete/Backspace uses the first selected point and preserves a rectangular
  grid: top/bottom points delete their row, left/right points delete their
  column, and interior points delete their row, never reducing either dimension
  below two.

Root cause in the current implementation:

- Toolcraft correctly clips product output inside
  `[data-toolcraft-editable-canvas]`, but the product placed the editor overlay
  in that same clipped element;
- selection state represented only one index, so modifier selection, marquee,
  grouped motion, and reference deletion semantics could not be expressed;
- the current collection remove action deletes one color independently of mesh
  topology and therefore cannot serve as the canvas Delete action.

Implementation order:

1. Extend the persisted layout reader and point interaction helpers with an
   ordered selected-index set, modifier selection, marquee selection, grouped
   delta movement, and topology-aware row/column deletion with legacy migration.
2. Render the interactive editor through a product-owned portal attached to
   `[data-toolcraft-canvas-world]`; retain the gradient canvas in the clipped
   output node and retain Toolcraft pan/zoom transforms for both layers.
3. Add exact background selection gestures and selected-node rendering to the
   expanded SVG, showing tangent controls only for a single selected node.
4. Route Delete/Backspace through grouped Toolcraft control commands so points,
   colors, and column count update as one undoable topology edit.
5. Add focused model and browser acceptance for modifier selection, marquee,
   grouped out-of-bounds drag, visible overflow points, deletion priority,
   minimum grid dimensions, undo, and clean exported pixels.

Verification tier: Tier 4

Reason: This batch changes the persisted geometry selection model, canvas-world
composition, pointer and keyboard interaction, topology mutation, undo state,
renderer inputs, acceptance coverage, and viewport behavior.

Run: `npm run ai:check`; focused point-interaction/model and acceptance Vitest;
typecheck and build; focused Playwright for overflow visibility, modifier and
marquee selection, multi-point movement, row/column deletion, undo, pan/zoom,
reload, and export cleanliness; one `npm run verify:delivery`; then
`npm run dev` and final browser comparison with ColorFlow.

Skip: Upload, layers, timeline transport redesign, and gradient-type expansion.
Those surfaces do not participate in this exact point-interaction correction.

## Double-click line insertion parity

User-visible result: double-clicking a visible horizontal mesh curve inserts a
new column at the clicked curve parameter; double-clicking a vertical curve
inserts a new row. The new row or column is a real rectangular topology
divider, so it can be edited, selected, animated, deleted, exported, undone,
and persisted exactly like the existing mesh points.

Reference evidence recorded from the current ColorFlow application bundle on
2026-07-20:

- curve picking distinguishes horizontal and vertical cubic grid segments;
- a horizontal-segment insertion evaluates every row's corresponding cubic at
  the same local parameter and therefore creates one coherent column;
- a vertical-segment insertion applies the same rule across every column and
  creates one coherent row;
- inserted colors are interpolated between the two surrounding endpoint
  colors, while existing point positions, colors, and handles are preserved;
- the new points receive default directional handles for the resulting grid;
- insertion remains bounded by the editor's existing 16-point workload limit.

Implementation order:

1. Add pure row/column insertion helpers to the mesh interaction model:
   evaluate cubic position, interpolate color, preserve existing data, create
   default handles for inserted nodes, clear selection, and reject mutations
   that would exceed 16 points or operate on a non-rectangular layout.
2. Split the combined editor guide into addressable horizontal and vertical
   cubic segments, place transparent stroke hit-targets over the visible
   curves, and estimate the closest local cubic parameter from the double-click
   position in artwork coordinates.
3. Route the insertion through grouped Toolcraft control commands for colors,
   columns when required, and point layout so one history step restores the
   previous topology.
4. Raise the columns control and renderer clamps from four to the model-derived
   maximum of eight; the total-point limit continues to reject unreachable
   combinations and insertion beyond the renderer budget.
5. Add unit coverage for geometry, color, handles, bounds, and topology plus a
   real pointer-based browser acceptance check for both curve orientations,
   output change, undo, and persistence.

Verification tier: Tier 4

Reason: The batch adds a topology-changing canvas gesture, expands the reachable
column-count range, changes persisted renderer inputs, and extends product
acceptance. It keeps the existing renderer technique and 16-point workload
boundary.

Run: `npm run ai:check`; focused mesh interaction, schema, acceptance, and
renderer tests; typecheck and build; focused Playwright for horizontal and
vertical line insertion, undo, reload, point selection, and export cleanliness;
one `npm run verify:delivery`; then `npm run dev` and a final in-browser
comparison with ColorFlow.

Skip: the full browser performance refresh because the renderer technique,
pass structure, and enforced 16-point maximum do not change; upload, layers,
timeline transport, and export formats are also outside this interaction.

## Ten rectangular mesh preset previews

User-visible result: a new Presets section shows ten local 4:3 mesh-gradient
thumbnails. Clicking any card replaces the complete rectangular mesh topology
and palette with that preset, clears point selection, changes the live WebGL
output immediately, persists the chosen result, and remains editable through
the existing points, colors, handles, animation, and export workflow.

Reference evidence recorded from the current ColorFlow production gallery on
2026-07-20:

- presets render as image-backed buttons in a two-dimensional thumbnail grid;
- every card uses a 4:3 rectangle, cover image, hidden name, hover shade, and a
  selected preset loads one complete serialized ColorFlow scene;
- the gallery lazily decodes static thumbnail assets rather than running one
  live WebGL renderer per card;
- ColorFlow also supports remote loading, deletion, and effect-bearing scenes,
  but the user explicitly requests ten built-in mesh-only presets.

Control selection inventory:

- Product need: choose one visual mesh preset from ten previews.
- Value model: one preset id from a fixed visual option set.
- Candidate built-ins checked: `imagePicker`, `select`, `actions`, custom
  control.
- Best built-in: `imagePicker`, whose runtime-owned cards already use 4:3
  thumbnails and selection semantics.
- Rejected alternatives: `select` and `actions` have no visual preview; a
  custom gallery would duplicate the built-in ImagePicker grid; ten live
  canvases would multiply WebGL work and animation scheduling.
- Target: `mesh.preset`, with `custom` as the non-card default so existing
  persisted artwork is not overwritten when this feature first appears.
- Renderer/export mapping: preset selection synchronizes existing
  `mesh.colors`, `mesh.columns`, and `mesh.points`; preview and export continue
  through the canonical mesh passes without a new renderer.
- Acceptance: choose every visible card through the real ImagePicker, prove ten
  distinct frame signatures and rectangular point topology, then edit one
  point and prove the preset selection becomes custom without losing edits.

Implementation order:

1. Add a focused `mesh-presets.ts` registry with ten deterministic rectangular
   palettes/topologies and lightweight SVG data-URI thumbnails derived from the
   same points and colors.
2. Add a Presets schema section before Color Points using built-in
   `imagePicker`; update the section inventory, readiness text, persistence,
   acceptance row, and exact all-item browser scenario.
3. Add a focused preset synchronization hook: a newly selected preset applies
   its topology with skip-history secondary writes while the ImagePicker target
   owns selection history; manual color/column/point edits clear the selected
   preset to `custom` so persistence never overwrites authored work.
4. Keep the existing 4–16 point workload ceiling and renderer technique; static
   thumbnails add no animation or WebGL passes and selecting a preset reuses the
   existing mesh invalidation route.
5. Add pure preset-registry tests, schema/acceptance coverage, and pointer-based
   Playwright proof for all ten rectangular previews, output mutation,
   persistence-safe custom edits, Reset, and clean export behavior.

Verification tier: Tier 3

Reason: The batch adds a visible schema control and persisted preset state that
rewrites existing canvas renderer inputs, but it does not change the WebGL
technique, pass structure, output/export algorithms, or 16-point workload
boundary.

Run: `npm run ai:check`; focused preset/model/schema/acceptance/performance
Vitest; typecheck and build; focused browser acceptance for all ten thumbnails,
output mutation, custom-edit deselection, reload, reset, and export cleanliness;
one `npm run verify:delivery`; then `npm run dev`.

Skip: full performance refresh, kernel benchmark, Layers, upload, timeline
transport, post-effects, and export-format changes because preset thumbnails
are static and the selected topology reuses already bounded renderer inputs.

## Two additional rectangular mesh presets

User-visible result: the existing Presets section grows from ten to twelve 4:3
mesh-only cards. `Citrus` adds a high-contrast lime/yellow/cobalt scene and
`Iris` adds a tall 3×5 indigo/lavender/coral topology, giving both a distinct
palette and a distinct grid shape without changing selection behavior.

Implementation order:

1. Add the two deterministic scene specifications to `mesh-presets.ts`; keep
   every point count rectangular and inside the existing 4–16 bound.
2. Update preset registry tests, readiness/acceptance copy, and the exact
   browser fixture from ten to twelve options.
3. Add a Delivery 8 worklog entry and verify all twelve cards through the same
   built-in ImagePicker and existing mesh invalidation route.

Verification tier: Tier 3

Reason: The option set and renderer inputs gain two reachable scenes through a
performance-owned preset module, while schema structure, WebGL passes,
workload limits, persistence mechanics, animation, and exports remain
unchanged.

Run: `npm run ai:check`; focused preset/acceptance/performance Vitest;
typecheck/build; exact Playwright preset-gallery scenario covering all twelve;
one `npm run verify:delivery`; then `npm run dev`.

Skip: full performance refresh, kernel benchmark, Layers, upload, timeline,
and export checks because the new cards are static and use the existing bounded
mesh pipeline.

## Exact SVG export and three-button footer layout

User-visible result: the sticky footer shows `Export PNG` and `Export SVG` in
the first equal-width row, followed by `Export Video` across the full second
row. SVG export downloads the current paused/scrubbed frame as a standards-safe
SVG document whose logical width, height, and viewBox match `canvas.size` and
whose embedded PNG preserves the complete WebGL appearance, transparency, and
selected 2K/4K/8K image resolution.

Control selection inventory:

- Product need: download exact still output as PNG or SVG and animation as
  video with the requested visual priority.
- Value model: three final export commands.
- Candidate built-ins checked: `panelActions`, body `actions`, custom footer.
- Best built-in: existing sticky `panelActions`; its runtime-owned odd final
  action spans both columns.
- Rejected alternatives: custom footer duplicates Toolcraft layout/pending
  behavior; body actions are not sticky final delivery commands; native
  `meshgradient` cannot reproduce the complete current WebGL finish reliably.
- Targets/actions: `export.png`, `export.svg`, and `export.video` under the
  existing `export.actions` owner.
- Renderer/export mapping: SVG reuses the current still-frame render and Image
  Export resolution/background values, encodes one PNG payload, and wraps it in
  an SVG document; video is unchanged.
- Acceptance: prove exact two-plus-one button geometry, real `.svg` download,
  valid XML/namespace/viewBox, embedded PNG dimensions and non-empty pixels,
  and all three action outcomes through the existing sticky progress owner.

Implementation order:

1. Add `export.svg` between PNG and Video in schema action order, using the
   built-in export-image role and upload icon.
2. Refactor the still-frame canvas creation inside `mesh-export.ts`, add an
   exact `exportMeshSvg` handler, encode its PNG payload as a data URL, escape
   stable SVG attributes, and download `mesh-gradient.svg`.
3. Route `export.svg` through the existing canonical `mesh-export` pass.
4. Extend action acceptance plus export helpers/tests to inspect XML and the
   embedded image, and assert first-row/second-row button geometry.
5. Update performance ownership/worklog without changing the renderer plan,
   workload boundary, timeline, persistence, or export settings sections.

Verification tier: Tier 3

Reason: This adds a user-visible export command, changes sticky footer layout,
and produces new downloaded bytes through the existing export pass. It does
not change preview rendering, animation, WebGL resources, or workload limits.

Run: `npm run ai:check`; focused export/schema/acceptance/performance Vitest;
typecheck/build; exact SVG/footer Playwright acceptance; one
`npm run verify:delivery`; then `npm run dev` and final in-app visual check.

Skip: full performance refresh and kernel benchmark because SVG reuses the
existing bounded still render and introduces no new renderer pass or workload
dimension; Layers, upload, and timeline behavior are unchanged.
