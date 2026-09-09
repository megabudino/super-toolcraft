# Strawberry Party Default Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the supplied Strawberry Party settings to Donut Studio's clean-start defaults, put Strawberry first in every named-preset surface, and deploy the verified app to the linked Vercel production project.

**Architecture:** Preserve the current Toolcraft schema, preset-library normalizer, persistence key, and retained renderer. Replace only source-backed preset/default data and matching acceptance expectations; the supplied top-level Strawberry camera remains the shared named-preset pose through the existing normalization boundary.

**Tech Stack:** TypeScript 6, React 19, Toolcraft runtime, Vitest, Playwright, Vite, Vercel CLI.

---

### Task 1: Lock the new source-backed defaults in focused tests

**Files:**

- Modify: `src/app/donut/donut-values.test.ts`
- Modify: `src/app/donut/donut-presets.test.ts`
- Modify: `src/app/donut/donut-preset-library.test.ts`
- Modify: `src/app/donut/donut-materials.test.ts`

- [ ] **Step 1: Change the default-value assertion to the Strawberry snapshot**

Replace the expected `DONUT_DEFAULTS` object with this complete supplied value:

```ts
expect(DONUT_DEFAULTS).toEqual({
  background: { color: "#C8B1BD", include: true },
  donut: { height: 1, majorRadius: 1, organic: 1, thickness: 1 },
  icing: {
    clearMode: "none",
    color: "#F26D9C",
    coverage: 1.05,
    detail: 1,
    dripAmount: 1,
    dripFrequency: 1,
    enabled: true,
    flow: 1,
    thickness: 1,
  },
  image: { format: "png", resolution: "4k" },
  materials: {
    donut: {
      bake: 0.65,
      coat: 0.12,
      color: "#9C6235",
      moisture: 0.22,
      pores: 0.65,
      roughness: 0.58,
      sheen: 0.15,
      softness: 0.08,
      subsurface: 0.28,
      variation: 0.55,
    },
    icing: {
      coat: 0.3,
      glaze: 0.55,
      roughness: 0.5,
      sheen: 0.15,
      subsurface: 0.35,
      texture: 0.4,
    },
    plate: {
      coat: 0.34,
      color: "#F1EEE7",
      roughness: 0.19454545,
    },
    sprinkle: { coat: 0.16, roughness: 0.31 },
  },
  plateVisible: true,
  renderScale: 2,
  sprinkles: {
    clear: false,
    coverage: 1,
    flow: 1.25,
    metallic: 0,
    palette: 4,
    rotation: 1,
    scale: 0.5,
    seed: 87,
    shape: 3,
    sizeVariation: 1.09,
    solidColor: "#F6E7C8",
    surfaceOffset: 0,
  },
  studio: {
    cool: { color: "#B7D2F2", power: 0, size: 4.70047 },
    environmentBackdrop: false,
    environmentBlur: 0.35,
    environmentRotation: 330,
    environmentStrength: 0.45,
    key: { color: "#FFFFFF", power: 1680, size: 4.131158 },
    shadowSoftness: 2,
    shadowStrength: 0.8,
    shadowsEnabled: true,
    warm: { color: "#FFDCAE", power: 230, size: 0.25 },
  },
});
```

- [ ] **Step 2: Change preset identity and camera assertions**

```ts
expect(DONUT_PRESET_DEFAULT).toBe("strawberry-party");
expect(DONUT_PRESETS[0]?.id).toBe("strawberry-party");
expect(findDonutPreset(DONUT_PRESET_DEFAULT)?.label).toBe("Strawberry Party");
expect(DONUT_FACTORY_PRESET_LIBRARY.presets[0]).toMatchObject({
  id: "strawberry-party",
  values: {
    "scene.orientation": {
      position: [-2.8292787171709213, 5.543043574797161, 5.590156515560591],
      up: [0.29922053998704756, 0.7489601052954004, -0.5912070949555345],
    },
  },
});
```

