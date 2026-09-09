# Toolcraft agent worklog

Active change: template-release-2026-09-09

## Display-name update — 2026-09-09

- Request: Name the app Recraft Studio Room.
- Verification tier: Tier 0 (copy/title only), later edit.
- Plan and decision: Update gallery title/introduction, canonical display name, app identity title, HTML title/meta marker, and name assertions. Preserve the studio-room id, folder, URLs, Vercel project, storage keys, controls, layout and renderer.
- Reference: Existing Recraft Hero and Recraft Playground display-name convention; current app identity and gallery registration. Follow the local workflow and Tier 0 checks; no behavior/spec change, framework regeneration or signature changes.
- Run: Focused identity/schema assertion and canonical Studio Room gallery test. Skip browser/performance/aggregate gates because no visible layout or behavior changes.
- Result: Both selected Vitest assertions pass; canonical identity/gallery test passes in both checkouts. Local gallery returns HTTP 200 with title Recraft Studio Room | Toolcraft. Unrelated schema cases were excluded by the explicit name selector.
- The user-requested rename changes only generated title metadata in index.html, matching the title/meta fields populated by the CLI generator; bootstrap structure is untouched. No inherited integrity failure is claimed fixed.

## Product mode

- Mode: product
- Product: Recraft Studio Room, native standalone application.
- Purpose: Run the unchanged website section directly in an independent Toolcraft app.
- Historical decisions: docs/reference/original-toolcraft-worklog.md preserves the previous worklog.

## Decision Trail

### Iteration 1 — Native standalone section

- Request: Move Hero, Fine Details and Studio Room into separate apps in Projects/recraft-apps, without iframes; preserve current section functionality and layout; do not implement export.
- Task type: Approved reference-runtime port and standalone app assembly.
- User-visible result: Original room DOM/SVG, typography, CTA, grids, tiles/shuffle, parallax, depth trail and mobile composition. No running Next.js server is required.
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
- User-visible result: The `studio-room` template is admitted as a complete standalone snapshot; original framework hashes remain authoritative. Canonical identity regeneration, where needed, uses the upstream identity generator.
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

- Source/native room, title and CTA geometry matched at 644, 768, 1024, 1280 and 1920 canvas widths (1080px canvas height).
- Browser interaction check passed: live depth editing, Apply/reload persistence, pointer parallax, local image upload/render/remove and Reset, with zero iframes, page errors or requests to the original server.
- Motion's scroll observer uses the native canvas element as its container, preserving the former iframe viewport's scroll progress after responsive canvas resizing. Pointer parallax remains the original source calculation.
- Five focused value-mapping tests and the final TypeScript/production build passed.
- Isolated universal reset uses a zero-specificity scope so original authored margins win, as on the source website.
- `pnpm verify:delivery` stops at inherited integrity drift in index.html, scripts/toolcraft-port.mjs, src/app/app-identity.ts and the copied runtime model-import canonical/worker files. They were copied unchanged; signed framework files and checks were not altered.
- Root diagnostic scripts and evidence are outside the app runtime. The app does not need the original project or another app installed.

### Iteration 2 — Toolcraft gallery deployment

