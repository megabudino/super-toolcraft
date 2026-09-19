# Implementation Worklog

This file records product decisions and the evidence behind them.

## Status

Mode: product

The Percents hero editor preserves its eight standard typography and spacing controls and adds the
complete Percent Hero WebGL wave generator as a middle background layer. The original hero base sits
below the wave and the unchanged header, copy, logos, and video iframe sit above it. Artifact export
remains intentionally absent by user request.

## Automatic Delivery Lifecycle

- First product delivery uses one bare `npm run verify:delivery` run for the complete functional receipt.
- Later edits use only the focused unit and browser checks that cover the changed behavior.
- A localized performance complaint can authorize a measured targeted iteration only when the exact affected path is known from the request or clarification.
- A complete performance audit remains separate and requires explicit user authority before `npm run verify:perf`.

## Decision Trail

### Iteration 4 — Forward Flow in the main hero editor

- Request: “применить механику из плана туда при этмо не менять текущие настрйоки сцены”; then “сбрось их и тести на дефолтных настрйоках”. Target is the main editor on port 3005, not the separate static app on 3002. Export remains excluded.
- Task type: Later renderer/timeline/control change, with an explicitly requested reset of the browser workspace after preserving the authored scene implementation.
- User-visible result: Flow replaces Motion and Light motion. Ribs travel continuously in the selected direction; the camera, light, tint, wave shape and twist no longer oscillate. Existing scene defaults, hero typography/layout, wave placement and masks are retained. The optional glow orbit defaults to zero to keep authored lighting.
- Source/reference checked: The supplied static Flow plan and implementation; the main app's existing GPU deformation, schema, imported settings and retained scene; the live main editor on 3005.
- Reference inputs: `referenceInputs: []`; no new motion reference. Harness frames are implementation diagnostics, not a supplied reference.
- Docs/contracts read: Local AGENTS.md and workflow.md. Selected routes: schema/controls, renderer, timeline. All routed Plan/Implementation/Verification documents were compared byte-for-byte with those already read in full in the static app and were identical; those readings were reused. Toolcraft writing-plans and systematic-debugging workflows were used.
- Contract rules applied: controls-product-coverage, controls-section-inventory-required, timeline-mode-choice, timeline-enabled-behavior, renderer-technique-inventory, persistence-policy-explicit, interaction-surface-ownership, workflow-required.
- View interaction intent: Preserve the authored fixed camera and viewport controls; Flow moves ribs, not the camera.
- Interaction ownership: Panel owns the four Flow settings; standard timeline owns transport; mask handles and viewport navigation retain their existing ownership. No custom playback surface.
- Animation Intent Inventory: Runtime playback progress is the sole clock. New timelines default to 12 seconds; restored durations remain user state. Whole-rib travel and whole-turn optional orbit close the loop without reversing. No keyframes/layers/export added.
- Decision: Extend the existing deformation instead of replacing it with the static fork's different curve model. Transport the rib center, resample dome radius, retain profile offsets, and then apply the original wave/twist formulas. The same uniforms reach physical, depth and GTAO normal materials. An appended guard rib closes finite ends while retaining every original rib's geometry and normals.
- Alternatives rejected: Copying the Rings scene/presets, resetting browser values during implementation without user instruction, retaining the oscillator controls, changing camera/light values to simulate travel, rebuilding meshes every frame, or changing renderer quality/provider.
- State/output mapping: Existing scene values → readHeroParams; Flow values plus standard timeline progress → unwrapped signed travel; shader boundary wraps by one pitch → retained geometry deformation → original post/mask pipeline → wave canvas below unchanged hero iframe. No scene default or persistence-key changes. The user later explicitly authorized Reset controls; the UI reset restored all scene/layout defaults, and Duration was restored to 12 seconds through the standard timeline control.
- Performance intent: ordinary-product-work
- Workload/lifecycle: Existing 310-rib default and 40–400 authored range, plus one guard. Flow travel/direction and timeline invalidate shadow/shade only; optional glow invalidates shade only. Renderer, geometry and environment remain retained, with the existing backing scale and viewport interaction coalescing.
- Plan: `docs/plans/2026-09-08-main-hero-flow.md`.
- Verification tier: Tier 3 — focused later animation change. No full tests, build, delivery, AI/docs/integrity audits, browser contract matrix, kernel or performance benchmark.
- Verification: 27 focused product tests passed in six files; one unrelated fixture was skipped. TypeScript passed after correcting an existing defaults-test command (`controls.apply` with an unsupported values payload) to canonical `controls.setValue` commands and updating its timeline expectation for Flow. Browser scenario definitions replace the superseded Motion scenarios but the contract suite was not run.
- Observed evidence: The 960×368 before/after original pose differs by at most 1/255 per channel (mean 0.00236 byte levels), and every pre-existing non-motion schema value is identical. Seventeen ordered frames per direction at 480×184 change between phases and have byte-identical endpoints; no browser/shader errors. Diagnostics are in `.toolcraft/browser-artifacts/flow/`. A real embedded-browser reset on 3005 showed the approved white background, spacing 220/180/52, wave width 2826, dome 19.5/180, wave 2.8, and three masks. The standard timeline was set to 12 seconds and Play was restarted; committed frame counters advanced 417 → 765 → 992 and progress crossed the loop boundary (0.9722 → 0.3042). The user-facing 3005 tab is marked to survive the turn.
- Risks: Motion is intentionally subtle at one pitch per 12 seconds with the original low-contrast defaults. Changing duration from the old 40-second cursor left the runtime at its new endpoint until Play was toggled; the app was left playing from the restarted loop. No signed runtime files were changed. Existing GPU-dependent rendering variation remains.

### Iteration 1 — Percents hero typography and spacing editor

