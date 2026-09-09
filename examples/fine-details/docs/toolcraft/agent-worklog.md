# Toolcraft agent worklog

Active change: template-release-2026-09-09

## Product mode

- Mode: product
- Product: Recraft Fine Details, native standalone application.
- Purpose: Run the unchanged website section directly in an independent Toolcraft app.
- Historical decisions: docs/reference/original-toolcraft-worklog.md preserves the previous worklog.

## Decision Trail

### Release preparation 2026-09-09 — Lossless font consolidation

- Request: Prepare all current apps for release on docs-new; merge only after the user's later instruction.
- Task type: Existing-product release preparation with focused packaging and browser checks.
- User-visible result: Recraft Playground keeps the same typography and imagery with 1,109,592 fewer duplicate font bytes in its production package.
- Source/reference checked: Current product CSS, both font directories, SHA-256 manifests, runtime media lifecycle, and fresh production output.
- Reference inputs: Current local app and its existing assets; no new external visual reference.
- Docs/contracts read: AGENTS.md, workflow.md, core/setup-export.md, core/media-upload.md, schema-reference.md, component-rules.md, acceptance-testing.md, performance.md, and core/performance.md.
- Contract rules applied: Signed runtime remains immutable; product assets retain exact bytes; media ownership and settings are preserved; verification prose is not delivery authority.
- View interaction intent: Preserve the existing canvas, gallery gestures and viewport controls.
- Interaction ownership: Existing product settings and Toolcraft media lifecycle own the output.
- Decision: Point the ten reference font declarations at their byte-identical abc-gravity files, then remove only those ten duplicate files.
- Alternatives rejected: Re-encoding, downsampling, deleting mobile assets, and replacing dataUrl defaults with unsupported URL defaults would change fidelity or initialization.
- State/output mapping: CSS uses the same decoded font bytes. No state or renderer logic changes.
- Files changed: src/section/reference/reference-styles.module.css and public/fonts/reference duplicates.
- Verification: SHA-256 comparisons prove all ten replacements identical; public-assets tests pass; a fresh /demos/fine-details/ production build passes; Chromium loads the production app with no HTTP or page errors. Evidence is in the workspace parent output/release-preparation-2026-09-09.
- Skipped checks: No image compression or measured frame-performance claim. Aggregate delivery remains pending unrelated inherited framework and acceptance repairs.
- Risks: Existing protected framework/acceptance failures remain under release preparation; no deployment or completed aggregate delivery is claimed.


### Delivery 2026-09-08 — Lossless asset packaging

- Request: Optimize the three largest apps without losing image quality.
- Task type: Existing-product media packaging, diagnostic Tier 3; focused checks under the current verification lifecycle.
- User-visible result: Recraft Playground production distribution decreases from 225,244,222 to 21,956,138 bytes with unchanged source resolution and decoded image pixels.
- Source/reference checked: Product and built-bundle image references, default-media/carousel/style/trail paths, public asset inventory, and prior size audit.
- Reference inputs: Current local Playground and its original bundled imagery; no new visual or motion reference.
- Docs/contracts read: AGENTS.md, workflow.md, core/setup-export.md, core/media-upload.md, schema-reference.md, component-rules.md, acceptance-testing.md, and performance.md. Shared route text was verified equivalent to Hero apart from package-manager spelling.
- Contract rules applied: Runtime ownership, source fidelity, persistence policy, product asset boundaries, focused existing-product verification, and worklog requirements.
- View interaction intent: Existing fixed-camera source section and runtime canvas navigation remain unchanged.
- Interaction ownership: Runtime property/media editing and original section visitor interactions remain unchanged.
- Decision: Remove unused copied public website sections after reference checks and full SHA-256 backup. Retain home and recraft-fine-details resources. Repack 24 JPEGs with jpegtran -copy all -optimize -progressive after exact decoded RGBA/dimension verification; keep every other used resource byte-identical.
- Alternatives rejected: Lossy re-encoding, smaller image derivatives, removing optional style/carousel assets, and changing lazy-loading or renderer behavior.
- State/output mapping: Existing runtime media and value mapping feed the same source components. Production code, defaults, geometry, controls, and output behavior are unchanged.
- Files changed: JPEG bytes, unused public resource removals, scripts/public-assets.test.mjs, and this worklog.
- Performance intent: Package-size reduction only; no frame-time or renderer performance claim.
- Verification: Asset-scope test first failed on unrelated resources and then passed (2/2). Focused defaults/carousel/derivative tests passed 22/22. Production build passed. Chromium checks passed for trail, all four original-resolution carousel images, loading state, reset, reload, and mobile startup, with no page errors or failed resources. All 24 optimized JPEGs have identical decoded pixels and dimensions. Evidence: output/app-size-optimization in the workspace parent.
- Style resource verification: Opened the actual style selector, decoded all 17 original-resolution thumbnails, selected Minimal Studio Editorial, and verified its visible label and decoded selected image. No page errors or failed HTTP resources occurred.
- Skipped checks: Full performance refresh, broad inherited acceptance suite, and signed runtime regeneration are outside this focused existing-product change.
- Risks: Native source/controls retain their existing behavior; the work does not claim new whole-product certification or a deployment.