- Request: Replace Contour Field with this Recraft Studio Room, following the existing examples and Git-linked Vercel scheme. Remove Apply and artifact exports; retain Export Settings / Import Settings as in Hero and Fine Details.
- Task type: Standalone application transfer; ordinary-product-work, no performance audit requested.
- Verification tier: Tier 4 — first copy into this repository. Run the protected delivery gate once; retain inherited failures as failures rather than modifying signed checks.
- User-visible result: Native room, original controls and animation, no Website/Apply section and no image/SVG/video export. Settings transfer, Reset, history, and persistence remain runtime-owned.
- Source/reference checked: /Users/kusnizza/Projects/recraft-apps/studio-room, plus examples/hero deployment settings and the current Hero/Fine Details browser UI. Original source remains untouched.
- Contract rules applied: Same schema/runtime composition, immutable copied framework, existing native renderer, base-prefixed asset paths, and independently hosted examples/studio-room from docs-new.
- Decisions: Remove only Apply schema/action registration and its no-op native callback. Preserve scene functions, defaults, layout, typed setting values, and uploaded image handling. Copy only the room's public image collection and the original fonts.
- Alternatives rejected: External iframe, redesigned UI, artifact export, runtime settings-transfer changes, and weakening integrity checks.
- State/output mapping: Controls continue to feed createStudioRoomSettingsFromValues and the native PreFooter component immediately. The router already resolves import.meta.env.BASE_URL; section assets now use the same deployment prefix.
- Timeline/layers/export: Existing autonomous room animation; no added timeline or layers. Image/SVG/video output remains absent; configuration transfer remains enabled.
- Performance intent: ordinary-product-work. No measured performance, kernel benchmark, or full audit run.
- Focused verification: 11 tests passed across studio-room-deployment, studio-room-preview.product, and studio-room-values. TypeScript and `npm run build -- --base /demos/studio-room/` passed. Initial Apply assertion was observed failing before the removal.
- Browser diagnostics: Built bundle at http://127.0.0.1:3213/demos/studio-room/ renders the native scene without iframe or page errors. Settings transfer is present; Apply and artifact export buttons are absent. All image/font requests use the deployment prefix; no completed broken images. Canvas dimensions and Depth were edited through their real controls. Screenshots are external diagnostics, not protected receipts.
- Known inherited gate failure: Before implementation changes, the integrity checker already rejected copied signed-file drift and source CSS/media-preview boundaries. Source runtime and signed bootstrap files were not modified during this transfer. The user subsequently approved deployment using the same focused build/browser checks as Hero and Fine Details, without repairing the upstream framework.
- Protected gate result: `pnpm verify:delivery` ran once and exited 1 before build/acceptance. It reported inherited signature drift in five model-import canonical/worker files, index.html, scripts/toolcraft-port.mjs, and src/app/app-identity.ts. No successful delivery receipt was produced; this transfer is not claimed as complete functional certification.
- Website checks: Proxy resolution, static-asset rewrite order, router base paths, installer catalog/CLI arguments, and the Studio Room canonical identity/1600×1200 JPEG cover checks passed. The public app is not deployed yet; the old live project and user's original checkout remain untouched.

### Iteration 3 — Asset cleanup and removal of the separate mobile version

- Request: Proceed with the existing deployment scheme; remove unused assets, optimize images, report size, and remove the separate mobile version and its content.
- Scope: Product section and public assets only. Original source and signed Toolcraft framework remain unchanged. No new mobile layout, artifact export, or Apply action.
- Implementation: Mount the existing animated room directly through React lazy/Suspense. Delete the responsive fallback component/CSS, mobile heading markup/styles, and mobile composite image. Keep one native room at every canvas width.
- Asset audit: Keep exactly the 24 referenced room WebPs and 25 referenced font files. Remove ten unused JPEGs (including the mobile fallback) and 27 unused font-related files. No unrelated Recraft section images were imported.
- Image optimization: Tested cwebp quality 90/method 6 without resizing. Every candidate was larger, so all 24 original WebPs were retained byte-for-byte without additional quality loss.
- Size: Public assets decreased from 10,883,311 to 3,128,776 bytes (7,754,535 bytes removed, 71.25%). Images are 1,648,508 bytes; fonts are 1,480,268 bytes. Final dist is 8,321,563 bytes, excluding node_modules and source files; this is the uncompressed deployment output, not initial network transfer.
- Verification: Three asset/mobile regression tests were observed failing before cleanup and now pass. Eleven focused Vitest tests pass. TypeScript and the base-prefixed Vite production build pass. Local browser has no page errors, broken images, iframes, or mobile fallback; native room remains mounted at both 1920 and 390 canvas widths. No new protected gate receipt is claimed.
- Decision: Continue Git-linked publication from examples/studio-room on docs-new. The inherited delivery-gate failure remains documented and does not require framework changes for this authorized deployment.

### Publication and retirement completed

- Source commit 4b9b661bb4dbc54598b1dd442fa29809f6394bab was pushed to docs-new. Vercel production dpl_3L68VusxfFqhCYVYpHGJXhhJF4fb and website preview dpl_Ey9YBZ2RMWaFTRx3g6qw8eeXsiPS both report READY for this exact Git SHA.
- The studio-room project uses GitHub pixel-point/primeui-v2, production branch docs-new, root examples/studio-room, Node 24, npm ci, Vite dist, enabled affected-project deployments, and preview-only authentication. Stable URL: https://studio-room-pixelpoint.vercel.app/demos/studio-room.
- Gallery/proxy/installer changes were reconciled into the user's local checkout; unrelated edits were preserved. Forty-eight focused repository tests passed there as well.
- The user explicitly requested permanent removal of the retired app, including its temporary backup. Contour Field's Vercel project was deleted and returns 404; its example, gallery content/media, dedicated old worktree, test recordings/build outputs, and dedicated plans were removed. No recovery copy remains. Normal Git history was not rewritten.