Update initial-mount and legacy-normalization cases to use `strawberry-party` as the default ID.

- [ ] **Step 3: Align the physical-material test with Strawberry**

```ts
expect(materials.base.clearcoat).toBeCloseTo(0.19);
expect(materials.base.transmission).toBeCloseTo(0.00784);
expect(materials.icing.transmission).toBeCloseTo(0.08575);
expect(materials.icing.thickness).toBeCloseTo(0.341);
expect(materials.icing.clearcoat).toBeCloseTo(0.6275);
expect(materials.icing.clearcoatRoughness).toBeCloseTo(0.195);
```

- [ ] **Step 4: Run the focused tests and confirm they fail for Matcha**

```bash
npx vitest run src/app/donut/donut-values.test.ts src/app/donut/donut-presets.test.ts src/app/donut/donut-preset-library.test.ts src/app/donut/donut-materials.test.ts
```

Expected: FAIL with old `matcha-cream`, Matcha values, and old shared camera.

### Task 2: Promote the preset resource and clean-start values

**Files:**

- Modify: `src/app/donut/donut-preset-defaults.json`
- Modify: `src/app/donut/donut-presets.ts`
- Modify: `src/app/donut/donut-values.ts`

- [ ] **Step 1: Regenerate the library from the supplied Settings file**

Mechanically parse the embedded library, copy top-level values into Strawberry, apply its top-level orientation to every named preset, move Strawberry to index zero, and serialize with two-space indentation plus a final newline:

```js
import fs from "node:fs";

const settingsPath =
  "/Users/kusnizza/Downloads/donut-studio-settings (2).json";
const outputPath = "src/app/donut/donut-preset-defaults.json";
const source = fs.readFileSync(settingsPath, "utf8");
const settings = JSON.parse(source);
const library = JSON.parse(settings.values["donut.presetLibrary"]);
const strawberry = library.presets.find((preset) => preset.id === "strawberry-party");
if (!strawberry) throw new Error("The supplied library has no Strawberry Party preset.");
strawberry.values = Object.fromEntries(
  Object.keys(strawberry.values).map((target) => [
    target,
    target === "canvas.infinity"
      ? settings.canvas.mode === "infinite"
      : (settings.values[target] ?? strawberry.values[target]),
  ]),
);
library.presets = [
  strawberry,
  ...library.presets.filter((preset) => preset.id !== strawberry.id),
].map((preset) => ({
  ...preset,
  values: {
    ...preset.values,
    "scene.orientation": settings.values["scene.orientation"],
  },
}));
fs.writeFileSync(outputPath, `${JSON.stringify(library, null, 2)}\n`);
```

Verify the order is Strawberry, Matcha, Classic, Chocolate, Maple, Birthday, Blueberry, Pistachio, Salted Caramel, Double Chocolate and every entry has 65 values.

- [ ] **Step 2: Make Strawberry the validated default preset**

```ts
export const DONUT_PRESET_DEFAULT = "strawberry-party";
```

Use flavor-neutral errors: `The default donut preset requires a valid camera pose.` and `The bundled donut preset defaults must be a unique default-first version 1 library.`

- [ ] **Step 3: Replace `DONUT_DEFAULTS` with the top-level Strawberry values**

Keep the existing `DonutSettings` shape. Preserve `clearMode: "none"`, `clear: false`, PNG/4K image export, and render scale 2.

- [ ] **Step 4: Run the Task 1 Vitest command**

Expected: PASS.

- [ ] **Step 5: Commit the default-data implementation**

```bash
git add examples/donut-studio/src/app/donut/donut-preset-defaults.json examples/donut-studio/src/app/donut/donut-presets.ts examples/donut-studio/src/app/donut/donut-values.ts examples/donut-studio/src/app/donut/donut-values.test.ts examples/donut-studio/src/app/donut/donut-presets.test.ts examples/donut-studio/src/app/donut/donut-preset-library.test.ts examples/donut-studio/src/app/donut/donut-materials.test.ts
git commit -m "feat(donut): default to Strawberry Party"
```

