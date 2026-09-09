# Implementation Worklog

Active change: template-release-2026-09-09

## Status

Mode: product

## Decision Trail

### First-load carousel drag survives renderer readiness

- Request: `проверь будто не всегда инициализируется драг карусели при первой загрузке`.
- Task type: Functional initialization race in renderer/navigation lifetime, Tier 3.
- User-visible result: A mouse gesture started on the visible carousel continues while its WebGL effects finish loading; the first drag no longer requires another press.
- Source/reference checked: Live Aura Carousel, the product navigation effect, texture/font loading, and the shared pipeline provider's stable client. A delayed-font browser reproduction lost `data-carousel-dragging` immediately after the renderer became ready.
- Reference inputs: None; an interaction bug report, with no new motion or visual reference.
- Docs/contracts read: Previously read broken-behavior and renderer routes in `workflow.md`, `decision-contract.md`, `core/runtime-boundary.md`, `component-rules.md`, `renderer-technique.md`, `acceptance-testing.md`, `performance.md`, plus `core/performance.md`.
- Contract rules applied: Existing canvas interaction ownership, retained resource lifetime, product-only editing, outcome-based browser verification, and ordinary functional delivery.
- View interaction intent: Unchanged non-spatial carousel browsing.
- Interaction ownership: The same rail binding retains mouse capture before, during, and after WebGL readiness; wheel, touch, keyboard arrows, and panel controls keep their existing owners.
- Decision: Keep the animation scheduler stable while a layout effect updates its renderer ref. Navigation no longer disposes and rebinds on asynchronous renderer creation. Existing renderer ownership already covers `carousel.scroll`; no new production module or pass is introduced.
- Alternatives rejected: Disabling drag until assets finish loading, forcing users to press again, or reacquiring a cancelled gesture would conceal the subscription-lifetime bug.
- State/output mapping: Pointer deltas update the same carousel position and DOM fallback; once ready, the existing GPU pass reads the latest position and renders the same ongoing gesture at the selected quality.
- Performance intent: ordinary-product-work; this request reports a missing first interaction rather than latency or a workload issue.
- Verification: One bare `npm run verify:delivery` derives the protected proof; a delayed-resource browser regression checks the actual first gesture across initialization.
- Risks: The inherited Figma reference metadata blocker may still prevent a complete protected delivery receipt; validators are unchanged.

### Carousel focus outline removal

- Request: `убери здесь возможность сделать выделение карусели` at the published Aura Carousel demo.
- Task type: Local focus presentation correction, Tier 1.
- User-visible result: Clicking or dragging the card rail does not draw a selection-like outline around the carousel.
- Source/reference checked: The supplied screenshot, the live demo, and the product rail CSS and mouse-drag binding. A real click gave the focused Customer stories region an automatic 1px outline; text selection was already disabled.
- Reference inputs: The supplied static screenshot; no motion reference.
- Docs/contracts read: `workflow.md`, `decision-contract.md`, `core/runtime-boundary.md`, `component-rules.md`, `renderer-technique.md`, `acceptance-testing.md`, and `performance.md`.
- Contract rules applied: Product-local CSS ownership, runtime surface preservation, existing interaction ownership, and focused browser verification.
- View interaction intent: Unchanged non-spatial carousel browsing.
- Interaction ownership: The card rail continues to own mouse drag, native scrolling, and keyboard arrows; navigation buttons retain their focus indicators.
- Decision: Set `outline: none` on the product-owned rail class, preserving its tab stop and mouse-focus behavior.
- Alternatives rejected: Removing keyboard focus would break arrow-key browsing. A global outline reset would affect unrelated controls. Additional text-selection rules would not address the observed cause.
- State/output mapping: Focus styling changes only; carousel position, card pixels, optical parameters, and export remain mapped to the same state.
- Performance intent: ordinary-product-work; no measured performance requested.
- Verification: One bare `npm run verify:delivery` derives the protected proof. Focused browser and navigation checks verify this presentation correction.
- Risks: The existing inherited reference metadata blocker may prevent a complete protected receipt; it is not altered by this correction.

### Gallery import — Aura Carousel

- Request: Find dispersion-carousel-v2, build it into the gallery using the existing example deployment pattern, choose an appropriate name, and write an app description after building.
- Task type: Generated-folder port and publication, Tier 4 because this is a new standalone example export.
- User-visible result: The existing carousel is published as Aura Carousel; its photographs, copy, defaults, edge effects and interactions remain unchanged.
- Source/reference checked: `/Users/kusnizza/Projects/toolcraft-apps/dispersion-carousel-v2`, its running product, and the Prism Flow Git-linked Vercel/gallery integration.
- Reference inputs: The existing local source folder only; no new visual reference or redesigned behavior.
- Docs/contracts read: `workflow.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `decision-contract.md`, `acceptance-testing.md`, repository deployment and gallery conventions.
- Contract rules applied: Preserve the runtime shell and controls, product renderer and output mapping, copied framework ownership, persistence behavior, and protected delivery lifecycle.
- View interaction intent: Unchanged `non-spatial` carousel browsing; no camera, orbit, timeline or autoplay added.
- Interaction ownership: The existing canvas owns card navigation; the existing controls panel owns optical parameters and export settings.
- Decision: Import the app into `examples/aura-carousel`; rename only public identity and exported filenames; scope card URLs to Vite's base for `/demos/aura-carousel/`. Re-export the generated HTML title with the upstream integrity writer, preserving every other protected file and copied runtime byte.
- Alternatives rejected: Rebuilding controls, replacing photographs or testimonials, changing defaults, renaming shader concepts, using a separate repository, or merging unrelated website work into main.
- State/output mapping: Existing state and shader/export mapping is retained; the new persistence namespace prevents collisions with the source app. Base-aware resource URLs resolve the same image bytes on standalone and proxied deployments.
- Performance intent: ordinary-product-work; no measured performance audit requested.
- Verification: One bare `npm run verify:delivery` derives the protected proof for this delivery. Targeted build, identity, assets, gallery and browser checks provide development feedback without replacing that receipt.
- Risks: Any inherited protected-delivery blocker is reported without modifying validation code. Website publication remains on `docs-new`, separate from the app's stable deployment URL.

### Iteration 1 — Figma carousel with flat Paper edge dispersion

- Request: Build a sandbox from the supplied Figma customer-story carousel and the complete carousel mechanics in `/Users/kusnizza/Desktop/Wireframes Aug 12 2026/`; apply adjustable Paper Lens Distortion only near both edges; do not bend the carousel; let the editable canvas crop it.
- Task type: Reference-runtime clone, Figma design implementation, custom WebGL renderer, controls, persistence, and still-image delivery.
- User-visible result: The editable 1472×714 output contains the inspected Figtree heading and five exact x2 Figma card PNGs. Native snap scrolling, arrows, keyboard navigation, and disabled-arrow state match the supplied implementation. A retained official Paper Lens Distortion layer is revealed only through adjustable symmetric edge masks, with no geometric curve. The current clipped state exports as PNG or JPG.
- Source/reference checked: Figma file `BZvXRLFX2bR57Gza4vhyxI`, node `6737:6662`; the two supplied dispersion PNG references; the running original app and its `features-cards--slider-column.tsx` and `snap-slider.tsx`; Paper Design `lens-distortion.tsx` and `lens-distortion.ts` at package version `0.0.80`.
- Reference inputs: `/Users/kusnizza/Desktop/Wireframes Aug 12 2026/`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-3d316c5f-4525-4657-ae5a-990ddaa08188.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-d91ef466-9672-456b-a3b3-df88db34a8ef.png`; Figma node `6737:6662`.
- Docs/contracts read: `workflow.md`; Plan and Implementation routes for reference study, runtime boundary, control selection, layout, performance, setup/export, media upload, assembly, decision contract, schema, component rules, and renderer technique; Verification routes in `acceptance-testing.md` and `performance.md`.
- Contract rules applied: `runtime-shell-required`, `canvas-no-app-ui`, `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-section-inventory-required`, `controls-product-coverage`, `renderer-technique-inventory`, `renderer-view-interaction`, `reference-clone-source-of-truth`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `output-export-required`.
- View interaction intent: `non-spatial`; the product is a flat DOM/WebGL carousel without a model, camera, or orbit pose.
- Interaction ownership: The canvas owns native carousel browsing through arrows, scrolling, and keyboard input. The panel owns exact edge width and official Paper property editing. No operation is duplicated across canvas and panel.
- Decision: Preserve the reference's native horizontal scroll, mandatory snap, 448px step, thresholds, passive listener, keyboard behavior, ResizeObserver, MutationObserver, and delayed refresh. Render the clean rail as DOM and overlay the same local Figma strip through `@paper-design/shaders-react@0.0.80`. Reveal it with one symmetric mask. Keep `lensBulge={0}` and `lensCircle={0}`. Force a deterministic Paper frame immediately before WebGL capture because Paper intentionally does not preserve its drawing buffer.
- Alternatives rejected: Curved/fisheye carousel geometry; CSS chromatic approximations; a canvas-only carousel that loses the supplied native mechanics; duplicated panel navigation; canvas edge handles covering the effect; timeline or autonomous animation; Layers; upload placeholders; video export.
- State/output mapping: `carousel.scroll` maps to the DOM rail, translated Paper rail, persistence, and still export. `edgeZone.width` maps to both mask stops. Every `dispersion.*` target maps directly to the official Paper component prop. `canvas.size` clips the fixed Figma composition. `canvas.renderScale` maps to exact Paper backing pixels. Background and image-export targets map to preview and the shared export renderer.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- First product delivery lifecycle: Complete functional proof without measured performance.
- Later delivery lifecycle: A later delivery derives targeted functional checks from the previous protected receipt; only a localized performance complaint grants one targeted performance iteration.
- Full audit authority: A complete performance review or full audit runs `npm run verify:perf` only when the user explicitly requests it.
- Risks: The exact x2 Figma PNGs are fixed-resolution sources, so 8K export legitimately upscales them. Browser color management may slightly shift subpixel chromatic fringes. The Paper dependency uses its published license and is pinned to the inspected `0.0.80` source.

### Iteration 2 — Padded white canvas and Figma card radii

- Request: Add 160px of canvas padding above and below the composition, use the card rounding from Figma, and make the background white.
- Task type: Renderer, canvas, and export refinement within the existing reference-runtime clone.
- User-visible result: The finite output is now 1472×1034 with the unchanged 1472×714 Figma composition inset by 160px vertically. The heading begins at y=160, the card rail begins at y=314, clean and Paper-distorted card pixels share the exact 12px Figma radius, and preview plus still export default to white.
- Source/reference checked: Figma file `BZvXRLFX2bR57Gza4vhyxI`, node `6737:6662`, re-inspected through design context; every 448×560 card node specifies a 12px radius.
- Reference inputs: Figma node `6737:6662`; no additional source assets were supplied, so `referenceInputs` remains empty and reference preprocessing was not run.
- Docs/contracts read: `workflow.md`; Plan and Implementation routes for reference study, runtime boundary, performance, setup/export, media upload, assembly, schema, component rules, and renderer technique; Verification routes in `acceptance-testing.md` and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `controls-product-coverage`, `output-export-required`, `reference-clone-source-of-truth`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`; vertical padding and rounded clipping do not introduce a camera or spatial editing.
- Interaction ownership: Remains unchanged. Canvas owns carousel browsing and panel controls own exact shader/background values.
- Decision: Increase finite and infinite scene height from 714px to 1034px, translate the authored composition down by exactly 160px, clip every DOM card to 12px, apply the same repeated rounded-card mask to the translated Paper layer, and use equivalent rounded paths in Canvas 2D export. Bump local persistence to version 2 so older stored mint/714 defaults cannot override the requested initial state.
- Alternatives rejected: Rescaling the cards to fill the taller canvas; adding only external UI padding that would disappear from export; rounding only the clean DOM layer; leaving existing local persisted defaults active; approximating the Figma radius by eye.
- State/output mapping: `canvas.size` starts at 1472×1034 and clips the fixed padded composition. `appearance.background` starts at `#FFFFFF`. The fixed 12px radius applies to DOM cards, Paper edge pixels, finite export, and infinite export without adding a new user control.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Later delivery lifecycle: The protected runner derives targeted functional ownership from the preceding successful receipt; this request does not authorize a measured performance iteration.
- Full audit authority: A complete performance review or full audit runs `npm run verify:perf` only when the user explicitly requests it.
- Risks: The persistence-key bump intentionally starts a clean v2 workspace instead of importing prior canvas/background defaults. Rounded shader clipping relies on the browser's CSS mask support in preview, while export uses Canvas 2D rounded paths.

