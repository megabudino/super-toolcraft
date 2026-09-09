# Native Hero Implementation Worklog

Active change: template-release-2026-09-09

## Status

Mode: product

Hero is an independent native Toolcraft app. The original website repositories are read-only inputs. The previous controller's historical worklog is preserved in `docs/reference/legacy-controller-worklog.md`; it is historical context and does not describe this app's active implementation.

## Decision Trail

### Release preparation 2026-09-09 — Lossless font consolidation and active media

- Request: Prepare all current apps for release on docs-new; merge only after the user's later instruction.
- Task type: Existing-product release preparation with focused packaging and browser checks.
- User-visible result: Recraft Hero keeps the same typography and imagery with 1,109,592 fewer duplicate font bytes in its production package. Hidden sphere rows and inactive gallery modes no longer decode their retained image media until activated.
- Source/reference checked: Current product CSS, both font directories, SHA-256 manifests, runtime media lifecycle, and fresh production output.
- Reference inputs: Current local app and its existing assets; no new external visual reference.
- Docs/contracts read: AGENTS.md, workflow.md, core/setup-export.md, core/media-upload.md, schema-reference.md, component-rules.md, acceptance-testing.md, performance.md, and core/performance.md.
- Contract rules applied: Signed runtime remains immutable; product assets retain exact bytes; media ownership and settings are preserved; verification prose is not delivery authority.
- View interaction intent: Preserve the existing canvas, gallery gestures and viewport controls.
- Interaction ownership: Existing product settings and Toolcraft media lifecycle own the output.
- Decision: Point the ten reference font declarations at their byte-identical abc-gravity files, then remove only those ten duplicate files. Filter presentation sync by active gallery mode and row count while retaining media in runtime state.
- Alternatives rejected: Re-encoding, downsampling, deleting mobile assets, and replacing dataUrl defaults with unsupported URL defaults would change fidelity or initialization.
- State/output mapping: CSS uses the same decoded font bytes. Gallery mode and sphere row count select which retained media assets enter HeroNativeMediaSync.
- Files changed: src/section/reference/reference-styles.module.css and public/fonts/reference duplicates. Also hero-native-preview.tsx and the active-media product test.
- Verification: SHA-256 comparisons prove all ten replacements identical; public-assets tests pass; a fresh /demos/hero/ production build passes; Chromium loads the production app with no HTTP or page errors. The active-media regression failed on inactive fetches before the fix and now passes; Rows renders sixteen canvases, Sphere becomes ready, and a real drag changes pan. Evidence is in the workspace parent output/release-preparation-2026-09-09.
- Skipped checks: No image compression or measured frame-performance claim. Aggregate delivery remains pending unrelated inherited framework and acceptance repairs.
- Risks: Existing protected framework/acceptance failures remain under release preparation; no deployment or completed aggregate delivery is claimed.


### Delivery 2026-09-08 — Lossless asset packaging

