# Blender-Inspired Wind Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Blender-inspired Breeze, Gust, and steady directional Blast profiles with angle, flow, noise, and seed controls that deform both grass layers.

**Architecture:** Runtime schema owns all authored values. A focused wind-model module converts the angle and profile to renderer-ready values, while the existing retained WebGL material applies one fixed-cost pressure model to both stylized and PBR vertex paths. Tall grass and lawn share the same field; lawn receives a fixed 0.45 response multiplier.

**Tech Stack:** React 19, TypeScript, Toolcraft runtime schema, Three.js/WebGL GLSL, Vitest, Playwright.

**Repository note:** This standalone folder is not a git repository, so the commit steps normally required by the planning skill are replaced by file-and-test checkpoints.

---

### Task 1: Lock The Wind State Contract With Failing Tests

**Files:**
- Create: `src/app/grass/grass-wind.test.ts`
- Modify: `src/app/grass-product.test.ts:1-105`
- Modify: `src/app/grass-dual-layers.test.ts:60-88`
- Modify: `src/app/app-schema.test.ts:65-90`

- [ ] **Step 1: Add focused wind-model tests before the module exists**

```ts
import { describe, expect, it } from "vitest";

import {
  GRASS_LAWN_WIND_RESPONSE,
  getGrassWindDirectionVector,
  getGrassWindProfileCode,
} from "./grass-wind";

describe("grass wind model", () => {
  it.each([
    [0, [1, 0]],
    [90, [0, 1]],
    [180, [-1, 0]],
    [270, [0, -1]],
    [360, [1, 0]],
  ] as const)("maps %s degrees to the world XZ direction", (angle, expected) => {
    expect(getGrassWindDirectionVector(angle)).toEqual(expected);
  });

  it("maps profiles to stable shader branch codes", () => {
    expect(["off", "breeze", "gust", "blast"].map(getGrassWindProfileCode)).toEqual([0, 1, 2, 3]);
    expect(GRASS_LAWN_WIND_RESPONSE).toBe(0.45);
  });
});
```

- [ ] **Step 2: Replace the old Left/Right unit expectation with the approved schema contract**

```ts
it("Blender-inspired wind profiles map to dual-layer directional flow", () => {
  expect(findControl("wind.profile")).toMatchObject({
    defaultValue: "gust",
    options: [
      { label: "Off", value: "off" },
      { label: "Breeze", value: "breeze" },
      { label: "Gust", value: "gust" },
      { label: "Blast", value: "blast" },
    ],
    type: "segmented",
  });
  expect(findControl("wind.directionAngle")).toMatchObject({ max: 360, min: 0, unit: "°" });
  expect(findControl("wind.flow")).toMatchObject({ max: 100, min: 0, unit: "%" });
  expect(findControl("wind.seed")).toMatchObject({ max: 128, min: 1, step: 1 });
  expect(settingsWith({ "wind.profile": "unsupported" }).wind.profile).toBe("gust");
});
```

- [ ] **Step 3: Change the dual-layer test so wind remains outside both layout cache keys**

```ts
const angledWind = settingsWith({ "wind.directionAngle": 180, "wind.profile": "blast" });
expect(getGrassLayoutKey(angledWind)).toBe(getGrassLayoutKey(initial));
expect(getLawnLayoutKey(angledWind)).toBe(getLawnLayoutKey(initial));
```

- [ ] **Step 4: Update the expected section title to include `Wind Field`**

```ts
expect(sectionTitles).toContain("Wind Field");
  expect(sectionTitles).not.toContain("Tall Grass Wind");
```

- [ ] **Step 5: Run the focused tests and confirm they fail for the missing targets/module**

Run:

```bash
npx vitest run src/app/grass/grass-wind.test.ts src/app/grass-product.test.ts src/app/grass-dual-layers.test.ts src/app/app-schema.test.ts
```

Expected: FAIL because `grass-wind.ts`, `wind.profile`, `wind.directionAngle`, `wind.flow`, `wind.seed`, and the new section do not exist.

### Task 2: Implement Defaults, Parsing, Controls, And Persistence

**Files:**
- Create: `src/app/grass/grass-wind.ts`
- Modify: `src/app/grass/grass-defaults.ts:72-96`
- Modify: `src/app/grass/grass-values.ts:1-115,470-500`
- Modify: `src/app/grass/grass-controls.ts:447-525,650-666`
- Modify: `src/app/app-schema.ts:29-37`
- Modify: `src/app/app-performance-impact.json`