### Iteration 3 — Reference-matched progressive dispersion and edge blur

- Request: Study the supplied dispersion references more closely, add the missing progressive blur, and make the edge deformation feel like chromatic dispersion; inspect whether another Paper shader would improve the result.
- Task type: Renderer and product-behavior refinement within the existing Figma/reference-runtime clone.
- User-visible result: The center of the carousel stays sharp while four smoothly masked compositor layers progressively remove focus toward both outside edges. The retained Paper Lens Distortion layer now starts with a broader, biased chromatic fan, so imagery and typography separate into long colored trails instead of a narrow RGB outline. `Edge width` controls how far the combined effect reaches inward and the new `Edge blur` slider controls its maximum strength. No geometric bend was introduced.
- Source/reference checked: Both supplied raster references at original resolution; the installed official Paper Lens Distortion and Fluted Glass shader sources at package version `0.0.80`; Paper's official shader catalogue and GitHub repository.
- Reference inputs: `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-3d316c5f-4525-4657-ae5a-990ddaa08188.png`; `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-d91ef466-9672-456b-a3b3-df88db34a8ef.png`; both are static PNG images, so `referenceInputs` remains empty and reference preprocessing was not run.
- Docs/contracts read: `workflow.md`; Plan and Implementation routes for reference study, runtime boundary, control selection, layout, performance, decision contract, schema, component rules, and renderer technique; Verification routes in `acceptance-testing.md` and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-section-inventory-required`, `controls-product-coverage`, `renderer-technique-inventory`, `reference-clone-source-of-truth`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`; optical edge processing does not add camera or orbit behavior.
- Interaction ownership: Canvas continues to own carousel browsing. The panel owns exact edge-zone width, progressive blur, and Paper shader property editing; no operation is duplicated.
- Decision: Keep the official Paper Lens Distortion shader as the chromatic sampler, use a nonlinear symmetric reveal mask, then composite four overlapping, smoothly masked backdrop-filter layers with increasing radius toward each outside edge. Set the new defaults to 34% edge width, 28px edge blur, 0.9 spread, 0.6 bias, 0.68 hue, and 40 samples. Apply an equivalent bounded 48-band variable-radius filter during still export. Bump local persistence to version 4 so previously stored weaker defaults do not override the new reference-matched starting state.
- Alternatives rejected: Paper Fluted Glass because its directional Gaussian blur is coupled to regular flute/grid structure that adds visible glass ribs absent from the reference; Paper Warp and Water because they introduce geometric bending or animated displacement; a single uniform CSS blur because it creates a hard inner boundary; the first stepped blur-band preview because its vertical seams were visible.
- State/output mapping: `edgeZone.width` drives the nonlinear Paper reveal and each progressive-blur mask extent. `edgeZone.blur` maps to four increasing preview filter radii and the exporter's variable-radius edge composite. `dispersion.spread`, `dispersion.bias`, and `dispersion.color` map directly to the official Paper component. The clean DOM center, rounded-card clipping, canvas crop, and current carousel scroll remain unchanged.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Later delivery lifecycle: The protected runner derives targeted functional ownership from the preceding successful receipt; this visual-fidelity request does not authorize a measured performance iteration.
- Full audit authority: A complete performance review or full audit runs `npm run verify:perf` only when the user explicitly requests it.
- Risks: Progressive CSS backdrop filtering and Canvas 2D export filtering can differ slightly at subpixel boundaries across browser/GPU implementations. The effect remains bounded to a 0–40px radius and the official Paper sample limit remains 50.

### Iteration 4 — Stationary screen-space aura the cards travel through

- Request: The user re-supplied both dispersion references and reported the previous effect and feeling were wrong; the aura and dispersion must sit at the viewport edges, be adjustable with blur, and the left and right cards must visibly pass through the aura.
- Task type: Renderer replacement and control redesign within the existing Figma/reference-runtime clone.
- User-visible result: One custom WebGL pass renders the full rail from the baked strip. Dispersion, defocus, aura halo, and edge fade are computed from the canvas coordinate while the strip translates underneath with native scroll, so cards continuously enter, saturate, and exit the stationary treatment. Scroll velocity adds a configurable motion streak. Controls now expose Edge width, Falloff, Edge fade, Dispersion, Samples, Spectrum, Hue, Blur, Aura, and Motion boost.
- Source/reference checked: Both supplied dispersion references re-reviewed at original resolution; the previous Paper-based composite inspected against them at matching scroll positions; the user's explicit description of the stationary-aura behavior.
- Reference inputs: The two supplied PNG references; both are static images, so `referenceInputs` remains empty and reference preprocessing was not run.
- Docs/contracts read: `workflow.md`; Plan and Implementation routes for runtime boundary, control selection, layout, performance, schema, component rules, and renderer technique; Verification routes in `acceptance-testing.md` and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-section-inventory-required`, `controls-product-coverage`, `renderer-technique-inventory`, `reference-clone-source-of-truth`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Canvas keeps native carousel browsing; the panel owns the exact edge-zone and dispersion-optics values. No operation is duplicated.
- Root cause of the wrong feeling: The Paper Lens Distortion layer was translated with the track, so its distortion field was anchored to the content — each card carried a frozen distortion that a viewport mask merely faded in, instead of the card passing through a stationary field. The effect was also clipped inside the rounded card shapes, so nothing could bleed past a card edge into an aura, and the four stacked backdrop-filter bands produced visible banding.
- Decision: Replace the Paper overlay and the backdrop-filter stack with one screen-space WebGL pass over the baked 2304×560 strip: a per-pixel edge field (width, falloff exponent, outer fade) drives a stratified spectral sampling loop (bounded 48 taps, per-pixel jitter that reads as film grain) integrating chromatic smear, defocus, and a signed scroll-velocity streak, plus a 12-tap additive aura pass whose halo bleeds past the card silhouettes. The DOM rail keeps interaction, snap, keyboard, and accessibility duties with its cards visually hidden while WebGL owns every visible card pixel; if WebGL is unavailable the clean DOM cards remain as fallback. Export renders the same pass deterministically (velocity zero) at export resolution. The `@paper-design/shaders` dependencies were removed, defaults were retuned against the references, the previous/next threshold now measures the first card instead of the whole track, and persistence was bumped to v5 so stale Paper values cannot override the new recipe.
- Alternatives rejected: Keeping Paper Lens Distortion with a viewport-fixed element, because its distortion field is defined over its own source image and cannot follow a scroll-translated crop; CSS-only approximations, because backdrop filters cannot anchor a continuous spectral smear to the viewport; curved geometry, which the user already rejected; a fully WebGL carousel, which would discard the preserved native scroll semantics.
- State/output mapping: `edgeZone.width`, `edgeZone.curve`, and `edgeZone.fade` shape the stationary field; `dispersion.amount`, `dispersion.count`, `dispersion.spectrum`, `dispersion.hue`, `dispersion.blur`, `dispersion.aura`, and `dispersion.velocity` map to shader uniforms; `carousel.scroll` drives the DOM rail, the shader scroll uniform, persistence, and export; `canvas.renderScale` maps to exact rail backing pixels; background and image-export targets are unchanged.
- Performance intent: ordinary-product-work
- Visual evidence: Shader behavior was iterated against both references in an instrumented standalone harness (static edges, motion frames, light and dark backgrounds) using the exact production WebGL module.
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Later delivery lifecycle: The protected runner derives targeted functional ownership from the preceding successful receipt; this visual-behavior request does not authorize a measured performance iteration.
- Full audit authority: A complete performance review or full audit runs `npm run verify:perf` only when the user explicitly requests it.
- Risks: Per-pixel jitter is intentional grain and makes byte-identical screenshots across GPU vendors unlikely, while layout, zone geometry, clean center, and visible smear direction remain deterministic. The aura reads additively and is most visible on dark backgrounds. 8K export still upscales the fixed x2 strip sources.

### Iteration 5 — Boundary light band the cards flare through

- Request: The user confirmed the stationary-zone direction, marked the zone boundary with a vertical line on a screenshot of the running product, and chose the aura as a stationary light band on that boundary that cards pass through.
- Task type: Renderer and control extension within the existing screen-space dispersion pass.
- User-visible result: A vertical light curtain now stands at the inner boundary of each edge zone, following the Edge width control. Crossing cards flare with a neutral-core glow rimmed by prism colors, refract as through a glass ridge, and the flash briefly intensifies with scroll speed. A new Boundary Aura section exposes Band width, Glow, and Refraction.
- Source/reference checked: The user's annotated screenshot with the marked vertical boundary; the confirmed "light band on the boundary" choice; both prior dispersion references for the band's prism-rim styling.
- Reference inputs: The annotated screenshot is a static image, so `referenceInputs` remains empty and reference preprocessing was not run.
- Docs/contracts read: `workflow.md`; Plan and Implementation routes for runtime boundary, control selection, layout, schema, component rules, and renderer technique; Verification routes in `acceptance-testing.md` and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-section-inventory-required`, `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Canvas keeps native carousel browsing; the panel owns the exact band width, glow, and refraction values while the band position follows the edge-zone width. No operation is duplicated.
- Decision: Evaluate a gaussian band around the zone-start coordinate inside the existing fragment pass. A monotonic bell-profile displacement (capped below the band width to stay fold-free) refracts crossing pixels like a glass ridge; a five-tap local light sample feeds an additive glow whose core is neutral light and whose rims sweep the generated spectrum; scroll velocity multiplies the flash up to 1.7×. The band costs five extra taps only where it is visible and none elsewhere, and export renders it deterministically with velocity zero.
- Alternatives rejected: A symmetric S-profile displacement, because it double-exposed text at the band; a full-spectrum band core, because the mid-spectrum green tinted every crossing card; a separately positionable band, because coupling it to the zone boundary keeps one coherent geometry with fewer controls; a DOM overlay band, because it could not sample and re-emit the content that crosses it.
- State/output mapping: `auraGate.width`, `auraGate.glow`, and `auraGate.refraction` map to shader uniforms; the band center derives from `edgeZone.width`; all previous targets are unchanged; the three new targets join the preview-pass invalidation set and the still export.
- Performance intent: ordinary-product-work
- Visual evidence: The band was iterated in the instrumented harness against the annotated screenshot on light and dark backgrounds, at rest, mid-crossing, and with frozen scroll velocity, using the exact production WebGL module.
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Later delivery lifecycle: The protected runner derives targeted functional ownership from the preceding successful receipt; this visual-behavior request does not authorize a measured performance iteration.
- Full audit authority: A complete performance review or full audit runs `npm run verify:perf` only when the user explicitly requests it.
- Risks: The band glow is additive, so on pure white background its core reads as a subtle sheen while its prism rims stay visible; per-pixel jitter grain still makes byte-identical screenshots across GPU vendors unlikely.

### Iteration 6 — Configurable irregular edge halos

- Request: Add configurable irregular halos at the edges like in the originally supplied references, whose dissolving edges are ragged organic tongues rather than straight washes.
- Task type: Renderer and control extension within the existing screen-space dispersion pass.
- User-visible result: The edge smear and aura halo now dissolve into a ragged organic contour whose reach varies row by row and morphs slowly while scrolling. A Turbulence slider sets the strength (zero restores the perfectly smooth envelope) and Turbulence size sets the wavelength of the raggedness; both live in the Edge Zone section.
- Source/reference checked: Both originally supplied dispersion references re-reviewed for halo contour; the current smooth-envelope build compared against them in the harness at matching positions.
- Reference inputs: Static images only, so `referenceInputs` remains empty and reference preprocessing was not run.
- Docs/contracts read: `workflow.md`; Plan and Implementation routes for runtime boundary, control selection, schema, component rules, and renderer technique; Verification routes in `acceptance-testing.md` and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `controls-section-inventory-required`, `controls-product-coverage`, `renderer-technique-inventory`, `reference-clone-source-of-truth`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Unchanged; the panel owns the exact turbulence strength and wavelength values.
- Decision: Sample a deterministic two-octave value-noise field once per pixel (gated to the edge zones), keyed by row position with a per-side seed and a slow scroll-coupled drift. The field modulates the spectral smear span (0.55–1.6×), the aura halo reach (0.25–2.2× swing), the halo gain, and adds a vertical waviness, so the halo contour becomes uneven tongues that stay fixed to the viewport while cards pass through and the pattern morphs organically with scroll. Export stays deterministic because the field depends only on position and scroll.
- Alternatives rejected: Time-animated turbulence, because it would break deterministic stills and the product has no timeline; per-tap noise displacement, because modulating the envelope once per pixel is cheaper and matches the reference look; a second noise texture upload, because two octaves of procedural value noise suffice at these wavelengths.
- State/output mapping: `edgeZone.turbulence` and `edgeZone.turbulenceScale` map to shader uniforms and join the preview-pass invalidation set; all previous targets are unchanged; zero turbulence reproduces the previous smooth behavior exactly.
- Performance intent: ordinary-product-work
- Visual evidence: Turbulence was iterated in the instrumented harness against both original references on light and dark backgrounds at zero, default, and maximum strength, using the exact production WebGL module.
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Later delivery lifecycle: The protected runner derives targeted functional ownership from the preceding successful receipt; this visual-behavior request does not authorize a measured performance iteration.
- Full audit authority: A complete performance review or full audit runs `npm run verify:perf` only when the user explicitly requests it.
- Risks: The noise field costs roughly sixteen extra trigonometric evaluations per edge-zone pixel and none in the clean center; ragged contours intentionally vary with scroll position, so screenshots at different scroll offsets differ by design.

### Iteration 7 — Native two-finger canvas zoom

- Request: `не работает зкм пальцами на канвасе, только по нажатию снизу на лупу`
- Task type: Shared Toolcraft canvas viewport regression fix and generated-runtime sync.
- User-visible result: A two-finger pinch directly on the canvas now zooms around the gesture midpoint without changing browser-page scale or panel size; moving that midpoint pans the viewport at the same time. Native Safari/macOS gesture events, touch pointers, Chrome trackpad pinch, one-finger canvas pan, and the bottom zoom buttons share the runtime viewport path.
- Source/reference checked: The original failure was reproduced with two browser touch points whose separation changed from 80px to 240px while canvas zoom remained at 100%. User steering then identified whole-page zoom including the panel; comparison with the monorepo editor browser-zoom lock exposed Safari `gesturestart`/`gesturechange` as the missing native route. The shared `useCanvasViewportInteractions` hook and its pointer, wheel, clamp, and panel-overlay regression suite were inspected.
- Reference inputs: None; this is a direct interaction bug report, not a visual or motion-reference transfer.
- Docs/contracts read: `workflow.md`; the broken-behavior Plan route in `decision-contract.md` and `core/runtime-boundary.md`; the Implementation route in `component-rules.md` and `renderer-technique.md`; the Verification route in `acceptance-testing.md` and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`; pinch changes the Toolcraft 2D viewport and does not introduce a product camera or orbit pose.
- Interaction ownership: The runtime canvas owns viewport pinch and pan gestures; the runtime toolbar keeps its complementary exact zoom-step buttons. Product carousel browsing remains canvas-owned and panel shader controls remain unchanged.
- Decision: Track active touch pointers in the shared monorepo runtime, initialize a pinch from the first two points, scale by their distance ratio, preserve the world point below the initial midpoint, translate by midpoint movement, and commit the transient viewport once the gesture ends. Also consume Safari/macOS `gesturestart`/`gesturechange`/`gestureend` with non-passive capture listeners: a gesture beginning inside the canvas updates only `canvas.zoom` and `canvas.offset`, while a gesture over runtime panels is prevented from becoming browser-page zoom without moving the canvas. Sync that source into the signed generated runtime and cover both native routes with runtime and real-browser regression tests.
- Alternatives rejected: App-local gesture code, because CanvasShell owns viewport mechanics; converting touches into synthetic wheel events, because that loses native midpoint translation and gesture lifecycle; allowing Safari's default page gesture and compensating with CSS, because the panel would still scale; patching only the generated runtime without an upstream source fix.
- State/output mapping: Active touch distance maps to `canvas.zoom`; touch midpoint movement maps to `canvas.offset`; the transformed `[data-toolcraft-canvas-world]` consumes both values during the live gesture and the runtime history receives one committed viewport boundary at completion.
- Performance intent: ordinary-product-work
- Performance scope: The report is a missing functional gesture, not a latency or throughput complaint.
- Delivery-gate stabilization: The existing keyboard/button carousel navigation now requests the exact 464px card-plus-gap snap step while retaining smooth scrolling. Its one-time persisted-scroll initialization runs in a layout effect before the first interactive frame; the prior passive effect could run after an early ArrowRight input and overwrite the new position with the persisted zero, preventing reference and reload receipts.
- Delivery classification: Shared runtime/template behavior plus a signed generated-runtime refresh. Focused coverage includes the runtime interaction test, runtime typecheck, generated-app pinch browser check, and dev URL; measured performance is excluded because this request does not authorize a performance iteration or full audit.
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Safari gesture events are browser-specific, so the runtime treats them as a guarded native compatibility path while retaining standard Pointer Events and wheel pinch as the primary routes. The browser check must prove stable `visualViewport.scale` and panel bounds alongside changing canvas world transform.