- Request: Optimize the three largest apps without losing image quality.
- Task type: Existing-product media packaging, diagnostic Tier 3; focused checks under the current verification lifecycle.
- User-visible result: Production distribution decreases from 258,581,807 to 52,713,226 bytes, with the same decoded images and resolution.
- Source/reference checked: Product and built-bundle image references, runtime default-media dataUrl contract, source/public assets, and prior size audit.
- Reference inputs: Current local Hero and its original bundled imagery; no new visual or motion reference.
- Docs/contracts read: AGENTS.md, workflow.md, core/setup-export.md, core/media-upload.md, schema-reference.md, component-rules.md, acceptance-testing.md, and performance.md. Brainstorming and writing-plans skills applied to the approved optimization scope.
- Contract rules applied: runtime boundary, media default ownership, selected source fidelity, persistence policy, focused existing-product verification, and worklog requirements.
- View interaction intent: Existing fixed-camera gallery drag and runtime viewport controls remain unchanged.
- Interaction ownership: Existing Toolcraft schema, commands, history, and source gallery interaction remain unchanged.
- Decision: Remove unrelated copied public website sections and unused card-stack resources after source/bundle reference checks and SHA-256 backup. Repack 39 JPEGs with jpegtran -copy all -optimize -progressive only after smaller-file and exact Chromium RGBA/dimension comparisons. Keep full-resolution inline default media, mobile, fallbacks, ticker, and fonts.
- Alternatives rejected: Lossy encoding, downsampling, compact defaults, and replacing runtime dataUrl defaults with unsupported URL fields. Those would lose fidelity or break media initialization/reset/persistence.
- State/output mapping: No production TypeScript, renderer, controls, defaults, or output mapping changed. Optimized JPEGs enter the same runtime media and rendering paths.
- Files changed: Referenced JPEG bytes, unused public resource removals, scripts/public-assets.test.mjs, and this worklog.
- Performance intent: Package-size reduction only; no frame-time or renderer performance claim.
- Verification: Asset-scope test first failed on unrelated resources and then passed (2/2). Production build passed. Focused media/gallery/preview suites passed 114 tests. Desktop Sphere (36 images), Rows (16 rendered cards), drag, reset, reload, and mobile image decoding passed in Chromium with no page errors or failed HTTP resources. All 39 optimized JPEGs have identical browser-decoded RGBA hashes and dimensions. Evidence: output/app-size-optimization in the workspace parent.
- Skipped checks: Full performance refresh and signed runtime regeneration are outside this existing-product packaging change.
- Risks: The unchanged hero-website-defaults.test.ts still fails its pre-existing comparison with the website JSON snapshot; defaults, test, and snapshot have no diff from HEAD. Inline full-resolution defaults still make the JS bundle large. No deployment or protected whole-product certification is claimed.

### Delivery 2026-09-08 — Independent native Hero section

- Request: Create independent Hero, Fine Details, and Studio Room apps under Projects/recraft-apps, render the real website sections directly in Toolcraft without iframe or export, and preserve layout, functionality, animations, and effects. This app implements Hero only.
- Task type: First independent app delivery, Tier 4 reference port, with focused native component/media/domain tests and browser checks selected before implementation. Original repositories are read-only reference inputs.
- User-visible result: Native HeroV4Styles, six image rows, mirrored Rows, original WebGL optics, Grain/CRT, click/drag gallery navigation, automatic motion, heading, badge, subtitle, CTA, and ticker inside the Toolcraft canvas. Reset uses runtime commands; Apply commits a local checkpoint and settings persist across reload.
- Source/reference checked: The original controller in `/Users/kusnizza/Projects/recraft/recraft-landing/recraft-tools/hero`; the copied `src/section/components/pages/home/hero-v4-styles.tsx`, gallery renderer, motion, settings, media store and shaders; `docs/reference/source-manifest.json`; the website globals and exact font declarations used by the shared scoped CSS generator. No originals were edited.
- Reference inputs: Local website source and its bundled portrait/image/font assets. No supplied motion capture; `referenceInputs: []` remains appropriate.
- Docs/contracts read: `workflow.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `core/reference-study.md`, `core/control-selection.md`, `core/layout.md`, `core/performance.md`, `core/setup-export.md`, `core/media-upload.md`, `decision-contract.md`, `schema-reference.md`, `component-rules.md`, `renderer-technique.md`, `performance.md`, and `acceptance-testing.md`. Browser verification skill used for direct browser inspection.
- Contract rules applied: `runtime-shell-required`, `canvas-surface-preserved`, `reference-clone-source-of-truth`, `output-export-required`, `persistence-policy-explicit`, `workflow-required`. Explicit user instruction to include the complete website section governs its original CTA/ticker product content. Signed framework, host, configs, validators, receipts, and tests remain unchanged.
- View interaction intent: Fixed camera from the inspected source; the gallery pans through the existing lens. Toolcraft owns viewport pan/zoom. No new camera is introduced.
- Interaction ownership: Runtime controls edit settings and media. Original canvas drag/click events update `sphere.pan` through merged runtime history. The source CTA remains an anchor; its `#fine-details` target is outside this standalone section.
- Decision: Preserve DOM/WebGL source and adapt Next Image/Link/dynamic to local React. Toolcraft presentation URL leases feed the copied media store; transforms remain canonical metadata consumed by its shader. Runtime default media replaces implicit renderer defaults; removal stays empty and resources release on remove/unmount. Source viewport CSS uses the canvas frame and locally scoped exact fonts/theme utilities. Viewport motion briefly suspends autonomous WebGL/ticker work and resumes without changing settings.
- Alternatives rejected: iframe hosting and source-writing Apply because the user requested independent native apps; recreated simplified visuals because the request requires the original section; hardcoded links to another app's dev port because the apps must stay independent; disabling validators or modifying signed framework files.
- State/output mapping: `createHeroPreviewSettingsFromValues` plus original normalization maps controls directly into `HeroV4Styles`. Media refs, source order, rotation and flips feed original source resolution. `hero.appliedSettings` stores Apply checkpoints through runtime persistence/settings transfer. Runtime canvas frame controls responsive layout and desktop/mobile selection. Artifact actions are absent by explicit request.
- Performance intent: ordinary-product-work
- Verification: `npm run verify:delivery`
- Risks: Existing code-health baseline already rejects oversized controller/schema/acceptance files, copied large source shaders, old product tests importing reserved evidence internals, and original retained-preview object URLs/canvas snapshots as artifact mechanics. These are reported, not suppressed. Inherited iframe-era acceptance tests need native browser recipes before complete protected certification can pass. Default assets are full source-quality inline runtime schema resources and create a large initial bundle. This focused check does not claim exhaustive effect parity or measured performance certification.