- [ ] **Step 1: Implement the focused angle/profile model**

```ts
import type { GrassWindProfile } from "./grass-defaults";

export const GRASS_LAWN_WIND_RESPONSE = 0.45;

function cleanDirectionComponent(value: number): number {
  if (Math.abs(value) < 1e-10) return 0;
  if (Math.abs(value - 1) < 1e-10) return 1;
  if (Math.abs(value + 1) < 1e-10) return -1;
  return value;
}

export function getGrassWindDirectionVector(angleDegrees: number): readonly [number, number] {
  const normalized = ((angleDegrees % 360) + 360) % 360;
  const radians = (normalized * Math.PI) / 180;
  return [cleanDirectionComponent(Math.cos(radians)), cleanDirectionComponent(Math.sin(radians))];
}

export function getGrassWindProfileCode(profile: GrassWindProfile): 0 | 1 | 2 | 3 {
  if (profile === "breeze") return 1;
  if (profile === "gust") return 2;
  if (profile === "blast") return 3;
  return 0;
}
```

- [ ] **Step 2: Replace the legacy direction default with version-2 wind defaults**

```ts
"wind.directionAngle": 0,
"wind.flow": 55,
"wind.noiseDetail": 58,
"wind.noiseScale": 1.7,
"wind.noiseStrength": 52,
"wind.profile": "gust",
"wind.seed": 17,
"wind.strength": 62,
```

Add:

```ts
export type GrassWindProfile = "off" | "breeze" | "gust" | "blast";
```

Remove `GrassWindDirection`.

- [ ] **Step 3: Parse bounded renderer settings from Toolcraft state**

```ts
wind: {
  directionAngle: boundedNumberValue(state, "wind.directionAngle", 0, 360),
  flow: boundedNumberValue(state, "wind.flow", 0, 100) / 100,
  noiseDetail: boundedNumberValue(state, "wind.noiseDetail", 0, 100) / 100,
  noiseScale: boundedNumberValue(state, "wind.noiseScale", 0.25, 5),
  noiseStrength: boundedNumberValue(state, "wind.noiseStrength", 0, 100) / 100,
  profile: stringValue(state, "wind.profile", ["off", "breeze", "gust", "blast"]),
  seed: Math.round(boundedNumberValue(state, "wind.seed", 1, 128)),
  strength: boundedNumberValue(state, "wind.strength", 0, 100) / 100,
},
```

Update `GrassSettings["wind"]` to match and remove `getGrassWindDirectionSign`.

- [ ] **Step 4: Replace the old wind section with one dependency-cohesive built-in-control section**

```ts
const windActive = { notEquals: "off", target: "wind.profile" } as const;

const windFieldSection = {
  controls: {
    profile: {
      defaultValue: grassDefaults["wind.profile"],
      description: "Chooses calm, smooth breeze, travelling gust fronts, or sustained directional blast behavior.",
      label: "Profile",
      options: [
        { label: "Off", value: "off" },
        { label: "Breeze", value: "breeze" },
        { label: "Gust", value: "gust" },
        { label: "Blast", value: "blast" },
      ],
      orderRole: "mode",
      ...responsive("Selects one fixed-cost wind pressure branch in the retained vertex shader."),
      target: "wind.profile",
      type: "segmented",
    },
    directionAngle: slider({
      defaultValue: grassDefaults["wind.directionAngle"],
      description: "Rotates the flow around the world XZ plane; 0° is +X and 90° is +Z.",
      label: "Direction",
      max: 360,
      min: 0,
      performanceReason: "Updates a normalized retained wind direction uniform.",
      step: 1,
      target: "wind.directionAngle",
      unit: "°",
      visibleWhen: windActive,
    }),
    strength: slider({
      defaultValue: grassDefaults["wind.strength"],
      description: "Controls directional load and blade compression on both grass layers.",
      label: "Strength",
      max: 100,
      min: 0,
      performanceReason: "Updates fixed-cost directional bend amplitude in the vertex shader.",
      step: 1,
      target: "wind.strength",
      unit: "%",
      visibleWhen: windActive,
    }),
    flow: slider({
      defaultValue: grassDefaults["wind.flow"],
      description: "Keeps blades aligned with the mean air stream instead of recovering fully between pressure changes.",
      label: "Flow",
      max: 100,
      min: 0,
      performanceReason: "Blends the fixed-cost profile pressure toward its sustained flow floor.",
      step: 1,
      target: "wind.flow",
      unit: "%",
      visibleWhen: windActive,
    }),
  },
  title: "Wind Field",
} satisfies ToolcraftControlSectionSchema;
```