### Iteration 8 — Revised Figma cards and optional testimonial dispersion

- Request: Keep the established carousel mechanics, replace all five cards with the supplied `Frame 214725756*.png` sources, lay out the correct Figma testimonial copy above each image as one card component, add an option that includes that text in the same effect, and correct the oversized cropped fragment still visible after reloading at reduced canvas zoom.
- Task type: Figma-driven renderer, card composition, control, persistence, export, and browser-acceptance refinement.
- User-visible result: The rail now uses the five exact supplied 896×1120 images in the inspected Figma order. Every 448×560 card is an HTML `article` with a 24px-inset, bottom-aligned Figtree Regular 20px/26px testimonial. `Text effect` defaults on and sends testimonial pixels through the same stationary dispersion, blur, aura, fade, and refraction pass; off keeps a synchronized clean text layer while the images remain distorted. Reloading at 50% canvas zoom preserves the same three-card composition instead of magnifying the WebGL texture into a cropped fragment.
- Source/reference checked: Figma file `BZvXRLFX2bR57Gza4vhyxI`, node `6811:7821`, inspected through design context for order, exact copy, layout, font, weight, size, and line height; the five user-supplied x2 PNG sources inspected at 896×1120; the supplied reduced-zoom screenshot compared with the running 50% canvas before and after reload.
- Reference inputs: Five static PNG card-image sources at `/Users/kusnizza/Desktop/Frame 2147257561.png` through `Frame 2147257565.png`; Figma node `6811:7821`; static diagnostic screenshot `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-68b59eec-460b-41bc-a332-2f866c74ff4a.png`.
- Docs/contracts read: `workflow.md`; Plan and Implementation routes for reference study, runtime boundary, control selection, layout, performance, setup/export, media upload, assembly, schema, component rules, and renderer technique; Verification routes in `acceptance-testing.md` and `performance.md` are required before final proof.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `controls-section-inventory-required`, `controls-product-coverage`, `renderer-technique-inventory`, `reference-clone-source-of-truth`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, `output-export-required`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Canvas retains native snap scrolling, arrow controls, and keyboard navigation. The panel owns the global clean-or-dispersed testimonial mode because a canvas click would conflict with navigation and make the global state ambiguous.
- Decision: Keep one canonical card array for DOM accessibility, shader texture construction, clean overlay, and export. Assemble the five source images once into a retained 4608×1120 image texture and draw the exact testimonials once into a retained transparent texture using the same Figtree metrics as the DOM. A boolean shader uniform alpha-composites that texture before every optical sample. When disabled, WebGL samples only images and a pointer-transparent DOM track translates by the exact native `scrollLeft`; clean export draws the same canonical testimonials after the deterministic shader snapshot. For canvas zoom, use untransformed `clientWidth/clientHeight` as shader coordinates and multiply only backing density by the Toolcraft zoom, so a persisted 50% transform no longer halves the shader coordinate system and doubles card size. Persistence advances to v6.
- Alternatives rejected: Baking testimonials permanently into the supplied PNGs, because the text could no longer stay clean independently; applying a CSS filter only to DOM paragraphs, because it would not share the same dispersion samples; maintaining independent strings for DOM and export, because copy and wrapping would drift; changing the carousel to a WebGL-only interaction model, because it would discard the preserved native mechanics.
- State/output mapping: `dispersion.includeText` maps to one WebGL uniform, the presence of the clean DOM text track, persistence/settings transfer, and clean-versus-dispersed still composition. `carousel.scroll` maps identically to the interaction rail, both texture samples, clean overlay transform, persistence, and export. Existing shader, canvas, background, and delivery targets remain unchanged.
- Performance intent: ordinary-product-work
- Focused verification: Code health, typecheck, product/acceptance/performance unit gates, exact Figma DOM inspection, WebGL and clean-text visual comparison, 464px scroll synchronization, sequential browser coverage for carousel, `dispersion`, `edgeZone`, and `auraGate` domains, plus a 50% zoom reload reproducer comparing transformed bounds, logical dimensions, backing pixels, and the corrected three-card frame.
- Verification: `npm run verify:delivery`
- Protected delivery: The coherent batch requires functional proof; no measured performance run is authorized.
- Risks: Browser and Canvas 2D glyph antialiasing can differ slightly while copy, font metrics, wrapping width, line height, and bottom position remain shared. 8K output can upscale the fixed x2 source images.

### Iteration 9 — Remove neutral grey halo artifacts

