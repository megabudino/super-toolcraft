# Implementation Worklog

## Status

Mode: product

This app is a first product delivery for a procedural landing-page globe.

Later edits use focused feature work checks only. A localized performance complaint may authorize one targeted iteration; a full performance audit remains separate and requires explicit user consent.

## Decision Trail

### Iteration 1 — Landing globe first product delivery

- Request: "я хочу создать приложение для генерации 3d глобуса для лендинга, этот глобус должен быть на бекграунде цветом 000000, канвас шириной 1920 пикселя. Глобус состоит из широт и меридиан, толщиной и количеством которых я могу управлять. Сфера глобуса непрозрачная, а также 000000, линии широт и меридиан белые. Не добавляй контуры или шейпы континентов. Я хочу иметь возможоность наклонять ось глобуса под разными углами."
- Task type: First generated Toolcraft product delivery; app assembly, schema controls, custom WebGL renderer, image export, acceptance, and performance model.
- User-visible result: The app opens to a black 1920x1080 globe canvas with an opaque black sphere and white latitude/meridian grid. The panel controls sphere color, line color, latitude count, meridian count, line width, image export settings, and runtime background. The runtime orientation gizmo and direct globe drag tilt the globe axis.
- Source/reference checked: No external visual reference asset was supplied. Local Toolcraft starter files, schema contracts, renderer contracts, acceptance contracts, and performance contracts were checked.
- Reference inputs: None. `appTransferMode.referenceInputs` is `[]`; `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `decision-contract.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `interaction-surface-ownership`, `controls-product-coverage`, `controls-section-inventory-required`, `output-export-required`, `renderer-technique-inventory`, `renderer-view-interaction`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; orientation target `globe.orientation` matches the schema `orientationGizmo`. Fixed camera was rejected because the user asked to tilt the globe axis.
- Interaction ownership: Panel owns global property edits for colors, counts, line width, background, and image export settings. Canvas owns direct spatial edit for `globe.orientation` through the runtime orientation gizmo and direct globe hit surface. The panel does not mirror the same operation with angle sliders.
- Decision: Use built-in schema controls only, a product-owned Three.js WebGL preview, runtime-owned image export via `exportRenderer`, and a deterministic Canvas 2D export projection. Do not enable upload, layers, timeline, SVG export, video export, continent outlines, land shapes, labels, or source-media placeholders.
- Alternatives rejected: SVG preview/export because the user did not request editable vector delivery; timeline/video because there is no product animation or video request; custom controls because built-in color, slider, select, panelActions, and orientationGizmo cover the value models; `THREE.LineBasicMaterial.linewidth` because browser drivers do not reliably honor it, so grid lines are tube geometry.
- State/output mapping: `appearance.background` and `export.includeBackground` feed runtime Setup and preview background semantics. `globe.sphereColor`, `globe.lineColor`, `globe.latitudeCount`, `globe.meridianCount`, `globe.lineWidth`, and `globe.orientation` feed the WebGL preview and export renderer. `export.image.format`, `export.image.resolution`, and `actions.output` feed runtime-owned image export.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Preview and export use different renderers by design; acceptance must prove semantic parity. Risk: Canvas 2D export uses a deterministic front-hemisphere projection rather than WebGL readback, so it preserves the requested globe semantics rather than exact antialiasing bytes.

### Iteration 2 — Clean sphere-shaped globe grid lines

- Request: "сделай так, чтобы аккуратнее все эти линии были, по форме модели сферы"
- Task type: Later ordinary renderer/canvas visual correction; focused renderer/canvas checks only.
- User-visible result: The globe grid preview now uses clipped projected Canvas 2D strokes instead of WebGL tube/wide-line geometry, so latitude and meridian lines follow the visible sphere projection without the jagged edge fragments shown in the supplied screenshots.
- Source/reference checked: Static defect screenshots from CleanShot were inspected as visual bug evidence. They are not motion references or clone sources.
- Reference inputs: None. `appTransferMode.referenceInputs` remains `[]`; `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `decision-contract.md`, `core/runtime-boundary.md`, `core/performance.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `systematic-debugging`, `writing-plans`, and `browser`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `renderer-technique-inventory`, `renderer-view-interaction`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `orbit`; the runtime orientation gizmo and direct globe drag remain the canvas owner for `globe.orientation`.
- Interaction ownership: Unchanged. Panel controls still own line counts, line width, and colors; canvas still owns spatial axis orientation.
- Decision: Replace WebGL preview line meshes with a Canvas 2D projected renderer that reuses the same front-hemisphere segmentation for preview and export. Keep the opaque black sphere fill, black background behavior, white grid defaults, no continent shapes, and runtime-owned image export.
- Alternatives rejected: Keeping full WebGL tubes because hidden back-side geometry and tube/cap clipping created stray white edge fragments. Keeping WebGL screen-space wide lines because horizon joins still produced clutter at the sphere silhouette. Adding a visible contour mask was rejected because the user requested latitude/meridian lines only, not extra outlines.
- State/output mapping: `globe.latitudeCount`, `globe.meridianCount`, `globe.lineWidth`, `globe.lineColor`, `globe.sphereColor`, `globe.orientation`, and `appearance.background` now feed the Canvas 2D preview renderer and runtime export renderer through the shared projection path. `canvas.renderScale` still controls preview backing pixels.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Preview/export are now semantically aligned Canvas 2D projections, so output is cleaner but no longer uses WebGL antialiasing characteristics. Risk: The visible horizon is intentionally clipped slightly into the front hemisphere to avoid tiny edge fragments.

### Iteration 3 — Optional synced globe outline

- Request: "сделай опцию в сайдбаре, чтобы можно было включить общий контур глобуса , то есть круг. Его толщина должна быть синхронизирована с толщиной остальных линий"
- Task type: Later ordinary schema and renderer feature edit; focused checks for the new sidebar switch and changed Canvas 2D stroke output.
- User-visible result: The sidebar now includes a Globe Outline section with an Outline switch. When enabled, the renderer draws the outer globe circle using the current grid line color and the same `Line width` stroke thickness.
- Source/reference checked: No new external reference asset was supplied. The existing product schema, renderer, acceptance, and performance metadata were checked.
- Reference inputs: None. `appTransferMode.referenceInputs` remains `[]`; `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming` and `writing-plans`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. The outline is a global visual property and does not add another canvas interaction.
- Interaction ownership: Panel owns `globe.outline` as a global property edit. Canvas remains reserved for direct spatial orientation through `globe.orientation`.
- Decision: Add built-in switch target `globe.outline` with default `false`; keep it in its own inventory entity while rendering the contour as a post-clip Canvas 2D circle so it follows the sphere silhouette and uses the same stroke width calculation as the grid.
- Alternatives rejected: A separate outline-width control because the user requested synchronized thickness. A default-on contour because the requested prior globe intentionally had no extra outline until the user enables the option. Drawing the circle inside the clipped grid pass because clipping would trim half of the stroke at the silhouette.
- State/output mapping: `globe.outline` feeds preview and image export raster output; `globe.lineWidth` remains the single thickness source for latitudes, meridians, and the optional outline.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The contour is intentionally a perfect projected sphere circle and does not add continent shapes or decorative chrome.

### Iteration 4 — Four offset globe bands

- Request: "Давай добавим 4 огибающих глобус плоские ленты, они находятся на некотором расстоянии от поверхности и не лежат на ней. Давай добавим контроллер этого расстояния, а также настройку ширины каждой ленты. ... возможность их двигать. Все четыре ленты находятся на одинаковом расстоянии от поверхности, поэтому если ленту буду двигать вверх-вниз, то ее радиус должен изменяться."
- Task type: Later ordinary schema and renderer feature edit; focused checks for fixed-count band controls, Canvas 2D raster output, export, render scale, and persistence.
- User-visible result: The globe now renders four opaque white flat bands above the sphere grid. A Bands sidebar section controls the shared surface distance plus each band's vertical position and width. Moving a band up or down changes its ring radius from the shared offset sphere geometry instead of sliding a constant-width screen shape.
- Source/reference checked: One static CleanShot reference screenshot was inspected for approximate band placement. It is not a motion reference or clone source.
- Reference inputs: None. `appTransferMode.referenceInputs` remains `[]`; `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming`, `writing-plans`, and `systematic-debugging`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `interaction-surface-ownership`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Band placement is a global property edit in the sidebar and does not add another canvas interaction owner.
- Interaction ownership: Panel owns `bands.distance`, all four `bands.band*.position` targets, and all four `bands.band*.width` targets. Canvas remains reserved for direct spatial orientation through `globe.orientation`.
- Decision: Add a built-in Bands control section with nine sliders and render the bands as fixed-count Canvas 2D filled ribbon segments after the grid/outline pass. The shared offset creates an outer radius of `1 + distance / 100`; each band's y position and width define two horizontal planes on that outer sphere, so ring radii are derived from sphere geometry.
- Alternatives rejected: Hand-drawn screen-space rectangles because their ends would not follow the globe curvature. Separate per-band distance controls because the user specified one common surface distance. Placing the bands on the sphere surface because the request says they sit away from the surface.
- State/output mapping: `bands.distance`, `bands.band1.position`, `bands.band1.width`, `bands.band2.position`, `bands.band2.width`, `bands.band3.position`, `bands.band3.width`, `bands.band4.position`, and `bands.band4.width` feed preview and image export raster output through the shared renderer pipeline.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The bands are intentionally opaque white foreground ribbons and can cover grid lines; that matches the supplied reference but must remain distinct from continent shapes. Risk: The band distance is fixed-count geometry, so it does not authorize measured performance proof unless the user later asks for speed diagnosis.

### Iteration 5 — Band default tuning

