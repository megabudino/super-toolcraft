# Implementation Worklog

## Status

Mode: product

Product: Micrographics Poster Generator

Verification tier: Tier 3

Reason: Iteration 26 completes multi-selection with a Figma-style group frame — one bounding box with corner handles that scales every selected element proportionally around the opposite corner.

## Decision Trail

### Iteration 1 — Generative micrographics poster editor

- Request: Build a full generative micrographics poster editor from the supplied Figma corpus and poster references, with presets, full random mode, sliders, editable typography, direct placement/move/resize, source imagery, and export.
- Task type: Tier 4 fresh product delivery.
- User-visible result: The neutral starter is now a deterministic vector poster generator with twenty distinct grammar presets, a full-random composition mode, one-to-eight clusters, region/angle/scale/jitter/detail/stroke controls, editable headline and caption, an atomic typography editor, two ink channels, source-image transforms, direct canvas placement/move/resize, persistence, and PNG/JPG export at 2K/4K/8K.
- Source/reference checked: The supplied Figma file `R8Vi0MmfS4uDenmN0NCG3d` and its 104 linked layout nodes; the ten supplied poster screenshots; Swiss International Style reference material from the Swiss National Library; and the NASA Graphics Standards Manual.
- Reference inputs: Figma `https://www.figma.com/design/R8Vi0MmfS4uDenmN0NCG3d/Micrographics-Templates--Design-Layouts--Community-`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-3a51d00b-cda7-4da9-9b2a-3b368e83ce84.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-932a05fe-ef87-4e8f-a1a6-67cc8f69a233.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-ea6507d2-f93a-483d-9f9d-48579a8f15b9.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-2b902122-6b3c-490e-a957-4186d811d23d.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-09f38236-d664-4ec3-b5e8-6f6a4c5a9014.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-57fc7328-9470-46d7-bf02-af6ce76b2c4a.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-2042bf23-fcb5-4200-bf17-b3dc5da681b7.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-75b3c647-0ef0-40bd-b386-b057dc4594be.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-d4791116-16e4-4db2-b964-a7c57ea6cf6a.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-54780edd-cdf4-4437-b28d-c8c90c831c3e.png`.
- Docs/contracts read: `docs/toolcraft/workflow.md`; `core/runtime-boundary.md`; `core/setup-export.md`; `core/control-selection.md`; `core/layout.md`; `core/media-upload.md`; `core/performance.md`; `assembly-workflow.md`; `schema-reference.md`; `component-rules.md`; `acceptance-testing.md`; `performance.md`; `renderer-technique.md`; and the brainstorming, Figma design-to-code, writing-plans, systematic-debugging, and browser workflow skills.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `canvas-handle-placement`, `interaction-surface-ownership`, `controls-product-coverage`, `output-export-required`, `controls-section-inventory-required`, `renderer-technique-inventory`, `renderer-view-interaction`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `non-spatial`; the output is a flat 2D poster. Canvas gestures own cluster selection, placement, movement, and resizing, while panel controls own exact text, typography, preset, color, and serialized layout properties.
- Interaction ownership: Canvas owns draw-region placement, selection, movement, resizing, and text selection; the panel owns presets, deterministic generation, exact typography, ink, media, background, and export.
- Decision: Distill the 104 Figma references into twenty reusable generative grammar families rather than ship 104 brittle static copies. Each family composes semantic native SVG geometry from the same deterministic state model, so sliders and randomization can recombine the visual language while preserving editability.
- Alternatives rejected: Bitmap thumbnails as final output, remote design assets, 104 fixed screenshots, app UI rendered inside `canvasContent`, mirrored X/Y/width/height panel controls, animation/timeline without a motion requirement, product layers for a single composited output, and WebGL for a bounded vector scene.
- State/output mapping: Schema values feed `buildPosterScene`; the canonical `poster-scene` pipeline produces batched SVG paths and text; source media is read from runtime media state; canvas gestures write `composition.placements`; the same scene model feeds Canvas 2D export; persistence stores values, canvas, panels, and media.
- Files changed: Product schema, composition, preset catalog, model, renderer pipeline, SVG canvas, local CSS module, export module, acceptance data/tests, performance config/impact/adapters/kernel benchmark, and this worklog.
- Performance intent: ordinary-product-work
- Verification: `npm run ai:check` passed; all 57 app Vitest files and 305 tests passed; `npm run typecheck` passed; all seven product browser scenarios passed together; PNG/JPG dimensions, alpha semantics, media lifecycle, placement/resize, handle exclusion, and reload persistence were decoded or observed in the real UI; the current-source protected renderer kernel passed in 215 ms. `npm run verify:delivery` passed with prototype receipt version 4, all 116 functional browser tests, and protected development-fixture responsiveness smoke for source `a238050df30d0a25881d38bffc994b521b33a3abd80504935d8fcc73aa01efd4`.
- Skipped checks: The operator-only complete performance certification was not requested. Prototype smoke is the lifecycle-appropriate bounded proof for this first product delivery.
- Risks: Figma inspection reached the service plan rate limit after the linked corpus had established the recurring grammar families, typography, colors, and composition rules; the twenty presets are generative abstractions of the corpus rather than pixel-identical static copies of every frame. Third-party web fonts remain subject to browser font availability and fall back to sans-serif.

### Iteration 2 — Photo-first micrographic template generator

- Request: "мне не нравится как работает генератор и какое качество графики он дает. я хочу сделать генератор постеров микрографики. На текущую реализацию я бы не ориентировался в плане визуальных элементов" plus a 65-second interface recording of the MICROGRAPH editor, six poster references, and the Figma micrographics corpus as element vocabulary. Approved scope: generator plus manual canvas refinement, photo as the primary base, the full template set in v1, and complete removal of the old preset generation.
- Task type: Tier 4 full product rebuild (redesign explicitly requested; not a reference-runtime clone).
- User-visible result: The app now opens a photograph, generates a deterministic micrographic overlay from twenty-two parametric template grammars (caption, spec sheet, data table, barcode, big number, coords, run state, brackets, hatch, ruler, target, QR code, globe, waveform, dimension, checklist, sequence, reg mark, graph, timecode, radar, address), and lets the user refine it: seed, element count, template kit, global scale and opacity, two-tone ink system with light/dark/mix modes, direct canvas select/move/resize/delete, serialized layout editing, shuffle and reset-layout commands, background control, and 2K/4K/8K PNG/JPG export.
- Source/reference checked: The uploaded MICROGRAPH interface video (65 one-second extracted frames, eight contact sheets, and full-resolution panel crops), the six supplied poster references, and sampled Figma corpus nodes (element boards, glyphs, and composed lockups) from `R8Vi0MmfS4uDenmN0NCG3d`.
- Reference inputs: `Video 2078113090722308097.mp4` (uploaded recording); Figma `https://www.figma.com/design/R8Vi0MmfS4uDenmN0NCG3d/Micrographics-Templates--Design-Layouts--Community-`; six pasted poster reference images.
- Docs/contracts read: `docs/toolcraft/workflow.md`; `core/reference-study.md`; `core/runtime-boundary.md`; `assembly-workflow.md`; `core/control-selection.md`; `core/layout.md`; `core/setup-export.md`; `core/media-upload.md`; `core/performance.md`; `schema-reference.md`; `decision-contract.md`; `component-rules.md`; `renderer-technique.md`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `canvas-handle-placement`, `interaction-surface-ownership`, `controls-product-coverage`, `output-export-required`, `controls-section-inventory-required`, `renderer-technique-inventory`, `renderer-view-interaction`, `video-reference-analysis`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: `non-spatial`; the output is a flat 2D poster over a photograph with no 3D scene.
- Interaction ownership: Canvas owns element selection, movement, corner-handle resizing, and Delete-key removal; the panel owns generation parameters, template kit, ink system, exact serialized layout/content data, media, background, and export.
- Decision: Replace freeform preset clusters with a fixed grammar of twenty-two rect-bound template renderers driven by a shared multiline `key | value` content model (with `---` dividers) exactly as the reference editor structures element content. Elements are generated by a seeded layout engine (hero-first placement, margin bands, overlap-minimizing rejection sampling) and serialized wholesale into `composition.layout` the moment the user edits, so gestures and precise JSON stay one source of truth.
- Alternatives rejected: Cloning the manual brush-stamping editor UI (user chose generator-first), per-element panel property editing bound to a selection target (deferred; selection stays canvas-local and exact edits go through Layout Data), mirrored X/Y/width/height panel fields, fontPicker typography (the reference uses a fixed mono/sans technical type system scaled by rect), accent color channel (the reference grammar is strictly two-tone), keeping the twenty legacy presets alongside the new grammar, and non-uniform scale transforms of cluster innards (each template now re-lays out its grammar at the element's actual pixel rect).
- State/output mapping: Schema values (`composition.seed/count/kit`, `elements.scale/opacity`, `ink.mode/light/dark`, `appearance.background`, `export.includeBackground`) feed `generateElements` and `buildPosterScene`; authored `composition.layout` JSON overrides generated elements by index; the canonical `poster-scene` pass builds per-element primitives via `buildTemplatePrimitives`; canvas gestures rewrite `composition.layout` through `controls.setValue`; the same scene model feeds the Canvas 2D `export-png` pass; persistence stores values, canvas, media, and panels under a v2 key.
- Files changed: `src/app/template-catalog.ts` (new), `src/app/template-renderers.ts` (new), `src/app/poster-types.ts`, `src/app/poster-model.ts`, `src/app/app-schema.ts`, `src/app/renderer-pipeline.ts`, `src/app/micrographics-canvas.tsx`, `src/app/micrographics-canvas.module.css`, `src/app/poster-export.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-performance.ts`, `src/app/app-performance-impact.json`, `src/app/app-schema.test.ts`, `src/app/micrographics-generator.test.ts`, `e2e/app-canvas.spec.ts`, `e2e/app-controls.spec.ts`, `e2e/app-media-export.spec.ts`, `e2e/app-performance-path-adapters.ts`, `e2e/app-kernel-benchmarks.ts`; removed `src/app/preset-catalog.ts`.
- Performance intent: ordinary-product-work
- Verification: `node scripts/check-toolcraft-code-health.mjs`, `node scripts/toolcraft-product-boundary.mjs --allow-missing-compiler`, `node scripts/check-toolcraft-docs.mjs`, `node scripts/check-toolcraft-integrity.mjs`, `node --test scripts/*.test.mjs` (264 tests), and `npm run typecheck` all passed in the working sandbox. The protected `npm run verify:delivery` gate and `npm run dev` must run on the host machine because the sandbox npm registry blocks the platform-specific Vitest/Playwright binaries.
- Skipped checks: The operator-only complete performance certification was not requested for this batch; browser acceptance evidence for the rebuild is recorded in the host-machine delivery run above.
- Risks: Template content is intentionally regenerated rather than pixel-copied from the reference video; per-element property panel editing (tone/opacity/content of the selected element without JSON) is deferred to a follow-up; seed changes do not restyle manually authored elements because authored layout data is authoritative by design.

### Iteration 3 — Inline canvas content editing

- Request: "я хочу редактирование контента делать на канвасе, сейчас поле json какое-то странное" — element content should be edited directly on the canvas; the Layout JSON field felt wrong as the primary editing surface.
- Task type: Tier 3 canvas-interaction batch (canvas editing overlay, schema section reorder, acceptance and browser coverage updates).
- User-visible result: Double-clicking an element (or pressing Enter with a selection) opens an in-place mono editor over its rect; typed `key | value` lines update the rendered template live and close on Escape, blur, or clicking elsewhere. The Layout Data JSON section moved to the bottom of the panel as an advanced surface; everyday content editing now happens on the canvas.
- Source/reference checked: The MICROGRAPH video's selected-element CONTENT editor behavior (storyboard frame `content-editor`) and the explicit user request.
- Reference inputs: The iteration 2 reference recording study; no new external references.
- View interaction intent: `non-spatial`; in-place content editing stays a flat 2D canvas overlay of the selected element.
- Docs/contracts read: Routed docs from iteration 2 remain current for this surface (`core/runtime-boundary.md`, `core/control-selection.md`, `component-rules.md`, `acceptance-testing.md`); no new routes were triggered.
- Contract rules applied: `canvas-no-app-ui` (the editor is a transient product-text editing overlay in the excluded-from-export handles layer, not persistent app chrome), `interaction-surface-ownership`, `canvas-handle-placement`, `acceptance-product-observable`, `workflow-required`.
- Interaction ownership: New `canvas-content-edit` entry — canvas owns in-place content editing (user-request evidence); the Layout Data panel field remains the precise structured-data surface without duplicating the in-place editor.
- Decision: Render the editor as a transient `foreignObject` textarea inside the handles layer, keyed by element id, writing live through `controls.setValue` with one history merge group per editing session. It never appears in export and exists only while editing.
- Alternatives rejected: A panel-bound selected-element content field (duplicates the requested canvas surface), contentEditable SVG text (fragile multiline editing), and committing only on blur (the reference updates content live).
- State/output mapping: The editor mutates the selected element's `content` inside the serialized `composition.layout` value; `buildPosterScene` re-renders the template from the new content on every keystroke through the existing `poster-scene` pass.
- Files changed: `src/app/micrographics-canvas.tsx`, `src/app/micrographics-canvas.module.css`, `src/app/app-schema.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance-data.ts`, `e2e/app-canvas.spec.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, framework script tests). Exact targeted proof runs through `npm run verify:delivery` on the host machine together with the iteration 2 rebuild, since both batches land in the same delivery.
- Skipped checks: No performance-path changes — the editor writes the already-covered `composition.layout` target; no new workload dimension or pass.
- Risks: The transient textarea is DOM inside `canvasContent`; it exists only during editing and is excluded from export, but a future strict canvas-UI audit running mid-edit would see it. Empty content falls back to the template's default sample text.

### Iteration 4 — Template library with draw-region stamping

- Request: "я хочу расширить количество темплейтов, чтобы мы могли выбирать шаблоны как в видео референсе" — the user wants to choose templates from a visible palette and stamp them, matching the reference editor's TEMPLATES panel.
- Task type: Tier 3 batch (new schema section, canvas placement gesture, generated thumbnails, acceptance and browser coverage).
- User-visible result: A Template Library section shows all twenty-two templates as generated thumbnails (real template grammar rendered to inline SVG). Choosing a tile and pressing Place switches the canvas to crosshair draw-a-region mode; the drawn rect receives the selected template with deterministic generated content, becomes selected, and is immediately movable, resizable, and editable in place.
- Source/reference checked: The MICROGRAPH video's brush workflow (storyboard frames `templates-panel`, `place-big-number`; transition `stamp-creates-element`).
- Reference inputs: The iteration 2 reference recording study; no new external references.
- View interaction intent: `non-spatial`; template stamping is a direct 2D draw-region gesture on the poster.
- Docs/contracts read: Iteration 2 routed docs remain current (`core/control-selection.md` image picker fit, `core/runtime-boundary.md` canvas boundary, `component-rules.md`, `acceptance-testing.md`).
- Contract rules applied: `canvas-no-app-ui` (the palette lives in the panel; only the textless placement preview rect appears on canvas), `interaction-surface-ownership`, `controls-section-inventory-required`, `acceptance-product-observable`, `workflow-required`.
- Interaction ownership: New `panel-template-selection` entry — the panel owns structured template choice (reference evidence); the canvas owns the stamping gesture through the existing transform ownership.
- Decision: Reuse the proven one-shot command pattern: the Place action arms `library.commands`, the canvas draws a dashed preview region, and pointer-up appends one serialized element with seeded content, then clears the command. Thumbnails are generated from the real template renderers at build time, so the palette always matches actual output.
- Alternatives rejected: Stamping armed by mere tile selection (would hijack canvas panning until disarmed), a canvas-rendered palette (app UI in product output), static hand-drawn thumbnails (drift from real grammar), and auto-inserting at a free spot without a drawn region (loses the reference's size-as-you-place control).
- State/output mapping: `library.template` selects the grammar; `library.commands` arms placement; the drawn rect plus deterministic seed produce content via `generateTemplateContent`; the element is appended to `composition.layout` and rendered by the existing `poster-scene` pass.
- Files changed: `src/app/template-thumbnails.ts` (new), `src/app/element-svg.tsx` (new, split from the canvas module to honor the line budget), `src/app/app-schema.ts`, `src/app/micrographics-canvas.tsx`, `src/app/micrographics-canvas.module.css`, `src/app/app-acceptance-data.ts`, `src/app/app-schema.test.ts`, `src/app/app-performance-impact.json`, `e2e/app-canvas.spec.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, framework script tests); thumbnail generation verified by rendering all twenty-two data URIs. Exact targeted proof runs through `npm run verify:delivery` on the host machine together with the recorded delivery batch.
- Skipped checks: No performance-path changes — placement writes the already-covered `composition.layout` target and adds no workload dimension.
- Risks: Twenty-two thumbnail data URIs add a bounded one-time schema cost; stamping many elements can exceed the generator's non-overlap intent since manual placement is intentionally unconstrained.

