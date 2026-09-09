# Chaotic Particle Colors And Edge Spill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give settled particles stable chaotic reference colors and add a persisted `Edge spill` slider that moves a controlled share of circles beyond the sampled object boundary.

**Architecture:** Keep Toolcraft's existing Gradient as the editable color bank, but change renderer allocation from interpolated spatial RGB to deterministic seed-led discrete stop selection. Enrich glyph candidates with local outward normals and apply schema-owned spill strength during cached target-plan construction.

**Tech Stack:** TypeScript, React 19, Toolcraft runtime schema and renderer pipeline, Canvas 2D, Vitest, Playwright.

---

Implementation note: this standalone folder is not a Git repository, so commit/worktree steps are omitted. User authority covers inline execution in the current task; multi-agent delegation was not requested.

### Task 1: Write failing color and spill tests

**Files:**
- Modify: `src/app/dots/dots-product.test.ts`
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Extend the product fixture**

Add `edgeSpill: 0.55` to `settings.particles` so the fixture satisfies the expanded `DotsSettings` type.

- [ ] **Step 2: Prove exact deterministic palette selection**

Add a test that calls `dotColorAt` for a fixed target with multiple particle seeds and asserts:

```ts
const colorBank = {
  angle: 12,
  gradientType: "angular" as const,
  stops: [
    { color: "#FF4F22", opacity: 1, position: 0 },
    { color: "#FF8A1E", opacity: 1, position: 0.14 },
    { color: "#F1F20D", opacity: 1, position: 0.28 },
    { color: "#5C771A", opacity: 1, position: 0.42 },
    { color: "#0B5A86", opacity: 1, position: 0.56 },
    { color: "#887CE8", opacity: 1, position: 0.7 },
    { color: "#F3A0C3", opacity: 1, position: 0.84 },
    { color: "#FF4F22", opacity: 1, position: 1 },
  ],
};
const exactColors = new Set([
  "rgb(255 79 34)",
  "rgb(255 138 30)",
  "rgb(241 242 13)",
  "rgb(92 119 26)",
  "rgb(11 90 134)",
  "rgb(136 124 232)",
  "rgb(243 160 195)",
]);
const colors = Array.from({ length: 80 }, (_, index) =>
  dotColorAt(
    colorBank,
    0.5,
    0.5,
    "#FFFFFF",
    index * 198.34 + 7,
  ).css,
);
expect(new Set(colors).size).toBeGreaterThanOrEqual(7);
expect(colors.every((color) => exactColors.has(color))).toBe(true);
expect(dotColorAt(
  colorBank,
  0.5,
  0.5,
  "#FFFFFF",
  198.34,
)).toEqual(dotColorAt(
  colorBank,
  0.5,
  0.5,
  "#FFFFFF",
  198.34,
));
```

The important expectations are exact stop colors, no intermediate RGB values, and stable repeated output for one seed.

- [ ] **Step 3: Prove mask-normal spill**

Reuse `installOpaqueMaskDocument()` to create a rectangular text-mask fixture. Generate plans with identical settings except `edgeSpill: 0` and `edgeSpill: 1`, then assert:

```ts
expect(strict.particles.every(({ target }) =>
  target.x >= strictMinX &&
  target.x <= strictMaxX &&
  target.y >= strictMinY &&
  target.y <= strictMaxY
)).toBe(true);
expect(spilled.particles.filter(({ target }) =>
  target.x < strictMinX ||
  target.x > strictMaxX ||
  target.y < strictMinY ||
  target.y > strictMaxY
).length).toBeGreaterThan(40);
expect(getDotPlan({
  ...settings,
  particles: { ...settings.particles, edgeSpill: 1 },
})).toEqual(spilled);
```

Derive `strictMinX`, `strictMaxX`, `strictMinY`, and `strictMaxY` from the zero-spill plan so the test remains tied to the real mask sampler rather than duplicating its internal mask dimensions.

- [ ] **Step 4: Prove the schema control**

Find `particles.edgeSpill` in normalized controls and assert:

```ts
expect(edgeSpill).toMatchObject({
  defaultValue: 55,
  label: "Edge spill",
  max: 100,
  min: 0,
  sliderValueKind: "continuous",
  step: 1,
  type: "slider",
  unit: "%",
});
```

- [ ] **Step 5: Run tests and confirm failure**

Run:

```bash
npx vitest run src/app/app-schema.test.ts src/app/dots/dots-product.test.ts
```

Expected: compile/test failures because `edgeSpill` and seed-led discrete color selection are not implemented.