### Iteration 1 — Native standalone section

- Request: Move Hero, Fine Details and Studio Room into separate apps in Projects/recraft-apps, without iframes; preserve current section functionality and layout; do not implement export.
- Task type: Approved reference-runtime port and standalone app assembly.
- User-visible result: Original prompt, style/reference controls, typing, image trail, loading wave, carousel, prompt drag and flight. No running Next.js server is required.
- Source/reference checked: Current source dependency closure, fonts/images/CSS and old Toolcraft schema/default mappings. Source paths and hashes are in docs/reference/source-manifest.json. The original project is unchanged.
- Reference inputs: Existing local website and Toolcraft apps; no substitute design.
- Docs/contracts read: AGENTS.md, workflow, reference study, runtime boundary, assembly, controls, layout, media, setup/export, timeline, performance, schema, decision contract, renderer technique, component rules and acceptance testing.
- Contract rules applied: Product output in canvasContent; signed runtime/bootstrap/host unchanged; built-in controls, history, upload lifecycle, local persistence and settings transfer retained; no new Layers/Timeline.
- View interaction intent: Fixed camera with original visitor interactions. Canvas dimensions replace iframe viewport, and editor zoom is removed from section-local coordinate calculations.
- Interaction ownership: Panel owns authored properties and image order/transforms. Section owns native visitor interaction. Apply/Reset now operate locally rather than writing another project's source.
- Decision: Copy actual source; replace only Next primitives, transport, asset base paths and viewport/coordinate boundary. Keep original animation/layout functions and release preview media resources on unmount/removal.
- Alternatives rejected: Screenshots, iframe wrappers, source symlinks, hardcoded cross-app URLs, visual redesign, new animation engines or artifact export.
- State/output mapping: Existing value mappers feed original normalized section props; runtime presentation resources feed local media stores. History and persistence remain runtime-owned.
- Export: Image user-removed; SVG/video not-requested. No artifact renderer/actions mounted. Standard JSON settings transfer is configuration portability.
- Performance intent: ordinary-product-work
- Verification: `pnpm verify:delivery`
- Risks: Copied source/template has inherited signed-file drift and stale iframe tests. Those are reported without bypassing signed validators. Outbound and cross-section anchors retain original targets.


### Template release repair — 2026-09-09

- Change ID: template-release-2026-09-09
- Entry type: focused
- Request: Make every gallery app cloneable through the published Toolcraft CLI and verify installation/startup.
- Changed owner: Upstream example snapshot packaging, integrity restoration, and public distribution metadata.
- User-visible result: The `fine-details` template is admitted as a complete standalone snapshot; original framework hashes remain authoritative. Canonical identity regeneration, where needed, uses the upstream identity generator.
- Verification: Source template admission passed. Published dependency installation and browser startup results are recorded in the upstream `docs/template-release-report.md`; these smoke checks do not claim renderer or export certification.
- Risks: Historical templates retain their original runtime and workflow versions.

## Decisions

- Renderer: Original native React DOM/CSS/SVG/motion source.
- Timeline: None requested; existing scene clocks/playback controls retained.
- Layers: None requested; existing media collection controls retained.
- Controls: Original schema, runtime history and persistence.
- Export: Explicitly omitted; configuration transfer retained.
- Performance: No benchmark authority requested.

## Verification results

- Native browsers load with zero iframe nodes and no uncaught page errors.
- TypeScript and production builds passed.
- Native geometry comparison and interaction evidence is stored in the root artifacts directory.
- Full protected gate is reported separately; build success is not full gate success.

### Final native checks

