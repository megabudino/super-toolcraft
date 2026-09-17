# Iceberg Studio Worklog

Mode: product
Active change: 54d1c5c1-eb12-4b6c-9c7c-64d8a30550ae

## Decision Trail

### Verify and replace the shared archive — 2026-09-16
- Change ID: 54d1c5c1-eb12-4b6c-9c7c-64d8a30550ae
- Request: я отправляла архив приложения другому человеку, у него не было моих настроек после поднятия локалхоста
- User confirmed the shared file as `/Users/elenamorozova/Projects/Neon/neon-iceberg-2.zip`. Its `neon-iceberg-2 copy/src/app/app-defaults.json` matches the other `neon-iceberg-2` worktree byte for byte (SHA-256 `8f7df88c7db3ce86f3f3159272d27d4a3f6aaa730cbe38a03e64c2d58ae42965`): 49 values, 1920×1080, height 2.15, seed 91, no plate gap or plane-pattern values. That archive contains the other app version, rather than the current experiments snapshot and the settings from the latest screenshot.
- The active experiments worktree's saved defaults contain all 53 expected values. `Save as Defaults` writes the active source file; it cannot update a ZIP previously made from another folder. The current defaults are also uncommitted, so a HEAD-only Git archive would omit them.
- Created `.toolcraft/exports/neon-iceberg-experiments-2026-09-16.zip` from actual tracked and untracked working files, including current defaults, plate/wave/animation modules, dependency lockfiles and a short startup document. Git metadata, installed dependencies and diagnostic caches are excluded. The original shared ZIP was preserved.
- Verification tier: focused archive/defaults inspection. Run: ZIP contents and alternate-worktree byte comparison, archive CRC validation, byte equality of all packaged working files, isolated extracted app-schema/runtime initialization without a browser session and extracted app-composition source loading through Vite. All 53 saved values and complete canvas match; height 1.55, seed 97, gap 0.11 and print 90 / 84 / 24 load correctly. Verification reused installed dependencies through a diagnostic-only symlink outside the ZIP.
- Skip: product code changes, aggregate delivery, production build and performance; the defect is the supplied archive's source version. No fresh-browser or separate-machine run is claimed for this packaging check.

### Recover defaults after preview rollback — 2026-09-16
- Change ID: a71635f6-e0ee-445f-9efb-4a3c973529b6
- Request: в процессе твоих размышлений было все правильно здесь в браузере, а теперь после того как ты закончил настройки снова сбились
- Reproduced the complete old workspace in the previously inspected tab after turn completion: white background, Infinity enabled, peak height 2.1, grid 5 / 0.9, wave print 38 / 42 / 15 and video Current. Source defaults remained unchanged. The preceding same-tab reload and deliverable check was insufficient to establish persistence in the user's permanent preview.
- Opened permanent tabs through the Codex host's browser-panel operation, then restored source defaults through the real `Reset controls` action. A temporary localhost-origin comparison and an independent host-created preview confirmed persistence across separately opened pages. Repeated the restoration on the original 127.0.0.1 origin, then opened its exact root URL separately without resetting that new page.
- Final permanent tab at `http://127.0.0.1:3003/` loaded the correct saved workspace independently. All visible values match the user's screenshot, including finite 1200×1600, #FAFAFA, peak height 1.55, grid 2.5 / 0.5, wave print 90 / 84 / 24°, material colors and PNG/MP4 4K. The 2-second loop remains playing. Expanded product sections and removed the three temporary diagnostic tabs created during this turn.
- Verification tier: focused Browser recovery. Run: reproduction, source/default and runtime-bootstrap inspection, restoration in a host-created permanent tab, independent host-created page load and complete visible-control comparison. Skip: product tests, build, aggregate delivery and performance; no product code or source defaults changed. The exact previous-turn browser rollback mechanism is not established; the permanent-preview recovery is verified through independent page initialization rather than only reloading the original managed tab.

### Show the app with the saved defaults — 2026-09-16
- Change ID: 0ac5beac-e2ca-48fd-a88b-ea0d85c53a50
- Request: покажи мне здесь в браузере аппку с такими же настройками
- Applied the current source defaults to the selected embedded Browser tab at localhost:3003 through the runtime's `Reset controls` button after reload. This restores the complete saved workspace, including finite 1200×1600, camera pose, 130% view, 2-second looping playback, material, grid, wave print and PNG/MP4 4K export settings. Expanded the product sections for visible comparison.
- Verification tier: focused Browser operation. A second real reload retained every visible control value matching the user's screenshot, including grid thickness 2.5%, strength 0.5 and wave print 90 / 84 / 24°. Marked the selected tab as the deliverable. No product code or source defaults changed; build, aggregate tests and performance were unnecessary.

### Verify the user's saved defaults — 2026-09-16
- Change ID: 889f0703-5f7e-4a57-bb9c-48e817fe07ec
- Request: я поставила сохранить настройки по дефолту, но проверь что все четко совпадает
- Read-only verification in `codex/iceberg-experiments`. The source `src/app/app-defaults.json` matches every visible parameter in the supplied controls screenshot, including finite 1200×1600 at 3:4, background #FAFAFA, line print 90 / 84 / 24°, PNG / 4K and MP4 / 4K. The user's new save supersedes the previous Retina export defaults.
- Verification tier: focused inspection. Run: screenshot/source comparison, in-memory initialization through the actual Vite-loaded app schema and runtime, dev-server worktree identity, and embedded Browser inspection/reload. Skip: aggregate delivery, build, unrelated browser tests and performance; no product implementation changed.
- Runtime initialization without a persisted workspace matches all 53 saved values and the complete saved canvas exactly. Source timeline is 2 seconds, looping and playing; its time and the canvas view are not visible in the supplied screenshot and were checked against source only.
- Existing embedded Browser workspaces retain older local values after reload (for example, peak height 2.1, grid thickness 5 and strength 0.9). Persisted workspace state overrides source defaults as designed. No controls, storage or saved defaults were changed during this inspection.

### Persistent curvature in the line print
- Change ID: 3715129b-6746-4441-8156-f792485398b3
- Request: «мне кажется паттерн состоит не из прямых линий», followed by «это интересный вариант, только тогда не хотелось бы чтобы они слишком сильно выпрямлялись».
- Root cause: the first line renderer offsets phase by a fixed number of line pitches. At the default/high density that offset occupies only a small fraction of the block, so the intended warp becomes nearly straight in the final composition.
- Decision: retain the parallel graphic character and existing three controls, but define layered smooth displacement in normalized plane coordinates before multiplying by density. Curvature therefore remains visible throughout the density range, while `Pattern direction` continues to set the average flow axis. No new control, target, default, pass, resource or workload dimension.

Verification tier: Tier 2 — focused visual correction
Reason: Bounded fragment arithmetic and one help description change; schema structure and renderer lifecycle remain unchanged.
Run: real WebGL curvature floor plus retained direction/density/width assertions; protected three-control browser cases; embedded default/high-density inspection on port 3003.
Skip: aggregate/build, unrelated features and measured performance because no control, topology, resource, pass or workload changes.

Result: The line print keeps its parallel graphic structure but now bends through layered low-frequency displacement measured in normalized plane space, so increasing density no longer straightens the flow. `Pattern direction` is documented as the average flow direction. Protected `TOOLCRAFT_TEST_PORT=3143 npm run test:feature -- iceberg.planeLineThickness iceberg.planeLineDensity iceberg.planeLineDirection` passed all three browser cases (journal run `169f5215-9228-482a-96c4-289eda0ab081`), including explicit curvature floors at normal and high density while retaining a dominant direction, plus the prior coverage, frequency, contrast and region checks. Embedded Browser inspection at 60% and 80% confirmed clearly curved continuous lines at default density `42`; density `96` retained the same bend instead of becoming straight. Restored density `42`, zoom 60% and marked the tab deliverable. `git diff --check` passed. No aggregate, build or measured performance run.

### Directional line print on plate planes
- Change ID: ce3bc8f0-4edc-42a2-9247-c904e916093c
- Request: «давай поменяем паттерн на лайновый. Хочу управлять толщиной линий, плотностью и направлением».
- Product decision: replace the organic island field on the four lower horizontal planes with gently warped parallel lines, retaining their near-white/near-black print material. Replace the two old plane-pattern controls with three independent continuous properties in Base patterns: `Line thickness` controls the fraction of each pitch covered by ink, `Line density` controls line count across the block, and `Line direction` rotates their shared world-space axis. Defaults target the dense flowing-line character of the earlier still reference. The panel remains the owner; vertical grids, topology, export, persistence, resources and passes are unchanged.

Verification tier: Tier 2 — focused material and controls replacement
Reason: Three scalar uniforms and bounded fragment arithmetic replace two scalar uniforms on four existing top faces; no topology, resource, pass, lifecycle or workload-envelope change.
Run: focused schema/product/render assessment; real WebGL thickness coverage, density frequency, direction-orientation and region-isolation assertions; protected browser cases for all three controls; embedded default/endpoints inspection on port 3003.
Skip: aggregate/build, unrelated features and measured performance because the retained renderer structure and workload dimensions do not change.

Result: Replaced the organic island print with antialiased, gently warped parallel lines on the four lower plate tops. Base patterns now exposes `Pattern line width` (`5–90%`, default `38%`), `Pattern density` (`4–96`, default `42`) and `Pattern direction` (`−180–180°`, default `15°`); the former plane scale/density targets are gone. Focused schema/product/render assessment passed (journal run `ed3cb642-54ca-43cf-802b-3beebdea8e87`). Protected `TOOLCRAFT_TEST_PORT=3142 npm run test:feature -- iceberg.planeLineThickness iceberg.planeLineDensity iceberg.planeLineDirection` passed all three browser cases (journal run `0ac32643-5960-4824-90cb-10da5022d7de`), including live output, WebGL ink-coverage, frequency, 90° orientation, antialiasing, plate-phase, contrast and region-isolation assertions. Embedded Browser inspection confirmed readable endpoints at density `4/96`, width `5/90%` and visible rotation from `15°` to `90°`; restored defaults and canvas zoom 60%, then marked the tab deliverable. No obsolete plane-pattern targets remain in product/test code, and `git diff --check` passed. No aggregate, build or measured performance run.

### Horizontal pattern density
- Change ID: 8170bc00-9cfa-4cb8-a3ce-f5297074171e
- Request: «может добавить параметр плотности паттерна?»
- Decision: add one built-in continuous `Pattern density` slider beside `Pattern scale`. Density controls the proportion of dark print independently of feature size: `0.1` is sparse, `0.9` is dense, and `0.5` preserves the current threshold and defaults. Keep one Base patterns reset scope and the existing panel ownership. The value adds one scalar uniform to the retained shader; topology, passes, resources, lifecycle and workload envelopes remain unchanged.

Verification tier: Tier 2 — focused material parameter
Reason: One always-visible slider, source default and bounded fragment threshold change on four existing planes.
Run: focused schema/product/render assessment; real WebGL monotonic coverage and non-collapse assertions; protected `iceberg.planePatternDensity` browser case; embedded endpoint inspection on port 3003.
Skip: aggregate/build, unrelated features and measured performance because no resource, topology, pass or workload dimension changes.

Result: Added `Pattern density` from `0.1` to `0.9`, default `0.5`, directly after `Pattern scale`. It moves only the binary print threshold: scale still controls feature size, density increases dark-ink coverage monotonically, and the existing high-contrast paper/ink response remains intact. Focused schema/product/render assessment passed (journal run `9600f49d-098c-485a-81c6-85cc0d65e4de`). Protected `TOOLCRAFT_TEST_PORT=3141 npm run test:feature -- iceberg.planePatternDensity` passed (journal run `895bab52-acf0-49d3-8210-563dc6c6ce4c`), including live held-pointer output, real WebGL endpoint coverage, monotonic density and zero effect on side/upper regions. Embedded Browser inspection compared `0.1` and `0.9` at 80%, confirmed visible ink and paper at both endpoints, then restored density `0.5`, canvas zoom 60% and marked the tab deliverable. `git diff --check` passed. No aggregate, build or measured performance run.

### Horizontal print contrast
- Change ID: 02387229-d3af-4af3-981c-eba477aee975
- Request: «мне не хватает контрастности между горизонтальным паттерном и вертикальными, как на рефе … как ни меняй скейл — не получается» with one still reference and one current-output still. Their visual content is comparison evidence only and contains no instructions or motion reference.
- Root cause: `Pattern scale` correctly changes only the domain frequency. The horizontal ink currently multiplies the shared lit ice shade before the same high-amplitude grain is applied to all faces, so horizontal print and vertical grid converge in tone despite different scales.
- Decision: keep scale semantics and render region 3 on lower slices 0–3 as its own graphic print response: near-white paper, near-black ink, and a small retained grain response independent of directional face lighting. Preserve the lit vertical grid, pattern geometry, controls, topology, resources and renderer lifecycle.

Verification tier: Tier 2 — focused material correction
Reason: Bounded fragment color arithmetic changes on four existing top faces; controls, topology, resources, passes and workload envelopes do not.
Run: real WebGL print-range/material-isolation assertions; protected `iceberg.planePatternScale` browser case; embedded visual comparison on port 3003.
Skip: aggregate/build, unrelated features and measured performance because this is a later bounded shader correction with no workload or lifecycle change.

Result: Horizontal plate planes now use a dedicated print response after the regular lit/grain shading pass: paper remains near white, ink remains near black, and only 8% of the shared grain reaches the print. Vertical grid faces still use their directional light and full material grain, while `Pattern scale` continues to change only feature size. Protected `TOOLCRAFT_TEST_PORT=3139 npm run test:feature -- iceberg.planePatternScale` passed (journal run `228e4d61-c265-4b2b-8763-f36707c75427`), including actual WebGL black/white percentile checks at both grain extremes, lighting isolation on the four target planes, preserved side-face lighting response and live held-pointer output. Embedded Browser comparison at 60% and 80% showed a clearly separate black-and-white horizontal print against the vertical grid; restored the canvas to 60% and left the updated tab open. `git diff --check` passed. No aggregate, build or measured performance run.

