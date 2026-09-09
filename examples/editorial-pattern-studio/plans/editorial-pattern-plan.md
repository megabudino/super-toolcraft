# Expanded Equation Studio Implementation Plan

> **For agentic workers:** Execute inline in this standalone Toolcraft folder. No git commit steps apply because the folder is not a git repository.

**Goal:** Expand Editorial Pattern Studio with twelve closed equation systems, five expressive shared variables, deterministic short multicolor segmentation, and a contrast-aware palette Shuffle action.

**Architecture:** Split procedural math out of the current large renderer into equation, segmentation, and palette modules. Keep all final settings in Toolcraft schema state, consume identical generated segments in SVG preview and Canvas export, and route the local Shuffle action through `ToolcraftApp onPanelAction` plus `controls.setValue` commands.

**Tech stack:** React, TypeScript, Toolcraft runtime/schema, SVG preview, Canvas 2D export, Vitest, Playwright.

---

### Task 1: Lock equation and palette behavior with unit tests

**Files:**
- Modify: `src/app/app-schema.test.ts`
- Create: `src/app/pattern-equations.ts`
- Create: `src/app/pattern-segmentation.ts`
- Create: `src/app/palette-harmonies.ts`

- [ ] Add tests that import `equationOptions`, `sampleEquationPoints`, `buildPatternSegments`, and `createHarmoniousPalette`.
- [ ] Assert twelve equation ids and labels, closure within `0.001`, and finite normalized points for every equation.
- [ ] For each shared variable, sample a baseline and changed value and assert a point-cloud signature changes materially.
- [ ] Assert segmentation is deterministic, covers the closed point list, produces at least 180 segments at the default `0.50%`, produces more segments at `0.35%`, varies lengths when Randomness rises, and uses all three indices when Color spread is high.
- [ ] Assert repeated palette generation changes the palette, stays deterministic for identical input, produces valid uppercase hex colors, and gives the line palette useful contrast against both light and dark backgrounds.
- [ ] Run `npx vitest run src/app/app-schema.test.ts` and confirm the new imports fail before implementation.

The public module contracts are:

```ts
export type EquationId =
  | "harmonic-halo"
  | "coupled-pendulum"
  | "magnetic-orbit"
  | "standing-wave"
  | "torus-knot"
  | "hypotrochoid"
  | "duffing-trace"
  | "vortex-ring"
  | "wave-packet"
  | "membrane-mode"
  | "superformula"
  | "shell-interference";

export type EquationParameters = {
  coupling: number;
  phase: number;
  resonance: number;
  symmetry: number;
  warp: number;
};

export function sampleEquationPoints(
  equation: EquationId,
  parameters: EquationParameters,
  detail: number,
): readonly (readonly [number, number])[];

export type PatternSegment = {
  colorIndex: 0 | 1 | 2;
  d: string;
  points: readonly (readonly [number, number])[];
};

export function buildPatternSegments(
  points: readonly (readonly [number, number])[],
  options: { colorSpread: number; randomSeed: number; randomness: number; segmentSize: number },
): readonly PatternSegment[];

export function createHarmoniousPalette(
  current: readonly [string, string, string],
  background: string,
): readonly [string, string, string];
```

### Task 2: Implement closed equation sampling

**Files:**
- Create: `src/app/pattern-equations.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] Define `equationOptions` with the twelve visible labels from the spec.
- [ ] Normalize Symmetry to `2..16`, Resonance to `1..16`, Coupling/Warp to `0..100`, Phase to degrees, and Detail to `800..12000`.
- [ ] Derive integer `n`, integer `m = n + resonance`, `c`, `φ`, and `w` once per sample pass.
- [ ] Implement each equation as a pure `(t, normalizedParameters) => [x,y]` evaluator that consumes all five variables.
- [ ] Sample `0..2π` inclusively, calculate bounds, and normalize around the curve center to a stable `[-1,1]`-like range while preserving aspect.
- [ ] Generate a concise two-line display label containing the active system and substituted `n`, `m`, `c`, `φ`, and `w`.
- [ ] Run the equation unit tests until all twelve closure and sensitivity checks pass.

### Task 3: Implement deterministic short segmentation

**Files:**
- Create: `src/app/pattern-segmentation.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] Add a small seeded PRNG whose seed is a stable 32-bit integer.
- [ ] Convert Segment size percent into a base point count, clamped so every segment has at least two points.
- [ ] Jitter each length between a bounded short and long factor according to Randomness while advancing until the entire point list is covered.
- [ ] Assign `colorIndex` with a spread-controlled transition probability and a balancing rule that prevents one palette color from disappearing.
- [ ] Include the previous segment endpoint as the next segment start so adjacent colored strokes have no geometric gaps.
- [ ] Build both SVG `d` and point arrays once so preview and export consume the same boundaries.
- [ ] Run the deterministic, count, length-variance, and color-distribution tests.

### Task 4: Implement harmony shuffle

