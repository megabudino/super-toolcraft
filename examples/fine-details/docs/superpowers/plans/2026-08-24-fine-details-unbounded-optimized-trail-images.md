# Fine Details Unbounded Optimized Trail Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkboxes for handoff tracking. Commit steps require explicit user authorization in this workspace.

**Goal:** Remove the explicit Trail Images count cap while sending only one display-sized derivative of each upload to the website preview and rendering it through `next/image`.

**Architecture:** Toolcraft keeps original media unchanged, creates and caches a derivative capped at an 800px card axis, then transfers derivatives to the iframe in bounded batches. The website accepts the full ordered descriptor list, stores derivative object URLs, and uses `next/image` with `unoptimized` for local blob sources.

**Tech Stack:** React, TypeScript, Next.js `Image`, Toolcraft media repository, `postMessage`, Canvas/WebP, Vitest.

---

### Task 1: Remove every product-level 24-image boundary

**Files:**
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.product.test.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-trail-control-sections.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-trail-values.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-preview-boundary.tsx`

- [ ] Add focused tests using at least 25 descriptors and assert that schema, Toolcraft settings, website normalization, and media validation do not reject or truncate them.
- [ ] Run the focused tests and confirm the current cap makes them fail.
- [ ] Remove `hardMaxItems`, advisory bounded wording, both `.slice(0, 24)` calls, the website normalization slice, and the media-message count rejection.
- [ ] Keep per-item validation and the existing live-card `Length` limit intact.
- [ ] Re-run the focused tests.
- [ ] Commit only if the user explicitly requests it.

### Task 2: Build a one-time preview derivative helper

**Files:**
- Create: `recraft-tools/fine-details/src/app/fine-details-preview-image-derivative.ts`
- Create: `recraft-tools/fine-details/src/app/fine-details-preview-image-derivative.test.ts`

- [ ] Add pure dimension tests for portrait, landscape, 90°/270° rotation, no upscaling, and maximum 800px card axis.
- [ ] Run the helper test and confirm it fails because the helper does not exist.
- [ ] Implement rotation normalization and dimension calculation.
- [ ] Implement abort-aware browser decoding and WebP canvas encoding only when the image exceeds the target axis; reuse already bounded blobs.
- [ ] Re-run the helper test.
- [ ] Commit only if the user explicitly requests it.

### Task 3: Transfer derivatives incrementally and cache them

**Files:**
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview-media-sync.tsx`
- Modify: `recraft-tools/fine-details/src/app/fine-details-preview.tsx`

- [ ] Add a derivative cache keyed by resource reference plus quarter-turn orientation and prune it when an asset is removed.
- [ ] Replace the collection-wide `Promise.all` with small concurrency groups.
- [ ] Post completed media in small batches and mark refs sent only after a successful post.
- [ ] Isolate per-image fetch/decode failures and abort stale iframe revisions without posting stale work.
- [ ] Run the focused Toolcraft tests and TypeScript checks relevant to these files.
- [ ] Commit only if the user explicitly requests it.

### Task 4: Simplify the website store for derivative media

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-trail-media-store.ts`

- [ ] Remove the ineffective temporary 2048px bitmap resize that did not alter the retained object URL.
- [ ] Decode each received derivative only to validate it and record its actual intrinsic dimensions.
- [ ] Preserve duplicate handling, object URL revocation, and inactive-resource collection.
- [ ] Run the focused store/component tests.
- [ ] Commit only if the user explicitly requests it.

### Task 5: Render trail cards with Next Image

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail.tsx`
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail-image.test.ts`

- [ ] Add a source-level test requiring `Image` from `next/image`, explicit intrinsic dimensions, `unoptimized`, and no native trail `<img>`.
- [ ] Run the test and confirm it fails against the native element.
- [ ] Replace only the image element, preserving all card geometry, transforms, crop, opacity, shadow, and animation.
- [ ] Re-run the image and motion tests.
- [ ] Commit only if the user explicitly requests it.

### Task 6: Focused handoff verification

**Files:**
- Modify only if needed: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`

- [ ] Run only the targeted Vitest files for the new count, derivative, protocol, and renderer behavior.
- [ ] In the existing local Toolcraft preview, import more than 24 small images and confirm there is no maximum-item error.
- [ ] Move over the canvas and confirm trail cards still appear and cycle.
- [ ] Confirm an oversized source produces a derivative whose card axis is no larger than 800px.
- [ ] Report changed files, targeted checks, and any remaining practical browser-memory limitation. Do not run repository-wide gates unless requested.

## Completion

- [x] Removed every explicit 24-image product cap and silent truncation.
- [x] Added the one-time 800px-axis preview derivative and cache.
- [x] Added bounded four-at-a-time processing and incremental media messages.
- [x] Simplified the website media store to retain the actual derivative.
- [x] Moved trail card rendering to `next/image` without changing geometry.
- [x] Completed the focused tests and the 26-image local browser smoke-check.
- [x] Left the worktree uncommitted as requested by the user's local-first workflow.