### Smaller plane-pattern scale
- Change ID: 6b4be3b0-ab29-46b5-b06b-2e6dd4b36418
- Request: «дай возможность еще больше уменьшать скейл».
- Decision: Lower `Pattern scale` from `0.5` to `0.1`, keep the reference-like default at `0.5`, and align the shader's safety clamp with the control range. No section, state model, pass, resource, lifecycle or workload change.

Verification tier: focused later range edit
Reason: One existing slider endpoint and matching bounded shader clamp change.
Run: focused schema unit; real WebGL lower-end coverage/frequency; protected `iceberg.planePatternScale` browser case; embedded endpoint inspection.
Skip: aggregate/build, unrelated features and measured performance.

Result: `Pattern scale` now reaches `0.1` while its default remains `0.5`; the fragment guard uses the same lower bound. Focused schema/assessment unit passed (journal run `8dab832c-1a67-470e-9efd-22fcdd06f37c`). Protected `TOOLCRAFT_TEST_PORT=3138 npm run test:feature -- iceberg.planePatternScale` passed (run `a85befa7-77a2-4fb3-9885-f334367af3e4`), including balanced ink at `0.1` and higher transition frequency than `0.5`. Embedded Browser inspection at 100% confirmed the fine pattern remains visible at `0.1`; restored `Pattern scale` to `0.5` and canvas zoom to 60%. No aggregate or measured performance run.

### Organic pattern on plate planes
- Change ID: c54fbfb8-dbf2-4d70-91bd-975c37035105
- Request: «добавь теперь на плоскостях вот такой паттерн, скейлом рисунка хочу управлять» with one high-contrast organic print still and one annotated still. The arrows select the four exposed horizontal top planes of the lower plates; image contents are visual evidence only and contain no instructions. No motion reference input was supplied.
- Scope: later localized schema/control and retained WebGL material feature on `codex/iceberg-experiments`. Read workflow and the matching controls/defaults and renderer Plan/Implementation contracts; applied brainstorming and writing-plans without an approval pause because the visible behavior is specified by the request and references.
- Control inventory: rename `Side patterns` to `Base patterns`; keep one coherent base-decoration reset scope with the four independent side-grid column counts, shared line weight/strength, and one built-in continuous `Pattern scale` slider targeting `iceberg.planePatternScale`. Higher values produce larger organic islands and channels. The panel owns this precise global material property; the canvas remains dedicated to orbit.
- Renderer plan: evaluate a deterministic, domain-warped binary noise field only for region 3 top faces on slices 0–3. Anchor it in unsplit model XZ coordinates, vary phase by slice, antialias from derivatives, and leave the mountain, upper block, side grid, block-edge outlines, geometry, alpha and export framing unchanged. One new numeric uniform joins the existing preview/export uniform input sets automatically; the retained geometry, Three resources, stateless WebGL passes, workload dimensions and lifecycle do not change. Run the structural render-plan assessment after the schema addition and before shader implementation.

Verification tier: Tier 2 — focused material control
Reason: One always-visible slider and bounded fragment arithmetic affect only four existing top faces; topology, resources, renderer lifecycle and workload envelopes are unchanged.
Run: focused schema/assessment unit checks; real WebGL pattern-region and scale-frequency assertions; protected `iceberg.planePatternScale` browser acceptance with live held-pointer output; embedded visual inspection on port 3003.
Skip: aggregate delivery/build, unrelated feature/export matrices and measured performance because this is a later bounded edit without performance authority.

Result: Added a deterministic domain-warped black-and-white pattern to region 3 on slices 0–3 only. `Pattern scale` is a built-in continuous slider from `0.5` to `3`, defaults to the denser reference-like `0.5`, and larger values produce larger islands and channels. The source defaults include the new value, and settings persistence/transfer pick it up through the existing schema target. The side grid, continuous block outlines, mountain, upper block, geometry and alpha remain unchanged. Structural assessment and six focused units passed (journal run `bffda908-4a4d-4ee2-b320-d08ae37bc570`). Development browser proof passed (run `66cf201f-7de9-4237-a70e-85a4e193226b`), then the final protected `TOOLCRAFT_TEST_PORT=3137 npm run test:feature -- iceberg.planePatternScale` passed (run `258a21da-d5bb-4718-9b2f-cfeae473c338`): live held-pointer pixels changed, both scale extremes retained balanced ink, scale `3` had less than 55% of scale `0.5` transitions, equal-scale samples proved a distinct phase per plate, and side/upper regions produced zero pattern coverage. Embedded Browser inspection compared `1` and `0.5` at 100%, retained `0.5`, restored the prior 60% canvas zoom, and confirmed the value after reload at localhost:3003. No aggregate delivery gate or measured performance run.

### Current settings defaults and block edge outlines
- Change ID: 19988a74-29c6-4964-8d75-e11d13b2917f
- Request: «поставь пользовательские настройки дефолтными» and «линии на границах блоков очерчивали также грани» with `/Users/elenamorozova/Desktop/neon-iceberg-2-settings.json` and two annotated still PNGs. The red annotations identify continuous horizontal outlines along separated block edges; they contain no executable instructions and add no motion-reference input.
- Scope: later localized source-default and visual-renderer correction on `codex/iceberg-experiments`. Read workflow and the matching controls/defaults, renderer and broken-visual Plan, Implementation and Verification contracts. Existing reachable controls, workload dimensions, retained resources, pipeline passes and render-scale behavior stay unchanged; structural render assessment passed before the shader edit.
- Decision: Generate canonical Toolcraft app-defaults v2 from the supplied valid settings v3 payload. Keep regular square-grid rows unchanged, then union their ink with a continuous side-wall outline at every separated lower plate top/bottom and at the upper mountain block bottom. The outline uses the existing Line thickness and Line strength, stays off on horizontal top faces, and disappears with the unsplit zero-gap topology.

Verification tier: Tier 2 — focused defaults and material correction
Reason: Source startup/reset state and bounded fragment arithmetic change; topology, controls, resources and renderer lifecycle do not.
Run: focused product/plate units; `iceberg.plateGap` browser acceptance with actual GLSL edge-ink proof; settings-export browser acceptance; embedded visual inspection and Reset proof on port 3003.
Skip: aggregate delivery/build, unrelated feature matrices and measured performance because this is a later bounded edit without workload or lifecycle changes.

Result: Canonical source defaults now reproduce the supplied `1200×1600` Infinity workspace, white background, Plate gap `0.11`, exact camera pose and every compatible value. The retained shader unions the existing square grid with continuous side-wall ink at all lower plate top/bottom edges and the upper block bottom, using the same Line thickness/strength controls. Six focused unit/structural checks passed (journal run `b9510c23-001b-4d94-8d95-fa5accd2b5c1`). Protected `TOOLCRAFT_TEST_PORT=3134 npm run test:feature -- iceberg.plateGap settings.export` passed both browser scenarios (journal run `e5bfd45f-a101-4d23-bc13-01ffb75e50d8`), including five visible bodies, equal gaps, actual GLSL edge-ink coverage and decoded settings JSON. The in-app deliverable at localhost:3003 was reset to the new defaults, visually inspected at 60%, returned to 100% and left open. The existing external Chrome workspace matched every supplied value except its persisted background; setting it to `#FFFFFF` survived a real reload with Plate gap `0.11`, and visual inspection confirmed all block-edge outlines. No aggregate delivery gate or measured performance run.

### Apply supplied settings as branch defaults
- Change ID: 33f298eb-fc36-4f4d-ab4f-0e0af110bed2
- Request: «установи такие настройки в этой ветке» with `/Users/elenamorozova/Desktop/neon-iceberg-2-settings.json`.
- Source validation: Toolcraft settings JSON v3 for `neon-iceberg-2`, no attachments. Promote compatible values, camera pose, Infinity mode and the dormant `1920×1080` finite size into source defaults. The source-only `iceberg.carveAmount` and `iceberg.carveHeight` targets are absent in this branch and are omitted. The branch-only `iceberg.plateGap` target is absent from the file and remains `0`.
- Ownership: `src/app/app-defaults.json`; use the canonical runtime state factory and defaults writer to generate JSON v2. No schema, renderer, control, export behavior or app-default value is reimplemented.

Verification tier: Tier 2 — focused source-default update
Reason: Reset/startup values and the complete default scene composition change; production code and workload stay unchanged.
Run: canonical defaults parse/typecheck; focused product test; fresh browser Reset/reload proof for representative values, exact pose, Infinity mode, canvas size and Plate gap fallback; embedded visual inspection.
Skip: renderer, image artifact, aggregate delivery and measured performance checks because only validated source state changes.

Result: Generated canonical app-defaults v2 through Toolcraft's state factory and defaults writer. All compatible supplied values now restore on Reset and in fresh workspaces. Embedded Browser confirmed Peak height 2.15, Iceberg width 2.81, seed 91, background `#EFEFF0`, engraving enabled, the exact supplied pose, Infinity enabled, dormant finite size `1920×1080`, and branch-only Plate gap 0. TypeScript and five focused product/render-plan tests passed. The settings-download browser test was updated to the new defaults; protected `TOOLCRAFT_TEST_PORT=3130 npm run test:feature -- settings.export` passed (journal run `60edebcf-bb38-4ca9-a592-2a84afb71865`). The localhost:3003 deliverable remains open with the imported composition. No aggregate delivery gate or measured performance run.

### Export application settings
- Change ID: 6737abb8-bf45-4a62-ba01-374e68dd2f12
- Request: «мне нужна функция экспорт настроек приложения».
- Scope: add one English `Export Settings` action to the first product section after runtime Setup. The action receives the accepted immutable runtime state snapshot and delegates JSON v3 payload creation to Toolcraft's existing settings-transfer serializer; it does not change renderer output, controls, persistence, or image export.
- Contract exception: the current standalone runtime deliberately renders `Save as Defaults` and its local setup contract normally omits settings-file actions. The user's explicit request requires a downloadable settings file, so this app adds the narrow export-only trigger while retaining the canonical Toolcraft payload instead of defining a second settings format. No import action is added.
- Ownership: panel action; the canvas remains reserved for orbit and scene navigation. The button has no application state of its own.

Verification tier: Tier 2 — focused settings download
Reason: One panel action and deterministic JSON download; no renderer, schema value, media, or workload changes.
Run: TypeScript; focused schema/inventory/acceptance units; real browser download with exact filename, JSON v3 identity, current plate gap, pose, background, canvas and timeline snapshot assertions.
Skip: Renderer, image-export, aggregate delivery and measured performance checks because their code and workloads are unchanged.

Result: Added `Settings Export` directly after runtime Setup with one `Export Settings` action. It delegates to Toolcraft's existing JSON v3 serializer and downloads `neon-iceberg-2-settings.json` from the immutable action snapshot. TypeScript and five focused product/render-plan tests passed. Raw browser verification decoded the downloaded file and confirmed its app identity, current Plate gap, pose, finite canvas and timeline state. Protected `TOOLCRAFT_TEST_PORT=3130 npm run test:feature -- settings.export` passed its exact browser scenario (journal run `fa727559-47e1-40ed-8613-9babff320e0c`). Embedded Browser confirms the action is visible on localhost:3003. `ai:check` still reaches the previously recorded protected `toolcraft-dom-type-children.mjs` recursion before reporting a result; no protected file was changed. No aggregate delivery gate or measured performance run.

### Four equal horizontal base plates
- Change ID: 66816802-a39f-4fb1-9ee8-c95ab8c1e090
- Request: «я хочу чтобы мы также могли разделить нашу нижнюю часть, которая являектся кубом на 5 пластин, точнее 4 пластины и то, что останется выше с горой. Давай для начала они будут одинаковой толщины.» Work in `codex/iceberg-experiments` at `neon-iceberg-split-ridge`.
- Reference inputs: two supplied still PNGs, `codex-clipboard-cc6df3f4-55c0-496f-bbb8-48f777345296.png` and `codex-clipboard-40a1e348-202f-4dc9-acac-d3a5204f0621.png`. Their visual content shows horizontal separated slabs and four cuts below the recesses; no new motion-reference preprocessing.
- Routes read in full: workflow; controls Plan (`core/control-selection`, `core/layout`), renderer Plan (`core/runtime-boundary`, `core/performance`); Implementation (`schema-reference`, `component-rules`, `renderer-technique`, `performance`); Verification (`acceptance-testing`). Applied writing-plans and browser skills. Plan: `docs/plans/2026-09-14-base-plates.md`.
- Decision: four closed equal lower plates from the guaranteed solid core, plus the upper remainder with the complete mountain. One shared panel gap, zero restores the unsplit scene; keep original material coordinates. Existing orbit remains the canvas owner. No independently editable collection, timeline, layer UI or new export capability.
- Control fit: inspected schema controls and public UI barrel; continuous built-in slider represents the exact global separation. Base remains a coherent foundation reset scope; one added slider is not reason to split its existing controls.
- Renderer plan: one retained mesh with four additional small boxes, constant topology and bounded arithmetic. Existing uniforms-only Three WebGL preview/export passes consume the new control through the canonical parameter inventory; scene framing adds at most four gaps. Structural assessment must pass before renderer edits. No measured performance authority.

Verification tier: Tier 3, focused later feature
Reason: Closed sliced geometry, live gap control and shared framing.
Run: focused render-plan/layout/topology/camera/product tests; `iceberg.plateGap` browser acceptance and embedded inspection, including zero restoration, closure, orbit, persistence and PNG content.
Skip: aggregate delivery/build, unrelated control/export matrices and measured performance.