### Iteration 5 — Working Place command, WYSIWYG text editing, Layout JSON removal

- Request: "темплейты не добавляются на канвас. я хочу чтобы редактирование было без смены дизайна а я просто щелкал по текстовому полю и оно редактировалось. layout json вообще смысла не имеет редактирование текса давай на канвасе делать" — the Place command did nothing, text editing must be in-place WYSIWYG, and the Layout JSON field should be removed.
- Task type: Tier 3 batch (panel-action bug fix, canvas text-editing interaction, schema section removal, acceptance and browser coverage updates).
- User-visible result: Place now works — section actions route through `onPanelAction`, and the missing `place-element` case arms the draw-region mode. Clicking a text line of the selected element replaces exactly that line with an identically styled input (same font, size, weight, spacing, alignment, ink), typing updates the design live, Enter/blur commits, Escape reverts. The Layout Data JSON section is gone; manually edited layouts are now authoritative for element count, so placed elements always render and deleted elements stay deleted.
- Source/reference checked: The MICROGRAPH video's in-place selected-element content editing; the user's explicit requests.
- Reference inputs: The iteration 2 reference recording study; no new external references.
- View interaction intent: `non-spatial`; WYSIWYG text editing happens directly on the flat 2D poster.
- Docs/contracts read: Iteration 2 routed docs remain current; validator constraints for non-control targets confirmed in `acceptance/canvas-handle-acceptance.ts`, `acceptance/interaction-targets.ts`, and `acceptance/interaction-ownership.ts`.
- Contract rules applied: `canvas-no-app-ui` (the transient identically styled input is product-text editing in the excluded-from-export handles layer), `interaction-surface-ownership`, `acceptance-product-observable`, `workflow-required`.
- Interaction ownership: `canvas-content-edit` and `canvas-element-transform` now record the `controls.setValue` editor command as their write channel since the serialized layout is no longer a panel control; the `panel-layout-data` entry was removed with its surface.
- Decision: Text primitives map back to content cells by exact cell match with occurrence counting (plus whole-line joins), so no per-template provenance plumbing is needed; edits write through `setContentCell` into the serialized element content. The bug root cause: `actions` control clicks dispatch through `onPanelAction`, which lacked a `place-element` case.
- Alternatives rejected: Keeping Layout JSON as an advanced section (user rejected it), a floating multiline textarea editor (breaks the design while editing — replaced), contentEditable SVG text (fragile multiline/IME behavior), and per-template text provenance metadata (heavier for the same observable behavior).
- State/output mapping: Place writes `library.commands` through the panel-action handler; the drawn region appends a serialized element; text edits rewrite one content cell of one element inside `composition.layout` (a runtime value without a panel control), re-rendered live by the `poster-scene` pass; authored layouts own element count until Shuffle or Reset layout clears them.
- Files changed: `src/app/poster-export.ts`, `src/app/poster-model.ts`, `src/app/element-svg.tsx`, `src/app/micrographics-canvas.tsx`, `src/app/micrographics-canvas.module.css`, `src/app/app-schema.ts`, `src/app/app-schema.test.ts`, `src/app/micrographics-generator.test.ts`, `src/app/app-acceptance-data.ts`, `e2e/app-canvas.spec.ts`, `e2e/app-controls.spec.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, framework script tests). Exact targeted proof runs through `npm run verify:delivery` on the host machine with the recorded delivery batch.
- Skipped checks: No performance-path changes — the same `poster-scene` pass renders every edit; no new workload dimension.
- Risks: Cell matching by string can pick the wrong cell when several cells contain identical text and render order differs from content order; occurrence counting covers the common cases. Once a layout is manually edited, the Elements count slider is intentionally inert until Shuffle or Reset layout.

### Iteration 6 — Sixteen additional template grammars

- Request: "создай еще больше микрографики темплейтов. ты можешь искать варианты и примеры микрографики в интернете" — expand the template library, researching micrographic vocabulary online.
- Task type: Tier 3 batch (new template renderers, catalog/kit expansion, thumbnails, tests).
- User-visible result: The Template Library grows from twenty-two to thirty-eight grammars. New: starburst, manifest (arrow rows), pill badge, cross grid (registration crosses), dot matrix, binary rows, progress bar, signal bars, dial gauge, orbit diagram, lens ribs, footer line lockup, pagination, schematic nodes, layered stack, and ear tag. All are generated, placeable, kit-filtered, thumbnailed, and in-place editable like the original set.
- Source/reference checked: Web research on the 2026 micro-industrial vocabulary (barcodes, batch codes, regulatory marks, dielines, ear tags, HUD crosshairs, registration marks) via Inky Design Works, Open All Hours, GraphicRiver HUD packs, and micrographics asset packs; the reference video's LIBRARY tab; the Figma corpus glyphs (starburst, hemispheres, numbered lockups, footer compositions).
- Reference inputs: Web imagery of industrial micrographic vocabulary named above; the iteration 2 reference recording study and Figma corpus.
- View interaction intent: `non-spatial`; the new grammars render on the same flat 2D poster surface.
- Interaction ownership: Unchanged — the panel owns template browsing while the canvas owns placement, transforms, and in-place editing.
- Docs/contracts read: Iteration 2 routed docs remain current for this surface.
- Contract rules applied: `acceptance-product-observable`, `controls-product-coverage` (option coverage tracks all thirty-eight tiles), `performance-coverage-levels` (bounded per-element primitive counts; element count remains the single workload dimension), `workflow-required`.
- Decision: New builders live in `template-renderers-extra.ts` with shared drawing helpers extracted to `template-primitives.ts`, honoring the module line budget; the registry merges both sets so catalog, thumbnails, generator, and kits stay single-source.
- Alternatives rejected: Bitmap/sticker assets (drift from the parametric grammar), unbounded per-template detail (workload envelope stays element-count-driven), and rotated/vertical text primitives (no rotation support in the primitive model yet).
- State/output mapping: Unchanged — new templates flow through the same catalog, content generator, `poster-scene` pass, thumbnails, and placement path.
- Files changed: `src/app/template-primitives.ts` (new), `src/app/template-renderers-extra.ts` (new), `src/app/template-renderers.ts`, `src/app/template-catalog.ts`, `src/app/poster-model.ts`, `src/app/micrographics-generator.test.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-performance-impact.json`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity); all sixteen new grammars visually verified through the cairo raster harness at template rects. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No performance-path changes beyond bounded new primitive sets within the existing envelope.
- Risks: The thirty-eight-tile placement loop lengthens the placement browser test; new primitive counts stay bounded per template but dense grids (cross grid, dot matrix, binary) raise the average per-element cost slightly.

### Iteration 7 — One-shot click and drag template placement

- Request: "убери бордер с канваса. почему не работает секция template. я хочу чтобы работал драг дроп на канвас а также я выбрал тип темплейта, коикнул на канвас, он вставляется в нужное место. после этого у нас никакой темплейт не выбран".
- Task type: Tier 3 renderer/canvas interaction batch.
- User-visible result: The poster canvas has no product border, outline, or shadow. Template tiles are real draggable controls. Clicking a tile arms one-shot placement; clicking the poster inserts an aspect-aware instance centered at that coordinate. Dragging a tile onto the poster inserts it at the drop coordinate. The existing draw-a-region gesture remains available, and every successful click, drop, or region placement clears the active template while selecting the newly inserted element.
- Source/reference checked: The current running app, the user's explicit interaction request, and the MICROGRAPH template-brush behavior already documented from the uploaded reference recording.
- Reference inputs: Existing MICROGRAPH recording study and the user's direct click/drop interaction specification; no new external visual references.
- Docs/contracts read: `docs/toolcraft/workflow.md`; `docs/toolcraft/decision-contract.md`; `docs/toolcraft/core/runtime-boundary.md`; `docs/toolcraft/core/control-selection.md`; `docs/toolcraft/core/layout.md`; `docs/toolcraft/core/performance.md`; `docs/toolcraft/custom-controls.md`; `docs/toolcraft/component-rules.md`; `docs/toolcraft/schema-reference.md`; `docs/toolcraft/renderer-technique.md`; `docs/toolcraft/acceptance-testing.md`; `docs/toolcraft/performance.md`; and the systematic-debugging, brainstorming, writing-plans, and browser-control skills.
- Contract rules applied: `canvas-no-app-ui`, `canvas-handle-placement`, `interaction-surface-ownership`, `controls-product-coverage`, `controls-section-inventory-required`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `non-spatial`; the poster remains a flat 2D authored surface, with template placement owned by canvas coordinates.
- Interaction ownership: The panel owns template browsing and one-shot arming through `library.template`; the canvas owns the insertion point/region. These are complementary stages of one workflow, not mirrored placement controls.
- Decision: Replace the passive image-picker/Place-action pair with a focused custom template-library renderer built from Toolcraft `Field`, `ControlFieldLabel`, and `Button` primitives. Use a single transient `library.template` value as both armed click state and HTML drag payload, and clear it immediately after a successful placement.
- Alternatives rejected: Keeping the separate Place button (the source of the broken two-state lifecycle), permanent template selection (causes accidental repeated stamps), canvas-rendered palette UI, native images as the only drag source, and a fixed-size insert that ignores each template's aspect ratio.
- State/output mapping: A tile click writes `library.template`; a tile drag writes the same value plus the `application/x-toolcraft-micrographics-template` payload. Canvas pointer/drop coordinates create a deterministic serialized element in `composition.layout`; the command then writes `library.template = ""`; the canonical `poster-scene` pass and export renderer consume the new layout.
- Files changed: `src/app/template-placement.ts`, `src/app/template-library-control.tsx`, `src/app/template-library-control.module.css`, `src/app/micrographics-canvas-utils.ts`, `src/app/app-schema.ts`, `src/app/app-composition.tsx`, `src/app/micrographics-canvas.tsx`, `src/app/micrographics-canvas.module.css`, `src/app/app-acceptance-data.ts`, `src/app/app-performance-impact.json`, `src/app/app-schema.test.ts`, `src/app/micrographics-generator.test.ts`, `e2e/app-canvas.spec.ts`, `e2e/app-performance-path-adapters.ts`, `e2e/micrographics-browser-helpers.ts`, the iteration spec/plan, and this worklog.
- Performance intent: ordinary-product-work
- Verification: `npm run ai:check`, targeted schema/generator Vitest, targeted acceptance validators, `npm run typecheck`, and the protected targeted browser scenario passed during development. Targeted delivery exposed that the range input publishes native `min`/`max` rather than `aria-valuemin`/`aria-valuemax`; the real pointer-drag helper now reads either semantic source, and each compiled fixture also starts after a real Reset controls action. Final delivery reruns the exact impacted functional and canonical performance selectors through `npm run verify:delivery` on the host machine.
- Skipped checks: The separate operator-only full performance audit is not requested; template placement stays inside the existing bounded element-count workload and canonical poster scene.
- Risks: HTML drag-and-drop behavior can vary on touch-only browsers; touch users still have the equivalent one-shot tile-click plus canvas-tap path.

### Iteration 8 — Clear runtime canvas highlight after template drop

- Request: "после перетаскивания остается выделение всего канваса".
- Task type: Tier 3 canvas interaction bug fix.
- User-visible result: Dropping a template still inserts and selects the new micrographic element, but the translucent full-canvas upload highlight now clears immediately instead of remaining over the poster.
- Source/reference checked: The running Micrographics app; the failing Playwright reproduction; `src/toolcraft/runtime/react/canvas/canvas-shell.tsx` event flow; and the product SVG drag handlers.
- Reference inputs: None; this is a regression report against the current local application.
- Docs/contracts read: `docs/toolcraft/workflow.md`; `docs/toolcraft/decision-contract.md`; `docs/toolcraft/core/runtime-boundary.md`; `docs/toolcraft/core/performance.md`; `docs/toolcraft/component-rules.md`; `docs/toolcraft/renderer-technique.md`; `docs/toolcraft/acceptance-testing.md`; `docs/toolcraft/performance.md`; and the systematic-debugging, writing-plans, and browser-control skills.
- Contract rules applied: `canvas-surface-preserved`, `canvas-no-app-ui`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `non-spatial`; template drop remains a direct 2D canvas insertion workflow.
- Interaction ownership: The product SVG owns template MIME drag events; the outer Toolcraft canvas retains ownership of unrelated file/media drags.
- Decision: Stop propagation of `dragenter` and `dragover` only when `DataTransfer.types` contains `application/x-toolcraft-micrographics-template`. The outer upload shell therefore never enters its full-canvas drag-over state for an internal template drag.
- Alternatives rejected: Editing the signed CanvasShell runtime, globally disabling canvas upload, clearing the runtime DOM attribute manually, and suppressing all drag events (which would break source-photo drops).
- State/output mapping: Template `dragenter`/`dragover` stays inside the product SVG; template `drop` appends `composition.layout` and clears `library.template`; unrelated drag payloads continue to bubble to the runtime media importer.
- Files changed: `src/app/micrographics-canvas.tsx`, `e2e/app-canvas.spec.ts`, `docs/superpowers/plans/2026-07-23-template-drag-highlight-fix.md`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: The new browser assertion reproduced the runtime canvas `data-drag-over="true"` state and then passed after the MIME-scoped `dragenter`/`dragover` boundary fix. Final delivery runs targeted unit/type checks, the exact direct-placement browser test, and impact-derived protected verification through `npm run verify:delivery` on the host machine.
- Skipped checks: Full performance certification is not requested; the fix changes event propagation only and does not change renderer work, workload boundaries, or output quality.
- Risks: None for known paths; the MIME guard deliberately leaves unrelated media drag events untouched.

### Iteration 7 — Figma-style selection, snapping, and distance measurement

- Request: "сделай фигма подобные выделения объектов по размеру, цветам. аккуратные кружки скейла и так далее. сделай снаппинг по осям объектов которые находятся рядом. также сделай замер как в фигме до объектов от выделенного и до краев канваса".
- Task type: Tier 3 canvas-interaction batch (selection overlay visuals, snap engine, measurement rendering).
- User-visible result: Selection now looks and behaves like Figma — a blue (#0D99FF) selection frame with four white corner scale circles (nwse/nesw cursors, all four corners resize with the opposite corner anchored), and a blue size chip under the element showing W × H. While moving or resizing, element edges and centers snap to neighboring elements' edges/centers and to the canvas edges and center, drawing full-length red (#F24822) smart guides. A selected element also shows Figma-style red distance measurements with end ticks and value labels to the nearest neighbor on each side, falling back to the canvas edge when no neighbor blocks that direction.
- Source/reference checked: Figma's selection/smart-guide/measurement interaction model; the existing canvas gesture architecture.
- Reference inputs: Figma's publicly known selection, smart-guide, and measurement interaction model; no new asset references.
- View interaction intent: `non-spatial`; selection, snapping, and measurement are flat 2D canvas editing aids.
- Interaction ownership: Unchanged — the canvas owns selection, movement, resizing, snapping, and measurement display through the existing transform capability.
- Docs/contracts read: Iteration 2 routed docs remain current; the protected canvas-handle visual-language constraints in `e2e/canvas-handle-helpers.ts` (textless handles, stroke ≤ 2, no nested controls) were checked before styling.
- Contract rules applied: `canvas-no-app-ui` (guides, chips, and measurements are textual/visual overlay in the export-excluded handles layer; interactive handle nodes remain textless), `canvas-handle-placement`, `interaction-surface-ownership` (unchanged ownership; same transform capability), `acceptance-product-observable`, `workflow-required`.
- Decision: Pure snap/measure geometry lives in `selection-guides.ts` (axis snapping over left/center/right and top/center/bottom candidate lines with a zoom-independent threshold; nearest-neighbor gap measurement with perpendicular-overlap filtering); presentation lives in `selection-overlay.tsx`; drag math moved to `resolveDragRect` in `micrographics-canvas-utils.ts` to honor the module line budget.
- Alternatives rejected: Screen-space HTML overlay for chips (SVG keeps zoom/export semantics simple), snapping only on move (resize edges snap too), Alt-hover measurement (always-on for the selected element is simpler and matches the request), and marking label chips as canvas handles (handles must stay textless; labels are non-interactive overlay).
- State/output mapping: Snapping adjusts the same serialized `composition.layout` writes the existing move/resize gestures produce; guides and measurements are derived render-only state cleared when the gesture ends; nothing new is persisted or exported.
- Files changed: `src/app/selection-guides.ts` (new), `src/app/selection-overlay.tsx` (new), `src/app/micrographics-canvas.tsx`, `src/app/micrographics-canvas-utils.ts`, `src/app/micrographics-canvas.module.css`, `src/app/app-performance-impact.json`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity). The four-corner resize keeps the protected `micrographics-selection-handle` testId on the south-east circle, so existing browser coverage drives the same gesture; exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No performance-path changes — snapping is O(elements) per pointer move within the existing bounded element count and does not touch the `poster-scene` pass semantics.
- Risks: Snap threshold is canvas-relative (≈0.6% of width), not zoom-aware, so at high zoom snapping can feel early; measurement labels use numbers rendered as product-layer text inside the handles group, which stays out of export but appears during editing screenshots.

### Iteration 8 — Twelve composite lockup templates from 3.11LABS references

- Request: "изучи эти примеры микрографики и сделай на основе них еще композиции, более сложные чем текущие" — eight pasted 3.11LABS-style label compositions as reference for richer, multi-part templates.
- Task type: Tier 3 batch (composite template renderers, catalog/kit expansion, content generators, visual QA fixes).
- User-visible result: Twelve new composite grammars raise the library to fifty: plate header (framed cell bar with inverted icon cell and letter-spaced city cell), spec block (tabular multi-column statements with staggered indents), dieline (tick corners plus dashed label box), arc orbits (concentric arcs with satellite dots), brand lockup (bracket pill + ©lab + bold brand + tool list + stacked years), morse row (ellipse/dash rhythm), bar column (rounded totem bars), axis star (cross axis with ellipse terminals and dotted diagonal), tool columns (name columns with version row and separator dots), totem (stacked ovals), spoke wheel (struck-through spoked ellipse), and molecule (dot cluster).
- Source/reference checked: The eight supplied 3.11LABS reference images, decomposed into their recurring devices: framed multi-cell plates, mixed sans/mono hierarchy, bracket tags, tabular spec text, dieline framing, orbital arcs, and abstract punctuation glyphs. Real brand marks (Nike swoosh, Lacoste, PSG crest) were deliberately not reproduced; invented brand names substitute in generated content.
- Reference inputs: Eight pasted 3.11LABS-style label composition images supplied in chat.
- View interaction intent: `non-spatial`; composite lockups are flat 2D template elements on the poster.
- Interaction ownership: Unchanged — the panel owns template browsing while the canvas owns placement, transforms, and in-place editing.
- Docs/contracts read: Iteration 2 routed docs remain current for this surface.
- Contract rules applied: `acceptance-product-observable` (option coverage tracks all fifty tiles), `controls-product-coverage`, `performance-coverage-levels` (element count remains the single workload dimension; per-template primitives stay bounded), `workflow-required`.
- Decision: Composite builders live in `template-renderers-composite.ts` sharing `template-primitives.ts` helpers; width-aware type sizing (per-row and per-column character budgets) prevents the text collisions the first visual pass exposed in plate header, spec block, brand lockup, and tool columns.
- Alternatives rejected: Reproducing trademarked logos from the references (replaced with invented marks), image-based composition copies, and a nested "group template" model (composites stay single elements with one content contract).
- State/output mapping: Unchanged — new templates flow through the same catalog, content generator, `poster-scene` pass, thumbnails, kits, and placement path.
- Files changed: `src/app/template-renderers-composite.ts` (new), `src/app/template-catalog.ts`, `src/app/template-renderers.ts`, `src/app/poster-model.ts`, `src/app/micrographics-generator.test.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-performance-impact.json`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity); all twelve composites visually verified through the cairo raster harness, with four text-collision fixes applied and re-verified. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No performance-path changes beyond bounded new primitive sets within the existing envelope.
- Risks: Composite lockups have more text cells than simple templates, so unusually long user edits can still crowd a small rect; sizes derive from character budgets, not measured glyph widths.

### Iteration 9 — Plate factory (52 mega compositions) and library tiers

- Request: "давай еще 52 мега композиции и разделим по табам простые и мега по правилам этого приложения" — after "давай более сложные варианты… почти чтобы повторить их" produced six reference lockups.
- Task type: Tier 3 batch (parametric plate factory, catalog tiers, library tabs, generator pool filter).
- User-visible result: Fifty-two additional mega compositions (Plate 01–52) generated by a deterministic recipe factory that recombines the reference motif vocabulary (plate bars, lab+brand lockups, tag pills, totems, bar columns, edge ellipses, arc fans, axis stars, starburst rays, tools lists, tagline/years, bracket tags, tool columns, molecule accents). The Template Library gains Simple/Mega tabs; the generator samples only simple-tier templates so mega plates stay a manual-placement vocabulary. Library totals one hundred eighteen templates.
- Source/reference checked: The eight 3.11LABS references and the six hand-built lockups from iteration 8; four text-collision fixes from that pass (brand offsets, axis tagline, /TOOLS spacing) landed here as well.
- Reference inputs: The eight 3.11LABS-style reference images from iteration 8; no new external references.
- View interaction intent: `non-spatial`; plate compositions are flat 2D template elements on the poster.
- Interaction ownership: Unchanged — the panel owns template browsing and tier tabs while the canvas owns placement, transforms, and in-place editing.
- Docs/contracts read: Iteration 2 routed docs remain current; custom-control internal presentation state follows `custom-controls.md`.
- Contract rules applied: `controls-product-coverage`, `acceptance-product-observable`, `performance-coverage-levels` (bounded primitives per plate; element count remains the workload dimension), `workflow-required`.
- Decision: Plates are one factory builder parameterized by plate index (header × rail × center × footer recipe plus seeded jitter) rather than fifty-two hand-written renderers, keeping the module bounded while every id stays a distinct, editable, thumbnailed template. `templateTier` classifies simple versus mega; the library control filters tabs client-side; `chooseTemplates` excludes mega tier.
- Alternatives rejected: Hand-writing fifty-two builders (unmaintainable), schema-level twin pickers with a segmented switch (the existing custom control already owns presentation), and adding plates to the generator pool (they would dominate compositions).
- State/output mapping: Unchanged pipeline; plate content flows through a `plate-` prefix branch in the content generator; factory renders via the shared primitive kit.
- Files changed: `src/app/template-renderers-plate-factory.ts` (new), `src/app/template-catalog.ts`, `src/app/template-renderers.ts`, `src/app/template-renderers-plates.ts`, `src/app/template-content.ts`, `src/app/poster-model.ts`, `src/app/template-library-control.tsx`, `src/app/template-library-control.module.css`, `src/app/app-performance-impact.json`, tests and acceptance counts, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity). Plate visual QA was not rerun in the sandbox this round; the factory reuses already-verified motif helpers. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: Sandbox raster QA for the fifty-two plates (recipe combinations of verified motifs); flagged for host-machine visual review.
- Risks: Recipe tuples cycle, so some plates share structure and differ only via seeded jitter and content; the one-hundred-sixteen-tile placement loop lengthens the placement browser test (timeout raised to 600 s).

### Iteration 10 — Global Color and user palette with canvas swatches

- Request: "Сделай секцию Global Color (один цвет, красит всю графику) и секцию Palette (collectionActions — мой список цветов, их свотчи показываются у выделенного элемента на канвасе и красят его индивидуально; индивидуальные цвета переживают смену глобального). Два пикера Light/Dark и тоновые свотчи убрать."
- Task type: Tier 3 batch (color model rework, schema sections, canvas swatch interaction, acceptance and browser coverage updates).
- User-visible result: A Global Color section holds one color that paints every generated element. A Palette section holds the user's own color list (CollectionActions with unlabeled color items: add, edit, remove). Selecting an element shows the palette as round swatches beside the selection size chip; clicking a swatch paints only that element, and that individual color survives Global Color changes. The Light/Dark pickers and the two tone swatches are gone.
- Source/reference checked: The user's explicit request; the current schema, canvas overlay, scene model, and export renderer.
- Reference inputs: None; this iteration follows the user's textual specification only.
- Docs/contracts read: Iteration 2 routed docs remain current (`core/control-selection.md` CollectionActions exact-owner rules, `component-rules.md`, `acceptance-testing.md`, `schema-reference.md`).
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `interaction-surface-ownership`, `canvas-handle-placement`, `canvas-no-app-ui` (swatches are textless handles in the export-excluded layer), `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; per-element recoloring stays a direct 2D canvas decision beside the selection.
- Interaction ownership: `canvas-tone-edit` is replaced by `canvas-color-edit` — the canvas owns individual element recoloring through palette swatches beside the selection; the panel owns the Global Color value and the palette list itself.
- Decision: Store the chosen hex by value on the element (`color` inside serialized `composition.layout`), so individual colors survive Global Color changes by construction; elements without `color` inherit `ink.color`. The two-tone model (`tone`, `ink.light`, `ink.dark`, `ink.mode`) is removed end to end, and `paper` fills now read the poster background for punched-out contrast.
- Alternatives rejected: Palette-index references on elements (editing a palette entry would silently repaint already-placed elements), a panel per-element color field (separates the color decision from the selected element), keeping Light/Dark as hidden fallback targets (dead schema surface), and rendering both tone and palette swatches (duplicate color entry points).
- State/output mapping: `ink.color` feeds `buildPosterScene` as the single global ink; `palette.colors` renders as selection swatches in the handles layer; a swatch click writes `color` into the selected element inside `composition.layout` through `controls.setValue`; the same scene model feeds SVG preview and Canvas 2D export; the `poster-scene` cache key swaps `ink.light`/`ink.dark` for `ink.color`.
- Files changed: `src/app/app-schema.ts`, `src/app/poster-types.ts`, `src/app/poster-model.ts`, `src/app/renderer-pipeline.ts`, `src/app/element-svg.tsx`, `src/app/poster-export.ts`, `src/app/template-placement.ts`, `src/app/selection-overlay.tsx`, `src/app/micrographics-canvas.tsx`, `src/app/micrographics-canvas-utils.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-schema.test.ts`, `src/app/micrographics-generator.test.ts`, `e2e/app-controls.spec.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity) plus scripted scene-model checks covering global repaint, per-element override survival across Global Color changes, serialization round-trips, invalid-color rejection, and palette parsing. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No new performance paths — `ink.color` replaces the two former ink targets in the existing `control-change` path, and `palette.colors` only feeds editing-handle swatches outside the scene passes.
- Risks: Palette edits do not retroactively repaint elements because colors are stored by value per element. Legacy two-tone layouts migrate on parse — `tone: "dark"` entries become a pinned `#0F0F0F` individual color (custom legacy dark inks fall back to the default dark) while `tone: "light"` entries follow the Global Color.

