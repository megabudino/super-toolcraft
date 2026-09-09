# Implementation Worklog

## Status

Mode: product

Dot Formation is a Canvas 2D particle-type studio based on the supplied motion reference. The current product supports editable particle text, a Toolcraft playback timeline, persisted workspace state, finite and Infinity canvas modes, and image/video export.

## Decisions

### Renderer

- Decision: Use one Canvas 2D renderer with cached normalized glyph anchors, deterministic seeded particles, analytic damped-spring motion, and one stable world-space scene envelope in Infinity mode.
- Reason: The renderer preserves individual circles, trails, overshoot, delayed particles, exact timeline seeking, and deterministic export without thousands of DOM nodes or a path-dependent physics simulation.
- Evidence: `src/app/dots/dots-renderer.tsx`, `src/app/dots/dots-render-frame.ts`, `src/app/dots/dots-shape.ts`, `src/app/dots/dots-scene-bounds.ts`, and `rendererPipelineRegistration` in `src/app/dots/dots-pipeline.ts`.

### View Interaction

- Decision: Keep product view interaction `non-spatial` and use the runtime viewport for pan, zoom, radar, center, and Infinity canvas mode.
- Reason: The visible product is a flat two-dimensional particle composition with no rotatable model or orientation target.
- Evidence: `appProductReadiness.viewInteraction` in `src/app/app-acceptance-data.ts`, the absence of an Orientation Gizmo, and the runtime-owned canvas controls.

### Interaction Ownership

- Decision: The panel owns exact text, typography, particle, timing, physics, color, background, and export settings; the runtime canvas owns viewport operations and the finite/Infinity mode switch.
- Reason: Each operation has one primary surface, so the canvas stays unobstructed product output while controls keep history, persistence, reset, and accessibility behavior.
- Evidence: `starterControlSectionInventory` and `interactionOwnership` in `src/app/app-acceptance-data.ts`; product code declares schema controls and does not render duplicate Toolcraft controls.

### Timeline

- Decision: Use the top Toolcraft playback timeline with adjustable Active and Calm intervals and a seamless forward-only loop.
- Reason: Motion is the product output, video export is supported, and random-access time evaluation is required for scrubbing and deterministic frame export.
- Evidence: Timeline configuration in `src/app/app-schema.ts`, timing intent in `src/app/dots/dots-timing.ts`, analytic evaluation in `src/app/dots/dots-motion.ts`, and browser timeline acceptance.

### Layers

- Decision: Do not enable Layers.
- Reason: The product edits one coherent particle composition and exposes no independently selectable layer entities.
- Evidence: `appSchema.panels.layers` is omitted and no layer acceptance rows are registered.

### Controls

- Decision: Use built-in Toolcraft controls grouped by product meaning: text and typography, particles, timing, physics, color themes and palette, dot appearance, image export, and video export; let runtime Setup own the visible background placement.
- Reason: The grouping follows user tasks while the shared Setup contract keeps Background, Infinity canvas, Background color, finite sizing, and Timeline consistent across products.
- Evidence: `src/app/app-schema.ts`, the matching product-section inventory, runtime Setup normalization, explicit stable section IDs, and acceptance rows in `src/app/app-acceptance-data.ts`.

### Export

- Decision: Export the current-frame world-space bounds for Infinity PNG/JPEG and one stable full-timeline world-space envelope for Infinity video; finite export keeps the selected output aspect and size.
- Reason: A still image should tightly represent the frame the user sees, while every video frame must use identical dimensions and origin to avoid crop jitter.
- Evidence: `src/app/dots/dots-export.ts`, `resolveSceneExportFrame`, `getDotsSceneBounds`, decoded image assertions, and ffprobe video dimension/duration assertions in `e2e/dots-infinity-canvas.spec.ts`.

### Performance

- Decision: Keep renderer work bounded by the declared particle count, output long edge, render scale, and timeline duration; let the protected delivery lifecycle derive exact affected proof from `src/app/app-verification-impact.json`.
- Reason: Product work needs fast targeted feedback and one authoritative delivery gate, while full certification is a separate operator decision.
- Evidence: `src/app/app-performance.ts`, `src/app/app-verification-impact.json`, the four registered renderer passes, focused unit/browser checks, and protected receipts.