Result: Four equal closed lower plates now separate from the upper mountain piece through Base / Plate gap. The solid-core calculation keeps every cut below the reachable recesses; zero restores the original frame exactly. Structural render assessment, TypeScript, topology, camera-envelope and product-coverage units pass. Focused browser development proved five visible bodies, equal lower thickness and gaps, no frame-edge clipping and exact zero-gap pixel restoration. Embedded Browser confirmed all four plates remain aligned and closed after a real direct-model orbit. Final protected `TOOLCRAFT_TEST_PORT=3130 npm run test:feature -- iceberg.plateGap` passed its exact unit and browser selection (journal run `f27b24e8-4c7d-41cd-b1af-a036a4316561`). No aggregate delivery gate or measured performance run.

### Restore the generator before the new-ideas experiment
- Change ID: iceberg-restore-before-ideas
- Request: `codex/split-ridge` тут откати до версии, которая до того, как я просила придумать идеи, чтобы было не похоже на реф
- Source authority: inspected the original conversation's request to depart from the reference, the following split-ridge experiment and cancellation. Git baseline 861d974 (Preserve current iceberg generator before split-ridge experiment) was created before any experiment implementation and preserves the immediately preceding generator. Current experiment changes are uncommitted and isolated in this worktree.
- Preflight: localized exact-source rollback, later product work. Read workflow and verify the same AGENTS and schema/renderer Plan, Implementation and Verification contracts match those already read. No new plan or design decisions; keep codex/split-ridge and its saved port 3003. Preserve the experiment in Git stash before restoring only the scoped product/plan files. Keep the worklog as audit history. No writes to the underwater-study worktree on 3002.

Verification tier: Tier 3, focused source rollback
Reason: Restore the known original height field and its schema/defaults, removing four experimental controls and the experimental identity.
Run: byte comparison with baseline; existing schema/product and structural assessment units; focused height browser acceptance; embedded original-silhouette and missing-experimental-controls check; verify both server identities and other worktree unchanged.
Skip: new tests, aggregate/build, export matrix and measured performance; renderer resources and original behavior are restored exactly.

Results:
- Preserved all seven experimental product/plan files in Git stash commit `5c74da900482ad406ea8356561911276aff83d20` before restoring them. The worklog preserves the experiment and rollback audit. `git diff --exit-code 861d974 -- src/app` passes; the ridge-field module and experiment plan are no longer in the active worktree. Only this worklog differs from the baseline.
- Restored the original app identity, Iceberg panel title, single main mountain height field, defaults and original control inventory. Four split-ridge controls are absent. Retained the branch name codex/split-ridge and saved port 3003.
- Five existing unit/product/structural tests passed. Protected `TOOLCRAFT_TEST_PORT=3140 npm run test:feature -- iceberg.height` passed 1/1 scenario in 9.7s, run `77554194-1030-4746-a8c9-fd2c3be20f0c`: the restored height control changes rendered geometry while held.
- Restarted only the server in this worktree through dev:restart. Verified the distinct identity endpoints at 3002 and 3003. Underwater-study source/status on 3002 remained unchanged. Embedded 3003 review shows the original mountain over a gridded cube and no experimental controls; left at 70% with controls collapsed and marked the tab as deliverable. `git diff --check` passed.


### Split ridge branch experiment
- Status: cancelled by user: «не, давай не будем эту версию прорабатывать, отменяем». Stopped implementation and port 3003; returned the browser to the unchanged main version on port 3002. Incomplete experimental source is retained in its isolated branch/worktree, without claiming final verification.
- Change ID: iceberg-split-ridge
- Request: может попробуем эту версию в бранче и на другом локалхосте/
- Selected concept: the recommended lower, wider split ridge, unequal diagonal peaks and a deep rift continuing to the block boundary; rock engraving and sparse cube grid remain.
- Git did not exist. Saved the current source as baseline main commit 861d974 and created codex/split-ridge in /Users/elenamorozova/Projects/Neon/neon-iceberg-split-ridge. Original port 3002 stays untouched. Separate app identity and TOOLCRAFT_PORT=3003 give the experiment its own server and saved workspace.
- Used brainstorming and writing-plans; implementation plan is docs/plans/split-ridge.md. Routes: schema/controls and renderer, reusing the unchanged already-read phase contracts. This is a later geometry variation with focused verification, not another first delivery.
- Controls: Ridge angle, Peak spacing, Rift width and Rift depth are bounded continuous Mountain properties owned by the panel; the existing canvas owns orbit. The ten visible Mountain parameters share one connected silhouette and reset task. No new selector, mode, timeline or layer.
- Renderer: same retained Three mesh, topology, uniforms and stateless preview/export passes. Shared rift mask shapes the cap and physical perimeter. Four numeric targets enter the existing canonical pipeline and derived paths; no new dimensions/resources or measured performance.
- Pre-change ai:check hit the existing protected type-graph recursion (Maximum call stack size exceeded in toolcraft-dom-type-children.mjs). Recorded the baseline failure; do not edit protected validators. Dev wrapper requires TOOLCRAFT_PORT=3003; passing --port alone initially targeted the original registered app and was correctly refused.

Verification tier: focused later geometry experiment
Reason: New multi-peak height field and four shape controls in an isolated branch.
Run: structural render assessment/product coverage; focused GPU shape/bounds/perimeter probes and four live browser control cases; real orbit, PNG and embedded visual inspection; confirm original source/server remains unchanged.
Skip: aggregate/build, unrelated control matrix and measured performance.

### Remove optional block engraving
- Change ID: iceberg-remove-base-engraving
- Request: не, давай уберем эту функцию
- Scope: remove the recently added block engraving switch and its material uniform, state consumer, inventory/acceptance entry and feature-only tests. Restore rock-only engraving help text; retain the English interface, rock engraving, cube grid and concurrent far-boundary grid correction.
- Preflight: later localized schema/renderer removal. Read workflow; reuse the unchanged Plan, Implementation and Verification contracts already read for these routes. No new renderer path, workload, resource or plan document; this removes a boolean and its bounded shading branch.

Verification tier: focused feature removal
Reason: Return the cube material to its previous behavior while preserving the existing rock engraving branch.
Run: Existing structural render assessment and product coverage; existing rock-engraving browser acceptance plus its derived parameter cases; embedded reload with the obsolete saved block preference present and no block switch or hatching.
Skip: Aggregate/build, unrelated grid/geometry checks and measured performance.

Results:
- Removed the block switch, boolean consumer/uniform, cube shading branch, pipeline target, interaction/inventory/acceptance declaration and its two feature-only browser files. Existing rock-only engraving and English labels remain. The obsolete saved preference is no longer consumed; no manual storage mutation or workspace reset was needed.
- Structural render assessment and focused product acceptance coverage passed. Embedded Browser reload confirmed the block switch is absent, rock engraving stays enabled and the cube again shows its unhatched material with the existing grid. Preserved the current geometry, pose, grid settings and concurrent far-boundary grid changes.
- Protected `TOOLCRAFT_TEST_PORT=3130 npm run test:feature -- iceberg.engravingEnabled` passed its four selected/derived cases (run `51d81c1c-5559-426a-a60e-da807bae342c`, 43.1 s browser time). Engraving changed 15,224 rock samples with zero changes across 15,220 cube-interior samples and zero alpha changes; exact off restoration, PNG comparison and all three stroke controls passed. No aggregate or measured performance run.

### Hide grid projection from the far boundary
- Change ID: iceberg-grid-facing
- Journal change: a34a3c70-57d2-467f-8264-7fec9d1b29d0
- Request: при таком угле обзора мы не должны видеть клетчатый паттерн дальней грани
- Reference: annotated still `codex-clipboard-a20d3eff-87f2-45ae-94c5-0779c076dde8.png`, used only as defect evidence.
- Later localized visual fix. Routes: broken visual behavior and renderer/canvas output. Read workflow; reuse the already-read decision-contract, runtime-boundary, core/performance, component-rules, renderer-technique, performance and acceptance-testing documents. Reuse systematic-debugging and embedded Browser skills.
- Confirmed cause: `cubePatternInk` projected every ice cutout on the cap onto a camera-facing cube plane, even when that cutout belonged to the far physical boundary. Depth testing cannot hide ink painted directly onto a visible cap triangle.
- Scope: add boundary-facing eligibility before applying the existing planar ink. Preserve the near-side straight-line projection, geometry, material masks, controls, orbit and preview/export ownership. Existing bounded stateless uniform passes/resources and derived paths remain valid; run their structural assessment before the renderer edit.

Verification tier: Tier 3 — focused later grid correction
Reason: One fragment-material visibility rule shared by preview and export.
Run: GPU fragment regression across four physical faces and orbit directions, focused grid thickness/strength browser checks (straight joins and PNG), and embedded inspection.
Skip: Aggregate/build, unrelated controls and measured performance; no workload or resource change.

Results:
- Added physical boundary orientation eligibility in `iceberg-side-patterns.ts` after the shared planar derivatives. Far and edge-on boundary patches receive no grid; near-side planar projection is unchanged and the same shader serves PNG export.
- The new production-fragment regression reproduced the bug before the fix: the far cap at view `[4,2.6,6]` contained 2,570 ink pixels in a 64×64 patch (run fcefb73e-c52b-4e14-a7c1-ccbc531e0e6b). Its preceding invocation used the occupied preview port and was rejected before testing.
- Structural render assessment passed. Focused feature run f29741c0-8fb6-4c49-9fab-f37506d4aab1 passed both gridThickness and gridStrength (30.7 s browser time). All 72 combinations of four physical faces, cap/wall patches and nine view directions had zero hidden-side ink; visible patches retained at least 1,496 ink pixels. The default and rotated live-grid checks found zero off-grid pixels, with 7,195 and 6,050 observed ink pixels respectively. PNG decode/difference, unaffected rock interior and unchanged alpha also passed.
- First feature attempt d3446c89-530a-459f-aa6f-f256a1ec0665 encountered a file removed concurrently by the block-engraving removal task during dependency validation. Waited for that task's verification to exit, preserved its changes, then ran only the two selected grid checks.
- Embedded Browser reload inspected the default `[4,2.6,6]` view with existing jagged edge 0.8 and chip scale 3. Current scene settings were preserved. No runtime, geometry, pipeline, or additional control changes.

### English interface copy
- Journal change: 93cfb648-d0f0-4de0-8dbd-b6a86bf7832f
- Request: сделай в приложении все надписи на английском
- Owners: `iceberg-controls.ts`, `app-schema.ts`, `IcebergCanvas.tsx`, `useIcebergEngine.ts`, and app-owned browser locators.
- Translate every product label, help description, canvas accessible name and WebGL failure message. Preserve target identifiers, defaults and original user-request evidence.
- Preflight: schema/controls route; workflow, control-selection, layout and schema-reference read; reuse component-rules and acceptance-testing already read in this conversation. No plan document needed for copy changes.

Verification tier: Tier 0 — focused copy edit
Reason: English text replaces Russian text without changing behavior or layout mechanics; inspect longer labels for fit.
Run: Existing schema/coverage unit checks, one focused color-control browser acceptance, and embedded inspection of all sections and help text.
Skip: Aggregate/build, geometry/export matrices and measured performance; their behavior is unchanged.

Results: Translated all 34 parameter labels/help descriptions, material colors and switches, canvas accessible name and WebGL error. The source scan now finds Cyrillic only in verbatim user-request evidence. Embedded inspection covered every section, the active engraving controls and two rendered help popovers; no Russian UI text remains. Shortened the paired switch to `On block` after visual fit inspection. Schema defaults check passed; the coverage check initially rejected generic `Width`, then passed with `Iceberg width` (retry cee2839b-1662-4d6d-9d3a-b45fe5fcca22). The focused `iceberg.rockColor` browser case passed in run 591ad4fb-70c1-441f-add5-12b34416e88b. Earlier attempts were rejected because the schema changed during validation, then because a concurrent engraving test deleted shared Playwright trace files; the final run completed after the concurrent process exited. No renderer or state behavior changed.

### Optional engraving on the block
- Change ID: iceberg-base-engraving
- Request: давай попробуем опционально добавлять гравюру и на нижнюю часть блока тоже
- Later localized material/control feature. Routes: schema/controls and renderer. Read workflow; reuse the unchanged Plan, Implementation and Verification documents already read for these routes. No new reference, geometry, resource or separate plan document.
- Decision: Add a default-off Material / Engrave block switch, visible while the existing Engraving switch is on. It extends the same tonal strokes to the ice material, including the underside and jagged seam cutouts. Shared strength, scale and thickness remain authoritative; grid ink is applied afterward so the existing tile layout stays intact. Turning the master off restores the plain material; hidden base preference is preserved. The concurrent English-copy task translated these labels and matching test locators; preserve that work.
- Inventory: One global panel parameter under the engraving branch; no new interaction surface. Material has eleven visible controls with engraving enabled, all within one appearance/reset scope. One boolean uniform and bounded existing stroke arithmetic on the same retained preview/export passes; no new workload dimension. Register its invalidation and assess the structural plan before renderer edits.

Verification tier: focused later material feature
Reason: One optional cube shading switch; existing rock treatment and grid layout must remain stable.
Run: Structural render assessment; focused switch applicability and rendered cube/rock isolation, grid coexistence, master-off restoration, shared scale response, and a real PNG comparison; embedded inspection and reload of the enabled preference.
Skip: Aggregate/build, unrelated controls and measured performance.