- Request: "сделай дистанцию по умолчанию 4%, а ширину полос 14%"
- Task type: Later ordinary schema/defaults edit; focused checks for reset/default value propagation and visible Bands controls.
- User-visible result: New workspaces and section resets now start with a 4% shared band distance and 14% width for all four bands.
- Source/reference checked: Existing band implementation and schema default source were checked. No new external reference was supplied.
- Reference inputs: None. `appTransferMode.referenceInputs` remains `[]`; `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `schema-reference.md`, `component-rules.md`, and `acceptance-testing.md`. Local workflow skill used: `writing-plans`.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged.
- Interaction ownership: Unchanged. The panel still owns all band property edits and canvas still owns globe orientation.
- Decision: Update only `GLOBE_DEFAULTS` so schema defaults, reset behavior, settings fallback, model fallback, and tests all read one canonical source.
- Alternatives rejected: Editing schema literals separately because duplicated defaults drift. Changing band positions or renderer math because the request only changes distance and width defaults.
- State/output mapping: `GLOBE_DEFAULTS.bandDistance` maps to `bands.distance`; all four `GLOBE_DEFAULTS.band*Width` values map to their width targets and are consumed by the Canvas 2D preview/export renderer.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Existing persisted local values can override new defaults until the user resets/imports a clean workspace; new workspaces and reset use the updated defaults.

### Iteration 6 — Dot-matrix band material

- Request: "давай теперь сделай чтобы эти ленты были образованы вот такими точками, после этого я закину тебе логотипы, чтобы они располагались на бегущих строках"
- Task type: Later ordinary renderer/canvas visual feature edit; focused checks for dotted band raster output, export, and render scale.
- User-visible result: The four globe bands now render as dense white dot-matrix ribbons instead of solid white fills. The dots stay bound to each band's flat ring geometry, so position, width, distance, and globe tilt preserve spherical perspective.
- Source/reference checked: One static CleanShot reference screenshot showing dense dot-matrix ticker rows was inspected. It is not a motion reference or clone source.
- Reference inputs: None. `appTransferMode.referenceInputs` remains `[]`; `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming` and `writing-plans`; the Toolcraft app contract supplied implementation authority for the requested app change.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Dot-matrix material does not add another canvas interaction.
- Interaction ownership: Unchanged. Panel owns all band numeric property edits; canvas owns globe orientation.
- Decision: Replace the solid white band fill with a geometry-bound dot grid. Each band still draws a hidden sphere-colored underlay to keep the latitude/meridian grid from showing through the black gaps, then draws white circular dots sampled by band-local row and theta coordinates.
- Alternatives rejected: Screen-space dot masks because they would not bend with the ring radius or globe tilt. Transparent dot-only rendering because white grid lines would show through the gaps and break the clean ticker look. Adding dot controls because the user asked for the material change first, with logo placement planned as a later feature.
- State/output mapping: Existing `bands.distance`, all band position targets, all band width targets, `globe.orientation`, and `globe.sphereColor` feed the dotted band preview and image export renderer.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The dot grid is fixed-density product output for now; future logo/ticker work should add source/logo controls and motion/timeline intent rather than hiding data in renderer constants.

### Iteration 7 — Column-aligned band dots

- Request: "сделай так чтобы точки на лентах стояли не в шахматном порядке, а столбиками друг под другом"
- Task type: Later ordinary renderer/canvas visual feature edit; focused checks for dotted band raster output and export.
- User-visible result: The band dots now align into vertical columns across each ribbon instead of alternating by row.
- Source/reference checked: Existing dot-matrix band implementation in `src/app/globe-renderer.tsx`; no new media reference was supplied.
- Reference inputs: None. `appTransferMode.referenceInputs` remains `[]`; `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/runtime-boundary.md`, `core/performance.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming` and `writing-plans`; the Toolcraft app contract supplied implementation authority for the requested app change.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Dot alignment does not add another canvas interaction.
- Interaction ownership: Unchanged. Panel owns all band numeric property edits; canvas owns globe orientation.
- Decision: Remove the per-row half-column angular offset from the band dot sampler so every dot row uses the same theta sequence for its columns.
- Alternatives rejected: Adding a control for staggered versus aligned dots because the request specified the desired arrangement directly. Reworking dot density because spacing and workload cardinality are not part of this change.
- State/output mapping: Existing band and orientation state still feeds the same dotted band renderer; only the row-to-column sampling pattern changes.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Future logo/ticker rows may need a separate layout grid so logos snap to columns without depending on the current dot constants.

### Iteration 8 — Adjustable dot size and width-fitted rows

- Request: "давай сделаем точки меньше по размеру, и если я увеличиваю ширину ленты, то количество строк с точками должно увеличиваться, и наоборот, если уменьшаю ширину ленты, то количество строк уменьшается. Хочу задавать в настройках размер точек, он будет универсальный для всех лент"
- Task type: Later ordinary schema and renderer feature edit; focused checks for Bands controls, Canvas 2D dot-grid raster output, export, and performance metadata.
- User-visible result: The Bands section now includes one universal `Dot size` slider. Band dots default smaller, and each ribbon derives its row count from the current band width and dot diameter, so wider bands contain more rows and narrower bands contain fewer rows.
- Source/reference checked: Existing column-aligned dot renderer, Bands schema section, app performance pipeline, and app acceptance catalog. No new media reference was supplied.
- Reference inputs: None. `appTransferMode.referenceInputs` remains `[]`; `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming` and `writing-plans`; the Toolcraft app contract supplied implementation authority for the requested app change.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Dot size and row count do not add another canvas interaction.
- Interaction ownership: The panel owns `bands.dotSize` as a precise global property edit; canvas remains reserved for globe orientation.
- Decision: Add `bands.dotSize` as a built-in slider with a 3px default, compute dot radius from that design-pixel diameter, and compute each band's row count from its projected band height divided by a dot-size-derived row pitch.
- Alternatives rejected: Keeping fixed eight rows because width changes would not visibly add/remove rows. Adding per-band dot-size sliders because the user requested one universal size. Adding a custom dot editor because a built-in slider exactly fits the numeric value model.
- State/output mapping: `bands.dotSize` feeds preview and image export through `readGlobeSettings`, while each `bands.bandN.width` now affects both band thickness and derived dot-row count.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Smaller dot sizes increase the number of row samples across all four bands; workload is bounded by schema min/max and modeled in `appPerformance`.

### Iteration 9 — Adjustable dot column spacing

- Request: "добавь параметр, управляющий расстоянием между колонками с точками"
- Task type: Later ordinary schema and renderer feature edit; focused checks for Bands controls, Canvas 2D dot-column raster output, persistence, and performance metadata.
- User-visible result: The Bands controls now include one `Column spacing` slider. Smaller spacing increases the number of vertical dot columns in all four ribbons, larger spacing reduces them, and dots remain aligned in straight columns within each band.
- Source/reference checked: Existing dotted band renderer, Bands schema section, app performance pipeline, persistence browser coverage, and app acceptance catalog. No new media reference was supplied.
- Reference inputs: None. `appTransferMode.referenceInputs` remains `[]`; `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming` and `writing-plans`; the Toolcraft app contract supplied implementation authority for the requested app change.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Dot-column spacing does not add another canvas interaction.
- Interaction ownership: The panel owns `bands.columnSpacing` as a precise global property edit; canvas remains reserved for globe orientation.
- Decision: Add `bands.columnSpacing` as a built-in slider with a 6.5px default, derive per-band column count from the offset ring circumference divided by this design-pixel spacing, and keep every row on the same theta sequence so columns stay vertically aligned.
- Alternatives rejected: Keeping fixed 384 columns because the user needs direct spacing control. Adding per-band spacing controls because the request names one spacing parameter for the dot columns. Using a screen-space grid because it would drift from the ring radius and globe tilt.
- State/output mapping: `bands.columnSpacing` feeds preview and image export through `readGlobeSettings`; `getBandDotMetrics` derives `columnCount` alongside row count; the renderer uses that count for all rows in the band.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Smaller column spacing increases the number of dot samples across all four bands; workload is bounded by schema min/max and modeled in `appPerformance`.

### Iteration 10 — Supplied logo dot masks

- Request: "теперь давай в каждую строку поставим по одному логотипу. Снова приложила референс, чтобы показать, что точки, которые относятся к лого становятся черными. Прозрачными мы их не будем делать, чтобы не просвечивали линии глобуса. Я хочу иметь возможность установить позицию каждого логотипа на своей линии. Эта позиция будет являться финальным стейтом анимации."
- Task type: Later ordinary schema and renderer feature edit; focused checks for logo controls, Canvas 2D black dot-mask output, image export, persistence, and performance metadata.
- User-visible result: Each of the four dotted bands now contains one supplied logo: DXC, Meta, Prada, and Zillow. Dots inside the logo shape render as opaque black dots, not transparency, and the Logos section exposes one final-position slider per logo line.
- Source/reference checked: Static CleanShot reference showing black dot-matrix logo/text masks; supplied SVG source files `/Users/elenamorozova/Desktop/neon-logo/dxc.svg`, `meta.svg`, `prada.svg`, and `zillow.svg`; existing dotted band renderer, schema, acceptance, and performance pipeline.
- Reference inputs: None. The static screenshot and SVG files are source/design assets, not video or motion reference inputs; `appTransferMode.referenceInputs` remains `[]` and `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming` and `writing-plans`; the Toolcraft app contract supplied implementation authority for the requested app change.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `interaction-surface-ownership`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Logo final positions are precise panel properties and do not add canvas drag handles.
- Interaction ownership: The panel owns all four `logos.*.finalPosition` properties as final animation-state values; canvas remains reserved for globe orientation.
- Decision: Embed the supplied SVG path data as product-owned logo mask assets, sample each mask against the current dot grid, render matching dots with opaque black fill, and add one built-in final-position slider for each logo.
- Alternatives rejected: Transparent holes because the user explicitly said globe lines must not show through. File upload controls because this iteration uses four supplied fixed logos rather than a user-editable logo source workflow. Timeline/keyframes because the user only requested the final state positions, not playback or video export yet.
- State/output mapping: `logos.dxc.finalPosition`, `logos.meta.finalPosition`, `logos.prada.finalPosition`, and `logos.zillow.finalPosition` feed `readGlobeSettings`; the Canvas 2D preview/export renderer maps each value to a logo center on its band and draws black dot-mask samples over the band underlay.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The SVG logos are fixed product assets in this pass; future user-replaceable logo workflows should add `fileDrop` media ownership. Risk: The final-position controls are ready to feed a later animation, but timeline/playback remains intentionally disabled until requested.

### Iteration 11 — Screenshot default preset

- Request: "установи вот такие дефолтные параметры"
- Task type: Later ordinary schema/defaults edit; focused checks for schema defaults, reset behavior, and fresh visual output.
- User-visible result: The globe now starts and resets to the screenshot preset: outline on; band distance 3%, dot size 2px, column spacing 4.5px; band positions/widths 56/18, 34/22, 13/15, and -8/22; logo final positions 60, 66, 57, and 65.
- Source/reference checked: Static CleanShot screenshot `/Users/elenamorozova/Library/Application Support/CleanShot/media/media_ak9lA0Q1Jq/CleanShot 2026-08-19 at 11.12.13@2x.png`; existing schema defaults, product behavior tests, and persistence contract.
- Reference inputs: None. The supplied screenshot is a static settings reference, not a video or motion reference input; `appTransferMode.referenceInputs` remains `[]`.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `schema-reference.md`, `component-rules.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming` and `writing-plans`; the Toolcraft app contract supplied implementation authority for this focused defaults change.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Default values do not add canvas interactions.
- Interaction ownership: Unchanged. Panel owns exact property edits and reset defaults; canvas owns spatial orientation.
- Decision: Update `GLOBE_DEFAULTS` to the screenshot preset and keep export defaults at PNG/4K because the screenshot already matches the existing export settings.
- Alternatives rejected: Adding a separate preset selector because the user asked for defaults, not multiple presets. Bumping persistence version because it would force-clear the user's saved workspace rather than only changing the schema default/reset state.
- State/output mapping: Schema `defaultValue` fields feed first load, section/global reset, settings transfer defaults, `readGlobeSettings`, Canvas 2D preview, and image export. Existing persisted user-edited values may continue to load until reset, matching Toolcraft persistence semantics.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Because local persistence intentionally preserves the user's edited workspace, a browser with already-saved older values can keep showing them until Reset restores these new schema defaults.

### Iteration 12 — Updated logo default positions

- Request: "чуть обнови расположение лого по умолчанию"
- Task type: Later ordinary schema/defaults edit; focused checks for logo default state and reset behavior.
- User-visible result: The Logos defaults now match the supplied screenshot: DXC 60%, Meta 66%, Prada 72%, and Zillow 72%.
- Source/reference checked: Static CleanShot screenshot `/Users/elenamorozova/Library/Application Support/CleanShot/media/media_bxOMqHnBiP/CleanShot 2026-08-19 at 11.39.17@2x.png`; existing `GLOBE_DEFAULTS`, product behavior preset test, and logo browser acceptance rows.
- Reference inputs: None. The supplied screenshot is a static settings reference, not a video or motion reference input; `appTransferMode.referenceInputs` remains `[]`.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `schema-reference.md`, `component-rules.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming` and `writing-plans`; the Toolcraft app contract supplied implementation authority for this focused defaults change.
- Contract rules applied: `controls-product-coverage`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Default logo positions do not add canvas interactions.
- Interaction ownership: Unchanged. The panel owns exact logo final-position property edits and reset defaults; canvas owns spatial orientation.
- Decision: Keep DXC and Meta defaults at 60% and 66%, and update Prada and Zillow defaults to 72%.
- Alternatives rejected: Adding a preset picker or new logo layout logic because the request only updates default values. Bumping persistence version because that would erase the user's saved workspace instead of preserving Toolcraft persistence semantics.
- State/output mapping: `GLOBE_DEFAULTS.logoPradaFinalPosition` and `GLOBE_DEFAULTS.logoZillowFinalPosition` feed schema `defaultValue`, reset state, `readGlobeSettings`, Canvas 2D preview, and image export.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Existing locally persisted workspaces can preserve older logo positions until the user resets controls, because schema defaults should not silently erase saved state.

### Iteration 13 — Staggered logo intro

- Request: "теперь давай добавлять анимацию, сначала без лупа (но сделай кнопку чтобы воспроизвести анимацию заново). Я хочу чтобы логотипы двигались слева направо по строкам до своего финального стейта - то как они сейчас установлены по дефолту. Это должно быть довольно быстрое поочередное перемещение. Первой начинает двигаться верхняя строка, потом та что под ней, и так далее. Однако, не стоит дожидаться когда первый лого займет свое финальное положение, чтобы начать двигать следующий. Задержка между ними должна быть небольшой."
- Task type: Later ordinary schema/renderer animation edit; focused checks for a local panel action, autonomous preview animation frames, logo acceptance, and browser output.
- User-visible result: The preview now runs a fast one-shot intro where logo masks enter from the left and settle into the current default/final slider positions. Rows start top to bottom with a small overlap delay. The Logos section includes a `Run logos` action to run the reveal again; no loop is enabled.
- Source/reference checked: No new visual or motion reference was supplied. Existing logo defaults, logo mask renderer, Toolcraft action rules, animation intent rules, acceptance rules, and renderer pipeline metadata were checked.
- Reference inputs: None. The request describes motion behavior in text and provides no video/GIF/screen recording; `appTransferMode.referenceInputs` remains `[]` and `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/timeline-animation.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. The animation changes logo mask positions over time and does not add another canvas spatial interaction.
- Interaction ownership: Panel owns `logos.intro.run` as a local command to rerun the logo reveal. Panel still owns the four logo final-position properties, and canvas still owns globe orientation.
- Decision: Implement an autonomous, non-looping, preview-only logo intro with a 620ms row movement, 105ms top-to-bottom stagger, and left-side start offset derived from each final position. The renderer derives transient preview logo positions from elapsed time, while stored slider values remain the final state.
- Alternatives rejected: Enabling Toolcraft top timeline because the user asked for a simple no-loop intro and replay button, not scrub, duration, keyframes, video export, or export-at-time behavior. A right-panel `Play`, `Restart`, or `Animate` transport label was rejected because app-wide transport belongs to the top timeline; `Run logos` is scoped to the Logos entity as a local command. Exporting in-flight animation frames was rejected because image export should preserve the final landing-state globe unless video/timeline export is requested later.
- State/output mapping: `logos.*.finalPosition` remains the canonical final state for schema defaults, resets, persistence, preview finish state, and image export. `logos.intro.run` triggers a transient preview timer through `onPanelAction`; `getAnimatedLogos` maps elapsed milliseconds to temporary logo positions, while the renderer pipeline records `animation-frame` invalidation through a cheap logo-intro state pass.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The preview is now briefly autonomous after load and after `Run logos`, so unrelated browser checks should wait for the one-shot reveal to settle before sampling stable final pixels. Risk: If video export, timeline scrub, or loop controls are requested later, this autonomous intro should move to explicit Toolcraft timeline coverage.

### Iteration 14 — Autonomous logo orbit loop

- Request: "хорошо, тайминги хорошие
давай теперь сделаем луп
Сначала объясню общий сценарий: Логотипы должны совершать движение по всему кругу вокруг глобуса, они делают эти круги, но делают остановку в нашей дефолтной точке на 4 секунды (сделай мне контроллер этой паузы). Они приходят как сейчас, чуть в разное время, на дефолтную точку, и также в разное время стартуют, чтобы совершить новый круг."
- Task type: Later ordinary schema/renderer animation edit; focused checks for a new Hold timing slider, autonomous looping canvas output, local loop reset action, persistence, and performance metadata.
- User-visible result: Logo masks now loop around the globe continuously. Each row arrives at its final/default position with the existing quick top-to-bottom stagger, stays there for the Hold time, then starts the next full-circle orbit in the same staggered order. The Logos section includes `Hold` with a 4s default and keeps `Run logos` as a local command to reset the cycle to the arrival sequence.
- Source/reference checked: No new media reference was supplied. Existing logo animation timing, SVG logo masks, schema/action rules, autonomous animation intent rules, renderer pipeline metadata, and persistence acceptance were checked.
- Reference inputs: None. The request is a text motion description, not a video/GIF/screen recording; `appTransferMode.referenceInputs` remains `[]` and `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/timeline-animation.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `decision-contract.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `renderer-view-interaction`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, `timeline-mode-choice`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Logo orbit is procedural output on the bands and does not add another canvas spatial interaction owner.
- Interaction ownership: Panel owns `logos.holdSeconds` as a global timing property and `logos.intro.run` as a local Logos command. Panel still owns logo final positions; canvas still owns globe orientation.
- Decision: Keep the animation autonomous because it is a self-running landing background loop with no video export, scrub, keyframes, play/pause, global duration editor, or loop toggle. The loop moves each logo through a 200-unit circular position cycle; the last 42 units reuse the existing arrival timing so the visible approach into the default point matches the previous behavior. Each logo holds at the final slider position for `logos.holdSeconds`, defaulting to 4s, before starting the next orbit with the same 105ms row stagger.
- Alternatives rejected: Enabling Toolcraft playback timeline because the user asked for a background loop with a hold parameter, not a time transport surface, scrubber, duration editor, keyframes, export-at-time, or video export. A right-panel Play/Pause/Restart transport was rejected by contract; `Run logos` remains a local command scoped to the Logos entity. A one-shot-only intro was rejected because the user now requested full looping orbits.
- State/output mapping: `logos.holdSeconds` feeds `readGlobeSettings`, schema defaults/reset, settings transfer, persistence, and the preview loop timing. `logos.*.finalPosition` remains the canonical stop point for each logo and the static image-export state. `logos.intro.run` resets the transient loop clock; Canvas 2D preview derives temporary logo positions from elapsed autonomous time while image export draws the final stop positions.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The canvas is now continuously animated, so browser acceptance must sample known arrival/hold windows or use the explicit `Run logos` reset before asserting stable output. Risk: Future video export, scrubbed playback, or user-facing loop transport should migrate this autonomous clock to the top Toolcraft timeline.