Keep `Noise`, `Gust scale`, `Turbulence`, and `Seed` in `windFieldSection`, all using `visibleWhen: windActive`. Because this creates an eight-control section, declare `semanticGroup: "field"` on Profile, Direction, Strength, and Flow, and `semanticGroup: "variation"` on Noise, Gust scale, Turbulence, and Seed. Insert the single section after `Tall Grass Blade`.

- [ ] **Step 5: Advance persistence and register the new production module**

```ts
persistence: {
  include: ["values", "canvas", "media", "panels", "timeline"],
  key: "toolcraft:grass-studio:state:v2",
  storage: "localStorage",
  version: 2,
},
```

Add `src/app/grass/grass-wind.ts` to `app-performance-impact.json` as performance-owned by `grass-dynamic-scene-render`, `grass-scene-render`, and `grass-export-frame`.

- [ ] **Step 6: Run the focused tests**

Run the Task 1 Vitest command.

Expected: PASS for wind model, schema, and state parsing.

### Task 3: Implement Dual-Layer Directional WebGL Deformation

**Files:**
- Modify: `src/app/grass/grass-material.ts:5-103,181-257,325-473`
- Modify: `src/app/grass/grass-scene.ts:1-10,226-287`
- Modify: `src/app/app-renderer-pipeline.ts:90-138`
- Modify: `src/app/grass/grass-output.tsx:320-410`

- [ ] **Step 1: Extend material settings and uniforms**

```ts
export type GrassLayerMaterialSettings = Readonly<{
  // existing material fields remain
  windDirection: readonly [number, number];
  windFlow: number;
  windNoiseDetail: number;
  windNoiseScale: number;
  windNoiseStrength: number;
  windProfile: number;
  windResponse: number;
  windSeed: number;
  windStrength: number;
}>;
```

Add `uFlow`, `uWindProfile`, `uWindResponse`, and `uWindSeed`; change `uWindDirection` from `float` to `vec2`; assign the tuple through `THREE.Vector2` in `applyGrassLayerMaterialSettings`.

- [ ] **Step 2: Share one bounded pressure function across PBR and stylized vertex paths**

```glsl
float grassWindPressure(vec3 offset, float phaseValue) {
  float active = step(0.5, uWindProfile);
  float travel = uProgress * 6.28318530718;
  float seededPhase = phaseValue * 0.035 + uWindSeed * 0.113;
  float spatial = (dot(offset.xz, uWindDirection) + seededPhase) * uNoiseScale;
  float broadWave = 0.5 + 0.5 * sin(spatial - travel);
  float gustFront = smoothstep(0.12, 0.88, broadWave);
  float staticFineWave = 0.5 + 0.5 * sin(spatial * 2.0 + offset.z * 0.43 + seededPhase * 3.1);
  float fineWave = 0.5 + 0.5 * sin(spatial * 2.0 + offset.z * 0.43 + seededPhase * 3.1 - travel * 1.37);
  float turbulence = mix(1.0, mix(0.72, 1.18, fineWave), uNoiseDetail);
  float breezePressure = mix(0.42, 0.28 + broadWave * 0.48 * turbulence, uNoiseStrength) * 0.62;
  float gustPressure = mix(0.58, 0.2 + gustFront * 0.98 * turbulence, uNoiseStrength);
  float blastVariation = 0.82 + 0.18 * sin(spatial * 1.7 + staticFineWave * 2.2);
  float blastPressure = mix(1.0, blastVariation, uNoiseStrength) * 1.35;
  float breezeWeight = step(0.5, uWindProfile) - step(1.5, uWindProfile);
  float gustWeight = step(1.5, uWindProfile) - step(2.5, uWindProfile);
  float blastWeight = step(2.5, uWindProfile);
  float profilePressure = breezePressure * breezeWeight + gustPressure * gustWeight + blastPressure * blastWeight;
  float sustainedPressure = mix(profilePressure, max(profilePressure, 0.92), uFlow);
  return sustainedPressure * active * uWindResponse;
}
```

`blastPressure` deliberately omits `travel`, so separated timeline samples preserve the same Blast deformation.

- [ ] **Step 3: Bend positions and PBR normals in the authored XZ direction**

```glsl
worldPosition.xz += uWindDirection * windLoad * bendShape;
worldPosition.y -= windLoad * windLoad * t * aHeight * 0.16;
```

