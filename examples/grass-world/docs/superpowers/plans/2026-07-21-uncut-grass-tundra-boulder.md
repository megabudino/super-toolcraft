# Uncut Grass Ground And Tundra Boulder Implementation Plan

**Goal:** Replace the ground PBR source with the supplied Uncut Grass scan and add one seed-positioned Tundra Mossy Boulder with independent controls.

**Architecture:** Convert the supplied archives into the app's compact WebP/meshbin asset formats, extend the existing retained scan resource with one hero mesh, and route four built-in controls through the existing rock-layout and scene-render passes.

**Tech Stack:** TypeScript, Three.js, GLSL/PBR materials, Toolcraft schema/runtime, Node asset preprocessing, WebP, compact meshbin.

---

### Task 1: Convert And Register Assets

**Files:**
- Add: `scripts/process-tundra-assets.mjs`
- Add/replace: `src/app/grass/assets/scans/ground/ground-*.webp`
- Add: `src/app/grass/assets/scans/boulder/boulder-*.webp`
- Add: `src/app/grass/assets/scans/boulder/boulder.meshbin`
- Modify: `src/app/grass/grass-scan-assets.ts`

- [x] Add a reproducible converter for the two supplied ZIP archives.
- [x] Convert Uncut Grass BaseColor/AO/Normal/Roughness to 2048px WebP and replace the existing ground maps.
- [x] Convert the Tundra Mossy Boulder FBX to normalized meshbin and its four PBR maps to 2048px WebP.
- [x] Register the new boulder geometry and texture URLs while retaining the existing ground texture contract.

### Task 2: Add Boulder State And Controls

**Files:**
- Modify: `src/app/grass/grass-defaults.ts`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/grass/grass-values.ts`
- Modify: `src/app/grass/grass-scan-controls.ts`

- [x] Add v10 defaults for Include, Size, Seed, and Surface offset.
- [x] Add typed bounded `scans.boulder` settings parsing.
- [x] Add a four-control `Tundra Boulder` section using built-in switch/sliders.
- [x] Keep Toolcraft Layers disabled and preserve existing Small Rocks controls.

### Task 3: Add Deterministic Layout And Retained PBR Resource

**Files:**
- Modify: `src/app/grass/grass-scan-layout.ts`
- Modify: `src/app/grass/grass-scan-resource.ts`
- Modify: `src/app/grass/grass-scene.ts`
- Modify: `src/app/grass/grass-output.tsx`

- [x] Build one guarded, deterministic terrain-sampled transform from seed, field, terrain, size, and offset.
- [x] Load one boulder geometry/material/mesh in the retained scan resource, including AO/normal/roughness, Sun Patches, cast shadow, receive shadow, and disposal.
- [x] Update the boulder whenever the Small Rocks layout pass receives a changed boulder/terrain key.
- [x] Expose an independent zero/one boulder count and semantic canvas layer marker.

### Task 4: Align Pipeline And Performance Contracts

**Files:**
- Modify: `src/app/grass/grass-render-targets.ts`
- Modify: `src/app/app-renderer-scan-pipeline.ts`
- Modify: `src/app/app-renderer-pipeline.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-performance-impact.json` only if a newly added product production module requires ownership.

- [x] Add boulder controls to the existing rock-layout invalidation and cache-key inputs.
- [x] Supply exact boulder values when running the rock layout pass and bump resource/runtime signatures.
- [x] Add the Tundra boulder renderer layer and fixed source/draw risks without a new workload dimension.
- [x] Confirm existing changed modules own the rock-layout, scan-resource, scene-render, and export passes.

### Task 5: Align Acceptance And Worklog

**Files:**
- Modify: `src/app/app-acceptance-scan-data.ts`
- Modify: `src/app/grass-megascans.test.ts`
- Modify: `src/app/grass-product.test.ts`
- Modify: `e2e/grass-megascans.spec.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [x] Add control acceptance and section-inventory coverage for all four boulder targets.
- [x] Align source expectations for v10 persistence, registered ground/boulder assets, deterministic boulder settings/layout, and resource signature.
- [x] Record the Tier 3 asset/control/renderer decision trail and standing skipped-test constraint.
- [x] Perform only asset-conversion diagnostics and static source/target/impact/server inspection; do not run automated tests or protected delivery verification.