## Decision Trail

### Initial product — Video-referenced editable particle text formation

- Request: Study `/Users/kusnizza/Desktop/Untitled.mp4` in detail from the beginning and build a similar animation where the user can edit text and font, particle count, physics, distribution, weight, colors, dot-size dynamics, and other useful settings while particles form the authored text.
- Task type: First product delivery with a video-reference study, schema, custom renderer, playback timeline, persistence, image/video export, acceptance, and bounded performance coverage.
- User-visible result: A colored perimeter ring launches into editable text through deterministic spring motion. Users can edit typography, particle topology and count, timing, physics, colors, dot appearance, background, output size, and image/video settings.
- Source/reference checked: `/Users/kusnizza/Desktop/Untitled.mp4`; ffprobe metadata; decoded-frame checksums; opening and full-duration contact sheets; frame-difference motion metadata; Toolcraft runtime contracts.
- Reference inputs: `/Users/kusnizza/Desktop/Untitled.mp4` and the derived contact sheets, frame checksums, and motion metadata recorded in `src/app/dots/dots-video-reference-study.ts`.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/reference-study.md`, `core/runtime-boundary.md`, `core/control-selection.md`, `core/layout.md`, `core/timeline-animation.md`, `core/setup-export.md`, `schema-reference.md`, `decision-contract.md`, `component-rules.md`, `renderer-technique.md`, `acceptance-testing.md`, and `performance.md`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `interaction-surface-ownership`, `timeline-mode-choice`, `timeline-enabled-behavior`, `controls-product-coverage`, `output-export-required`, `controls-section-inventory-required`, `renderer-technique-inventory`, `renderer-view-interaction`, `reference-clone-source-of-truth`, `video-reference-analysis`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `non-spatial`; the product is a flat Canvas 2D composition with no three-dimensional scene.
- Interaction ownership: Panel controls own product authoring; the canvas displays product output and the Toolcraft runtime owns viewport interaction.
- Decision: Use deterministic glyph sampling and an analytic damped spring so every timeline position, preview frame, image, and video frame resolves from the same state without simulation history.
- Alternatives rejected: DOM/SVG particles would create thousands of nodes; a stateful solver would make scrub and export path-dependent; WebGL was unnecessary for the bounded circle field; custom canvas controls would duplicate runtime controls.
- State/output mapping: Schema values feed `readDotsSettings`, the particle plan, analytic motion, Canvas 2D preview, and image/video exporters; timeline state supplies exact time; runtime persistence restores values, canvas, panels, and timeline.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Browser font availability and recording MIME support vary; the renderer waits for font readiness, uses a compatible fallback, and the exporter keeps the actual container type and extension truthful.
- Video Reference Study: The 10.548333-second, 1830x2304 reference begins as a multicolor perimeter ring, bursts inward asynchronously, becomes readable with long trails, settles into discrete moving dots, and returns forward to the starting topology. Storyboard frames, frame-to-frame transition analysis, behavior decomposition, and acceptance mapping are typed in `src/app/dots/dots-video-reference-study.ts`.

### Ordinary delivery — Contract-native Infinity canvas

- Request: добавь в эту апку согласно контракту инфинит канвас
- Task type: Ordinary product delivery after refreshing the generated framework source, excluding installed workflow skills from product verification inputs, and adding world-space scene bounds, Infinity preview behavior, finite restoration, persistence, image/video export semantics, and acceptance ownership.
- User-visible result: The runtime Infinity canvas switch now removes the finite artboard backing, centers the animated particle scene in world space, allows viewport pan/zoom, survives reload, restores finite mode through off/undo/redo, exports a tight current-frame still, and exports video with one stable full-cycle frame.
- Source/reference checked: Current generated-app contracts under `docs/toolcraft`, the current monorepo starter/runtime source, existing dots renderer/export code, runtime scene-bounds and export helpers, and the running app.
- Reference inputs: None; the request is a runtime-contract behavior extension and supplies no new visual reference.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/runtime-boundary.md`, `core/setup-export.md`, `core/control-selection.md`, `core/layout.md`, `core/performance.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, `decision-contract.md`, and `acceptance-testing.md`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `interaction-surface-ownership`, `timeline-enabled-behavior`, `output-export-required`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Unchanged `non-spatial`; Infinity canvas changes the two-dimensional viewport and world-space frame, not the product camera model.
- Interaction ownership: The runtime switch and viewport own mode, pan, zoom, radar, center, history, and persistence; product code owns only scene-bound calculation and renderer/export mapping.
- Decision: Sample exact analytic frames at the product video frame rate to resolve a conservative full-cycle envelope, use the current analytic frame for still export, translate the renderer into the resolved world origin, and preserve the finite renderer path unchanged. Render full-resolution video frames in a coalescing OffscreenCanvas worker and transfer only completed ImageBitmaps to the recording canvas so 4K export cannot monopolize the interactive main thread. Subscribe the product renderer only to pixel-affecting values, canvas mode/size, and timeline state so runtime viewport offset and zoom transform the retained scene without invalidating the preview pass. Project-installed `.agents/skills` remain available to agents but are excluded from product delivery diffs because they are workflow inputs rather than application behavior.
- Alternatives rejected: Patching copied runtime code would fork the signed framework; deleting embedded skills would remove useful workflow guidance without proving product behavior; treating skills as product source would make delivery scope depend on local agent setup; treating the old finite rectangle as an Infinity frame would leave a false canvas above the runtime canvas; current-frame video cropping would jitter; lowering the 30 fps export cadence or upscaling a smaller render would reduce output fidelity; direct localStorage writes would bypass runtime persistence and history.
- State/output mapping: Runtime `canvas.mode` selects finite or Infinity layout; `getDotsSceneBounds` derives world bounds from current values and timeline time/range; `DotsRenderer` maps those bounds to preview pixels; `createDotsPanelActions` maps the same bounds into image and video export frames; the video worker consumes the same deterministic plan, settings, timeline progress, world origin, and stable scene frame as the main renderer; runtime persistence restores `canvas.mode` and timeline duration.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: The full-cycle envelope samples the exact 30 fps export cadence and includes radius, glow, and trail padding; font readiness is awaited before caching geometry so persisted reload cannot shrink the bounds because of fallback metrics. Browsers without OffscreenCanvas retain the exact main-thread fallback rather than losing video export.

### Ordinary delivery — Background and Timeline placement in runtime Setup

- Request: давай переработаем эту часть. таймлайн сделаем в самом низу секции как было раньше. нижнюю настройку бэкграунда переносим сюда. делаем первый тугл background, рядом с ним справа инфинит тугл, ниже идет цвет, по расположению также до аспект ратио как сейчас. в итоге эт саекция всегда живет в сеттингс секции в панели. сделай это на уровне нашего приложения а потом обнови приложение которое я показал
- Task type: Runtime/template contract update followed by signed generated-framework refresh and ordinary product delivery.
- User-visible result: Setup renders Export/Import first, Background left of Infinity canvas, Background color below, the existing finite sizing and Resolution scale controls after that, and Timeline last. The separate lower Background section is gone.
- Source/reference checked: The supplied controls-panel screenshot, current `particle-typography` schema/acceptance/worklog, shared runtime Setup normalizer and panel renderer tests, starter output-background acceptance validators, and current Toolcraft local contracts.
- Reference inputs: `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-792a29c7-31e8-40ed-b8aa-60c4b381ef5e.png`.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/timeline-animation.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `schema-reference.md`, `component-rules.md`, and `decision-contract.md`; `acceptance-testing.md` and `performance.md` are read immediately before final proof.
- Contract rules applied: `runtime-shell-required`, `panel-host-behavior`, `timeline-enabled-behavior`, `controls-product-coverage`, `output-export-required`, `controls-section-inventory-required`, `controls-component-layout-invariants`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Unchanged `non-spatial`; this delivery only changes runtime-owned panel placement and does not alter the two-dimensional canvas interaction model.
- Interaction ownership: Runtime Setup owns the placement of Background, Infinity canvas, Background color, finite sizing, Resolution scale, and Timeline; product targets remain the sole owners of their existing output state.
- Decision: Keep `export.includeBackground` and `appearance.background` as the only state owners. Declare them as the standard authored source pair, then let runtime normalization consume the pair into headerless Setup, own final labels/order/layout, and omit the empty visible Background section.
- Alternatives rejected: DOM reparenting would split schema order from rendered order and reset semantics; duplicating controls inside Setup would create competing state owners; a new product-only control renderer would bypass built-in controls and fail to update every generated app.
- State/output mapping: Background writes `export.includeBackground`; Background color writes `appearance.background`; Infinity writes runtime `canvas.mode`; Timeline writes runtime panel presentation. Existing preview/image/video helpers and persistence continue reading those same targets.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Background source extraction intentionally requires the exact standard pair in an authored Background section; malformed or ambiguous source declarations remain visible and fail acceptance instead of being silently moved.

### Ordinary delivery — Background-owned Infinity workspace

- Request: в этом приложении ты реализовал новую работу с background и инфинити канвас, но при включении инфинити канвас цвет бэкграунда не применяется, а должен быть инфинити канвас цвета бэкграунда. при этом если бэкграунд выключен, то инфинити канвас должен быть дизейбл. обнови наш контракт и потмо обнови приложение
- Task type: Shared runtime/template/contract correction followed by a signed generated-framework refresh and ordinary product delivery.
- User-visible result: Infinity canvas now fills the complete workspace viewport with the selected Background color. Turning Background off exits Infinity, restores the finite artboard, and disables the Infinity switch; turning Background back on restores availability without enabling Infinity.
- Source/reference checked: The running Dots Animation app at its saved local port, computed canvas viewport styles, the normalized Setup schema, canonical canvas reducers, settings transfer, persistence hydration, background preview/export helpers, runtime component and decision contracts, starter acceptance types, and protected Infinity browser evidence.
- Reference inputs: None; the request reports a concrete runtime behavior defect in the current application.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `decision-contract.md`, `core/runtime-boundary.md`, `core/control-selection.md`, `core/layout.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `assembly-workflow.md`, `component-rules.md`, `renderer-technique.md`, `schema-reference.md`, and `performance.md`; `acceptance-testing.md` is read immediately before final proof.
- Contract rules applied: `runtime-shell-required`, `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `panel-host-behavior`, `controls-product-coverage`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Unchanged `non-spatial`; the change corrects runtime backing and canonical mode availability without changing product camera or interaction ownership.
- Interaction ownership: `CanvasShell` owns the unbounded viewport background; the product renderer continues to suppress only its bounded finite background in Infinity mode. Runtime Setup and reducers own the Background prerequisite and finite fallback.
- Decision: Keep `appearance.background`, `export.includeBackground`, and runtime `canvas.mode` as the only state owners. Resolve the normalized Background pair in shared runtime code, apply its color to the complete runtime viewport, and enforce `Background off => finite` across control writes, reset, settings import, persistence hydration, and stale Infinity commands.
- Alternatives rejected: Stretching or enlarging the Dots renderer background would create a synthetic finite rectangle, contaminate scene bounds/export, and duplicate the fix in every app. Disabling only the visible switch would leave invalid imported or persisted state possible. A product-local copied-runtime patch would fork the signed framework.
- State/output mapping: `appearance.background` supplies the CanvasShell infinite viewport color; `export.includeBackground` controls finite preview/PNG semantics and gates Infinity; `canvas.mode` remains canonical and is normalized to finite whenever the standard Background pair is off. Video background and finite/infinite export crop rules remain unchanged.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Apps without the standard normalized Background pair intentionally keep existing theme workspace behavior and unrestricted Infinity availability; generated apps require a signed framework refresh to receive the new invariant.

### Performance iteration — Live Infinity background color

- Request: канвас все еще черный и еще и тормозит когда по цвету водишь, ты сделал то что я просил?
- Task type: Shared runtime color-value bug fix plus one bounded renderer responsiveness iteration in the current generated app.
- User-visible result: Moving across the Background color surface keeps the complete Infinity viewport on the live selected color, removes the Background help icon, and no longer makes the hidden finite-background path recompute Dots scene bounds or synchronously redraw the particle canvas.
- Source/reference checked: The supplied black-canvas screenshot, the running app at `http://127.0.0.1:3013/`, live DOM/computed-style state before and after a real color-surface click, `canvas-background-state.ts`, `CanvasShell`, Dots renderer selection/invalidation, and the current pipeline registration.
- Reference inputs: `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-3e1def2d-8bb5-4716-b316-f49ceb0907fa.png`.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `decision-contract.md`, `core/runtime-boundary.md`, `core/setup-export.md`, `core/media-upload.md`, `core/performance.md`, `component-rules.md`, `renderer-technique.md`, `schema-reference.md`, `acceptance-testing.md`, and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `infinity-canvas-scene-bounds`, `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: Unchanged `non-spatial`; this pass fixes the runtime backing and a two-dimensional renderer invalidation boundary.
- Interaction ownership: `CanvasShell` exclusively owns the visible Infinity background; Dots owns particles and finite product-background pixels but must remain cold for an Infinity-only background change.
- Decision: Normalize both supported runtime color value shapes (`string` and `{ hex }`) at the CanvasShell background boundary. In Dots, compare value records while ignoring only `appearance.background` when both previous and next canvas modes are Infinity; keep every finite, mode, timeline, canvas-size, palette, physics, and export invalidation intact.
- Alternatives rejected: Delaying the color picker until pointer release would violate live-control behavior; drawing an oversized product rectangle would duplicate runtime ownership and pollute scene bounds; reducing particles/render scale would lower selected quality; accepting only string values would contradict the runtime color-control contract.
- State/output mapping: Live color writes `appearance.background` as `{ hex }`; runtime resolves that value directly into the viewport style. The Dots canvas keeps its current transparent Infinity frame and particles, then immediately consumes the latest background again whenever finite mode is restored.
- Performance intent: performance-iteration
- Performance request evidence: "канвас все еще черный и еще и тормозит когда по цвету водишь, ты сделал то что я просил?"
- Performance paths: ["performance-path:%5B%22initial-render%22%2C%22initial-render%22%2C%5B%22dots.preview-frame%22%2C%22dots.shape-sample%22%5D%2C%5B%22main%22%5D%2C%5B%22particle-count%22%5D%5D","performance-path:%5B%22interactive-continuous%22%2C%22animation-frame%22%2C%5B%22dots.preview-frame%22%5D%2C%5B%22main%22%5D%2C%5B%22particle-count%22%5D%5D","performance-path:%5B%22interactive-continuous%22%2C%22control-drag%22%2C%5B%22dots.preview-frame%22%2C%22dots.shape-sample%22%5D%2C%5B%22main%22%5D%2C%5B%22particle-count%22%5D%5D","performance-path:%5B%22interactive-continuous%22%2C%22control-drag%22%2C%5B%22dots.preview-frame%22%5D%2C%5B%22main%22%5D%2C%5B%22particle-count%22%5D%5D","performance-path:%5B%22interactive-continuous%22%2C%22timeline-playback%22%2C%5B%22dots.preview-frame%22%5D%2C%5B%22main%22%5D%2C%5B%22particle-count%22%5D%5D","performance-path:%5B%22interactive-continuous%22%2C%22timeline-scrub%22%2C%5B%22dots.preview-frame%22%5D%2C%5B%22main%22%5D%2C%5B%22particle-count%22%5D%5D","performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22dots.preview-frame%22%2C%22dots.shape-sample%22%5D%2C%5B%22main%22%5D%2C%5B%22particle-count%22%5D%5D","performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22dots.preview-frame%22%5D%2C%5B%22main%22%5D%2C%5B%22particle-count%22%5D%5D"]
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: The pipeline path remains conservatively declared for finite Background changes, where the product renderer still owns background pixels; the Infinity specialization is enforced by renderer-state equality and focused browser proof.

### Ordinary delivery — Imported JSON settings as defaults

- Request: сделай эти настройки дефолтными
- Task type: Existing product schema-default, Reset, and initial-render update.
- User-visible result: Fresh workspaces and Reset now start with `Hi!`, 1800 outline particles, 23% edge spill, 4–11 px dots, zero glow, the supplied spectrum palette on `#CFBCB0`, and a 10-second runtime timeline. The other imported product values already matched and remain unchanged.
- Source/reference checked: `/Users/kusnizza/Downloads/dot-formation-settings (1).json`, the normalized app schema, renderer fallback reader, theme action mapping, runtime timeline initialization, persistence behavior, focused schema/timing tests, and current browser acceptance.
- Reference inputs: `/Users/kusnizza/Downloads/dot-formation-settings (1).json`.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/timeline-animation.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `schema-reference.md`, `component-rules.md`, and `decision-contract.md`; `acceptance-testing.md` and `performance.md` are read immediately before final proof.
- Contract rules applied: `timeline-enabled-behavior`, `controls-product-coverage`, `controls-section-inventory-required`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Unchanged `non-spatial`; the delivery changes authored defaults without changing canvas interaction.
- Interaction ownership: Existing built-in panel controls remain the sole owners of product values, the runtime timeline remains the sole transport and global-duration owner, and runtime canvas mode remains workspace state.
- Decision: Promote every stable product value in the supplied settings file to the existing schema defaults and matching renderer fallbacks. Preserve the file's 10-second runtime timeline as the initial global speed scale while keeping the existing 4-second Active and 1-second Calm phase design; moving either timing slider continues to synchronize runtime duration to their sum.
- Alternatives rejected: Importing the JSON automatically on mount would create a second state owner and overwrite persisted work; bumping persistence would discard the user's current workspace; treating playhead position, pause state, panel expansion, or Infinity mode as authored product defaults would convert transient workspace state into forced product behavior.
- State/output mapping: Schema `defaultValue` owns fresh values and Reset; the Spectrum theme action resolves to the same palette/background pair; renderer fallbacks match the new schema values; the performance envelope uses the same 1800-particle baseline; runtime persistence continues restoring existing `values`, `canvas`, `panels`, and `timeline` slices.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Existing persisted work intentionally keeps its saved values until Reset or a fresh workspace. The default 10-second timeline globally stretches the 4+1 phase design until either timing slider is edited, which then intentionally resynchronizes the timeline duration to the new Active+Calm sum.