For PBR normals use Rodrigues rotation around the horizontal perpendicular axis:

```glsl
vec3 bendAxis = normalize(vec3(uWindDirection.y, 0.0, -uWindDirection.x));
objectNormal = objectNormal * grassBendCosine
  + cross(bendAxis, objectNormal) * grassBendSine
  + bendAxis * dot(bendAxis, objectNormal) * (1.0 - grassBendCosine);
```

- [ ] **Step 4: Pass the same field to both layers with distinct response**

```ts
const windDirection = getGrassWindDirectionVector(settings.wind.directionAngle);
const windProfile = getGrassWindProfileCode(settings.wind.profile);
const sharedWind = {
  windDirection,
  windFlow: settings.wind.flow,
  windNoiseDetail: settings.wind.noiseDetail,
  windNoiseScale: settings.wind.noiseScale,
  windNoiseStrength: settings.wind.noiseStrength,
  windProfile,
  windSeed: settings.wind.seed,
  windStrength: settings.wind.strength,
};
```

Spread `sharedWind` into tall and lawn material settings, with `windResponse: 1` for tall grass and `windResponse: GRASS_LAWN_WIND_RESPONSE` for lawn. Pass `progress` to both layers.

- [ ] **Step 5: Register every new interaction input without changing workload dimensions**

Put `wind.directionAngle`, `wind.flow`, `wind.noiseStrength`, `wind.noiseScale`, `wind.noiseDetail`, and `wind.seed` in `grassRenderSliderTargets`; put `wind.profile` in `grassRenderChangeTargets`; remove `wind.direction`.

- [ ] **Step 6: Expose deterministic product observables**

```ts
const windDirection = getGrassWindDirectionVector(currentSettings.wind.directionAngle);
canvas.dataset.grassWindProfile = currentSettings.wind.profile;
canvas.dataset.grassWindDirectionAngle = String(currentSettings.wind.directionAngle);
canvas.dataset.grassWindDirectionVector = JSON.stringify(windDirection);
canvas.dataset.grassWindFlow = String(currentSettings.wind.flow);
canvas.dataset.grassWindSeed = String(currentSettings.wind.seed);
host.dataset.grassWindProfile = currentSettings.wind.profile;
host.dataset.grassWindDirectionAngle = String(currentSettings.wind.directionAngle);
host.dataset.grassWindDirectionVector = JSON.stringify(windDirection);
```

Include profile, angle, flow, seed, and progress in both layer frame signatures, but use a stable `0` progress component for Blast so its signature proves timeline invariance.

- [ ] **Step 7: Run focused unit and pipeline gate tests**

Run:

```bash
npx vitest run src/app/grass/grass-wind.test.ts src/app/grass-product.test.ts src/app/grass-dual-layers.test.ts src/app/app-performance.gates.test.ts
```

Expected: PASS with no unknown renderer target or stale input errors.

### Task 4: Align Acceptance, Browser Proof, And Product Copy