### Template release repair — 2026-09-09

- Change ID: template-release-2026-09-09
- Entry type: focused
- Request: Make every gallery app cloneable through the published Toolcraft CLI and verify installation/startup.
- Changed owner: Upstream example snapshot packaging, integrity restoration, and public distribution metadata.
- User-visible result: The `hero` template is admitted as a complete standalone snapshot; original framework hashes remain authoritative. Canonical identity regeneration, where needed, uses the upstream identity generator.
- Verification: Source template admission passed. Published dependency installation and browser startup results are recorded in the upstream `docs/template-release-report.md`; these smoke checks do not claim renderer or export certification.
- Risks: Historical templates retain their original runtime and workflow versions.

## Renderer

- Decision: Mount the copied HeroV4Styles DOM/WebGL section directly in canvasContent.
- Reason: Preserve the exact authored structure, shader behavior, effects, asset order and motion.
- Evidence: Native scene selectors show ready WebGL, 36 runtime-owned default row images, and zero iframe elements. Scene source is recorded in docs/reference/source-manifest.json.

## View Interaction

- Decision: Keep the inspected source's fixed camera and lens.
- Reason: The original scene pans the gallery through a fixed optical surface.
- Evidence: Native click/drag uses the original motion equations and writes sphere.pan through runtime commands. No orientation targets are added.

## Interaction Ownership

- Decision: Toolcraft owns property editing, media, history and viewport navigation; native source events own gallery drag/click.
- Reason: Source interaction and Toolcraft runtime state must agree.
- Evidence: Gallery pan survives Apply and browser reload. Controls remain declared in the existing runtime schema.

## Timeline

- Decision: Retain autonomous reference motion without a timeline.
- Reason: Source conveyors, timed jumps and ticker have no timeline transport.
- Evidence: Original motion/reveal code is copied; viewport pan/zoom briefly suspends nonessential sphere/ticker work and restores it without changing motion settings.

## Layers

- Decision: Keep the existing single product scene without a Layers panel.
- Reason: Row image order is controlled by runtime FileDrop source targets.
- Evidence: Six row upload collections feed the original scene.

## Controls

- Decision: Preserve the existing schema control inventory.
- Reason: The user requested original control depth and output behavior.
- Evidence: Canonical settings normalization maps schema values to the mounted source; independent default image attachments and transforms use runtime media.

## Export

- Decision: No image, SVG or video artifact export.
- Reason: The user explicitly requested no export.
- Evidence: Schema artifact actions remain absent. The external snapshot provider/video controller are disconnected. Apply records a local runtime checkpoint; runtime settings transfer is retained.

## Performance

- Decision: Focused functional verification only.
- Reason: No measured performance request exists.
- Evidence: Preserved retained renderer/cache lifecycle; native media fetch cancellation and resource release have focused tests. No full performance audit or protected performance receipt is claimed.

## Verification Results

### 2026-09-08 — Recraft header in native Hero