### Task 2: Add schema state and settings normalization

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/dots/dots-types.ts`
- Modify: `src/app/dots/dots-values.ts`
- Modify: `src/app/dots/dots-renderer.tsx`

- [ ] **Step 1: Add the built-in slider**

Insert the following control in `Particles` before `Size range`:

```ts
edgeSpill: {
  defaultValue: 55,
  description:
    "Let an increasing share of particle centers drift beyond the sampled text edge.",
  label: "Edge spill",
  max: 100,
  min: 0,
  sliderValueKind: "continuous",
  step: 1,
  target: "particles.edgeSpill",
  type: "slider",
  unit: "%",
  ...responsiveness(
    "Edge spill rebuilds the same bounded particle target plan with deterministic outward offsets.",
  ),
},
```

- [ ] **Step 2: Extend product settings**

Add `edgeSpill: number` to `DotsSettings["particles"]`.

- [ ] **Step 3: Normalize runtime values**

In `readDotsSettings`, add:

```ts
edgeSpill: clamp(
  numberValue(values["particles.edgeSpill"], 55) / 100,
  0,
  1,
),
```

- [ ] **Step 4: Expose browser-observable state**

Add `data-dot-edge-spill={settings.particles.edgeSpill.toFixed(3)}` to the product renderer root.

### Task 3: Implement discrete seeded colors

**Files:**
- Modify: `src/app/dots/dots-color.ts`
- Modify: `src/app/dots/dots-render-frame.ts`

- [ ] **Step 1: Add deterministic hashing and nearest-stop selection**

In `dots-color.ts`, add a local `hashUnit` and compute:

```ts
const spatialPhase = gradientCoordinate(gradient, x, y) * 0.18;
const coordinate = (
  hashUnit(particleSeed * 0.017 + 19.7) + spatialPhase
) % 1;
const selected = gradient.stops.reduce((closest, candidate) =>
  Math.abs(candidate.position - coordinate) <
  Math.abs(closest.position - coordinate)
    ? candidate
    : closest,
);
```

Treat the duplicated `0%`/`100%` color as a circular boundary by comparing wrapped distance `Math.min(delta, 1 - delta)`.

- [ ] **Step 2: Preserve exact default colors**

When `tint` normalizes to `#FFFFFF`, return the selected stop RGB unchanged. For other typography colors, mix the selected stop 14% toward the authored tint. Return the selected stop opacity unchanged.

- [ ] **Step 3: Bind one seed to dots and trails**

Change `dotColorAt` to accept `particleSeed` as its fifth argument. Pass `particle.seed` from both calls in `prepareParticle` so the point and its trajectory share one stable color.

- [ ] **Step 4: Run the focused color tests**

Run:

```bash
npx vitest run src/app/dots/dots-product.test.ts
```

Expected: deterministic discrete-color assertions pass while spill assertions remain pending until Task 4.

### Task 4: Implement mask-normal edge spill

**Files:**
- Modify: `src/app/dots/dots-shape.ts`
- Modify: `src/app/dots/dots-pipeline.ts`

- [ ] **Step 1: Enrich candidate points**

Define a local candidate type:

```ts
type DotCandidate = Readonly<{
  edge: boolean;
  normal: DotPoint;
  point: DotPoint;
}>;
```

When collecting mask pixels, inspect eight directions across the existing outline depth. The lowest-alpha direction is the local outward normal. Store it as one-mask-pixel normalized offsets `{ x: direction.x / width, y: direction.y / height }`.

- [ ] **Step 2: Preserve exact zero-spill behavior**

Make `selectCandidate` return the candidate point and metadata. If `settings.particles.edgeSpill === 0`, return the same selected target as the current implementation.

- [ ] **Step 3: Apply deterministic outward displacement**

For edge candidates, use the particle seed and spill strength to control both participation and distance:

```ts
const participates =
  hashUnit(seed + 112.7) < 0.2 + edgeSpill * 0.8;
const distance =
  participates
    ? edgeSpill * (3 + hashUnit(seed + 140.3) * 27)
    : 0;
```

Perturb the outward normal with a bounded tangent component, normalize it, multiply by the candidate's mask-normal unit vector, and clamp final normalized canvas coordinates. Interior candidates receive at most four mask pixels of deterministic isotropic jitter at `100%`.

- [ ] **Step 4: Include spill in plan identity**

Add `edgeSpill` to `planKey` so Reset, history, settings import, and slider changes cannot reuse stale targets.

- [ ] **Step 5: Register invalidation**

Add `particles.edgeSpill` to `shapeTargets` and to the continuous shape-sample `control-drag` target list. Keep the existing particle-count workload dimension unchanged.

- [ ] **Step 6: Run product and pipeline tests**

Run:

