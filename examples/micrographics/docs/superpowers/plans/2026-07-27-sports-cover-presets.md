# Sports Cover Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bundled cover picker with four supplied sports images plus the retained Mesh preset, ordered as one complete new row followed by Mesh.

**Architecture:** Keep the existing built-in `imagePicker`, `source.preset` state target, `coverPresetSrc` resolver, preview, and export paths. Replace only the catalog/assets/default semantics and align acceptance. Preserve the legacy internal value `atlas` for the first item while changing its visible label and source to Runner. Normalize any other removed persisted preset id to Runner through one targeted runtime command so unrelated poster state is preserved.

**Tech Stack:** TypeScript, Toolcraft schema controls, Vite public assets, Vitest, Playwright.

---

### Task 1: Lock the new catalog contract with failing tests

**Files:**
- Modify: `src/app/app-schema.test.ts`
- Modify: `e2e/app-controls.spec.ts`

- [ ] **Step 1: Add the exact schema-order assertion**

Assert that `Source Photo / Cover` has this ordered item contract:

```ts
expect(productSections[5]?.controls.preset).toMatchObject({
  defaultValue: "atlas",
  items: [
    { alt: "Runner", value: "atlas" },
    { alt: "Profile", value: "profile" },
    { alt: "Fitness", value: "fitness" },
    { alt: "Pilates", value: "pilates" },
    { alt: "Mesh", value: "mesh" },
  ],
  target: "source.preset",
  type: "imagePicker",
});
```

- [ ] **Step 2: Update browser intent before implementation**

Replace the old `Track`, `Scan`, and `Atlas` interactions with a loop over:

```ts
["Runner", "Profile", "Fitness", "Pilates", "Mesh"]
```

After the loop, click `Runner` again so the test leaves the app on the default preset.

- [ ] **Step 3: Prove the schema test is red**

Run:

```bash
npx vitest run src/app/app-schema.test.ts
```

Expected: FAIL because the current catalog still contains eight old presets.

### Task 2: Install the supplied media and replace the catalog

**Files:**
- Create: `public/covers/runner-close-crop.jpg`
- Create: `public/covers/side-profile.jpg`
- Create: `public/covers/fitness-explore.jpg`
- Create: `public/covers/pilates-group.jpg`
- Keep: `public/covers/mesh.jpg`
- Remove: `public/covers/atlas.jpg`
- Remove: `public/covers/orbit.jpg`
- Remove: `public/covers/static.jpg`
- Remove: `public/covers/track.jpg`
- Remove: `public/covers/film.jpg`
- Remove: `public/covers/steel.jpg`
- Remove: `public/covers/scan.jpg`
- Modify: `src/app/template-covers.ts`
- Modify: `src/app/app-acceptance-data.ts`

- [ ] **Step 1: Create optimized local JPEG copies**

Use macOS `sips` to preserve each source crop while converting to quality-90 JPEG:

```bash
sips -s format jpeg -s formatOptions 90 "/Users/kusnizza/Desktop/Runner Sports Photography Close Crop.png" --out public/covers/runner-close-crop.jpg
sips -s format jpeg -s formatOptions 90 "/Users/kusnizza/Desktop/Strict 90 Side Profile Close-up.png" --out public/covers/side-profile.jpg
sips -s format jpeg -s formatOptions 90 "/Users/kusnizza/Desktop/Fitness Banner Explore.png" --out public/covers/fitness-explore.jpg
sips -s format jpeg -s formatOptions 90 "/Users/kusnizza/Desktop/Pilates Training Group of 8.png" --out public/covers/pilates-group.jpg
```

- [ ] **Step 2: Replace the preset catalog**

Set `micrographCoverPresets` to:

```ts
[
  { id: "atlas", label: "Runner", src: "/covers/runner-close-crop.jpg" },
  { id: "profile", label: "Profile", src: "/covers/side-profile.jpg" },
  { id: "fitness", label: "Fitness", src: "/covers/fitness-explore.jpg" },
  { id: "pilates", label: "Pilates", src: "/covers/pilates-group.jpg" },
  { id: "mesh", label: "Mesh", src: "/covers/mesh.jpg" },
]
```