- Request: Insert the Recraft header and remove the bottom gap caused by its omission.
- Task type: Later focused reference-assembly/visual-mismatch change, not a renderer or runtime change.
- Reference inputs: User screenshot `codex-clipboard-69452f2d-4c46-4d45-8d6b-c4af2b945363.png`; original website `src/components/header/index.tsx`, `header-actions-client.tsx`, `header-sign-in-button.tsx`, `src/configs/website-config.ts` and `public/logo-mark.svg`.
- Source finding: Native browser has a 1080 px canvas and a 1016 px Hero, with a measured 64 px bottom gap and no header. Source Hero intentionally uses `100svh - 4rem`; source header is 64 px tall.
- Design: Mount the original guest header before Hero within the same canvas-scoped ReferenceSurface. Preserve original logo, resource URLs, guest action labels, 64 px height, 1400 px content max-width, gutters and responsive visibility. Keep Hero height, ticker, effects, motion and sizing clamps unchanged. Navigation remains website product output, not additional Toolcraft editor controls. Standalone preview does not acquire a website authentication session; guest links lead to Recraft's website.
- Alternatives rejected: Stretching Hero to cover the gap, covering the gap with a background, adding an iframe, or modifying the Toolcraft shell.
- Implementation plan: Add a product-owned header and scoped CSS module plus exact source logo; mount it before Hero; extend native composition and browser geometry checks. No changes to source website, sibling apps or protected Toolcraft runtime.
- Docs/contracts read: AGENTS, workflow, reference-study, runtime-boundary, assembly-workflow, decision-contract, schema-reference, component-rules, renderer-technique, acceptance-testing and performance. Applied `reference-clone-source-of-truth`, `canvas-surface-preserved` and `workflow-required`. Brainstorming/writing-plans approval rituals use the signed local fallback: explicit port request authorizes this bounded implementation; the folder has no Git repository.
- Verification: Later focused checks only: native composition test must fail without the header; browser measures header top/height, logo, responsive links and exact Hero bottom at the canvas edge; TypeScript plus existing native drag/reload/Reset checks. No aggregate delivery or measured performance run.
- Verification results: The composition regression failed on the missing header before implementation, then passed; `npm run typecheck` passed. Existing `scripts/check-hero-native-browser.mjs` passed with unchanged heading geometry, Sphere/Rows, drag, Apply/reload persistence, mobile canvas sizing and Reset. Direct browser checks through real Canvas width input passed at 390, 644, 767, 768, 1024, 1280 and 1920px, all at 1080px height: header 64px, logo 40×40, bottom gap 0px, resources/Sign in toggle exactly at 768px, Studio action fits every width, and no page errors. Evidence: `.toolcraft/browser-artifacts/hero-header-layout.json` and visually reviewed `hero-with-header.png`.
- Protected feature-runner limitation: `npm run test:feature -- hero.reference-header` stopped during test loading on the inherited Node resolution error `Cannot find package '@/section'` from `src/app/hero-default-media.ts`, before executing the registered browser case. The same native UI behavior was checked directly with `.toolcraft/browser-artifacts/check-header-layout.mjs`; this is diagnostic proof, not a protected receipt. No runner, alias configuration or framework code was changed to bypass that failure.
- React review: Header is a separate stateless component with stable module-level links, semantic navigation, explicit logo dimensions/alt text and keyboard focus styles. No subscriptions, timers, authentication SDK or renderer changes were added.
- Risks: Existing signed-manifest/iframe-era acceptance limitations remain; no new framework edits. Original short/tall viewport height clamps are preserved rather than redesigning the website.

### 2026-09-08 — Binary hydration regression correction