### Ordinary delivery — Default Resolution scale 2

- Request: `у приложение dot-animations scale по дефолту должен быть 2. поправь сразу в продакшене`
- Task type: Existing product schema-default and Reset update followed by production deployment.
- User-visible result: Fresh workspaces and Reset use Resolution scale 2; existing explicitly persisted values remain intact.
- Source/reference checked: App schema, focused schema test, resolved runtime Setup behavior, persistence behavior, the reference-parity browser acceptance baseline, and local Toolcraft contracts; no external reference input.
- Reference inputs: None; the request specifies the existing product default directly.
- Docs/contracts read: `docs/toolcraft/workflow.md`, `core/control-selection.md`, `core/layout.md`, `schema-reference.md`, and `component-rules.md`; `acceptance-testing.md` is read immediately before final proof.
- Contract rules applied: `controls-product-coverage`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Unchanged `non-spatial`; the delivery changes only the runtime-owned resolution default and does not alter canvas interaction.
- Interaction ownership: Runtime Setup remains the sole owner of `canvas.renderScale`; no duplicate product control is introduced.
- Decision: Change only app-local `canvas.renderScale.defaultValue` from 1 to 2, preserving enabled/range/step; persisted explicit values remain authoritative.
- Alternatives rejected: Changing the shared runtime default would have a cross-app blast radius; migrating or clearing persistence would overwrite user choice.
- State/output mapping: The schema default feeds fresh and Reset `canvas.renderScale`; runtime applies it to Canvas 2D backing pixels without changing CSS canvas size.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Fresh/reset backing pixels use the existing supported maximum and therefore more memory/fill work than scale 1, with no change to the allowed envelope.