- Request: Fix the grey artifacts marked above and below the carousel and near both edge-zone boundaries on the white canvas.
- Task type: Targeted WebGL compositing correction within the existing preview/export renderer.
- User-visible result: Empty canvas padding stays white. Cards still generate red/green/blue dispersion beyond their silhouettes, but dark image samples no longer become broad neutral grey fog, and the stationary boundary light no longer paints opacity where no card content exists.
- Source/reference checked: Diagnostic screenshot `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-01c8cde9-20ad-44d7-b48e-cb3b1e6bc165.png`; the running app at the persisted 50% canvas zoom; the current premultiplied fragment-compositing path.
- Reference inputs: One static diagnostic screenshot; `referenceInputs` remains empty and no motion preprocessing is required.
- Docs/contracts read: The already-selected broken-behavior workflow routes and the systematic-debugging skill for this coherent delivery batch.
- Contract rules applied: `canvas-surface-preserved`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`; correcting fragment compositing does not add camera behavior.
- Interaction ownership: Unchanged; the canvas owns carousel browsing and the panel owns exact optical parameters.
- Root cause: The five-tap boundary light injected a fixed tint and alpha even when its local content sample was fully transparent. Separately, the aura carried the shared neutral component of dark card pixels outside the authored card silhouette; premultiplied-alpha compositing converted that component into a grey veil on white.
- Decision: Multiply all boundary-light tint and opacity by sampled coverage. Before the final fade, compare the displaced result with the undisplaced authored coverage: preserve the complete result over the card, while outside the source silhouette subtract the minimum shared RGB channel and set alpha from the remaining maximum spectral channel. This removes only achromatic spill and retains the intended colored fringe.
- Alternatives rejected: Hard-clipping all effect pixels to the card silhouette, because it would remove the requested dispersion beyond card edges; reducing Aura or Blur defaults, because it would only hide rather than fix the compositing defect; masking the whole 160px padding, because it would also cut legitimate colored edge tongues.
- State/output mapping: No state shape changes. All existing edge, dispersion, aura, gate, text-effect, scroll, render-scale, and export targets keep their meanings; preview and deterministic export share the corrected fragment source.
- Performance intent: ordinary-product-work
- Focused verification: Typecheck and product renderer tests, then a real-browser reload at 50% canvas zoom confirming white top/bottom padding and intact spectral edge color.
- Verification: `npm run verify:delivery`
- Risks: Neutral luminance outside the authored silhouette is intentionally removed; on a dark user-selected background the external fringe therefore reads as colored light rather than a pale achromatic halo, which matches the requested dispersion behavior.

### Iteration 10 — Independently positionable Boundary Aura

- Request: `я хочу чтобы этот параметр можно было двигать от краев, и задавать ему ширину. сделай только функционал проверки не делай`
- Task type: Schema control and WebGL renderer behavior extension within the existing stationary Boundary Aura.
- User-visible result: Boundary Aura now exposes `Edge offset` and `Band width` as independent sliders. Edge offset moves the left and right light bands symmetrically inward from their nearest canvas edges, while Band width changes their thickness without moving their centers.
- Source/reference checked: The supplied screenshot of the Boundary Aura section and the existing schema, runtime settings reader, canonical renderer pipeline, and fragment shader implementation.
- Reference inputs: `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-79a3893b-2ef0-4d14-8fde-9d2a8d5a0e71.png`; this is a static UI screenshot, so `referenceInputs` remains empty and no motion preprocessing is required.
- Docs/contracts read: `workflow.md`; the schema/controls and renderer Plan routes in `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, and `core/performance.md`; the Implementation routes in `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, and `performance.md`.
- Contract rules applied: `interaction-surface-ownership`, `controls-section-inventory-required`, `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`; positioning a paired two-dimensional optical band does not introduce a model, camera, or orbit interaction.
- Interaction ownership: The panel owns exact offset and width values. Canvas remains dedicated to carousel navigation; a draggable band handle would cover the effect pixels being judged and duplicate the same positioning operation.
- Decision: Add the built-in continuous `auraGate.offset` slider with a 0–50% domain and a 30% default, preserving the prior default band position while decoupling it from `edgeZone.width`. Convert the value to a 0–0.5 shader uniform and derive each symmetric band center from its nearest viewport edge. Keep `auraGate.width` in pixels as the independent band-spread control.
- Alternatives rejected: Continuing to derive the band position from Edge width, because it prevents independent placement; using pixel offset, because percentage placement remains stable as the editable canvas width changes; adding canvas drag handles, because the user asked for the parameter and the panel already owns precise optical settings.
- State/output mapping: `auraGate.offset` maps to the paired shader-band centers in preview and the shared deterministic still snapshot; `auraGate.width` maps only to band spread. Both values use schema defaults, runtime history/reset, persistence, settings transfer, and the existing export path.
- Performance intent: ordinary-product-work
- Verification: `npm run verify:delivery`
- Risks: At 50% both symmetric positions meet at the canvas center; at 0% they sit on the outer edges. The control intentionally moves both sides together rather than allowing asymmetric placement.

### Iteration 11 — Grey artifact cleanup after independent aura positioning

- Request: Fix the grey artifacts marked in the empty white regions above and below the carousel after the independently positionable Boundary Aura was added.
- Task type: Targeted WebGL premultiplied-alpha compositing correction.
- User-visible result: Empty canvas padding remains white while displaced RGB fringes stay visible; moving or widening Boundary Aura no longer produces neutral grey opacity away from actual card pixels.
- Source/reference checked: Diagnostic screenshot `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-01c8cde9-20ad-44d7-b48e-cb3b1e6bc165.png`; live WebGL preview at 50% canvas zoom; implemented `auraGate.offset` and `auraGate.width` paths.
- Reference inputs: One static diagnostic screenshot; no motion preprocessing is required.
- Docs/contracts read: `workflow.md`; the already-selected broken-behavior Plan, Implementation, and Verification routes; the systematic-debugging and browser skills.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`; the correction affects pixels only.
- Interaction ownership: Unchanged; carousel movement remains canvas-owned and the independent aura parameters remain panel-owned.
- Root cause: Boundary light previously injected a fixed tint and alpha into transparent samples, while the external aura retained the shared neutral component of dark card pixels; compositing that premultiplied result over white created the grey bands.
- Decision: Gate boundary-light tint and alpha by sampled content coverage. Outside each undisplaced authored card silhouette, subtract only the common RGB component and derive alpha from the remaining spectral channels, preserving colored dispersion without achromatic fog. Keep the new independent offset and width controls intact and add their missing browser acceptance coverage.
- Alternatives rejected: Hard-clipping all halo pixels, lowering default effect strength, or masking the padding, because each would remove valid colored dispersion instead of correcting the alpha math.
- State/output mapping: No state change. Offset, width, glow, refraction, dispersion, text effect, scroll, render scale, and export continue through the same preview/export shader.
- Performance intent: ordinary-product-work
- Verification: `npm run verify:delivery`
- Risks: External achromatic halo is intentionally suppressed on every background; the remaining fringe is spectral light, matching the requested dispersion appearance.

### Iteration 12 — Seamless infinite carousel cycle

- Request: `сделай карусель бесконечно цикличной, без доп проверок`
- Task type: Carousel navigation, WebGL sampling, persistence, clean-text composition, and still-export behavior extension.
- User-visible result: The carousel now continues indefinitely in both directions. Next, Previous, keyboard arrows, and native horizontal scrolling pass directly from the fifth card to the first and from the first to the fifth without disabled navigation or a visible jump.
- Source/reference checked: The current native DOM rail, retained one-cycle texture builder, wrapped screen-space WebGL renderer, clean testimonial overlay, normalized persisted `carousel.scroll`, and still export composition.
- Reference inputs: None; this is an explicit product-behavior request and does not add a visual or motion reference.
- Docs/contracts read: `workflow.md`; the renderer Plan route in `core/runtime-boundary.md` and `core/performance.md`; the Implementation route in `renderer-technique.md` and `performance.md`.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`; an endlessly wrapping horizontal product rail does not introduce a model, camera, or orbit pose.
- Interaction ownership: Canvas continues to own browsing through arrows, native horizontal scroll/drag, snap, and keyboard input. No panel navigation is added because it would duplicate the same operation outside the visible rail.
- Decision: Keep one authored five-card cycle and one retained image/text texture, add its closing 16px gap, and wrap every WebGL horizontal sample modulo the 2320px cycle. Render three lightweight DOM interaction copies and synchronously rebase equivalent positions to the middle copy after either cycle boundary. Persist and export only the normalized 0–2320px logical position, compute velocity through the shortest wrapped delta, repeat the optional clean testimonial layer across the same three copies, and draw adjacent testimonial cycles for clean-text export.
- Alternatives rejected: Appending cards indefinitely, because DOM and memory would grow; duplicating the GPU texture three times, because the shader can wrap one retained source; jumping from the end back to absolute scroll zero, because that exposes a visible discontinuity and false motion-boost spike; autonomous Timeline playback, because the request is infinite navigation rather than time-based animation.
- State/output mapping: Native physical scroll maps to a normalized `carousel.scroll` value within one cycle; that logical value drives WebGL, velocity, persistence, settings transfer, and still export. The three-copy DOM position drives only the interaction rail and optional clean preview text.
- Performance intent: ordinary-product-work
- Verification: `npm run verify:delivery`
- Risks: Browser-native smooth-scroll cancellation at the exact rebase boundary is designed to be visually equivalent because both DOM positions contain identical card pixels; this was not browser-verified at the user's request.

### Iteration 13 — Preserve artifact cleanup in the seamless loop

- Request: Fix the grey artifacts marked above and below the cards on the white canvas.
- Task type: Integrated WebGL compositing correction after the concurrently completed seamless-carousel behavior.
- User-visible result: The looped carousel keeps pure white empty padding and colored spectral fringes without neutral grey fog; the independent boundary band cannot add opacity where its five-tap sample contains no card pixels.
- Source/reference checked: The user's marked diagnostic screenshot; the running app at 50% canvas zoom after the seamless-loop source stabilized; the current wrapped WebGL sampler and independently positioned aura gate.
- Reference inputs: Static diagnostic screenshot `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-01c8cde9-20ad-44d7-b48e-cb3b1e6bc165.png`; no motion preprocessing is required.
- Docs/contracts read: `workflow.md`; the selected broken-behavior Plan, Implementation, and Verification routes; the systematic-debugging and browser skills.
- Contract rules applied: `canvas-surface-preserved`, `interaction-surface-ownership`, `renderer-technique-inventory`, `acceptance-product-observable`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`; only fragment compositing changes.
- Interaction ownership: Canvas owns carousel browsing and the panel owns exact effect values; the correction adds no new operation.
- Decision: Keep full output over authored pixels. Outside the undisplaced card silhouette, subtract the minimum common RGB component and derive alpha from the remaining maximum spectral channel. Multiply gate tint and alpha by real local sample coverage. Preserve the one-cycle wrapped texture and independent offset/width controls.
- Alternatives rejected: Hard clipping, padding masks, and weaker defaults, because each would hide valid colored dispersion instead of removing the faulty neutral alpha contribution.
- State/output mapping: Existing normalized `carousel.scroll`, aura offset/width/glow/refraction, dispersion, text mode, canvas, persistence, and still export values keep their mappings through the corrected shared fragment pass.
- Performance intent: ordinary-product-work
- Verification: `npm run verify:delivery`
- Risks: Achromatic light outside the authored silhouette is intentionally suppressed; the retained external halo is spectral rather than white.

### Iteration 14 — Exported recipe defaults and stationary warp