### Iteration 11 — Forty-two additional simple template grammars

- Request: "придумай еще 42 варианта для симпл, но чтобы они отличались от текущих" — forty-two new simple-tier templates that are distinct from the existing vocabulary.
- Task type: Tier 3 batch (new template renderers, catalog/kit/tier expansion, content generators, tests, visual QA).
- User-visible result: The Template Library grows from one hundred eighteen to one hundred sixty grammars. New simple templates: equalizer, histogram, donut gauge, iso cube, circuit, punch card, test pattern, tally, stamp frame, ticket, protractor, level, thermometer, battery, constellation, postmark, matrix, gantt, reticle, notation, helix, pipeline, scope, hex grid, clock face, calendar, callout, chevron flow, grid cell, fader, switch bank, terminal, sun path, moon phases, receipt, route map, elevation, tick ring, fingerprint, scatter, percent blocks, and approval. All are generated, placeable, kit-assigned, thumbnailed, seeded-content-driven, and recolorable like the existing set; the generator pool grows to one hundred simple-tier grammars.
- Source/reference checked: The existing one hundred eighteen grammars (to guarantee the new devices do not repeat them) plus the shared micro-industrial vocabulary already established in iterations 6 and 8: measurement instruments, print-craft marks, laboratory readouts, and interface instruments.
- Reference inputs: None new; the request is generative and the existing template corpus served as the distinctness baseline.
- Docs/contracts read: Iteration 2 routed docs remain current for this surface (`schema-reference.md`, `acceptance-testing.md`, `core/performance.md`).
- Contract rules applied: `acceptance-product-observable` (option coverage tracks all one hundred sixty tiles), `controls-product-coverage`, `performance-coverage-levels` (bounded per-template primitives — the largest new grammar emits seventy-four primitives; element count remains the single workload dimension), `workflow-required`.
- View interaction intent: `non-spatial`; the new grammars render on the same flat 2D poster surface.
- Interaction ownership: Unchanged — the panel owns template browsing and tier tabs while the canvas owns placement, transforms, recoloring, and in-place editing.
- Decision: New builders live in `template-renderers-set5.ts` and `template-renderers-set6.ts` (twenty-one each, honoring the module line budget) sharing `template-primitives.ts` helpers; catalog, kits, thumbnails, generator pool, and content generation stay single-source. Device families deliberately absent from the current set: audio/EQ instruments, statistical charts (histogram, scatter, gantt), print-craft edges (stamp perforation, ticket notches, receipt zigzag), navigation (route map, sun path, constellation), and console/terminal vocabulary.
- Alternatives rejected: A parametric factory like the mega plates (simple grammars need distinct silhouettes, not recipe recombination), reusing existing builders with tweaked constants (the user explicitly asked for templates that differ from the current ones), and bitmap assets (drift from the parametric grammar).
- State/output mapping: Unchanged — new templates flow through the same catalog, content generator, `poster-scene` pass, thumbnails, tier tabs, placement, and recolor paths.
- Files changed: `src/app/template-renderers-set5.ts` (new), `src/app/template-renderers-set6.ts` (new), `src/app/template-renderers.ts`, `src/app/template-catalog.ts`, `src/app/template-content.ts`, `src/app/micrographics-generator.test.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-performance-impact.json`, `e2e/app-canvas.spec.ts` (placement-loop timeout for one hundred sixty tiles), and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity) plus scripted checks proving one hundred sixty unique ids, one hundred sixty distinct primitive signatures, bounded primitive counts, finite geometry, valid kit pools, and deterministic content; all forty-two new grammars were rendered to a raster contact sheet and visually reviewed, with layout fixes applied to tally, approval, grid cell, route map, tick ring, and fingerprint. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No new performance paths — the new grammars render inside the existing bounded element-count workload and change no pipeline targets.
- Risks: The one-hundred-sixty-tile placement loop lengthens the placement browser test (timeout raised to 900 s); `plate-header` remains mega-classified by the historical `plate-` prefix rule, so the simple generator pool is one hundred grammars rather than one hundred one.