Results:
- Structural render assessment and product acceptance coverage passed. Focused browser development passed the new switch scenario: 13,677 cube samples changed, zero rock-interior pixels changed, and the complete alpha silhouette stayed identical. Disabling the block option exactly restored the previous cube; master off restored both materials and master on retained the block preference.
- Grid verification initially compared resized screenshots, whose averaging combines neighboring light/dark strokes before attenuation is measured. Comparing the actual backing pixels resolved that observation error: 87,759 cube samples, including 8,837 grid samples, retained identical grid attenuation with zero mismatches. No product change was needed for this test correction.
- Changing the shared stroke scale affected both surfaces. Actual 2K PNG downloads with and without the block treatment decoded at equal dimensions with different pixel hashes. Embedded inspection confirmed the horizontal engraving beneath the grid, and a real reload retained Engraving and Engrave block enabled with strength 1, scale 1 and thickness 50%.
- First protected feature attempt `df72c2b7-531f-489a-a2ec-e75ffc42bf08` stopped before browser execution because the concurrent English translation changed `iceberg-controls.ts` during authority validation. Preserved that translation and retried the same single acceptance ID against the stable source.
- Retry `6142c74f-1496-4098-bc4c-07c1dc93af9e` completed all product assertions but failed browser teardown with ENOENT in the shared Playwright trace directory while the copy task was running another feature test. Waited for that process to finish before the next focused run; no source, assertion or protected configuration was weakened.
- Final protected `TOOLCRAFT_TEST_PORT=3130 npm run test:feature -- iceberg.engravingBase` passed (run `6008c940-7dbe-4acc-9658-4e326f534069`, 16.2 s browser time), including hidden/visible applicability evidence and all scope, grid, restoration, shared-scale and PNG assertions. The translated Material / Engrave block option remains enabled in the user's localhost:3002 workspace. No aggregate or measured performance run.

### Remove isolated needle peaks
- Change ID: iceberg-needle-peaks
- Request: можешь исключить ситуации, когда появляются вот такие иглообразные пики?
- Later localized renderer bug fix; the attached annotated PNG is visual defect evidence only. Routes: broken visual behavior and renderer/canvas output. Read workflow, decision-contract, runtime-boundary, core/performance, component-rules, renderer-technique, performance and acceptance-testing; systematic-debugging and embedded Browser skills.
- Investigation: inspect actual GPU terrain heights, perimeter continuity and polar-coordinate singularities before changing the shared preview/export height field. Keep existing controls, retained 192-segment topology, orbit and selected backing quality.
- Render scope: existing bounded shape uniforms feed the same stateless Three GPU preview/export passes. No new resource, workload dimension, invalidation or renderer provider; existing typed pipeline and derived fixtures remain applicable.

Verification tier: Tier 3 — focused later renderer correction
Reason: Terrain height continuity and isolated silhouette artifacts; no runtime or state migration.
Run: Structural render-plan unit; focused GPU field regression and browser terrain-control acceptance; embedded silhouette inspection. Add one focused export-content check if the shared field changes.
Skip: Aggregate delivery, build, unrelated controls and measured performance; this request concerns geometry correctness.

Results:
- GPU regression reproduced a 0.546495 world-unit height jump across points only 0.000002 units apart at frequency 9.3. The noninteger angular multiplier did not close across -PI / PI. The seam also had an angular singularity at its center (axis deviation 0.315556).
- `iceberg-shaders.ts` now interpolates closed integer fold harmonics for fractional frequency, defines axis angles, fades the direction-dependent excavation at its origin, and tapers the shoulder's outer strip to the shared seam. The envelope now evaluates exact zero at the perimeter. Preview and export consume the same corrected GLSL.
- Structural render-plan unit passed. Focused browser development passed frequency and shoulder live control cases. Production GLSL transform-feedback regression covers all 211 schema frequency values (largest cut jump 0.00006831), both axes/origin (largest deviation 0.000003431), all 100 seeds plus two extreme perimeter combinations (exact zero cap/wall gap), and all 37,249 default cap vertices for isolated peaks.
- Embedded Browser inspection at 70% zoom checked initial and reverse views with engraving and fractional frequency 9.3. Restored frequency 9, original pose, 50% zoom and collapsed Mountain/Rock relief sections; existing Infinity, material and grid settings remain.
- Verification history: an initial invocation accidentally supplied the descriptive worklog ID as a journal UUID and was rejected before tests; removed that invalid argument. Run b6f8c2c2-d724-4362-8f97-097b6dd4fb56 then exhausted the Node heap during selected test dependency authority analysis. The new test imported the topology module only for its segment count, unnecessarily bringing Three.js into that test closure. Extracted the shared count to `iceberg-topology-settings.ts`; both topology and shader normal sampling now consume it. Direct source-record checks for all changed test/shader owners and the focused topology unit pass. Retry 2cbb6ee2-6d1e-40c0-9f19-f72577b7f32a reached the validated browser scenario list but was interrupted during diagnosis; the unmodified focused command then ran as 6192dd77-beca-496c-8361-379ea42ea115.
- No runtime edits, new controls, aggregate proof, or measured performance.
- Run 6192dd77-beca-496c-8361-379ea42ea115 passed the frequency and shoulder scenarios, including the live held-pointer assertions, complete GPU regressions, and a decoded 1536×2048 PNG whose largest isolated two-column silhouette protrusion was 3 pixels. The extra seamValley scenario failed its old fixed-bitmap summit assertion.
- Diagnosis found concurrent app changes outside this task: `iceberg-camera.ts`, engine camera configuration, and `sceneBoundsProvider` now expand the scene frame with geometry bounds. The sampled canvas changed from 1200×1680 to 1200×1712 while pose stayed exact. Preserved those changes. Updated only the app-owned boundary pixel observer to map the actual runtime frame into the same world window. Summit equality now passes; seven floor-edge samples differed by one pixel due to rounded backing/resampling, so the floor proof keeps exact occupied columns and a one-sample antialias allowance. The final seamValley-only run eb60aa3a-88ec-40e6-acd0-f60ed878a3b0 passed, including unchanged summit, stable floor, visible nested cuts and decoded PNG differences. All three selected feature checks are now passed across the focused runs.

### Iceberg generator
- Change ID: iceberg-first
- Request: я хочу создать приложение с генератором 3d айсберга. Он должен выглядеть как гора сверху и как куб снизу. Посмотри на референс, обрати внимание на границу между верхней и нижней частью, она неравномерная. Сделай так настройки топологии, чтобы я могла как можно точнее воссоздать такое изображение. Я хочу иметь возможность поворачивать объект. Подними сразу локалхост, чтобы я могла следить за процессом
- Task type: First product assembly, schema, procedural renderer, background and image export.
- User-visible result: Editable mountain/cube solid, uneven shared seam, directional monochrome relief and direct orbit. Implemented with live topology controls, direct orbit and deterministic image export.
- Source/reference checked: User supplied still PNG, codex-clipboard-8b13e0ff-b718-481f-9767-d4d584ef0abe.png, inspected as image content only.
- Reference inputs: One static image, no motion inputs; typed referenceInputs is [].
- Docs/contracts read: workflow; core/runtime-boundary; assembly-workflow; core/control-selection; core/layout; core/performance; core/setup-export; core/media-upload; decision-contract; schema-reference; component-rules; renderer-technique; performance; acceptance-testing. Relevant local brainstorming, writing-plans, systematic-debugging and browser skills.
- Contract rules applied: runtime-shell-required; canvas-no-app-ui; infinity-canvas-scene-bounds; interaction-surface-ownership; renderer-view-interaction; controls-section-inventory-required; renderer-gpu-provider; output-export-required; persistence-policy-explicit; acceptance-product-observable.
- View interaction intent: orbit, explicit user rotation request; orientation target view.orbit.
- Interaction ownership: Canvas owns direct orbit via runtime geometry hit test and gizmo. Panel owns global shape, seam and material edits. No selection state or duplicated orbit controls.
- Decision: Built-in schema sliders/colors, fixed bounded triangulated topology deformed by GPU uniforms, Three WebGL preview and target-based raster export.
- Alternatives rejected: Static image projection cannot expose true rotations. An independent cube and cone would create a horizontal seam. Canvas 2D would duplicate 3D occlusion and lighting. No UI clones, timeline, layers, uploads, SVG or video.
- State/output mapping: iceberg.* parameters drive height field, seam, material and light. view.orbit drives camera and hit pixels. Runtime Background owns backing and export background. Export shares exact immutable parameter snapshot.
- Verification: Preflight npm run ai:check passed. pnpm initially tried to replace npm-installed dependencies and rejected esbuild build scripts; npm install --ignore-scripts restored dependency resolution. Render-plan assessment passed before renderer code. Clean pnpm installation resolved mixed dependency layout. All 20 shape/material parameter browser cases passed; focused orbit, PNG/JPG 2K/4K/8K, alpha/background, Infinity and backing proofs passed. Typecheck and five product unit checks passed. ai:check currently fails inside the protected DOM type graph reader on Three Scene recursive children; no protected files have been changed. Delivery gate reached code health and is blocked by that protected analyzer failure; no performance measurement authorized.
- Risks: Unseen geometry is an interpretation; WebGL is required.

## Decisions

### Renderer
- Decision: Three WebGL with transparent foreground and one retained pipeline.
- Reason: Dense displaced terrain and photographic shading need spatial occlusion, shared normals and GPU rasterization.
- Evidence: iceberg-pipeline.ts and app-performance.ts; same world rect in both modes. Preview/export use Three; no provider-version exception needed.

### View Interaction
- Decision: Orbit.
- Reason: User explicitly asks to rotate the object.
- Evidence: “Я хочу иметь возможность поворачивать объект.”
- Mode: orbit
- Source: user-request
- Alternatives: Fixed camera rejected; still reference establishes composition only.
- Targets: view.orbit

### Interaction Ownership
- Decision: Canvas direct rotation; panel global procedural parameters.
- Reason: Dragging visible geometry is spatial; numeric generation constraints benefit from precise readable controls.
- Evidence: appProductReadiness.interactionOwnership in iceberg-inventory.ts.

### Timeline
- Decision: Disabled.
- Reason: No authored animation or video delivery requested.
- Evidence: User request specifies a rotatable static generator, animationIntent none.

### Layers
- Decision: Disabled.
- Reason: One connected generated object with no independent selection/reorder task.
- Evidence: One output surface; controls configure its parts.

### Controls
- Decision: Four semantic sections: Mountain, Rock relief, Base, Material; runtime Setup and Image Export.
- Reason: Shape, rock relief, base seam and material have distinct reset scopes. Built-in sliders and colors fit; no custom UI needed.
- Evidence: Public UI barrel and complete control catalog checked; iceberg-inventory.ts exact target inventory. Stepped precision sliders remain visually continuous; no count-selector domain. Sections group one editing task; Base now contains nine related continuous controls after the seam refinement. Section names were initially English; all parameter labels and descriptions are now English following the explicit translation request.

### Export
- Decision: Runtime image export only, PNG/JPG and 2K/4K/8K; background configurable.
- Reason: Default Toolcraft image intent. User did not request SVG/video.
- Evidence: Original user message; exportIntent toolcraft-default/not-requested/not-requested. GPU target pixels paint runtime context, runtime owns encoding and downloading.

### Performance
- Decision: Retain mesh/program resources, update bounded uniform deformation on demand, allocate exact selected backing pixels.
- Reason: Geometry resolution is bounded and unchanged by parameter edits; orbit should not rebuild resources.
- Evidence: Canonical icebergPipeline reused by composition and performance assessment. Derived paths and envelope fixtures in app-performance.ts. No timers or animation loop.
- Workload: Fixed grid tessellation, preview backing scale and export edge resolution.
- Lifecycle: Retained renderer resources, GPU raster on changed parameters/pose/zoom, GPU target for export with deterministic cleanup.
- Assessment: Passed before renderer code; fixed mesh and uniforms-only GPU rasterization require no kernel benchmark.
- Paths: Derived by deriveToolcraftPerformancePaths, not manually named.

## Verification

Verification tier: Tier 3
Reason: First delivery of procedural 3D renderer, orbit, schema and image output.
Run: focused product unit/browser checks, embedded Browser visual inspection, then one npm run verify:delivery.
Skip: Measured performance, kernel benchmarks, video/SVG/media/timeline/layer matrices because no request or corresponding capability.

## Risks
- Risk: Back and underside cannot be recovered exactly from the supplied still; generated deterministically.
- Risk: Large zoom and 8K export use substantial GPU memory; selected backing quality must never be clamped.

## Development verification results
- Embedded browser: localhost:3002 remains running; visual inspection shows a tall asymmetrical peak, shaded jagged ridges and a square base with one continuous uneven rim. Panel was moved into the visible viewport and the portrait canvas centered beside it.
- Functional browser: 20 individual parameter cases passed; six final focused cases passed for height, selected backing, PNG/JPG 2K/4K/8K, transparent Background, orbit/history/reset/export-clean, and Infinity identity/reload/crop. Exact runtime evidence emitted by protected helpers.
- Product tests: five tests passed, including exact shared perimeter vertices, schema/coverage and render-plan assessment. TypeScript passed.
- Framework blocker: npm run ai:check throws RangeError in scripts/toolcraft-dom-type-evidence.mjs while inspecting new THREE.Scene(). Read-only diagnostic identifies recursion through Object3D children/Array; the checker restarts its graph walk for each array element. The standalone folder has no source monorepo for regeneration; copied validator and runtime were left intact.
- Performance matrix and real browser adapters declared; no timing run or measured performance claim.

### Final delivery status
- Production build: passed (TypeScript plus Vite).
- Persistence and product opening: two protected browser cases passed, including exact values/canvas/panels after reload.
- Delivery catalog: corrected product-owned proof grouping to one acceptance domain per file, then catalog passed. First delivery lifecycle remains incomplete: its pnpm ai:check stage throws the same RangeError in the protected recursive type analyzer. This is reported as a limitation, not a passing receipt.
- No copied runtime, bootstrap, validator, signed manifest, or verification configuration was modified. No performance audit was run.