### Iteration 15 — Smooth whole-orbit logo inertia

- Request: "мне кажется что сейчас у нас в какой-то мере сохраняется точка у левого края глобуса, из которой стартовали логотипы. Давай ее совсем уберем, потому что как будто сейчас, после прохождения этой точки, появляется инерция движения, надо чтобы эта инерция была на всем пути вокруг глобуса"
- Task type: Later ordinary visual mismatch and renderer animation-timing correction; focused checks for logo loop behavior, Hold timing, stable logo-position controls, persistence, and render scale.
- User-visible result: The looping logo motion no longer has a distinct speed-change point at the old left-side start position. Each moving orbit now uses one smooth ease-in-out curve across the full circle, then pauses at the final/default logo position for the Hold time before the next staggered orbit.
- Source/reference checked: User visual complaint, existing autonomous logo loop code, logo acceptance rows, renderer pipeline metadata, and browser smoke captures. No new media reference was supplied.
- Reference inputs: None. The request is a text motion refinement, not a video/GIF/screen recording; `appTransferMode.referenceInputs` remains `[]` and `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `decision-contract.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/timeline-animation.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `systematic-debugging`, `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `renderer-technique-inventory`, `renderer-view-interaction`, `timeline-mode-choice`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. The logo timing correction changes procedural output only and does not add camera or canvas spatial controls.
- Interaction ownership: Unchanged. Panel owns logo final-position sliders, `Hold`, and the local `Run logos` command; canvas owns globe orientation only.
- Decision: Replace the old two-part `linear cruise` plus final `easeOut` loop phase with one `easeInOutSine` curve over the entire 200-unit orbit. Keep the 620ms visible approach timing, 105ms row stagger, Hold default, and static final-state image export.
- Alternatives rejected: Keeping the old final-only easing because it preserves a visible motion kink at the old start coordinate. Adding a new easing controller because the request asks to remove the artifact, not to expand the panel. Enabling Toolcraft timeline because there is still no app-wide transport, scrub, keyframes, video export, or export-at-time behavior.
- State/output mapping: `logos.holdSeconds` still controls dwell time; `logos.*.finalPosition` still defines the stop point; `logos.intro.run` resets the autonomous loop clock; preview frames now map elapsed time through the whole-orbit easing function before drawing black logo dot masks on the bands. Image export remains the final stop state.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The autonomous loop still has an intentional stop at the final logo position during Hold; that is the only speed discontinuity retained by request. Risk: Future user-facing animation transport should still move this timing into Toolcraft timeline coverage.

### Iteration 16 — Wider logo phase desync

- Request: "хорошо, давай сделаем чуть больший рассинхрон у логотипов, я хочу чтобы не было такого стейта, когда ни один из логотипов еще не пришел на финальную точку"
- Task type: Later ordinary renderer animation-timing correction; focused checks for logo loop, Hold timing, stable logo-position controls, persistence, and render scale.
- User-visible result: The four logo rows now have a wider 720ms phase offset. On reset and during the default loop, at least one logo row is already holding at its final position while other rows continue approaching or orbiting, so the composition no longer enters an empty state with no logo at a final point.
- Source/reference checked: User motion-quality request, existing smooth whole-orbit timing code, logo acceptance rows, performance metadata, and browser smoke captures. No new media reference was supplied.
- Reference inputs: None. The request is a text timing refinement, not a video/GIF/screen recording; `appTransferMode.referenceInputs` remains `[]` and `npm run reference:study` is intentionally not run.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `decision-contract.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/timeline-animation.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `systematic-debugging`, `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `renderer-technique-inventory`, `renderer-view-interaction`, `timeline-mode-choice`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. The desync changes logo phase timing only and does not add canvas controls.
- Interaction ownership: Unchanged. Panel owns logo final-position sliders, `Hold`, and the local `Run logos` command; canvas owns globe orientation only.
- Decision: Increase row phase offset from the compact intro-style stagger to 720ms and let negative delayed rows wrap through the cycle instead of parking at the same reset-start phase. This keeps the top-to-bottom arrival order while allowing lower rows to occupy prior-cycle hold windows at reset.
- Alternatives rejected: Keeping the compact 105ms stagger because all logos still arrive and depart as one group, leaving a visible empty interval. Adding another desync control because the request asks for a timing refinement, not more panel surface. Forcing all rows to start from the same left-side point because it recreates the empty initial state.
- State/output mapping: `logos.intro.run` resets the loop clock; each logo applies `bandIndex * 720ms` phase offset through the same smooth whole-orbit easing and shared `logos.holdSeconds` dwell. Stored final-position sliders remain the exact hold targets, and image export remains the final static state.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The no-empty-final-state guarantee is tuned to the default four-logo, 4s Hold loop; very short user-edited Hold values can intentionally reduce or remove dwell overlap. Risk: Future user-facing animation transport should still move this timing into Toolcraft timeline coverage.

### Iteration 17 — Reference-paced logo orbit rhythm

- Request: "я загрузила тебе референс с подобной анимацией, я хочу чтобы ты оттуда взял тайминги и ритм движения строк. Основное замедление должно быть там, где у нас сейчас дефолтное расположение"
- Task type: Later ordinary video-reference and renderer animation-timing correction; focused checks for motion reference mapping, logo loop behavior, Hold timing, browser reference parity, persistence, and render scale.
- User-visible result: The logo rows now use a reference-paced 2520ms orbit with a 760ms decelerating approach into the current final/default logo positions. The four rows keep a wider 840ms phase offset so at least one row remains settled while others move, and the user-controlled Hold pause still happens at the final logo positions.
- Source/reference checked: Supplied CleanShot screen recording `/Users/elenamorozova/Desktop/CleanShot 2026-08-18 at 11.06.49.mp4` was reviewed as the motion reference. The original file SHA-256 is `64f20d423933fe236337eb8bd63ec312ed811f02884dddff09f0dabdcfd066e7`; the protected study needed a CFR25 normalized source because direct source scan hit a sub-microsecond timestamp precision mismatch (`1.01667` vs `1.016667`) while decoding all frames. The normalized source preserved the 9.48s visual duration and produced seconds-timed evidence from `npm run reference:study`.
- Reference inputs: `appTransferMode.referenceInputs` registers one motion reference input for the logo orbit rhythm.
- Motion reference study: referenceId=motion-reference-v1-fe5ed9ab7cbbdac9ae605c1af0abdda9049c49cd68c635e130c64b0af4ead634; studyId=motion-v1-ecb194a2782a036d02cd9ede38d995f96f2034831316c1e51ba49224fdef3b21; sourceSha256=eae935181631e616df3a5a874ac01cd04e5cc8aa96c6ef95b26f3787ed35497f; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-ecb194a2782a036d02cd9ede38d995f96f2034831316c1e51ba49224fdef3b21/contact-sheet.png; review=real-time,slowed.
- Motion reference study: referenceId=motion-reference-v1-fe5ed9ab7cbbdac9ae605c1af0abdda9049c49cd68c635e130c64b0af4ead634; studyId=motion-v1-3621cea9e4e665ee899f7239f9b26c2fb941e8253ea51f61e1814a1581839467; sourceSha256=eae935181631e616df3a5a874ac01cd04e5cc8aa96c6ef95b26f3787ed35497f; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-3621cea9e4e665ee899f7239f9b26c2fb941e8253ea51f61e1814a1581839467/contact-sheet.png; review=real-time,slowed.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/reference-study.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `core/timeline-animation.md`, `core/performance.md`, `schema-reference.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `renderer-technique-inventory`, `renderer-view-interaction`, `timeline-mode-choice`, `video-reference-analysis`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. The motion reference changes ticker/logo timing only and does not add a fixed or timeline-owned camera.
- Interaction ownership: Unchanged. Panel owns logo final-position sliders, `Hold`, and the local `Run logos` command; canvas owns globe orientation only.
- Decision: Keep the animation autonomous and map the supplied video to one `logo-loop-reference-rhythm` behavior on acceptance `logos.intro.run`. Use the reference's repeated high-change cadence around 1.56s, 4.08s, 6.56s, and 9.08s to set the moving orbit to 2520ms. Use a smootherstep curve so velocity is high through the middle of the orbit and the pronounced slowdown happens only as the logo returns to its final/default position; keep the existing Hold slider as the explicit stop duration at that point.
- Alternatives rejected: Enabling Toolcraft timeline because there is still no app-wide transport, scrub, duration editor, keyframes, video export, or export-at-time behavior. Keeping symmetric `easeInOutSine` because it creates equal inertia away from the default position instead of concentrating the slowdown at the default point. Reusing the direct CleanShot file in the protected study was rejected after the scan failed due timestamp precision, so the source was normalized to seconds-timed CFR25 evidence before implementation.
- State/output mapping: `logos.intro.run` resets the autonomous loop clock; each preview frame maps elapsed time through the reference-paced smootherstep orbit and 840ms row offset. `logos.*.finalPosition` remains the default/front slowdown and Hold anchor for each logo. `logos.holdSeconds` controls dwell at that anchor; image export remains the final static state.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The reference evidence comes from a CFR25 normalized derivative because direct CleanShot timestamp comparison was stricter than FFmpeg's printed scan precision; the worklog records both the original and normalized hashes. Risk: The default Hold pause remains user-controlled and can intentionally overpower the reference-like moving cadence at high values.

### Iteration 18 — Adjustable logo animation speed

- Request: "сделай мне настройку скорость этой анимации, я бы хотела сделать ее чуть быстрее"
- Task type: Later ordinary schema/control and renderer animation-timing edit; focused checks for the new Speed slider, logo loop behavior, persistence, render scale, and browser output.
- User-visible result: The Logos section now includes a `Speed` slider. New workspaces default to a slightly faster 1.25x logo orbit while the original motion-reference cadence remains the 1x baseline and `Hold` continues to control only the stop duration at the final logo positions.
- Source/reference checked: Existing reference-paced logo timing implementation, Logos schema section, acceptance catalog, renderer pipeline, persistence browser scenario, and performance metadata. No new media source was supplied.
- Reference inputs: Existing `appTransferMode.referenceInputs` remains registered from Iteration 17; no new `npm run reference:study` run is required because this is a user-controlled timing scale, not a new video/GIF/screen-recording source.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/timeline-animation.md`, `schema-reference.md`, `component-rules.md`, `decision-contract.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `timeline-mode-choice`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Speed changes ticker timing only and does not affect camera or globe axis interaction.
- Interaction ownership: Panel owns `logos.speed` as a global numeric property edit. Canvas remains reserved for direct spatial globe orientation and does not duplicate timing controls.
- Decision: Add built-in slider target `logos.speed` with default 1.25, range 0.5 to 2.5, and 0.05 step. Scale orbit, approach, and row stagger durations by `duration / speed`, while keeping `logos.holdSeconds` as a separate pause in seconds.
- Alternatives rejected: Changing the baked reference constants directly because that would erase the 1x timing evidence from the supplied video. Scaling the Hold pause with Speed because the user already has an explicit pause controller. Adding timeline transport because the request is a preview tempo property, not scrub/play/video behavior.
- State/output mapping: `logos.speed` is read through `readGlobeSettings`, drives `getLoopingLogos` in the Canvas 2D preview, invalidates the cheap `globe-logo-loop-state` pass, persists with runtime values, and is intentionally excluded from static image export timing because PNG export remains the final held composition.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Existing persisted workspaces can keep an older effective speed until the user changes the slider or resets controls. Risk: Very high speed values intentionally compress row staggering and may feel more kinetic than the video reference while preserving its easing shape.

### Iteration 19 — More inertia before final logo stop

- Request: "давай перед финальной остановкой чуть больше инерции добавим"
- Task type: Later ordinary renderer animation-curve refinement; focused checks for logo loop easing, Speed timing scale, browser output, and worklog coverage.
- User-visible result: Logo rows now carry a little more motion into the final approach before settling at their default/final positions. The stop still happens at the same point, the Hold pause is unchanged, and the loop remains forward-only.
- Source/reference checked: Existing reference-paced logo timing implementation, `logos.intro.run` acceptance, Speed control behavior, renderer pipeline metadata, and the registered motion reference from Iteration 17. No new media source was supplied.
- Reference inputs: Existing `appTransferMode.referenceInputs` remains registered from Iteration 17; no new `npm run reference:study` run is required because this is a user-directed easing refinement, not a new video/GIF/screen-recording source.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/timeline-animation.md`, `core/performance.md`, `core/runtime-boundary.md`, `decision-contract.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `renderer-technique-inventory`, `timeline-mode-choice`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. The inertia tweak changes ticker timing only and does not affect camera or globe axis interaction.
- Interaction ownership: Unchanged. Panel owns logo timing/final-position controls and the local `Run logos` command; canvas owns globe orientation only.
- Decision: Blend the final 22% of the logo orbit toward a quadratic late-inertia curve with 0.35 strength. This keeps the early and mid-orbit reference rhythm stable, preserves a zero-velocity final stop, and adds visible carry into the final approach.
- Alternatives rejected: Extending `Hold` because the request is about motion before the stop, not pause duration. Adding a new Inertia control because the user asked for a tuning change, not another persistent sidebar parameter. Overshooting past the final point because the current product promise is a clean stop at the default logo position.
- State/output mapping: `logos.intro.run`, `logos.speed`, and `logos.holdSeconds` keep the same runtime state flow; preview frames now use a late-inertia easing blend inside `getLogoLoopPositionOffset`, while image export remains the final static held composition.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The added inertia is intentionally subtle so very high Speed settings can make the final carry feel sharper; the Speed slider remains available for user tuning.

### Iteration 20 — Updated Zillow logo mask asset

