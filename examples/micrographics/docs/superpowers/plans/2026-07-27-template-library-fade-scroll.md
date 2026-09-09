# Template Library Fade Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cap the Template Library grid at ten visible rows and scroll the remaining tiles through Toolcraft ScrollFade.

**Architecture:** The custom control keeps its label and tier toggle outside the scroll viewport. A ResizeObserver derives the ten-row maximum from the actual tile height and CSS row gap, while Toolcraft `ScrollFade` owns overflow, scrollbar, and terminal fades.

**Tech Stack:** React, TypeScript, CSS Modules, Toolcraft UI, Playwright.

---

### Task 1: Add the failing browser layout assertion

**Files:**
- Modify: `e2e/app-canvas.spec.ts`

- [ ] **Step 1: Assert the custom control's scroll contract**

In `browser: direct micrographics placement`, locate the template field's scroll viewport and assert:

```ts
const scroller = templateField.getByTestId("template-library-scroll");
await expect(scroller).toHaveAttribute("data-max-visible-rows", "10");
const metrics = await scroller.evaluate((node) => ({
  clientHeight: node.clientHeight,
  scrollHeight: node.scrollHeight,
}));
expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
```

Also scroll the viewport, verify `scrollTop > 0`, switch tiers, and verify `scrollTop === 0`.

- [ ] **Step 2: Run the focused browser test**

Run:

```bash
npm run test:browser -- --grep "browser: direct micrographics placement"
```

Expected: fail because no template-library ScrollFade viewport exists.

### Task 2: Implement the ten-row ScrollFade

**Files:**
- Modify: `src/app/template-library-control.tsx`
- Modify: `src/app/template-library-control.module.css`

- [ ] **Step 1: Add measured row sizing**

Export `TEMPLATE_LIBRARY_MAX_VISIBLE_ROWS = 10`. Attach refs to the grid and ScrollFade viewport. Use `ResizeObserver` to read the first tile height and computed row gap, then set the maximum viewport height to:

```ts
tileHeight * TEMPLATE_LIBRARY_MAX_VISIBLE_ROWS +
  rowGap * (TEMPLATE_LIBRARY_MAX_VISIBLE_ROWS - 1)
```

- [ ] **Step 2: Wrap only the grid in Toolcraft ScrollFade**

Import `ScrollFade` from `@/toolcraft/ui`. Render the grid inside it with bottom-side terminal fade, opposite-side fade enabled, tier/height watches, and `data-testid="template-library-scroll"`.

- [ ] **Step 3: Reset scroll after tier change**

When Simple/Mega changes, set the viewport's `scrollTop` to zero. Keep button click, pressed state, native drag data, and one-shot placement unchanged.

- [ ] **Step 4: Add locally anchored CSS**

Give the ScrollFade viewport `min-width: 0`, overscroll containment, and bottom padding equal to the grid gap so the final row clears the fade.

### Task 3: Record and verify the delivery

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Record Iteration 23**

Document the ten-row cap, ScrollFade choice, preserved interactions, Tier 1 classification, focused browser evidence, and no renderer/performance impact.

- [ ] **Step 2: Run development checks**

Run:

```bash
npm run typecheck
npm run test:browser -- --grep "browser: direct micrographics placement"
```

Expected: typecheck and direct-placement browser acceptance pass.

- [ ] **Step 3: Run exact protected delivery**

Run:

```bash
npm run verify:delivery -- --tier=1 --browser-test="browser: direct micrographics placement"
```

Expected: integrity, AI checks, docs, typecheck, build, and targeted browser acceptance pass.

- [ ] **Step 4: Confirm the server**

Run `npm run dev` and confirm the saved Toolcraft URL.