- Request: "сделай возможность изменять здесь кегль стандартным компонентом тулкрафта. расстояние между 1 и 2 строками.менять расстояния что указаны на скриншоте во второй картинке. менять положение по вертикали правого блока. менять настрйоки шрифта правого блока по отдельности и расстояние между ними а также двигать правый блок по вертикали"
- Task type: Generated-product schema, live iframe renderer bridge, typography, layout, persistence, and browser acceptance.
- User-visible result: Toolcraft exposes separate standard Font pickers for the two-line heading, right lead, and right body, plus live sliders for the top inset, copy-to-logos gap, logos-to-media gap, right-block vertical offset, and right paragraph gap. Every edit updates the iframe immediately.
- Source/reference checked: The shared Percents `Header`, `HeroSection`, `HeroVideoReveal`, and `PauseableVideo`; the generated Toolcraft runtime and standard `fontPicker`/`slider` components; the existing Recraft iframe pattern; and the three supplied screenshots marking the requested text and spacing regions.
- Reference inputs: `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-27bcfd92-d103-45b0-bc59-d008854f5c77.png`, `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-bde4b889-9b96-43ad-b548-ab1dc3703710.png`, and `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-d1a87755-afac-4087-b956-515c41f27c0b.png`.
- Docs/contracts read: `workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`, `assembly-workflow.md`, `schema-reference.md`, `component-rules.md`, `decision-contract.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `controls-component-layout-invariants`, `interaction-surface-ownership`, `canvas-surface-preserved`, `acceptance-product-observable`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: The hero is a non-spatial two-dimensional website layout with no camera or orientation target.
- Interaction ownership: The controls panel owns all eight global precise-value edits. The iframe canvas is preview-only and does not duplicate these operations with direct manipulation.
- Decision: Use three built-in `fontPicker` controls so family, weight, size, letter spacing, line height, case, color, and opacity stay cohesive; use five continuous built-in sliders for spatial values; serialize canonical values into a versioned origin-checked local `postMessage`; and keep one fixed 2400×1200 canvas so unused canvas-mode controls cannot remount or blank the iframe.
- Alternatives rejected: Custom typography rows, separate size/weight/color controls, DOM cloning inside Toolcraft, direct source writes, an Apply action, artifact export, modifying signed Toolcraft host configuration, duplicating production hero markup, and retaining a user-unneeded Infinity mode that could remount the iframe.
- State/output mapping: Toolcraft values serialize into `percents.hero-preview.settings/v1`; the Next.js bridge validates and clamps the payload, installs requested Google fonts, and maps it to desktop-only CSS custom properties consumed by the shared hero. Toolcraft local storage remains canonical for editor state; no value writes application source. The preview route freezes only its media playback so visual acceptance remains deterministic; the website route retains normal video behavior.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: The live preview requires the Percents Next.js development server on port 3000. Controls intentionally affect the desktop `xl` presentation only, and the canvas is intentionally locked to the supplied 2400×1200 desktop working frame.

### Iteration 2 — Exact Percent Hero wave transfer

- Request: "найди проект percent-hero... полностью один в один перенести в текущий проект тулкрафта... волнообразный фон кладется на фон хиро секции"; "только а тулкрафт"; "сохраняем и добавляем"; "только параметры волны переносим"; "между фоном и всей остальной композицией встает волна как фоновый рисунок"; "экспорт делать не надо".
- Task type: Reference-runtime clone, retained WebGL renderer transfer, three-layer preview composition, playback timeline, editable masks, presets, schema merge, and performance declaration.
- User-visible result: The existing Toolcraft hero preview remains intact. A separately sized and positioned 1920×1080 wave renders between its original white base and the complete foreground iframe. All reference wave controls, presets, circle masks, mask handles, and 40-second playback controls remain available.
- Source/reference checked: The complete runnable `/Users/kusnizza/Projects/percent-hero` Toolcraft application, including its schema, domain modules, Three.js renderer, pipeline, tests, browser scenarios, performance declaration, and worklog; the existing Percents hero Toolcraft app and iframe bridge; and the supplied settings JSON.
- Reference inputs: `/Users/kusnizza/Projects/percent-hero` and `/Users/kusnizza/Downloads/percent-hero-settings (4).json`. Only the JSON `values` record was used; top-level canvas and timeline state were deliberately excluded.
- Docs/contracts read: `workflow.md`, `core/reference-study.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `core/control-selection.md`, `core/layout.md`, `core/performance.md`, `core/timeline-animation.md`, `core/setup-export.md`, `schema-reference.md`, `decision-contract.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`.
- Contract rules applied: `reference-runtime-clone`, `controls-product-coverage`, `controls-section-inventory-required`, `controls-component-layout-invariants`, `interaction-surface-ownership`, `canvas-surface-preserved`, `reference-timeline-coverage`, `acceptance-product-observable`, `persistence-policy-explicit`, `renderer-technique-required`, and `workflow-required`.
- View interaction intent: The transferred wave keeps the inspected reference's authored fixed camera. Camera position, height, yaw, pitch, roll, and FOV remain explicit panel values; no orbit gesture or orientation gizmo is introduced.
- Interaction ownership: The existing eight exact hero property edits remain panel-owned. Wave width and height are exact panel sliders, wave position is the built-in Toolcraft vector pad, and the transferred circle-mask move/resize/rotate gestures remain canvas-owned.
- Decision: Preserve the source renderer and domain behavior, merge its control sections after the existing hero controls, initialize all 74 retained wave values from the supplied JSON, add a 1920×1080 center-relative wave frame, and compose base, wave, and foreground as isolated layers inside Toolcraft only.
- Alternatives rejected: Reimplementing the wave from screenshots, flattening it to an image or video, inserting it into the production homepage, wrapping the source app in an iframe, replacing existing hero controls, importing top-level JSON canvas/timeline state, exporting artifacts, or changing the source renderer's visual math.
- State/output mapping: Existing hero values continue through `percents.hero-preview.settings/v1` into the transparent preview route. Wave values feed the transferred `readHeroParams` and retained `HeroRenderer`; wave frame values set only the middle canvas rectangle. Toolcraft time feeds the reference motion loop. The iframe remains above the WebGL canvas and the white base remains below it.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: The composed preview requires the Next.js development server at `http://localhost:3000`; maximum wave dimensions at render scale two are GPU-heavy; Three.js lighting can vary slightly between GPU implementations.

### Iteration 3 — Approved hero settings as defaults

- Request: "сделай эти настройки дефолтными сильные проверки не запускай"
- Task type: Focused default-value update in the restored iframe-plus-generator app.
- User-visible result: New workspaces and Reset controls use the supplied hero typography, spacing, wave placement, lighting, shape, motion, and three-mask composition.
- Source/reference checked: `/Users/kusnizza/Downloads/hero-settings.json`, exported 2026-09-08; restored app snapshot `2f406f1`.
- Reference inputs: Settings JSON only; no motion reference.
- Docs/contracts read: `workflow.md`, `core/control-selection.md`, `core/layout.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`; existing Setup and performance contracts reused.
- Contract rules applied: `controls-product-coverage`, `persistence-policy-explicit`, `workflow-required`.
- View interaction intent: Existing restored camera interaction is outside this defaults-only change.
- Interaction ownership: Existing panel controls and canvas mask operations retain their current owners.
- Decision: Update the existing canonical wave defaults, hero preview defaults, and normalized wave-placement defaults. Match the workload declaration to the new default width. Canvas size, render scale, and timeline duration already match the file. The saved playback cursor and play/pause state are session state, not design defaults.
- Alternatives rejected: Importing settings on every mount, changing persistence keys, overwriting stored user sessions, or editing the website/runtime to seed defaults.
- State/output mapping: Schema defaultValue → runtime initial/reset values → existing hero iframe message and wave renderer. Normalized placement is converted once into CSS pixels, including its fallback path.
- Performance intent: ordinary-product-work
- Plan: Preserve the supplied JSON as a reference; update `wave-default-values.ts`, `hero-preview-controls.ts`, `wave-placement.ts`, and the workload default; align existing focused tests; verify resolved initial/reset values against the JSON and inspect the live preview.
- Verification tier: Tier 2 — focused default values. Run only the affected defaults/placement/serializer tests and a brief browser check. Skip full tests, build, typecheck, delivery, performance, and broad browser suites by explicit user request.
- Verification: `pnpm exec vitest run src/app/domain/wave-default-values.test.ts src/app/domain/wave-placement.test.ts src/app/hero-preview-controls.test.ts src/app/hero-preview-settings.test.ts src/app/app-schema.test.ts src/app/domain/hero-params.test.ts` passed all 35 product tests in six files (2.73 seconds). Initial state and Reset controls match all 85 approved values after canonical runtime import normalization. A brief embedded-browser check on the separate `http://localhost:3005/` origin confirmed the rendered wave plus website iframe, white background, spacing 220/180/52, width 2826, and the three mask defaults without replacing the user's saved `127.0.0.1` workspace. No full tests, build, typecheck, delivery, performance, or broad browser suites were run.
- Risks: Existing persisted sessions override defaults until Reset controls. The restored preview still requires the website server on port 3000.

## Decisions

### Renderer

