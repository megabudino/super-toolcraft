# Vestaboard Bottom Highlight Glow Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Bottom opacity` read as a real lower-edge highlight on each cell instead of a flat 1px line.

**Architecture:** Keep the existing schema, seeded model, and controls. Change only the visual rendering technique: DOM preview uses a bottom-edge highlight layer with a crisp edge plus soft gradient/glow, and Canvas 2D export draws matching stacked highlight strokes at the cell bottom.

**Tech Stack:** Creative Apps Kit schema, React DOM preview, Canvas 2D PNG export, Playwright browser tests.

---

### Task 1: Prove Highlight Rendering

**Files:**
- Modify: `e2e/app-controls.spec.ts`

- [ ] **Step 1: Add a browser assertion for highlight styling**

In `browser: bottom opacity range changes cell lower-edge highlights`, after measuring the highlight box, read computed styles from `vestaboard-bottom-highlight-0-0`:

```ts
const highlightStyle = await page
  .getByTestId("vestaboard-bottom-highlight-0-0")
  .evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      height: Number.parseFloat(style.height),
    };
  });

expect(highlightStyle.backgroundImage).toContain("linear-gradient");
expect(highlightStyle.boxShadow).not.toBe("none");
expect(highlightStyle.height).toBeGreaterThan(1);
```

- [ ] **Step 2: Run the test to verify the current flat line fails**

Run:

```bash
CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm exec playwright test e2e/app-controls.spec.ts --grep "bottom opacity range changes cell lower-edge highlights"
```

Expected: FAIL because the current element uses a flat background color, no shadow, and `1px` height.

### Task 2: Render Highlight As Glow

**Files:**
- Modify: `src/app/vestaboard-renderer.tsx`
- Modify: `src/app/vestaboard-model.ts`

- [ ] **Step 1: Update DOM preview highlight**

Keep the highlight anchored to the cell bottom edge, but change it from a 1px solid background to a 4px layer:

```tsx
const highlightColor = getVestaboardRgbaColorFromParts(
  settings.cellBorder.hex,
  cell.bottomHighlightOpacity,
);
const highlightGlowColor = getVestaboardRgbaColorFromParts(
  settings.cellBorder.hex,
  cell.bottomHighlightOpacity * 0.5,
);
```

Use a gradient background and box shadow:

```tsx
backgroundImage: `linear-gradient(to top, ${highlightColor} 0px, ${highlightColor} 1px, ${highlightGlowColor} 2px, transparent 4px)`,
bottom: -1,
boxShadow: `0 0 4px ${highlightGlowColor}`,
height: 4,
left: -1,
right: -1,
```

- [ ] **Step 2: Update Canvas 2D export highlight**

Replace the single bottom stroke with a small loop that draws the edge and glow above it:

```ts
const lineInset = Math.min(1, Math.max(0, model.cellRadius / 6));
const highlightSteps = [
  { alpha: 1, offset: 0.5, width: 1 },
  { alpha: 0.5, offset: 1.5, width: 1 },
  { alpha: 0.25, offset: 2.5, width: 1 },
] as const;
for (const step of highlightSteps) {
  context.strokeStyle = getVestaboardRgbaColorFromParts(
    settings.cellBorder.hex,
    cell.bottomHighlightOpacity * step.alpha,
  );
  context.lineWidth = step.width;
  context.beginPath();
  context.moveTo(cell.x + lineInset, cell.y + model.cellHeight - step.offset);
  context.lineTo(cell.x + model.cellWidth - lineInset, cell.y + model.cellHeight - step.offset);
  context.stroke();
}
```

### Task 3: Verify

**Files:**
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Run focused browser test**

Run:

```bash
CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm exec playwright test e2e/app-controls.spec.ts --grep "bottom opacity range changes cell lower-edge highlights"
```

Expected: PASS.

- [ ] **Step 2: Run quick and final gates**

Run:

```bash
pnpm verify:quick
CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm verify:final
```

Expected: PASS.

- [ ] **Step 3: Update worklog**

Record that bottom highlight is now rendered as a lower-edge glow in DOM preview and Canvas 2D export, with browser coverage for gradient/shadow and edge alignment.