- Request: "обнови логотип zillow"
- Task type: Later ordinary renderer source-asset update; focused checks for the fixed Zillow dot-mask asset, browser logo output, and worklog coverage.
- User-visible result: The Zillow row now uses the newly supplied Zillow SVG geometry while keeping the same final-position slider, opaque black dot-mask rendering, band placement, loop timing, and export semantics.
- Source/reference checked: Supplied SVG source `/Users/elenamorozova/Desktop/neon-logo/zillow.svg`; existing fixed logo asset registry, logo mask sampler, logo acceptance rows, renderer pipeline metadata, and performance notes.
- Reference inputs: Existing `appTransferMode.referenceInputs` remains registered from Iteration 17; the supplied Zillow SVG is a fixed product source asset, not a video/GIF/screen-recording motion reference, so `npm run reference:study` is not required.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/runtime-boundary.md`, `core/performance.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming` and `writing-plans`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. Updating a fixed logo mask asset does not affect camera or globe axis interaction.
- Interaction ownership: Unchanged. Panel owns the Zillow final-position slider; canvas owns globe orientation only.
- Decision: Replace only the embedded Zillow `GlobeLogoAsset` dimensions and path data with the new `322x70` SVG viewBox geometry, preserving the existing mask sampling and all runtime state targets.
- Alternatives rejected: Adding a logo upload flow because the user asked to update the current fixed Zillow logo, not create user-managed logo assets. Changing Zillow default position because the request concerns the logo artwork only. Reworking the dot-mask sampler because the supplied SVG already matches the existing path-based asset pipeline.
- State/output mapping: `logos.zillow.finalPosition` still controls the Zillow logo center on band 4; `globe-logo-assets.ts` now supplies the new Zillow mask paths consumed by `isDotInsideLogoMask` for preview and image export.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The new Zillow aspect ratio is slightly different from the prior embedded asset, so the logo can occupy a subtly different horizontal dot width while still using the same slider value and band grid.

### Iteration 21 — Subtle foreground CRT treatment

- Request: "давай в качестве эксперимента попробуем добавить crt эффект поверх всего, кроме черного бекграунда, может быть небольшой фликеринг, еле заметный"
- Task type: Later ordinary renderer/canvas visual edit; focused checks for CRT helper bounds, preview/export raster output, background exclusion semantics, render scale, performance metadata, and worklog coverage.
- User-visible result: The globe output now has a very subtle CRT treatment: fine horizontal scanline dimming plus a barely visible flicker/rolling dim pass affects the drawn globe, grid, dotted bands, and logo-mask area while keeping the black background visually clean.
- Source/reference checked: Existing Canvas 2D renderer, image export renderer, background include semantics, render-scale browser row, app performance metadata, and current user request. No new source media was supplied.
- Reference inputs: Existing `appTransferMode.referenceInputs` remains registered from Iteration 17; this is a renderer styling experiment, not a new video/GIF/screen-recording source, so no new `npm run reference:study` run is required.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `renderer-technique-inventory`, `renderer-view-interaction`, `output-export-required`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. CRT styling does not affect camera, direct globe drag, or the orientation gizmo.
- Interaction ownership: Unchanged. No new controller is added for this experiment; panel controls keep owning exact globe, band, logo, timing, background, and export values, while canvas owns spatial orientation.
- Decision: Add a product-owned CRT helper and apply it inside the shared Canvas 2D `drawGlobeFrame` after the globe, lines, bands, and logo masks are drawn. Use `source-atop` darkening so transparent exports stay transparent and black background pixels remain visually black; preview receives the live animation phase for soft flicker, while image export uses a fixed phase for deterministic artifacts.
- Alternatives rejected: Adding a sidebar controller because the request frames this as a visual experiment rather than a committed adjustable effect. CSS overlay was rejected because it would not participate in PNG export. Random per-frame noise was rejected because it would shimmer too strongly and make export nondeterministic.
- State/output mapping: Existing runtime values and commands are unchanged. Preview maps `requestAnimationFrame` time to a subtle CRT profile in `globe-crt-effect.ts`; PNG export calls the same renderer with `GLOBE_CRT_EXPORT_PHASE_MS`; no schema state, persistence slice, layers panel, timeline, or export controls change.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: The effect is deliberately subtle and always-on during this experiment; if the visual direction works, a later control can expose intensity/on-off state with schema, persistence, acceptance, and performance updates. Risk: The current pass darkens foreground pixels rather than adding colored phosphor glow, so the CRT read is restrained.

### Iteration 22 — Adjustable stronger CRT flicker

- Request: "надо усилить эффект, чуть больше мягкого фликеринга, добавь настройку в сайдбар"
- Task type: Later ordinary schema/renderer visual edit; focused checks for one new CRT slider, constant-cost Canvas 2D post-processing, export/background semantics, persistence, acceptance, and performance metadata.
- User-visible result: The sidebar now has a `CRT` section with an `Intensity` slider. The default is 60%, making the scanline/flicker treatment a little stronger and softer than the prior experimental pass; dragging to 0 removes it, while higher values increase the foreground CRT dimming.
- Source/reference checked: Existing Canvas 2D renderer, CRT helper, schema controls, acceptance rows, persistence browser coverage, image export browser coverage, render-scale coverage, and current user request. No new source media was supplied.
- Reference inputs: Existing `appTransferMode.referenceInputs` remains registered from Iteration 17; this is a user-directed styling/controller change, not a new video/GIF/screen-recording source, so no new `npm run reference:study` run is required.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming` and `writing-plans`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `renderer-view-interaction`, `output-export-required`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. CRT intensity changes only foreground raster styling and does not affect camera, direct globe drag, or the orientation gizmo.
- Interaction ownership: Panel owns `effects.crtIntensity` as a global visual property edit. Canvas remains reserved for direct spatial globe orientation and does not duplicate the post-effect control.
- Decision: Add built-in slider target `effects.crtIntensity` with default 60, range 0 to 100, and percentage labels. Scale the CRT scanline, flicker, and rolling dim alphas from that value while keeping the `source-atop` foreground-only composition and deterministic fixed export phase.
- Alternatives rejected: A separate on/off switch because 0% already disables the effect in the same control. Random noise was rejected because the request asks for soft flicker and the export must stay deterministic. CSS-only overlay was rejected because it would not participate in PNG export.
- State/output mapping: `effects.crtIntensity` feeds schema defaults, reset, persistence, settings transfer, `readGlobeSettings`, live Canvas 2D preview, and image export. The renderer pipeline records it as a raster/export input and a responsiveness invalidator, not a workload dimension.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Stronger values intentionally darken foreground lines and dots more visibly; the black background remains clean because the pass uses `source-atop`. Risk: Existing locally persisted workspaces can keep the prior effective CRT value until reset or manual edit.

### Iteration 23 — Stronger CRT default and pass

- Request: "давай еще усилим"
- Task type: Later ordinary schema/default and renderer visual refinement; focused checks for the CRT helper, default slider value, export/background semantics, render scale, and worklog coverage.
- User-visible result: The CRT treatment is stronger by default: `Intensity` now starts at 75%, while scanline dimming, soft flicker, and the rolling dim pass have higher foreground-only alpha ranges. The same 0 to 100 slider still controls the effect and 0 still disables it.
- Source/reference checked: Existing Canvas 2D renderer, CRT helper, CRT schema control, image export browser coverage, background exclusion semantics, render-scale coverage, and current user request. No new source media was supplied.
- Reference inputs: Existing `appTransferMode.referenceInputs` remains registered from Iteration 17; this is a visual strength tuning request, not a new video/GIF/screen-recording source, so no new `npm run reference:study` run is required.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local workflow skills used: `brainstorming`, `writing-plans`, and `browser`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `renderer-view-interaction`, `output-export-required`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `orbit`; unchanged. CRT strength changes only foreground raster styling and does not affect camera, direct globe drag, or the orientation gizmo.
- Interaction ownership: Unchanged. Panel owns `effects.crtIntensity` as a global visual property edit; canvas remains reserved for direct spatial globe orientation.
- Decision: Increase the canonical default `effects.crtIntensity` to 75 and strengthen the shared CRT helper constants for flicker, scanline, and rolling dim alphas while preserving source-atop composition and deterministic fixed-phase image export.
- Alternatives rejected: Raising the slider maximum above 100 because the current value model already has a clear percentage range. Adding noise/glitch pixels because the user previously rejected glitch treatment and this request continues the CRT direction. Applying the effect to the full canvas because the black background must stay clean.
- State/output mapping: `GLOBE_DEFAULTS.crtIntensity` feeds schema defaults, reset, persistence fallback, and `readGlobeSettings`; `globe-crt-effect.ts` maps that value into stronger foreground-only dimming for live preview and deterministic image export.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Risk: Existing locally persisted workspaces can keep the prior effective CRT value until reset or manual edit. Risk: The stronger foreground pass intentionally darkens white dots and lines more visibly, so export pixel expectations must track the deterministic fixed phase.

### Iteration 24 - Replace three ticker logos

- Request: Replace Meta with Novo Nordisk, DXC with easyJet, and Zillow with Ubisoft using the three supplied SVG files.
- Task type: Later focused fixed-asset and control-label edit.
- User-visible result: Bands 1, 2, and 4 show easyJet, Novo Nordisk, and Ubisoft as opaque black dot masks; Prada remains on band 3.
- Source/reference checked: `/Users/elenamorozova/Desktop/neon-logo/EasyJet.svg`, `/Users/elenamorozova/Desktop/neon-logo/Novo_Nordisk.svg`, and `/Users/elenamorozova/Desktop/neon-logo/Ubisoft.svg`; XML paths and original viewBox proportions were inspected.
- Reference inputs: Three static SVG assets listed above. No new motion reference; existing registered motion evidence is unchanged.
- Docs/contracts read: `workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/setup-export.md`, `core/media-upload.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, and `performance.md`. Local skills: brainstorming, writing-plans, and browser verification.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `acceptance-product-observable`, `persistence-policy-explicit`, `runtime-shell-required`, and `workflow-required`.
- View interaction intent: Existing `orbit` interaction through `globe.orientation`, unchanged.
- Interaction ownership: Existing panel final-position sliders remain global property edits; no new canvas controls or sections.
- Decision: Replace only fixed mask geometry, dimensions, and visible labels. Keep original slot IDs and schema targets so saved positions, settings transfer, resets, and animation mapping stay compatible. Preserve source aspect ratios, including the more compact Novo Nordisk mark.
- Alternatives rejected: Renaming persisted targets or changing animation timing; stretching Novo Nordisk to the previous Meta width; adding an upload workflow for this fixed-asset experiment.
- State/output mapping: `logos.dxc.finalPosition` still places band 1, now easyJet; `logos.meta.finalPosition` still places band 2, now Novo Nordisk; `logos.zillow.finalPosition` still places band 4, now Ubisoft. The existing shared mask renderer supplies preview and image export. Band geometry, dot settings, CRT, and final-position defaults are unchanged.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Implementation plan: Update `globe-logo-assets.ts`, the three labels in `app-schema.ts` and `app-logo-acceptance-data.ts`, matching product browser case names, and the existing `app-logo-assets.test.ts`; leave model, animation, mask sampling, runtime, export mechanics, and persistence code unchanged.
- Focused-check scope: Source-geometry replacement in existing raster output. Typecheck and code health passed; 37 focused Vitest tests and all three selected browser position scenarios passed. Desktop and narrow-viewport screenshots showed rendered logo bands; a real reload preserved the existing edited logo positions and restored the temporary Hold check to 4 seconds. No repeated delivery receipt or measured performance.
- Focused-check record: Typecheck; focused logo-asset and product-behavior Vitest tests; the three logo final-position feature scenarios; visual desktop/mobile browser checks and reload.
- Skip: Full delivery, performance, and export matrices because this changes only fixed mask data and labels, not the shared renderer or artifact workflow.
- Browser fixture correction: The first position-check run failed its stable pixel baseline because independent CRT flicker remained active. Following systematic-debugging, set CRT Intensity to zero through the real control only inside the existing logo-position browser scenarios; retain stable-baseline assertions and keep production CRT behavior unchanged. Also assert each renamed slider's accessible label. Additional contracts read: `decision-contract.md`, `core/runtime-boundary.md`, and `renderer-technique.md`.
- Risks: Novo Nordisk is narrower than Meta at the same logo height and its small lettering is sampled by the existing dot grid; preserve the authored proportions rather than silently widening it. At a narrow viewport the existing finite canvas and saved desktop panel placement remain clipped; responsive shell mechanics were not changed by this asset replacement.

### Iteration 25 - Wider dot-matrix bands

- Request: Allow the four ticker bands to be widened further.
- Task type: Later focused schema, model-boundary, and dot-grid edit.
- User-visible result: Each existing Band width slider supports 4% through 60%, with more dot rows at larger widths. Current values, logo replacements, animation, and default sizes stay unchanged.
- Source/reference checked: Existing band controls, model clamps, shared spherical band bounds, dot metrics, performance envelope, and product tests. No new reference asset was supplied.
- Reference inputs: None for this iteration; existing static logo assets and registered motion evidence are unchanged.
- Docs/contracts read: `workflow.md` and `core/performance.md`; reuse the previously read `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md` for the same schema/renderer/verification surfaces. Local brainstorming, writing-plans, and browser workflow apply.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `renderer-technique-inventory`, `performance-coverage-levels`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Existing `orbit` through `globe.orientation`, unchanged.
- Interaction ownership: Existing panel sliders own the four global band widths; section inventory and canvas interactions remain unchanged.
- Decision: Share a 60% maximum across schema, model clamps, and performance envelope. Derive the dot-row safety ceiling from the width limit and minimum effective dot pitch, preserving row density throughout the expanded range. Keep current spherical edge clipping near the poles.
- Alternatives rejected: Increasing only slider maxima, which would still clamp rendering at 22%; retaining the 72-row ceiling, which would stretch vertical spacing on wide bands; changing saved widths or animation settings.
- State/output mapping: `bands.band1.width` through `bands.band4.width` control the same shared preview/export spherical bounds and width-derived dot rows. Persistence and settings transfer keep the same target names and defaults.
- Workload plan: Four width dimensions retain their direct mapping and existing raster/export pass lifecycle, but interactive and batch boundaries both become 60%. Dot size, column bounds, quality, invalidation, and compiled pipeline registration remain unchanged. Run focused structural assessment before dot-grid implementation; no measured performance is authorized.
- Performance intent: ordinary-product-work
- Implementation plan: Update `globe-constants.ts`, `app-schema.ts`, `app-performance.ts`, `globe-model.ts`, and `globe-dot-grid.ts`; extend the existing width tests, add focused row-density coverage in `globe-dot-grid.test.ts`, and exercise all four width browser cases plus reload above the old limit.
- Focused-check scope: Workload-boundary and raster behavior edit. Typecheck, code health, and 53 focused unit tests passed. All five selected browser scenarios passed: each width at 60% plus workspace reload at 48%. A manual browser screenshot at 60% confirmed additional aligned rows and valid spherical ribbons; the value survived reload, browser errors were absent, and the user's previous width was restored. No new aggregate delivery receipt.
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Test setup: Disable independent CRT flicker through the real control in band browser scenarios before stable-pixel assertions; production CRT stays unchanged. The added row-density test pushed the existing product test file over its line budget, so it lives in a focused dot-grid test file; code health and all focused tests then passed.
- Focused-check record: Typecheck, focused product and performance-structure tests, the four width feature rows and persistence, and a local visual check of wider ribbons.
- Skip: Aggregate delivery, measured performance, and unrelated export matrices; the shared export path and runtime are unchanged.
- Risks: Wide ribbons may intentionally overlap adjacent ribbons. Near a pole, existing spherical bounds clip the far edge to keep the geometry valid. More rows increase raster work without changing selected resolution or dot size.

### Iteration 26 - Independent logo scale

- Request: Allow changing the scale of logos inside their ticker rows.
- Task type: Later focused schema and logo-mask renderer edit.
- User-visible result: A Logo Scale section provides one percentage slider per logo, from 25% to 135%, defaulting to the current size at 100%. Logos keep their aspect ratio and fit inside their own band.
- Source/reference checked: Existing logo SVG dimensions, dot-mask mapping, loop settings, control inventory, persistence, and compiled renderer pipeline.
- Reference inputs: None for this iteration; supplied logo assets and registered motion reference stay unchanged.
- Docs/contracts read: `workflow.md`; schema and renderer routes, including `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local brainstorming, writing-plans, and browser skills apply.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `interaction-surface-ownership`, `renderer-technique-inventory`, `performance-coverage-levels`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Existing orbit at `globe.orientation` remains unchanged.
- Interaction ownership: Each global logo-scale property uses a built-in panel slider for precise values, discoverability, and off-screen editing. Canvas scale handles would obscure the dot pattern and duplicate the same operation.
- Control selection: Numeric percentage; built-in continuous slider with 1% steps and inline numeric editing. No custom control, collection, or new canvas UI is needed. The logo-loop entity now has eleven controls, so split into the existing seven-control placement/motion stage and a four-control sizing stage, with the same entity identity.
- Decision: Keep old position targets and current defaults. Add four independent scale targets and uniformly scale the existing mask dimensions; fit to the band and circumference without horizontal stretching. Keep dot spacing, ribbon geometry, loop timing, layers, timeline, and artifact capabilities unchanged.
- Alternatives rejected: Scaling the whole ribbon or its dots; a single shared scale; changing SVG paths; independent horizontal/vertical stretching; adding duplicate canvas handles.
- State/output mapping: `logos.dxc.scale`, `logos.meta.scale`, `logos.prada.scale`, and `logos.zillow.scale` feed each logo's mask in the shared preview/export renderer and survive the existing loop's position-only updates. Runtime persistence, settings transfer, history, and section reset own the values.
- Workload plan: Scale changes bounded mask classification, not dot cardinality, source paths, backing size, or pass frequency. Add targets to the existing raster interaction and preview/export inputs; keep envelope dimensions and source path caching unchanged. Run the focused structural assessment before renderer changes.
- Performance intent: ordinary-product-work
- Implementation plan: Update constants, a focused scale-control module, schema, logo inventory/acceptance, model settings, mask layout, and pipeline inputs. Add focused scale math/schema tests, four browser cases, and scale values to reload coverage.
- Focused-check scope: Control-to-raster behavior.
- Focused-check record: Focused scale/schema/product tests, typecheck, code health, structural performance checks, the four scale-control feature scenarios and persistence, plus a real-browser visual check.
- Skip: Aggregate delivery, unrelated export matrices, and measured performance; no new delivery receipt is required.
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Focused-check results: All 76 focused unit tests, typecheck, and code health passed. The four scale browser scenarios passed with protected output evidence and live pixel-direction assertions before pointer release. Reload coverage passed with four independent scales (55%, 75%, 120%, 130%); the existing easyJet final-position browser scenario also passed. Manual preview checks covered 65% and 130%, reload, and sidebar label fit; all user values were restored, with scales at 100% and Hold at 4 seconds. No browser errors or measured performance work.
- Browser fixture: Use a 1920x1080 viewport so full-canvas screenshots do not resize the page. Warm the screenshot probe, set the real 8-second hold and speed 2.5 controls, and put the selected logo at 50 for visible scale inspection. Playwright's clock holds the animation at its resting phase, with explicit frame advancement after UI actions. Hover the actual thumb before reading drag coordinates. Earlier attempts either let the eight-second hold expire during screenshot collection or paused redraws while screenshots resized the canvas; the final fixture avoids both without changing production animation or weakening output assertions.
- Risks: At very small scales the existing dot-grid resolution limits tiny logo detail. Maximum scale fits within the ribbon, so unusually wide marks may reach the circumference limit first.

