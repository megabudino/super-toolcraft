# Implementation Worklog

## Status

Mode: product

## Decision Trail

### Iteration 1 — Studio Room live preview

- Request: Create a standalone Studio Room Toolcraft app that embeds the real website section and synchronizes the editable Canvas height live, with no Apply or persistence command.
- Task type: New Toolcraft product, generated-app assembly, fixed website-section preview, and editable finite canvas sizing.
- User-visible result: The Toolcraft canvas embeds the real Studio Room website route at 1920 by 1080 and sends the current Canvas height after the iframe reports ready.
- Source/reference checked: The existing generated Toolcraft shell, the website-owned Studio Room preview protocol and route, and the approved Studio Room setup spec and plan.
- Reference inputs: None; the current website implementation is the rendered source of truth and no motion reference was supplied.
- Docs/contracts read: `AGENTS.md`, `workflow.md`, `decision-contract.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`.
- Contract rules applied: Signed runtime-shell preservation, product-only `canvasContent`, editable-output sizing, exact scene bounds, fixed-camera evidence, no product actions, no product controls, no artifact export, one canonical renderer pipeline, and explicit local workspace persistence.
- View interaction intent: `fixed-camera`; the inspected website section has fixed framing and no requested spatial camera editing.
- Interaction ownership: None; Studio Room exposes no product property controls, canvas handles, or publication commands. Runtime-owned Canvas sizing remains standard editor behavior.
- Decision: Keep the website as the only visual renderer, attach the listener before mounting the iframe, never post before protocol-v1 `ready`, and preserve ready-before-load state so load and subsequent height edits stay synchronized.
- Alternatives rejected: Rebuilding the section in Toolcraft, adding Apply or repository persistence, adding product controls, allowing uploads, adding layers or timeline, and adding image, SVG, or video export.
- State/output mapping: `state.canvas.size.height` maps to the strict one-key versioned settings message and the website-owned section height; `state.canvas.size` also supplies the exact product scene bounds. Load-before-ready remains silent, while ready-before-load keeps readiness for the load replay and every subsequent height edit.
- Performance intent: ordinary-product-work; no measured performance was requested or run.
- Verification: Focused product Vitest, code-health, typecheck, local docs check, formatting, scoped diff check, and the single Canvas-height browser case only. Delivery, build, the remaining browser matrix, and measured performance checks are intentionally outside this iteration.
- Risks: The website server must be available at `http://localhost:3000`, and Toolcraft and the website must keep protocol version 1 compatible.

### Iteration 2 — Configurable room effect

