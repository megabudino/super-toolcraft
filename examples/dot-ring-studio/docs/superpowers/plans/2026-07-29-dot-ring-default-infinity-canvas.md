# Dot Ring Studio Default Infinity Canvas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Dot Ring Studio start and reset to Infinity canvas while preserving finite defaults for every existing app that omits the new schema option.

**Architecture:** Add an optional `defaultMode` to editable canvas sizing in the shared Toolcraft runtime, use one resolver for Setup, state creation, and Reset, then regenerate the signed standalone framework copy. Dot Ring Studio opts in through `app-schema.ts`; its renderer and export paths remain unchanged because they already consume runtime canvas mode.

**Tech Stack:** TypeScript, React, Toolcraft runtime schema/state, Vitest, Playwright, pnpm, Vite.

---

### Task 1: Add the shared schema default

**Files:**
- Modify: `/Users/kusnizza/Projects/primeui-v2/packages/toolcraft-runtime/src/schema/types.ts`
- Modify: `/Users/kusnizza/Projects/primeui-v2/packages/toolcraft-runtime/src/schema/runtime-setup-section.ts`
- Modify: `/Users/kusnizza/Projects/primeui-v2/packages/toolcraft-runtime/src/state/create-template-state.ts`
- Modify: `/Users/kusnizza/Projects/primeui-v2/packages/toolcraft-runtime/src/state/canvas-control-target-reducer.ts`
- Test: `/Users/kusnizza/Projects/primeui-v2/packages/toolcraft-runtime/src/schema/define-toolcraft.setup-canvas.test.ts`
- Test: `/Users/kusnizza/Projects/primeui-v2/packages/toolcraft-runtime/src/state/canvas-control-target-reducer.test.ts`

- [ ] **Step 1: Write failing schema and state tests**

Add an editable-output schema with `defaultMode: "infinite"` and assert that
the generated `canvas.infinity` control defaults to `true`, fresh state is
infinite, and Reset returns a changed finite state to infinite. Keep the
existing omitted-option assertion at `false`/finite.

- [ ] **Step 2: Run the focused tests and confirm the missing option fails**

Run:

```bash
pnpm --filter @repo/toolcraft-runtime test -- define-toolcraft.setup-canvas.test.ts canvas-control-target-reducer.test.ts
```

Expected: FAIL because `ToolcraftCanvasSizingSchema` has no `defaultMode` and
runtime state/reset still hardcode finite.

- [ ] **Step 3: Implement the minimal runtime contract**

Add:

```ts
export type ToolcraftCanvasSizingSchema = {
  defaultMode?: "finite" | "infinite";
  mode: ToolcraftCanvasSizingMode;
};
```

Resolve Infinity's switch default from
`canvas.sizing.defaultMode === "infinite"`, use the same fallback when
`initialState.canvas?.mode` is absent, and make the canvas Reset patch restore
that resolved mode rather than hardcoding `"finite"`.

- [ ] **Step 4: Run focused runtime tests and typecheck**

Run:

```bash
pnpm --filter @repo/toolcraft-runtime test -- define-toolcraft.setup-canvas.test.ts canvas-control-target-reducer.test.ts
pnpm --filter @repo/toolcraft-runtime typecheck
```

Expected: both commands PASS.

### Task 2: Opt Dot Ring Studio into the new default

**Files:**
- Modify: `/Users/kusnizza/Projects/toolcraft-apps/dot-ring-studio/src/app/app-schema.ts`
- Modify: `/Users/kusnizza/Projects/toolcraft-apps/dot-ring-studio/src/app/app-schema.test.ts`
- Modify: `/Users/kusnizza/Projects/toolcraft-apps/dot-ring-studio/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Write the failing product assertion**

Assert:

```ts
expect(appSchema.canvas.sizing).toEqual({
  defaultMode: "infinite",
  mode: "editable-output",
});
expect(createToolcraftState(appSchema).canvas.mode).toBe("infinite");
```

- [ ] **Step 2: Set the app schema default**

Change the sizing declaration to:

```ts
sizing: { defaultMode: "infinite", mode: "editable-output" },
```

- [ ] **Step 3: Record the decision trail**

Add one ordinary-product-work entry describing the schema-owned default,
persistence precedence, unchanged renderer/export mapping, Tier 4 framework
refresh, bare delivery gate, and no performance-audit authority.

### Task 3: Refresh the signed generated framework

**Files:**
- Refresh signed framework files in: `/Users/kusnizza/Projects/toolcraft-apps/dot-ring-studio`
- Preserve product files under: `/Users/kusnizza/Projects/toolcraft-apps/dot-ring-studio/src/app`

- [ ] **Step 1: Generate a fresh standalone Toolcraft app in a temporary folder**

Use `/Users/kusnizza/Projects/primeui-v2/cli/bin/create-toolcraft-app.mjs` and
the established framework-refresh allowlist so the integrity manifest matches
the modified shared runtime.

- [ ] **Step 2: Copy only generated/signed framework files**

Preserve Dot Ring product modules, product tests, public assets, worklog, spec,
plan, package identity, and protected delivery state.

- [ ] **Step 3: Run focused product tests**

Run:

```bash
pnpm test -- src/app/app-schema.test.ts src/app/dot-ring-scene-bounds.test.ts
```

Expected: PASS with a fresh infinite state and unchanged finite/infinite bounds.

### Task 4: Verify, sync, publish, and deploy

**Files:**
- Sync source app to: `/Users/kusnizza/Projects/toolcraft-website/primeui-v2/examples/dot-ring-studio`

- [ ] **Step 1: Run the protected standalone delivery**

Run:

```bash
TOOLCRAFT_TEST_PORT=3100 npm run verify:delivery
```

Expected: PASS with a current protected delivery receipt.

- [ ] **Step 2: Verify the running app in a clean browser workspace**

Clear only this app's persisted workspace, load the app, assert the canvas
reports infinite mode and finite sizing controls are hidden, switch finite,
invoke Reset, and assert infinite mode is restored.

- [ ] **Step 3: Sync source into the website example and build**

Copy the verified standalone source without local caches, receipts, or
dependencies, then run:

```bash
npm run build -- --base /demos/dot-ring-studio/
```

Expected: Vite production build PASS.

- [ ] **Step 4: Commit and push only Circles Animation changes**

Commit the updated example on `docs-new`, preserving unrelated Grass changes,
then push `origin/docs-new`.

- [ ] **Step 5: Deploy the standalone Vercel project**

Deploy `pixelpoint/dot-ring-studio` from the website monorepo and inspect the
deployment until Ready. Verify the stable production alias serves
`/demos/dot-ring-studio/`.
