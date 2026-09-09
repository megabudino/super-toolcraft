# Vestaboard Latest Starter Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove and refresh the Vestaboard app against the latest local Creative Apps Kit starter contract while preserving current product logic and behavior.

**Architecture:** Keep the existing Creative Apps Kit product architecture intact: `defineCreativeAppsKit` schema, `CreativeAppsKitApp`, custom Vestaboard `canvasContent`, playback timeline, Settings Transfer, Canvas 2D exports, and app-specific acceptance/performance matrices. Fix only concrete drift found by validators, browser gates, or visual layout audit, using app-level wrappers around the runtime shell instead of route-local shell replacement.

**Tech Stack:** React 19, Vite 8, TypeScript, Vitest, Playwright, local Creative Apps Kit runtime copy.

---

### Task 1: Confirm Static Starter Contract

**Files:**
- Read: `AGENTS.md`
- Read: `docs/creative-apps-kit/assembly-workflow.md`
- Read: `docs/creative-apps-kit/component-rules.md`
- Read: `src/app/app-schema.ts`
- Read: `src/app/app-acceptance.ts`
- Read: `src/app/app-performance.ts`

- [ ] **Step 1: Run workflow skill check**

Run:

```bash
pnpm ai:check
```

Expected: command exits 0 and reports `brainstorming`, `writing-plans`, `systematic-debugging`, and `browser` installed.

- [ ] **Step 2: Run quick starter gate**

Run:

```bash
pnpm verify:quick
```

Expected: docs check passes, Creative Apps Kit integrity passes, and app Vitest suites pass.

### Task 2: Run Full Final Gate

**Files:**
- Read: `package.json`
- Read: `playwright.config.ts`
- Read: `e2e/app-controls.spec.ts`
- Read: `e2e/app-performance.spec.ts`

- [ ] **Step 1: Run final verification**

Run:

```bash
pnpm verify:final
```

Expected: `pnpm ai:check`, `pnpm test`, `pnpm build`, `pnpm test:browser`, and `pnpm test:browser:perf` all pass. Vite may print an existing chunk-size warning after build; that warning is acceptable if the command exits 0.

- [ ] **Step 2: If a check fails, identify the failing surface**

Run the smallest failing command again. Examples:

```bash
pnpm test
pnpm build
pnpm test:browser
pnpm test:browser:perf
```

Expected: the rerun identifies whether the drift is schema/docs, TypeScript/build, browser acceptance, or browser performance. Use `systematic-debugging` before editing any source file.

### Task 3: Apply Only Concrete Drift Fixes

**Files:**
- Modify only if required by a failing check: `src/app/app-schema.ts`
- Modify only if required by a failing check: `src/app/app-acceptance.ts`
- Modify only if required by a failing check: `src/app/app-performance.ts`
- Modify only if required by a visual check: `src/app/canvas-visual-fit-guard.tsx`
- Modify only if required by a failing check: `src/app/vestaboard-renderer.tsx`
- Modify only if required by a failing check: `src/routes/index.tsx`
- Modify only if required by a visual check: `src/styles.css`
- Modify only if required by a failing check: `e2e/app-controls.spec.ts`
- Modify only if required by a failing check: `e2e/app-performance.spec.ts`

- [ ] **Step 1: Preserve shell assembly**

If editing route assembly, keep this shape:

```tsx
<CreativeAppsKitApp
  canvasContent={<VestaboardRenderer />}
  onPanelAction={handlePanelAction}
  renderDefaultCanvasMedia={false}
  schema={appSchema}
/>
```

Expected: no route-level `CreativeAppsKitRoot`, `CanvasShell`, `ControlsPanel`, `TimelinePanel`, `LayersPanel`, or `ToolbarPanel` composition is added.

- [ ] **Step 2: Preserve product output boundary**

If editing renderer output, keep the product output rooted in:

```tsx
<div
  data-creative-apps-kit-product-output=""
  data-testid="vestaboard-output"
>
```

Expected: `canvasContent` contains only product output and product text remains marked with `data-creative-apps-kit-product-text`.

- [ ] **Step 3: Re-run the failing check**

Run the smallest command that failed before the edit.

Expected: the previously failing check passes before moving to the full final gate.

### Task 4: Verify Current Visual Composition

**Files:**
- Read: `src/routes/index.tsx`
- Read: `src/app/vestaboard-renderer.tsx`
- Test: `e2e/app-controls.spec.ts`

- [ ] **Step 1: Run focused panel and visual regression coverage**

Run:

```bash
CREATIVE_APPS_KIT_TEST_PORT=3010 pnpm exec playwright test e2e/app-controls.spec.ts --grep "open controls panel keeps vestaboard output clear|collapsed controls panel|controls panel collapse|toolbar viewport" --workers=1
```

Expected: the minimum-width controls-panel overlap check passes, residual wheel collapse remains stable, playback renderer coalescing remains stable, and toolbar viewport interactions keep the board centered.

- [ ] **Step 2: Browser-smoke deprecated composition absence**

Use Playwright against the reported dev URL and assert:

```ts
await expect(page.locator('[data-testid="vestaboard-header-image"]')).toHaveCount(0);
await expect(page.locator('[data-panel-type="layers"]')).toHaveCount(0);
await expect(page.getByTestId("vestaboard-output")).toBeVisible();
```

Expected: no removed header PNG composition or old Layers panel appears in the current app.

### Task 5: Record Refresh Evidence

**Files:**
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] **Step 1: Add a top verification entry**

Add a new entry under `## Verification`:

```md
- Verification tier: Tier 4. Reason: Refreshed the Vestaboard app against the latest local Creative Apps Kit starter contract without changing product behavior unless validator drift required it.
- Run: `pnpm verify:quick` (local docs, runtime integrity, and app tests passed).
- Run: `pnpm verify:final` (final static, build, browser acceptance, and browser performance gate passed).
- Run: `pnpm dev` (started the refreshed app on the reported free local port).
```

Expected: `docs/creative-apps-kit/agent-worklog.md` remains factual and current.

- [ ] **Step 2: Re-run docs check after worklog edit**

Run:

```bash
node scripts/check-creative-apps-kit-docs.mjs
```

Expected: docs check passes.

### Task 6: Start Dev Server And Browser-Smoke The Actual App

**Files:**
- Read: `scripts/run-vite-on-free-port.mjs`

- [ ] **Step 1: Start dev server**

Run:

```bash
pnpm dev -- --host 127.0.0.1
```

Expected: Vite reports a `Local:` URL. If ports `3002`, `3003`, or `3004` are occupied by other projects, the script automatically chooses the next free port.

- [ ] **Step 2: Verify the reported URL is Vestaboard**

Use Playwright or the browser workflow to load the reported URL and assert:

```ts
await expect(page.getByTestId("vestaboard-output")).toBeVisible();
await expect(page.locator("text=Vestaboard Controls").first()).toBeVisible();
```

Expected: the local URL serves this app, not another project occupying an earlier port.

## Plan Self-Review

- Every command is explicit.
- No placeholder implementation steps are present.
- Source edits are conditional on actual validator or visual drift, matching the no-redesign requirement.
- Final delivery includes `pnpm verify:final`, `pnpm dev`, and browser smoke of the reported URL.
