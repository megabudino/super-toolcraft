# Template Library Scroll Chaining Implementation Plan

> **For agentic workers:** Execute this plan inline in the current generated app. The Toolcraft contract already authorizes the requested bug fix; do not dispatch subagents or modify the signed runtime.

**Goal:** Let wheel and trackpad scrolling continue from the bottom or top of the ten-row Template Library into the containing controls panel.

**Architecture:** Keep the shared `ScrollFade` primitive and all existing template behavior. Override only this custom control's vertical overscroll policy to `auto`, so the browser performs native scroll chaining while the shared primitive retains containment everywhere else.

**Tech Stack:** React, CSS Modules, Toolcraft `ScrollFade`, Playwright.

**Verification tier: Tier 2**

**Reason:** One custom control's nested scroll behavior changes; runtime state, renderer output, and workload boundaries are unchanged.

---

### Task 1: Reproduce scroll-chain blocking in browser coverage

**Files:**

- Create: `e2e/app-template-library-scroll.spec.ts`

- [ ] Add a focused Playwright scenario named
  `browser: template library scroll chains into controls panel`.

- [ ] Navigate to the real app, locate
  `[data-testid="template-library-scroll"]` and
  `[data-slot="toolcraft-panel-content"]`, bring the library into view, and
  set the library viewport to its maximum `scrollTop`.

- [ ] Hover the library and issue additional downward wheel input.

- [ ] Assert the library remains at its maximum while the outer panel
  `scrollTop` increases.

- [ ] Assert `data-max-visible-rows="10"` remains present.

- [ ] Run:

```bash
npx playwright test e2e/app-template-library-scroll.spec.ts --reporter=line
```

Expected before the fix: failure because the outer panel does not move.

### Task 2: Restore native chaining for this custom viewport

**Files:**

- Modify: `src/app/template-library-control.tsx`
- Modify: `src/app/template-library-control.module.css`

- [ ] Change the `ScrollFade` viewport style to always include:

```tsx
{
  maxHeight:
    maxGridHeight === undefined ? undefined : `${maxGridHeight}px`,
  overscrollBehaviorY: "auto",
}
```

- [ ] Remove the product CSS rule:

```css
.scroller {
  overscroll-behavior: contain;
}
```

- [ ] Do not add a `wheel` handler, parent DOM lookup, or runtime change.

### Task 3: Verify the real nested-scroll behavior

**Files:**

- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] Re-run:

```bash
npx playwright test e2e/app-template-library-scroll.spec.ts --reporter=line
```

Expected after the fix: one passed test.

- [ ] Run focused type and schema checks:

```bash
npm run typecheck
npx vitest run src/app/app-schema.test.ts --reporter=default
```

- [ ] Record the root cause, selected native-chaining fix, rejected manual
  forwarding approach, focused checks, skipped performance audit, and risks in
  the worklog.

- [ ] Run the protected targeted delivery once:

```bash
npm run verify:delivery -- --tier=2 --unit-test="src/app/app-schema.test.ts" --browser-test="browser: template library scroll chains into controls panel"
```

- [ ] Restart the saved app server:

```bash
npm run dev:restart
```
