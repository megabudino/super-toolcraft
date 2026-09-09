# Image-only Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all product presentation chrome and external-source metadata while preserving the configurable physical image-card gallery.

**Architecture:** Keep the existing retained WebGL resource and its two placement branches. Delete DOM/Canvas 2D overlay composition, simplify background composition to an optional flat fill, and reclassify the acceptance/performance metadata as a product-authored image gallery.

**Tech Stack:** React 19, TypeScript, Toolcraft runtime schema, retained WebGL, Canvas 2D export, Vitest, Playwright.

---

### Task 1: Lock the image-only product contract

**Files:**
- Modify: `src/app/spiral-gallery-product.test.ts`
- Modify: `src/app/app-acceptance-data.ts`

- [ ] **Step 1: Replace reference-clone assertions with product-authored assertions**

Assert that `appTransferMode.mode` is `new-toolcraft-app`, the product name is
`Image Gallery`, no acceptance target starts with `overlay.`, and the schema has
no section titled `Overlay`.

- [ ] **Step 2: Add the output-content contract**

Assert that the product source contains no retired branding, external URL,
legacy study metadata, product title element, pagination-dot element, hint,
vignette, or stack shadow.

- [ ] **Step 3: Run the focused test and confirm it fails**

Run:

```bash
npx vitest run src/app/spiral-gallery-product.test.ts
```

Expected: failure on the old product identity, reference transfer mode, overlay
controls, and decorative source strings.

### Task 2: Remove presentation controls and rename visible product UI

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/spiral-gallery/spiral-gallery-settings.ts`

- [ ] **Step 1: Rename the visible product**

Set the controls title to `Image Gallery`, rename layout choices and geometry
section titles to `Flow` and `Deck`, and remove copy that describes an external
source or an optional extension.

- [ ] **Step 2: Remove presentation state**

Delete the `Overlay` section, delete `view.vignette`, remove the `overlay` and
`vignette` fields from `SpiralGallerySettings`, and remove their state readers.

- [ ] **Step 3: Make image-only output the default**

Set `export.includeBackground.defaultValue` to `false`, retain the required
optional flat background color, rename the persistence key to
`toolcraft:image-gallery:state:v2`, and bump the persistence version to `2`.

- [ ] **Step 4: Run the focused test**

Run:

```bash
npx vitest run src/app/spiral-gallery-product.test.ts
```

Expected: metadata checks may still fail, but schema and settings presentation
checks pass.

### Task 3: Strip the canvas and export down to images

**Files:**
- Modify: `src/app/spiral-gallery/spiral-gallery-canvas.tsx`
- Modify: `src/app/spiral-gallery/spiral-gallery-resource.ts`
- Modify: `src/app/spiral-gallery/spiral-gallery-export.ts`
- Modify: `src/app/spiral-gallery/spiral-gallery.module.css`

- [ ] **Step 1: Remove DOM presentation**

Delete active file-name lookup, title/kicker blocks, index counters, hints,
pagination dots, stack shadow, vignette, and their CSS variables/data
attributes. Keep only the optional flat background element and the WebGL canvas.

- [ ] **Step 2: Remove exported presentation**

Delete title wrapping, stack shadow drawing, flow/deck overlay drawing, and all
font/text Canvas 2D calls. Make `drawBackground` a flat fill and composite only
the background (when included) plus the WebGL card canvas.

- [ ] **Step 3: Neutralize product-facing names**

Use `data-image-gallery-*` selectors, neutral canvas aria labels, generic export
errors, and `image-gallery.<format>` download names. Remove source-comparison
comments from the interaction code.

- [ ] **Step 4: Preserve physical behavior**

Do not change the centered modulo placement, sine/cosine layout, permanent card
curve, velocity-signed flex, inertia, snapping, press feedback, deck placement,
or WebGL shader equations.

- [ ] **Step 5: Run focused renderer tests**

Run:

```bash
npx vitest run src/app/spiral-gallery/spiral-gallery-stack.test.ts src/app/spiral-gallery-product.test.ts
```

Expected: both files pass.

### Task 4: Reclassify acceptance and performance metadata

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-performance-impact.json`