- Request: Implement the approved Studio Room effect-controls plan with two grids, configurable room geometry and motion, a directional depth trail, per-tile shuffle, uploaded tile images, and local Apply.
- Task type: Existing Toolcraft product expansion and website-renderer refactor; core functionality with only the necessary checks by explicit user decision.
- User-visible result: Toolcraft now exposes Room, Main Grid, Fine Grid, Tiles, Tile Images, Motion, and Depth Trail controls; the real website preview updates live, accepts up to 12 images, and Apply writes settings for the standalone site.
- Source/reference checked: The existing website `pre-footer-room.tsx`, the Fine Details iframe/media/Apply implementation, the Studio Room v1 bridge, and `2026-08-25-studio-room-effect-controls.md`.
- Reference inputs: None; the existing Studio Room website renderer is the visual baseline.
- Docs/contracts read: `AGENTS.md`, `workflow.md`, `decision-contract.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `layout.md`, `performance.md`, `timeline-animation.md`, `setup-export.md`, `media-upload.md`, and `acceptance-testing.md`.
- Contract rules applied: Generated-app shell preservation, website-owned DOM renderer, editable-output sizing, built-in controls only, fileDrop media admission, autonomous animation intent without Timeline transport, standard Controls-header Reset, one sticky Apply command, runtime-only uploaded media, and no artifact export.
- View interaction intent: `fixed-camera`; pointer movement changes the website-owned room effect transiently but does not author or orbit a camera.
- Interaction ownership: Global panel property edits own all authored room settings; Tile Images owns upload, order, transform, remove, and reset lifecycle; the website preview owns transient pointer parallax/hover/trail behavior; the Controls header owns Reset and the sticky Website action owns Apply.
- Decision: Keep one canonical website renderer, upgrade the iframe contract to protocol v2, send display-sized media derivatives at most once per active ref, and persist only serializable settings while stripping runtime image refs from the standalone applied file.
- Alternatives rejected: Duplicating the room renderer inside Toolcraft, rebuilding the effect in WebGL, adding Layers or Timeline, persisting uploaded blobs into the repository, adding artifact export, and running the full delivery/performance matrices.
- State/output mapping: Toolcraft targets under `room.*`, `grid.*`, `fineGrid.*`, `tiles.*`, `motion.*`, and `trail.*` map to the strict v2 settings payload; `tiles.images` maps ordered image assets to at-most-1024px transformed media blobs; Canvas height maps to section height; Apply maps to the local website PUT route.
- Performance intent: Core functional delivery only. Geometry is derived from settings, trail DOM stays stable, only one tile changes per interval, media derivatives and object URLs are cached/revoked, and disabled/reduced motion unmounts the trail rAF loop. No measured performance run was authorized.
- Verification: Focused website helper/settings/protocol/media tests, focused Toolcraft values/schema/product tests, Toolcraft typecheck and `ai:check`, one browser smoke, focused formatting, and `git diff --check`; no `verify:delivery`, full browser matrix, export matrix, or performance audit.
- Risks: The website preview must run on port 3000; uploaded media remains preview-only and Apply intentionally falls back to the author image set on the standalone site; light verification leaves additional visual regression review to the user.

### Iteration 3 — Studio Room geometry, wall border, and density

- Request: Fix detached room-grid endpoints, add independent wall-border width and color controls, widen tile density to one through six per surface, and ensure tiles never share edges.
- Task type: Existing Toolcraft product geometry, settings protocol, control-record, and website-renderer behavior update.
- User-visible result: Room lines terminate cleanly at the terminal wall under motion; the wall outline thickness and color update independently; increasing Per surface changes density without edge-sharing tiles, with fewer tiles intentionally possible on coarse grids.
- Source/reference checked: The website `pre-footer-room.tsx` renderer and motion helpers, the Toolcraft Studio Room settings/protocol/schema records, and the approved geometry-and-density design and implementation plan.
- Reference inputs: None; the existing website Studio Room renderer is the visual source of truth and no motion reference was supplied.
- Docs/contracts read: `AGENTS.md`, `workflow.md`, `acceptance-testing.md`, the approved geometry-and-density design, and its implementation plan.
- Contract rules applied: Product-only external preview, built-in slider and colorOpacity controls, global panel property ownership, one control-section entity for the room terminal face, product-output acceptance, and focused later-feature verification only.
- View interaction intent: `fixed-camera`; the website preview keeps its inspected fixed framing while visitor pointer response remains transient and non-authoring.
- Interaction ownership: The Room panel owns global `room.wallBorder.width` and `room.wallBorder.colorOpacity` property edits because the user requested precise persistent non-spatial styling; canvas alternatives would add or duplicate editor chrome over website output. The website canvas retains transient pointer motion, Tile Images retains media lifecycle, and Apply retains publication.
- Decision: Resolve the three inconsistent unit systems—grid endpoints in viewBox units, wall transforms in `vw`/`svh`/px, and unrelated rounded-corner radii—with one grid-offset source, overshoot line endpoints under an opaque wall, and one shared radius constant; upgrade protocol v2 → v3; use independent wallBorder controls; allow `perSurface` one through six; reject every shared tile edge and downgrade an occupied swept slide path to swap.
- Alternatives rejected: An inverted rounded-rect clipPath would introduce a second radius consumer; per-line arc trimming requires fragile trigonometry; a vw correction factor still breaks on off-viewport stages.
- State/output mapping: `room.wallBorder.width` and `room.wallBorder.colorOpacity` map through the strict v3 settings payload to the terminal-wall outline; shared grid offsets map to both wall translation and line endpoints; `tiles.perSurface` maps to non-adjacent placement count and a swept slide falls back to swap when its path would touch an occupied tile.
- Performance intent: Ordinary product work with no measured performance. Adjacency filtering is O(cells × tiles) only on shuffle ticks.
- Verification: Focused website settings, motion, and boundary tests; focused Toolcraft values and product tests; formatting and diff checks. No browser, build, delivery, or performance suite ran by explicit request.
- Risks: A stale preview tab needs reload after the protocol bump; coarse grids at high density intentionally place fewer tiles; a manual visual sweep was not run in this focused pass.

### Iteration 4 — Studio Room inner grid continuation

- Request: Add a switchable Main Grid continuation inside the Studio Room back-wall panel with configurable inward depth, exponent falloff, and layer opacity, then connect it through Toolcraft records and the strict website bridge.
- Task type: Existing Toolcraft product settings, schema, protocol, pipeline, performance, acceptance-record, and website protocol-boundary update.
- User-visible result: An Inner Grid section after Room exposes Active, Depth, Falloff, and Opacity; Apply persists the nested settings while the website-owned panel renders the continuation and inherits Main Grid color, thickness, columns, and rows without continuing the Fine Grid.
- Source/reference checked: The approved Studio Room inner-grid design and implementation plan, current Toolcraft Studio Room values/schema/protocol/pipeline/records, and the concurrent website settings normalizer and inner-grid renderer implementation.
- Reference inputs: None; the existing room geometry and approved panel-continuation design are the visual and mathematical references.
- Docs/contracts read: The approved `2026-08-25-studio-room-inner-grid-design.md` and `2026-08-25-studio-room-inner-grid.md` implementation plan plus the established Studio Room schema, pipeline, performance, acceptance, and worklog conventions.
- Contract rules applied: Built-in switch and conditional sliders only, global panel property ownership, nested strict settings validation, a version-matched iframe handshake, existing Apply persistence, no new Apply/Reset UI, no Tile Images cap, and focused automated verification only.
- View interaction intent: `fixed-camera`; the continuation is an authored panel layer while existing website pointer motion remains transient and non-authoring.
- Interaction ownership: The Inner Grid panel owns the four global property edits because they require precise persistent values; canvas alternatives would add editor chrome over the website-owned output.
- Decision: Anchor vertical and horizontal continuation lines to the panel at the same `i / columns` and `j / rows` fractions as the outer Main Grid for structurally seamless joins; fade them using four edge gradients with exponent-shaped stops so the visible alpha follows distance to the nearest edge; extend the room normalizer whitelist with `innerGrid`; and upgrade both bridge endpoints from protocol v5 to v6.
- Alternatives rejected: Drawing an outer grid clipped into the panel because independently moving layers can detach; CSS background grids because inherited thickness/color and subpixel fraction alignment are weaker; continuing the Fine Grid because it adds unrequested density and controls; and a radial mask because it measures from the center instead of the nearest panel edge.
- State/output mapping: Toolcraft targets `room.innerGrid.enabled`, `room.innerGrid.depth`, `room.innerGrid.falloff`, and `room.innerGrid.opacity` normalize into the strict nested v6 payload; the website combines those values with Main Grid columns, rows, color, and thickness, and existing Apply persists the complete settings object.
- Performance intent: Ordinary product work with no measured performance run. The continuation uses at most `(columns - 1) + (rows - 1)` static SVG lines and re-renders only on a committed settings update.
- Verification: `./node_modules/.bin/vitest run src/app/studio-room-values.test.ts src/app/studio-room-preview.product.test.ts src/app/app-schema.test.ts --reporter=default` passed 13/13 tests; `node --import ./scripts/register-test-hooks.mjs --import tsx --test src/components/pages/home/studio-room-preview-boundary.test.ts` passed 3/3 tests; scoped `oxfmt` and `git diff --check` covered only the touched Task 5 and website protocol-boundary files. No typecheck, build, browser, manual, broad suite, delivery, or measured performance check ran.
- Risks: A stale preview tab must reload for the v6 handshake; the renderer and normalizer landed concurrently in website-owned files; visual alignment and tuning were not manually inspected in this focused Task 5 pass.

## Decisions

### Renderer

- Decision: Use a DOM iframe rendering the dedicated website preview route.
- Reason: The website component remains the single visual implementation.
- Evidence: `canvasContent` mounts `StudioRoomExternalPreview`, and the compiled renderer pipeline contains one constant-cost `preview-sync` pass.

### View Interaction

- Decision: Use `fixed-camera`.
- Reason: Studio Room is a flat website composition with no requested orbit, camera timeline, or direct spatial edit.
- Evidence: Product readiness records inspected-reference fixed framing and the schema has no orientation target.

### Interaction Ownership

- Decision: Panel controls own authored global room properties, including independent wall-border styling; Tile Images owns media lifecycle, the website canvas owns transient pointer response, and Apply owns local website persistence.
- Reason: Authored settings need one stable panel surface while parallax, hover, and trail remain visitor interactions rather than persisted camera state.
- Evidence: `interactionOwnership`, the populated section inventory, the wall-border panel targets, the fileDrop target, and the v3 settings/media/save bridge declare these separate operations.

### Timeline

- Decision: No timeline.
- Reason: No animation authoring or transport was requested.
- Evidence: `panels.timeline` is omitted and animation intent is `none`.

### Layers

- Decision: No Layers panel.
- Reason: The section remains one website-owned composition.
- Evidence: `panels.layers` is omitted.

### Controls

- Decision: Use seven built-in control sections plus Tile Images and one Website Apply action; Room includes independent wall-border width/color controls, Tiles includes non-adjacent density, and the standard Controls-header owns Reset.
- Reason: The approved plan exposes the room terminal face, two grids, tile behavior, motion, and trail settings without custom control chrome.
- Evidence: `app-schema.ts` maps every target to a built-in slider, switch, color, colorOpacity, vector, segmented, or fileDrop control, and the sticky action contains Apply only.

### Export

- Decision: No image, SVG, or video artifact export.
- Reason: Toolcraft previews the real website section instead of duplicating its renderer.
- Evidence: Product readiness marks image export user-removed and SVG/video not requested.

### Performance

- Decision: Model separate settings and media sync passes; keep the website renderer DOM/SVG-based with stable trail groups, non-adjacent tile placement, and one-tile-at-a-time updates.
- Reason: Numeric edits stay compact while uploaded media requires bounded derivative work and adjacency filtering runs only when a tile shuffle is selected.
- Evidence: The v3 pipeline declares control and media invalidations, media derivatives are capped at 1024px, adjacency filtering is O(cells × tiles) on shuffle ticks only, stale cache entries are removed, and no measured performance was requested or run.

## Evidence

- Source reviewed: Website Studio Room protocol/preview route, generated Toolcraft shell, and approved local spec/plan.
- Contract applied: Product mode, fixed-camera evidence, external DOM preview, exact finite scene bounds, local workspace persistence, and explicit no-export behavior.

## Verification

Focused checks cover Studio Room schema, strict ready/settings protocol, ready-gated height sync, scene bounds, pipeline structure, code health, types, docs, formatting, and whitespace. The exact browser case `browser: Canvas height resizes the real Recraft Studio Room` passed 1/1 and proved the real Toolcraft height control resizes the website-owned iframe section to 1200px. No delivery receipt, build, remaining browser matrix, or measured performance evidence was produced.

## Risks

- Risk: The local website route must run on port 3000 for the iframe preview.
- Risk: Cross-origin isolation intentionally limits Toolcraft to the versioned message boundary.
- Risk: Infinity/reload browser acceptance and first-delivery proof remain unexecuted by explicit scope.