### Iteration 27 - Match the reordered ticker rows

- Request: Match sidebar ordering and staggered motion to the user's rearranged bands; confirmed top-to-bottom order is easyJet, Ubisoft, Novo Nordisk, Prada.
- Task type: Later focused schema, defaults, and animation-order edit.
- User-visible result: Band Layout numbers, logo position controls, scale controls, and staggered orbit phases share the confirmed top-to-bottom order.
- Source/reference checked: User confirmation and the supplied settings screenshot. Its legacy band IDs have position/width pairs 1: 68/16, 4: 46/24, 2: 6/50, 3: -30/16. Existing schema, logo identities, mask settings, animation math, and persistence were inspected.
- Reference inputs: `/var/folders/5p/9wb9gsj17ns01kq5wz60bdr40000gn/T/codex-clipboard-86b82a96-8b24-49f4-8ec1-d62a9717f96f.png`. No new motion reference; existing motion-reference study and timing remain unchanged.
- Docs/contracts read: `workflow.md`; schema/control, animation, and renderer routes: `core/control-selection.md`, `core/layout.md`, `core/timeline-animation.md`, `core/runtime-boundary.md`, `core/performance.md`, `schema-reference.md`, `component-rules.md`, `decision-contract.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Local brainstorming, writing-plans, debugging, and browser workflows apply.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `interaction-surface-ownership`, `acceptance-product-observable`, `persistence-policy-explicit`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: Keep existing orbit at `globe.orientation` and the runtime scene surface.
- Interaction ownership: Existing global built-in panel properties remain the only owners of band placement, widths, logo stops, and scales. No duplicate canvas controls or new transport.
- Control selection: Keep continuous sliders, the eight-control Band Layout stage, the seven-control Logos stage, and four-control Logo Scale stage. Reuse one ordered band descriptor list for labels, targets, and motion rank.
- Decision: Keep legacy target IDs and logo-to-band bindings so saved widths, positions, scales, and settings files are not swapped. Only display numbering is changed. Use screenshot band geometry as the new reset/default layout; saved values take precedence. Preserve loop speed, stagger interval, easing, holds, restart, export, dot grid, layers, and timeline behavior.
- Alternatives rejected: Renumbering persisted targets; swapping logo artwork between bands; resetting the user's workspace; changing the established animation tempo; adding custom panel sorting or new editor UI.
- State/output mapping: The confirmed ordered descriptors drive the three sidebar control banks and each band's phase rank. Existing `bands.bandN.*` and `logos.*` targets continue to feed exactly the same band/logo in preview and export.
- Workload plan: Four phase-rank lookups replace array-index delays; no new rendering passes, loops, source paths, or workload limits. Screenshot width defaults remain within the existing 60% bound; update corresponding envelope defaults and run the focused structural assessment.
- Performance intent: ordinary-product-work
- Implementation plan: Add a shared ordered band descriptor module and focused built-in band controls; update schema ordering, logo controls, band defaults, acceptance/inventory, and animation rank. Add unit checks for exact order and stable identity, browser checks for phase order and live controls, and reload coverage.
- Focused-check scope: Schema-to-animation behavior.
- Focused-check record: Focused order/schema/animation/scale tests, structural render-plan checks, typecheck/code health, the reordered-layout, logo-orbit, and persistence feature scenarios. Inspect the live preview and screenshots without altering unrelated user settings.
- Skip: Aggregate delivery, export matrices, and measured performance. This is not a performance complaint or a first product delivery.
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Focused-check results: 63 focused Vitest checks passed across band order, schema, product behavior, speed, and logo scale; two focused structural renderer-plan checks passed. Browser acceptance passed for `logos.intro.run`, `bands.band4.position`, `bands.band2.width`, and `persistence.reload`. Real canvas row hashes prove each arrival, full four-second hold, and departure in the confirmed order; live pointer drags change ribbon pixels before release. Reload coverage preserves the legacy identities and all three sidebar orders. Desktop and mobile pixel/order checks passed and screenshots were inspected in `.toolcraft/browser-artifacts/band-order-desktop.png` and `band-order-mobile.png`; the finite canvas retains the existing workspace zoom on a narrow viewport. The live app on port 3002 was also inspected without resetting its saved settings.
- Test fixture corrections: Initial browser attempts exposed a real-time baseline race and a proof-session setup reload that reset the test clock. The focused band fixtures now establish the proof session first, warm the raster probe, and freeze the animation in its hold phase before real UI interaction. Pointer coordinates use the explicit tested slider bounds instead of absent ARIA min/max attributes. No application timing or protected proof helpers were changed.
- Final static checks: `npm run typecheck`, `npm run ai:check` (42 product files), and `git diff --check` passed. Extracted the live pointer assertion into the focused order helper to keep the existing globe spec within its 500-line budget; both affected browser scenarios passed again after extraction.
- Risks: Sidebar order is the explicitly confirmed composition, not an automatic reordering interface; later user layout changes may require another ordering update. Small logo details retain the existing dot-grid limits.

### Iteration 28 - Refresh the sidebar default preset

- Request: Update application defaults to the latest sidebar screenshot; the user subsequently confirmed Resolution scale 2.
- Task type: Later focused defaults edit, not a renderer or animation-curve change.
- User-visible result: Fresh workspaces and Reset use the visible screenshot values, retaining easyJet, Ubisoft, Novo Nordisk, Prada order.
- Source/reference checked: The latest supplied sidebar screenshot and the existing default constants, schema bindings, render-scale resolver, and product tests.
- Reference inputs: `/var/folders/5p/9wb9gsj17ns01kq5wz60bdr40000gn/T/codex-clipboard-dea20ae9-1640-42b3-a260-cd84ebe3a174.png`. No new motion reference.
- Docs/contracts read: `workflow.md`, `core/control-selection.md`, `core/layout.md`, `schema-reference.md`, `component-rules.md`, and `acceptance-testing.md`; local brainstorming and writing-plans skills.
- Contract rules applied: `controls-product-coverage`, `persistence-policy-explicit`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Preserve orbit at `globe.orientation`; its value is not visible in the reference.
- Interaction ownership: Keep the existing panel-owned properties and runtime Reset. No new controls or duplicate canvas operations.
- Decision: Set latitudes 8, meridians 16, line width 1.5, CRT 100, distance 1, dot size 1.25, column spacing 3.5; displayed band 1 position/width 69/17, other bands unchanged; Hold 3, Speed 2.5; logo stops 60/68/71/76 in display order. Keep black background/body, white lines, outline, finite 1920x1080, PNG/4K. Logo Scale is collapsed, so preserve its defaults and all saved values.
- Alternatives rejected: Guessing collapsed logo scales; clearing persistence; changing easing or stagger math; patching immutable runtime render-scale defaults or overriding user values on mount.
- State/output mapping: Existing schema defaults and renderer fallback constants remain one source. Existing target identities, reset commands, persistence, and settings transfer are unchanged.
- Performance intent: ordinary-product-work
- Implementation plan: Update `globe-constants.ts`, align declared workload defaults and product default/timing test expectations, then verify reset and current-speed loop behavior. Do not change render passes, limits, artifact settings, runtime code, or user workspace values.
- Focused-check scope: Defaults and reset behavior.
- Focused-check record: Exact default/schema/order/speed tests; focused browser reset/defaults and logo-loop restart; typecheck and code health.
- Skip: Aggregate delivery, export matrices, and measured performance; no first-delivery or performance authority.
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Focused-check results: 48 focused Vitest checks passed across the exact default preset, schema, product behavior, row order, speed, and CRT settings. Two structural renderer-envelope checks passed. The default-preset browser scenario passed fresh-workspace values, nine real UI edits, global Reset, unchanged fixed canvas/colors/export settings, and nonblank product pixels. The logo-loop restart scenario passed the updated 304 ms approach, 336 ms stagger, 1008 ms orbit, and full 3 s hold with per-row canvas samples. No curve or phase-order math changed. Desktop screenshots were inspected in `.toolcraft/browser-artifacts/sidebar-defaults.png` and `band-order-desktop.png`.
- Test fixture notes: Default-value observation reads Base UI's native range input, whose slider role is implicit, across the panel controls. The complete sampled animation scenario has a 180 s functional test timeout for the denser preset; assertions and backing quality were retained. These are test changes, not runtime modifications or measured performance claims.
- Final static checks: `npm run typecheck` and `npm run ai:check` passed (44 product files). The local app remains available on port 3002; browser proof used an isolated context on port 3003 and did not reset the user's saved workspace.
- Risks: None for the requested preset. The user explicitly confirmed Resolution scale 2 after the runtime default constraint was disclosed. Collapsed Logo Scale values and the unseen orientation retain their existing defaults.

### Iteration 29 - Verify the current animation

- Request: Test and clean the animation before website integration.
- Task type: Later focused functional verification and test-fixture maintenance.
- User-visible result: Product behavior was unchanged; the hold-control browser proof now isolates motion from CRT flicker.
- Source/reference checked: Product tests, real browser frames, build output, and the previous worklog entries.
- Reference inputs: None added.
- Docs/contracts read: workflow, acceptance-testing, decision-contract, core/runtime-boundary, renderer-technique, component-rules, and performance; local debugging and browser skills.
- Contract rules applied: acceptance-product-observable, workflow-required, and runtime-shell-required.
- View interaction intent: Existing orbit unchanged.
- Interaction ownership: Existing panel properties and canvas orbit unchanged.
- Decision: Keep product code intact. Correct worklog field formatting and use a controlled browser clock with CRT disabled only in the hold fixture; sample the actual first-row pixels before and after the edited pause.
- Alternatives rejected: Weakening the stable-baseline assertion or changing production timing to satisfy a test.
- State/output mapping: Real Hold edits change the sampled pause and departure; the fixture retains production rendering and quality.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Focused-check results: 509 unit/contract tests passed. Six selected browser scenarios passed across the initial run and corrected hold rerun: defaults, loop/restart, hold, speed, render scale, and reload. Typecheck, code health, docs, integrity, and production build passed. No measured performance was run.
- Risks: The editor bundle is not a standalone website component; its finite desktop workspace is cropped on narrow screens. Production preview was not completed in this batch.

### Iteration 30 - Standalone website animation module

- Request: Prepare the animation without the editor, including responsive sizing, offscreen suspension, reduced motion, and integration checks; continue the interrupted implementation.
- Task type: Later focused renderer extraction and website-library delivery.
- User-visible result: A built standalone ESM module, TypeScript declarations, responsive no-UI demo, and integration guide. The Toolcraft editor retains its controls, current preset, and animation.
- Source/reference checked: Existing globe renderer, model, dot grid, logo masks, animation curve, defaults, and pipeline registration.
- Reference inputs: No new assets or motion references; preserve the supplied logo artwork and existing motion study.
- Docs/contracts read: workflow; assembly-workflow; core/runtime-boundary; core/performance; core/timeline-animation; decision-contract; renderer-technique; performance; component-rules; acceptance-testing. Local brainstorming, writing-plans, debugging, and browser skills apply.
- Contract rules applied: runtime-shell-required, canvas-no-app-ui, renderer-technique-inventory, renderer-view-interaction, persistence-policy-explicit, acceptance-product-observable, and workflow-required.
- View interaction intent: Editor orbit stays unchanged. The explicitly requested website decoration has a fixed authored pose and no editor handles or input capture.
- Interaction ownership: Editor controls remain runtime-owned. The website exposes a library lifecycle API, not a second editor or duplicated panel controls.
- Decision: Extract the existing drawing functions into shared product modules. Add a framework-neutral, SSR-import-safe client with per-instance clocks, ResizeObserver, IntersectionObserver, document visibility and reduced-motion handling. Retain exact defaults, geometry, logo identities, and full 2x selected backing; no automatic quality reduction. The library never reads or writes the editor workspace.
- Alternatives rejected: Shipping the whole editor, copying a second renderer, altering the animation curve, or changing the signed runtime and host.
- State/output mapping: Canonical flat value targets feed the same settings reader and frame drawing; update changes those values, pause/resume preserves elapsed motion, restart resets only its instance, and destroy releases observers, listeners, frame scheduling, and backing pixels. Reduced motion uses the final positions without flicker.
- Workload plan: Existing bounded controls, four bands, fixed logo paths, and geometry counts remain unchanged. The editor retains its canonical pipeline and structural assessment. The website reuses geometry until counts change and draws only while visible; resize and value changes invalidate its frame. Build a separate ESM entry without React, Toolcraft UI, loaders, or external requests. No measured performance certification is claimed by this functional delivery.
- Implementation plan: Extract projection, bands, and frame modules; retain the editor adapter. Add focused website lifecycle/frame modules, a library build script, a no-UI demo, integration documentation, unit tests, browser lifecycle/resize/pixel checks, and editor loop regression coverage. No schema, export capability, timeline, layer, or persistence changes.
- Focused-check scope: Shared raster extraction and independent client lifecycle. Run unit tests, structural assessment, code health, typecheck, library build, website browser checks, and the editor loop and render-scale feature scenarios. Skip unrelated aggregate delivery and performance matrices.
- Focused-check results: 91 unit tests across 10 files passed, including all 24 new lifecycle/frame tests. All seven shipped-module browser scenarios passed through the protected product-test wrapper. Editor logo-loop and render-scale scenarios passed; the render-scale scenario was also rerun independently. TypeScript, code health (57 files), SSR import without DOM globals, and diff whitespace checks passed. The library build contains 18 modules and produces 161181 JavaScript bytes, or 45878 bytes with gzip.
- Browser results: Desktop 1920x1080 at DPR 1 and mobile 390x844 at DPR 3 retain exact CSS size times DPR times resolution scale 2 backing. Pixel bounds are nonblank and unclipped. The static 16:9 module frame matches the shared editor renderer byte-for-byte. Moving pixels, pause/resume, live reduced motion, real intersection suspension, multiple instances, transparent background, and ten destroy/remount cycles passed. Screenshots are recorded under `.toolcraft/browser-artifacts/neon-globe-embed-desktop.png` and `neon-globe-embed-mobile.png` and were visually inspected.
- Test corrections: Replaced an incorrect 80% diameter expectation with the existing 36%-radius scene contract and routed the new browser tests through the required protected wrapper. These corrections did not change product visuals, defaults, or timing.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Final site layout, third-party scripts, device-specific throughput, and real mobile Safari still require integration-level verification.

### Iteration 31 - Match the website module to the saved composition

- Request: Correct the logo positions seen at the pause by using the supplied settings JSON from the editor.
- Task type: Later focused website preset correction after a visual mismatch report.
- User-visible result: The rebuilt website module starts from the exact supplied composition. The existing demo tab has been reloaded; the editor workspace, schema defaults, final stops, and animation timing are unchanged.
- Source/reference checked: `/Users/elenamorozova/Desktop/neon-globe-2-settings.json`, exported 2026-08-27T12:57:53.292Z; the supplied pause screenshot; current website defaults and settings reader.
- Reference inputs: `neon-globe-2-settings.json` and `codex-clipboard-9b9833ae-b971-4ef7-871e-856454eedb17.png`. No new motion reference.
- Docs/contracts read: workflow; decision-contract; core/runtime-boundary; core/control-selection; core/layout; component-rules; renderer-technique; schema-reference; acceptance-testing; performance. Local debugging, brainstorming, writing-plans, and browser workflow apply.
- Contract rules applied: runtime-shell-required, persistence-policy-explicit, renderer-view-interaction, acceptance-product-observable, and workflow-required.
- View interaction intent: Keep the website's fixed authored pose, preserving both saved vectors and the existing projection; editor orbit remains unchanged.
- Interaction ownership: The settings export is the explicit portable source; the website API still accepts overrides. No duplicate UI or direct workspace-storage access.
- Decision: Store the exact exported JSON as the website preset and merge its values before caller overrides. Final logo positions already match; the mismatch is the pose and easyJet/Ubisoft/Novo Nordisk scales of 114/108/121 instead of 100. Keep the 3-second hold, 2.5 speed, row order, geometry, and resolution scale 2.
- Alternatives rejected: Estimating the pose from the screenshot, shifting final positions to compensate for rotation, modifying the animation curve, reading browser storage, or resetting editor settings.
- State/output mapping: The preset values feed the existing settings reader, projection, and logo masks. Caller values and later updates override only their named targets. Canvas/timeline/editor export metadata in the saved JSON does not become website transport state.
- Implementation plan: Add `src/embed/landing-preset.json`; test preset and override behavior in `globe-player.test.ts`; apply the values in `globe-player.ts`; align the shipped browser pixel comparison and integration guide; rebuild the module.
- Focused-check scope: Website preset tests, frame tests, browser snapshot parity plus desktop/mobile and movement scenarios, typecheck, and code health. Skip editor control tests, aggregate delivery, and measured performance because their implementation and workload boundaries are unchanged.
- Focused-check results: Embed Vitest tests passed 26/26. `npm run test:embed` rebuilt the module and passed all 8 browser scenarios, including exact editor/website pixel parity and animated arrival/hold parity with the saved composition. Desktop and mobile screenshots were visually checked; exact CSS x DPR x 2 backing was asserted. `npm run typecheck` and `npm run ai:check` passed. Structured JSON equality confirms the preset exactly matches the supplied export. The rebuilt JavaScript is 162757 bytes, 46460 bytes gzip.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: The website snapshot is intentionally independent of future editor changes; an updated composition requires replacing the supplied preset or passing explicit values.

### Iteration 32 - Keep the globe visible during canvas orbit

- Request: "если шар начинаешь крутить на канвасе то он фликерит и пропадает"
- Task type: Later focused renderer lifecycle bug fix; broken-behavior and renderer/canvas routes.
- User-visible result: The globe remains visible throughout canvas and gizmo dragging, with live pose and rendered-pixel changes before release.
- Source/reference checked: Reproduced on the current local editor with real pointer input. A frame observer found 34 transparent samples and 136 canvas dimension assignments during 35 pointer moves. The preview effect resized the backing and cancelled its pending frame on runtime/pipeline updates.
- Reference inputs: None added; existing logo motion reference is unchanged.
- Docs/contracts read: workflow; decision-contract; core/runtime-boundary; core/performance; component-rules; renderer-technique; performance; acceptance-testing. Local systematic-debugging, writing-plans, and browser skills apply.
- Contract rules applied: canvas-surface-preserved, infinity-canvas-scene-bounds, renderer-view-interaction, acceptance-product-observable, performance-coverage-levels, workflow-required.
- View interaction intent: Preserve orbit through the runtime gizmo/model interaction and `globe.orientation`.
- Interaction ownership: Canvas owns orientation; the runtime owns pointer capture and history. Panel controls retain their existing property ownership.
- Decision: Retain one animation-frame loop per mounted preview. Publish the latest committed scene/settings to that loop, coalescing updates into its next frame. Resize only when actual backing dimensions change and draw in the same callback. Keep the autonomous logo clock across orientation edits.
- Alternatives rejected: Clearing the canvas on every pose update, restarting pending frames on every store notification, drawing only after pointer release, lowering resolution, or changing the signed runtime.
- State/output mapping: Runtime evaluated settings, scene frame, render scale, background semantics, cached globe geometry, and the existing logo clock continue to feed the shared Canvas 2D frame renderer. Controls, persistence schema, layers, timeline, image export, and the standalone website module are unchanged.
- Implementation plan: Update `src/app/globe-renderer.tsx`; add a product-owned frame continuity helper to the existing orientation browser scenario; record focused results here.
- Verification tier: Tier 3 (later focused renderer correction).
- Reason: The bug affects preview scheduling and backing lifetime during orbit, without changing workload bounds or output geometry.
- Run: Existing orientation/animation unit checks, typecheck, code health, and `npm run test:feature -- globe.orientation runtime.render-scale logos.intro.run`; real-browser repeated-drag pixel inspection.
- Skip: Aggregate delivery, full browser/export matrices, and measured performance. This is a functional disappearance bug with a reproduced buffer-clear cause, not a latency/budget optimization request.
- Performance intent: ordinary-product-work
- Verification: Focused feature checks only; the first delivery receipt is preserved.
- Focused-check results: The new continuity assertion failed against the original implementation with 8 blank frames. After the fix, the protected orientation scenario passed canvas/gizmo dragging, axis snap, undo/redo/reset, and miss-pan, including zero blank-frame and unchanged-backing assertions. The render-scale and logo-loop feature scenarios also passed. Four selected orientation/loop/render-scale unit tests, typecheck, and code health passed; the existing product behavior and performance structure tests passed 47/47 before implementation. No measured performance or aggregate delivery was run.
- Browser diagnostics: Repeating the original 35-move drag produced 36 observed frames, zero blank frames, and zero backing assignments, with the pose changing before release. A separate fixed-animation-phase pixel probe changed its sampled image hash during a held drag while retaining 7680x4320 backing at DPR 2 and selected scale 2. Diagnostic screenshot capture timed out; no screenshot is claimed as proof.
- Test environment: The complete orientation scenario initially exceeded its 120-second aggregate limit while performing successful history/session observations. Its trace showed progressing browser operations, not a failed live-response assertion. The product-owned scenario now allows 300 seconds for all operations; the protected individual response deadlines and quality assertions are unchanged. The focused rerun passed in 3.2 minutes.
- Risks: None specific to the reproduced disappearance remains after focused verification. Broader performance certification is outside this functional correction.

### Iteration 33 - Adopt stable Infinity scene transitions

- Request: "обнови по последнему контаркту тулкрафта что при включении инфинит канваса у нас сцена не прыгает"
- Task type: Later focused framework compatibility refresh and product scene-coordinate correction.
- User-visible result: Preserve the globe's screen position, zoom, renderer/canvas identity, backing dimensions, and logo animation while toggling Infinity; preserve the viewport when returning to finite mode.
- Source/reference checked: Current Toolcraft main source at `/Users/kusnizza/Projects/primeui-v2`, including the current canonical scene contract. The existing app predates its stable-scene implementation: the browser reproduced a 960px/540px translation when enabling Infinity. Compatibility source is main-history commit `c726efa9`, containing the stable-scene implementation and its verified contract while retaining this app's public composition API. Generated its framework with the official source CLI into `.toolcraft/scratch/infinity-generated`.
- Reference inputs: None added. Existing product assets and motion reference remain unchanged.
- Docs/contracts read: workflow; assembly-workflow; decision-contract; core/runtime-boundary; core/setup-export; core/media-upload; core/performance; renderer-technique; component-rules; performance; acceptance-testing; corresponding canonical scene documentation from the compatible source snapshot. Local systematic-debugging, writing-plans, and browser skills apply.
- Contract rules applied: runtime-shell-required, canvas-surface-preserved, infinity-canvas-scene-bounds, renderer-view-interaction, acceptance-product-observable, persistence-policy-explicit, workflow-required.
- View interaction intent: Keep runtime-owned orbit and `globe.orientation`.
- Interaction ownership: Runtime owns canvas mode, navigation, clipping, history, and persistent viewport state; product supplies a centered world-space globe rectangle and its renderer.
- Decision: Refresh the complete signed compatible framework artifact through generation, preserving product modules, assets, settings identity, custom scripts, prior worklog, and initial delivery receipt. Center the canonical 1920x1080 globe scene at world origin and adapt its scene/export acceptance to the stable-frame contract.
- Alternatives rejected: A CSS offset or wrapper, direct edits to copied runtime, fabricating a signature, using dormant finite size as infinite geometry, or an unrelated migration to the newer module-based product API. This adopts the requested Infinity continuity contract; it does not claim an upgrade of every Toolcraft feature to current main.
- State/output mapping: Both modes consume one `sceneBoundsProvider` rect through `useToolcraftProductSceneFrame`; mode changes alter only finite clipping/background presentation. Existing orientation, logo clock, render scale, export controls, layers/timeline choices, and autonomous animation behavior are retained.
- Implementation plan: Assemble product code over the newly generated protected artifact in staging; validate compatibility before copying its signed files into the app; update centered scene bounds, acceptance expectations, and focused Infinity browser coverage. Preserve an exact backup of replaced framework files and never reset user product edits.
- Verification tier: Tier 3/4 surfaces, later focused checks only.
- Reason: Runtime scene identity and mode transitions change; this is an existing delivered product with a narrowly requested framework behavior.
- Run: Signed integrity and typecheck for refreshed framework compatibility; targeted scene/model unit tests; focused Infinity mode, scene export, Background, render-scale, and logo-loop browser checks as required by the changed scene/renderer lifecycle.
- Skip: Repeated aggregate delivery, full performance audit, unrelated control matrices, and measured performance.
- Performance intent: ordinary-product-work
- Product files: `globe-model.ts` centers the fixed scene; `globe-renderer.tsx` translates export drawing into that canonical frame; `globe-renderer-pipeline.ts` describes the existing Canvas 2D execution on main and separates CSS viewport zoom from backing-scale changes. Acceptance data, its model test, and the focused Infinity browser scenario/helper assert continuity.
- Concurrent accepted-release migration: Read the newly installed `gallery-workflow.md` and retained its precedence. Reapplied the canonical gallery migrator over the generated framework, preserving the original owner-approval evidence and baseline through the source signer. All 40 IDs remain mapped; inherited integrity mismatches are empty. Optional migration diagnostics live in `.toolcraft/infinity-gallery-migration-notes.json` outside signed contract docs.
- Recovery/provenance: `.toolcraft/infinity-refresh-20260915.tar.gz` preserves the exact source snapshot, generated staging artifact, overlay driver, and pre-refresh backup. Staging was archived out of test discovery after a root Vitest run also discovered its copied test files; the live focused unit run is repeated below.
- Compatibility checks: Signed integrity and TypeScript passed after promotion. The accepted-release validator returns `focused-development-only`, owner approval, and no executed checks. Staging code health and the 47 selected product/performance-structure tests passed; no performance measurements were run. The declaration had incorrectly labeled Canvas 2D as GPU, and was corrected to describe the actual main-thread renderer.
- Browser verification: `npm run test:feature -- runtime.infinity-canvas` passed in 43.8 seconds on the updated app. It exercises nondefault pan/zoom, both mode transitions, reload, Undo and Redo; protected continuity assertions prove equal world/view rectangles and backing dimensions plus identical host/output nodes. A controlled animation clock and rendered-pixel comparisons prove the existing logo phase survives; frame probes report no blank frames during toggles.
- Test environment: The initial staging Background scenario exhausted its inherited 30-second total while enumerating controls; it did not reach its export assertion. That staging run also exposed a font allow-list limitation caused by shared node_modules. Remaining checks run from the real app path through the accepted-release focused runner with its export I/O budget.
- Final focused verification: The live Infinity unit selection passed 2/2 tests. `npm run test:feature -- background.include runtime.infinity-scene-export runtime.render-scale logos.intro.run` passed all 4 scenarios (55.4s Background, 1.6m logo loop, 16.8s scene export, 32.7s backing-scale check). Together with the dedicated Infinity continuity run, all 5 selected browser scenarios passed. No aggregate delivery or measured performance was executed. `git diff --check` passed.
- Verification retry: An earlier live Background attempt lost its proof-session document during dev-server reloads while temporary staging files were being archived; the trace confirmed repeated Vite reconnects. After cleanup, the same assertions passed without product changes.
- Local run: The existing server at `http://127.0.0.1:3003/` serves the updated runtime; its identity endpoint reports Neon Globe 2 and this exact project directory.
- Risks: The compatible snapshot retains this app generation's export policy; migration to unrelated current-main API/export changes is outside the requested scene-toggle fix.

