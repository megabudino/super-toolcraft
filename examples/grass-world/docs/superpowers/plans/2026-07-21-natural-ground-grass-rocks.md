# Natural Ground, Grass, And Rocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This workspace is executing inline because the active collaboration contract does not authorize subagent dispatch.

**Goal:** Make the existing grass scene retain scanned ground color, show restrained grass variation, seat rocks naturally in the terrain, and render clearer physical contact shadows.

**Architecture:** Keep the current retained Three.js scene and schema. Add deterministic variation from already-available instance data in the grass shaders, add seeded rock pose/color data to the scan layout, and tune the existing PBR/shadow pipeline and persisted defaults without adding controls or changing workload boundaries.

**Tech Stack:** TypeScript, Three.js WebGL/GLSL, Toolcraft runtime schema and renderer pipeline.

---

### Task 1: Correct The Ground And Lighting Defaults

**Files:**
- Modify: `src/app/grass/grass-defaults.ts`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/grass/grass-scene.ts`

- [x] **Step 1: Replace the bright green ground multiplier with a neutral moss tint**

Set `appearance.groundColor` to `#d1d6cb`, `environment.intensity` to `125`, `surface.normalStrength` to `100`, `surface.roughness` to `82`, and `scan.rocks.surfaceOffset` to `-0.025` while preserving all unrelated imported defaults.

- [x] **Step 2: Preserve scanned albedo and deepen surface response**

Remove the five-percent white lerp in `GrassSceneRenderer.render`. Set ground AO intensity to `1`, keep DirectX normal orientation, and use the schema-driven normal/roughness values directly.

- [x] **Step 3: Tune PBR exposure and contact shadows**

Use `THREE.PCFSoftShadowMap`, a `2048 × 2048` key-light map, shadow bounds of `±5.5`, `far = 26`, `bias = -0.0002`, `normalBias = 0.012`, and PBR tone-mapping exposure `1.05`.

- [x] **Step 4: Activate the corrected persisted preset**

Increment schema persistence from version `7` to `8` so existing local state does not keep the washed-out ground defaults.

### Task 2: Add Deterministic Natural Grass Variation

**Files:**
- Modify: `src/app/grass/grass-material.ts`

- [x] **Step 1: Derive variation without a new buffer**

In both the physical and stylized vertex paths, derive micro variation from `aPhase` and macro variation from `aOffset.xz`. Pass `vGrassColorVariation` and `vGrassDryness` to the fragment path.

- [x] **Step 2: Vary blade silhouette**

Multiply ribbon width by a restrained deterministic range around `0.78–1.18`, vary authored height by a clump-weighted `0.86–1.16` factor, and preserve the existing taper, bend, slope, and wind relationships.

- [x] **Step 3: Vary grass albedo naturally**

Multiply the editable gradient by a clump/value factor around `0.84–1.08`, then apply a warm olive shift only to the highest deterministic dryness tail. Apply the same model to PBR and stylized materials so preview-mode changes do not change the scene distribution.

### Task 3: Seat And De-duplicate Rock Scans

**Files:**
- Modify: `src/app/grass/grass-scan-layout.ts`
- Modify: `src/app/grass/grass-scan-resource.ts`

- [x] **Step 1: Extend scan layout data**

Add `colors: Float32Array` and `tilts: Float32Array` to `GrassScanLayout`. Fill them deterministically from the existing layer seed. Rocks receive pitch/roll in a bounded approximately `±20–26°` range; plants receive zero tilt and subtle neutral-green tint variation.

- [x] **Step 2: Add scale-aware rock burial**

Compute scan scale before height and subtract `baseSize × scale × 0.08–0.18` for rocks in addition to the existing surface offset. Keep non-rock placement unchanged.

- [x] **Step 3: Apply pose and instance color**

Compose terrain alignment, yaw, pitch, and roll for rocks. Enable vertex colors on scan materials, call `setColorAt` for every live instance, and mark `instanceColor` dirty after the bounded layout update.

- [x] **Step 4: Refine rock PBR**

Keep `MeshStandardMaterial` and all Quixel maps; use full AO, normal strength near `1`, and roughness near `0.84`. Do not add rigid-body simulation.

### Task 4: Record Performance And Delivery Impact

**Files:**
- Modify: `src/app/app-performance.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [x] **Step 1: Update the renderer risk inventory**

Record that the quality-first static/export path uses a bounded 2K soft shadow map and deterministic constant-cost shader variation. Do not add workload dimensions because counts and backing scale are unchanged.

- [x] **Step 2: Record the decision trail**

Add this Tier 3 renderer batch, its visual source, state/output mapping, changed files, and the explicit user-requested test skip to the worklog.

- [x] **Step 3: Perform the requested static-only audit**

Inspect every changed source reference, confirm all new `GrassScanLayout` fields are initialized in the zero-count and populated paths, confirm the impact inventory already owns every changed production file, and search the written plan for placeholders. Do not run unit, browser, delivery, or performance tests.
