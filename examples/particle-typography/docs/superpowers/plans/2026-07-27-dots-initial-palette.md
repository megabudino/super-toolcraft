# Dot Formation Initial Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make new and reset Dot Formation sessions start with the warm background and broad playful particle colors shown in the supplied screenshot.

**Architecture:** Keep the existing Toolcraft gradient and background controls as the single state owners. Change their schema defaults, then prove the normalized schema, live initial canvas, and Reset behavior without changing renderer passes or their malformed-state fallback.

**Tech Stack:** TypeScript, React 19, Toolcraft runtime schema, Canvas 2D, Vitest, Playwright.

---

Implementation note: this standalone folder is not a Git repository, so commit/worktree steps are omitted. The available subagent skill cannot be used without explicit user delegation authority; execution follows the signed local Toolcraft workflow in this task.

### Task 1: Lock the intended defaults with a unit test

**Files:**
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add a normalized-schema assertion**

Add a test that collects normalized controls by target and asserts:

```ts
const controls = appSchema.panels.controls?.sections.flatMap((section) =>
  Object.values(section.controls),
) ?? [];
const palette = controls.find((control) => control.target === "appearance.palette");
const background = controls.find((control) => control.target === "appearance.background");

expect(background).toMatchObject({
  defaultValue: "#D4CECA",
  type: "color",
});
expect(palette).toMatchObject({
  defaultValue: {
    angle: 12,
    gradientType: "angular",
    stops: [
      { color: "#FF4F22", position: "0%" },
      { color: "#FF8A1E", position: "10%" },
      { color: "#F1F20D", position: "20%" },
      { color: "#5C771A", position: "30%" },
      { color: "#0B5A86", position: "40%" },
      { color: "#8DB5C8", position: "50%" },
      { color: "#887CE8", position: "60%" },
      { color: "#F3A0C3", position: "70%" },
      { color: "#B28F73", position: "80%" },
      { color: "#D7D9D3", position: "90%" },
      { color: "#FF4F22", position: "100%" },
    ],
  },
  type: "gradient",
});
```

- [ ] **Step 2: Run the targeted test and confirm the old defaults fail**

Run:

```bash
npx vitest run src/app/app-schema.test.ts
```

Expected: the new assertions fail on the old black background and seven-stop palette.

### Task 2: Update schema defaults

**Files:**
- Modify: `src/app/app-schema.ts`

- [ ] **Step 1: Replace the schema gradient stops**

Keep `gradientType: "angular"` and `angle: 12`, and replace `appearance.palette.defaultValue.stops` with:

```ts
[
  { color: "#FF4F22", position: "0%" },
  { color: "#FF8A1E", position: "10%" },
  { color: "#F1F20D", position: "20%" },
  { color: "#5C771A", position: "30%" },
  { color: "#0B5A86", position: "40%" },
  { color: "#8DB5C8", position: "50%" },
  { color: "#887CE8", position: "60%" },
  { color: "#F3A0C3", position: "70%" },
  { color: "#B28F73", position: "80%" },
  { color: "#D7D9D3", position: "90%" },
  { color: "#FF4F22", position: "100%" },
]
```

- [ ] **Step 2: Replace the schema background default**

Change `appearance.background.defaultValue` from `#050505` to `#D4CECA`.

- [ ] **Step 3: Run the targeted unit test**

Run:

```bash
npx vitest run src/app/app-schema.test.ts
```

Expected: the schema test passes.

### Task 3: Add focused browser proof and align reference acceptance

**Files:**
- Create: `e2e/dots-initial-palette.spec.ts`
- Modify: `e2e/dots-acceptance-reference.ts`

- [ ] **Step 1: Add a focused initial-state browser test**

Create a Playwright test named `browser: initial palette matches warm reference colors` that:

```ts
await page.goto("/");
await page.evaluate(() => localStorage.clear());
await page.reload();

const output = page.locator('[data-dots-renderer="true"]');
const canvas = page.locator('canvas[aria-label="Particle text formation"]');
await expect(output).toHaveAttribute("data-background-color", "#D4CECA");
await expect.poll(async () => {
  const encoded = await output.getAttribute("data-dot-gradient");
  return encoded ? JSON.parse(encoded).stops.map((stop: { color: string }) => stop.color) : [];
}).toEqual([
  "#FF4F22", "#FF8A1E", "#F1F20D", "#5C771A", "#0B5A86", "#8DB5C8",
  "#887CE8", "#F3A0C3", "#B28F73", "#D7D9D3", "#FF4F22",
]);
await expect.poll(() =>
  canvas.evaluate((node) => Array.from(
    (node as HTMLCanvasElement).getContext("2d")!.getImageData(0, 0, 1, 1).data,
  )),
).toEqual([212, 206, 202, 255]);
```

Then edit the background hex field to `#101820`, invoke the runtime `Reset controls` button, and assert `data-background-color` returns to `#D4CECA`.

- [ ] **Step 2: Update the reference stop-count expectation**

Change the `reference.control-mapping` expected `paletteStops` from `7` to `11` because the richer default palette is now intentional reference evidence.

- [ ] **Step 3: Run the focused browser test**

Run:

```bash
npx playwright test e2e/dots-initial-palette.spec.ts --reporter=line
```

Expected: one passing browser test proving cleared-storage initial state, canvas background pixels, palette stops, and Reset.

### Task 4: Record and deliver the coherent Tier 2 batch

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add a Decision Trail entry**

Record the screenshot path, sampled background `#D4CECA`, selected color families, unchanged gradient ownership, unchanged persistence policy, Tier 2 classification, files changed, targeted checks, skipped performance proof, and final delivery result.

- [ ] **Step 2: Read the Verification-phase contract before proof**

Read `docs/toolcraft/acceptance-testing.md` in full as the selected route's Verification phase.

- [ ] **Step 3: Run the protected delivery gate once**

Run:

```bash
npm run verify:delivery -- --tier=2 \
  --unit-test=src/app/app-schema.test.ts \
  --browser-test="browser: initial palette matches warm reference colors"
```

Expected: a successful ordinary targeted delivery receipt.

- [ ] **Step 4: Start the app**

Run:

```bash
npm run dev
```

Expected: the saved Toolcraft port serves this app and passes its identity check.