### Iteration 4 — Grid stacking and visible default attachments

- Request: Images must not sit underneath grid lines; every included image must appear in the uploader.
- Task type: Later feature work, Tier 3, product CSS and default image media only.
- User-visible result: Fine/main grids and depth trail paint below tiles; the back wall remains above. All 24 original WebPs appear in the existing Tile Images control and form the only scene image pool.
- Source/reference checked: User screenshot; native room CSS/renderer; Hero and Fine Details default-media registration. The original Recraft project is not modified.
- Reference inputs: codex-clipboard-fe8db5ef-32d9-4dd4-be9c-b5ed632f0d13.png (static bug screenshot, not a motion reference).
- Docs/contracts read: workflow, runtime-boundary, decision-contract, setup-export, media-upload, control-selection, layout, schema-reference, component-rules, renderer-technique, acceptance-testing, core/performance and performance. Used systematic-debugging, brainstorming, writing-plans and agent-browser with inline execution.
- Contract rules applied: Built-in fileDrop/media.defaultAssets ownership; preserve runtime state and persistence; immutable framework; native reference renderer; focused later-edit verification.
- View interaction intent: Existing reference-owned camera/parallax is unchanged.
- Interaction ownership: Existing panel owns image selection, reorder, rotate/flip and removal; no duplicate canvas controls or custom uploader.
- Decision: Register defaults through the same data-URL catalog pattern as Fine Details; remove the renderer's hidden empty-list fallback. Move original WebP bytes into that catalog and remove duplicate public copies without re-encoding.
- Alternatives rejected: Custom thumbnail UI, hardcoded fallback images after deletion, clearing existing workspaces, changing storage keys, redesigning controls, or changing the animation.
- State/output mapping: Schema defaults -> runtime mediaAssets -> existing native media bridge -> room tiles. Empty attached media means no image tiles. Reset restores 24 attachments; normal reload preserves intentionally empty collections and other saved values.
- Performance intent: ordinary-product-work. Renderer technology, workload limits and animation remain unchanged. No measured performance or aggregate delivery audit was run.
- Verification: Two focused regressions failed before the fix (0 defaults and grid above tiles), then passed. Thirteen focused Vitest tests, three asset inventory tests, TypeScript and the base-prefixed production build passed. `npm run test:feature -- tiles.images` passed its real browser scenario with protected media-lifecycle evidence: loaded defaults, stacking, pointer reorder, visible rotation/flip output, removal, empty reload, upload, section Reset, restored reload and no page errors.
- Browser diagnostics: Agent-browser verified current source on 127.0.0.1:3214; screenshot shows all 24 loaded thumbnails and grid-free image faces. A separate manual removal/reload retained 23 attachments; section Reset restored 24. Diagnostic screenshots remain under .toolcraft/browser-artifacts, outside product source.
- Risks: Previously saved empty media stays empty by the runtime contract; use Reset Tile Images to load the new defaults without resetting other controls. The inherited single-image preview intercepts the remove button's center pointer hit, so the focused test uses its accessible Enter action for the final image; copied framework code is unchanged. Existing signed-file drift remains as documented. This local correction does not claim a new deployment or full-delivery receipt.


### Iteration 5 — Full functional comparison and native integration regressions