```bash
npx vitest run \
  src/app/dots/dots-product.test.ts \
  src/app/app-performance.gates.test.ts \
  src/app/app-performance.fixture-helper.test.ts
```

Expected: spill, deterministic plan, render-plan assessment, and fixture derivation pass without a kernel benchmark requirement.

### Task 5: Add acceptance and focused browser proof

**Files:**
- Modify: `src/app/dots/dots-acceptance.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Create: `e2e/dots-chaotic-color-spill.spec.ts`

- [ ] **Step 1: Add the acceptance target**

Add `particles.edgeSpill` to the `Particles` section inventory and add a slider acceptance row whose observable states that increasing spill moves rendered circles beyond the strict glyph boundary.

Export:

```ts
export const DOTS_SPILL_BROWSER_TEST_NAME =
  "browser: settled dots use chaotic palette and adjustable edge spill";
```

Allow `controlAcceptance` to accept an optional `browserTestName`, defaulting to `DOTS_BROWSER_TEST_NAME`, and bind the new row to the focused title.

- [ ] **Step 2: Align reference feature evidence**

Update the color/size feature mapping to state that gradient stops form an editable discrete color bank whose seeded assignment persists from launch through settlement. Update product summary/requested behavior to include adjustable boundary spill.

- [ ] **Step 3: Add focused browser evidence**

Create the exact focused test named above. It must:

```ts
await page.goto("/");
await page.evaluate(() => localStorage.clear());
await page.reload();
const session = await createToolcraftBrowserProofSession(page);
await pausePlayback(page);
await setTimelineFraction(page, 0.62);
```

Use the real `Edge spill` slider through `session.controlAction` and `expectToolcraftProductObservableToChange` with requirement id `particles.edgeSpill`. At `0%`, capture the strict settled-pixel bounds. At `100%`, assert at least 40 non-background sampled pixels lie beyond the strict bounds and the visible bounds expand. Click `Reset controls` and assert `data-dot-edge-spill="0.550"`.

For colors, inspect settled canvas pixels against the exact default stop RGB values. Assert at least eight stop colors are present and at least five occupied spatial cells contain six or more distinct palette colors.

- [ ] **Step 4: Run focused acceptance**

Run:

```bash
npx vitest run \
  src/app/app-schema.test.ts \
  src/app/dots/dots-product.test.ts \
  src/app/app-acceptance.base-coverage.test.ts \
  src/app/app-acceptance.control-state.test.ts
npx playwright test e2e/dots-chaotic-color-spill.spec.ts --reporter=line
```

Expected: schema/acceptance tests pass and Chromium proves final-state color chaos plus adjustable spill.

### Task 6: Record impact and deliver

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`
- Verify: `src/app/app-performance-impact.json`

- [ ] **Step 1: Verify performance ownership**

Confirm existing module ownership covers every changed production module:

- `dots-color.ts`, `dots-render-frame.ts`: preview/image/video passes;
- `dots-shape.ts`, `dots-values.ts`, `dots-pipeline.ts`: shape/preview/image/video passes as already declared;
- schema, acceptance, and types: functional.

No new module entry is required unless implementation creates a production file.

- [ ] **Step 2: Read Verification-phase docs**

Read `docs/toolcraft/acceptance-testing.md` and `docs/toolcraft/performance.md` in full before proof.

- [ ] **Step 3: Add Decision Trail Iteration 4**

Record the screenshot reference, root cause, selected seeded color bank, `Edge spill` behavior, unchanged workload boundaries, exact changed files, Tier 3, focused checks, exact impact-derived delivery command, skipped full certification, and persistence/reset risk.

- [ ] **Step 4: Derive exact delivery selectors**

Compare current verification inputs to `.toolcraft/verification/checkpoint.json`, inspect `context.impact`, list current canonical Playwright titles, and select every required path that covers the changed pass ids. Do not reuse old path ids if pipeline registration changed them.

- [ ] **Step 5: Run one protected delivery**

Run:

```bash
npm run verify:delivery -- --tier=3 \
  --unit-test=src/app/app-schema.test.ts \
  --unit-test=src/app/dots/dots-product.test.ts \
  --browser-test="browser: settled dots use chaotic palette and adjustable edge spill" \
  <exact impact-derived --performance-test selectors>
```

Expected: integrity, code health, docs, typecheck, targeted Vitest, production build, focused browser acceptance, exact canonical performance paths, and receipt commit all pass.

- [ ] **Step 6: Restart and inspect**

Run:

```bash
npm run dev:restart
```

Open the verified saved-port app, Reset controls, pause at the settled hold phase, inspect color distribution and spill at `0%`, `55%`, and `100%`, confirm no console errors, and leave the app running.