- Request: `/Users/kusnizza/Desktop/dispersion-carousel-settings (4).json вот сделай эти настрйоки по умолчанию. сначала делаем визуальную часть включая варп искажение, потом сразу делаем перфоманс`
- Task type: Schema defaults, control, and WebGL renderer extension; performance follows as a later authority-backed iteration after this visual batch.
- User-visible result: A fresh workspace opens at 1920×1034 with the exported optical recipe (0.7 turbulence, 10% / 63px boundary band) plus a 40px stationary geometric warp. Cards stretch and barrel as they travel through the edge field; Warp at zero restores the previous flat sampling. Authored 1472 heading composition and 2320px cycle are unchanged. Exported scroll 1856 is not a product default.
- Source/reference checked: The user-exported settings JSON; current schema defaults, uniforms, and fragment warp insertion point.
- Reference inputs: `/Users/kusnizza/Desktop/dispersion-carousel-settings (4).json`; static settings transfer, so `referenceInputs` remains empty.
- Docs/contracts read: `workflow.md`; Plan routes in `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, and `core/performance.md`; Implementation routes in `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, and `performance.md`; Verification route in `acceptance-testing.md`.
- Contract rules applied: `controls-section-inventory-required`, `controls-product-coverage`, `interaction-surface-ownership`, `renderer-technique-inventory`, `acceptance-product-observable`, `persistence-policy-explicit`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`; geometric UV warp is a 2D optical displacement, not a camera or orbit pose.
- Interaction ownership: Canvas keeps carousel browsing. The panel owns Warp as a precise scalar, matching the other edge-zone properties. A canvas handle would cover the bending pixels being judged.
- Decision: Promote the exported canvas size, turbulence, and independent aura-gate placement to schema defaults. Add `edgeZone.warp` (0–80px, default 40) that displaces the sample coordinate from the same stationary edge envelope before spectral sampling: horizontal pull from further inside and a mild vertical barrel, both fold-capped. Persistence advances to v7 so stale v6 values cannot override the new recipe. Pipeline runtime id becomes `dispersion-carousel.renderer@5`.
- Alternatives rejected: Making `carousel.scroll` 1856 the default, because that is a transient viewing position rather than a product start state; changing the authored 1472 heading width, because the wider crop should reveal more rail rather than restretch the Figma title; a full-carousel fisheye, which the user previously rejected.
- State/output mapping: `canvas.size` defaults to 1920×1034; `edgeZone.turbulence` 0.7; `auraGate.offset` 10 and `auraGate.width` 63; `edgeZone.warp` maps to `uWarp` in preview and the velocity-free export snapshot. Zero warp is a no-op on the previous coordinate path.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Later delivery lifecycle: This visual batch is functional-targeted. The same request’s performance clause is reserved for the next authority-backed iteration after this receipt.
- Full audit authority: A complete performance review or full audit runs `npm run verify:perf` only when the user explicitly requests it.
- Risks: Strong warp can pull samples from neighboring cards near the outer rim; the displacement is capped at 12% of view width. Persistence v7 starts a clean workspace instead of importing v6 values.

### Iteration 15 — Configurable prism-face warp

- Request: `надо различные настрйоки варп эффекта, должно быть возможно настроить как движение через преломление на грани призмы например`
- Task type: Schema control and WebGL warp-profile extension within the existing screen-space pass.
- User-visible result: Edge Zone now has Warp Style Stretch or Prism. Stretch keeps the previous gradual barrel. Prism puts a refractive face at the inner zone boundary: cards take a plate offset after crossing and a concentrated kink on the face. Face width and Sharpness appear only in Prism and shape that crossing. Default style remains Stretch so the current look is unchanged.
- Source/reference checked: The current stretch warp shader and the user's request for a prism-edge refraction path the cards travel through.
- Reference inputs: None; this is an explicit product-behavior request.
- Docs/contracts read: Already-selected schema/controls and renderer Plan and Implementation routes from the current session; Verification route in `acceptance-testing.md`.
- Contract rules applied: `controls-section-inventory-required`, `controls-product-coverage`, `interaction-surface-ownership`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: The panel owns warp style, face width, and sharpness as precise optical properties. Canvas stays on carousel navigation; a canvas prism handle would cover the crossing being judged.
- Decision: Add `edgeZone.warpStyle`, `edgeZone.warpFace`, and `edgeZone.warpSharpness`. Stretch uses the existing edge-weighted barrel. Prism evaluates a signed smoothstep plate plus a gaussian kink around `uEdgeStart`. Edge Zone now has nine controls and declares `semanticGroup` on every control. Pipeline runtime id becomes `dispersion-carousel.renderer@6`. Persistence stays at v7 because new targets default to the implicit Stretch recipe.
- Alternatives rejected: Replacing Stretch with Prism as the only model, because that would lose the current look; a third fisheye style, because the user asked for a prism face, not another global curve; coupling the face to Boundary Aura offset, because Edge width already places the inner boundary.
- State/output mapping: `edgeZone.warpStyle` selects the shader branch; `edgeZone.warp` is max shift in both styles; `edgeZone.warpFace` and `edgeZone.warpSharpness` map to prism uniforms and stay hidden in Stretch.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: A very wide prism face can reach the canvas center and start shifting mid-rail cards; Face width starts at 56px to keep the kink near the zone start.

### Iteration 16 — Relocatable warp offset and wave ripple

- Request: `давай возможность двигать варп от краев, а также настроить искажение волной`
- Task type: Schema control and WebGL warp-band extension within the existing screen-space pass.
- User-visible result: Edge Warp is now its own workflow stage. Offset slides the whole warp band inward from both viewport edges so the true rims can stay flatter. Wave is a switch that reveals Strength and Length for a vertical sine ripple through that band. Stretch and Prism still work; Offset 0 and Wave off keep the previous look.
- Source/reference checked: The current stretch/prism warp shader and the user's request to move warp off the edges and add wave distortion.
- Reference inputs: None; this is an explicit product-behavior request.
- Docs/contracts read: `workflow.md`; Plan `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`; Implementation `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`.
- Contract rules applied: `controls-section-inventory-required`, `controls-product-coverage`, `interaction-surface-ownership`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: The panel owns Offset and Wave as exact optical properties. Canvas stays on carousel navigation; a canvas warp-band handle would cover the pixels being judged.
- Decision: Add `edgeZone.warpOffset`, `edgeZone.warpWaveEnabled`, `edgeZone.warpWave`, and `edgeZone.warpWaveLength`. Split the edge entity into Edge Zone (field) and Edge Warp (warp) because the combined controls exceed the ten-control section limit. Offset translates the existing zone-width band inward and releases the outer rim; the Wave switch gates Strength and Length because a continuous slider cannot be an applicability selector. Pipeline runtime id becomes `dispersion-carousel.renderer@7`. Persistence stays at v7 because Offset 0 and Wave off are no-ops.
- Alternatives rejected: A 2D Vector pad for offset, because the inset is a symmetric one-axis pair from both edges; making Wave a third Style, because the user asked to configure wave on top of the current warp; coupling Offset to Boundary Aura Edge offset, because smear-zone geometry and warp placement are different operations.
- State/output mapping: `edgeZone.warpOffset` slides `inner`/`outer` and the prism face; `edgeZone.warpWaveEnabled` reveals Strength and Length; those two write `uWarpWave` / `uWarpWaveLength` and stay masked to the relocated band.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: A large Offset plus a wide Edge width can push the warp band into the center cards; Offset tops out at 40% of full width.

### Iteration 17 — Flush offset rim and refractive wave

- Request: `параметр offset должен упираться в края при нудевом значении, сейчас есть отступ. волну ты сделал сильно прямолинейно, волная должна быть как преломеление волной более визуально богато сделано`
- Task type: Visual mismatch and WebGL warp-profile refinement in the existing screen-space pass.
- User-visible result: Offset 0 now pins the warp to the true viewport rim and fades displacement at that rim so cards still touch the edge. Wave is a rippled refractive slab: several incommensurate sines plus noise form a height field, and sampling follows the surface gradient like glass instead of a straight sine shift.
- Source/reference checked: The previous offset band left a vacated margin because stretch/prism peaked at the rim; the previous wave was a two-harmonic horizontal sine.
- Reference inputs: None; this is an explicit product-behavior request.
- Docs/contracts read: `workflow.md`; Plan `decision-contract.md`; Implementation `renderer-technique.md` (runtime-boundary and performance already read this session).
- Contract rules applied: `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Unchanged; Offset and Wave stay panel optical properties.
- Decision: Fade warp displacement with a rim hold so Offset 0 is flush. Replace the sine x-shift with a height-field refraction (finite-difference gradient, IOR bend, curvature magnification). Pipeline runtime id becomes `dispersion-carousel.renderer@8`.
- Alternatives rejected: Keeping max displacement on the rim, because that is what vacated the edge; adding more Wave sliders, because the user asked for a richer look from the existing Strength and Length.
- State/output mapping: `edgeZone.warpOffset` 0 sets `outer = 1` and `rimHold` kills the vacated margin; Wave uniforms feed `waveHeight` and the refractive `point` offset before the spectral loop.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: The extra fbm taps run only when Wave is on; a very high Strength can fold neighboring cards inside the band.

### Iteration 18 — Ripple wave kind and wave blur

- Request: `давай доволнительно сделаем волновое искажение как было с возможностью еще блюрить это искажение`
- Task type: Schema control and WebGL wave-profile extension within the existing screen-space pass.
- User-visible result: Wave now has Kind. Glass keeps the refractive slab. Ripple restores the earlier sideways sine. Blur softens the selected pattern and defocuses cards inside the warp band. Defaults stay Glass with Blur 0 so the current look is unchanged until the user switches.
- Source/reference checked: The previous two-harmonic sine wave and the current height-field refraction.
- Reference inputs: None; this is an explicit product-behavior request.
- Docs/contracts read: `workflow.md`; Plan `core/control-selection.md`, `core/layout.md`, `core/runtime-boundary.md`, `core/performance.md`; Implementation `schema-reference.md`, `component-rules.md`, `renderer-technique.md`.
- Contract rules applied: `controls-section-inventory-required`, `controls-product-coverage`, `renderer-technique-inventory`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Kind and Blur stay panel optical properties; a canvas wave handle would cover the band being judged.
- Decision: Add `edgeZone.warpWaveKind` and `edgeZone.warpWaveBlur`. Edge Warp reaches the ten-control maximum and keeps semantic groups. Ripple is the restored sine; Glass is the refractive path; Blur mixes the pattern toward a single sine and adds masked defocus inside the existing sample loop. Pipeline runtime id becomes `dispersion-carousel.renderer@9`. Persistence stays at v7 because Glass and Blur 0 are no-ops on the previous wave recipe.
- Alternatives rejected: Replacing Glass with Ripple, because the user asked to add the earlier wave; a second global Blur, because that would duplicate Dispersion Blur; splitting Edge Warp again, because ten controls still fit one warp stage.
- State/output mapping: `edgeZone.warpWaveKind` selects the shader branch; `edgeZone.warpWaveBlur` writes `uWarpWaveBlur` and adds `warpWindow`-masked defocus to `blurExtent`.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Wave Blur reuses the existing sample loop, so a high global Blur plus a high Wave Blur can stack defocus in the band.

### Iteration 19 — Trackpad scroll without React hitch

- Request: `галерея дергается при скролле тачпадом`
- Task type: Renderer interaction-loop fix. Ordinary visual/runtime bug, not a measured performance iteration.
- User-visible result: Trackpad and wheel flicks keep native inertia. The rail no longer re-renders fifteen DOM cards on every scroll event. Snap returns after the gesture settles so arrows and keyboard still land on cards.
- Source/reference checked: Current `dispersion-carousel-renderer.tsx` scroll handler, `scroll-snap-type: x mandatory` on `.railViewport`, and the WebGL loop that already reads `scrollLeftRef`.
- Reference inputs: None; this is a live interaction defect.
- Docs/contracts read: `workflow.md`; Plan `decision-contract.md`, `core/runtime-boundary.md`; Implementation `component-rules.md`, `renderer-technique.md`; Verification `acceptance-testing.md`, `performance.md`.
- Contract rules applied: `interaction-surface-ownership`, `canvas-no-app-ui`, `renderer-technique-inventory`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Canvas still owns carousel browsing. `carousel.scroll` stays a persisted runtime value, written only after the gesture settles.
- Decision: Publish live scroll through refs and direct DOM (`data-scroll-left`, clean-text `translate3d`). Disable snap only while wheel/pointer/touch is active, then restore it on `scrollend` or a 240ms idle fallback. Persist `carousel.scroll` once when the settled value actually changed.
- Alternatives rejected: Leaving per-scroll `setState`, because trackpad events at 60–120 Hz reconciled the whole card tree while WebGL already had the latest scroll; keeping mandatory snap during inertia, because it fights the trackpad; writing `controls.setValue` every 140ms, because that still re-rendered the Toolcraft tree mid-flick.
- State/output mapping: Live position stays interaction state in refs. Settled `carousel.scroll` still maps to persistence and still export.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: A very long flick that leaves the middle copy still rebases `scrollLeft` and can trim leftover inertia at the cycle boundary.