- Request: «исправляй», following the confirmed Hero media-hydration lag diagnosis.
- Task type: Later focused shared-runtime bug fix; no product design, renderer, effects, layout or controls change.
- Source/reference checked: `.toolcraft/browser-artifacts/hero-lag-diagnosis.md`; identical upstream `primeui-v2/packages/toolcraft-runtime/src/source-assets/source-asset-binary-media-hydrator.ts` and Hero copied runtime.
- Decision: Share one pending Promise per asset ID and immutable resource reference, register it before work begins, release it on success/failure, and reject stale completion after removal/resource replacement. Metadata-only edits keep the pending hydration alive. Preserve repository leases and retry/reset behavior.
- Alternatives rejected: Downsampling, disabling effects, changing animation, bypassing media ownership, suppressing integrity checks, and broad runtime/UI upgrade.
- Focused checks selected: Upstream concurrency regression tests (60-item re-entrancy, overlapping calls, repository restoration, failed retry/reset, stale results), existing binary hydration test, then actual Hero fresh load/reload/reset and drag browser checks. Diagnostics remain under `.toolcraft/browser-artifacts/`.
- Implementation sequence: Failing regression test → shared runtime correction → source-derived synchronization to Hero only → focused tests/browser check.
- Docs/contracts read: AGENTS and workflow; decision-contract, runtime-boundary, media-upload, setup-export, schema-reference, component-rules, renderer-technique, core/performance, performance and acceptance-testing.
- Contract rules applied: `runtime-shell-required`, `reference-clone-source-of-truth`, `persistence-policy-explicit`, `workflow-required`. Runtime change is authored in its monorepo owner; no product workaround or validator edit.
- Performance evidence level: Targeted diagnostic reproduction only. The inherited iframe pipeline has no honest native binary-hydration canonical path or passing initial receipt; do not invent path authority or claim protected performance certification.
- Upstream regression result: The concurrency test reproduced 1,830 lease starts for 60 defaults before the fix. All 8 tests in `source-asset-binary-media-hydrator.test.ts` and `default-binary-media-hydration.test.ts` now pass, including overlapping callers, re-entrancy, repository restoration, retry/reset, stale success/error and metadata-only edits.
- Source synchronization: Only the corrected upstream hydrator was copied into Hero. Both source files have SHA-256 `2d9ac440952b6fce342b4727cbcbe944268c8f567fa0d8e476e3fdd48cca4480`. The previous file is retained as `.toolcraft/browser-artifacts/hydrator-before-fix.ts`. No renderer, effects, CSS, animation, image quality or other Toolcraft runtime source was changed for this fix.
- Actual-fix diagnostic: `.toolcraft/browser-artifacts/verify-hydration-fix.mjs` instruments counters only, asserts that the upstream pending-work fix is present, and adds no browser-only deduplication. A fresh isolated 1920×1080/DPR1 page performed exactly 60 starts and 60 commits, at most 1 per asset. After gallery readiness, 18 seconds yielded 1,080 RAF samples, p95 16.7 ms, maximum 16.8 ms, no frames over 50 ms and no long tasks; canvas backing remained 1920×1016. Used JS heap was about 529 MB. Evidence: `.toolcraft/browser-artifacts/hero-hydration-fixed.json`. This is a targeted reproduction on one local browser/device, not a cross-device performance guarantee or protected performance receipt.
- Native verification: `npm run typecheck` passed. `node scripts/check-hero-native-browser.mjs` passed: Sphere/Rows, drag, pan/CTA persistence across Apply/reload, mobile canvas sizing, Reset and original heading geometry. Zero iframes, page errors or requests to the original server. The diagnostic browser session was closed; Hero's server remains on port 3101.
- Delivery limitation: Existing generated integrity/iframe acceptance drift remains. Source synchronization also changes this protected hydrator's hash from the signed manifest's `73bce032d69ca31e6a2ab57166dfdaeb9d2c88e901bb72f034a99f139d70fffe`; the manifest, signatures, validators and receipts were not modified or re-signed. Full protected delivery is therefore not claimed. A complete generated-runtime migration would include unrelated breaking module API changes and is outside this targeted fix.

### Earlier native migration verification