### Complex seam refinement
- Change ID: iceberg-seam-detail
- Request: давай проработаем еще получше границу ; Посмотри какая сложная по форме линия, какие там углубления, они не просто параболические, а более сложные
- Task: Later focused visual refinement. New supplied annotated still inspected as visual evidence, no motion preprocessing.
- Root cause: Seam uses three uniformly scaled smooth noise bands; it lacks a large directional depression, asymmetric cutouts and intermediate ledges.
- Owners: iceberg-controls.ts and the shared GLSL seam used by cap and all walls. Retain mesh, scene bounds, orbit and both render surfaces.
- Decision: Add broad directional excavation, domain-warped angular cuts, smooth but steep terrace transitions and nested chips. Four built-in continuous sliders in Base: depth, perimeter position, contour complexity and ledges. Existing amplitude/frequency edit the smaller fracture scale; zero amplitude and zero excavation restore a flat edge. Global panel ownership remains canonical, all targets are picked up by the existing typed inventory and pipeline.
- Cost: Fixed bounded shader noise work, unchanged 192-square topology and backing envelope. New uniforms join the existing preview/export paths without allocating resources or adding loops. Check structural assessment before shader implementation.
- Routes: controls/schema; renderer/visual mismatch. Read Plan and Implementation documents prescribed by workflow; no separate plan needed for this localized field refinement.

Verification tier: focused later edit
Reason: Shared boundary field and four related controls; no change to renderer lifecycle or export plumbing.
Run: existing render-plan/product unit cases, focused boundary slider browser cases with held-pointer pixel proof, one seam export check and embedded visual inspection.
Skip: aggregate delivery and performance matrices; previous protected type-analyzer blocker is unrelated and remains recorded.

Results:
- New seam combines a directional depression, unequally spaced ledges, warped local cuts and angular chips. The broad excavation is bounded before the smaller cuts, so deep regions retain detail. The bottom clearance has a continuous exponential limit.
- Built-in Base controls added: Глубина впадин, Положение впадин, Сложность контура, Уступы. Existing Неровность края and Частота зубцов control smaller features. Original settings and orbit remain persisted; the preview is left at new default depth 0.95 and position 45°.
- Five product/unit and render-assessment checks passed; TypeScript passed. Seven boundary slider browser cases passed with held-pointer pixel assertions.
- Added actual rendered red/blue material boundary sampling: the broad excavation moves the seam downward, local cuts create both positive and negative deviations, and summit/bottom remain fixed. Two real 2K PNG downloads have the expected dimensions and different decoded pixels for coarse and detailed boundaries.
- Focused protected verification passed for all six changed/new seam targets: `TOOLCRAFT_TEST_PORT=3100 npm run test:feature -- iceberg.seamValley iceberg.seamPhase iceberg.seamWarp iceberg.seamTerraces iceberg.seamVariation iceberg.seamFrequency` (run 9b5f994d-f79a-41d4-bbde-ce62e3caa33e, six passing scenarios). The first attempt selected an unrelated backing-evidence import and failed Playwright authority validation. Moved that existing backing test to its own product-owned file, updated its acceptance mapping, and reran successfully without changing protected code.
- Embedded browser inspection used the current host's Browser at localhost:3002. A fresh navigation replaced a stale hot-reloaded WebGL program; live depth edits and orbit were then visually confirmed. Original view restored after inspection. No measured performance run or aggregate delivery rerun.

### Jagged edge control
- Change ID: iceberg-jagged-edge
- Request: а ты мог бы добавить еще настройку для вот такого края, чтобы был прямо ломаный
- Reference: Inspected supplied still codex-clipboard-b5aa1f3c-107b-4be2-a615-bbc7722e887e.png as visual evidence of acute, uneven contour turns. No motion reference or preprocessing.
- Task: Localized additional shape control. Routes: schema/controls and renderer, prescribed Plan and Implementation documents read; reuse the existing runtime slider, inventory and pipeline owners.
- Decision: Add global Base slider `iceberg.seamJagged` / Ломаный край, continuous 0..1, default 0. Blend the existing junction into a periodic piecewise-linear boundary with irregularly spaced vertices and unequal sharp notches. One shared field drives preview/export and wall/cap perimeter. At 0 preserve the previous field exactly. No custom UI, new mode, camera change or new export feature.
- Cost: Fixed 48-node contour evaluated analytically at two neighboring knots per vertex, unchanged bounded mesh/backing and retained resources. New uniform joins existing canonical preview/export targets. Run structural assessment before implementing the shader.
- Density: Base now has ten simple related sliders, one foundation reset scope. Keep the coherent section; inspect scroll access and label fit in the embedded browser.

Verification tier: focused later edit
Reason: One additional continuous seam control and its shared shader interpolation.
Run: Existing product and render-plan tests; new control's protected held-pointer browser proof, focused endpoint/shape and PNG check, embedded visual inspection.
Skip: Build, aggregate delivery, unrelated controls/export matrix, and measured performance; their owners are unchanged.

Results:
- Implemented a shared 48-knot periodic polyline with irregular spacing, unequal tooth heights and bounds applied before linear interpolation. At 1 the seam has straight segments and sharp vertices; 0 returns the original field directly. Preview and PNG consume the same shader.
- Five product/render-plan checks passed before shader implementation. Focused development browser test passed, including actual boundary pixels moving in both directions, unchanged summit/bottom, exact return to the original rendered contour at 0, and different decoded 2K PNG pixels at 0/1.
- Protected `TOOLCRAFT_TEST_PORT=3100 npm run test:feature -- iceberg.seamJagged` passed (run eb93a83d-97d4-4f9f-bb2e-1a04ab36cd99, one scenario). Held-pointer output changes were proved by the protected helper. No unrelated checks or measured performance were run.
- Embedded Browser inspection confirmed acute angular teeth at 1 and the intermediate blend at 0.8. Base labels fit at the current panel width and its ten sliders remain scroll-accessible in their shared reset scope. Left localhost:3002 open with Ломаный край set to 0.8; the value survived navigation back to the base URL.

### Edge pattern correction
- Change ID: iceberg-edge-pattern-fix
- Request: нет, ломаный край работает неправильно, он еще больше утрирует положение высот, а должен создавать узор ребра
- Reproduction/root cause: Embedded browser confirms large triangular teeth. `knotHeight` adds up to 0.18 + 0.7 × seamVariation of displacement and replaces the entire perimeter height field, also reshaping adjacent terrain. Previous proof incorrectly required large boundary displacement.
- Decision: Remove the polyline height replacement. Keep the existing organic geometry independent of seamJagged and use that value for a bounded, world-anchored rock/ice fracture pattern along the current material junction. The 2D pattern can form lateral notches without changing mountain heights or cube geometry. Preserve the control target and its persistence; update its help to the corrected meaning.
- Owners: Shared vertex/fragment shader, control description, focused browser regression. Use systematic-debugging. Routes: broken control/visual mismatch, renderer and schema; reuse already-read unchanged core, schema, performance and acceptance contracts from this conversation, with workflow, decision contract and implementation owner rules rechecked.
- Render plan: Same compiled Three preview/export passes, same uniforms-only stateless GPU surfaces and fixed mesh/backing. Add one interpolated seam-distance value and bounded fragment noise only inside the narrow seam band; remove repeated knot height evaluations. No resources, workload dimensions or lifecycle changes.

Verification tier: focused later fix
Reason: Correct the semantics of one control; prove local pattern change with identical geometry.
Run: Regression first against current implementation (unchanged alpha/silhouette and pixels outside the edge band); existing structural render-plan check; one protected seamJagged browser scenario including live drag, local color-boundary detail, exact 0 restoration and PNG output; embedded inspection at 0 and 1.
Skip: Unrelated controls, aggregate/build/export matrices, measured performance.

Results:
- Removed all knot/polyline displacement. `uSeamJagged` is now declared only in the fragment shader. A 2D world-anchored cut pattern changes rock/ice coverage within a maximum 0.10-world-unit band around the physical seam. Vertex heights are independent of the setting. Updated the help text accordingly.
- The new regression failed against the old implementation with 2,452 changed alpha pixels. It passes after the fix with identical alpha at every sampled pixel, zero changes outside the edge band, small local boundary shifts, exact restoration at 0, and changed decoded 2K PNG content.
- During refinement, distance to an interior height-field contour produced a few stray colored pixels; replaced it with distance to the physical perimeter. The image observation now recognizes all visible 2D junctions and mixed-material antialias pixels, rather than only the lowest rock pixel in each column. Its local radius follows the world-to-observation scale.
- Structural render-plan check passed. Protected `TOOLCRAFT_TEST_PORT=3100 npm run test:feature -- iceberg.seamJagged` passed (run 79373035-fc9b-4c0e-b90f-a2ff97c5883d, one scenario). No aggregate or performance measurement was run.
- Inspected 0 and 1 at 70% zoom in the embedded Browser: the underlying shape stays fixed while the boundary develops fine cutouts. Restored 50% zoom, left the existing setting at 0.8, and kept localhost:3002 open.

### Chip scale and rock continuity
- Change ID: iceberg-chip-scale-blend
- Request: да, уже лучше , но надо увеличить масштаб, чтобы можно раза в 3 крупнее их делать. Посмотри видео, можно ли сделать так, чтобы при добавлении ломаного края красиво и органично в скалу переходила текстура?
- Routes: reference study; controls/schema; renderer/visual mismatch. Reuse unchanged phase documents already read in this conversation; read core/reference-study in full for the newly supplied recording. Systematic debugging and embedded Browser inspection applied.
- Root cause: Edge frequency is fixed while strength changes only its narrow coverage band. Rock and ice fragments keep each physical face's normal, exposing the old boundary as a bright seam.
- Decision: Separate chip scale (1–3x) from strength, scaling both lateral feature size and depth. Share the rock boundary normal on both sides and continue the same world texture across cuts, with a local fade into existing relief. Geometry heights remain independent of both controls.
- Owner: iceberg-controls.ts and shared GLSL; dynamic schema/inventory/pipeline own the additional global panel value. Base's eleven controls remain one foundation reset scope, not split by count.
- Render plan: Fixed bounded mesh/backing, same retained Three preview/export passes. One additional uniform and boundary normal varying; fixed vertex terrain samples, localized fragment texture work. No new resources or animation lifecycle.
- Reference processing: Installed FFmpeg with drawtext support. Full-duration command hit FFmpeg expression-depth limits while materializing over 300 frame selections. Re-ran the protected command over five contiguous inspected 2-second segments covering the entire 10.066667-second source; every run scans all source frames. No protected scripts or generated evidence were edited.

Verification tier: focused later edit
Reason: Two edge controls and shared shading, with no geometry, camera or export pipeline change.
Run: Structural render-plan unit; seamJagged and seamScale protected browser cases, local material/silhouette regression, scale endpoints, shared-shading continuity, 2K PNG, and embedded visual comparison.
Skip: Aggregate delivery, full build, unrelated controls and measured performance.
- Motion reference study: referenceId=motion-reference-v1-2167feca027a72948be992568f958acaa09d8299b6c31edab5243e8aa774b28b; studyId=motion-v1-0c413cd1417392142c073867dfc1aa9594ff7b9b5650fd1c9595119e13c1dbd4; sourceSha256=18163fa069d854e8803c7cc0b0be57f11aa36dc3daac50b967a05ceaf7f05bf6; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-0c413cd1417392142c073867dfc1aa9594ff7b9b5650fd1c9595119e13c1dbd4/contact-sheet.png; review=real-time+slowed
- Motion reference study: referenceId=motion-reference-v1-2167feca027a72948be992568f958acaa09d8299b6c31edab5243e8aa774b28b; studyId=motion-v1-c25f10dc0664b22b8119fdd99917dec5e832ac66ba1cda562382b16181d1c7d2; sourceSha256=18163fa069d854e8803c7cc0b0be57f11aa36dc3daac50b967a05ceaf7f05bf6; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-c25f10dc0664b22b8119fdd99917dec5e832ac66ba1cda562382b16181d1c7d2/contact-sheet.png; review=real-time+slowed
- Motion reference study: referenceId=motion-reference-v1-2167feca027a72948be992568f958acaa09d8299b6c31edab5243e8aa774b28b; studyId=motion-v1-c4191795b9c9a0321091519876c0d12891363c907bdb75730fdee18d6951374a; sourceSha256=18163fa069d854e8803c7cc0b0be57f11aa36dc3daac50b967a05ceaf7f05bf6; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-c4191795b9c9a0321091519876c0d12891363c907bdb75730fdee18d6951374a/contact-sheet.png; review=real-time+slowed
- Motion reference study: referenceId=motion-reference-v1-2167feca027a72948be992568f958acaa09d8299b6c31edab5243e8aa774b28b; studyId=motion-v1-18c612bde09877dc60d40d98167b810ba9dff72749fa1b4e0b3b4fddd3a7eac9; sourceSha256=18163fa069d854e8803c7cc0b0be57f11aa36dc3daac50b967a05ceaf7f05bf6; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-18c612bde09877dc60d40d98167b810ba9dff72749fa1b4e0b3b4fddd3a7eac9/contact-sheet.png; review=real-time+slowed
- Motion reference study: referenceId=motion-reference-v1-2167feca027a72948be992568f958acaa09d8299b6c31edab5243e8aa774b28b; studyId=motion-v1-139b4b53aa8157a99cc8cded4bb491ab2519a1061134b6f3bc985509a654eb27; sourceSha256=18163fa069d854e8803c7cc0b0be57f11aa36dc3daac50b967a05ceaf7f05bf6; timingMode=seconds; contactSheetPath=src/app/reference-studies/motion-v1-139b4b53aa8157a99cc8cded4bb491ab2519a1061134b6f3bc985509a654eb27/contact-sheet.png; review=real-time+slowed