- Decision: Keep the existing origin-checked hero iframe and place the transferred retained Three.js canvas beneath it, above an explicit base layer.
- Reason: The source WebGL implementation remains exact while the real hero header, text, logos, and video stay unchanged and visually foregrounded.
- Evidence: `HeroWebsitePreviewFrame` renders base, `HeroCanvas`, and iframe in that order; `HeroCanvas` binds the transferred `HeroRenderer` to the Toolcraft runtime and timeline.

### Timeline

- Decision: Use the standard Toolcraft playback timeline for forward Flow, with a 12-second default.
- Reason: The user requested the Flow mechanic while retaining the authored scene. Duration changes speed; scene settings stay fixed.
- Evidence: `domain/flow.ts`, `panels.timeline`, and `hero-canvas.tsx`; the main browser workspace was explicitly reset and left playing at 12 seconds.

### Layers

- Decision: Keep Layers panel disabled while composing three fixed product layers and one editing-handle layer.
- Reason: Base, wave, and foreground have fixed semantic order and are not user-reorderable entities; only circle-mask handles are interactive.
- Evidence: The renderer technique inventory names `hero-base`, `wave`, `hero-foreground`, and `mask-handles`, and `panels.layers` remains omitted.

### Controls

- Decision: Preserve the three `fontPicker` and five hero layout sliders, then append the source wave controls, presets, and masks plus Width, Height, and built-in Position vector controls.
- Reason: This keeps the current editor intact and transfers the source control model without reinterpretation; the vector pad is the standard Toolcraft model for a stable two-axis offset.
- Evidence: `app-schema.ts` registers the existing sections first and the transferred sections second; `appControlSectionInventory` maps all eighteen semantic sections, including Flow in place of the two oscillator sections.

### View Interaction

- Decision: Declare the inspected reference's `fixed-camera` interaction mode.
- Reason: The wave is a three-dimensional scene with authored panel camera values, while direct orbit would diverge from the reference and compete with mask handles.
- Evidence: Product readiness records inspected-reference evidence and no orientation gizmo target is registered.

### Interaction Ownership

- Decision: Keep exact typography, spacing, wave frame, and wave parameter edits in the panel; keep only transferred mask manipulation on canvas.
- Reason: Numeric and compound values remain accessible and persistent while masks preserve the source's immediate direct-manipulation behavior without gesture duplication.
- Evidence: Product readiness combines existing hero ownership, wave frame ownership, and the transferred mask ownership entries.

### Export

- Decision: Do not expose image, SVG, video, Apply, or source-writing actions.
- Reason: The user explicitly removed Apply and chose manual transfer when needed.
- Evidence: Product readiness marks image export user-removed with request evidence; SVG/video remain not requested and no sticky action is declared.

### Performance

- Decision: Declare the exact retained WebGL pipeline and derive functional paths from wave width, wave height, and rib-count workload dimensions.
- Reason: Geometry rebuilds and full-resolution shading are the meaningful workload boundaries; hero CSS/postMessage edits and wave translation remain bounded responsiveness work.
- Evidence: `app-performance.ts` declares a mixed DOM/WebGL representation, preview-only Three.js GPU ownership, four fixed composition layers, and derived product scenarios. No measured performance audit is authorized.

## Evidence

- Source reviewed: Percents `Header`, `HeroSection`, `HeroVideoReveal`, `PauseableVideo`, the full Percent Hero reference app, the supplied JSON defaults, generated Toolcraft standard controls, and local contract docs.
- Contract applied: The origin-checked iframe bridge continues to map current hero state, while the transferred renderer maps canonical wave state and timeline time into one retained WebGL canvas with explicit frame placement.

## Verification

Focused serializer, schema, domain, renderer, placement, route, and browser tests cover the existing
hero controls, exact imported defaults, three-layer order, wave frame, retained renderer, masks,
presets, playback, persistence, and preview-only video freeze. Iteration 2 requires the first complete
bare delivery verification for the merged product.

## Native hero migration — 2026-09-09

### Decision Trail

- Request: «найди проект recraft ... убираем привязку от айфрейма, переносим сайт полностью в проект ... нам нужен только хиро экран, его контент и его ассеты».
- Task type: Later focused app assembly/reference port in the existing `percent-hero-iframe-generator` preview. The original `percent-hero` project has no iframe and is not the edit target.
- User-visible result: Local Header and HeroSection render in the Toolcraft product scene; the editor no longer embeds or messages the website on port 3000. Existing controls, wave, masks, presets and timeline remain available.
- Source/reference checked: `recraft-apps/README.md`, its HeroNativePreview and ReferenceSurface, and the Percents `/toolcraft/hero` route opened in the embedded browser. Source dependencies and SHA-256 asset identity are recorded in `docs/reference/native-hero-manifest.json`.
- Reference inputs: Existing website source and its exact shipping assets; no new motion-reference reconstruction or compressed-video replacement in this batch. Original video bytes are copied as media, not used to infer animation behavior.
- Docs/contracts read: Active AGENTS, workflow, runtime-boundary, reference-study, assembly-workflow, schema-reference, decision-contract, acceptance-testing; renderer-technique and component-rules for CSS integration diagnosis. Project brainstorming, writing-plans, browser and systematic-debugging skills applied.
- Contract rules applied: runtime-shell-required, canvas-surface-preserved, infinity-canvas-scene-bounds, reference-clone-source-of-truth, controls-product-coverage, persistence-policy-explicit, workflow-required. No signed host/runtime/configuration edits.
- View interaction intent: Existing wave camera interaction unchanged. The native website section is ordinary DOM output; its viewport is the canonical product frame, not the browser window.
- Interaction ownership: Typography/layout controls remain in the runtime panel; mask handles remain canvas-owned. Site links remain original hero content, not new editor controls.
- Decision: Import only the header/hero dependency closure. Replace Next Image/Link locally. Namespace source utility classes and keep source CSS in its own cascade layer after the host's standard Tailwind layers, while authored module overrides remain unlayered. This preserves both the mobile 40px heading/white CTA text and the desktop 102px override regardless of import order. Local container queries and scroll refs replace the iframe viewport. Defer the reveal scroll hook until the parent scroll ref is mounted.
- Alternatives rejected: iframe/postMessage/proxy, source-server imports, copying the whole website, rebuilding the 3D renderer, and importing unrelated blog/footer/diagram assets.
- State/output mapping: Canonical runtime values → createHeroPreviewSettings → getHeroPreviewStyle → native hero CSS variables. Product frame → local viewport/container queries. The existing wave pipeline/time/placement is unchanged. Only logo rotation coalesces during editor pan/zoom; frozen preview media remains at time zero.
- Asset scope: `public` contains exactly 28 source-verified files: all 24 reachable rotating logo candidates, 2 codec fallbacks for the foreground video, and 2 Latin fonts. Total 13,401,078 bytes. No unused section/experimental assets were copied. The original website and other projects remain untouched; no source asset was irreversibly deleted. Dead message-transport code and unused imported blog utilities were removed from the preview app.
- Verification tier: Tier 3, later focused migration. Run native/settings/control unit tests, explicit hero browser acceptance, independent local-asset/responsive proof, and one production build to establish shipping dependency closure. Skip aggregate delivery, unrelated wave/export tests and all measured performance.
- Performance intent: No performance complaint or measurement authority. Default live rendering quality is unchanged. Headless foreground acceptance seeds a paused, reachable 320×180 wave with 40 ribs at render scale 2; it tests the full 2400×1200 foreground and actual native font/layout values, not the heavy GPU workload. The full-default wave remains visible in the manual embedded browser.
- Verification: Production build, TypeScript check and 19 focused unit tests passed. Final command `TOOLCRAFT_BROWSER_SERVER_MODE=preview pnpm test:feature -- hero.native-section hero.heading.typography hero.layout.top-inset hero.layout.copy-to-logos hero.layout.logos-to-media hero.right.lead-typography hero.right.body-typography hero.right.offset-y hero.right.paragraph-gap persistence.reload` exited 0: all 10 browser cases passed with protected evidence. This covers the eight hero controls, persistence after reload, no iframe/source-server requests, desktop/mobile sizes, local images/fonts/video, readable CTA, four mobile logo slots and retained wave canvas.
- Verification iteration: Initial runs exposed the fixed CSS-layer issue and development-page navigation instability. Final checks use the supported production-preview server mode, with a freshly rebuilt bundle, not a modified harness. Typography tests retain every compound-part outcome and repeated stability assertions, sample synchronous CSS without idle intervals, and use target-scoped real UI actions with exact control locators instead of repeatedly enumerating unrelated controls. Pixel checks for typography isolate the actual changed text. No budget increase, protected-helper edit, synthetic output, performance gate or aggregate delivery run was used.
- Handoff: Embedded preview at `http://127.0.0.1:3005/` visually inspected with the full-default wave. Canvas left at a readable 40% zoom and playback restored. The original projects remain unchanged.
- Risks: Optional catalog fonts still require Google Fonts, as before; default Inter/Figtree and every hero asset are local. The historic folder name is retained for workspace continuity. No full framework or performance certification is claimed.