### Iteration 12 — Forty mega dashboard compositions (second factory)

- Request: "придумай для мега еще 40 композиций" — forty additional mega-tier compositions.
- Task type: Tier 3 batch (new mega recipe factory, catalog/tier expansion, content branch, tests, visual QA).
- User-visible result: The Mega tab grows by forty dashboard-style compositions (Mega 01–40), raising the library from one hundred sixty to two hundred templates. Where the existing plates recombine the 3.11LABS lockup vocabulary, the new factory composes instrument-panel plates: five mastheads (double-rule brand masthead, index tabs, barcode masthead, registration-corner frame, diamond ticker strip), five rails (ruler scale, dotted route leader, switch bank, morse column, none), eight centers (donut gauge, oscilloscope, iso cube, scatter with trend, giant metric numeral, constellation, equalizer band, mil-dot reticle panel), and five footers (tagline with progress bar, chevron row, approval signature, percent blocks, three-column tool spec). Recipe moduli 5/5/8/5 over forty indexes make every header–rail–center–footer tuple distinct.
- Source/reference checked: The existing plate factory and seven lockups (to keep the new recipes structurally different) and the instrument vocabulary introduced by the iteration 11 simple set.
- Reference inputs: None new; the request is generative and the existing mega corpus served as the distinctness baseline.
- Docs/contracts read: Iteration 2 routed docs remain current for this surface (`schema-reference.md`, `acceptance-testing.md`, `core/performance.md`).
- Contract rules applied: `acceptance-product-observable` (option coverage tracks all two hundred tiles), `controls-product-coverage`, `performance-coverage-levels` (bounded per-plate primitives within the existing element-count envelope), `workflow-required`.
- View interaction intent: `non-spatial`; mega compositions are flat 2D template elements on the poster.
- Interaction ownership: Unchanged — the panel owns template browsing and tier tabs while the canvas owns placement, transforms, recoloring, and in-place editing.
- Decision: A second factory (`template-renderers-mega-factory.ts`, ids `mega-01`–`mega-40`) rather than extending the plate recipes, because the plate factory's motif pools would only produce more of the same silhouettes; `templateTier` treats the `mega-` prefix as mega so the generator keeps excluding them; content flows through a dedicated `mega-` branch (lab/brand, tag, tagline, tool versions, metric, code).
- Alternatives rejected: Extending plate indexes to ninety-two (recipe tuples would repeat existing structures), forty hand-written builders (unmaintainable for hero plates sharing a grid), and folding the new motifs into the plate factory (would restyle existing plates users may have placed).
- State/output mapping: Unchanged — mega templates flow through the same catalog, content generator, `poster-scene` pass, thumbnails, tier tabs, placement, and recolor paths.
- Files changed: `src/app/template-renderers-mega-factory.ts` (new), `src/app/template-renderers.ts`, `src/app/template-catalog.ts`, `src/app/template-content.ts`, `src/app/micrographics-generator.test.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-performance-impact.json`, `e2e/app-canvas.spec.ts` (placement-loop timeout for two hundred tiles), and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity) plus scripted checks proving two hundred unique ids, two hundred distinct primitive signatures, bounded primitive counts, finite geometry, and deterministic content; all forty compositions were rendered to a raster contact sheet and visually reviewed, with two collision fixes applied (equalizer value versus right rails, constellation tool list versus the right edge). Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No new performance paths — the compositions render inside the existing bounded element-count workload and change no pipeline targets.
- Risks: The two-hundred-tile placement loop lengthens the placement browser test (timeout raised to 1 200 s); recipe tuples guarantee distinct structure but sibling megas sharing a center variant still rhyme visually, differing through masthead, rails, footer, seeded jitter, and content.

### Iteration 13 — Pack-sourced vector glyph library across all compositions

- Request: "я хочу чтобы ты прошелся по всем композициям микрографики которые мы создали. Сейчас они выглядят сильно сухо и дженерик. У меня скачанные макеты наборов элементов для микрографики, я хочу чтобы ты максимально их внедрил в текущие композиции используя бест практики для дизайна... все объекты должны быть также в векторе."
- Task type: Tier 3 batch (vector asset extraction pipeline, primitive-model extension, composition enrichment, visual QA).
- User-visible result: Fifty real marking-pack elements now live in the app as vectors — certification and handling pictograms (biohazard, radioactive, fragile, this-way-up, keep-dry, recycle, resin code, warning triangles, DANGER tag, QA globe seal), technical devices (calibration target, registration target, datamatrix, QR finder, dimension boxes) and y2k glyphs (skulls, splat, penrose, saturn, gear-bolt, fishbone, jellyfish, pixel hand). Mega plates gain certification rows, corner calibration targets, danger tags, approval seals, and shipping rails; plates gain glyph icon cells, warning-stack rails, star-burst centers, and checker/recycle footers; caption, address, shipping-tag, footer-line, pill-badge, and eartag carry pack accents. Glyph choice is seeded and deterministic.
- Source/reference checked: "Utilitarian Industrial Pack.ai" (PDF-compatible, ~1 900 vector elements) and "Industrial Shipping Labels Logos" 1–3.eps (Illustrator AI9 streams decoded from ASCII85+zlib), plus rendered contact sheets of every extracted cluster.
- Reference inputs: The two user-connected packs on this device; all extraction was vector-native (no image tracing).
- Docs/contracts read: Iteration 2 routed docs remain current (`renderer-technique.md` for the primitive model, `core/performance.md` for bounded primitives, `acceptance-testing.md`).
- Contract rules applied: `canvas-no-app-ui`, `acceptance-product-observable`, `performance-coverage-levels` (glyphs are bounded polyline sets; the heaviest composition emits one hundred ten primitives), `workflow-required`.
- View interaction intent: `non-spatial`; glyphs are static vector primitives inside the same flat 2D template elements.
- Interaction ownership: Unchanged — glyph accents ship inside template grammars; the canvas keeps placement, transforms, recoloring, and in-place editing.
- Decision: Parse pack vectors directly (SVG via pdftocairo for the .ai; a custom Illustrator-stream parser for the EPS AI9 data), flatten Béziers to polylines, simplify with Douglas-Peucker under a per-glyph point budget, and normalize onto a 200-unit grid in `template-glyph-data.ts`; `drawPackGlyph` renders a glyph as even-odd compound polylines, and `PosterPolyline` gains an optional `holes` field honored by the SVG preview, Canvas 2D export, and thumbnail renderers, so counter-shapes (ring outlines, punched pictograms) stay true vector in every output.
- Alternatives rejected: Raster embedding of pack elements (violates the vector requirement and the SVG renderer contract), Ghostscript-based EPS rasterization (unavailable in the sandbox and raster anyway), per-subpath parity classification without compound paths (mis-renders ring glyphs), and hand-redrawing the pack marks (loses the authentic vocabulary the user supplied).
- State/output mapping: Unchanged pipeline — glyph primitives flow through `buildTemplatePrimitives` into the `poster-scene` pass, PNG export, and thumbnails; per-element ink/paper resolution recolors glyph fills exactly like other primitives.
- Files changed: `src/app/template-glyph-data.ts` (new), `src/app/template-glyphs.ts` (new), `src/app/poster-types.ts`, `src/app/element-svg.tsx`, `src/app/poster-export.ts`, `src/app/template-thumbnails.ts`, `src/app/template-renderers.ts`, `src/app/template-renderers-extra.ts`, `src/app/template-renderers-set4.ts`, `src/app/template-renderers-plate-factory.ts`, `src/app/template-renderers-mega-factory.ts`, `src/app/app-performance-impact.json`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity) plus scripted checks proving two hundred unique grammars, bounded primitive counts, finite geometry, and scene-model invariants; the glyph library and every touched composition family were rendered to raster contact sheets and visually reviewed through several fix rounds (compound-hole rendering, white-artwork normalization, paint-order preservation, collision and sizing passes). Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No new performance paths — glyphs render inside existing passes and change no pipeline targets.
- Risks: Glyph fills use the element ink and poster background ("paper") for punched counters, so over a photograph the punched areas read as the background color rather than transparent; pack text rings (the QA seal) are flattened outlines and not editable text; extraction filtered specks below three square units, which can drop hairline details from the densest marks.

### Iteration 14 — Cover presets and vertical poster formats