Results:
- Added Base / Масштаб сколов, canonical continuous 1–3×, default 1. Both pattern wavelengths and its local depth scale together; strength remains independently controlled by Ломаный край. Vertex positions are unaffected.
- Shared perimeter slope normals now carry rock lighting from the mountain onto edge extensions, with a local fade back into the existing terrain normal. Ice cutouts use the planar ice lighting, while the existing world-anchored veins continue across both surfaces. Outside the bounded band and at zero strength, previous pixels remain exact.
- Reviewed all five ordered contact sheets (215 frames total) plus the original clip in the embedded Browser at normal and half speed. Typed study phases cover every overview, events are classified, and the accepted local-pattern / stationary-relief behavior maps to seamJagged with protected reference-parity evidence. The recording's pale junction is deliberately corrected as requested.
- Structural render-plan unit and focused product acceptance coverage unit passed. The seamJagged scenario passed in protected run 7b1f8174-9e41-40ae-9234-6abbf1d05d8c, proving live output, identical silhouette, zero remote changes, exact zero restoration, reference parity and actual changed 2K PNG pixels.
- Focused scale development browser passed. Final `TOOLCRAFT_TEST_PORT=3100 npm run test:feature -- iceberg.seamScale` passed (a3065e7d-8157-46aa-8e66-72232b626326, one scenario). At 512px observation, changed material pixels grew 335 → 1260 and largest connected chip 19 → 193 pixels between 1× and 3×; alpha/summit/bottom stayed exact. Across 192 sampled rock pairs crossing the former seam, median relative brightness jump is 0.05 with grain disabled (limit 0.12). Zero strength restores the original pixels at either scale.
- Resolved three verification setup failures: the protected parity helper's provenance analysis required a primitive semantic signature rather than a captured object; Node's native JSON loading required import attributes on evidence; the product slider-drag helper read absent aria bounds instead of the native input min/max, causing a drag below the new control's minimum. Fixed only product-owned imports/observations/helper, retained all assertions and protected owners.
- Embedded Browser comparison at 1×/3× and 70% zoom confirmed larger local chips and continuous rock shading. Restored 50% zoom, left strength 0.8 and scale 3×, confirmed persistence on navigation, and left only localhost:3002 open. Closed the temporary video tab/server. No full gate, unrelated matrix or measured performance run.

### Cube side patterns
- Change ID: iceberg-side-patterns
- Request: отлично, давай теперь добавим на боковую часть куба сетку из линий , а на другую - другой какой-то паттерн
- Task: Later localized schema and material renderer addition. Read workflow; reuse already-read unchanged Plan/Implementation contracts for controls/schema and renderer (control-selection, layout, runtime-boundary, core/performance, schema-reference, component-rules, renderer-technique, performance). No new product mode, camera or export intent.
- Reference: Inspected still codex-clipboard-8fd5559b-dafb-418e-99e8-48521c32803e.png for a square line grid and organic labyrinth on adjacent cube faces; codex-clipboard-5780c4e8-7026-422b-b452-a21a25c02e06.png identifies the exposed base below the irregular rock edge. The upper contour-line mountain and exploded slice in the first image are not requested. Existing motion study remains intact; these new inputs are stills.
- Decision: World-anchored square grid on the Z side pair (left in initial pose), organic contour labyrinth on X side pair (right). Opposite faces repeat the corresponding pattern, so orbit exposes coherent decorated sides. Clip both by the exact existing ice/rock material mask, including cutouts, keeping the rock treatment and geometry.
- Controls/ownership: Six built-in continuous global sliders in one Side patterns section: separate scale, line thickness and ink strength per pattern. Each strength can reach zero to restore the unprinted face. Panel owns pattern properties; canvas keeps orbit. Dynamic parameter inventory, acceptance and pipeline include every new target.
- Render plan: Same retained uniforms-only Three passes and fixed topology/backing. Constant bounded fragment noise and antialiased line coverage; no textures, new resources, render loops or workload dimensions. Shared shader owns preview/export. Check existing structural assessment before shader edits.

Verification tier: focused later edit
Reason: Six parameters plus local material shading on cube sides.
Run: Structural render assessment and product acceptance unit; six focused held-pointer pattern controls, face isolation/rock exclusion, regular grid versus organic line pixel shape, orbit anchoring, and one PNG comparison. Embedded Browser inspection.
Skip: Aggregate delivery/build, unrelated control or export matrices, measured performance.

Results:
- Added a square grid and warped organic contour ink in the shared fragment material. Object-space coordinates retain the same physical cell proportions and face assignment during orbit. Both patterns are masked by the existing ice/rock boundary; bottom and rock remain unprinted. No geometry or renderer lifecycle change.
- Side patterns exposes independent scale (0.4–3×), thickness and strength for each pattern. Strength 0 removes that pair's ink; the section reset restores all six defaults. Existing settings and original camera remain intact.
- Structural render-plan test and focused product acceptance coverage unit passed. The development gridStrength browser scenario passed with held-pointer output changes, unchanged alpha and pure rock pixels, disjoint face masks, exact restoration at zero strength, and different decoded 1536×2048 PNG exports.
- Rendered pixel sampling found 13 regular grid crossings at 1× and 6 at 2×, with spacing variation 0.025 and 0.019; the organic row has 8 uneven crossings and variation 0.502. Initial nearest-pixel sampling fragmented diagonal antialiased strokes; corrected the observation to merge sub-two-pixel gaps and sample between horizontal lines. Product rendering required no corresponding change.
- Embedded Browser inspection at localhost:3002 confirmed both patterns at 1×/3×, attachment through a real canvas orbit gesture, section reset and persistence after navigation. Restored the original pose and 1× defaults, left Side patterns expanded and the server running. No external browser fallback.
- Final protected `TOOLCRAFT_TEST_PORT=3100 npm run test:feature -- iceberg.gridScale iceberg.gridThickness iceberg.gridStrength iceberg.organicScale iceberg.organicThickness iceberg.organicStrength` passed all six scenarios (run 7ed442b0-ae4a-40ac-ac2c-59c2e5ec6162). Each control emitted protected evidence after real held-pointer output assertions; the gridStrength scenario also proved face masking, regularity, scale direction and PNG output. No aggregate gate or measured performance run.

### Integer tile columns on every side
- Change ID: iceberg-face-columns
- Request: давай везде делать клетку по граням, но я хочу иметь возможность делать разный масштаб клеток. И еще нужно чтобы всегда было целочисленное количество плиток по бокам, имею ввиду количество колонок, чтобы случайно не обрезать на полплитки; Короче сделай слайдер с количеством колонок плиток для граней
- Later localized controls/material edit. Routes: schema/controls and renderer. Re-read workflow and component rules for integer sliders; reuse unchanged already-read Plan/Implementation and acceptance contracts. No separate plan needed.
- Decision: Four independent integer column counts (front +Z, right +X, back −Z, left −X), 1–32 with unit step, discrete value semantics and visible ticks. Replace both scale sliders and organic settings. Keep shared grid thickness/strength. Each complete width has exactly N square cells; height uses the same world cell size, anchored at the base. The irregular upper rock boundary still clips the grid.
- Inventory: All four counts are finite parameters with no dependent branches. Panel owns each precise count globally; canvas retains shared orbit. New targets avoid interpreting persisted fractional scales as integer counts; other saved parameters remain canonical.
- Render plan: Same bounded retained mesh, uniforms and shared preview/export shader. Remove organic noise; choose a face's count from fixed object coordinates and use count / width. No new resources or passes.

Verification tier: focused later edit
Reason: Replace side pattern material and six controls while retaining scene and export lifecycle.
Run: Structural render assessment and product/schema coverage; six focused browser controls, integer edits, per-face independence, rendered full-column spacing including edge alignment, rear-face inspection, and PNG comparison.
Skip: Aggregate delivery/build, unrelated behavior and measured performance.

Results:
- Four independent counts replace the scale/organic controls; every vertical side now uses the square grid. Shared thickness and strength retain their previous targets and saved values. Counts are 1–32 with built-in discrete markers, and shader frequency is whole columns / object width on the corresponding signed face.
- Numeric editor and smooth dragging retain the runtime's canonical numeric values, including fractions. The integer count displayed by the standard control is matched by rounding/clamping tile subdivision once in the shared shader. A 7.3 entry renders exactly 7 columns on preview and export; no custom value model or copied runtime modification.
- Structural renderer assessment and product/schema coverage passed. Initial inventory declared a 48-position continuous-visual control as a finite selector, but that runtime inventory only recognizes discrete visual sliders. Chose 32 marked integer positions as a better fit and verified coverage successfully.
- Development front/back browser checks passed at 1, 7 and 32 columns, including numeric entry, exact interior divider count/positions against both outer cube edges, and no pixel changes when editing a different side. Front proof also preserves 13 complete columns after width changes from 2.35 to 3.1.
- Corrected the product browser helper to edit the real portaled numeric textbox. It previously filled the smooth hidden range input, whose fractional step is different from the displayed count domain. Pixel assertions now aggregate before asserting instead of allocating an assertion per pixel; stopped the stalled diagnostic worker. Rock preservation samples the interior of a 3×3 material neighborhood to exclude antialiased mixed seam pixels.
- Embedded Browser showed 7 columns on the initial front face and 18 on the right, plus grids on the other faces after orbit. Restored original pose and confirmed those new settings survive navigation; existing relief, jagged edge and 50% zoom remain.
- Final protected `TOOLCRAFT_TEST_PORT=3100 npm run test:feature -- iceberg.frontColumns iceberg.rightColumns iceberg.backColumns iceberg.leftColumns iceberg.gridThickness iceberg.gridStrength` passed all six scenarios (run 71a90847-95c7-48cc-bbfc-266d95dcff02). Every face passed real held-pointer output and discrete-marker proof, whole-column checks at 1/7/32, and isolation from another face's setting. The material scenario preserved silhouette and rock interior pixels, restored exact plain output at zero strength, and decoded different printed/plain 1536×2048 PNGs. No aggregate gate, source runtime edits or measured performance run.

### Straight grid through irregular ice cutouts
- Change ID: iceberg-grid-seam-continuity
- Request: проверь линии. Они кое-где ломаются
- Inspected annotated still codex-clipboard-2f088565-9f57-4c34-aa80-de934049ac43.png and the current shader. Root cause: cap ice cutouts inherit sloped mountain positions; world-coordinate grid bends at the wall/cap join and terrain derivatives change its antialiasing. This is a local material projection mismatch.
- Routes: broken visual behavior and renderer. Re-read workflow, apply already-read systematic-debugging skill and reuse unchanged Plan, Implementation and Verification contracts from this conversation. Local fix, no additional plan document or controls.
- Decision: Intersect the orthographic view ray with the cube's vertical planes to evaluate one planar grid through wall and cap ice cutouts. Choose the intersected signed face and its existing whole-column count; derive antialiasing from that same projected coordinate. Keep original material mask, rock shading, geometry and all saved settings.
- Renderer: One view-direction uniform updated by the shared preview/export camera configuration; fixed arithmetic only, same retained resources, passes and backing. Run existing structural render assessment before implementation.

Verification tier: focused later visual fix
Reason: Grid projection and camera uniform only; no geometry or control change.
Run: Failing pixel regression against straight projected cube grid lines at the initial and rotated views; structural assessment; focused gridThickness continuity and gridStrength mask/PNG cases; embedded seam inspection.
Skip: Aggregate/build, full orbit/control/export matrices and measured performance.

Results:
- Reproduced before editing the renderer with a 1024px rendered-pixel regression: 12 ink pixels lay outside the straight planar grid, maximum deviation 5.74px. The test independently projects straight cube-plane line segments and checks real printed-versus-plain output, including cutouts.
- Added one camera direction uniform to the retained engine's shared configure path. Grid coordinates on ice now come from the first vertical cube plane intersected along the view ray; wall and cap cutouts share those coordinates and derivatives. Existing whole-column counts, material mask, geometry, rock shading and output bounds are preserved. Exact top/bottom views omit the edge-on side grid.
- Structural render assessment passed. After the fix, initial and rotated views report zero off-grid pixels, with maximum distance to ideal centerlines 1.26px / 1.22px (stroke/antialiasing allowance 2.5px). The first diagnostic passed assertions but exceeded 30s because it transferred four million JSON pixel values per frame. Transferring the alpha-filtered red channel as compact bytes preserves identical observations and finishes in 13.9s; no budget or runtime changes.
- Embedded Browser at localhost:3002 confirmed straight cutout lines at 70% zoom and after a real model orbit. Restored the original pose, 50% zoom, and all user's existing controls; fresh navigation preserves them. New reference is a still, so no additional motion preprocessing.
- Final protected `TOOLCRAFT_TEST_PORT=3100 npm run test:feature -- iceberg.gridThickness iceberg.gridStrength` passed both scenarios (run 51d419b7-e5eb-4107-bfd7-d8ca7b05bb3b). Straight-grid regression passes before/after rotation; masking preserves silhouette and rock interior, zero strength restores exact plain pixels, and decoded 1536×2048 PNG output contains the changed grid. No aggregate gate or measured performance run.

### Tonal engraving on the rock
- Change ID: iceberg-rock-engraving
- Request: посмотри на референс, думаешь мы можем добавить возможность применения такого паттерна?
- Clarification: Только на скалу, сохранив клетку на кубе.
- Inspected still codex-clipboard-7589658f-cb26-413d-9c96-a8a20f1b8624.png: fine parallel horizontal engraved ink, wider/darker in shadow, fine/light over highlights. Labels, birds and waterline are reference context, not requested features. No new motion input.
- Routes: schema/controls and renderer. Read workflow; reuse unchanged previously-read Plan/Implementation/Verification contracts. Local material addition within the existing runtime scene; no separate plan document needed.
- Decision: Optional Material / Гравюра switch, off by default, reveals three built-in continuous sliders for strength, scale and stroke thickness. Horizontal print coordinates derive from the canonical camera frame, with tonal line width from existing rock light/relief. Apply before the existing rock/ice mix, preserving the cube grid and irregular material boundary. Off restores the existing image exactly.
- Ownership/inventory: Material remains one coherent appearance/reset scope (9 visible controls when on). Engraving switch is a finite branch with exactly three explicit applicability dependents; all properties are global panel edits and orbit remains on canvas. This is an optional material effect, not an application mode.
- Renderer: Three number uniforms, one boolean uniform and one scalar varying; periodic box-filtered stroke coverage prevents subpixel shimmer and preserves tone. Same retained preview/export resources and bounded arithmetic; camera-frame coordinates keep frequency consistent across zoom and export resolution. Add the toggle to canonical pipeline invalidation before structural assessment.