## Hero content refresh — 2026-09-09

### Decision Trail

- Request: «замени весь контент на похожий по количеству слов, замени видео часть на какое-то видео с похожей тематикой».
- Task type: Later focused content/default-media edit in the native hero preview on port 3005, not a new product delivery.
- User-visible result: Fictional Looplane identity, “Get Noticed. Keep Growing.” heading, rewritten payment-marketing paragraphs and caption, three-word “See the story” CTA, 24 original concept-brand logos, and an online-shopping/card-payment video. Heading, lead, body and caption keep exactly 4, 11, 19 and 10 words respectively.
- Assumption: The non-blocking question about branding received no answer during implementation. “All content” was interpreted to include name and logos; this assumption was communicated before editing. Fictional demo marks avoid inventing partnerships or endorsements by real companies.
- Sources checked: Existing local hero content/markup; Pexels “A Woman Happily Shopping Online” by Kindel Media, https://www.pexels.com/video/a-woman-happily-shopping-online-6994923/ ; official license https://www.pexels.com/license/ . Downloaded media was visually inspected before encoding. Full provenance and encoding parameters are in `docs/reference/hero-content-media.md`.
- Reference inputs: This is replacement shipping media, not a supplied motion reference to reconstruct. Existing reference animation/reveal behavior is retained; no new motion-reference preprocessing or renderer reconstruction was introduced.
- Docs/contracts applied: Project brainstorming and writing-plans skills, media route Plan/Implementation preflight (workflow, setup-export, media-upload, schema-reference, component-rules), then browser skill and acceptance/performance verification guidance. Runtime shell, native scene boundary, canonical control state and signed files remain unchanged.
- State/output mapping: Read-only heroContent constants feed the heading, paragraphs, caption and video source. Concept-brand records feed the existing rotating logo grid. The local asset manifest records exact sizes and SHA-256 values. Existing typography/layout runtime values still map through the same native CSS variables. Video classes now pass through the existing utility namespace so width follows the local product viewport, not the editor window.
- Interaction and view decisions: Existing camera, panel ownership and mask handles are unchanged. The CTA now targets the local video instead of the former external booking page; keyboard activation reaches that anchor in the embedded editor. Pointer navigation remains subject to the existing canvas gesture handling, which this content edit does not change.
- Renderer/timeline/layers/export/performance: The wave renderer, animation loop, playback settings, masks, logo rotation, preview-only video freeze, layers policy, persistence and no-export policy are unchanged. The replacement video remains paused at its first frame in Toolcraft preview. No performance complaint or measurement authority was given, so no performance audit was run.
- Asset scope: Current `public` has exactly 27 files: 24 new concept-logo SVGs, one local 1920×1080 / 30 fps / 10-second silent MP4 (about 2.7 MB), and two retained Latin fonts. The 24 old logos, two old videos and previous manifest were moved to `/Users/kusnizza/.Trash/percent-hero-content.2fOJAz`; recovery is possible until that backup is removed. Original source projects and user-supplied media were untouched.
- Alternatives rejected: Real-company partnership claims, remote video streaming dependency, image-generation for vector wordmarks, new playback controls, unrelated editor restyling and broad regression/performance suites.
- Verification tier: Tier 3, later focused media/content edit. Six tests passed using `pnpm exec vitest run src/app/hero-content.test.ts src/app/hero-website-preview.test.tsx src/app/hero-native-assets.test.ts`. `pnpm build` passed. `TOOLCRAFT_BROWSER_SERVER_MODE=preview pnpm test:feature -- hero.native-section` passed its one browser case with protected evidence, checking new text/brand, local video decoding, 2400px/390px viewport widths, local images/fonts and no iframe/source-server requests. Embedded visual inspection covered the first screen and new video; keyboard anchor activation was checked and the page returned to the first screen.
- Skipped: Aggregate delivery, measured performance, unrelated control suites, reload matrix and wave/export tests; none are authorized or needed for this content-only iteration. Existing build chunk-size warnings were not treated as authority for an unrelated optimization.
- Risks: All new branding is demonstrative, not a statement of real customer relationships. The stock subject is illustrative and not an endorser. Optional catalog fonts still require Google Fonts as before; default fonts and shipping media remain local. The new video replaces foreground media only, not the generated wave background.

## Real brand logos — 2026-09-09

### Decision Trail

- Request: «логотипы сделай реальных брендов и цветные как были примерно».
- Task type: Later focused default-media replacement in the existing native hero.
- User-visible result: The 24 real reference brands return with their original SVG geometry/colors and previous ordering. Looplane, all rewritten copy, the replacement video, grid dimensions and rotation remain unchanged.
- Source/reference checked: Previous hero-section source in `/Users/kusnizza/Projects/percents-next`; all 24 original SVGs and their SHA-256 records in `/Users/kusnizza/.Trash/percent-hero-content.2fOJAz`. No new external source or motion reference.
- Docs/contracts read: Local brainstorming, writing-plans and browser skills; workflow; media route Plan (setup-export, media-upload), Implementation (schema-reference, component-rules), Verification (acceptance-testing, performance).
- Contract rules applied: Existing native product scene and immutable host/runtime boundaries preserved; later-edit focused verification only.
- View interaction intent and interaction ownership: Unchanged camera, mask manipulation and panel ownership; logos remain ordinary native hero content, not new editor controls.
- Decision: Restore the exact local brand assets rather than redraw or recolor logos. Real-brand names map to original local paths and the existing 245×80 cell model; retained logo-grid code owns responsive slots and rotation.
- Alternatives rejected: More fictional logos, approximations of trademarks, grayscale conversion, remote asset/CDN dependencies, changes to the header identity or other content.
- Renderer/timeline/layers/controls/export/persistence: No changes. No new state targets, schema sections, media upload controls, export actions or renderer paths.
- Asset scope: Exactly 27 shipped files remain: 24 reference logos, one shopping MP4 and two fonts. The unused concept-logo directory and prior manifest were moved recoverably to `/Users/kusnizza/.Trash/percent-hero-concept-logos.QxjsHz`. Original source projects and original backup remain untouched.
- Performance intent: No measured performance authority; preserve the existing rendering quality and animation lifecycle.
- Verification tier: Tier 3, later focused media replacement. Three content/asset unit tests and the build passed. Embedded visual inspection confirms the colored real brands in the retained grid. `TOOLCRAFT_BROWSER_SERVER_MODE=preview pnpm test:feature -- hero.native-section` passed its one case with protected evidence, restored logo paths, no image color filter and local image loading. No control, reload, export, full-suite or performance checks.
- Risks: Marks are demo/reference content and do not establish a real partnership or endorsement. No claim of full framework or performance certification.