### Task 3: Update acceptance and decision evidence

**Files:**

- Modify: `src/app/donut/donut-preset-acceptance.ts`
- Modify: `e2e/donut-presets.spec.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Make acceptance language Strawberry-first**

Replace Matcha-first/shared-Matcha wording while preserving Flavor, Reset flavor, Settings Transfer, Infinity canvas, and 170% zoom ownership.

- [ ] **Step 2: Update browser clean-start assertions**

Assert Strawberry Party, `#C8B1BD`, radius `1`, icing `#F26D9C`, seed `87`, environment rotation `330`, and the supplied camera. The exported Settings assertion includes `donut.preset: "strawberry-party"`, `sprinkles.sizeVariation: 1.09`, Strawberry light values, and the embedded Strawberry-first library.

- [ ] **Step 3: Update shared-camera and stale-default cases**

Use `strawberry-party` as the shared camera source and stale/default mount-repair case. Keep Matcha and Classic tuning cases to prove non-default flavors round-trip.

- [ ] **Step 4: Add Iteration 20 to the worklog**

Record the exact request, source SHA, Tier 2 scope, unchanged orbit and interaction ownership, source/default mapping, one bare-delivery narrative, rejected alternatives, persistence compatibility, and production deployment intent.

- [ ] **Step 5: Run code-health and focused unit checks**

```bash
npm run ai:check
npx vitest run src/app/donut/donut-values.test.ts src/app/donut/donut-presets.test.ts src/app/donut/donut-preset-library.test.ts src/app/donut/donut-schema.test.ts src/app/donut/donut-materials.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit acceptance and worklog updates**

```bash
git add examples/donut-studio/src/app/donut/donut-preset-acceptance.ts examples/donut-studio/e2e/donut-presets.spec.ts examples/donut-studio/docs/toolcraft/agent-worklog.md
git commit -m "test(donut): cover Strawberry defaults"
```

### Task 4: Verify the real app and protected delivery

**Files:**

- Verify: `src/app/donut/*`
- Verify: `e2e/donut-presets.spec.ts`

- [ ] **Step 1: Run focused browser acceptance**

```bash
npx playwright test e2e/donut-presets.spec.ts --grep "donut.preset|donut.presetLibrary"
```

Expected: both preset scenarios PASS.

- [ ] **Step 2: Inspect the real local UI**

Start or reuse the saved Donut Studio port. Verify Strawberry is first/selected, switching flavors keeps the shared camera, Reset flavor restores supplied Strawberry values, and Export Settings carries the complete library.

- [ ] **Step 3: Run the single protected delivery gate**

```bash
npm run verify:delivery
```

Expected: PASS with a functional-targeted receipt. Skip `verify:perf` because no performance authority exists.

### Task 5: Deploy the verified app to production

**Files:**

- Deploy from: `examples/donut-studio/.vercel/project.json`
- Deploy with: `examples/donut-studio/vercel.json`

- [ ] **Step 1: Confirm the linked target**

Confirm project `donut`, ID `prj_TOmZDXHSsaGkGeXzHv7MqEfaEKPE`, in the expected Pixel Point team.

- [ ] **Step 2: Create the production deployment**

From `examples/donut`, run the command prescribed by the installed Vercel deployment skill with the existing project link and `vercel.json` contract. Expected: ready production deployment and stable production alias.

- [ ] **Step 3: Record and commit deployment evidence**

Add the deployment identifier and stable alias to Iteration 20 without fetching the deployment URL after Vercel reports it ready, then commit only the worklog:

```bash
git add examples/donut-studio/docs/toolcraft/agent-worklog.md
git commit -m "docs(donut): record Strawberry production deploy"
```

- [ ] **Step 4: Report the outcome**

Report the new default, protected verification result, production alias, deployment identifier, and the persistence caveat for already-saved workspaces.