### Ordinary delivery — Infinity canvas enabled by default

- Request: `сделай здесь по дефолту включенный инфинит канвас` for the public Particle Typography demo.
- Task type: Existing product default with a signed upstream runtime update.
- User-visible result: Fresh workspaces and Reset use infinite canvas; the built-in toggle and saved choices remain available.
- Source/reference checked: App schema, runtime initialization/reset, persistence, existing Infinity browser coverage, and upstream commit `2dafc9b7` on matching framework baseline `0da02805`.
- Reference inputs: https://particle-typography-pixelpoint.vercel.app/demos/particle-typography and the explicit requested default.
- Docs/contracts read: workflow.md, core/control-selection.md, core/layout.md, schema-reference.md, component-rules.md, acceptance-testing.md, and source/app AGENTS.md.
- Contract rules applied: runtime-shell-required, infinity-canvas-scene-bounds, persistence-policy-explicit, controls-product-coverage, workflow-required.
- View interaction intent: Existing non-spatial particle typography.
- Interaction ownership: Runtime Setup owns the Infinity switch; runtime canvas owns mode, persistence, and Reset.
- Decision: Regenerate the matching framework with existing upstream default-mode support, then declare canvas.sizing.defaultMode as infinite.
- Alternatives rejected: Patching copied runtime files would fork the signed framework; forcing a command on mount or clearing persistence would overwrite saved user choices; upgrading unrelated runtime features would expand this change.
- State/output mapping: The schema default initializes canvas.mode and Reset. Background normalization can still restore finite mode, and persisted finite mode remains authoritative on reload.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Previously saved finite workspaces remain finite until the user enables Infinity or resets controls.