## Wave composition during canvas zoom — 2026-09-09

### Decision Trail

- Request: «почини проблему что при зуме  канваса у меня зумится видео. сайт просто должен приближаться и отдаляться а масштаб не должен меняться». Clarification: «Фон с волной».
- Task type: Later focused functional renderer/viewport correction in the native hero app on port 3005, not a performance complaint or new delivery.
- User-visible result: Canvas zoom scales the website and wave together without changing the wave camera projection. The paused wave refreshes its pixel backing immediately instead of waiting for a timeline/control change.
- Source/reference checked: Local HeroCanvas binding, camera, renderer/postprocessing, wave placement and retained pipeline; current embedded preview at a fixed timeline phase. No new external media or motion reference inputs.
- Reference inputs: None added. Existing wave design and source media are unchanged.
- Docs/contracts read: Local systematic-debugging, writing-plans and browser skills; workflow, decision-contract, runtime-boundary, core/performance, component-rules, renderer-technique, acceptance-testing and performance. Plan is `docs/plans/2026-09-09-wave-zoom-composition.md`.
- Contract rules applied: canvas-surface-preserved, infinity-canvas-scene-bounds, renderer-view-interaction, renderer-technique-inventory, performance-coverage-levels, workflow-required. Signed runtime/host/configuration files remain untouched.
- Diagnosis: The preview used the transformed DOM rectangle both to size GPU backing and derive camera aspect, and omitted zoom from rendering subscriptions. At a paused phase of 0.7076, changing 30% to 40% left the backing at 3391×1296 until a same-phase redraw updated it to 4522×1728. The frozen composition was visually stable in that diagnostic; the directly reproduced failure was stale zoom backing, not a measured large camera jump.
- Decision: Separate logical wave aspect from physical backing pixels. Canonical wave width/height own projection; canonical zoom × DPR × selected render scale owns backing. Subscribe to zoom while retaining the canvas/renderer. Pure viewport updates only rerasterize the GPU shade pass and refresh resolution-dependent uniforms; scene preparation stays unchanged when parameters are identical.
- View interaction intent: Existing authored camera values and fixed-camera authority remain unchanged. Toolcraft alone owns viewport zoom; no camera movement is introduced by zoom.
- Interaction ownership: Existing panel controls and canvas mask handles retain their ownership. No new controls or duplicate gestures.
- State/output mapping: `wave.frame.width/height` → logical projection and frame; runtime canvas zoom plus DPR/render scale → backing pixels; existing timeline progress → unchanged wave phase. Foreground layout, lower video, assets, controls, layers, timeline transport, export policy and persistence schema are unchanged.
- Alternatives rejected: Inverse-scaling the wave, changing camera FOV with editor zoom, freezing a low-resolution backing, recreating the renderer, modifying the signed viewport implementation, or altering the lower video.
- Performance intent: No measured performance authority. Existing animation coalescing and full selected pixel density are preserved. Pipeline assessment accepts the narrow GPU retina-rasterize zoom path; no benchmark or broader optimization was introduced.
- Verification tier: Tier 3, later focused edit. Four preview-frame/camera/pipeline unit tests and the production build passed. `TOOLCRAFT_BROWSER_SERVER_MODE=preview pnpm test:feature -- hero.native-section` passed its one extended case, covering paused toolbar and modifier-wheel zoom, unchanged relative placement/layout and phase, exact backing, and retained canvas identity. Existing native hero responsiveness remains covered by that same case.
- Verification: Embedded full-default wave checked at 40→30→40% with phase 0.7076, backing changing immediately between 4522×1728 and 3391×1296 and composition visually retained. Preview left at 40% with playback resumed. Unit camera matrices remain identical across six zoom levels, both DPR values and both render scales; existing tiled/full-frame projection fallback is covered without running exports.
- Skipped: Aggregate delivery, unrelated control/reload/export suites and all measured performance checks. Build was required for the supported production-preview browser mode only.
- Risks: No full framework or maximum-GPU-workload certification is claimed. Existing hardware limits for exceptionally large backing surfaces are unchanged; no silent quality cap was added.

## Continued zoom diagnosis — 2026-09-09

### Decision Trail

- Request: «ври здесь при зуме все также тормозит и волна уезжает» at `http://127.0.0.1:3005/`.
- Task type: Localized zoom performance and visual-correctness complaint following an insufficient previous fix. No production edits in this diagnostic step.
- Source/reference checked: The live embedded app, HeroCanvas/HeroRenderer, Three postprocessing allocation, runtime wheel/pinch subscriptions, and a separate headless diagnostic using the real default 2826×1080 wave with 310 ribs and DPR 2. Diagnostic source is `.toolcraft/browser-artifacts/diagnose-wave-zoom.mjs`.
- Reference inputs: None added.
- Docs/contracts read: Active local AGENTS, systematic-debugging and writing-plans skills, workflow, decision-contract, runtime-boundary, core/performance. No implementation-phase edits or broad verification were started.
- Diagnosis: At zoom 40/50/60/70%, requested and actual drawing buffers agree: 4522×1728, 5652×2160, 6782×2592, 7913×3024. At 80%, canvas attributes request 9043×3456 but the actual WebGL buffer is 8192×3456; at 90%, 10174×3888 is requested but the actual buffer is 8192×3888. This browser reports an 8192 texture/viewport limit and emits 42 GPU allocation/framebuffer errors in the bounded zoom sequence. The previous test checked canvas attributes only, used a 320×180 paused fixture, and therefore did not catch actual GPU-buffer truncation. These diagnostic numbers describe headless Chromium, not a claimed device-limit measurement of the embedded browser.
- Decision pending: The user was asked whether the preview must retain editable live 3D or may use a prerecorded video loop. The former needs a bounded rendering architecture retaining visible pixel density; the latter removes live 3D recalculation but changes control semantics and therefore requires a user choice. No silent quality cap, asset substitution or control removal was applied.
- View interaction intent / interaction ownership: Existing camera, viewport and panel ownership remain unchanged pending that choice.
- State/output mapping: Current zoom multiplies the entire offscreen wave frame by DPR and render scale, reallocating all full-size postprocessing targets. CSS still scales the scene as a unit, while actual GPU truncation can crop/distort its content.
- Alternatives rejected: Claiming the previous small fixture established large-wave correctness; treating canvas.width as actual WebGL buffer evidence; silently reducing selected quality; replacing editable 3D with video without confirmation.
- Performance intent: The complaint is localized to zoom. No measured iteration or canonical path authority has been executed while the implementation choice is pending; no full audit is authorized.
- Verification: Diagnosis only, no new product-success claim. The separate diagnostic browser was closed; the embedded preview remains available at port 3005. No full test/build/performance suite was run.
- Risks: The reported behavior remains unresolved. Exact embedded-device limits may differ from the reproduced headless failure. A fixed-resolution video cannot retain the wave's live 3D editing behavior.