- Browser interaction check: trail, loading, animated carousel, carousel drag without canvas pan, preset portal, prompt drag/flight, Apply/reload and Reset passed with no page errors or original-server requests.
- Source/native typography and prompt geometry matched at 644, 768, 1024, 1280 and 1920 canvas widths (1080px canvas height).
- Final focused run: 6 files / 33 tests passed, including native pointer/rectangle math at 0.5x, 1x and 2x editor zoom. TypeScript and production build passed.
- Isolated universal reset uses a zero-specificity scope so original authored margins win, as on the source website.
- `pnpm verify:delivery` stops at inherited integrity drift: index.html, scripts/toolcraft-port.mjs and src/app/app-identity.ts. These files were copied unchanged; signed framework files and checks were not altered.
- Root diagnostic scripts and evidence are outside the app runtime. The app does not need the original project or another app installed.


## Published example — 2026-09-08 (current decision)

- Request/authority: Port the running Fine Details app as a Toolcraft website example; user explicitly approved removal of Apply. Controller owns separate review, Git integration and deployment.
- Source identity: Read-only /Users/kusnizza/Projects/recraft-apps/fine-details, verified by the controller against the listening process. The initial obsolete recraft-landing source draft was fully discarded. Original apps and servers were not modified.
- Architecture: Existing native src/section scene and supplied visual defaults/media retained. No iframe, separate scene build, source symlink, Recraft server, settings-save endpoint or paid generation service is required.
- Actions: Apply removed from schema, handler, save protocol/registration and current product acceptance. Reset uses local Toolcraft controls.reset plus the existing local Prompt Flight reset command. Runtime settings persistence/import/export remain. No new image/video export or Layers/Timeline was introduced.
- Deployment: npm ci; npm run build -- --base /demos/fine-details/; root dist. Base-aware image/font/logo paths and explicit assets/images/fonts/logo-mark.svg rewrites precede SPA fallback. Public asset inventory is preserved.
- Test-first evidence: Four autonomy checks initially failed for Apply, save dependencies and root-relative assets, then passed. An additional main Reset flight regression failed before restoring the native reset command and then passed.
- Focused verification: 20 Vitest tests across 3 selected files, plus 4 Node autonomous checks passed. The separate inherited aggregate preview acceptance check still fails on pre-existing coverage mismatches; it was not weakened. TypeScript and actual-base production build passed after final product changes. New/revised product Reset browser cases replace obsolete publication cases; the full legacy iframe suite is not claimed as passing.
- Browser: Isolated production preview at http://127.0.0.1:3202/demos/fine-details/. Background changed to red and restored to #F2F2F2. Removing a default trail image changed the count 50→49; Reset restored 50. Prompt Flight Run entered flying and main Reset returned idle. A real PNG upload appeared in the media collection. No Apply button, iframe, broken default images, uncaught errors or external-origin resource requests were observed. Final reset restores the default media. Agent-browser requires scrollintoview before clicking offscreen controls; relative upload paths failed in the browser daemon, and absolute paths succeeded.
- Delivery status: No inherited verification/checkpoint.json receipt existed. A bare npm run verify:delivery was attempted once and stopped at inherited signed-file drift: index.html, scripts/toolcraft-port.mjs and src/app/app-identity.ts. These protected files remain identical to the supplied native source. No validator, baseline, signature or protected runtime was changed to pass.
- Limitations: Complete protected delivery gate is NOT passed; old iframe-oriented tests and original acceptance assumptions remain elsewhere in the supplied app. Full-quality assets and large bundle warnings are retained. No measured performance run or certification was authorized. Original outbound/cross-section links are preserved.

## Display name — 2026-09-08

- Request: User delegated a clearer second-app name. Recraft Playground describes its image trail, carousel and animated prompt rather than only the original Fine Details section label. Later Tier 0 title/copy-only edit.
- Changes: Gallery title and opening text, canonical display title, app identity title, HTML title metadata and README heading. No bootstrap, runtime, renderer or behavior changes. The `fine-details` ID, settings namespace, folder, package and deployment URLs remain unchanged. Original Recraft source is untouched.
- Verification: Canonical identity tests first failed for the two old HTML titles; after synchronizing display names, the combined canonical identity/content suite passed all 34 tests. Targeted `git diff --check` passed. Browser, build, performance and aggregate gates were not rerun for this copy-only change; inherited integrity limitations are not certified as resolved.
- Publication: Local docs-new changes only; no new commit, push or deployment in this naming pass.