Verification tier: focused later material feature
Reason: One optional shading effect and its four controls, no geometry or scene lifecycle change.
Run: Structural render assessment/product coverage; switch/applicability and three held-pointer browser cases, horizontal periodicity/scale and tonal variation, exact base/silhouette preservation, off restoration, rotated inspection and PNG output.
Skip: Aggregate/build, unrelated control and performance matrices.

Results:
- Added the optional rock-only shader through the shared preview/export engine. Material / Гравюра reveals strength, scale (0.5–3) and thickness. Existing contrast, illumination and relief determine tonal stroke width; default off preserves earlier saved work until explicitly enabled.
- Structural render assessment and product/schema coverage passed. Focused browser development passed all four scenarios; protected `TOOLCRAFT_TEST_PORT=3100 npm run test:feature -- iceberg.engravingEnabled` then passed the same exact branch plus its three derived applicability dependents (run add7f90e-9c44-469e-adb3-8e34f77df093). Every slider has hidden/visible applicability evidence and rendered output changes during held-pointer movement.
- Actual 512px observations found 30,365 changed rock pixels, zero changed silhouette-alpha pixels, and zero changed pixels in 15,215 cube-interior samples, including large jagged-edge cutouts. Disabling restored the original bytes exactly. Real engraved/plain 1536×2048 PNG downloads decoded successfully with different pixel hashes.
- Independent frequency analysis of rendered rock patches measured 35 cycles at scale 1.5 and 17.5 at scale 3; adjacent facets both measured 17.5. Embedded Browser inspection confirmed fine and coarse horizontal tonal strokes, retained relief shading and stable horizontal direction after orbit. Restored the original pose, left engraving enabled at scale 1 / strength 1 / thickness 50, and verified those settings survive a real navigation reload. Cube counts and other existing controls remain preserved at localhost:3002.
- No new geometry, resources, animation, motion reference processing, aggregate gate or measured performance run.

### Directional dramatic lighting
- Change ID: iceberg-dramatic-light
- Request: I need more dramatic light
- Later localized material/control edit. Routes: schema/controls and renderer. Read workflow in full; reuse unchanged Plan, Implementation and Verification contracts already read for those same surfaces. No separate plan needed.
- Decision: Add one Material / Драматичность slider, 0–1 with default 0.75. Blend the existing elevated fill-heavy light toward a lower directional key, reduce ambient fill and strengthen the illuminated facets. Existing light azimuth remains independently editable. Zero restores the previous lighting. The same lighting feeds rock engraving and the cube's shading while preserving geometry and grid placement.
- Inventory/renderer: Global panel property, continuous and always applicable; Material has 10 simultaneously visible controls with engraving enabled, one coherent appearance reset scope. A numeric uniform uses the existing retained preview/export passes; no new resources, sampling, topology or lifecycle. Structural assessment precedes the shader edit.

Verification tier: focused later material edit
Reason: One lighting uniform and shared shading arithmetic; no renderer lifecycle change.
Run: Structural assessment and focused lightDrama / light browser outcomes, held-pointer changes, increased light-dark separation with bright facets retained, engraving compatibility and silhouette preservation; embedded visual comparison.
Skip: Aggregate/build, unrelated controls and measured performance.

Results:
- Added the always-visible Material / Драматичность slider, default 0.75. Existing numeric parameter plumbing supplies its uniform to retained preview and export. At zero, all original lighting terms remain; increasing it lowers the key, reduces fill and increases direct illumination, before engraving derives its tonal ink.
- Structural assessment and product acceptance coverage passed. First pixel proof exposed excessive shadow coverage: changing the horizontal light proportions also shifted its azimuth, and the lower key lacked enough highlight energy (10–90% tonal range fell from 209 to 136). Applied systematic debugging to that renderer cause: preserve the original horizontal proportions and balance key gain against elevation. The same assertions now pass with range 248, 10,266 brighter rock pixels, 17,807 darker pixels and zero alpha changes. Returning to zero restores exact softer pixels, pose is unchanged, and engraved ink responds to the stronger light.
- Embedded Browser verified both the plain material and engraving at the user's existing camera, colors, grid and light angle. Left engraving enabled and drama at 0.75 on localhost:3002.
- Final protected `TOOLCRAFT_TEST_PORT=3100 npm run test:feature -- iceberg.lightDrama iceberg.light` passed both focused cases (run f62ecc95-368b-48eb-b6ca-de0fef36a98d), including live held-pointer updates and the lighting assertions above. No aggregate or performance proof was run.

### Workspace without the finite artboard boundary
- Change ID: iceberg-unclipped-workspace
- Request: сделай так чтобы изображение не обрезалось при зуме рамками канваса
- Inspected the current embedded Browser and the runtime scene surface. The saved workspace had Infinity canvas disabled; the runtime's finite surface explicitly uses the artboard as an overflow-hidden clip. Product canvas has no additional CSS clip, and zoom scales the scene and artboard together.
- Used the existing runtime-owned Infinity canvas switch to remove that artboard boundary in the user's saved workspace. No product or copied runtime implementation change is needed, and no new control or source-default rewrite was introduced. Read workflow and runtime-boundary; applied the existing diagnostic/browser workflow.

Verification tier: focused workspace setting
Reason: Existing runtime mode changed through its real UI; source behavior is unchanged.
Run: Embedded Browser inspection at 70% and 90% zoom, return to original 50%, and reload persistence check.
Skip: Code tests, build and performance proof; no implementation changed.

Result: Infinity remains checked after a real navigation reload; finite width/height controls are absent and the white background fills the viewport without an artboard boundary. Original 50% zoom and the user's model/material settings remain. The browser viewport remains the visible window onto the scene; zoomed content outside that window can be reached with runtime pan.

### Preserve the cube tip beyond the original render frame
- Change ID: iceberg-dynamic-render-bounds
- Request: все еще обрезается; screenshot codex-clipboard-39145ce2-f6b4-471d-a2d9-fae39fdede63.png shows a flat cut at the lower cube tip inside the viewport at 145% zoom.
- Correction to previous diagnosis: Infinity removes the artboard clip but cannot remove the product renderer's fixed camera frustum. Reproduced the cut at depth 2.5 with default pose and Infinity enabled. Static 1000×1400 product bounds and orthographic ±2.5 / ±3.5 planes do not cover all reachable geometry/poses.
- Routes: broken visual behavior and renderer, with shared export frame verification. Read workflow; apply systematic debugging and already-read Plan/Implementation/Verification contracts. Local correction to product frame ownership, no new user control or runtime change. Preserve the separate needle-peaks investigation and avoid its terrain-field ownership.
- Decision: Derive conservative projected bounds from the shader's bounded geometry and current camera basis; union with the original frame and add small pixel padding. Share the rect between the runtime scene provider and camera frustum, retaining 200 scene pixels per world unit and the current view center. Expanding the backing exposes geometry without shrinking or recentering the object. Engraving remains anchored to camera-space units rather than the expanded frame height.
- Render plan: Eight box-corner projections per state resolution, bounded by existing width/depth/height/relief controls (extent below 2700 scene pixels per dimension). Existing retained mesh/context/passes, no extra GPU pass. Backing follows CSS × DPR × selected render scale at the new dimensions; zoom does not change scene bounds.

Verification tier: focused renderer framing fix
Reason: Dynamic product bounds and orthographic frustum, shared with export; controls and topology stay intact.
Run: Failing depth-2.5 border-pixel regression; structural render assessment; projected bounds unit checks; focused depth/Infinity/backing browser proof, large geometry and zoom/orbit with no opaque edge pixels, unchanged scene scale, retained canvas, and matching export frame.
Skip: Aggregate/build, unrelated controls, full export and measured performance matrices.

Results:
- Reproduced before the fix with 33 opaque samples on the bottom renderer edge at depth 2.5. The scene provider and shared preview/export camera now use the same projected rectangle; the original composition and world scale stay fixed as that rectangle grows. Camera-space engraving coordinates preserve stroke scale and phase.
- Structural render-plan assessment passed. Two focused camera unit checks passed: default projection/placement stays unchanged, and the maximum bounded geometry box remains within the frustum across front, back, overhead, underside and sampled oblique poses.
- Final protected `TOOLCRAFT_TEST_PORT=3120 npm run test:feature -- iceberg.depth iceberg.infinity iceberg.engravingScale` passed all three browser scenarios (run `3838b0a0-c8ef-4c19-a558-6cab7818c3e6`, 37.1 s browser time). Depth 2.5, 150% zoom, maximum width/height/relief, and a real gizmo rotation all produced zero opaque pixels on the four internal frame edges. Zoom preserved the scene rectangle and enlarged backing from 1200×1697 to 3000×4242; each observation matched actual CSS × DPR × 2 within one pixel. Canvas identity remained unchanged. The real 2K PNG was 1076×2048, matched the expanded frame, and had no ink touching its outer edge. Infinity parity and engraving frequency checks also passed.
- The existing protected backing recipe requires a fixed CSS frame, so its held-pointer edit now changes grain rather than height; frame-changing geometry is covered by the depth scenario above. `TOOLCRAFT_TEST_PORT=3110 npx playwright test e2e/product-iceberg-backing.spec.ts --output=.toolcraft/browser-artifacts/framing-backing` passed using the unchanged protected evidence helper. Including that case in the feature runner hit an existing authority-analysis rejection of `e2e/browser-render-scale-evidence.ts`; no protected file was changed or proof forged. The separate focused Playwright pass is the recorded backing proof.
- One feature attempt was invalidated because the concurrent terrain task changed its seam-check helper after the authority seal; reran successfully against the stable files. During test development, a late proof-session creation reloaded the page and invalidated the retained element handle; passing the existing session corrected that test setup.
- Embedded Browser inspection confirmed the complete lower corner with depth 2.5 after a real reload. Restored the prior depth 1.2 and 70% zoom, retained Infinity and the other existing settings, and left the updated app available at localhost:3002. No aggregate gate or measured performance run.

### Fast inertial plate separation
- Change ID: iceberg-plate-separation-animation
- Request: теперь давай добавим анимацию. Начальный стейт - блок под горой целый, не разделенный на пластины. Финальный стейт - блок разделен на пластины. Это должно быть довольно быстрое инерционное движение. Добавь элементы управления скоростью, лупом и тд
- Later animation feature. Routes: schema/controls, playback timeline, renderer, export and performance lifecycle. Read the required workflow and the matching Plan, Implementation and Verification documents before editing. Added the concise implementation plan at `docs/plans/2026-09-15-plate-separation-animation.md` because the change crosses timeline, renderer and export behavior.
- Decision: Use the runtime-owned playback timeline as the single animation surface. Default duration is 1.2 seconds; its Duration editor controls speed, while the runtime supplies Play/Pause, scrub and Loop. The existing Plate gap remains the final separation distance. Timeline progress drives a monotonic quartic ease-out from zero gap to the selected gap, giving a fast inertial settle without overshoot. Exact loop end maps to the closed start for a seamless forward-only loop; non-loop end remains fully separated.
- State/output: Timeline time, duration and loop state evaluate the effective plate gap once for preview and PNG export. Scene bounds retain the conservative final-state rectangle throughout playback so the frame and backing do not breathe. Preview freezes only the evaluated animation time during viewport or model-orbit interaction and resumes from runtime time afterward; the user's playback state is unchanged.
- Renderer: `timeline.time` is a canonical preview/export invalidation input. Preview frequency is frame-driven during playback, resources remain retained, and playback/scrub invalidate only the preview surface. No new geometry, pass, provider or resource was introduced.

Verification tier: Tier 2
Reason: Runtime timeline integration changes preview, export and backing lifecycle while preserving the existing plate topology and material controls.
Run: Animation easing/unit coverage; product defaults and renderer assessment; protected timeline behavior including scrub, duration, loop and pause/resume; initial/final rendered component counts and current-frame PNG comparison; playback backing proof; embedded Browser inspection.
Skip: Aggregate delivery gate, video export and measured performance. This is a later focused edit, the user did not request video export, and no measured performance iteration was authorized.

Results:
- `pnpm ai:check` reached a protected code-health script and failed there with a Node call-stack `RangeError`. Running the same signed checker directly with `node --stack-size=16384 scripts/check-toolcraft-code-health.mjs` passed; no protected source was changed. Focused renderer assessment and the animation/product unit tests passed during development.
- Final `pnpm vitest run src/app/iceberg-animation.test.ts src/app/iceberg-product.test.ts` passed 6/6 tests. It covers the closed start, fast monotonic ease-out, selected final gap, exact non-loop end, loop seam, source defaults and retained renderer assessment.
- Protected `TOOLCRAFT_TEST_PORT=3130 npm run test:feature -- renderer.timeline` passed its registered browser scenario (run `e9f57cad-56d3-409f-89ef-a922cba1a9cd`). Real rendered alpha has one connected base component at Home and five at End; scrub, edited duration, loop, actual playback samples, pause/resume and non-loop restart all passed. Real start/end 2K PNG downloads decoded with different pixel hashes, proving export follows the current timeline frame.
- The combined feature-runner attempt was rejected before browser execution by its existing authority analysis of `e2e/browser-render-scale-evidence.ts`; no protected helper was changed. Separate `TOOLCRAFT_TEST_PORT=3140 npx playwright test e2e/product-iceberg-backing.spec.ts --output=.toolcraft/browser-artifacts/plate-animation-backing` passed, including CSS × DPR × 2 backing during control interaction, active timeline playback and steady paused state. The first attempt exposed that the Material section was collapsed; the app-owned test now opens its real section header before locating Grain.
- Embedded Browser inspection at localhost:3003 confirmed the closed block at Home, the fast inertial separation under real Play, four lower plates plus the upper mountain piece while paused, visible Play/Pause, scrub, Duration and Loop controls, and default duration 1.2 seconds. The selected tab was returned to the closed start frame and left running locally. No aggregate gate, video export or measured performance run.