### Iteration 20 — Own trackpad wheel instead of native overflow

- Request: `ну сейчас все еще дергается во время скролла быстрого тачпадом`
- Task type: Renderer interaction-loop fix. Ordinary visual/runtime bug, not a measured performance iteration.
- User-visible result: Fast trackpad flicks move the WebGL rail from OS wheel deltas. Native overflow, CSS snap, `scrollend`, and mid-flick `scrollLeft` rebases no longer interrupt inertia. Cards still snap after the gesture rests. Arrows and keyboard still step one card.
- Source/reference checked: Iteration 19 scroll handler, Chromium/macOS `scrollend` gaps during inertial wheel bursts, and the 2320px middle-copy rebase.
- Reference inputs: None; this is a live interaction defect.
- Docs/contracts read: `workflow.md`; Plan `decision-contract.md`, `core/runtime-boundary.md`; Implementation `component-rules.md`, `renderer-technique.md`; Verification `acceptance-testing.md`.
- Contract rules applied: `interaction-surface-ownership`, `canvas-no-app-ui`, `renderer-technique-inventory`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Canvas still owns carousel browsing. Live position stays interaction state; settled `carousel.scroll` is persisted after idle snap.
- Decision: `preventDefault` horizontal wheel over the rail and add those deltas to logical scroll. Do not write `scrollLeft` or restore snap during the flick. Drop CSS `scroll-snap-type`. Snap and rebase only after 480ms idle. Hide DOM card images while WebGL is live so the hidden track is not composited.
- Alternatives rejected: Keeping native overflow as the trackpad driver, because `scrollend` plus mandatory snap yanks mid-inertia and rebase kills momentum at the cycle boundary; a measured performance iteration, because this is a gesture-ownership defect.
- State/output mapping: Wheel and arrows write logical scroll through refs and `data-scroll-left`. Settled snapped `carousel.scroll` still maps to persistence and still export.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: A vertical-only wheel over the rail is ignored so it cannot steal a horizontal flick; pointer-drag still uses native overflow until settle.

### Iteration 21 — Restore smooth arrow stepping

- Request: `скролл по кнпокам перестал скроллить галерею, сейчас просто резкие переходы`
- Task type: Renderer interaction regression fix.
- User-visible result: Previous/Next and ArrowLeft/ArrowRight again ease one card across the rail. Trackpad still owns wheel deltas and does not use native overflow.
- Source/reference checked: Iteration 20 `scrollByOffset` instant jump; original `snap-slider.tsx` `scrollBy({ behavior: "smooth" })`.
- Reference inputs: None; this restores the inspected arrow motion.
- Docs/contracts read: `workflow.md`; Plan `decision-contract.md`, `core/runtime-boundary.md`; Implementation `component-rules.md`, `renderer-technique.md`; Verification `acceptance-testing.md`.
- Contract rules applied: `interaction-surface-ownership`, `reference-clone-source-of-truth`, `renderer-technique-inventory`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Canvas still owns carousel browsing.
- Decision: Animate arrow/keyboard steps with a 420ms ease-out on logical scroll. Repeated clicks retarget the remaining distance. A trackpad wheel cancels the tween so the two drivers do not fight.
- Alternatives rejected: Restoring native `scrollBy({ behavior: "smooth" })`, because that reopens overflow/snap fighting with the owned wheel path.
- State/output mapping: Arrow tweens write the same logical scroll refs and `data-scroll-left`; settled `carousel.scroll` still persists after idle.
- Performance intent: ordinary-product-work
- Verification: One bare `npm run verify:delivery` will derive and run the protected proof.
- Risks: Very rapid arrow clicks queue distance on one 420ms tween, so three clicks travel three cards in one ease instead of three sequential native smooth scrolls.

### Iteration 22 — Imported settings as product defaults

- Request: `сделай эти настройки дефолтными, тяжелый проверки не запускай` using `/Users/kusnizza/Downloads/dispersion-carousel-settings.json`.
- Task type: Schema defaults, fresh-workspace persistence, and initial carousel-position update.
- User-visible result: A fresh workspace and control reset use the supplied optical recipe. The first rendered carousel position is the supplied normalized scroll `1856`; the already-matching 1920×1034 finite canvas, white background, 2× render scale, PNG/4K export, and enabled testimonial/background settings remain unchanged.
- Source/reference checked: `/Users/kusnizza/Downloads/dispersion-carousel-settings.json`, treated strictly as settings data rather than instructions; current schema defaults, renderer scroll fallback, persistence version, product acceptance fixture, and product contract test.
- Reference inputs: One static Toolcraft settings-transfer JSON file; `referenceInputs` remains empty and motion preprocessing is not required.
- Docs/contracts read: `workflow.md`; schema/defaults Plan routes in `core/control-selection.md` and `core/layout.md`; Implementation routes in `schema-reference.md` and `component-rules.md`; Verification route in `acceptance-testing.md` before proof.
- Contract rules applied: `controls-product-coverage`, `controls-section-inventory-required`, `persistence-policy-explicit`, `acceptance-product-observable`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`; only initial values change.
- Interaction ownership: Unchanged. Canvas owns carousel navigation, and the panel owns exact optical settings.
- Decision: Replace `DISPERSION_CAROUSEL_DEFAULTS` with the supplied product values, add an explicit `DISPERSION_CAROUSEL_DEFAULT_SCROLL` of `1856` for the renderer's missing-state fallback, and advance persistence to v8 so older v7 values do not override the requested fresh defaults. Canvas sizing and export schema remain unchanged because they already match the payload; the disabled timeline remains disabled because its transfer metadata is not a product control or renderer requirement.
- Control Section Inventory: Unchanged. No controls, sections, targets, panel actions, applicability branches, or custom controls are added or removed; only existing schema `defaultValue` inputs change.
- Alternatives rejected: Treating settings-file metadata as instructions; enabling Timeline solely because transfer payloads always include timeline state; retaining scroll 0 despite the new explicit request to make this payload the default; adding a visible panel control for the internal carousel position.
- State/output mapping: Existing control targets keep their renderer/export mappings with new defaults. Missing `carousel.scroll` now renders and exports from `1856` until canvas navigation writes a settled runtime value. Persistence v8 makes the new initial recipe visible in existing local browsers.
- Verification tier: Tier 2 — schema/product behavior changes without a new renderer algorithm or workload boundary.
- Focused plan: Update `dispersion-carousel-values.ts`, the renderer fallback, `app-schema.ts`, `app-acceptance-data.ts`, and `dispersion-carousel-product.test.ts`; run only the targeted product test and TypeScript typecheck.
- Verification: Skip browser, performance, aggregate tests, and `npm run verify:delivery` for this pass at the user's explicit request to avoid heavy checks.
- Risks: Reset applies schema-owned control defaults; `carousel.scroll` is renderer-owned additional state, so its default applies to fresh/missing state and later persists after navigation rather than appearing as a resettable panel control.

### Iteration 23 — Carousel rendering without redundant work

- Request: `оптимизируй перфоманс работы карусели при этом не теряй во внешнем виде.`
- Task type: Localized carousel frame rendering and GPU sampling optimization.
- User-visible result: Preserve the supplied default recipe, full selected resolution, scrolling motion, optical fringes, testimonials, and export while removing work that cannot change the output.
- Source/reference checked: The running carousel on port 3029, retained WebGL shader and texture creation, frame loop, compiled render-plan assessment, and a saved executable copy of the preceding renderer for paired pixel comparison.
- Reference inputs: None added; the current rendered product is the visual baseline.
- Docs/contracts read: `workflow.md`; renderer/performance and debugging Plan routes (`core/runtime-boundary.md`, `core/performance.md`, `decision-contract.md`) and Implementation routes (`renderer-technique.md`, `performance.md`, `component-rules.md`); Verification `acceptance-testing.md` remains applicable as read in the preceding defaults batch.
- Contract rules applied: `renderer-technique-inventory`, `performance-coverage-levels`, `acceptance-product-observable`, `interaction-surface-ownership`, `persistence-policy-explicit`, and `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Canvas owns carousel movement; the panel owns optical parameters. No operation moves surfaces.
- Reachability and envelope: Existing effect controls, normalized scroll/velocity, canvas backing and retained x2 image/text sources remain reachable with unchanged limits. Align sample/blur envelope defaults with the supplied recipe. Assessment has no structural errors; the existing full Canvas 2D/WebGL kernel requirement remains deferred under the user's standing no-heavy-checks constraint.
- Decision: Retain uniform uploads until settings/size/context change; retain the last full-quality frame when position and velocity are identical; skip spectral loops when all vertical samples are provably outside the source; skip text lookups outside a source-derived nontransparent row range with linear-filter padding. Preserve all sampling equations and tap counts.
- Renderer ownership: Move the unchanged shader definitions plus the bounded sampling optimization into `dispersion-carousel-shaders.ts`, keeping resource lifecycle and shader math in focused modules. Register carousel motion as an `animation-frame` preview invalidation and execute its frames through the canonical pipeline client; runtime identity is `dispersion-carousel.renderer@10`.
- Alternatives rejected: Lowering backing density or sample count, precompositing text at source resolution (which changes bilinear interpolation), reducing optical reach, or changing the user's settings.
- State/output mapping: Existing settings, scroll, velocity, source pixels, preview, and deterministic export stay on the same WebGL path. New renderer-local cache state is invalidated on settings, backing resize, context restoration, and export transitions and never becomes workspace state.
- Verification tier: Tier 3; renderer computation and resource lifecycle, with unchanged product controls and output intent.
- Implementation plan: Update `dispersion-carousel-webgl.ts`, source texture metadata in `dispersion-carousel-textures.ts`, accurate pipeline/config metadata and corresponding existing product expectations; preserve direct ownership in `app-verification-impact.json`. Add focused regression proof for cache invalidation and run paired real-GPU pixel comparisons plus a focused real-UI carousel check.
- Performance intent: performance-iteration — Request evidence: "оптимизируй перфоманс работы карусели при этом не теряй во внешнем виде."
- Performance paths: `performance-path:%5B%22interactive-continuous%22%2C%22animation-frame%22%2C%5B%22dispersion-carousel.preview%22%5D%2C%5B%22gpu%22%5D%2C%5B%22edge-blur-radius%22%2C%22lens-samples%22%5D%5D` — derived from the canonical pipeline for canvas-owned carousel motion, not the unrelated export path.
- Verification: The prior instruction `тяжелый проверки не запускай` remains in force. Run focused product tests, typecheck, and local browser/GPU diagnostics; do not run the broad delivery gate, complete performance suite, or full kernel comparison. Diagnostics do not create a protected performance receipt.
- Local development outcome: The focused WebGL/product tests (four assertions-based tests), typecheck, code-health check, and single carousel browser acceptance passed. Paired diagnostic output in `.toolcraft/browser-artifacts/carousel-compare-diagnostic.json` records exact RGBA parity in five modes against the retained previous renderer. The final short browser smoke in `carousel-ui-smoke.json` confirms keyboard movement, selected CSS × DPR × 2 backing, zero idle draws, and no browser/render-plan errors. The interrupted additional high-DPR comparison is not counted as completed evidence. Current preview was visually inspected; independent image-refresh changes were preserved.
- Risks: Browser diagnostics are specific to the current GPU; no complete performance certification is claimed. Pixel parity must pass before accepting shader changes.

### Iteration 24 — Five distinct regenerated editorial photographs