- Seven focused product test files passed, 33 tests total, covering native mount/callbacks, media release/removal, image settings, row activation, dispersion mapping, unchanged pure pixel evidence, responsive utility class names, and CSS-module/idempotent preservation. Command: `npx vitest run src/app/hero-native-preview.product.test.tsx src/app/hero-native-media.product.test.ts src/app/hero-gallery-values.test.ts src/app/hero-gallery-row-activation.test.ts src/app/hero-dispersion-values.test.ts src/app/hero-motion-pixel-evidence.test.ts src/app/hero-reference-classes.product.test.ts`.
- Final `npm run build` passed TypeScript and Vite after utility isolation and pure evidence types were isolated from browser-only dependency imports. The existing full-quality inline resource policy causes a 37.17 MB initial JavaScript bundle and Vite chunk-size warning.
- The first protected delivery attempt stopped before checks on malformed Verification text inherited from the old controller worklog. This current worklog now describes only the native standalone app, with the historical log preserved separately.
- Direct integrity inspection reports pre-existing copied signed-file hash mismatches, inherited product tests importing reserved evidence internals, original preview media APIs flagged as artifact delivery, and generated nested CSS selectors. No protected file, validator, receipt, or assertion has been weakened.
- After worklog normalization, protected delivery advanced to integrity checks and stopped on inherited signed-file hash mismatches in `e2e/app-persistence.spec.ts`, `e2e/browser-control-target-helpers.ts`, and the copied acceptance control-layout/section/type/naming files. No passing receipt exists.
- `node scripts/check-hero-native-browser.mjs` passed: zero iframes; Sphere ready; Rows rendered 16 canvas cards; original drag updated native pan; pan and CTA survived Apply/reload; canvas width 768 displayed the mobile poster inside a 1920-wide browser; Reset restored defaults; no page errors. Screenshot: `.toolcraft/browser-artifacts/hero-native-verified.png`.
- The first mobile browser regression failed because editor-global `min-[80rem]:hidden` matched browser width despite the scoped canvas stylesheet. Exact source utility tokens are now namespaced on final DOM, preserving Button class merging and CSS module identities. The same previously failing test now passes.
- A source/native desktop geometry comparison exposed a second CSS priority issue: the scoped universal reset overrode the original module's -24px heading margin. Making its scope anchor zero-specificity with `:where(.siteRoot)` restores the original module priority. At 1920×1080, source and native now have identical measured section (1920×1016), heading (x519, y297.954376, width882, height250.546844), and CTA (x841.109375, y622.501221, width237.765625, height62) geometry. The browser diagnostic asserts the heading regression without requiring the source server.
- Browser visual diagnostics are focused observations, not protected aggregate acceptance evidence.
- Risk: Cross-section anchors such as #fine-details retain original semantics but target content outside this standalone Hero section.
- Risk: Full-quality inline default assets create a large initial bundle.
- Risk: Inherited iframe-era acceptance recipes require migration before full native certification.
- The inherited iframe-era renderer pipeline registration is no longer mounted in the app composition. Native React/WebGL updates use the direct adapter; protected pipeline/performance certification still needs a native lifecycle mapping. No no-op pass has been added to manufacture evidence.
- Final production build and the native browser diagnostic passed again after removing that inactive registration. Rows/Sphere, drag and CTA persistence, mobile canvas sizing, reset and original heading geometry passed; zero iframes, page errors or requests to the original server.


## Published example — 2026-09-08 (current decision)

- Request/authority: Port the running Hero app as a Toolcraft website example; user explicitly approved removal of Apply. Controller owns separate review, Git integration and deployment.
- Source identity: Read-only /Users/kusnizza/Projects/recraft-apps/hero, verified by the controller against the listening process. The initial obsolete recraft-landing source draft was fully discarded. Original apps and servers were not modified.
- Architecture: Existing native src/section scene and supplied visual defaults/media retained. No iframe, separate scene build, source symlink, Recraft server, settings-save endpoint or paid generation service is required.
- Actions: Apply removed from schema, handler, save protocol/registration and current product acceptance. Reset uses local Toolcraft controls.reset. Runtime settings persistence/import/export remain. No new image/video export or Layers/Timeline was introduced.
- Deployment: npm ci; npm run build -- --base /demos/hero/; root dist. Base-aware image/font/logo paths and explicit assets/images/fonts/logo-mark.svg rewrites precede SPA fallback. Public asset inventory is preserved.
- Test-first evidence: Four autonomy checks initially failed for Apply, save dependencies and root-relative assets, then passed.
- Focused verification: 121 Vitest tests across 5 selected files, plus 4 Node autonomous checks passed. TypeScript and actual-base production build passed after final product changes. New/revised product Reset browser cases replace obsolete publication cases; the full legacy iframe suite is not claimed as passing.
- Browser: Isolated production preview at http://127.0.0.1:3201/demos/hero/. Heading color changed to red and restored to #D2FC31. Removing a default row image changed the count 36→35; Reset restored 36. A real PNG upload appeared in the media collection. No Apply button, iframe, broken default images, uncaught errors or external-origin resource requests were observed. Final reset restores the default media. Agent-browser requires scrollintoview before clicking offscreen controls; relative upload paths failed in the browser daemon, and absolute paths succeeded.
- Delivery status: No inherited verification/checkpoint.json receipt existed. A bare npm run verify:delivery was attempted once and stopped at inherited signed-file drift: runtime/source-assets/source-asset-binary-media-hydrator.ts, e2e/app-persistence.spec.ts, e2e/browser-control-target-helpers.ts, and five protected src/app acceptance files. These protected files remain identical to the supplied native source. No validator, baseline, signature or protected runtime was changed to pass.
- Limitations: Complete protected delivery gate is NOT passed; old iframe-oriented tests and original acceptance assumptions remain elsewhere in the supplied app. Full-quality assets and large bundle warnings are retained. No measured performance run or certification was authorized. Original outbound/cross-section links are preserved.