- Request: "сделай пресет из 6 картинок-обложек котоыре идеально подходят для микрографики. изучи тему микрографики на каких обычно обложках ее используют и сделай 6 разных классных картинок и возможность загрузить свою; также вертикальный формат постера".
- Task type: Tier 3 batch (bundled asset presets, imagePicker control, canvas format commands, acceptance and browser coverage updates).
- User-visible result: The Source Photo section gains a Cover picker with six bundled backdrops spanning the surfaces micrographics typically lives on — Concrete (brutalist texture), Acid (y2k gradient), Nebula (deep space), Chrome (brushed steel), Noir (near-black film grain with a light leak), and Terrain (dark hillshaded relief) — plus a No-cover tile; an uploaded photo always overrides the preset. A new Format section resizes the poster with one click between the 4:5 feed (1080×1350), the 2:3 vertical poster (1080×1620), and the 9:16 story (1080×1920).
- Source/reference checked: The micrographics usage vocabulary already established from the reference recording, poster references, and the user's marking packs — overlays over monochrome photography, brutalist surfaces, space imagery, metals, and dark textures.
- Reference inputs: None new; the six covers are procedurally synthesized in-house (fBm noise, gradient meshes, hillshading, grain) at 1200×1800 so cover-cropping serves every format.
- Docs/contracts read: Iteration 2 routed docs remain current (`core/control-selection.md` ImagePicker fit and Actions rules, `core/media-upload.md`, `schema-reference.md`).
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `canvas-no-app-ui` (covers render in the product background layer), `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; covers and formats change the flat poster surface, not a camera.
- Interaction ownership: Unchanged — the panel owns cover choice and format commands; the canvas keeps direct element manipulation.
- Decision: Ship covers as public/ assets referenced by stable URLs (no bundler machinery in schema imports), select them through the built-in ImagePicker writing `source.preset`, and resolve the backdrop as uploaded-photo-first in both the SVG preview and the Canvas 2D export; format buttons are an Actions control whose values dispatch `canvas.setSize` through the existing panel-action channel, so the already-covered canvas-size cache keys regenerate the composition per format.
- Alternatives rejected: Base64 data-URL modules (megabytes of source for no gain), importing raster covers through the schema module graph (breaks non-bundler tooling), a select of size strings mirroring Setup width/height fields (duplicated spatial controls), and auto-switching format from the chosen cover (conflates two decisions).
- State/output mapping: `source.preset` persists with values and feeds `coverPresetSrc` in the canvas background layer and the export loader; uploaded media assets keep precedence; `canvas.commands` actions dispatch `canvas.setSize`, which already participates in `poster-scene` cache keys and export sizing.
- Files changed: `public/covers/` (seven new JPEG assets), `src/app/template-covers.ts` (new), `src/app/app-schema.ts`, `src/app/micrographics-canvas.tsx`, `src/app/poster-export.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-schema.test.ts`, `src/app/app-performance-impact.json`, `e2e/app-controls.spec.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity) plus scripted checks proving preset resolution and precedence, format commands resizing the canvas with bounded regenerated scenes per format, determinism, and unchanged template counts; a full 2:3 vertical poster over the Nebula cover was rendered and reviewed. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No new performance paths — covers draw in the existing background layer outside the scene passes, and canvas sizing is already an assessed path.
- Risks: Preset covers are raster JPEGs (the poster overlay stays vector; export rasterizes everything anyway), and exporting at 8K upscales the 1200×1800 covers noticeably; cover URLs are root-relative, so hosting the app under a subpath would need a base-path pass.

### Iteration 15 — Ink-weight normalization for glyphs and lines

- Request: "толщина иконок везде очень жирная и линий иногда. пройдись по всем вариантам и нормализуй толщину линий и иконок".
- Task type: Tier 3 batch (glyph geometry regeneration, stroke-multiplier sweep, visual QA).
- User-visible result: Every pack glyph draws noticeably lighter — warning-triangle rings, box frames, circles, and solid pictograms lose their heavy safety-label weight while keeping their silhouettes — and the app's own heavy rules (hatch strokes, reticle posts, bracket corners, tally marks, clock hands, notation bar lines, plate icon strokes, lockup crosses) settle onto one stroke scale capped at 1.6× the base width.
- Source/reference checked: Before/after raster sheets of all fifty glyphs and close-up renders of the plate warning rails the user screenshotted, plus mega and simple samples.
- Reference inputs: The user's screenshot of the overweight triangle rail.
- Docs/contracts read: Iteration 2 routed docs remain current (`renderer-technique.md`, `core/performance.md`).
- Contract rules applied: `performance-coverage-levels` (erosion changes vertex positions, not primitive counts), `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged.
- Decision: Thin the glyphs in the extraction pipeline rather than at render time — a parity-aware polygon offset moves every fill ring toward less ink (outer contours inward, holes outward, paper counter-shapes outward) with miter clamping and an area guard that reverts collapsing rings; per-glyph strength dosing protects delicate marks (seal ring text, wire globes, pixel art, data codes stay untouched) while chunky safety marks get the full reduction. Line normalization is a source sweep: multipliers above 1.6 map down to a 1.4–1.6 band.
- Alternatives rejected: Render-time stroke tricks (cannot thin filled rings), re-picking thinner pack sources per glyph (loses the chosen vocabulary and does not fix solid marks), and a uniform erosion constant (destroys thin-featured glyphs — the head and spark glyphs proved it and are exempted).
- State/output mapping: Unchanged — only `template-glyph-data.ts` coordinates and line width multipliers changed; primitive counts, template ids, and pipeline targets are identical.
- Files changed: `src/app/template-glyph-data.ts` (regenerated), `src/app/template-renderers.ts`, `src/app/template-renderers-composite.ts`, `src/app/template-renderers-extra.ts`, `src/app/template-renderers-plates.ts`, `src/app/template-renderers-set4.ts`, `src/app/template-renderers-set5.ts`, `src/app/template-renderers-set6.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity) plus scripted checks proving two hundred distinct grammars, bounded primitives, and scene invariants; a fifty-glyph before/after sheet and close-up renders of the previously overweight rails were visually reviewed, with two glyphs exempted after review. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No performance-path changes — geometry-only edits inside existing passes.
- Risks: Erosion is irreversible in the shipped data (the extraction pipeline in the session can re-emit other weights); extremely small renders of eroded thin-line glyphs (iso box, cubes) sit closer to the one-pixel floor than before.

### Iteration 16 — Stroke base reduction and small-mark readability

- Request: "вот я все также вижу ненормализованную толщину линий и толщину иконок которые не читаются или выглядят ошибочными" (follow-up screenshot of a mega composition after iteration 15).
- Task type: Tier 3 batch (global stroke retune, mega furniture simplification, glyph readability audit).
- User-visible result: Every composition draws on a lighter stroke base — the width formula drops from 1.2% of the element unit capped at 3 to 0.9% capped at 2.2, so large posters lose roughly a quarter of their line ink; the mega tab header trades its per-tab outlined boxes for one filled active tab over a thin baseline with small separator ticks; the big-metric underline, corner arms, header rules, waveforms, and hex frames step down their multipliers; and the certification mark row now draws four distinct glyphs from a pool proven readable at small sizes (recycle, warning and bolt triangles, alert circle, radioactive, star burst, skull, umbrella, pin, spark) instead of possibly repeating dense marks like the flame or bold globe that smeared at that scale.
- Source/reference checked: A three-size (28/44/72 px) raster audit sheet of all fifty glyphs to classify small-size readability, plus full-size re-renders of the exact composition the user screenshotted (mega-37) and of the complete forty-mega contact sheet.
- Reference inputs: The user's screenshot showing heavy tab boxes, a thick underline, and two identical unreadable certification marks.
- Docs/contracts read: Iteration 2 routed docs remain current (`renderer-technique.md`, `core/performance.md`).
- Contract rules applied: `performance-coverage-levels` (width scalars and glyph pool membership change no primitive counts), `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged.
- Decision: Fix the remaining heaviness at its two real sources — the render-time stroke base (which capped at 3 px and then multiplied up to 1.6× on mega furniture) and glyph choice at small sizes (erosion cannot make a texture-dense mark readable at twenty pixels) — rather than eroding the glyph geometry further; the certification row also deduplicates picks by removing each chosen glyph from its pool.
- Alternatives rejected: A second erosion pass (the audit shows dense marks stay unreadable at small sizes at any weight while clean marks already read), per-template stroke overrides (two hundred grammars would drift), and scaling the certification marks up instead of re-pooling (crowds the footer band).
- State/output mapping: Unchanged — only the stroke-width formula, line-width multipliers, tab-header primitives, and the certification glyph pool changed; template ids, primitive kinds, and pipeline targets are identical.
- Files changed: `src/app/poster-model.ts`, `src/app/template-renderers-mega-factory.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity) plus scripted checks proving two hundred distinct grammars and bounded primitives; the fifty-glyph three-size audit sheet, a full-size render of the screenshotted mega-37 with three sibling megas, and the forty-mega contact sheet were visually reviewed — certification rows now show four distinct legible marks and the tab strip reads as one filled tab on a hairline. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No performance-path changes — scalar and pool edits inside existing passes.
- Risks: The lower 2.2 px cap makes hairline dividers on very large exports (8K) relatively lighter than before, and any user attached to the previous heavier look will notice the change globally since the base affects all two hundred templates.

### Iteration 17 — Overlap and spacing sweep across all compositions

- Request: "я хочу чтобы ты также прошелся по всем элементам и поправил отступы, чтобы элемента не налезали друг на друга".
- Task type: Tier 3 batch (automated collision detection over the full template library, per-template spacing fixes, visual QA).
- User-visible result: No template lets text run off the element or crash into neighboring content anymore — the barcode, timecode, sequence, pill-badge, and caption headlines size themselves to the letter-spaced width they actually occupy; binary rows fit their longest row; manifest rows fit the widest entry; radar and compass bearing labels clamp inside the right edge; the iso-cube width label clamps inside the left edge; scale-ladder end labels clamp inside the top and bottom edges; footer-line reserves letter-spaced widths so its three segments never collide; brand-lockup fits its tool list into the remaining height; axis-lockup compresses its tagline block above the footer on short elements; and in the mega family the tool lists clamp away from the right edge, the scatter-frame variant's list clears the left measuring rail, and the corner-bracket header drops its bottom brackets so footers own the bottom edge.
- Source/reference checked: A geometric audit script that renders every template at two element widths (520 and 260) across four content seeds, estimates letter-spaced text boxes, and reports out-of-bounds text, text-on-text intersections, and text-on-filled-shape intersections with point-in-polygon tests to exempt intentional patterns (donut-gauge numerals, paper-on-ink labels).
- Reference inputs: None new; the sweep covers the existing two-hundred-template library.
- Docs/contracts read: Iteration 2 routed docs remain current (`renderer-technique.md`, `core/performance.md`).
- Contract rules applied: `performance-coverage-levels` (sizing formulas and coordinate clamps change no primitive counts beyond two removed bracket lines), `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged.
- Decision: Fix spacing at the sizing formulas rather than by clipping — each offending builder now accounts for letter-spacing in its fit calculation (advance ≈ 0.62 em plus tracking) or clamps label anchors into the element box with `monoWidth`, so text scales down or shifts instead of being cut; the detector stays in the session toolkit as a regression gate that must report zero findings.
- Alternatives rejected: Renderer-level clipping masks (hides content instead of fitting it and adds output complexity), shrinking all type globally (punishes templates that were already correct), and manual eyeballing alone (the two-hundred-template space with seeded content needs the exhaustive geometric pass — it found nine offenders the sheets missed).
- State/output mapping: Unchanged — only sizing formulas and text anchors inside builders changed; template ids, kits, and pipeline targets are identical.
- Files changed: `src/app/template-renderers.ts`, `src/app/template-renderers-extra.ts`, `src/app/template-renderers-set4.ts`, `src/app/template-renderers-set5.ts`, `src/app/template-renderers-composite.ts`, `src/app/template-renderers-plates.ts`, `src/app/template-renderers-mega-factory.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, smoke) plus the overlap audit reporting zero findings at both element widths across four seeds, the two-hundred-signature uniqueness check, and rendered before/after sheets of all fourteen touched simple templates at large and small sizes and of the four affected megas, all visually reviewed. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No performance-path changes — arithmetic-only edits inside existing builders.
- Risks: Fit formulas assume the mono advance of the preview font (0.62 em); a substituted system font with wider glyphs could still graze edges, and extremely long user-entered content still wins over any layout — it scales down to the clamp floors before it can overflow.

### Iteration 18 — Global Glow slider