## Decisions

### Renderer

- Decision: Canvas 2D projected preview with Canvas 2D image export, including an optional synced outline stroke, four column-aligned dotted offset band ribbons, fitted dot row/column counts, four opaque black logo dot masks sampled from supplied SVG paths, an adjustable source-atop foreground CRT treatment, and an autonomous speed-adjustable reference-paced whole-orbit logo loop with widened row phase offsets.
- Reason: The product needs clean latitude and meridian linework plus foreground dot-matrix bands with logo-shaped black dot cells for a landing background; projected Canvas 2D strokes avoid WebGL tube and wide-line horizon artifacts while preserving the 3D sphere math, runtime orbit control, optional sphere contour, radius-derived dotted band placement, identical export masks, a user-tunable CRT pass that leaves black background pixels visually clean, and a self-running preview loop whose base motion cadence comes from the supplied video reference, can be made faster or slower with `logos.speed`, carries a little more inertia into the final approach, and slows primarily at the final landing state with at least one default row already held.
- Evidence: `src/app/globe-renderer.tsx`, `src/app/globe-crt-effect.ts`, `src/app/globe-logo-assets.ts`, `src/app/globe-renderer-pipeline.ts`, and `src/app/app-performance.ts`.
- Website module: `src/embed/neon-globe.ts` reuses `src/app/globe-frame.ts`, `globe-band-renderer.ts`, and `globe-projection.ts` without importing the editor. It has responsive backing, independent lifecycle controls, and no UI or storage. `docs/website-integration.md` documents the handoff.
- Preview lifecycle: The editor retains one animation loop for each mounted scene, reads the latest committed inputs, and resizes backing only when dimensions change, drawing the replacement frame in that same callback. Orbit and store updates preserve the existing pixels until the next complete frame.