## Display name — 2026-09-08

- Request: User explicitly named this app Recraft Hero. Later Tier 0 title/copy-only edit.
- Changes: Gallery title and opening text, canonical display title, app identity title, HTML title metadata and README heading. No bootstrap, runtime, renderer or behavior changes. The `hero` ID, settings namespace, folder, package and deployment URLs remain unchanged. Original Recraft source is untouched.
- Verification: Canonical identity tests first failed for the two old HTML titles; after synchronizing display names, the combined canonical identity/content suite passed all 34 tests. Targeted `git diff --check` passed. Browser, build, performance and aggregate gates were not rerun for this copy-only change; inherited integrity limitations are not certified as resolved.
- Publication: Local docs-new changes only; no new commit, push or deployment in this naming pass.

## Gallery workflow production release — 2026-09-09

- Request: «давай заливать апдейт в продакшен всех апок»; «релиз cli мы конечно оставляем».
- Task type: Later focused build-compatibility correction during production publication.
- User-visible result: Preserve the current Hero UI and the released template CLI while making the accepted gallery example buildable and copyable with the focused-development workflow.
- Source/reference checked: Failed production build `dpl_G2X7XdbTVPTaJPwj8vYRNtqQRwDD` at source `0d7045c8`; current signed section-inventory types and the two product metadata entries. Reference inputs: None; no visual redesign.
- Docs/contracts read: AGENTS; gallery-workflow; workflow; decision-contract; core/runtime-boundary; component-rules; renderer-technique; acceptance-testing; core/performance; performance.
- Contract rules applied: Product-owned metadata remains editable; signed framework files, validators, manifests and runtime remain unchanged. Accepted-gallery status is owner approval, not fabricated test execution.
- View interaction intent: Existing native Hero interaction unchanged. Interaction ownership: Existing runtime and product owners unchanged.
- Decision: Move the existing Auto scroll and CRT label rationale from the unsupported `sectionTitleLabelEvidence` extension into the supported `groupingReason` prose. Preserve section targets, schema labels, visibility and renderer behavior. This prose is context, not a validator exception.
- Alternatives rejected: Restoring a private extension in protected types/validators; hiding TypeScript errors; changing approved labels; changing the CLI release.
- State/output mapping: No runtime state or rendered output changes. The same Auto scroll and CRT targets and labels remain asserted by the focused product test.
- Performance intent: Ordinary metadata/build repair; no measured performance work.
- Verification: Two focused product regression cases failed before the metadata correction and then passed with `vitest run src/app/hero-auto-scroll-toolcraft.test.ts`; `npm run typecheck` passed. Current CLI admission and portable accepted-gallery status passed for both the source and a newly packaged Hero copy. No aggregate delivery or performance suite was run. Browser checks were not rerun because no UI, renderer or interaction source changed; production readiness is recorded separately in the controller release report.
- Risks: Inherited legacy acceptance/pipeline limitations are not certified as resolved. Historical signed-file drift notes above describe their original snapshots; the current source passes CLI admission after the separately preserved CLI-release restoration. The large full-quality asset bundle remains unchanged.