- Request: Compare the complete Studio Room functionality against Recraft, investigate the user's grid-over-image screenshot, and keep every original image in the uploader.
- Verification: Later Tier 3 functional work. Existing prepared default-media and stacking changes were independently checked before new edits; no new deployment, measured performance or delivery receipt is claimed.
- Reference: Original editor in recraft/recraft-landing/recraft-tools/studio-room, website renderer in recraft-v4-styles, and standalone native original in recraft-apps/studio-room. Static screenshot: /var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-e4147a71-ce15-4642-9c71-8b1cbed8fda4.png. No motion-reference preprocessing applies.
- Decisions/contracts: systematic-debugging, brainstorming and writing-plans; existing local preflight documents; immutable runtime, built-in media ownership, explicit reference differences and focused browser proof. Preserve previous no-Apply/no-mobile decisions. No source project files changed.
- Evidence: 44 shared schema controls are identical; 12 original manifest hashes still match. Initial geometry/composition plus 27 static control changes match the running original. Every one of 24 default WebPs is byte-identical to both original asset directories. Seventeen motion/workspace diagnostic checks passed, including XY input, swap/slide, parallax, trails, reduced motion, JSON transfer and history.
- New fix: Equivalent media snapshots repeatedly cancelled pending transformed-image decoding. The preview now uses a semantic media selector; source/order/dimensions/rotation/flips still invalidate, while runtime-only position and equivalent cloned records do not. Four regression tests cover that boundary.
- New fix: The native surface stopped every left-button pointer-down and prevented Infinity canvas pan. Only interactive descendants now stop propagation; background pan uses the built-in viewport handler. The real pan/reload/finite-restoration/Undo/Redo scenario failed before this change and passes after it.
- Proof maintenance: Replaced obsolete iframe selectors in product-owned preview tests with native output measurements; corrected browser observation closure and textbox selection. Persistence acceptance now targets the height actually edited in the scenario. Expanded media proof to Flip V, all rotations and exact transformed-pixel persistence after reload.
- Verification results: 17 focused Vitest tests, 3 asset inventory tests, typecheck and production build passed. Focused section.height, canvas.infinity, persistence.reload and tiles.images browser scenarios passed with required runtime evidence. No protected framework or generic test harness changed.
- Deliverable: docs/reference/parity-audit-2026-09-09.md records exact coverage and deliberate differences. Diagnostic scripts, JSON and screenshot are in .toolcraft/browser-artifacts. Corrected product files are synced to primeui-v2/examples/studio-room.
- Public status: Rechecked the stable deployment; it still has 0 uploader thumbnails and the old grid-above-tiles ordering. Tested current local app remains at http://127.0.0.1:3214. Existing signed-file drift is unchanged; no full certification is implied.


### Iteration 6 — Publish the verified corrections

- Request: “заливай в версель”, following the notice that the public deployment still had old code. This authorizes updating the existing public Studio Room project.
- Publication: Committed the checked product changes as 7bbce689db4e149da01baf6cd6eca8e045a8d6b1 and pushed normally to docs-new. Vercel's existing Git integration created production dpl_261XdDZ4k7WJWeK3ubpx57LtSFNs and reported READY for that exact commit. No unrelated working changes or project configuration were published.
- Stable URL: https://studio-room-pixelpoint.vercel.app/demos/studio-room. The alias is attached to studio-room-8b4xgi167-pixelpoint.vercel.app.
- Public browser check: HTTP 200, Recraft Studio Room title, 24 loaded uploader thumbnails, 9 loaded room tiles, fine/main grids below tiles, wall above tiles, rotation updates the loaded room image, no page errors.
- Prior focused unit/browser/build checks remain the authority for the implementation; deployment did not rerun aggregate certification or performance. Release evidence is recorded in .toolcraft/browser-artifacts/publication-20260909.json.


### Iteration 7 — Wall fill #F0F4E2

- Request: Change Wall fill to #F0F4E2. Update the existing published app.
- Scope: The room wall fill default and renderer fallback; outer surface background, images and grid remain as before.
- Saved-state behavior: Keep the same persistence key/version and every capability-derived slice. The supported additionalValueTargets allowlist persists one revision marker. A runtime-command hook replaces only the previous default #F1F6DE once, with skipped history; custom colors and future deliberate reuse of #F1F6DE remain valid. No direct product storage access or framework change.
- Verification: Later Tier 2 focused work. Existing values/schema tests updated, 10 passed. The room.wallFill browser regression failed with the old color before implementation, then passed: old-session upgrade, unchanged Depth, real rendered CSS color, custom edit/reload, deliberate old-color edit/reload and Reset to the new default. TypeScript and production build pass. No aggregate gate or performance run.
- Publication: Commit and push only this product change and its evidence through the existing docs-new production integration. Main checkout receives the same product files.