- [ ] **Step 1: Set product-authored transfer metadata**

Replace the legacy clone inventory and motion study with:

```ts
export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
};
```

- [ ] **Step 2: Rewrite product readiness**

Use `Image Gallery`, describe the two physical image layouts without external
source language, and cite the user's request to retain current behavior as
`explicit-user-request` evidence for the fixed camera.

- [ ] **Step 3: Remove obsolete acceptance**

Delete overlay control rows, title/dot/shadow runtime rows, reference coverage
rows, and the `Overlay` control inventory entry. Rename remaining browser test
titles and observables to `image gallery`, `Flow`, and `Deck`.

- [ ] **Step 4: Update the renderer technique matrix**

Remove the DOM text layer and typography fidelity risk, rename product layer IDs
and selectors to `image-gallery`, set `sourceRepresentation` to `image-media`,
and describe preview/export parity as WebGL cards plus an optional flat
background.

- [ ] **Step 5: Keep performance ownership exact**

Confirm every modified production module remains listed in
`app-performance-impact.json` with the same exact affected renderer pass IDs;
change entries only if a selector/module responsibility changed.

### Task 5: Update product-owned browser proof

**Files:**
- Modify: `e2e/spiral-gallery.spec.ts`
- Modify: `e2e/stack-gallery.spec.ts`
- Modify: `e2e/spiral-gallery-test-helpers.ts`
- Modify: `e2e/app-performance-path-adapters.ts`

- [ ] **Step 1: Rename browser test titles and selectors**

Match the acceptance metadata exactly, switch selectors to
`data-image-gallery-*`, and update layout button labels from `Spiral`/`Stack` to
`Flow`/`Deck`.

- [ ] **Step 2: Replace overlay assertions**

Assert that no `[data-toolcraft-product-text]`, headings, dot rails, hint text,
stack shadow, or vignette exists after images load in either layout.

- [ ] **Step 3: Keep behavior and export assertions**

Continue proving image upload/order, both layout branches, navigation, physical
flex, background include/exclude, PNG/JPG bytes, resolution, persistence, and
viewport behavior. Update the expected download filename to
`image-gallery.<format>`.

- [ ] **Step 4: Run targeted browser checks**

Run the exact renamed image-only, controls, deck navigation, export, persistence,
and interaction tests through the generated Playwright command.

Expected: each selected test passes and emits protected evidence for the matching
acceptance rows.

### Task 6: Sanitize product documentation and deliver

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`
- Keep: `docs/plans/2026-07-28-image-only-gallery.md`
- Keep: `docs/plans/2026-07-28-image-only-gallery-implementation.md`

- [ ] **Step 1: Rewrite the worklog**

Record the current request, Tier 4 note, image-only result, retained physical
behavior, removed presentation, files changed, targeted checks, protected
delivery result, and skipped full performance certification. Remove external
URLs, source bundle names, copied-brand language, video-study prose, and stale
overlay decisions.

- [ ] **Step 2: Search the product-owned surface**

Search product-owned source, tests, plans, and the worklog for external URLs,
retired branding, capture filenames, clone metadata, and motion-study prose.
Expected: no source-identifying matches.

- [ ] **Step 3: Run focused unit and type checks**

Run:

```bash
npx vitest run src/app/spiral-gallery-product.test.ts src/app/spiral-gallery/spiral-gallery-stack.test.ts
npm run typecheck
```

Expected: all checks pass.

- [ ] **Step 4: Run the protected delivery gate once**

Run:

```bash
npm run verify:delivery
```

Expected: a successful ordinary targeted delivery receipt for the changed
functional and renderer surfaces.

- [ ] **Step 5: Restart and visually inspect the app**

Run:

```bash
npm run dev:restart
```

Open the verified local URL and confirm both layouts contain only uploaded image
cards, the Toolcraft canvas backing remains visible, all retained controls affect
the cards, and export contains no product text or decorative chrome.