**Files:**
- Modify: `src/app/app-acceptance-data.ts:114-175,510-623`
- Modify: `src/app/app-acceptance-layer-data.ts`
- Modify: `src/app/app-product-readiness.ts`
- Modify: `src/app/grass/grass-controls.ts`
- Modify: `src/app/grass/grass-lawn-controls.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `e2e/grass-directed-wind.spec.ts`
- Modify: `e2e/grass-dual-layers.spec.ts:405-485`
- Modify: `e2e/grass-timeline-persistence.spec.ts:235-315`

- [ ] **Step 1: Replace acceptance rows with the eight visible wind controls**

Use automated test name `Blender-inspired wind profiles map to dual-layer directional flow` and browser test name `grass wind profiles angle and dual-layer blast` for:

```ts
[
  ["grass.wind-profile", "wind.profile", "segmented"],
  ["grass.wind-direction", "wind.directionAngle", "slider"],
  ["grass.wind-strength", "wind.strength", "slider"],
  ["grass.wind-flow", "wind.flow", "slider"],
  ["grass.noise-strength", "wind.noiseStrength", "slider"],
  ["grass.noise-scale", "wind.noiseScale", "slider"],
  ["grass.noise-detail", "wind.noiseDetail", "slider"],
  ["grass.wind-seed", "wind.seed", "slider"],
]
```

Declare option coverage for all four profiles and hidden/visible coverage for all seven dependent controls. Update `appControlSectionInventory` with one `Wind Field` entry containing all eight targets and remove every claim that Lawn Cover is windless.

- [ ] **Step 2: Rewrite the wind browser test around profile and angle controls**

Create the exact Playwright test title `grass wind profiles angle and dual-layer blast`. Select Off through `wind.profile` and use `expectToolcraftConditionalControlVisibility` for all seven dependent controls. Select Breeze, Gust, and Blast through the same segmented control and use `expectToolcraftProductObservableToChange` for the profile requirement. Set the Direction slider to `0`, `90`, `180`, and `270`, asserting the exact `data-grass-wind-direction-vector` values `[1,0]`, `[0,1]`, `[-1,0]`, and `[0,-1]`. Change Strength, Flow, Noise, Gust scale, Turbulence, and Seed through their real sliders under their matching requirement ids. Sample Blast at timeline fractions `0.18` and `0.73` and assert identical tall and lawn wind signatures. Use the existing protected helpers for every acceptance requirement. Pixel screenshots must prove `0°` and `180°` produce separated field deformation after snapping the view to `+z`.

- [ ] **Step 3: Change the dual-layer browser assertion from windless lawn to shared animation**

```ts
await expect.poll(() => canvas.getAttribute("data-grass-tall-frame-signature")).not.toBe(tallBeforeWindFrame);
await expect.poll(() => canvas.getAttribute("data-grass-lawn-frame-signature")).not.toBe(lawnBeforeWindFrame);
```

- [ ] **Step 4: Persist version-2 profile, direction angle, flow, and seed**

Set Blast, `180°`, Flow `100`, and Seed `128` through real controls, reload, and expect the same values plus the existing canvas, timeline, PBR, and HDRI state.

- [ ] **Step 5: Run acceptance and focused browser checks**

Run:

```bash
npx vitest run src/app/app-schema.test.ts src/app/grass-product.test.ts src/app/grass-dual-layers.test.ts src/app/app-acceptance.product-readiness.test.ts src/app/app-acceptance.base-coverage.test.ts src/app/app-acceptance.control-state.test.ts
npx playwright test e2e/grass-directed-wind.spec.ts e2e/grass-dual-layers.spec.ts e2e/grass-timeline-persistence.spec.ts --grep "grass wind profiles angle and dual-layer blast|dual grass layers|grass field state restores after reload"
```

Expected: all selected Vitest and Playwright tests PASS and protected helpers emit matching runtime evidence.

### Task 5: Complete Toolcraft Worklog And Delivery Verification

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`
- Verify: `src/app/app-performance-impact.json`

- [ ] **Step 1: Add one Decision Trail entry for this coherent batch**

Record the Blender manual sources, profile semantics, angle mapping, 0.45 lawn response, fixed-cost shader decision, rejected Vortex/falloff/stateful simulation alternatives, all changed files, development checks, and remaining visual risks. Update earlier high-level descriptions only where they incorrectly describe the current product as having a permanently windless lawn.

- [ ] **Step 2: Read the routed Verification-phase documents one file per read**

Read `docs/toolcraft/acceptance-testing.md`, then `docs/toolcraft/performance.md`. Do not combine them in one command.

- [ ] **Step 3: Run AI preflight and derive exact delivery selectors**

Run:

```bash
npm run ai:check
```

Expected: PASS with no code-health, production-cycle, schema-boundary, or skill-availability blocker.

- [ ] **Step 4: Run the single protected Tier-3 delivery gate**

Use exact selectors reported by the impact checker. The expected command shape is:

```bash
npm run verify:delivery -- --tier=3 --unit-test=src/app/grass-product.test.ts --unit-test=src/app/grass-dual-layers.test.ts --unit-test=src/app/grass/grass-wind.test.ts --browser-test="grass wind profiles angle and dual-layer blast" --browser-test="dual grass layers map independent settings and wind ownership" --browser-test="grass field state restores after reload"
```

Expected: PASS and a protected delivery receipt. If the runner reports a different exact selector set from `app-performance-impact.json`, use that reported set once rather than rerunning unrelated aggregate gates.

- [ ] **Step 5: Start or reuse the verified app server**

Run:

```bash
npm run dev
```

Expected: the command reports the saved Toolcraft URL after verifying the app identity endpoint and title marker.

- [ ] **Step 6: Inspect the real UI in the controlled browser**

Verify that the Wind Field section fits without clipped labels; Off collapses dependent controls; cardinal directions bend both layers correctly; Blast visibly holds both layers to one side across timeline samples; Breeze and Gust remain seamless; no console or WebGL errors appear during drag, zoom, profile switching, and timeline playback.