The stable first value `atlas` is intentionally retained only as a persistence-compatible internal key; no Atlas label or Atlas image remains.

- [ ] **Step 3: Align typed option coverage**

Set `source-preset.optionCoverage` to:

```ts
["atlas", "profile", "fitness", "pilates", "mesh"]
```

- [ ] **Step 4: Remove unreferenced old active assets**

Delete only the seven old files listed above. Do not alter `public/covers/_to_delete` because it is unrelated historical material.

- [ ] **Step 5: Run focused unit and type checks**

Run:

```bash
npx vitest run src/app/app-schema.test.ts
npm run typecheck
```

Expected: both pass.

### Task 3: Normalize removed persisted preset ids

**Files:**
- Modify: `src/app/template-covers.ts`
- Modify: `src/app/app-composition.tsx`
- Modify: `src/app/app-schema.test.ts`

- [ ] **Step 1: Add a catalog-owned normalizer**

Return known preset ids unchanged and map any removed or invalid value to the first catalog item, Runner. Reuse that normalizer in `coverPresetSrc`.

- [ ] **Step 2: Normalize runtime state without resetting the poster**

At product canvas assembly, compare `source.preset` with the normalized value and dispatch one history-skipping `controls.setValue` command only when they differ.

- [ ] **Step 3: Prove the migration semantics**

Add unit assertions that `mesh` remains `mesh`, a removed id becomes `atlas`, and the removed id resolves to Runner's local asset.

### Task 4: Browser and delivery proof

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Record Iteration 24**

Document the user request, five-item order, retained Mesh second-row position, stable first persisted key, source files, media route contracts, Tier 3 choice, output mapping, verification, skipped full audit, and risks.

- [ ] **Step 2: Read verification contracts**

Read `docs/toolcraft/acceptance-testing.md` and `docs/toolcraft/performance.md` in separate terminal reads before proof.

- [ ] **Step 3: Run focused browser acceptance**

Run:

```bash
npm run test:browser -- --grep="browser: sports cover presets update poster"
```

Expected: PASS; every visible preset changes the product output.

- [ ] **Step 4: Run protected targeted delivery once**

Run:

```bash
npm run verify:delivery -- --tier=3 --unit-test=src/app/app-schema.test.ts --browser-test="browser: sports cover presets update poster"
```

If the changed-input comparison also includes the pre-existing pending
`src/app/template-renderers-mega-factory.ts` change, append its two canonical
paths:

```bash
--performance-test='browser perf: toolcraft path performance-path:%5B%22batch-responsive%22%2C%22export%22%2C%5B%22export-png%22%5D%2C%5B%22export-only%22%5D%2C%5B%22element-count%22%5D%5D'
--performance-test='browser perf: toolcraft path performance-path:%5B%22initial-render%22%2C%22initial-render%22%2C%5B%22poster-scene%22%5D%2C%5B%22main%22%5D%2C%5B%22element-count%22%5D%5D'
--performance-test='browser perf: toolcraft path performance-path:%5B%22interactive-continuous%22%2C%22control-drag%22%2C%5B%22poster-scene%22%5D%2C%5B%22main%22%5D%2C%5B%22element-count%22%5D%5D'
--performance-test='browser perf: toolcraft path performance-path:%5B%22interactive-continuous%22%2C%22mask-drag%22%2C%5B%22poster-scene%22%5D%2C%5B%22main%22%5D%2C%5B%22element-count%22%5D%5D'
--performance-test='browser perf: toolcraft path performance-path:%5B%22interactive-discrete%22%2C%22control-change%22%2C%5B%22poster-scene%22%5D%2C%5B%22main%22%5D%2C%5B%22element-count%22%5D%5D'
```

Expected: protected receipt with status `passed`.

- [ ] **Step 5: Start the app and visually inspect**

Run:

```bash
npm run dev
```

Open the saved local URL. Verify the first row is Runner, Profile, Fitness, Pilates; Mesh starts the second row; and clicking each item changes the full-bleed poster crop.