- Request: "дай возможность настраивать глоу для всех элементов, силу глоу, все одним слайдером".
- Task type: Tier 3 batch (new schema control, scene model field, SVG filter in the preview, canvas shadows in the export, acceptance and browser coverage).
- User-visible result: The Global Color section gains a Glow slider (zero to one hundred percent, default off). Raising it wraps the whole element overlay in a soft light halo — each element glows in its own resolved ink color, so palette-painted elements halo in their palette color while everything else glows in the global color — and the identical effect bakes into PNG/JPG export at every resolution.
- Source/reference checked: Rendered comparison panels of a mixed poster (mega dashboard plus radar, barcode, and compass elements in four different inks) at zero, thirty-five, and eighty percent glow, visually reviewed.
- Reference inputs: None new; the effect derives from the existing ink-resolution rules.
- Docs/contracts read: Iteration 2 routed docs remain current (`core/control-selection.md` slider rules, `renderer-technique.md`, `core/performance.md`).
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required` (the Global Color inventory entry now owns both targets), `canvas-no-app-ui` (the filter is product output, not editor chrome), `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged — the panel owns the glow strength; the canvas keeps direct manipulation.
- Decision: Store glow as a normalized scene field read from `ink.glow`, and render it as one shared SVG filter over the foreground layer — feGaussianBlur of SourceGraphic merged back under the artwork with a strength-scaled alpha boost — so the blur samples the actually drawn colors and multi-ink posters glow per element with a single filter evaluation; the export mirrors the effect with canvas shadows whose color follows each fill and stroke (paper counters glow paper, palette inks glow their own hue) and whose blur compensates for the device-pixel scale of the chosen resolution. At zero the filter attribute and shadows are absent, so the default render path is byte-identical to before.
- Alternatives rejected: Per-element filters with flood-colored drop shadows (one filter per element and wrong colors for mixed-ink internals), a raster post-process pass (new pipeline stage for one effect), CSS drop-shadow on the SVG root (would halo the background photo and editor chrome too), and a fixed-color glow tied to the global ink (breaks palette-painted elements).
- State/output mapping: `ink.glow` persists with values and feeds `buildPosterScene` → `scene.glow`; the preview filter and the export shadow both derive their radius from the same normalized value scaled by the canvas short side, keeping preview and export visually aligned.
- Files changed: `src/app/app-schema.ts`, `src/app/poster-types.ts`, `src/app/poster-model.ts`, `src/app/element-svg.tsx`, `src/app/micrographics-canvas.tsx`, `src/app/poster-export.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-schema.test.ts`, `e2e/app-controls.spec.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, smoke, acceptance/worklog validation) plus a scripted scene check proving the default is off, the value normalizes and clamps, and glow changes no composition, and rendered zero/thirty-five/eighty percent comparison panels of a four-ink poster visually reviewed — halos follow each element's own color and scale with the slider. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No new pipeline passes — the filter lives inside the existing `poster-scene` output and the shadows inside `export-png`; both modules were already performance-classified.
- Risks: Large glow values on big canvases make the browser rasterize a wider filter region, which can slow interaction on weak GPUs while dragging with high glow; canvas shadow blur and SVG Gaussian blur use slightly different kernels, so extreme values can differ subtly between preview and export; and the halo is clipped by the filter region margin (thirty percent of the overlay bounds), which very high glow on edge-hugging elements can graze.

### Iteration 19 — Reference-driven cover preset regeneration

- Request: "самый последний пример фона оставляем все остальные фоны генерируем на основе таких изображений как я прислал" (four reference images attached: an acid-yellow dotted halftone world poster, a monochrome particle-mesh wave, a warm sunlit film photograph, and a green scanner-gradient plate; clarified that only the green reference stays and the rest are generated in that family).
- Task type: Tier 3 batch (asset regeneration, preset catalog swap, acceptance and browser coverage updates).
- User-visible result: The Cover picker now offers six new backdrops drawn from the user's reference boards — Atlas (full-bleed warped halftone dot map with acid continent patches on black), Orbit (acid dotted globe with graticule and bright noise landmasses), Mesh (monochrome particle wave flowing diagonally over charcoal), Static (quiet grayscale dot static with scanline bands), Film (warm sunlit gradient with blurred track lanes, deep shadow, halation, and heavy grain), and Scan (the kept reference: light haze falling into deep green-black with vertical streaks, scratches, a warm leak, and film grain) — replacing Concrete, Acid, Nebula, Chrome, Noir, and Terrain; the No-cover tile and photo upload behavior are unchanged.
- Source/reference checked: The four attached reference images (colors sampled programmatically for the acid dots, mesh grays, film skin/track tones, and the scan gradient stops) and rendered contact sheets of the generated set reviewed against them over two refinement rounds.
- Reference inputs: The user's four reference images; all covers are synthesized in-house at 1200×1800 (halftone dot fields, ridged-noise particle meshes, layered gradients, procedural grain) with no third-party marks reproduced.
- Docs/contracts read: Iteration 2 routed docs remain current (`core/control-selection.md` ImagePicker rules, `core/media-upload.md`).
- Contract rules applied: `controls-product-coverage` (imagePicker optionCoverage updated to the new ids), `canvas-no-app-ui`, `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged — the panel owns cover choice; uploaded photos still override presets.
- Decision: Keep the proven preset architecture (public/ assets referenced by stable ids through `micrographCoverPresets`) and swap only the catalog rows and image files, so persistence, export, and the canvas background layer need no code changes; the green reference is recreated procedurally as the Scan preset (its trademarked text is not part of the background) rather than embedding the user's screenshot, keeping every asset synthetic and full-resolution.
- Alternatives rejected: Embedding the attached reference images directly as presets (screenshots carry third-party logos and text and are not clean full-bleed assets), keeping the old six alongside the new (a thirteen-tile picker dilutes the curated set the user asked for), and raster-tracing the references (the procedural generators match the aesthetic while staying reproducible).
- State/output mapping: Unchanged — `source.preset` persists ids that now resolve to the new assets via `coverPresetSrc`; stale persisted ids from the old set resolve to null and fall back to no cover.
- Files changed: `public/covers/` (six new JPEG assets; six old ones removed), `src/app/template-covers.ts`, `src/app/app-acceptance-data.ts`, `e2e/app-controls.spec.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, docs, integrity, smoke, acceptance/worklog validation) plus the format-and-cover scripted check proving preset resolution for the new ids and contact sheets of all six covers visually reviewed against the references across two generation rounds. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No pipeline changes — covers draw in the existing background layer outside the scene passes.
- Risks: Users with an old preset id persisted (concrete, acid, nebula, chrome, noir, terrain) silently fall back to no cover on next load and must re-pick; the acid dot fields are busier backdrops than the old textures, so dense compositions over Atlas or Orbit may want the global overlay color kept bright for contrast.

### Iteration 20 — Graphics row and photographic row in the cover picker

- Request: "эти замени на фотографии в стиле что я прислал. первый ряд графика, второй фотографии, пустой фон делать не нужно. если в первом ряду не хватает, оставь то что я ответил в прошлом сообщении которое можно оставить" (with picker screenshots marking the tiles in question).
- Task type: Tier 3 batch (asset regeneration, preset catalog restructure, default change, acceptance and browser coverage updates).
- User-visible result: The Cover picker is now two clean rows of four. The first row keeps the generated graphics — Atlas, Orbit, Mesh, and Static. The second row is photographic: Track (a sunlit red running track with white lane lines meeting a shaded rubber apron, shot at a slight angle with film grain), Film (a golden-hour frame with a horizontal flare, restrained bokeh, deep out-of-focus foreground shadow, dust, and heavy grain), Steel (dark brushed metal under a scanner light sweep with scratches and specks), and the kept green Scan. The No-cover tile is gone and new posters open on Atlas by default; uploading a photo still overrides any preset.
- Source/reference checked: The user's picker screenshots marking the tiles, the previously supplied reference photographs (the sunlit runner frame and the green scanned plate), and contact sheets of the full two-row set reviewed over two refinement rounds (the first Film pass read as spots and Steel as flat black; both were re-lit).
- Reference inputs: The same reference board; all assets remain synthesized in-house at 1200×1800.
- Docs/contracts read: Iteration 2 routed docs remain current (`core/control-selection.md` ImagePicker rules).
- Contract rules applied: `controls-product-coverage` (optionCoverage now lists the eight visible tiles), `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged.
- Decision: Keep the four strongest generated graphics as the first row exactly filling the picker's four-across wrap, build the second row as photograph-style backdrops matching the reference photography (track environment, golden-hour film light, scanned dark metal, the kept green scan), and drop the "none" preset from the catalog while `coverPresetSrc` keeps mapping the legacy "none" value to null so persisted old states still load cleanly onto the new default.
- Alternatives rejected: Replacing the marked graphics tiles with photos without backfilling (leaves the first row ragged against the four-across wrap the user sketched), keeping the empty tile (explicitly declined), and embedding the reference photographs themselves (third-party imagery with people and marks).
- State/output mapping: `source.preset` defaults to "atlas"; legacy persisted values ("none" or removed ids) resolve to null background via `coverPresetSrc` and the poster simply renders on the flat background color until the user picks a tile.
- Files changed: `public/covers/` (track.jpg, steel.jpg new; film.jpg regenerated; none.jpg removed), `src/app/template-covers.ts`, `src/app/app-schema.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance-data.ts`, `e2e/app-controls.spec.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, docs, integrity, smoke, acceptance/worklog validation) plus the format-and-cover scripted check proving the new default and preset resolution, and the two-row contact sheet visually reviewed against the references. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No pipeline changes — covers draw in the existing background layer.
- Risks: Every new poster now ships with the Atlas backdrop until changed, which makes the default composition busier than the old flat background; users who want a plain color must rely on a photo upload or a future plain preset since the empty tile is gone.

### Iteration 21 — Editorial rework of the forty mega compositions

- Request: "давай пройдемся по всем Mega и переработаем шаблоны, я тебе отправлял прекрасные референсы, сейчас шаблоны выглядят сырыми композиционно и по реализации тоже. опирайся именно на референсы что я скинул".
- Task type: Tier 3 batch (full rewrite of the mega composition factory with visual QA rounds).
- User-visible result: All forty mega templates are rebuilt as editorial poster systems in the language of the reference boards. Every composition now sits inside proper margins. Headers come in five voices: twin corner labels joined by rules around a centered crosshair, plus-marks flanking a letterspaced tag, a brand name against a stack of cryptic data rows, a centered label between two rules, and a rounded tag chip with a code. The middle band carries one of eight focal lockups: a headline lockup (small tagline over a huge brand wordmark over a colon-spaced code line), a specification plate (title, three interlocked rings beside an engineering-return figure and codes, a roman numeral against a FIELD TESTED chip, and two caption lines), fanned dotted arcs with a bright particle patch beside a ruled tool list, four drifting dotted wave rows with a corner data block, a right-anchored giant numeral on a full-width hairline with a registration target, a ruled type stack, a fine-line targeting reticle with quadrant readouts, and a barcode lockup between hairlines. Rails add left data columns, dotted right rules with an embedded crosshair, small mark stacks, vertical brand letters, or lone plus marks; footers close with the three-column caption row, a registration row, a rule with brand sign-off, a data table with one mark, or a centered code chip with a caption. The dashboard-era tab strips, toggle switches, progress blocks, and the fixed certification-mark row are gone.
- Source/reference checked: The user's reference posters (the two-city halftone-map poster with its center wordmark and three-column footer, the particle-mesh poster with corner terminal blocks, and the green specification plate), the full forty-template contact sheet, and full-size renders of four representative compositions (headline, spec plate, dotted arcs, giant numeral) reviewed against the boards.
- Reference inputs: The previously supplied reference images; no new assets.
- Docs/contracts read: Iteration 2 routed docs remain current (`renderer-technique.md`, `core/performance.md`).
- Contract rules applied: `performance-coverage-levels` (heaviest composition emits under one hundred fifty bounded primitives), `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged — mega grammars stay template-driven; the canvas keeps placement and recoloring.
- Decision: Keep the factory architecture (five headers × five rails × eight centers × five footers over the same index mapping, so all forty ids stay distinct and content cells keep their meaning) but replace the entire visual vocabulary: a shared margin system, crosshair/plus/cryptic-data helpers, per-column and per-lockup width fitting, and seeded pseudo-data so the terminal blocks read authentic without new content fields.
- Alternatives rejected: Forty hand-written one-off builders (larger code for less coherence and no shared fit logic), patching the dashboard variants piecemeal (the user judged the language itself raw, not individual spots), and dropping the factory for static layouts (loses seeded variation across seeds and formats).
- State/output mapping: Unchanged — same template ids, content schema, and pipeline targets; only the emitted primitive geometry changed.
- Files changed: `src/app/template-renderers-mega-factory.ts` (rewritten) and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, smoke, acceptance/worklog validation) plus the two-hundred-signature uniqueness check, the geometric overlap audit at two element widths and four seeds reporting zero findings after three fix rounds (footer column fitting, spec-plate compression, wave data-block relocation, numeral tool-list removal), and visual review of the forty-template sheet plus four full-size renders against the reference boards. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No performance-path changes — the factory emits the same primitive kinds through existing passes.
- Risks: The new language leans on negative space, so users who filled posters edge-to-edge with the old dashboard furniture will see much airier compositions; cryptic data rows are seeded decoration and not user-editable content; and the dotted art motifs raise the heaviest mega to about one hundred fifty primitives, still far under the bounded-primitives gate.

### Iteration 22 — Library curation to fifty per tier and a detailed polish pass

- Request: "иконки жирные в некоторых местах сильно. также некоторые композиции у тебя накладываются друг на друга. давай сократим количество в каждой секции до 50, но выберем самые лучшие и пройдемся по ним еще раз и доработаем внимательно каждый" (with screenshots of the chunky resin triangle, the Lab plate double copyright, and the Arc lockup arcs crossing the brand name).
- Task type: Tier 3 batch (catalog curation, glyph re-erosion, per-template fixes, extended geometric audit, visual QA).
- User-visible result: The Template Library now holds one hundred curated grammars — the fifty strongest simple templates and a mega tier of the forty editorial megas plus the seven typographic lockups, the plate header, and the two best plates. The screenshotted defects are fixed: the resin-code triangle and recycle marks are re-eroded to line weight, the Lab plate no longer doubles its copyright sign and its badge icon draws lighter, and the Arc lockup's dotted arcs now rise clear above the brand line instead of crossing it. The barcode mega lockup fits its letterspaced code line at every aspect, the giant-numeral mega moves its registration target off the left data rail, and the footer line reserves a proper gap between its studio and city segments.
- Source/reference checked: The user's three screenshots, a three-size glyph audit of the re-eroded marks, and fresh contact sheets of all one hundred kept templates reviewed tile by tile.
- Reference inputs: None new; curation and fixes act on the existing library.
- Docs/contracts read: Iteration 2 routed docs remain current (`core/control-selection.md` for kit coverage, `renderer-technique.md`).
- Contract rules applied: `controls-product-coverage` (kit members re-pruned to kept ids), `performance-coverage-levels`, `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged.
- Decision: Curate by removing entries from the catalog and kit lists while leaving builder code dormant behind string-keyed maps, so dropped grammars stay recoverable and no renderer file needed surgery; thin the two still-chunky ring marks with a second parity-aware erosion pass through the extraction pipeline and re-emit the glyph data (restoring the barcode strip's proper name, which the re-emission had reverted and which silently broke the barcode mega lockup); and extend the geometric audit to flag text crossed by stroked rings and arcs, which is the class the screenshots exposed and the box-only audit could not see.
- Alternatives rejected: Deleting the fifty builder functions outright (large diff, loses recoverable work, forces type churn), thickening thresholds in the audit instead of extending it (the arc-over-brand class would stay invisible), and hand-tuning glyph outlines in the shipped data (the pipeline erosion stays reproducible and dosage-controlled).
- State/output mapping: Persisted posters that reference a removed template drop that element on load (the layout parser already validates ids); everything else is unchanged — same pipeline targets, controls, and content schema.
- Files changed: `src/app/template-catalog.ts` (one hundred kept entries, kits re-pruned), `src/app/template-glyph-data.ts` (regenerated), `src/app/template-content.ts`, `src/app/template-renderers.ts`, `src/app/template-renderers-plates.ts`, `src/app/template-renderers-extra.ts`, `src/app/template-renderers-mega-factory.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, smoke, acceptance/worklog validation) plus the templates gate proving one hundred unique bounded grammars and pruned kit membership, the extended overlap audit — now covering text against strokes, arcs, and rings — reporting zero findings at two element widths across four seeds, a glyph audit sheet confirming the re-eroded marks read at small sizes, and tile-by-tile review of both fifty-template contact sheets. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No performance-path changes — curation touches catalogs and geometry only.
- Risks: Posters saved with any of the hundred removed templates lose those elements on next load (the strongest equivalents remain available); dormant builder code stays in the bundle at a small size cost until a future cleanup; and the barcode-strip rename now lives in the emission step, so future pipeline re-runs must keep that mapping.

### Iteration 23 — Diversified mega variants and replacement of marked recipes