### View Interaction

- Decision: `orbit` with orientation target `globe.orientation`.
- Reason: A visible editable 3D scene defaults to orbit, and the user explicitly requested axis tilt.
- Evidence: `appProductReadiness.viewInteraction` and schema `orientationGizmo`.

### Interaction Ownership

- Decision: Panel owns exact property edits; canvas owns spatial orientation.
- Reason: Numeric/color/export/band values need precise accessible controls; axis tilt benefits from spatial correspondence and must not be mirrored by panel sliders.
- Evidence: `appProductReadiness.interactionOwnership`.

### Timeline

- Decision: No top timeline; the logo orbit is an autonomous landing-background preview effect controlled by a local Logos action plus `Hold` and `Speed`.
- Reason: The user requested a self-running loop with reference-paced row timing, a stop at the default logo point, a faster adjustable tempo, and a little more inertia before stopping, but did not request scrub, play/pause transport, global duration editing, keyframes, video export, or export-at-time behavior.
- Evidence: `appTransferMode.animationIntent.mode` is `autonomous`; `appTransferMode.referenceInputs` maps the supplied motion reference to `logos.intro.run`; `panels.timeline` is omitted; `logos.intro.run` is a local action.

### Layers

- Decision: No layers.
- Reason: The product has one generated globe object and no multi-object visibility, selection, grouping, or reorder workflow.
- Evidence: `panels.layers` is omitted.

### Controls

- Decision: Built-in controls only, grouped into Background, Globe, Globe Outline, CRT, Bands, Band Layout, Logos, Logo Scale, Image Export, and sticky Export actions; CRT exposes one Intensity slider, Bands includes shared distance, universal dot size, and universal column spacing, Band Layout keeps per-band position and width sliders, and Logos contains one local `Run logos` action, `Hold` and `Speed` timing sliders, and four final-position sliders. Logo Scale adds four independent 25%-135% sizing controls, defaulting to 100%. The current preset is recorded in Iteration 28, with `Speed` 2.5, `Hold` 3 seconds, CRT `Intensity` 100%, and the explicitly confirmed `Resolution scale` 2.
- Reason: Runtime controls cover every requested value model, and the CRT treatment, bands, dot grid, and logo placement and size are global properties that fit built-in sliders. Bands and Logo loop each exceed ten controls and use cohesive workflow stages with shared entity identities.
- Evidence: `appControlSectionInventory` and `appSchema.panels.controls.sections`.

### Export

- Decision: Image export only through runtime `export-image`.
- Reason: Image export starts enabled for every product and includes the final-state projected grid, outline, bands, logo masks, and deterministic fixed-phase CRT treatment. SVG, video, and export-at-animation-time require explicit user request, which was not supplied.
- Evidence: `appProductReadiness.exportIntent` records image default, SVG not requested, and video not requested.

### Performance

- Decision: Functional first delivery plus later focused feature checks only, with no measured performance iteration.
- Reason: The requests ask for product behavior and visual output changes, not speed diagnosis or certification; band width, dot size, and column spacing affect dot cardinality and are modeled as workload dimensions, while logo final positions, whole-orbit Hold timing, Speed, row phase offsets, late-inertia easing, and CRT Intensity reposition or shade existing raster pixels without adding a user-scaled dot count. Animation-frame work is represented as a cheap loop-state pass plus constant-cost raster shading instead of direct expensive raster invalidation.
- Evidence: `appPerformance` declares renderer technique, pipeline, workload envelope, fixture adapters, and derived scenarios; focused performance gate passes.

## Evidence

- Source reviewed: `src/app/app-schema.ts`, `src/app/app-composition.tsx`, `src/app/app-acceptance-data.ts`, `src/app/app-motion-reference-data.ts`, `src/app/app-performance.ts`, product renderer/model modules, and generated motion reference studies under `src/app/reference-studies/`.
- Contract applied: Toolcraft runtime boundary, setup/export, control selection/layout, renderer technique, video reference, acceptance, and performance contracts.
- Evidence: Focused checks selected before first delivery include code health, typecheck, product Vitest, performance gate, and the protected delivery gate.

## Verification

- Verification classification: first product delivery.
- Reason: The neutral starter now has a new schema, renderer, export renderer, performance model, acceptance rows, and worklog.
- Run: One bare `npm run verify:delivery`.
- Skip: Measured performance and `npm run verify:perf`; no performance complaint or full-audit request was made.

- Verification classification: focused renderer/canvas edit
- Reason: Later renderer/canvas visual behavior changed, plus aligned preview/export metadata and focused tests.
- Run: `npm run typecheck`; `npm run ai:check`; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default`; `npm run test:feature -- globe.line-width globe.orientation runtime.render-scale`; `npm run test:feature -- export.image background.include runtime.infinity-scene-export`; `npx playwright test e2e/app-controls.spec.ts --grep-invert "browser perf:|toolcraft kernel:"`.
- Skip: Bare `npm run verify:delivery` and measured performance; this was a later ordinary edit with no performance complaint or full-audit request.

- Verification classification: focused schema/renderer option edit
- Reason: Later feature work adds one sidebar switch and one optional Canvas 2D outline stroke that shares the existing line thickness control.
- Run: `npm run typecheck`; `npm run ai:check`; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default`; `npm run test:feature -- globe.outline globe.line-width export.image`; `npm run test:feature -- persistence.reload`; `npx playwright test e2e/app-controls.spec.ts --grep-invert "browser perf:|toolcraft kernel:"`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, and measured performance; this is later ordinary feature work with no performance complaint or full-audit request.

- Verification classification: focused schema/renderer band edit
- Reason: Later feature work adds fixed-count band controls, Canvas 2D filled ribbon geometry, export inputs, and persistence coverage.
- Run: `npm run typecheck`; `npm run ai:check`; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default`; `npm run test:feature -- bands.distance bands.band1.position bands.band1.width bands.band2.position bands.band2.width bands.band3.position bands.band3.width bands.band4.position bands.band4.width export.image runtime.render-scale`; `npm run test:feature -- persistence.reload`; `npx playwright test e2e/app-controls.spec.ts --grep-invert "browser perf:|toolcraft kernel:"`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, and measured performance; this is later ordinary feature work with no performance complaint or full-audit request.

- Verification classification: focused renderer band-material edit
- Reason: Later renderer work changes the fixed-count band material from solid fill to a fixed-size geometry-bound dot matrix without adding controls or workload dimensions.
- Run: `npm run typecheck`; `npm run ai:check`; `node scripts/check-toolcraft-docs.mjs`; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default`; `npm run test:feature -- bands.distance bands.band1.position bands.band1.width bands.band2.position bands.band2.width bands.band3.position bands.band3.width bands.band4.position bands.band4.width export.image runtime.render-scale`; visual browser snapshot under `.toolcraft/browser-artifacts/`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, and measured performance; this is later ordinary visual renderer work with no performance complaint or full-audit request.

- Verification classification: focused schema/renderer dot-grid edit
- Reason: Later feature work adds one Bands slider, changes Canvas 2D dot row cardinality, and updates workload metadata for the affected controls.
- Run: `npm run typecheck`; `npm run ai:check`; `node scripts/check-toolcraft-docs.mjs`; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default`; `npm run test:feature -- bands.dot-size bands.band1.width bands.band2.width bands.band3.width bands.band4.width export.image runtime.render-scale`; visual browser snapshot under `.toolcraft/browser-artifacts/`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, and measured performance; this is later ordinary feature work with no performance complaint or full-audit request.

- Verification classification: focused schema/renderer dot-column edit
- Reason: Later feature work adds one Bands slider, changes Canvas 2D dot column cardinality, updates section inventory, and updates workload metadata for the affected controls.
- Run: `npm run typecheck`; `npm run ai:check`; `node scripts/check-toolcraft-docs.mjs`; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default`; `npm run test:feature -- bands.column-spacing bands.dot-size export.image runtime.render-scale persistence.reload`; visual browser snapshot under `.toolcraft/browser-artifacts/`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, and measured performance; this is later ordinary feature work with no performance complaint or full-audit request.

- Verification classification: focused schema/renderer logo-mask edit
- Reason: Later feature work adds four Logos sliders, embeds four supplied SVG mask assets, changes Canvas 2D dot-mask raster output, and updates persistence/export coverage.
- Run: `npm run typecheck`; `npm run ai:check`; `node scripts/check-toolcraft-docs.mjs`; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default`; `npm run test:feature -- logos.dxc.final-position logos.meta.final-position logos.prada.final-position logos.zillow.final-position export.image persistence.reload runtime.render-scale`; visual browser snapshot under `.toolcraft/browser-artifacts/`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, and measured performance; this is later ordinary feature work with no performance complaint or full-audit request.

- Verification classification: focused schema/defaults edit
- Reason: Later feature work changes existing control defaults and reset state without adding controls, renderer code, export capability, or workload dimensions.
- Run: `npm run typecheck`; `npm run ai:check`; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts --reporter=default`; `npm run test:feature -- globe.outline bands.distance bands.dot-size bands.column-spacing bands.band1.position bands.band1.width bands.band2.position bands.band2.width bands.band3.position bands.band3.width bands.band4.position bands.band4.width logos.dxc.final-position logos.meta.final-position logos.prada.final-position logos.zillow.final-position persistence.reload runtime.render-scale`; visual browser snapshot under `.toolcraft/browser-artifacts/`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, and measured performance; this is a later ordinary defaults edit with no performance complaint or full-audit request.

