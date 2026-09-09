# Preserve Exported Donut Scenes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure standard Export Settings carries every named donut scene and Import Settings plus reload never replaces a newer restored scene with stale preset-library values.

**Architecture:** Keep the existing Toolcraft Settings Transfer control as the only visible import/export surface and retain backward compatibility with the existing string-encoded `donut.presetLibrary`. Make the currently restored selected scene authoritative when it differs from its library entry, synchronize it before the next user interaction, and store the camera pose inside every named scene.

**Tech Stack:** React, TypeScript, Toolcraft runtime commands and persistence, Vitest, Playwright.

---

Verification tier: Tier 3
Reason: Preset persistence, Settings Transfer payloads, reload restoration, camera state, and renderer-driving scene application change.
Run: Focused preset-library unit tests and one multi-scene Import/Export/Reload browser scenario, then bare `npm run verify:delivery`.
Skip: Measured performance; the user reported data loss and export semantics, not a performance problem.

### Task 1: Reproduce the Data-Loss Path

**Files:**
- Modify: `src/app/donut/donut-preset-library.test.ts`
- Modify: `e2e/donut-presets.spec.ts`

- [ ] **Step 1: Require a complete scene snapshot**

Add a unit assertion that `readCurrentDonutPresetValues` and every normalized
library entry include:

```ts
"scene.orientation": {
  position: [-3.4498932616839237, 5.142120380211952, 5.624663054654681],
  up: [0.3213835982235889, 0.7887697577332818, -0.5239798202967733],
}
```

Also parse an older library entry without this key and require migration to the
default pose without rejecting its existing material and geometry settings.

- [ ] **Step 2: Add a multi-scene browser reproduction**

Tune unique `donut.majorRadius` values for Classic Glazed, Strawberry Party,
and Matcha Cream. Export immediately through the built-in Export Settings
button and assert all three values plus `scene.orientation` are present in the
embedded ten-entry library.

Create a valid imported payload whose selected Matcha top-level value is `0.93`
while its stale embedded Matcha entry is `0.85`. Import it, reload the real app,
and require the visible Ring value to remain `0.93`. Export again and require
the Matcha library entry to be repaired to `0.93`.

- [ ] **Step 3: Run the focused tests and confirm failure**

Run:

```bash
pnpm exec vitest run src/app/donut/donut-preset-library.test.ts
pnpm exec playwright test e2e/donut-presets.spec.ts --grep 'donut.presetLibrary'
```

Expected: orientation coverage fails in Vitest and the browser reload restores
the stale `0.85` value under the current implementation.

### Task 2: Preserve the Selected Restored Scene

**Files:**
- Modify: `src/app/donut/donut-presets.ts`
- Modify: `src/app/donut/donut-preset-library.ts`
- Modify: `src/app/donut/donut-canvas.tsx`

- [ ] **Step 1: Add a typed scene pose preset value**

Extend `DonutPresetValue` with a readonly orientation object containing finite
three-number `position` and `up` tuples. Normalize invalid or missing poses to
the supplied camera default while preserving valid poses from imported older
or newer scene snapshots.

- [ ] **Step 2: Capture and apply orientation per scene**

Include `scene.orientation` in factory defaults, current scene capture,
normalization, serialization, and the existing per-target preset application
loop. Keep transient `icing.clearMode` and `sprinkles.clear`, output encoding,
and render scale outside named scene snapshots.

- [ ] **Step 3: Make restored current values authoritative**

Add a pure initial-application decision that only auto-applies Matcha to a clean
schema-default workspace. If selected restored values differ from the stored
entry, do not apply the stale entry.

Run preset application and selected-scene synchronization in ordered layout
effects. Remove the `sourceChanged` early return so an imported or restored
library is repaired from the final selected top-level scene. Keep
`presetApplicationRef` protection so switching Flavor still applies the chosen
entry instead of saving the previous scene into it.

- [ ] **Step 4: Synchronize before immediate export**

Keep the selected scene library update in a layout effect and dispatch it with
`history: "skip"`. By the time another visible interaction such as Export
Settings is possible, `donut.presetLibrary` must contain the current scene.

- [ ] **Step 5: Run focused unit and browser tests**

Run the Task 1 commands.

Expected: all focused tests pass; the standard exported JSON contains all ten
scenes, and stale selected-scene data self-repairs across import and reload.

### Task 3: Align Acceptance and Delivery Ownership

**Files:**
- Modify: `src/app/donut/donut-reference-acceptance.ts`
- Modify: `src/app/donut/donut-preset-acceptance.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-verification-impact.json`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Describe complete scene transfer**

Update acceptance wording so the preset-library row explicitly covers multiple
named scenes, camera pose, built-in Export Settings, Import Settings, and real
reload restoration.

- [ ] **Step 2: Record exact ownership**

Ensure preset and canvas modules map to `donut.preset`,
`donut.presetLibrary`, `runtime.settingsTransfer`, `persistence.reload`, and
`scene.orientation` where they can change those outcomes.

- [ ] **Step 3: Record the root cause and compatibility decision**

Add a Decision Trail entry containing the user report, the stale-library
overwrite cause, the retained string format for backward compatibility, the
selected-scene repair rule, orientation inclusion, and the fact that historical
values absent from every surviving export cannot be reconstructed.

### Task 4: Verify and Return the App

**Files:**
- No additional production files.

- [ ] **Step 1: Run static checks**

Run:

```bash
pnpm ai:check
pnpm exec tsc --noEmit
```

Expected: both pass.

- [ ] **Step 2: Run the protected delivery gate**

Run:

```bash
npm run verify:delivery
```

Expected: one successful functional-targeted receipt with all derived unit and
browser acceptance.

- [ ] **Step 3: Confirm the existing server**

Verify `http://127.0.0.1:3003/.toolcraft/server-identity.json` reports this
project root and the index contains the Donut title marker. Keep the current
server instead of starting a duplicate.