## Fold Studio header logo — 2026-09-09

### Decision Trail

- Request: «я имел ввиду в тулкрафт проекте замени», correcting the target of the supplied `/Users/kusnizza/Desktop/covers/logo.svg` replacement.
- Task type: Later focused header asset/presentation edit in the native Toolcraft hero at `http://127.0.0.1:3005/`. The accidental logo changes in `percents-next` were reverted without touching its other files.
- User-visible result: The header displays the exact supplied Fold Studio icon and wordmark at 32px scene height with its original 337:68 aspect ratio. The home link has the accessible name Fold Studio. The former Looplane-specific scroll morph is no longer rendered; the supplied complete logo stays visible.
- Source/reference checked: Supplied SVG geometry, existing native header component, website configuration and preview tests. The SVG is copied unchanged to `src/section/assets/fold-studio-logo.svg`; the replaced component is backed up under `.toolcraft/browser-artifacts/fold-studio-logo-before-2026-09-09/`.
- Docs/contracts applied: Local workflow, runtime boundary, renderer technique, core performance, acceptance and performance guidance; writing-plans skill. Plan: `docs/plans/2026-09-09-fold-studio-logo.md`. Product styles use a local CSS module; signed runtime and host files are untouched.
- State/output mapping: Static local SVG feeds HeaderLogo; website projectName supplies the existing header link accessible name. No new runtime state or controls.
- Renderer/timeline/layers/controls/export/persistence: Wave renderer, scene composition, current settings, camera, mask interactions, timeline playback, layers and export policy are unchanged.
- Alternatives rejected: Editing the Percents website again, redrawing the supplied vector, keeping old-brand lettering in the scroll animation, unrelated refactoring and broad verification.
- Verification: Later focused checks only. `pnpm exec vitest run src/app/hero-content.test.ts src/app/hero-website-preview.test.tsx` passed both files and all five tests. Embedded browser inspection confirms the Fold Studio logo renders in the native Toolcraft header with its aspect ratio intact; the existing scene remains at 40% zoom with playback running.
- Skipped: Build, aggregate delivery, broad browser/control suites and measured performance checks; the user requested no unnecessary checks and this change is confined to the header asset and accessible label.
- Risks: No full framework or performance certification is claimed. Existing wave zoom diagnosis is outside this logo replacement.

## Persistent header divider — 2026-09-09

### Decision Trail

- Request: «сделай под шапкой полосу тонкую как при скролле появляется».
- Task type/result: Later focused CSS presentation change in the native Toolcraft hero. The existing thin lower shadow is visible immediately, using the same 1px offset, 2px blur and 8% black as the former scroll-only treatment.
- Source/contracts: Existing sticky-header component and its CSS module; local workflow and unchanged visual-technique route documents already read in this conversation. Toolcraft brainstorming and writing-plans skills; plan `docs/plans/2026-09-09-header-divider.md`.
- Decision/state mapping: Move the outer shadow to the local header class; keep the scroll state responsible for the existing translucent backdrop and inset highlight. Remove the old outer shadow from the pseudo-element so scrolling does not double the line. No border-induced height change.
- Preserved: Current scene settings, wave renderer, camera/view interaction, canvas/panel interaction ownership, controls, timeline, layers, export and persistence. No new control or renderer workload.
- Alternatives rejected: Making the whole scrolled backdrop permanent, inventing a heavier border, changing header height or editing the Percents website.
- Focused verification: Existing native-preview tests passed (three tests); embedded browser visual inspection confirms the line appears beneath the header before scrolling. CSS review confirms a single outer shadow independent of scroll state. No new UI state or scene settings were applied during verification.
- Skipped: Build, aggregate functional checks and performance measurement, per the narrow change and the user's preference for minimal checks. No new tests mirroring CSS declarations.
- Risks: No new known issue for this divider; existing renderer zoom diagnosis remains outside scope.

## Video top-edge stripe diagnosis — 2026-09-09

### Decision Trail

- Request: «разберись что тут за полоска», with the supplied crop pointing to the horizontal line beside the video's top edge.
- Task type: Focused read-only visual diagnosis, using the Toolcraft systematic-debugging skill. No product edit or scene/settings change.
- Sources/evidence: Supplied original 3196×386 PNG, live embedded browser DOM/computed styles and a focused screenshot, HeroVideoReveal source and CSS. The PNG has one darker row at y=249 on both sides of the visible video; adjacent rows are white or nearly white. For example x=200 is (242,240,240) on that row and (255,255,255) above/below; x=3100 is (234,232,233) on the row and white above/below. The varying line colors match a media seam rather than a uniform styled divider.
- Diagnosis: The actual video spans the full 2400px product width. Opaque white side masks conceal its outer portions and create rounded corners. Their vertical extent begins exactly at the video edge (`inset-block: 0`), so independently composited/antialiased edges can leak a one-device-pixel row of the underlying video at fractional scene scaling/placement. This is consistent with the observed one-row seam and live source geometry.
- Exclusions: Media container, video and masks have zero border and no box shadow. The wave canvas continues below this y-coordinate. The header's separate shadow is at the top of the page, not at the video's top.
- Follow-up: A minimal correction would overlap the opaque video masks slightly beyond the top/bottom edges so compositing cannot expose the media row; retain their horizontal reveal and corner geometry. No implementation was requested or applied in this diagnostic turn.
- Verification scope: Read-only browser inspection and original PNG pixel analysis; no tests, build, performance measurements or renderer/settings changes. Existing camera, interaction ownership, timeline, layers and export policy are unchanged.

## Editable wave: bounded viewport rendering — 2026-09-09

### Decision Trail

