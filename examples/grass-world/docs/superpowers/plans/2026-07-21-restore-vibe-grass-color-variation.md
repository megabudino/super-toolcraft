# Restore Vibe And Grass Color Variation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This workspace executes inline because subagent dispatch was not requested.

**Goal:** Restore the exact pre-v8 scene treatment and add independent, deterministic color-variation controls for Tall Grass and Lawn Cover.

**Architecture:** Revert the previous renderer/default/scan changes from their known old constants and shapes. Keep variation as uniform-controlled color-only shader work derived from existing instance attributes, then expose two Toolcraft sliders that invalidate only retained render passes.

**Tech Stack:** TypeScript, Three.js WebGL/GLSL, Toolcraft schema controls and persistence.

---

### Task 1: Restore The Previous Scene Vibe

**Files:**
- Modify: `src/app/grass/grass-defaults.ts`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/grass/grass-scene.ts`
- Modify: `src/app/grass/grass-scan-layout.ts`
- Modify: `src/app/grass/grass-scan-resource.ts`

- [x] **Step 1: Restore old defaults**

Restore ground `#39b844`, environment intensity `176`, rock offset `-0.015`, surface normal `82`, and surface roughness `92`; advance persistence key/version to v9.

- [x] **Step 2: Restore old ground/light/shadow code**

Restore the five-percent white ground mix, PBR exposure `1.2`, `PCFShadowMap`, 1024px map, prior bias values, far plane `32`, and bounds `±8`.

- [x] **Step 3: Restore old rock layout/resource**

Remove scan `colors` and `tilts`, automatic burial, instance colors, pitch/roll, vertex-color material flags, and the modified rock AO/normal/roughness constants.

### Task 2: Add Color Variation State And Controls

**Files:**
- Modify: `src/app/grass/grass-defaults.ts`
- Modify: `src/app/grass/grass-appearance-controls.ts`
- Modify: `src/app/grass/grass-lawn-controls.ts`
- Modify: `src/app/grass/grass-values.ts`
- Modify: `src/app/grass/grass-render-targets.ts`

- [x] **Step 1: Define defaults and settings**

Add `appearance.colorVariation: 58` and `lawn.colorVariation: 38`; normalize both to `0–1` in `readGrassSettings` and add them to the corresponding typed layer settings.

- [x] **Step 2: Add built-in sliders**

Add `Color variation` responsiveness sliders, range `0–100`, step `1`, unit `%`, to `Tall Grass Appearance` and `Lawn Appearance`.

- [x] **Step 3: Route live invalidation**

Add both targets to `grassRenderSliderTargets`; do not add them to layout targets or performance workload dimensions.

### Task 3: Implement Color-only Shader Variation

**Files:**
- Modify: `src/app/grass/grass-material.ts`
- Modify: `src/app/grass/grass-scene.ts`

- [x] **Step 1: Reduce the variation model to color only**

Keep deterministic micro/macro values from `aOffset`/`aPhase`, remove height/width influence, and pass value plus warm/cool blend factors to both fragment paths.

- [x] **Step 2: Add one retained uniform**

Add `uColorVariation` to material settings/uniforms and blend original gradient toward cool-green/warm-olive/value-shifted color. A zero uniform must leave the original gradient unchanged.

- [x] **Step 3: Map layer settings**

Pass `appearance.colorVariation` into Tall Grass rendering and `lawn.colorVariation` into Lawn Cover rendering.

### Task 4: Align Product Contracts

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-acceptance-layer-data.ts`
- Modify: `src/app/grass-realistic-preset.test.ts`
- Modify: `src/app/grass-megascans.test.ts`
- Modify: `src/app/grass-product.test.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [x] **Step 1: Add acceptance and section inventory rows**

Map each slider to its layer-specific rendered-color observable and add each target to the matching color-ramp inventory entity.

- [x] **Step 2: Align source expectations and performance inventory**

Restore old preset/surface/persistence expectation values, add new color defaults, and remove the reverted 2K-shadow risk statement while recording fixed-cost uniform variation.

- [x] **Step 3: Record and audit without tests**

Record the Tier 3 correction, explicit skipped checks, and risk. Inspect target reachability, uniform writes, zero-variation behavior, stale v8 values, acceptance coverage, and impact ownership without running automated commands.