- Request: "надо пройтись по всем и убрать повторение элементов, также я отметил те которые мне не нравятся, я хочу сделать еще более разнообразные композиции еще раз ориентируйся на все референсы что я прислал выше" (sheet screenshot marking the dotted-arc megas and the second plate).
- Task type: Tier 3 batch (variant system expansion, recipe replacement, collision fixes, visual QA).
- User-visible result: The mega tier stops repeating itself. The center band now draws from thirteen lockups instead of eight — the marked dotted-arc variant is gone, replaced by a clustered halftone patch in the language of the reference map poster, and five new lockups join: a colon-spaced hero line (the ZE:RO:HO:UR register at display size over a double rule), a two-city pairing of label and code joined by a long rule with a center point, a thin orbit ring with a travelling dot and reticle, a dense diagonal particle band from the mesh reference, and a ruled data table beside a display numeral. Headers and footers each gain a sixth voice (a dotted leader line with a solid arrowhead; a thick-thin double rule with code, crosshair, and index), and a scattering variant map spreads headers, rails, centers, and footers so no two nearby templates share a silhouette — each center now appears at most four times across forty-two megas, under different frames. The two marked-adjacent plates are retired; their slots become Mega 41 and 42, fresh combinations from the expanded factory.
- Source/reference checked: The user's marked contact sheet, the reference boards (halftone world poster, particle mesh, specification plate), and a fresh fifty-tile mega sheet reviewed tile by tile after the rework.
- Reference inputs: None new.
- Docs/contracts read: Iteration 2 routed docs remain current (`renderer-technique.md`, `core/performance.md`).
- Contract rules applied: `performance-coverage-levels` (dot motifs stay bounded), `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged.
- Decision: Widen the factory's variant space and scatter the mapping (headers modulo six, centers modulo thirteen, rails and footers on offset strides) rather than hand-author forty compositions, so diversity comes from co-prime cycling while every id stays deterministic; the right-hand rails move into the outer margin gutter so right-anchored lockups never touch them, and the two conflict-prone new lockups fit their side content against the rails found by the audit.
- Alternatives rejected: Hand-picking a fixed layout per id (loses seeded variation and formats), keeping the dotted arcs with a new look (the user marked the motif itself), and re-rolling the plate factory for the two freed slots (its language is the one the user is moving away from).
- State/output mapping: Unchanged; `plate-01`/`plate-02` ids are retired like the other curated removals and their elements drop from stale layouts on load.
- Files changed: `src/app/template-catalog.ts`, `src/app/template-renderers-mega-factory.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, smoke, acceptance/worklog validation) plus one hundred unique bounded grammars, the extended overlap audit at two widths and four seeds reporting zero findings after three targeted fixes (gutter rails, ring-lockup caption clamp, table cell fitting), and tile-by-tile review of the new fifty-tile mega sheet confirming the marked motifs are gone and no silhouette repeats nearby. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No performance-path changes.
- Risks: The scattering map means neighboring ids no longer share family traits, so users who relied on "every fifth mega looks related" lose that rhythm; the halftone and band lockups push the heaviest megas to roughly two hundred primitives, still well under the bounded gate; and Mega 41/42 inherit the factory's future edits rather than staying frozen snapshots.

### Iteration 24 — Tier balance at fifty-two and a simple-card polish pass

- Request: "добавь в мега еще два варианта. оставь в Simple такое же количество как в мега и пройдись еще раз по всем карточкам в Simple".
- Task type: Tier 3 batch (two new mega lockups, catalog additions, per-card refinements, visual QA).
- User-visible result: Both library sections now hold fifty-two templates. The mega tier gains two genuinely new compositions: Mega 43 draws a registration grid — a hairline coordinate lattice across the center band with plus marks at intersections, one filled cell captioned with the code, and cryptic row labels off the right edge — and Mega 44 sets a certification lockup, the quality-assurance seal glyph beside the brand wordmark between a heavy and a hairline rule with a tag-and-code caption. The simple tier restores its two strongest curated-out grammars, Reticle and Scatter, and the second full pass over the simple cards refines the heavy ones: the totem now alternates solid and outlined stones, the morse row reads as fine code marks over a baseline rule instead of jumbo lozenges, the bar column keeps only its largest block solid, and the tool columns gain a hairline and large bold version numerals under small-cap names.
- Source/reference checked: Full-size renders of the two new megas and a fresh fifty-two-tile simple contact sheet reviewed card by card, with before/after crops of the four reworked tiles.
- Reference inputs: None new; the seal lockup uses the existing pack glyph library.
- Docs/contracts read: Iteration 2 routed docs remain current (`renderer-technique.md`).
- Contract rules applied: `controls-product-coverage` (Reticle joins the technical kit, Scatter the data kit), `performance-coverage-levels`, `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged.
- Decision: Give the two new megas dedicated center variants reached only by indices beyond the existing forty-two, so every previously reviewed mega keeps its exact look while the newcomers debut fresh lockups; restore rather than invent the two simple additions since Reticle and Scatter were the strongest cuts and rebalance the tiers without diluting the curation.
- Alternatives rejected: Remapping all centers across forty-four megas (would reshuffle compositions the user already approved), inventing two new simple grammars (the curated-out pool already held proven designs), and leaving the heavy simple cards as-is (the pass explicitly asked for another look).
- State/output mapping: Unchanged — new ids extend the catalog; restored ids resume their old persisted meaning.
- Files changed: `src/app/template-catalog.ts`, `src/app/template-renderers-mega-factory.ts`, `src/app/template-renderers-composite.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, smoke, acceptance/worklog validation) plus one hundred four unique bounded grammars with rebalanced kits, the extended overlap audit reporting zero findings at two widths across four seeds, and visual review of the new megas and the full simple sheet including the four reworked cards. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No performance-path changes.
- Risks: The registration-grid mega intentionally lets rail marks sit on its lattice when both occupy the left band, reading as cell icons; and the restored Reticle and Scatter return under their old ids, so stale layouts that once used them regain those elements.

### Iteration 25 — Selection ergonomics: Escape, outside click, multi-select, slider scaling, double-click editing

- Request: "давай починим приложение. при нажатии на ESC выделение должно убираться; при клике вне канваса выделение должно сниматься; чтобы можно выделить с зажатым шифтом несколько объектов и скейлить их; не работает слайдер скеил для выделенного объекта; когда выделил объект и зажал его для перемещения я ухожу в редактирование — редактирование двойным кликом только".
- Task type: Tier 3 batch (canvas interaction model rework with acceptance and browser-test updates).
- User-visible result: Escape now clears the selection from anywhere, not only while the canvas holds focus, and clicking outside the canvas — on the page chrome around it — deselects too, while clicks inside the control panel keep the selection alive so panel edits keep applying to it. Shift-clicking elements toggles them into a multi-selection shown with dashed outlines; dragging any member moves the whole group with snapping driven by the grabbed element, and Delete removes every selected element. The Scale slider finally acts on what is selected: with one or many elements selected it rescales them around their centers (returning the slider restores the original size), and with nothing selected it keeps its global meaning. Text editing no longer swallows drags — pressing and dragging an element always moves it, and the in-place text editor opens only on double-click.
- Source/reference checked: The interaction contract in the reference study (in-place text editing, direct move/resize) and the scripted scaling check proving center-anchored round-trip math.
- Reference inputs: None new.
- Docs/contracts read: Iteration 2 routed docs remain current (`acceptance-testing.md` for browser coverage naming, `core/control-selection.md`).
- Contract rules applied: `acceptance-product-observable` (the content-edit acceptance and browser step now describe the double-click gesture), `canvas-no-app-ui`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Sharpened — the canvas owns selection lifecycle (including global Escape and outside-click clearing through document listeners that exempt the controls panel), and the Elements panel's Scale slider now co-drives the selected elements' rects through the same authored-layout channel the canvas uses.
- Decision: Selection becomes an id list with the existing single-selection overlay preserved for one element and dashed outlines for groups; group moves reuse the primary element's snap resolution and apply its effective delta to the rest; slider scaling watches the scale value and, when a selection exists, commits center-anchored resizes as merged history under one group so dragging the slider reads as one undo step; text primitives stop capturing pointer-down entirely and expose only a double-click editor entry, which also cancels any half-started drag from the second click.
- Alternatives rejected: A separate per-selection scale control in the panel (duplicates the existing slider and splits attention), marquee multi-selection (not requested; shift-click covers the ask), storing selection in Toolcraft values (selection is view state and would pollute undo history), and pointer-down editing with a drag threshold (still steals quick drags and made the editor appear mid-gesture).
- State/output mapping: Unchanged targets — group moves, deletions, and slider scaling all write through `composition.layout` as authored elements; `elements.scale` keeps its persisted global value and the selection effect derives only relative ratios from its changes.
- Files changed: `src/app/micrographics-canvas.tsx`, `src/app/micrographics-canvas-utils.ts`, `src/app/element-svg.tsx`, `src/app/selection-overlay.tsx`, `src/app/app-acceptance-data.ts`, `e2e/app-canvas.spec.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, smoke, repro, acceptance/worklog validation) plus a scripted check proving selection scaling is center-anchored, round-trips to the original rect, and ignores unselected elements; the browser content-edit step now double-clicks the text line. Exact targeted proof — including the updated canvas browser suite — runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No renderer-path changes — the scene passes are untouched; only editor-layer interaction moved.
- Risks: The outside-click exemption list is selector-based (inputs, buttons, labels, the controls-panel shell), so a future custom panel surface outside those selectors would deselect on click until added; slider scaling composes multiplicatively through merged history, so extreme back-and-forth dragging can drift rect sizes by rounding pixels; and double-click editing is undiscoverable without the pointer cursor retained on text lines.

### Iteration 26 — Group selection frame with proportional corner scaling

- Request: "при выделении нескольких объектов исчезает скеил на канвасе, объекты должны работать с общим выделением и скеил работает на все объекты как в фигме".
- Task type: Tier 3 batch (group transform gesture, overlay extension, scripted math verification).
- User-visible result: A multi-selection now behaves like a Figma group. Around the dashed member outlines the canvas draws one common bounding frame in the selection blue with four corner handles and a group size chip; dragging any corner rescales every selected element together — positions and sizes map proportionally so the layout inside the group is preserved, the opposite corner stays anchored, and the whole drag lands as one undo step. Single-selection handles, measurements, and palette swatches are unchanged.
- Source/reference checked: A scripted geometry check proving the south-east drag scales members around the fixed north-west anchor and the north-west drag shrinks them around the fixed south-east corner exactly.
- Reference inputs: None new.
- Docs/contracts read: Iteration 2 routed docs remain current.
- Contract rules applied: `canvas-no-app-ui` (the frame lives in the editing-handle layer excluded from export), `acceptance-product-observable`, `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged — the canvas owns the group transform; it writes through the same authored-layout channel as single-element resizing.
- Decision: Model the group resize as a third gesture mode carrying the members' start rects and their start bounding box; each pointer move derives the new box from the dragged corner with the same clamping rules as single resize, then maps every member linearly into it, so elements keep their relative composition and template grammars relayout to their new rects; the overlay reuses the exact handle visual language (cursors, blue frame, size chip) so grouped and single selection read as one system.
- Alternatives rejected: Per-element handles on every member (ambiguous targets and no common frame), uniform-scale-only handles (single-element resize is already free-form, and templates relayout on any aspect), and rotating the group logic through the slider only (the user asked for on-canvas handles specifically).
- State/output mapping: Unchanged — group scaling writes authored rects into `composition.layout` as merged history.
- Files changed: `src/app/micrographics-canvas.tsx`, `src/app/micrographics-canvas-utils.ts`, `src/app/selection-overlay.tsx`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: Sandbox gates passed (typecheck, code health, product boundary, docs, integrity, smoke, acceptance/worklog validation) plus the scripted group-resize check proving anchor-fixed proportional mapping in both drag directions. Exact targeted proof runs through `npm run verify:delivery` on the host machine.
- Skipped checks: No renderer-path changes.
- Risks: Group scaling has no snap guides (single-element moves keep them), member rects round to whole pixels so repeated large shrink-grow cycles can drift internal gaps by a pixel, and very small members clamp at their minimum size before the rest, slightly compressing the layout at extreme shrink.

### Iteration 27 — Delivery-gate repair for text editing and tiered template coverage