- Request: «ври здесь при зуме все также тормозит и волна уезжает»; explicit clarification «сохраняем редатируемую волну в этом и смысл». This resolves the earlier pending choice in favor of the live editable wave. Target is the native Toolcraft app in `percent-hero-iframe-generator` on port 3005, not the original generator folder.
- Task type: Later focused renderer/viewport correction. Preserve the complete editable 3D scene, masks, camera/light controls and playback; no prerecorded video replacement, asset removal, foreground edits or selected-quality cap.
- Source/reference checked: Existing canonical wave frame, Three camera and tiled postprocessing, actual GPU-buffer overflow diagnosis above, signed viewport transient-state hook, and the embedded app. No new reference inputs or motion reconstruction.
- Preflight: Project systematic-debugging, writing-plans and browser skills; workflow; matching Plan/Implementation/Verification documents: decision-contract, runtime-boundary, core/performance, renderer-technique, component-rules, performance and acceptance-testing. Plan: `docs/plans/2026-09-09-editable-wave-viewport.md`.
- Contracts applied: runtime-shell-required, canvas-surface-preserved, infinity-canvas-scene-bounds, interaction-surface-ownership, renderer-view-interaction, renderer-technique-inventory, acceptance-product-observable, performance-coverage-levels, workflow-required. No signed runtime, host, global style, configuration or generated-document changes.
- Decision: Keep the complete authored world frame but shade its intersection with the browser viewing area plus a 96 CSS-pixel filter guard. Preserve full-frame coordinates in the camera view offset, haze and mask uniforms. Restore the logical camera aspect after Three's setViewOffset; scale depth-of-field sampling for the crop. Mask handles use the full stage, never the cropped raster rectangle.
- Presentation/lifecycle: A retained hidden WebGL surface performs the existing Three/postprocessing work. The visible Canvas 2D surface receives a completed GPU frame and its matching crop placement together. A non-blocking GPU fence allows only one render submission in flight. During transient pan/pinch/wheel gestures, the host transforms the completed image with the website; selected-density backing is refreshed after the gesture settles. Playback state is not changed by gestures, and animation resumes automatically. Offscreen waves do no shading work.
- State/output mapping: Canonical wave dimensions and placement still own logical geometry; viewport zoom, offset, DPR and selected render scale determine only the visible pixel window. Existing camera/light/mask/timeline values continue to drive the same renderer. Actual WebGL drawing-buffer dimensions are checked, rather than trusting canvas width/height attributes.
- Pipeline: The existing multipass GPU compositor remains `shade`; its completed result is presented with Canvas 2D. Viewport offset/zoom invalidates the visible shade window while retaining geometry, environment, shadows and renderer resources. No backend/provider migration, export behavior, schema control, timeline mode, layer policy or persistence change.
- Alternatives rejected: A fixed video losing live editing; inverse-scaling the wave; changing camera FOV during editor zoom; reducing selected density; reallocating a whole zoom-sized scene; queuing every wheel event; modifying signed viewport code.
- Verification tier: Tier 3, later focused. Eight crop/camera/pipeline/postprocessing unit tests passed in two files. Typechecked production build passed; existing chunk-size warning remains. The signed feature runner always uses its development server (it overrides the preview environment variable), so the browser check must not be described as production-preview evidence. Full-size `wave.viewport` browser verification is recorded below when complete.
- Embedded checks: Full default 2826×1080 / 310-rib wave inspected at 40→80→40%; camera Yaw changed -62→-61 and restored, producing a new paused frame. All 12 mask handles remain present; the first mask's normalized center stayed approximately (1.6092447, 0.3399957) at both 40% and 80%. Show mode was restored off, zoom restored to 40%, and playback resumed. Existing Fold Studio header edits were preserved.
- Performance authority/limit: The exact complaint authorizes only the localized viewport-zoom path. The current project has no initial protected delivery anchor, its performance browser adapter registry is empty, and its existing shade kernel comparison is pending. The signed delivery planner rejects a performance authority without initial functional proof (`Toolcraft first delivery must be functional`). No aggregate delivery or kernel/backend audit was started to manufacture those prerequisites. No protected performance receipt, frame-rate claim or full-device certification is claimed.
- Browser fixture decision: The Retina software-GPU check could allocate the correct 5888×4320 visible drawing buffer at 100% zoom (viewport 1280×900, DPR 2, selected scale 2), but did not finish the GPU frame within the diagnostic 30-second wait. The gesture correctly ended (`active=false`) and the last completed image remained displayed; this is not a passing performance result. Protected functional regression uses the standard browser's DPR 1 at 40→200%: the same 11304-pixel full-frame width that previously overflowed, with unchanged real wave dimensions, 310 ribs, all default effects, and selected render scale 2. No timeout budget, production quality, scene complexity or renderer boundary was weakened. The original Retina case remains an explicit unpassed software-GPU limitation, not hidden certification.
- Final automated browser status: NOT PASSED. `pnpm test:feature -- wave.viewport` also exceeded the protected 30-second budget in the standard software-GPU profile; the last attempt timed out waiting for its initial completed wave frame. Earlier attempts reached the zoom transition but did not finish the newly shaded output within that budget. Harness corrections moved the mandatory proof-session reload before capturing nodes/pixels and accounted for Retina wheel-delta emulation; neither is product success evidence. The final regression remains enabled, with no timeout extension, synthetic pixels, reduced wave complexity or fabricated receipt. Its trace is under `test-results/product-wave-viewport-brow-79703-full-size-wave-through-zoom/trace.zip`. Automated full-size pixel parity and performance therefore remain unconfirmed despite passing unit/build checks and embedded visual/control checks. No further broad checks or signed browser/runtime changes were made.
- Handoff: Editable-wave implementation is present in the live preview; this is a limited-verification handoff, not a fully certified zoom-performance completion. The user's subsequently observed 25% viewport setting was left untouched; live frame progress continued to update. Existing settings, assets and unrelated edits are preserved.
- Known risks: Software-rendered Chromium is substantially slower than the embedded hardware path. During a large gesture, newly exposed pixels beyond the retained crop/guard appear when the gesture finishes. Exceptionally large CSS viewports at high DPR can themselves exceed GPU surface limits; this is reported as an allocation error rather than silently truncating or lowering selected quality. The prior whole-scene overflow caused by zoom is removed for the tested viewport range.

## Video mask seam fix — 2026-09-09

### Decision Trail

- Request: «чини», authorizing the preceding one-pixel video seam correction.
- Task type/result: Later focused CSS fix. Extend existing video side masks two scene pixels above and below the media to cover the antialiased edge.
- Source/contracts: Prior PNG diagnosis, live scene geometry and HeroVideoReveal CSS. Systematic-debugging and writing-plans skills; previously read local workflow and focused route documents; decision-contract reread. Plan: `docs/plans/2026-09-09-video-mask-seam.md`.
- Decision/state mapping: Only mask `inset-block` changes from zero to -2px. Existing horizontal reveal, widths and corner-radius values remain. Video dimensions, crop and position are retained; no scene values, controls, renderer, camera, interaction ownership, timeline, layers, export or persistence edits.
- Focused verification: `pnpm exec vitest run src/app/hero-website-preview.test.tsx` passed all three tests. At current 25% zoom/DPR 2, video geometry stays x=454.5, y=701.6875, width=600, height=335 CSS px; masks overlap by 0.5 CSS px (one device pixel) above/below. Full embedded screenshot confirms the decoded video with no horizontal leak beside its top edge.
- Browser iteration: HMR temporarily left the paused video at readyState 0; no success was inferred from that empty state. Source HTTP 200 and one reload restored readyState 4 / 1920px decoded video while preserving current viewport/settings. Cropped browser captures returned black and were excluded from evidence; the full screenshot was used.
- Alternatives/skipped: No video resizing, replacement reveal, unrelated renderer changes, new CSS-mirroring tests, build, aggregate delivery or measured performance checks. Scope follows the user's minimal-check preference. No new known issue at the inspected seam.

## Remaining project risks

- Resolved: The preview no longer requires the Percents Next.js server; all shipping hero dependencies are local.
- Risk: CSS overrides intentionally apply at the existing `xl` desktop breakpoint only; smaller breakpoints preserve production responsive behavior.
- Risk: An exceptionally large browser viewport at high DPR/render scale may still exceed the GPU surface limit; the preview now bounds work to the visible window instead of the entire zoomed wave.
- Risk: The transferred mask handles deliberately sit above the native foreground so they remain editable in Toolcraft.

## Work with Masks standalone production import — 2026-09-09

### Decision Trail