- Request: `перегенерируй все изображения в этом же стиле просто чтобы они выглядели по другому и были по факту другими и разными`
- Task type: Replace the five authored carousel image assets and refresh their derived overview; reference provenance copy follows the explicit redesign of source photographs.
- User-visible result: Five new fictional subjects, activities and environments in the established warm, muted editorial style. Existing brand marks, lower shading, source dimensions and live testimonial layout remain coherent across the series.
- Source/reference checked: All five existing `public/assets/dispersion-carousel/card-*@2x.png` images, the historical `carousel-strip@2x.png`, the card source array and canonical testimonial drawing helper. Each original was inspected before being supplied to imagegen as an art-direction reference.
- Reference inputs: Five static PNG references; exact prompts and generated source mappings are recorded in `docs/image-refresh-prompts.md`. No motion inputs; typed `referenceInputs` stays empty.
- Docs/contracts read: `workflow.md`; Plan `core/setup-export.md`, `core/media-upload.md`; Implementation `schema-reference.md`, `component-rules.md`; Verification `acceptance-testing.md`, `performance.md`. Applied imagegen and local brainstorming, writing-plans and browser workflows.
- Contract rules applied: `reference-clone-source-of-truth`, `output-export-required`, `canvas-surface-preserved`, `acceptance-product-observable`, `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Canvas continues to own carousel browsing; panel controls retain exact optical-property editing. No controls, timeline, layers or duplicate interaction surfaces are added.
- Decision: Generate one independent new photograph per card through the built-in imagegen tool. Normalize generated 1122×1402 images to existing 896×1120 dimensions and preserve each original alpha mask so the 12px CSS corners stay exact. Rebuild the existing overview from new assets and the production testimonial helper. Keep the same URLs and existing direct verification ownership. Mark the changed reference composition as intentionally changed with the exact user request.
- Alternatives rejected: Recoloring the original faces, reusing one new photo five times, changing company identities, baking live testimonials into individual source cards, modifying renderer behavior, or resetting the user's workspace.
- State/output mapping: The existing card array loads the new PNG bytes into accessible DOM images, retained WebGL image textures and deterministic PNG/JPG output. Existing values, schema, settings transfer, persistence v8, renderer pipeline and workload dimensions remain unchanged.
- Verification tier: Tier 3 — source pixels used by preview and still export; no renderer algorithm or workload-boundary change. Focused plan is `docs/image-refresh-plan.md`.
- Performance intent: ordinary-product-work
- Verification: Keep one bare `npm run verify:delivery` deferred under the user's standing `тяжелый проверки не запускай` instruction recorded in iterations 22–23. Use focused asset and real-browser diagnostics only; these do not create or upgrade a protected receipt.
- Risks: Generated photographs depict fictional people. 8K export still upscales the fixed x2 source assets. Original card files and overview are preserved under `.toolcraft/asset-backups/2026-09-08-image-refresh/` for rollback.

### Iteration 25 — Meaningful copy with matching text volume

- Request: `поменяй все текста сохраняя объем текста. напиши осмысленные текста`
- Task type: Composition copy refresh, including matching export heading strings and existing text expectations.
- User-visible result: A new two-line headline and five distinct, coherent paragraphs about turning research and customer insight into practical work. English, type metrics and original text-block heights are preserved.
- Source/reference checked: Current headline, all five live paragraphs, the original 3/3/4/4/3 wrapped line counts measured in the actual Figtree font, current title width, and the exporter's separate two-line heading literals.
- Reference inputs: Current static product composition only; no motion inputs. No image generation or photography changes for this batch.
- Docs/contracts read: `workflow.md` rechecked; copy/export Plan (`core/setup-export.md`, `core/media-upload.md`), Implementation (`schema-reference.md`, `component-rules.md`) and Verification (`acceptance-testing.md`, `performance.md`) reused from the full reads earlier in this session. Local brainstorming/writing-plans and browser workflows remain applicable.
- Contract rules applied: `reference-clone-source-of-truth`, `acceptance-product-observable`, `output-export-required`, `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Canvas still owns carousel browsing; panel owns optical settings. Controls, timeline, layers, persistence and settings transfer are unchanged.
- Decision: Replace the headline and all five paragraphs; keep each paragraph within 3% of its previous character count and preserve every line count. Update both export heading literals to the browser's measured line break. Rebuild the overview with the canonical production text helper and update the existing exact-content expectations.
- Alternatives rejected: Repetitive marketing claims, fabricated numeric results, translation that changes the composition language, shortening all cards to one sentence of equal length, font-size changes or added line-height adjustments.
- State/output mapping: The canonical title and card array feed the DOM, retained text texture and clean text layer. The exporter uses matching two-line heading copy and the same testimonial helper. Existing impact owners cover every touched production module and derived overview.
- Verification tier: Tier 0 — copy only; focused browser text-fitting check required. Plan: `docs/copy-refresh-plan.md`.
- Performance intent: ordinary-product-work
- Verification: Keep bare `npm run verify:delivery` and heavy suites deferred under the user's standing `тяжелый проверки не запускай` instruction. Run the existing focused product contract test and real-browser copy/line-fit diagnostics; these do not create a protected receipt.
- Risks: These are authored illustrative statements, not sourced customer quotations. The copy intentionally supersedes the historical Figma strings, while keeping their typography and text volume.

### Iteration 26 — Mouse drag navigation

- Request: `сделай чтобы можно было мышкой тоже драгать карусель`
- Task type: Canvas-owned carousel input behavior.
- User-visible result: Primary-button mouse dragging moves the rail directly, including seamless wrap; pointer capture continues outside the rail, release settles to a card, and grab/grabbing cursors communicate the gesture.
- Source/reference checked: Current rail input handlers, scroll publishing, velocity frame loop, runtime canvas pointer ownership, acceptance and pipeline declarations. Preserve independent image and copy refreshes.
- Reference inputs: None added.
- Docs/contracts read: `workflow.md`; renderer route Plan `core/runtime-boundary.md`, `core/performance.md`; Implementation `renderer-technique.md`, `performance.md`; Verification `acceptance-testing.md`. Local brainstorming, writing-plans and browser skills apply.
- Contract rules applied: `interaction-surface-ownership`, `canvas-surface-preserved`, `acceptance-product-observable`, `performance-coverage-levels`, `persistence-policy-explicit`, `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Canvas remains the sole owner of browsing; the requested mouse input complements its arrows, touch and wheel. No duplicate panel operation or new control section.
- Decision: Add a focused navigation module for pointer lifecycle and existing navigation math. Feed logical drag deltas into the existing retained full-quality animation-frame preview path, accounting for canvas zoom. Cancel prior arrow motion/settle on grab and defer snapping until release/cancel. Preserve native touch input, non-primary buttons, sources, shaders, output quality, timeline/layer choices, export and settings transfer.
- Integration decisions: Ignore asynchronous rounded native scroll echoes while the mouse owns the precise logical position. Scope grab/grabbing cursor overrides to the product rail and its descendants because the runtime theme supplies an important default cursor. No runtime styles or event handlers are edited.
- Alternatives rejected: Native HTML image drag, per-pointer React state, snapping while held, lowering resolution, and another slider/panel navigation control.
- State/output mapping: Transient mouse ownership supplies the existing logical scroll/velocity renderer input; release uses the existing `controls.setValue` persistence path. Gesture-local capture state is disposed with its listeners and never enters workspace settings.
- Performance intent: ordinary-product-work
- Performance assessment: Reuses the declared `carousel.scroll` animation-frame preview path, retained source resources and unchanged workload envelope. The current assessment has no structural errors; pending kernel comparison stays deferred for functional work. This request authorizes no measured performance run.
- Verification tier: Tier 3
- Reason: Carousel input and renderer scheduling integration; no shader or export algorithm changes.
- Run: Focused navigation/product unit tests, typecheck, code health and one carousel browser acceptance covering mouse drag, wrap, release/capture, unchanged backing and existing keyboard navigation.
- Skip: Aggregate delivery, full browser/performance and export matrices under the standing `тяжелый проверки не запускай` constraint. A bare `npm run verify:delivery` would derive protected proof but remains deferred; focused checks do not mint a delivery receipt.
- Implementation plan: Add `dispersion-carousel-navigation.ts` and focused tests; integrate its listeners into `dispersion-carousel-renderer.tsx`, add local cursor styling, update existing carousel acceptance/readiness and exact impact ownership, and extend `e2e/product-carousel.spec.ts`.
- Verification: One coherent functional batch; only targeted development proof while the user's no-heavy-checks instruction remains active.
- Risks: Native touch remains browser-owned; mouse cancellation and zoom-coordinate scaling require explicit regression coverage.

### Iteration 27 — Preserve the mouse release position

- Request: `при драге мышкой есть отскок после прокрутки слайдера`
- Task type: Localized mouse-release navigation regression, not a rendering-performance complaint.
- User-visible result: Releasing a mouse drag keeps the exact chosen position instead of rebounding to a nearby card after the idle delay. Arrow/keyboard stepping and native wheel/touch behavior stay intact.
- Source/reference checked: Reproduced a partial mouse drag in the running app; inspected the `onEnd -> scheduleSettle -> snapCarouselScroll` call chain and delayed programmatic native scroll events.
- Reference inputs: None added.
- Docs/contracts read: `workflow.md`; debugging and renderer Plan `decision-contract.md`, `core/runtime-boundary.md`, `core/performance.md`; Implementation `component-rules.md`, `renderer-technique.md`, `performance.md`; Verification `acceptance-testing.md`. Local systematic-debugging, brainstorming, writing-plans and browser skills apply.
- Contract rules applied: `interaction-surface-ownership`, `acceptance-product-observable`, `persistence-policy-explicit`, `performance-coverage-levels`, `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: The canvas retains navigation ownership; no new control, section, panel, layer or timeline.
- Decision: Persist the mouse release/cancel position without running the wheel snap timer. Track the last observed native scroll position so asynchronous programmatic echoes cannot schedule a delayed snap after release or overwrite subpixel logical movement.
- Complementary navigation: From a freely dragged position, arrows tween directly to the adjacent card boundary instead of adding a full pitch and then correcting it with a second snap. Existing on-boundary stepping and unwrapped seam direction are preserved.
- Alternatives rejected: Merely delaying the snap, smoothing the backward correction, lowering shader quality, or changing the wheel/arrow behavior outside the reported mouse gesture.
- State/output mapping: Live mouse deltas still feed the existing retained animation-frame preview. Release writes the current normalized position through `controls.setValue`; current workspace persistence and exports consume it without a forced card alignment.
- Performance intent: ordinary-product-work
- Performance assessment: Inputs, envelope, backing density, retained resources and canonical preview path are unchanged; remove unnecessary post-drag position mutation. Pending kernel requirements remain deferred during functional work.
- Verification tier: Tier 3
- Reason: Input ownership, release scheduling and persisted renderer position; no shader or export changes.
- Implementation plan: Adjust release/native-echo handling in `dispersion-carousel-renderer.tsx` and adjacent-card targeting in the existing navigation module; update the existing carousel acceptance intent and browser regression to assert stable release position in both directions, across the seam and after reload. Existing ownership entries already cover these modules.
- Run: Focused navigation/product unit tests, typecheck and the single carousel functional browser test on a free test port.
- Skip: Heavy aggregate delivery, full browser/export/performance matrices under the standing no-heavy-checks instruction.
- Verification: One bare `npm run verify:delivery` would derive protected functional proof; it remains deferred by the user's constraint. Focused checks are development evidence, not a delivery/performance receipt.
- Risks: Native touch/wheel retain their existing idle snap; only primary-button mouse release changes semantics.

### Iteration 28 — Navigation button outline and hover

