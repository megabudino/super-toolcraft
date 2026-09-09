# Grass Studio Settings 20 Start State Implementation Plan

> **For agentic workers:** Execute these steps inline in the current Toolcraft worktree. Do not delegate because the active project instructions require one coherent owner for this edit.

**Goal:** Make `/Users/kusnizza/Downloads/grass-studio-settings (20).json` the clean-load and Reset state of Grass Studio.

**Architecture:** Keep the existing complete `grassDefaults` record as the fallback for newer targets, then overlay a focused `grassStartStateV21` record generated from every compatible exported value. The schema keeps its already matching canvas/timeline setup and advances the localStorage namespace to v21 so the requested defaults are visible immediately.

**Tech Stack:** TypeScript, Toolcraft schema/default controls, Vitest, Playwright.

---

### Task 1: Lock the imported state contract

**Files:**
- Create: `src/app/grass/grass-start-state.test.ts`
- Create: `src/app/grass/grass-start-state.ts`

- [ ] Add a focused test that iterates `Object.entries(grassStartStateV21)` and asserts every value is the corresponding final `grassDefaults` value.
- [ ] Assert key scene sentinels from the source file: Tall density `24000`, Lawn density `36000`, Terrain seed `86`, Environment exposure `151`, butterfly landing time `1.5`, and background `#88BB77`.
- [ ] Assert the overlay has exactly 240 compatible product targets so accidental omissions are visible.
- [ ] Run `npx vitest run src/app/grass/grass-start-state.test.ts` and confirm the test fails before the start-state module is wired into defaults.

### Task 2: Apply all compatible exported values

**Files:**
- Create: `src/app/grass/grass-start-state.ts`
- Modify: `src/app/grass/grass-defaults.ts`
- Modify: `src/app/app-performance-impact.json`

- [ ] Generate `grassStartStateV21` from the source JSON `values`, excluding only `canvas.aspectRatio`, `canvas.size.width`, `canvas.size.height`, `canvas.renderScale`, and `environment.hdriFile`.
- [ ] Normalize any single-field `{ hex: string }` color object to the equivalent schema string and preserve vectors, ranges, gradients, and nullable values unchanged.
- [ ] Rename the existing default object to an internal fallback, then export the final object:

```ts
export const grassDefaults = {
  ...grassFallbackDefaults,
  ...grassStartStateV21,
} as const;
```

- [ ] Add `grass-start-state.ts` to the performance impact inventory with the same existing renderer pass ownership as `grass-defaults.ts`; do not add a new pass or workload maximum.
- [ ] Run the focused start-state test and confirm all 240 mappings pass.

### Task 3: Advance persistence and align fixtures

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/grass-product-delivery.test.ts`
- Modify: `e2e/grass-surface-bend.spec.ts`

- [ ] Change the persistence key to `toolcraft:grass-studio:state:v21` and version to `21`.
- [ ] Update the product-delivery expectation and the retained-state browser fixture to the same v21 identity.
- [ ] Keep canvas size `1920×1080`, render scale `2`, timeline duration `6`, loop behavior, and paused initial playback unchanged.
- [ ] Run:

```bash
npx vitest run src/app/grass/grass-start-state.test.ts src/app/grass-product-delivery.test.ts
```

Expected: both files pass.

### Task 4: Record and verify the delivery

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] Record the source settings file, 240-value mapping, preserved newer defaults, v21 persistence decision, workload changes, and skipped full performance checkpoint.
- [ ] Run `npm run typecheck`, `npm run ai:check`, the focused default/schema tests, and `npm run build`.
- [ ] Start or reuse the app server and verify in Chromium that a clean v21 load reports the imported key diagnostics and layer state.
- [ ] Do not run a full performance checkpoint because the request is not explicit performance work.