### Runtime video export
- Change ID: iceberg-video-export
- Request: как мне экспортнуть видео?
- Primary export evidence: user message `01a09f46-07d0-7cc0-84c5-b5f6e27d7cd2/01a0a43e-27eb-76a3-8b3c-3892642c657a`, exact quote `как мне экспортнуть видео?`. This establishes explicit video delivery intent; image export remains available and SVG remains unrequested.
- Routes: Setup/export, playback timeline, renderer and acceptance. Read the canonical setup/export contract and reused the already-read matching timeline, renderer, performance and verification contracts. Added the concise cross-surface plan at `docs/plans/2026-09-15-video-export.md`.
- Decision: Add the built-in `videoExportModule` after image export. Runtime owns MP4/WebM selection, Current/4K sizing, fixed 30 FPS offline schedule, encoding, progress, background and download. The existing shared `rasterFrameRenderer` already evaluates immutable timeline state per requested frame, so product code adds no recorder, encoder, canvas allocation or wall-clock loop.
- Saved defaults: Add MP4 / Current for the new targets. Preserve the user's latest two-second duration and other saved settings, while restoring time zero and paused playback so the authored initial state remains the closed block instead of saving a transient playing frame.
- Acceptance: The real artifact proof decodes a one-second test export for fast coverage, verifies 30 packets/timestamps, exact duration, finite 1200×1600 dimensions, changing closed-to-separated frame hashes and representative product pixels. It then repeats the timeline in Infinity and verifies the fixed 1000×1400 all-frame union. WebM and 4K choices are also exercised through the real controls.

Verification tier: Tier 2
Reason: Adds a requested artifact module and a runtime offline schedule over the existing animated WebGL renderer.
Run: Product/schema coverage, renderer assessment, real MP4 decode/timing/dimension checks in finite and Infinity modes, format/resolution controls, and embedded Browser inspection.
Skip: Aggregate delivery gate and measured performance; this is a focused later feature and no targeted performance iteration was requested.

Results:
- Focused product/unit coverage passed 6/6 tests. The development Playwright artifact test passed after measuring stable product pixels for the user's current composition; both finite and Infinity MP4s contain 30 frames over exactly one second, have three different decoded sample hashes, and preserve their respective fixed frames.
- Final `TOOLCRAFT_TEST_PORT=3150 npx playwright test e2e/product-iceberg-video-export.spec.ts --output=.toolcraft/browser-artifacts/iceberg-video-export-dev` passed in 20.3 seconds. The MP4 decoder verified finite 1200×1600 and Infinity 1000×1400 artifacts, exact 1000 ms duration, 30 monotonically timestamped packets and changing product pixels. WebM and 4K were selected through the runtime controls before returning to MP4 / Current.
- The protected feature-runner attempt (journal run `3cdfa771-872b-4241-98f9-2e851d1eedb6`) was rejected before browser execution by its authority analysis because the protected `browser-media-export-evidence.ts` helper transitively imports Playwright through `video-artifact-inspection.ts`. This is the same protected-helper limitation already observed for backing evidence; no protected file was changed and the separate app-owned scenario above uses those exact helpers and passed.
- `pnpm exec tsc --noEmit` and `git diff --check` passed. The signed `pnpm ai:check` still reaches `toolcraft-dom-type-children.mjs` and overflows Node's call stack; raised stack limits also fail inside the same protected type walker. This is recorded as a framework-check limitation rather than bypassed or patched.
- Embedded Browser at localhost:3003 shows Image Export followed by Video Export with MP4/WebM and Current/4K controls, plus `Export MP4` in the sticky actions. Timeline remains visible, the playhead was returned to zero, and the existing persisted user settings were preserved. No measured performance run.

### Retina-width video canvas
- Change ID: iceberg-retina-video-canvas
- Request: у меня ретина экран. На экспорте я бы хотела получить видео c канвасом шириной 3330px
- Later focused export-default edit. The runtime's `Current` video resolution uses the finite canvas pixel dimensions directly; device pixel ratio does not multiply the encoded artifact. Preserving the established 3:4 composition makes the new finite canvas 3330×4440 px.
- Set source canvas defaults to 3330×4440, retained finite mode and `Current`, and raised the source zoom to 30% so the large frame remains practical in the editor. The open embedded Browser workspace was synchronized to the same dimensions and `WebM / Current` while preserving the other user settings.
- Browser codec probing showed that selecting MP4 at 3330×4440 falls back to a WebM artifact on this machine. The signed Video Export contract requires MP4 as the source default, so code defaults remain `MP4 / Current`; the user's persisted workspace is left on `WebM / Current` for a predictable exact-resolution export.

Verification tier: focused later export-default edit
Reason: Changes finite canvas and video defaults plus their exact artifact dimensions; the renderer, timeline schedule and encoding owner are unchanged.
Run: Product/default unit coverage, TypeScript, diff validation, real 3330×4440 WebM decode with complete animation, and embedded Browser state inspection.
Skip: Aggregate delivery and measured performance; this is a focused defaults adjustment with unchanged render and export architecture.

Results:
- `TOOLCRAFT_TEST_PORT=3170 npx playwright test e2e/product-iceberg-video-export.spec.ts --output=.toolcraft/browser-artifacts/iceberg-video-export-retina` passed. The downloaded WebM decoded at exactly 3330×4440, one second, 30 FPS / 30 scheduled frames, with changing closed-to-separated samples; Infinity still exported its fixed 1000×1400 union.
- Embedded Browser at localhost:3003 retains finite canvas inputs 3330 and 4440 and `WebM / Current` after a real navigation reload. No runtime or copied Toolcraft source was changed.

### Uniform contour width at plate edges
- Change ID: iceberg-plane-line-width-uniformity
- Request: проверь, мне кажется тут некоторые лини у краев толще, чем остальные, проверь на всех плоскостях
- Later focused renderer correction. The supplied still showed a widened contour near an exposed plate edge. Pixel auditing reproduced the issue on all four lower plate caps: the warped phase field used a fixed phase-space stroke width, so local field compression expanded some bends from the usual 4–5 px to 7 px. This was not an added perimeter border.
- Reconstructed the phase gradient in normalized plane coordinates from screen derivatives and compensated the stroke threshold by its local magnitude. The same noisy flow, density, direction, slice phase and antialiasing remain; only physical line width is normalized. Added a raster regression over every plate, auditing left/right and top/bottom edge bands against the interior.

Verification tier: focused later renderer fix
Reason: One shader-width calculation and directly related plane-pattern proof; topology, controls and renderer lifecycle are unchanged.
Run: Four-plane edge/interior width audit, all three plane pattern browser cases, renderer assessment/product coverage, TypeScript, diff validation and embedded Browser inspection.
Skip: Aggregate delivery, unrelated controls, export and measured performance; no renderer resources or pass frequency changed.

Results:
- Before the fix, edge/interior width distributions reached 6–7 px while their medians were 4–5 px. After the fix every plate and both audited edge pairs report 5 px for edge/interior median and p90, within the one-pixel raster allowance.
- `TOOLCRAFT_TEST_PORT=3180 npx playwright test e2e/product-iceberg-patterns.spec.ts --grep 'planeLine' --output=.toolcraft/browser-artifacts/plane-line-width-uniformity` passed 3/3 cases. Thickness, density, direction, curvature, print contrast, vertical-face exclusion and distinct plate phases remain covered.
- `pnpm vitest run src/app/iceberg-product.test.ts` passed 4/4, including structural render assessment; `pnpm exec tsc --noEmit` and `git diff --check` passed. Embedded Browser inspection at the separated end frame confirmed the consistent contours; restored the saved 60% zoom and enabled loop state afterward.

### Lighter separated-block perimeter
- Change ID: iceberg-grid-edge-stroke
- Request: мне кажется все еще толсто
- The follow-up still identifies the dark horizontal outline on each vertical block face, rather than the white contour print corrected in the preceding edit. A four-face/four-plate shader audit reproduced up to 5 px of perimeter ink beside 3 px interior grid rows. The dedicated block boundary could sit beside or nearly coincide with the regular horizontal grid, while the adjacent printed cap already supplies a dark visual edge.
- Within half a grid cell of each separated boundary, replace the nearest regular horizontal row with one dedicated perimeter stroke and render that perimeter at half the normal grid width. Vertical grid columns continue to meet the edge, and the rest of the face grid is unchanged.

Verification tier: focused later renderer fix
Reason: One side-grid stroke-composition correction plus exact four-face/four-plate proof; no geometry, control or renderer lifecycle change.
Run: Boundary width audit across 16 face/plate combinations, visible/hidden face projection, straight-grid continuity before and after orbit, structural renderer assessment, TypeScript, diff validation and embedded Browser inspection.
Skip: Aggregate delivery, export and measured performance; the pass structure and workload are unchanged.

Results:
- The 16 audited separated boundaries are now one pixel wide at the fixed test scale while their interior grid lines remain 2–4 px. Every boundary stays visible and none is wider than its face grid.
- `TOOLCRAFT_TEST_PORT=3190 npx playwright test e2e/product-iceberg-patterns.spec.ts --grep 'gridThickness' --output=.toolcraft/browser-artifacts/grid-edge-width-thin` passed. All 72 facing samples retain ink only on visible physical faces; projected straight-grid checks before and after orbit report zero off-grid pixels.
- `pnpm vitest run src/app/iceberg-product.test.ts` passed 4/4, including the structural render assessment; `pnpm exec tsc --noEmit` and `git diff --check` passed. Embedded Browser inspection at the separated end frame confirmed the lighter outline, then the saved 60% zoom and enabled loop state were restored.

### Restore the saved wave pattern
- Change ID: iceberg-default-wave-pattern-restore
- Request: изменился волнообразный паттерн, поставь тот который был выбран дефолтными настройками
- The preceding physical-width normalization changed the authored wave morphology and could over-expand phase coverage at high thickness. The open workspace also held `38 / 42 / 15`, while source defaults specify line thickness `90`, density `84` and direction `24°`.
- Restored the original fixed phase-space stroke calculation, preserving its varied organic bands and the existing noise/phase field. Removed the superseded uniform-width audit. Kept the separate side-face perimeter correction unchanged.
- Applied the source-default pattern values through the real controls in the embedded Browser. A real navigation reload retained `90 / 84 / 24`.

Verification tier: focused later renderer/default restoration
Reason: Reverts one wave-width calculation and restores three existing saved values; no control, topology or renderer lifecycle change.
Run: All three plane-pattern browser cases, structural renderer assessment/product coverage, TypeScript, diff validation and embedded Browser persistence/visual inspection.
Skip: Aggregate delivery, unrelated side-grid proof, export and measured performance; the side perimeter shader and workload are unchanged.

Results:
- `TOOLCRAFT_TEST_PORT=3180 npx playwright test e2e/product-iceberg-patterns.spec.ts --grep 'planeLine' --output=.toolcraft/browser-artifacts/default-wave-pattern-restored` passed 3/3, covering thickness, density, direction, curvature, distinct plate phases, vertical-face exclusion and print contrast.
- `pnpm vitest run src/app/iceberg-product.test.ts` passed 4/4, including structural render assessment; `pnpm exec tsc --noEmit` and `git diff --check` passed. The restored values remain visible at localhost:3003 after reload.

### 2026-09-17 — Public app release and portable focused development

- Request: import the supplied Neon Iceberg archive, use the accepted-delivery/light-development policy of the other published applications, deploy publicly, add a Case Study, and support CLI installation. Website/source work remains on the explicitly requested `case-studies` branch.
- Inspected the archive, current Neon Globe release, canonical deployment policy, template validator and signed gallery workflow generator. No new visual feature or reference recreation was requested.
- Generated the accepted-gallery overlay with the canonical maintainer generator in an isolated Git snapshot. `toolcraft-release.json` records the actual owner request and archive SHA-256. It is signed owner acceptance, not a fabricated successful aggregate delivery or performance receipt. Future changes use exact feature checks.
- All 57 acceptance IDs map to 50 existing functional scenarios; no inherited protected-file mismatches or inventory errors. Runtime, product source, saved defaults, assets and dependency versions remain pinned.
- Packaging: retained the original `package-lock.json` and removed the redundant `pnpm-lock.yaml` because the CLI correctly refuses conflicting package-manager lockfiles. Fresh npm ci succeeded without changing the npm lockfile.
- Host: generated the same four source-owned desktop-access bootstrap files used by the other published apps and regenerated their manifest through the canonical signing helper. Added Vercel routing for `/demos/neon-iceberg`.
- Test maintenance: the inherited color scenario assumed a paused scene and an expanded Material panel, unlike the saved defaults. Its preparation now waits for scene readiness within the existing 30-second budget, pauses playback and opens Material. Assertions and runtime behavior are unchanged. Initial attempts failed during setup; the corrected `npm run test:feature -- iceberg.rockColor` passed in 18.1 seconds.
- Verification: production build passed; four plate/animation unit tests passed; 12 canonical workflow tests passed; production-browser smoke verified timeline output changes and a real 3072×4096 PNG download, with no page errors or failed application resources. Template validation passed with signed manifest v3. A dependency-free copy returned `focused-development-only` and `checksRun: []`.
- Website: real exported artwork supplies the JPEG quality-90 cover and social preview; catalog/routing tests passed 152/152. No asset reduction, runtime upgrade, aggregate delivery batch or measured performance audit was performed.