- Request: `сделай обводку кнопкам black/10. по ховеру появляется курсор поинетр и небольшая тень`
- Task type: Local navigation-button presentation.
- User-visible result: Both circular arrow buttons have a black 10% outline; hover shows a pointer across the button and chevron, plus a subtle shadow.
- Source/reference checked: Supplied screenshot of the two carousel arrows and the current navigation CSS. The existing runtime cursor reset is accounted for with product-local selectors.
- Reference inputs: Static screenshot `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-7c422db1-99c4-4c07-a62d-dcf55b48779a.png`; no motion input.
- Docs/contracts read: `workflow.md`; controls-presentation Plan `core/control-selection.md`, `core/layout.md`; Implementation `schema-reference.md`, `component-rules.md`; Verification `acceptance-testing.md`. Local brainstorming, writing-plans and browser skills apply.
- Contract rules applied: `interaction-surface-ownership`, `controls-component-layout-invariants`, `acceptance-product-observable`, `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: Existing canvas-owned previous/next buttons; no new controls, schema sections or duplicate panel operation.
- Decision: A 1px `rgb(0 0 0 / 10%)` button border and a small `0 2px 5px` black 8% hover shadow. Preserve button dimensions, capsule, focus outline, existing hover scale and navigation behavior. Override the theme's default cursor only on enabled hovered product buttons and their chevrons.
- Alternatives rejected: Restyling the surrounding capsule or all runtime buttons, stronger shadows, changing navigation handlers or shader output.
- State/output mapping: Presentation-only CSS; runtime values, renderer pipeline, settings transfer, persistence, layers, timeline and export remain unchanged. Existing impact ownership covers the stylesheet.
- Performance intent: ordinary-product-work
- Verification tier: Tier 1
- Reason: One navigation control group changes border and hover presentation, with no state or renderer changes.
- Implementation plan: Edit `dispersion-carousel-renderer.module.css`; add a focused browser check for both button states, chevron cursor and preserved dimensions; retain the existing product contract unit check.
- Run: Focused product unit test and button-only real-browser verification.
- Skip: Aggregate delivery, full browser/export/performance matrices; not needed for Tier 1 and the standing no-heavy-checks constraint remains active.
- Verification: Focused local presentation proof only; no broad protected delivery or measured performance receipt is claimed.
- Risks: The runtime enforces an important default cursor, so the hover selector must remain local but more specific; disabled buttons retain their existing styling.

### Iteration 29 — Dia drag recovery and delayed-scroll release protection

- Request: `вот в диа не работает драг карусели`; follow-up: `рабоатет но есть отскок после драга`.
- Task type: Carousel input regression, continued as one delivery batch.
- User-visible result: Restore the local server and keep the exact mouse-release position when a late native scroll notification arrives.
- Source/reference checked: Running Dia tab at `http://127.0.0.1:3029/`, native pointer logs, current mouse binding and scroll/settle effect. User confirmed drag works after server restart and reload, but release still bounces. A focused browser regression reproduced a late one-pixel native adjustment changing released position 2029 back to 1856 through the idle snap. No browser-emulation cause is asserted.
- Reference inputs: None; live behavior report only.
- Docs/contracts read: `workflow.md`; Plan `decision-contract.md`, `core/runtime-boundary.md`, `core/performance.md`; Implementation `component-rules.md`, `renderer-technique.md`, `performance.md`; Verification `acceptance-testing.md`, `performance.md`. Local systematic-debugging, writing-plans and browser skills apply.
- Contract rules applied: `interaction-surface-ownership`, `canvas-surface-preserved`, `acceptance-product-observable`, `persistence-policy-explicit`, `workflow-required`.
- View interaction intent: Remains `non-spatial`.
- Interaction ownership: The canvas rail still owns navigation. Mouse input owns its released position until a new wheel/touch/native gesture explicitly takes over; late scroll notifications alone cannot claim ownership.
- Decision: Guard the remaining native-scroll-to-idle-snap route after mouse input. Keep the owner in a ref across persistence rerenders. Re-enable native scrolling on real wheel/touch input; keep arrow targeting and native idle alignment unchanged. Retain the React wheel capture boundary that prevents the canvas host from taking the product's wheel gesture; block wheel motion during an active mouse drag.
- Alternatives rejected: Another time-based suppression delay, broad removal of wheel/touch snapping, browser preference changes, renderer quality reductions, and edits to signed runtime files.
- State/output mapping: Mouse deltas update the retained preview; release persists normalized `carousel.scroll` through the runtime command bus. Schema, panels, settings transfer, still export, timeline and layers remain unchanged.
- Performance intent: ordinary-product-work
- Performance assessment: Existing reachable inputs, workload dimensions, pass frequency/lifecycle, full-quality backing and canonical pipeline registration remain unchanged. No measured performance authority is created; pending kernel work stays deferred.
- Verification tier: Tier 3
- Reason: Input ownership and scheduling affect rendered position, with no shader or state-shape change.
- Implementation plan: Add a failing late-native-scroll regression in `e2e/app-controls.spec.ts`, fix ownership in `dispersion-carousel-renderer.tsx`, then run focused navigation/product unit checks, typecheck and the release-only browser test. Existing impact inventory already owns the renderer and `carousel.scroll` acceptance.
- Run: Focused unit tests, typecheck, one release-regression browser check and a Dia user check.
- Skip: Heavy aggregate delivery, full browser/export/performance matrices under the standing no-heavy-checks instruction.
- Verification: One bare `npm run verify:delivery` would derive protected functional proof; it remains deferred by the user constraint. Focused diagnosis/verification does not claim a protected receipt or measured performance result.
- Risks: Dia-specific event timing is not reproducible through the available desktop drag automation consistently; retain a deterministic delayed-notification regression and explicit user verification.


### Template release repair — 2026-09-09

- Change ID: template-release-2026-09-09
- Entry type: focused
- Request: Make every gallery app cloneable through the published Toolcraft CLI and verify installation/startup.
- Changed owner: Upstream example snapshot packaging, integrity restoration, and public distribution metadata.
- User-visible result: The `aura-carousel` template is admitted as a complete standalone snapshot; original framework hashes remain authoritative. Canonical identity regeneration, where needed, uses the upstream identity generator.
- Verification: Source template admission passed. Published dependency installation and browser startup results are recorded in the upstream `docs/template-release-report.md`; these smoke checks do not claim renderer or export certification.
- Risks: Historical templates retain their original runtime and workflow versions.

## Decisions

### Renderer

- Decision: Use a mixed retained renderer: exact DOM heading, three equivalent copies of canonical DOM card components for endless native navigation, one custom screen-space WebGL dispersion pass over a single wrapped image/testimonial cycle, an optional repeated clean DOM testimonial track, and a Canvas 2D still exporter.
- Reason: A stationary viewport-anchored effect field with content translating underneath is only expressible as a screen-space pass; the three-copy DOM rail keeps hit geometry and accessibility, while trackpad/wheel writes logical scroll directly into the WebGL pass. CSS mandatory snap is gone because it fights inertial wheel bursts; arrows, keyboard, and idle settle still land on the 448px card pitch.
- Evidence: The compiled `dispersion-carousel.renderer@10` pipeline owns `dispersion-carousel.preview` and `dispersion-carousel.image-export`; the rail canvas holds CSS × devicePixelRatio × selected-scale backing, while one 2320px texture cycle repeats beneath the default 1920×1034 crop.

### View Interaction

- Decision: Declare `non-spatial`.
- Reason: No editable 3D scene or camera exists.
- Evidence: Product readiness contains no orientation targets and the renderer exposes only two-dimensional carousel navigation.

### Interaction Ownership

- Decision: Canvas owns carousel navigation; panel owns edge-zone and shader properties.
- Reason: The carousel places endless previous/next, captured free-position mouse drag, native touch/horizontal scroll and keyboard browsing on the visible rail. Mouse release retains position while wheel and keyboard keep card alignment; exact persistent numerical tuning belongs in built-in Toolcraft controls.
- Evidence: Typed readiness maps normalized `carousel.scroll` to the canvas and `edgeZone.width`, `auraGate.offset`, plus the dispersion properties to the panel with explicit alternate-surface reasons.

### Timeline

- Decision: Omit Timeline.
- Reason: The carousel has user-driven scrolling but no time-based product animation or video export.
- Evidence: `animationIntent.mode` is `none` and `panels.timeline` is absent.

### Layers

- Decision: Omit Layers.
- Reason: The five authored cards form one fixed reference composition and the user did not request item editing or layer management.
- Evidence: `panels.layers` is absent; card cardinality and order come from inspected source/Figma evidence.

### Controls

- Decision: Split the stationary edge entity into Edge Zone (field envelope) and Edge Warp (amount, style, offset, wave, and Prism-only face controls); keep one single-switch Card Content section, one seven-slider Dispersion & Aura section, and one four-slider Boundary Aura section; retain standard Background and Image Export sections.
- Reason: Offset and wave pushed the same edge entity past ten controls, so the field and warp stages stay one entity with unique workflow stages instead of inventing a second product object.
- Evidence: `appControlSectionInventory` maps every target once; both split sections keep `entityId` `dispersion-edge-zone`, and Edge Warp declares semantic groups because it now has ten controls.

### Export

- Decision: Provide Toolcraft still-image export only; carousel navigation chrome is an editing handle and is excluded from the artifact.
- Reason: A sandbox needs a reusable current-frame result, while no animation/video delivery was requested.
- Evidence: Product readiness declares image `toolcraft-default` and video `not-requested`; the shared renderer draws the current crop, 160px vertical padding, scroll position, white default background, 12px rounded cards, title, and the selected clean-or-dispersed testimonial composition.

### Performance

- Decision: Retain one WebGL rail canvas plus one wrapped image-cycle texture and one wrapped transparent testimonial-cycle texture, use three lightweight DOM copies only for endless interaction, change only uniforms while interacting, early-exit to a single tap outside the edge zones, stop the velocity loop at rest, and model defocus radius, sample count, and image long edge as workload dimensions.
- Reason: Fragment cost grows linearly with the bounded 48-tap loop and quadratically with still pixels to 8K, while the clean center and idle rail cost almost nothing; scrolling reuses every retained resource without shader recompilation.
- Evidence: `app-performance.ts` derives canonical paths from the registered pipeline, includes bounded blur and sample fixtures plus exhaustive 2K/4K/8K output fixtures, and preserves exact CSS × devicePixelRatio × selected scale backing. Any protected kernel requirement remains pending during ordinary functional delivery as required.

## Evidence

- Reviewed files: `/Users/kusnizza/Desktop/Wireframes Aug 12 2026/src/components/ui/snap-slider.tsx`, `/Users/kusnizza/Desktop/Wireframes Aug 12 2026/src/components/pages/home/features-cards--slider-column.tsx`, and the previous Paper-based composite that iteration 4 replaced.
- Reviewed references: Figma `BZvXRLFX2bR57Gza4vhyxI` node `6737:6662`, both supplied dispersion PNGs, and the restored original at `localhost:3000`.
- Contract evidence: `reference-clone-source-of-truth`, `interaction-surface-ownership`, `renderer-technique-inventory`, `controls-section-inventory-required`, `output-export-required`, `persistence-policy-explicit`, and `performance-coverage-levels` are mapped in readiness, acceptance, the canonical renderer pipeline, and verification impact inventory.

## Verification

Protected delivery receipts own the immutable plan, selected checks, production build, browser evidence, and pass/fail result. This worklog records the intended first functional delivery and does not claim measured performance.

## Risks

- Risk: 8K still output exceeds the native pixels in the supplied x2 strip and therefore upscales those sources.
- Risk: Per-pixel stratified jitter is intentional grain; exact pixel values vary across GPU vendors while layout, zone geometry, center cleanliness, and visible smear direction remain deterministic.
- Risk: The additive aura is most visible on dark backgrounds; on the default white background it reads as a soft brightening of the dispersed edges.