- Request: Import the existing hero-in-Toolcraft project as Work with Masks, replace 3D Point Fracture in the docs-new gallery, optimize assets and publish only the standalone application. User corrected the initial background-only source with a Fold Studio screenshot.
- Task type: Existing-product port and deployment, not a new renderer or interaction design.
- User-visible result: Full Fold Studio header and hero, live wave, editable typography/spacing, masks, presets, history, timeline and settings transfer. No artifact export was added.
- Source/reference checked: `/Users/kusnizza/Projects/percent-hero-iframe-generator`, its running port 3005 and the supplied Fold Studio screenshot. The background-only `percent-hero` import was superseded, backed up outside this repository and replaced in the same Work with Masks Vercel project. Original source projects were not edited.
- Reference inputs: User-supplied Fold Studio screenshot for the gallery cover; the original licensed shopping footage's first frame for the native hero preview. No new motion design.
- Docs/contracts read: Root and source AGENTS, workflow, runtime-boundary, assembly-workflow, decision-contract, acceptance-testing; persistence schema/type implementation. Brainstorming, writing-plans, systematic-debugging and vercel-deploy skills.
- Contract rules applied: Preserve the copied runtime and all protected non-identity files; use the current upstream generated manifest writer for identity export. Comparison confirms all 685 runtime files are unchanged; protected changes are only index.html and app-identity.ts. No verification checks were weakened.
- View interaction intent: Preserve fixed-camera controls, existing mask handles, viewport zoom/pan and responsive canvas-sized foreground.
- Interaction ownership: Existing canvas masks and complementary panel settings remain unchanged. No duplicate controls, new layers or custom chrome.
- Decision: Keep the native React section and local public assets, prefix public paths with the Vite deployment base. Replace the already-frozen foreground video with its same opening frame, JPEG95 at 1920×1080. Keep all 24 rotating brand SVGs and two local fonts. Optimize Ford's embedded PNG to lossless WebP; all alpha and nontransparent RGB samples are identical, only invisible transparent RGB is discarded.
- Alternatives rejected: Background-only editor, iframe/source-server dependency, shipping the frozen 2.83 MB video, changing the shared renderer to reduce bundle size, or deploying the website.
- State/output mapping: Canonical hero defaults feed unchanged layout, wave and mask composition. A separate `toolcraft:work-with-masks-hero:state:v2` workspace key prevents the mistakenly published editor's saved scene from overriding this product; the prior workspace is not deleted. Product browser fixtures use the matching key.
- Performance intent: Asset-size audit only, no measured performance iteration. Deployment output is 6,188,561 bytes (43 files); all-file gzip estimate 2,254,978 bytes, not an initial-page transfer claim. Public assets total 891,810 bytes. The media preview is 410,099 bytes. Lazy framework model-import/codec chunks are retained, not patched out of the signed runtime. No videos, source maps, original references, environments, tests or dependency directories appear in dist.
- Verification: Production build passed. Eleven focused unit/component assertions passed; the native-section feature browser scenario passed in 11.9 seconds. Local production-base browser inspection confirms complete hero content, loaded local images, no video/iframe and no console errors. The initial feature run exposed the old fixture persistence key and was corrected; the first re-export used an older writer without domain metadata, then was regenerated using the matching current upstream writer. No aggregate delivery or performance suite ran.
- Risks: Additional user-selected catalog fonts may use Google Fonts, as in the source. Full deployment size includes lazy framework chunks and is not the first-load payload. Vercel publication is confirmed through deployment metadata, without fetching the deployed page, per the deployment skill.

### Release evidence

- Production deployment: `dpl_HLrc5gNHd3V5xbdQS1fkE46wDAy4`, target production, READY.
- Stable app URL: `https://work-with-masks-pixelpoint.vercel.app/demos/work-with-masks/`.
- Immutable deployment: `https://work-with-masks-d18tvf7w0-pixelpoint.vercel.app`.
- Vercel configuration matches the repository policy: docs-new production branch, examples/work-with-masks root, Vite/Node24/dist, frozen isolated pnpm install, affected-project deployments and preview-only authentication. Project metadata audit reports no differences. No other Vercel project was changed.
- Website/gallery remains local on docs-new, with a JPEG95 Next Image cover. 3D Point Fracture source/content/media are retired outside the repository, recoverably; its remote project is unchanged pending explicit confirmation.

## One-off background video — 2026-09-08

- Request: Deliver only the animated background within the supplied red-frame proportions, one complete 8-second loop, 30 fps, 4K ProRes.
- Result: `/Users/kusnizza/Downloads/percents-background-flow-3840x1502-8s-30fps-prores-hq.mov`, ProRes 422 HQ, 3840×1502, 240 frames, 8 seconds.
- Source: Current app schema defaults, canonical HeroRenderer and Flow evaluator; original screenshot red-frame bounds 3575×1399. Rendered the existing background placement at 3840 px width and cropped the hero region without foreground content.
- Decision: Use an offline artifact driver under `.toolcraft/browser-artifacts/background-video-2026-09-08`; keep product code, scene defaults, live playback, controls and export UI unchanged. Sample progress as frame/240 so the faster loop contains no duplicated endpoint.
- Focused verification: Inspected the source frame and a decoded MOV frame; ffprobe confirms codec, dimensions, 30 fps, 240 frames and exact 8-second duration. Rendered phases zero and one match byte-for-byte; intermediate frames change; no renderer or encoder errors.
- Skipped: Build, aggregate browser tests, delivery and performance gates; this is a requested standalone artifact, with no app behavior change.

## Approved settings defaults — 2026-09-09

### Decision Trail

- Request: «сделай эти настрйоки дефолотными без лишних проверок», with `/Users/kusnizza/Downloads/hero-settings.json`.
- Task type: Later focused defaults update in the native hero project serving port 3005.
- User-visible result: The first mask defaults to 100% opacity and 1.8 stretch; new timelines default to 8 seconds. All other supplied control values and canvas dimensions already match. The live editable wave and existing foreground remain unchanged.
- Source/reference checked: Supplied settings retained as `reference/settings/hero-settings-2026-09-09.json`; earlier reference retained. No new motion reference inputs.
- Docs/contracts read: writing-plans skill; workflow; control-selection, layout, timeline-animation, core/performance, schema-reference, component-rules, decision-contract and acceptance-testing. Plan: `docs/plans/2026-09-09-settings-defaults.md`.
- Contract rules applied: runtime-shell-required, controls-product-coverage, timeline-mode-choice, timeline-enabled-behavior, persistence-policy-explicit, workflow-required.
- Decision: Change canonical product defaults only; preserve legacy motion fields absent from the supplied file and keep duration metadata aligned. Writing-plans confined this batch to the three differing defaults and directly related regression assertions.
- View interaction intent / interaction ownership: Existing editable wave, camera, mask and panel ownership remain unchanged. No renderer, viewport, schema target, control layout, layer policy or export behavior change.
- State/output mapping: Fresh control state and Controls Reset resolve all 76 supplied values through the existing runtime normalization. The first mask uses the new opacity/stretch; fresh playback maps the same forward Flow to an 8-second cycle. Existing workspace persistence still wins on restore.
- Alternatives rejected: Importing settings on mount, writing browser storage, resetting the user's current scene, replacing the live wave, or patching the signed runtime. Captured cursor time and play/pause status are session state; the timeline schema exposes only duration as an initial transport setting, so those captured session fields were not promoted to defaults.
- Performance intent: No new performance iteration or measurement; no renderer lifecycle or workload envelope changes.
- Verification tier: Tier 2, later focused. One filtered Vitest invocation passed four exact defaults/reset/timeline assertions. The defaults test covers all supplied values and the new duration. No full suite, build, browser/GPU, reload, aggregate delivery or performance checks, following the user's explicit minimal-check request. No browser certification claimed.
- Risks: Existing saved sessions keep their own settings; this edit intentionally does not overwrite them. Runtime-owned initial playback remains unchanged.

## Deployment isolation — 2026-09-17

- Removed `.git` from the app's `.vercelignore`. Vercel logs for `5058ab27` confirmed this override deleted Git metadata before the folder comparison and caused an unchanged app to rebuild.
- The repository deployment tests pass for app-only, website-only, shared-runtime, and multi-commit changes. This app-only correction will be checked against Vercel's native affected-project detection; product code and pinned dependencies are unchanged.