## Evidence

- Source reviewed: `src/app/app-schema.ts`, `src/app/app-composition.tsx`, `src/app/app-verification-impact.json`, all product modules under `src/app/dots`, and the current Toolcraft runtime scene-bounds, canvas, persistence, and export contracts.
- Contract applied: The generated runtime was refreshed from the current monorepo starter instead of editing protected copied framework files. Product source identity was checked before and after the refresh. The starter verification inventory now ignores `.agents` while continuing to hash product source, tests, configuration, public resources, and signed contract inputs.
- Evidence: Unit tests cover finite/current/full-cycle bounds, viewport-only render-state equality, schema capability, inventory, and persistence slices. Browser tests cover mode switching, pan, reload, off/undo/redo restoration, decoded finite/Infinity still dimensions, ffprobe finite/Infinity video dimensions and duration, bounded 4K video-export responsiveness with worker-side frame rendering, and zero product-pass invalidation during viewport drag and zoom.

## Verification

First product delivery uses one bare `npm run verify:delivery` for full functional acceptance and one bounded production-build prototype smoke.

Ordinary delivery uses the same bare `npm run verify:delivery`; exact ownership in `src/app/app-verification-impact.json` derives only the required current-source proof.

A performance complaint authorizes one request-backed targeted iteration through the same delivery command. It does not authorize the complete matrix.