**Files:**
- Create: `src/app/palette-harmonies.ts`
- Modify: `src/app/editorial-pattern-renderer.tsx`
- Test: `src/app/app-schema.test.ts`

- [ ] Hash the current three-color tuple, advance the base hue by the golden angle, and select analogous, triadic, or split-complementary offsets from the hash.
- [ ] Parse the current background and determine whether the generated palette needs light or dark line roles.
- [ ] Convert bounded HSL roles to uppercase hex and verify contrast constraints in unit tests.
- [ ] Refactor `handleEditorialPatternPanelAction` so `shuffle-palette` synchronously dispatches three labeled `controls.setValue` commands, while `export-png` still returns its real async export Promise.
- [ ] Assert the local action changes all palette colors without affecting editorial ink or background.

The action dispatch shape is:

```ts
dispatch({
  label: "Shuffle line palette",
  target: "pattern.colorA",
  type: "controls.setValue",
  value: nextPalette[0],
});
```

Repeat for `pattern.colorB` and `pattern.colorC`.

### Task 5: Replace the schema control model

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] Replace Equation `segmented` with a full-width `select` using all twelve options.
- [ ] Create `Field Equation` with Equation, discrete Symmetry, discrete Resonance, continuous Coupling, Phase, and Warp.
- [ ] Create `Line Form` with Position, Scale, Detail, and Stroke.
- [ ] Create `Color Segments` with Segment size `0.35..2.5%` and default `0.50%`, Randomness `0..100%`, and Color spread `0..100%`.
- [ ] Add `Harmony` / `Shuffle` as a local `actions` control in Line Palette with icon `shuffle` and target `pattern.paletteActions`.
- [ ] Remove `pattern.segments` from schema, inventory, acceptance, performance, and tests.
- [ ] Update `starterControlSectionInventory` so every new target appears exactly once.
- [ ] Keep persistence, Background, Image Export, layers, timeline, canvas, and toolbar behavior unchanged.
- [ ] Run `npx vitest run src/app/app-schema.test.ts src/app/app-acceptance.test.ts src/app/app-performance.test.ts`.

### Task 6: Integrate the new math into preview and export

**Files:**
- Modify: `src/app/editorial-pattern-renderer.tsx`
- Modify: `src/app/pattern-equations.ts`
- Modify: `src/app/pattern-segmentation.ts`

- [ ] Extend `PosterSettings` and `readPosterSettings` with the five equation values and three segmentation values.
- [ ] Memoize equation sampling on equation/parameters/detail only.
- [ ] Derive a stable segmentation seed from equation/parameter values and memoize segmentation separately on points/size/randomness/spread.
- [ ] Use each segment's `colorIndex` in both SVG and Canvas rendering instead of `index % palette.length`.
- [ ] Render the dynamic equation label in the existing reference-derived text role.
- [ ] Keep Position/Scale/Stroke as composite-only changes and preserve bottom cropping.
- [ ] Run unit tests and `npm run verify:quick`.

### Task 7: Update browser acceptance and targeted performance coverage

**Files:**
- Modify: `e2e/app-controls.spec.ts`
- Modify: `e2e/editorial-pattern-performance.spec.ts`
- Modify: `src/app/app-acceptance.ts`
- Modify: `src/app/app-performance.ts`

- [ ] Update the geometry test to open the Equation dropdown and choose every visible option.
- [ ] Drag Symmetry, Resonance, Coupling, Phase, and Warp through the real sliders and prove the shared product observable changes during each interaction.
- [ ] Drag Segment size to a short value and assert the SVG contains at least 100 paths; then change Randomness and Color spread and assert segment length/color-index distributions change.
- [ ] Click Shuffle twice, assert all three visible color inputs and rendered segment strokes change, and confirm the palette remains after reload.
- [ ] Verify section Reset restores default equation parameters, segmentation, and palette.
- [ ] Update workload scenarios and pipeline invalidation: equation sampling, segmentation, composite, and export passes.
- [ ] Add targeted performance coverage for maximum Detail plus minimum Segment size and live equation/segmentation slider drags.
- [ ] Run focused Playwright tests for equation variables, segmentation, palette shuffle, persistence, and export.

### Task 8: Record evidence and deliver

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`
- Modify: `specs/editorial-pattern-spec.md` if implementation evidence changes a declared limit

- [ ] Record a new decision-trail iteration with the request, approaches, equation design, segmentation model, harmony algorithm, state/output mapping, and rejected raw-editor/equation-specific-panel alternatives.
- [ ] Record Tier 4 verification and that the full performance checkpoint is not required for this post-first-working non-performance feature iteration.
- [ ] Run `npm run verify:final`.
- [ ] Read the Toolcraft browser skill, start or reuse `npm run dev`, and perform real-browser visual QA on several equation/parameter extremes, short segments, high randomness/spread, Shuffle, reset, and export.
- [ ] Run the targeted touched-path performance scenarios and record measurements.
- [ ] Redeploy the verified production app to its linked Vercel project and confirm the existing alias returns the Toolcraft title marker.