- Request: "задеплой приложение также как и предыдущие".
- Task type: Tier 3 batch (interaction regression repair and browser acceptance correction discovered by the pre-deployment protected gate).
- User-visible result: Double-clicking an editable micrographic text line reliably opens the inline editor while press-and-drag still moves the element. The browser acceptance now exercises every Simple and Mega template through the template-library tier that actually renders it instead of waiting for hidden buttons.
- Source/reference checked: The failing protected delivery output, Playwright action trace for the BIG NUMBER text line, the live SVG event boundary in `MicrographicsCanvas`, and the real `Template set` filtering behavior in `TemplateLibraryControl`.
- Reference inputs: None; this repair follows the product's existing interaction contract and current UI.
- Docs/contracts read: `AGENTS.md`, `docs/toolcraft/workflow.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `decision-contract.md`, and `acceptance-testing.md`; the `systematic-debugging` workflow was used to isolate both failures.
- Contract rules applied: `canvas-handle-placement`, `interaction-surface-ownership`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Unchanged — the canvas owns element move and inline text editing, while the panel owns template discovery. Pointer capture now begins on the first actual move instead of on pointer-down, preserving both operations without mirroring them.
- Decision: Keep the move gesture armed on pointer-down but delay pointer capture and default prevention until pointer movement begins, so the browser can emit the native double-click event on text. Make the acceptance test select `Simple` or `Mega` from each template's canonical `templateTier` before locating its button, retaining full catalog coverage.
- Alternatives rejected: Synthesizing editing from click-count heuristics (duplicates native double-click semantics), widening text with extra transparent SVG hit geometry (adds renderer primitives and still leaves pointer capture competing with click), dispatching synthetic double-click events in the test (not a real user action), and removing the all-template loop (would weaken current coverage).
- State/output mapping: Pointer-down still records the same pending move gesture and pointer-move still commits `composition.layout`; native double-click opens the existing `TextEditorOverlay` and commits through the same authored layout. Template tier tabs only control which existing `library.template` buttons are visible; placement still writes the same template id and poster output.
- Files changed: `src/app/micrographics-canvas.tsx`, `e2e/app-canvas.spec.ts`, and this worklog.
- Performance intent: ordinary-product-work
- Verification: `npm run typecheck` passed. The focused real-browser run `playwright test e2e/app-canvas.spec.ts --grep "direct micrographics placement" --workers=1` passed all inline-edit, placement, drag/drop, and 104-template checks in 18.3 seconds. Delivery runs through `npm run verify:delivery` with `--tier=4`, `--browser-test="browser: direct micrographics placement"`, and the exact four impacted `poster-scene` selectors: `--performance-test="browser perf: toolcraft path performance-path:%5B%22initial-render%22%2C%22initial-render%22%2C%5B%22poster-scene%22%5D%2C%5B%22main%22%5D%2C%5B%22element-count%22%2C%22template-tier-weight%22%5D%5D"`, `--performance-test="browser perf: toolcraft path performance-path:%5B%22interactive-continuous%22%2C%22control-drag%22%2C%5B%22poster-scene%22%5D%2C%5B%22main%22%5D%2C%5B%22element-count%22%2C%22template-tier-weight%22%5D%5D"`, `--performance-test="browser perf: toolcraft path performance-path:%5B%22interactive-continuous%22%2C%22mask-drag%22%2C%5B%22poster-scene%22%5D%2C%5B%22main%22%5D%2C%5B%22element-count%22%2C%22template-tier-weight%22%5D%5D"`, and `--performance-test="browser perf: toolcraft path performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22poster-scene%22%5D%2C%5B%22main%22%5D%2C%5B%22element-count%22%2C%22template-tier-weight%22%5D%5D"`.
- Skipped checks: The separate full performance certification is not requested. The exact affected `poster-scene` mask-drag path is selected by the ordinary protected delivery gate.
- Risks: Delaying pointer capture until the first move relies on the initial move event occurring inside the SVG; `touch-action: none` on the root keeps touch drags owned by the canvas, and the protected browser scenario proves mouse drag plus double-click behavior. The all-template browser loop remains broad, but explicit tier selection keeps each locator reachable and the focused run completes quickly.

### Iteration 28 — Template drag runtime-highlight regression

- Request: "когда перетаскиваешь объекты на канвас все светится синим будто все выделено ... поправить оттестировать и снова залить в продакшен".
- Task type: Tier 3 interaction bug fix (native template drag crossing the runtime upload canvas).
- User-visible result: Dragging a template from the library across the canvas no longer turns the full workspace blue; the template still drops at the chosen poster coordinate, and Source Photo upload continues through its panel control.
- Verification tier: Tier 3.
- Verification reason: The defect exists only during an active browser drag before `drop`; the test must inspect the runtime canvas while the mouse remains pressed.
- Source/reference checked: The previous after-drop regression, `MicrographicsCanvas` MIME handlers, `TemplateLibraryControl` drag source, `CanvasShell` upload highlight flow, and the live local app.
- Reference inputs: None; this repair follows the existing deployed app and the user's observed drag behavior.
- Docs/contracts read: `decision-contract.md`, `core/runtime-boundary.md`, `component-rules.md`, `renderer-technique.md`, `acceptance-testing.md`, and `performance.md` for the broken-interaction route.
- Contract rules applied: `interaction-surface-ownership`, `acceptance-product-observable`, `canvas-surface-preserved`, and `workflow-required`.
- View interaction intent: `non-spatial`; unchanged.
- Interaction ownership: Template placement remains canvas-owned; source-photo import remains panel-owned through `source.image`. The overlapping generic runtime canvas upload surface will be disabled for this app.
- Decision: Test the held-drag interval over the outer canvas margin, then set `canvas.upload` to `false` so custom template drag never activates the generic file-upload overlay.
- Alternatives rejected: Another SVG bubble stop (cannot clear state entered before the SVG), product code that mutates runtime DOM state (boundary violation), and a custom pointer transport (unnecessary rewrite).
- State/output mapping: Template drop continues to write `composition.layout`; source-photo import continues to write `source.image` from the existing file-drop control.
- Files changed: `src/app/app-schema.ts`, `src/app/app-schema.test.ts`, `src/app/app-acceptance-data.ts`, `src/app/app-performance.ts`, `src/app/random-template-tier.test.ts`, `src/app/micrographics-canvas.tsx`, `src/app/poster-export.ts`, `e2e/app-canvas.spec.ts`, `e2e/app-controls.spec.ts`, `e2e/app-media-export.spec.ts`, `e2e/app-settings-transfer.spec.ts`, the root-cause design, the implementation plan, and this worklog.
- Performance intent: ordinary-product-work
- Verification: The red-phase placement check observed runtime `data-drag-over="true"` while the mouse was held over the canvas margin; the green focused scenario passed after the ownership fix. A combined real-browser run passed direct placement, source-photo lifecycle, background output, controls output, settings transfer, and export-handle exclusion: 6 scenarios in 26.5 seconds. `npm run typecheck` and `npm run ai:check` passed. The framework suite passed all 266 tests; targeted schema, random-tier, acceptance inventory, worklog, and performance tests passed. `npm run verify:kernel` records current-source SVG kernel evidence before the final unit/build run.
- Skipped checks: The separate full performance certification is not requested; `app-schema.ts` is a functional module in `app-performance-impact.json`, and no renderer pass or performance path changes.
- Risks: Files will no longer be dropped directly on the poster; the supported Source Photo panel upload remains available and already owns the full media lifecycle.

## Decisions

### Renderer

- Decision: Use semantic SVG preview with geometry batched by fill/stroke style, plus Canvas 2D only for raster export.
- Reason: SVG preserves crisp poster geometry and direct cluster hit regions; batching keeps high-detail scenes bounded without sacrificing vector preview fidelity.
- Evidence: `rendererPipelineRegistration` declares memoized `poster-scene` and export-only `export-png` passes; the renderer strategy assessment selects SVG over DOM, Canvas-only, and WebGL.

### View Interaction

- Decision: Use `non-spatial` view interaction with direct 2D cluster manipulation.
- Reason: The product has no 3D scene or camera; poster coordinates are the authored output.
- Evidence: Typed readiness declares `non-spatial`; browser acceptance proves draw-region placement, movement, resize handles, and text selection.

### Timeline

- Decision: Omit the timeline.
- Reason: The requested product is a still poster generator with PNG/JPG output and no motion or video export.
- Evidence: `animationIntent.mode` is `none` and no timeline panel is declared.

### Layers

- Decision: Omit the runtime Layers panel.
- Reason: Background media, micrographics, text, and editor handles form one composited poster workflow rather than independently managed user layers.
- Evidence: No layers panel is declared; export explicitly excludes the editing-handle SVG group.

### Controls

- Decision: Group controls by Composition, Template Library, Elements, Global Color, Palette, Source Photo, Background, and Image Export; Template Library uses a justified custom tile renderer while the remaining controls use built-ins, with the palette owned by a CollectionActions color list.
- Reason: Sections follow product entities and workflow stages. The panel owns template discovery/arming, while the poster owns the insertion coordinate or region.
- Evidence: `appControlSectionInventory`, custom-control fit coverage, every visible template tile, all five kit options, the Global Color and Palette controls, generator controls, and compose commands have unit and browser evidence.

### Interaction Ownership

- Decision: Canvas owns element insertion coordinates/regions, selection, movement, corner-handle resizing, inline text editing, palette-swatch recoloring of the selected element, and Delete-key removal; the panel owns template discovery/arming, generation parameters, the global color and palette list, media, background, and export.
- Reason: This preserves direct poster manipulation while keeping the template palette and all application chrome out of product output.
- Evidence: Typed `interactionOwnership` entries map each capability to one primary surface; browser acceptance proves tile-click placement, tile drag-and-drop, one-shot selection reset, transforms, inline editing, and export-clean handles.

### Export

- Decision: Export PNG or JPG through `createToolcraftPngExportCanvas` at the selected 2K/4K/8K long edge.
- Reason: One standard helper keeps output size, transparent PNG background, and runtime canvas scaling aligned.
- Evidence: Browser tests decode downloaded files, verify MIME/extension/dimensions, prove transparent pixels when Background Include is off, and prove editing handles are absent.

### Performance

- Decision: Bound workload at sixteen elements, use a memoized vector-build pass, batch compatible geometry into SVG paths per element, and isolate export as a non-cached call-scoped pass.
- Reason: Element count is the single dominant interactive workload — every element contributes a bounded template grammar of primitives; viewport operations must not invalidate scene construction.
- Evidence: The envelope declares `element-count` 8→16 with schema-backed boundaries; canonical derived paths have real UI adapters and compiled fixtures; the SVG kernel benchmark harness measures bounded scene construction at the element envelope. The memoized scene pass declares its real schema-target and canvas-size cache keys, so changing inputs records a new generation while media and viewport reuse remains provable. Final prototype-smoke evidence is delegated to `verify:delivery`; no complete performance certification is claimed.

## Verification

- Run: node scripts/check-toolcraft-code-health.mjs
- Run: node scripts/toolcraft-product-boundary.mjs --allow-missing-compiler
- Run: node scripts/check-toolcraft-docs.mjs
- Run: node scripts/check-toolcraft-integrity.mjs
- Run: node --test scripts
- Run: npm run typecheck
- Run: npm run verify:delivery
- Run: npm run dev
- Result: Code health (20 files), product boundary (12 product production files), local docs, integrity (582 files), 264 framework script tests, and typecheck all passed in the working sandbox for the iteration 2 rebuild. The protected `npm run verify:delivery` gate and `npm run dev` run on the host machine; the sandbox npm registry blocks the platform-specific Vitest/Playwright binaries, so browser acceptance and the delivery receipt are executed there.
- Skip: `npm run verify:perf`; the user did not request the separate complete performance audit.

## Evidence

- Source reviewed: `src/app/app-schema.ts`, `src/app/poster-model.ts`, `src/app/template-catalog.ts`, `src/app/template-renderers.ts`, `src/app/micrographics-canvas.tsx`, `src/app/poster-export.ts`, the uploaded MICROGRAPH interface recording (frame-by-frame), sampled Figma corpus nodes, and the six supplied poster references.
- Contract applied: `runtime-shell-required`, `canvas-no-app-ui`, `interaction-surface-ownership`, `output-export-required`, `video-reference-analysis`, `acceptance-product-observable`, `performance-coverage-levels`, and `persistence-policy-explicit`.
- Evidence: Unit tests cover deterministic template grammar construction, authored-layout precedence, and color normalization; Playwright covers controls, media, background alpha, export bytes, direct canvas transforms with delete, and persistence; the canonical performance pipeline and kernel harness cover renderer cost and invalidation.

## Risks

- Risk: The template grammars reproduce the reference system's element vocabulary and content structure but intentionally generate new deterministic content, not copies of the recorded posters.
- Risk: Extremely long user content lines can exceed a template's rect; renderers clamp row counts but keep authored content editable rather than silently truncating it.
- Risk: Per-element property editing without JSON (opacity/content of the selected element in the panel) is deferred; individual element color is now edited through the canvas palette swatches.


## 2026-08-05 — Canonical product identity and deployment path

- User-visible result: Renamed the standalone product to `Micrographics` and aligned its repository package plus public demo base to `micrographics`. Product rendering, controls, defaults, and export behavior remain unchanged.
- Request: Apply the approved complete rename across code, folders, gallery identity, and deployment wiring without preserving old route aliases.
- Source/reference checked: The approved complete-app-renaming design and implementation plan, the current standalone package metadata, Vite/router base handling, `vercel.json`, identity metadata, and active acceptance/deployment assertions.
- Contract rules applied: Broad identity/deployment migration because the directory and public deployment identity change across the generated app boundary. Existing product-domain modules remain semantically named; the external Vercel stage must retain the current Project ID.
- State/output mapping: Package name, HTML title, control/acceptance identity, persistence/settings-transfer namespace where present, Vite base, public asset prefix, and Vercel rewrites now use `micrographics`. Changed persistence namespaces intentionally reset prior browser-local settings.
- Verification: Canonical package/title/base audit and every available standalone `demo-deployment.test.mjs` passed for this migration batch.
- Risks: Old demo paths are intentionally absent; no compatibility redirect is retained.

## Decision Trail — 2026-09-09 production cover paths

Request: Check all projects for deployment readiness, public Vercel access and working Open App links.
Task type: Ordinary deployment-path bug fix; Tier 2 functional preset URL mapping.
User-visible result: Built-in cover photos resolve inside the app's configured production base instead of requesting the website root.
Source/reference checked: Anonymous startup through the built Next.js /demos/micrographics rewrite produced eight /covers JPEG 404s; template-covers.ts used root URLs and vercel.json omitted the prefixed covers directory.
Reference inputs: Existing Micrographics production deployment and local production website; no external design reference.
Docs/contracts read: AGENTS.md; workflow.md; decision-contract.md; core/runtime-boundary.md; component-rules.md; renderer-technique.md; acceptance-testing.md; performance.md.
Contract rules applied: runtime-shell-required, controls-product-coverage, acceptance-product-observable, workflow-required. Signed runtime and bootstrap remain unchanged.
View interaction intent: Existing non-spatial poster interaction unchanged; no new view control or operation.
Decision: Prefix each preset with import.meta.env.BASE_URL and route the covers directory before the Vercel SPA fallback.
Alternatives rejected: Adding global /covers website routes would hide the app deployment bug and couple the website to app internals. Recompressing images is unrelated and would risk source fidelity.
State/output mapping: source.preset selects the existing preset id; coverPresetSrc now resolves its JPEG under the configured base for both the picker and SVG poster. Root development paths remain identical.
Files changed: src/app/template-covers.ts; src/app/template-covers.test.ts; vercel.json; this worklog.
Verification: Root and nested-base unit cases reproduce the bug before the fix and pass after it. Production build and focused browser/delivery checks are recorded in ../../../../output/deployment-readiness-2026-09-09/.
Skipped checks: Full performance certification and unrelated renderer/media/export changes; only functional path mapping changed, and no source image bytes changed.
Risks: The fixed Micrographics app must be deployed before the new website is published; the existing remote app still uses old root cover paths. Protected delivery result follows below.

Deployment-readiness verification result: the two base-path unit tests, two deployment-route tests, production TypeScript/build, all eight decoded JPEG presets at /demos/micrographics/, and the existing `browser: sports cover presets update poster` test passed. The browser test had a stale micrographics-poster selector; corrected it to the renderer's existing micrographics marker. Node-side schema consumers use the root base fallback when Vite's import.meta.env is absent. Public JPEG bytes are unchanged.

Protected delivery did not pass. There is no current delivery anchor, so the runner selected prototype mode; targeted arguments were rejected, then the normal prototype gate reached 266 passing script tests and 317/319 passing Vitest tests. It stopped on a stale current-source kernel receipt and the worklog validator's requirement for a recorded passed delivery. No successful receipt was fabricated, and full performance certification was not requested or run. See micrographics-delivery-final.log in the audit output. This is a verified focused fix, not a claim that the complete application release gate passed.