A full audit is separate and runs only after an explicit operator request or accepted offer through `npm run verify:perf`.

Protected receipts, not this worklog, own selectors, executed checks, measurements, and pass/fail evidence.

## Risks

- Risk: A font blocked by the network can use compatible fallback metrics, but the renderer and scene bounds rebuild after the requested face becomes ready.
- Risk: MP4 recording is not available in every Chromium build; the exporter falls back to WebM while preserving truthful MIME type, extension, dimensions, and duration.
- Risk: Infinity video uses the exact 30 fps full-cycle sampling envelope; a future exporter frame-rate change must update the shared scene-bounds cadence.


## 2026-08-05 — Canonical product identity and deployment path

- User-visible result: Renamed the standalone product to `Particle Typography` and aligned its repository package plus public demo base to `particle-typography`. Product rendering, controls, defaults, and export behavior remain unchanged.
- Request: Apply the approved complete rename across code, folders, gallery identity, and deployment wiring without preserving old route aliases.
- Source/reference checked: The approved complete-app-renaming design and implementation plan, the current standalone package metadata, Vite/router base handling, `vercel.json`, identity metadata, and active acceptance/deployment assertions.
- Contract rules applied: Broad identity/deployment migration because the directory and public deployment identity change across the generated app boundary. Existing product-domain modules remain semantically named; the external Vercel stage must retain the current Project ID.
- State/output mapping: Package name, HTML title, control/acceptance identity, persistence/settings-transfer namespace where present, Vite base, public asset prefix, and Vercel rewrites now use `particle-typography`. Changed persistence namespaces intentionally reset prior browser-local settings.
- Verification: Canonical package/title/base audit and every available standalone `demo-deployment.test.mjs` passed for this migration batch.
- Risks: Old demo paths are intentionally absent; no compatibility redirect is retained.