- Verification classification: focused schema/renderer animation action edit
- Reason: Later feature work adds one local Logos action and transient Canvas 2D animation-frame invalidation for existing logo masks, without enabling timeline, video export, or new workload dimensions.
- Run: `npm run typecheck`; `npm run ai:check`; `node scripts/check-toolcraft-docs.mjs`; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default`; `npm run test:feature -- logos.intro.run logos.dxc.final-position logos.meta.final-position logos.prada.final-position logos.zillow.final-position runtime.render-scale`; visual browser snapshot under `.toolcraft/browser-artifacts/`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, measured performance, timeline tests, and video export tests; this is a later ordinary no-loop preview animation with no performance complaint or full-audit request.

- Verification classification: focused schema/renderer autonomous loop edit
- Reason: Later feature work changes preview animation timing to a continuous loop and adds one Hold timing slider, without enabling timeline, video export, or new workload dimensions.
- Run: `npm run typecheck` passed; `npm run ai:check` passed; `node scripts/check-toolcraft-docs.mjs` passed; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default` passed; `npm run test:feature -- logos.intro.run logos.hold-seconds logos.dxc.final-position logos.meta.final-position logos.prada.final-position logos.zillow.final-position persistence.reload runtime.render-scale` passed 8/8; visual browser smoke saved `.toolcraft/browser-artifacts/logo-loop-arrival.png`, `.toolcraft/browser-artifacts/logo-loop-hold.png`, and `.toolcraft/browser-artifacts/logo-loop-departure.png`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, measured performance, timeline tests, and video export tests; this is a later ordinary autonomous landing-animation edit with no performance complaint or full-audit request.

- Verification classification: focused renderer animation-curve edit
- Reason: Later visual mismatch correction removes the old left-side loop speed-change point by changing the logo orbit timing curve only; controls, export capabilities, workload dimensions, and Toolcraft timeline state are unchanged.
- Run: `npm run typecheck` passed; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default` passed; `npm run test:feature -- logos.intro.run logos.hold-seconds logos.dxc.final-position logos.meta.final-position logos.prada.final-position logos.zillow.final-position persistence.reload runtime.render-scale` passed 8/8; visual browser smoke saved `.toolcraft/browser-artifacts/logo-loop-smooth-fast-approach.png`, `.toolcraft/browser-artifacts/logo-loop-smooth-fast-hold.png`, and `.toolcraft/browser-artifacts/logo-loop-smooth-fast-departure.png`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, measured performance, timeline tests, and video export tests; this is a later ordinary motion-quality edit with no performance complaint or full-audit request.

- Verification classification: focused renderer animation-desync edit
- Reason: Later motion-quality correction increases row phase offsets and removes the reset-start parking branch; controls, export capabilities, workload dimensions, and Toolcraft timeline state are unchanged.
- Run: `npm run typecheck` passed; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts --reporter=default` passed; `npm run test:feature -- logos.intro.run logos.hold-seconds logos.dxc.final-position logos.meta.final-position logos.prada.final-position logos.zillow.final-position persistence.reload runtime.render-scale` passed 8/8; visual browser smoke saved `.toolcraft/browser-artifacts/logo-loop-desync-start.png`, `.toolcraft/browser-artifacts/logo-loop-desync-mid.png`, and `.toolcraft/browser-artifacts/logo-loop-desync-spread-hold.png`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, measured performance, timeline tests, and video export tests; this is a later ordinary motion-quality edit with no performance complaint or full-audit request.

- Verification classification: focused video-reference renderer animation edit
- Reason: Later motion-reference work changes autonomous logo loop timing/easing, registers video reference evidence, and adds browser reference-parity coverage without changing controls, export capability, workload dimensions, or Toolcraft timeline state.
- Run: `npm run reference:study -- --source /tmp/toolcraft-clean-reference-cfr25.mp4 --kind screen-recording` passed after CFR25 normalization from the supplied CleanShot source; `npm run typecheck` passed; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-acceptance.video-reference-study.test.ts src/app/app-acceptance.motion-reference-mapping.test.ts src/app/app-acceptance.motion-reference-identity.test.ts src/app/app-acceptance.motion-reference-partitions.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts src/app/app-acceptance.product-worklog.test.ts src/app/app-acceptance.worklog.test.ts --reporter=default` passed 100 tests; `npm run test:feature -- logos.intro.run logos.hold-seconds logos.dxc.final-position logos.meta.final-position logos.prada.final-position logos.zillow.final-position persistence.reload runtime.render-scale` passed 8/8; `npm run ai:check` passed; `node scripts/check-toolcraft-docs.mjs` passed; visual browser smoke saved `.toolcraft/browser-artifacts/logo-reference-paced-start.png`, `.toolcraft/browser-artifacts/logo-reference-paced-front-slowdown.png`, and `.toolcraft/browser-artifacts/logo-reference-paced-hold.png`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, measured performance, timeline tests, and video export tests; this is a later ordinary reference-paced motion edit with no performance complaint or full-audit request.

- Verification classification: focused schema/renderer animation-speed edit
- Reason: Later feature work adds one Logos slider and maps it to autonomous preview timing, persistence, renderer pipeline metadata, and browser product output without changing export capability, workload dimensions, or Toolcraft timeline state.
- Run: `npm run typecheck`; `npm run ai:check`; `node scripts/check-toolcraft-docs.mjs`; `npx vitest run src/app/app-schema.test.ts src/app/app-product-behavior.test.ts src/app/app-logo-speed.test.ts src/app/app-acceptance.video-reference-study.test.ts src/app/app-acceptance.motion-reference-mapping.test.ts src/app/app-acceptance.motion-reference-identity.test.ts src/app/app-acceptance.motion-reference-partitions.test.ts src/app/app-performance.gates.test.ts src/app/app-performance.lifecycle.test.ts src/app/app-performance.fixture-helper.test.ts src/app/app-acceptance.product-worklog.test.ts src/app/app-acceptance.worklog.test.ts --reporter=default`; `npm run test:feature -- logos.speed logos.intro.run logos.hold-seconds persistence.reload runtime.render-scale`; visual browser smoke under `.toolcraft/browser-artifacts/`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, measured performance, timeline tests, and video export tests; this is a later ordinary speed-control edit with no performance complaint or full-audit request.

- Verification classification: focused renderer animation-curve edit
- Reason: Later motion-quality work changes only the autonomous logo loop easing curve before the final stop; controls, export capability, workload dimensions, and Toolcraft timeline state are unchanged.
- Run: `npm run typecheck`; `npm run ai:check`; `node scripts/check-toolcraft-docs.mjs`; `npx vitest run src/app/app-product-behavior.test.ts src/app/app-logo-speed.test.ts src/app/app-acceptance.product-worklog.test.ts src/app/app-acceptance.worklog.test.ts src/app/app-performance.gates.test.ts --reporter=default`; `npm run test:feature -- logos.intro.run logos.speed`; visual browser smoke under `.toolcraft/browser-artifacts/`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, measured performance, schema/layout tests, timeline tests, and video export tests; this is a later ordinary easing refinement with no performance complaint or full-audit request.

- Verification classification: focused renderer CRT edit
- Reason: Later renderer work changes the shared preview/export Canvas 2D raster styling with a constant-cost foreground post-process; controls, export capability, workload dimensions, persistence, and Toolcraft timeline state are unchanged.
- Run: `npm run typecheck`; `npm run ai:check`; `node scripts/check-toolcraft-docs.mjs`; `npx vitest run src/app/app-crt-effect.test.ts src/app/app-product-behavior.test.ts src/app/app-schema.test.ts src/app/app-acceptance.product-worklog.test.ts src/app/app-acceptance.worklog.test.ts src/app/app-performance.gates.test.ts --reporter=default`; `npm run test:feature -- export.image background.include runtime.render-scale`; visual browser smoke under `.toolcraft/browser-artifacts/`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, measured performance, schema/control tests beyond the focused metadata gates, timeline tests, and video export tests; this is a later ordinary visual refinement with no performance complaint or full-audit request.

- Verification classification: focused schema/renderer CRT-control edit
- Reason: Later feature work adds one CRT sidebar slider and strengthens the shared preview/export Canvas 2D foreground post-process without changing export capability, workload dimensions, layers, or Toolcraft timeline state.
- Run: `npm run typecheck` passed; `npm run ai:check` passed; `node scripts/check-toolcraft-docs.mjs` passed; `npx vitest run src/app/app-crt-effect.test.ts src/app/app-crt-settings.test.ts src/app/app-schema.test.ts src/app/app-acceptance.product-worklog.test.ts src/app/app-acceptance.worklog.test.ts src/app/app-performance.gates.test.ts --reporter=default` passed 41 tests; `npm run test:feature -- effects.crt-intensity export.image background.include runtime.render-scale persistence.reload` passed 5 browser scenarios.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, measured performance, timeline tests, and video export tests; this is a later ordinary visual-control edit with no performance complaint or full-audit request.

- Verification classification: focused schema/renderer CRT-strength edit
- Reason: Later feature work changes the CRT default and foreground post-process alpha constants without changing controls, export capability, workload dimensions, layers, or Toolcraft timeline state.
- Run: `npm run typecheck` passed; `npm run ai:check` passed; `node scripts/check-toolcraft-docs.mjs` passed; `npx vitest run src/app/app-crt-effect.test.ts src/app/app-crt-settings.test.ts src/app/app-schema.test.ts src/app/app-acceptance.product-worklog.test.ts src/app/app-acceptance.worklog.test.ts src/app/app-performance.gates.test.ts --reporter=default` passed 41 tests; `npm run test:feature -- effects.crt-intensity export.image background.include runtime.render-scale` passed 4 browser scenarios after updating the deterministic export pixel expectation to `[236, 236, 236, 255]`.
- Skip: Bare `npm run verify:delivery`, `npm run verify:perf`, measured performance, timeline tests, video export tests, and persistence reload; this is a focused visual-strength edit and does not add or remove persisted targets.

## Risks

- Risk: Preview and image export share a deterministic Canvas 2D projection, so browser acceptance must keep proving semantic pixels and export bounds after renderer changes.
- Risk: Horizon clipping intentionally removes tiny near-edge line fragments to keep the sphere grid clean.
- Risk: Optional outline is a sphere silhouette only; it must remain synchronized with `Line width` and must not add continent outlines.
- Risk: Dotted foreground bands intentionally cover the globe grid where they cross it; future design changes should preserve the shared-distance radius derivation rather than replacing them with constant screen-space shapes.
- Risk: Smaller dot size and smaller column spacing increase dot samples; schema bounds and performance metadata must stay aligned with renderer limits.
- Risk: The current logos are fixed supplied product assets; future user-replaceable logos should use a runtime media/fileDrop workflow instead of hard-coded source data.
- Risk: The current logo orbit is an autonomous preview loop; future video export, scrubbed playback, or app-wide timeline transport should use explicit Toolcraft timeline coverage.
- Risk: Existing locally persisted workspaces can preserve older edited values until the user resets controls, because schema defaults should not silently erase saved state.
- Risk: The motion reference evidence was generated from a CFR25 normalized copy of the supplied CleanShot recording because the original variable-timing scan failed the protected timestamp agreement check; the original source hash and normalized evidence hash are both recorded in Iteration 17.
- Risk: The CRT effect is now adjustable through `effects.crtIntensity`; stronger values should keep using foreground-only composition so the black background stays clean and export remains deterministic.


### 2026-09-15 — Accepted existing release and focused development

- Request: "найди апку neon-globe и обнови ее контракт", following the owner's explicit agreement to adopt the same portable acceptance workflow as the existing gallery apps.
- Task: generated workflow maintenance for an already accepted existing product; no new first-delivery certification.
- Source: canonical Toolcraft gallery-installers/workflow/ and scripts/gallery-migration/migrate.mjs. Applied the canonical generator in an isolated monorepo-shaped copy because Neon Globe is standalone.
- Contracts read: existing AGENTS.md, docs/toolcraft/workflow.md and the canonical accepted-gallery workflow. The generated gallery policy now takes precedence over historical first-delivery scheduling, while the pinned runtime/API rules remain applicable.
- Decision: distribute signed owner acceptance in toolcraft-release.json and use the canonical focused feature runner. Evidence explicitly states testsExecuted: false; this records owner acceptance, not a fabricated delivery result.
- Alternatives rejected: fake local checkpoints, repeated aggregate delivery and a runtime upgrade. No deployment or publication was requested.
- Concurrent work: An Infinity compatibility plan was appended to the worklog during this migration. That entire entry is preserved. Any later framework regeneration must retain the accepted-gallery overlay and regenerate its manifest hashes and release signature through the source generator; do not overwrite this contract with first-delivery scheduling.
- Product mapping: renderer, controls, defaults, assets, runtime source, dependency versions, lockfile, embed packaging and existing product tests are unchanged. All 1329 other non-generated baseline files were compared byte-for-byte; the separately reviewed concurrent worklog entry was preserved before this append.
- Verification: canonical workflow unit tests 12/12 passed; generated signatures and inherited hashes valid; all 40 acceptance IDs mapped to 41 existing functional scenarios. Fresh npm ci installed the unchanged dependency lockfile. The exact globe.default-preset scenario passed through npm run test:feature -- globe.default-preset.
- Portability: a renamed copy without node_modules or .toolcraft returned focused-development-only with checksRun: []; a later product edit preserved acceptance and release bytes. Tampered workflow, command and signature were rejected.
- Known inherited test issue: globe.sphere-color failed the stationary raster baseline assertion both before migration with the original runner and after migration. The continuously changing output makes that existing test unsuitable for a stable pixel baseline. It remains failed, not waived or marked passed. No product or test change was made to hide it. The baseline reproduction also logged a Vite font-path warning due to shared test dependencies; the migrated passing check used a real fresh npm ci installation.
- Scope: no aggregate application tests, production build, delivery proof or measured performance were run. The failed and passing focused scenarios retain their actual outcomes.
