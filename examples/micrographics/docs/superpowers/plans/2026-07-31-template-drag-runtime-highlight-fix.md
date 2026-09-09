# Template Drag Runtime Highlight Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the generic blue runtime upload highlight during Micrographics template drag-and-drop while preserving template placement and Source Photo uploads.

**Architecture:** Give the product canvas exclusive ownership of template drag-and-drop by disabling the overlapping generic runtime canvas upload surface. Keep source-photo import on its existing panel file-drop control and cover the held-drag phase with a real browser regression before mouse release.

**Tech Stack:** React, TypeScript, Toolcraft schema, native HTML Drag and Drop, Playwright.

---

### Task 1: Add the held-drag regression

**Files:**
- Modify: `e2e/app-canvas.spec.ts`

- [ ] **Step 1: Replace the after-drop-only template drag with a manual native drag**

Measure the template button, runtime canvas, and poster. Move the mouse from the template to a point inside the runtime canvas but outside the poster, keep the mouse pressed, and assert the runtime never enters its upload state:

```ts
const barcodeBox = await barcodeButton.boundingBox();
const runtimeBox = await runtimeCanvas.boundingBox();
if (!barcodeBox || !runtimeBox) {
  throw new Error("Could not measure the template drag surfaces.");
}
const canvasMarginPoint = {
  x: runtimeBox.x + 8,
  y: runtimeBox.y + 8,
};
await page.mouse.move(
  barcodeBox.x + barcodeBox.width / 2,
  barcodeBox.y + barcodeBox.height / 2,
);
await page.mouse.down();
await page.mouse.move(canvasMarginPoint.x, canvasMarginPoint.y, { steps: 12 });
await expect(runtimeCanvas).toHaveAttribute("data-drag-over", "false");
await page.mouse.move(
  posterBox.x + posterBox.width * 0.72,
  posterBox.y + posterBox.height * 0.26,
  { steps: 12 },
);
await expect(runtimeCanvas).toHaveAttribute("data-drag-over", "false");
await page.mouse.up();
```

- [ ] **Step 2: Run the focused browser scenario and prove the current behavior fails**

Run:

```bash
npx playwright test e2e/app-canvas.spec.ts --grep "browser: direct micrographics placement" --workers=1
```

Expected: FAIL before mouse release because the runtime canvas becomes `data-drag-over="true"` while the template crosses its margin.

### Task 2: Remove the competing canvas upload surface

**Files:**
- Modify: `src/app/app-schema.ts`

- [ ] **Step 1: Give template drag exclusive canvas ownership**

Change the canvas capability to:

```ts
canvas: {
  draggable: true,
  enabled: true,
  renderScale: false,
  size: { height: 1350, unit: "px", width: 1080 },
  sizing: { mode: "editable-output" },
  upload: false,
},
```

Do not change `source.image`; the Source Photo `fileDrop` remains the supported image-import surface.

- [ ] **Step 2: Re-run the focused browser scenario**

Run:

```bash
npx playwright test e2e/app-canvas.spec.ts --grep "browser: direct micrographics placement" --workers=1
```

Expected: PASS. The runtime remains `data-drag-over="false"` while held over the margin and poster, and the Barcode template appears after release.

### Task 3: Record and deliver the verified fix

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Complete the Decision Trail entry**

Record the reproduced held-drag failure, ownership decision, exact files changed, focused browser result, protected delivery result, and the retained Source Photo upload path.

- [ ] **Step 2: Run the protected delivery gate once**

Run `npm run verify:delivery` with Tier 3, `--browser-test="browser: direct micrographics placement"`, and every exact performance selector required by `src/app/app-performance-impact.json` for the changed files.

Expected: the protected targeted delivery receipt passes.

- [ ] **Step 3: Confirm the saved development server**

Run:

```bash
npm run dev
```

Expected: Toolcraft reports the Micrographics app on its saved localhost port.

- [ ] **Step 4: Commit and publish only Micrographics changes**

Stage only `examples/micrographics`, commit the regression and fix, push `docs-new`, wait for the Git-connected Micrographics Vercel preview, then promote that verified deployment to production.
