# Canvas Height Hero Viewport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Toolcraft `Canvas height` determine the visible Recraft hero height and keep the announcement ticker on the hero's bottom edge.

**Architecture:** Preserve the runtime-owned finite canvas as the single dimension source. Let the iframe viewport carry that height into the website, and remove only the website hero's conflicting min/max constraints while retaining its two-row grid.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS utilities, Vitest, TypeScript

---

### Task 1: Reproduce the conflicting viewport-height contract

**Files:**
- Inspect: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`

- [ ] **Step 1: Run a focused source assertion**

Run a one-off Node assertion that reads `hero-v4-styles.tsx`, verifies the hero section uses `h-[calc(100svh-4rem)]` and `grid-rows-[minmax(0,1fr)_5rem]`, and rejects `min-h-160` or `max-h-[63.5rem]`.

- [ ] **Step 2: Confirm the old constraints fail the assertion**

Run from `recraft-v4-styles`:

```bash
node --input-type=module -e "import fs from 'node:fs'; const source=fs.readFileSync('src/components/pages/home/hero-v4-styles.tsx','utf8'); if (!source.includes('h-[calc(100svh-4rem)]') || !source.includes('grid-rows-[minmax(0,1fr)_5rem]') || source.includes('min-h-160') || source.includes('max-h-[63.5rem]')) process.exit(1)"
```

Expected: FAIL because the current section still contains `min-h-160` and `max-h-[63.5rem]`.

### Task 2: Let Canvas Height own visible hero height

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`

- [ ] **Step 1: Remove the conflicting hero height constraints**

Keep the section class equivalent to:

```tsx
className="relative isolate grid h-[calc(100svh-4rem)] grid-rows-[minmax(0,1fr)_5rem] overflow-hidden"
```

The announcement strip remains the second grid child, so its existing 5rem row stays at the bottom of the resized hero.

- [ ] **Step 2: Re-run the focused assertion**

Re-run the exact Node assertion from Task 1.

Expected: PASS.

### Task 3: Record and verify the focused delivery

**Files:**
- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add the delivery decision**

Record that runtime `canvas.size.height` remains the sole owner, the iframe viewport transports the value without a protocol field, the ticker remains the final grid row, and broad verification is excluded.

- [ ] **Step 2: Run light static checks**

Run:

```bash
pnpm typecheck
```

in both `recraft-tools/hero` and `recraft-v4-styles`, then run `git diff --check` at the repository root.

Expected: both typechecks pass and `git diff --check` produces no output.

- [ ] **Step 3: Do not commit without user authorization**

Leave the changes in the shared working tree and keep both development servers running.
