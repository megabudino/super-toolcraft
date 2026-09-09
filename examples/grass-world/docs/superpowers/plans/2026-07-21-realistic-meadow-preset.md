# Dense Realistic Meadow Coverage, Masks, And Preset Implementation Plan

## Goal

Rebuild the current sparse live field into a dense, reference-matched meadow
without reducing perceived quality, PBR response, wind deformation, shadows, or
full-quality export. Density controls must own spatial coverage. Preview controls
may change geometric detail and render cost, but must not silently remove most of
the authored field. Lawn, Tall Grass, and every multi-instance scan layer must
support an independent editable spatial distribution mask.

## Current-state corrections

- Do not reimplement scan normal maps. `grass-scan-materials.ts` already binds
  supplied normal maps and applies positive X / negative Y DirectX normal scale;
  `grass-scan-resource.ts` already applies the ground and per-family strengths.
  Add characterization proof and change implementation only if that proof fails.
- Do not add a second lighting branch. `grass-scene.ts` already combines PMREM
  environment lighting with bounded ambient, key, and rim contributions. Add
  reference/pixel proof and change the light policy only for a measured mismatch.
- Do not use the obsolete `Static PBR` state. The product remains always-PBR;
  `wind.profile: "off"` / Wind Type None is the only static state.
- Do not set persistence to `v3`. The current schema is `v14`; the new default
  state and spatial-mask values require an explicit `v15` key/version.
- Keep the existing material Texture Masks. The new Distribution Masks control
  where instances are planted and are a separate product concept.

## Non-negotiable behavior

1. At an all-white mask and minimum spacing, `field.densityMax` and
   `lawn.densityMax` reach their requested bounded counts whenever geometric
   capacity permits. Remove unexplained hard floors that override the advertised
   minimum-spacing controls.
2. Density is monotonic: increasing density cannot reduce accepted roots,
   occupied field area, or visible coverage for the same seed and mask.
3. Preview quality partitions roots between detailed and lightweight animated
   geometry. It does not change the effective root distribution or mask.
4. Lightweight coverage uses the same world root, PBR color family, global wind
   field, timeline phase, and anchored-root deformation contract as detailed
   grass. No CPU per-blade animation or frozen surface filler is allowed.
5. Export continues to use complete authored Tall/Lawn geometry and the same
   spatial masks. Preview and export may differ in topology, not composition.
6. A layer mask is sampled in field space. White means full local density, black
   means no instances, and intermediate values scale deterministic local density.
7. Tall slope filtering composes with the editable mask as
   `distributionMask * topFacingMask`; it does not replace the user mask.
8. Terrain, the ground surface, and the single Tundra Boulder do not receive a
   density mask. Independent masks apply to Lawn, Tall, Tufted, Wild, White
   Flowers, Yellow Flowers, and Small Rocks.

## Delivery batches

### Batch A — Dense coverage and editable layer masks

**Verification tier:** Tier 3 — explicit renderer/performance work.

**Reason:** Changes live Tall/Lawn representation, deterministic placement,
custom controls, layout invalidation, workload semantics, and preview/export
composition.

**Run:** Targeted unit and browser checks while iterating; affected renderer
performance paths; render-plan assessment and protected kernel candidate when
required; one `verify:delivery --reason=explicit-performance-work` after the
batch is stable.

**Skip:** Unaffected media, timeline transport, export-format, and unrelated scan
resource checks unless the impact runner selects them.

### Batch B — Reference meadow reset preset

**Verification tier:** Tier 3 — broad reference-driven visible output plus
defaults and persistence.

**Reason:** Changes the complete reset composition and its persisted state after
the density system has been proven.

**Run:** Focused defaults/schema/persistence tests, real reset/reload/import,
reference/candidate browser captures, normal/light characterization, affected
acceptance, and one impact-derived `verify:delivery` for this separate batch.

**Skip:** A second full performance refresh when Batch B changes only values and
does not alter renderer workload or technique.

---

## Batch A tasks

### Task 1: Lock the sparse-field failure red-first

**Files:**

- Create: `src/app/grass/grass-coverage-policy.test.ts`
- Create: `src/app/grass/grass-distribution-mask.test.ts`
- Create: `e2e/fixtures/grass-studio-density-max.json`
- Create: `e2e/grass-density-coverage.spec.ts`
- Modify: `e2e/grass-preview-mode.spec.ts`

- [ ] Copy only the relevant deterministic values from the user's
      `/Users/kusnizza/Downloads/grass-studio-settings.json` into an app-owned
      fixture; tests must not depend on the Downloads directory.
- [ ] Record field area, requested Tall/Lawn authored counts, accepted roots,
      detailed roots, lightweight roots, Lawn clump count, roots per square
      metre, and mask-weighted roots as browser diagnostics.
- [ ] Add failing proof for the current 7 m × 5 m case: Lawn `30,000`, Lawn
      spacing `0.015 m`, Tall `12,500`, Tall spacing `0.04 m`, preview Tall
      `1,800`, and preview Lawn `12,000`.
- [ ] Prove the current renderer exposes only 2,000 Lawn clumps and that Tall is
      additionally attenuated by the hard-coded zone weight.
- [ ] Add a field-space nearest-root/occupied-cell measurement. At maximum
      density with an all-white mask, the interior 95th-percentile gap must stay
      within the coverage policy's declared bound and no unexplained large empty
      region may remain.
- [ ] Keep screenshots as visual evidence, but do not use a subjective screenshot
      alone as density acceptance.

### Task 2: Create one canonical coverage and spacing policy

**Files:**

- Create: `src/app/grass/grass-coverage-policy.ts`
- Modify: `src/app/grass/grass-layout.ts`
- Modify: `src/app/grass/grass-scan-layout.ts`
- Modify: `src/app/grass/grass-settings-types.ts`
- Modify: `src/app/grass/grass-values.ts`
- Modify: `src/app/grass/grass-settings-signatures.ts`

- [ ] Move authored count, physical spacing capacity, effective mask area,
      detailed count, lightweight count, and diagnostic count calculations into
      pure typed functions. Do not scatter count multipliers across scene,
      resource, and control modules.
- [ ] Remove the magic `0.0024` and `0.0012` area floors. Derive capacity from
      field shape, the advertised `distanceMin`, and a documented packing rule.
- [ ] Use one deterministic bounded spatial sampler with a spatial hash or an
      equivalent measured structure. It must enforce the declared minimum
      distance instead of merely reducing a count and calling that distance.
- [ ] Interpret authored density as full-white-field density. For a partial mask,
      scale total accepted roots by effective mask area while preserving the same
      local density in white regions.
- [ ] Use stable seed/hash ordering so changing preview detail never moves roots
      and increasing density extends the existing distribution rather than
      replacing it wholesale.
- [ ] Add exact unit coverage for empty/full/soft masks, small and large fields,
      minimum/maximum spacing, impossible capacity, repeatability, monotonicity,
      and bounds.

### Task 3: Preserve coverage with hybrid animated live geometry

**Files:**

- Create: `src/app/grass/grass-lightweight-geometry.ts`
- Create: `src/app/grass/grass-lightweight-layer-resource.ts`
- Modify: `src/app/grass/grass-layer-resource.ts`
- Modify: `src/app/grass/grass-lawn-clump-geometry.ts`
- Modify: `src/app/grass/grass-lawn-clump-resource.ts`
- Modify: `src/app/grass/grass-material.ts`
- Modify: `src/app/grass/grass-scene-material-settings.ts`
- Modify: `src/app/grass/grass-scene.ts`
- Modify: `src/app/grass/grass-output.tsx`
- Modify: `src/app/grass/grass-export.ts`

- [ ] Partition each accepted live layout deterministically into a detailed tier
      and a lightweight coverage tier. `preview.bladeCount` and
      `preview.lawnBladeCount` cap only the detailed tier.
- [ ] Render the remaining Tall roots with a bounded low-segment ribbon topology
      and the remaining Lawn roots with bounded lightweight clumps. Do not omit
      those roots from the live composition.
- [ ] Derive Lawn local-root spread from the coverage cell/spacing policy rather
      than `aHeight`; current short blades must not collapse six roots into a
      tiny island surrounded by an empty cell.
- [ ] Keep detailed and lightweight roots disjoint so no blade is double-rendered.
- [ ] Reuse the canonical PBR, instance-color, gradient, texture-mask, sun-patch,
      wind, depth, and color-grade helpers. Do not create a separate stylized or
      unlit filler material.
- [ ] Apply the same analytical wind field at every lightweight root, with fixed
      roots and delayed tips. Rocks remain rigid.
- [ ] Keep full authored geometry exclusive to `export`; live topology must not
      leak into still or video output.
- [ ] Prove camera movement, timeline playback, pointer direction, material
      changes, and unrelated controls do not rebuild layouts or allocate geometry
      per frame.
- [ ] Compare the hybrid maximum-quality frame against the full authored frame at
      low and high camera angles. Reject the topology if foreground silhouette,
      lighting, or wind discontinuities are plainly visible.

### Task 4: Add independent manually editable spatial masks

**Files:**

- Create: `src/app/grass/grass-distribution-mask.ts`
- Create: `src/app/grass/grass-distribution-mask-control.tsx`
- Create: `src/app/grass/grass-distribution-mask-control.module.css`
- Create: `src/app/grass/grass-distribution-mask-controls.ts`
- Create: `src/app/grass/grass-distribution-mask-control.test.tsx`
- Modify: `src/app/app-composition.tsx`
- Modify: `src/app/grass/grass-core-controls.ts`
- Modify: `src/app/grass/grass-lawn-controls.ts`
- Modify: `src/app/grass/grass-scan-controls.ts`
- Modify: `src/app/grass/grass-controls.ts`
- Modify: `src/app/grass/grass-defaults.ts`
- Modify: `src/app/grass/grass-reference-composition.ts`

- [ ] Define one bounded versioned raster-mask value with explicit resolution,
      normalized byte data, and full-white fallback. Keep it serializable through
      Toolcraft values, persistence, settings transfer, reset, undo, and redo.
- [ ] Register one reusable `grassDistributionMask` custom renderer through
      `controlRenderers`; do not hand-compose a panel or keep the product mask in
      isolated React state.
- [ ] Place one mask editor in the owning Lawn, Tall, Tufted, Wild, White,
      Yellow, and Small Rocks sections. The nearest section supplies layer
      identity; no separate generic Mask panel is added.
- [ ] Support Paint and Erase, brush size, hardness, Fill, Clear, Invert, and
      Reset. Show the field boundary and current grayscale mask.
- [ ] Merge one pointer gesture into one history group. Draw the editor preview
      locally during the gesture and coalesce state/layout commits so raw pointer
      events cannot rebuild seven layouts per event.
- [ ] Bilinearly sample masks in field space. Use a stable candidate hash against
      alpha for soft density; never reinterpret the material Texture Mask.
- [ ] Move `getGrassTallZoneWeight` out of the generic runtime layout path. If the
      reference composition remains desirable, convert it into an explicit
      generated v15 Tall default mask rather than a hidden multiplier.
- [ ] Multiply Tall's editable mask by its optional top-facing factor. Scan layer
      masks affect only their owning layout and invalidation pass.
- [ ] Prove painting, erasing, fill, clear, invert, reset, undo, redo, reload, and
      settings export/import all produce the same deterministic placement.

### Task 5: Align controls, inventory, acceptance, and persistence semantics

**Files:**

- Modify: `src/app/grass/grass-core-controls.ts`
- Modify: `src/app/grass/grass-lawn-controls.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Create: `src/app/app-acceptance-distribution-mask-data.ts`
- Modify: `src/app/app-product-readiness.ts`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/grass-product-delivery.test.ts`
- Modify: `src/app/grass-dual-layers.test.ts`
- Modify: `e2e/grass-timeline-persistence.spec.ts`

- [ ] Rename preview labels/descriptions to `Tall detail` and `Lawn detail` or
      equivalent quality language. They must not claim to own visible density.
- [ ] Keep Density, Spacing, Seed, and Distribution Mask with each owning product
      entity. Update `appControlSectionInventory` targets and grouping reasons.
- [ ] Advance persistence from `v14` to `v15`. Missing masks from legacy imported
      settings resolve deterministically to documented fallback masks; stale
      preview/PBR/static keys remain ignored.
- [ ] Add dedicated custom-control acceptance rather than generic output-change
      prose. Cover every visible editor action and the resulting owning-layer
      placement.
- [ ] Keep timeline, layers, panel actions, settings-transfer mode, background,
      image export, and video export behavior otherwise unchanged.

### Task 6: Update the canonical renderer and performance model

**Files:**

- Modify: `src/app/grass/grass-render-targets.ts`
- Modify: `src/app/app-renderer-pipeline.ts`
- Modify: `src/app/app-renderer-pipeline-types.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-performance-impact.json`
- Modify: `e2e/app-performance-path-adapters.ts`
- Modify: `e2e/app-kernel-benchmarks.ts` only if assessment requires a candidate

- [ ] Model authored/effective coverage count and detailed live count separately.
      Full-white maximum masks define the enforced workload ceiling; mask editing
      cannot create more roots than that ceiling.
- [ ] Register new modules with exact layout, scene-resource, scene-render, and
      export pass ownership. Do not assign every mask change to every scan pass.
- [ ] A committed Lawn or Tall mask gesture invalidates only its layout and scene
      render. A committed scan mask gesture invalidates only that scan layout and
      scene render. Material and environment resources remain retained.
- [ ] Update combined fixtures for full-white maximum density, soft masks,
      detailed/lightweight partition extremes, timeline wind, DPR 1/2, shadows,
      scans, and viewport interaction.
- [ ] Run `assessToolcraftRenderPlan`. Add a protected kernel candidate if the new
      hybrid geometry or sampler requires one.
- [ ] Measure CPU layout build, p50/p95 frame time, available GPU time, draw calls,
      instances, triangles, material compilations, and geometry allocations.
- [ ] Do not pass by lowering PBR quality, render scale, field coverage, authored
      export counts, scan counts, shadow quality, or animation fidelity.

### Task 7: Prove density, quality, masks, and export composition in browser

**Files:**

- Modify: `e2e/grass-density-coverage.spec.ts`
- Create: `e2e/grass-distribution-mask.spec.ts`
- Modify: `e2e/grass-preview-mode.spec.ts`
- Modify: `e2e/grass-dual-layers.spec.ts`
- Modify: `e2e/grass-output.spec.ts`
- Modify: affected performance specs selected by compiled paths

- [ ] For Lawn and Tall separately, test minimum/default/maximum Density against
      accepted roots, occupied field cells, and nearest-root gap bounds.
- [ ] Hold Density and mask constant while moving Detail through min/default/max;
      root coverage and effective composition must remain stable while topology
      and measured cost change.
- [ ] Paint disjoint masks for Lawn and Tall and prove each layer occupies only
      its own region. Repeat for every multi-instance scan layer.
- [ ] Prove a soft 50% mask produces deterministic intermediate local density,
      not opacity-only rendering or a material color change.
- [ ] Prove top-facing placement multiplies only the Tall distribution mask.
- [ ] Compare live and export world-space composition using matching mask/seed
      signatures, then inspect decoded non-empty PNG and video output.
- [ ] Exercise wind None/Breeze/Gust/Blast across detailed and lightweight grass;
      ensure no frozen coverage tier or root sliding.
- [ ] Capture low/high-angle density screenshots with zero console/WebGL errors.

### Task 8: Complete Batch A delivery

**Files:**

- Modify: `docs/toolcraft/agent-worklog.md`
- Verify: `src/app/app-performance-impact.json`

- [ ] Immediately before implementation, read each selected Implementation-phase
      contract separately. Before proof, read `acceptance-testing.md` and
      `performance.md` separately.
- [ ] Run `npm run ai:check`, focused Vitest, `npm run typecheck`, and the exact
      affected browser/performance checks during development.
- [ ] Run `npm run verify:kernel` only when required by the render assessment.
- [ ] Run one protected delivery with the exact selectors reported by impact:

  ```bash
  npm run verify:delivery -- --tier=3 --reason=explicit-performance-work \
    --unit-test=src/app/grass/grass-coverage-policy.test.ts \
    --unit-test=src/app/grass/grass-distribution-mask.test.ts \
    --browser-test="grass density preserves coverage across live detail levels" \
    --browser-test="grass distribution masks isolate each scatter layer" \
    --performance-test="browser perf: <exact affected hybrid coverage path>"
  ```

- [ ] Use exact protected titles if they differ. Do not broaden or duplicate the
      gate after a successful receipt.
- [ ] Start or reuse the identity-verified Grass dev server and inspect the final
      dense field in the controlled browser.

## Batch B tasks

### Task 9: Apply the approved dense meadow reset preset

**Files:**

- Modify: `src/app/grass/grass-defaults.ts`
- Modify: `src/app/grass-realistic-preset.test.ts`
- Modify: `src/app/grass-product.test.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: focused reset/persistence browser tests

- [ ] Translate the approved reference/settings artifact into v15 defaults only
      after Batch A proves dense coverage: field/terrain, Lawn/Tall density and
      masks, scan counts/clumping/masks, surface response, gradients/palettes,
      Sunrise environment, black background, light balance, grading, sun patches,
      Wind None, all Solo states off, and low three-quarter orientation.
- [ ] Make Lawn visually continuous across the island and keep Tall localized by
      its explicit editable default mask rather than hidden Gaussian code.
- [ ] Keep always-PBR output and existing export behavior. Do not restore PBR or
      Static/Dynamic toggles.
- [ ] Reset must produce the new preset; v14 storage remains recoverable under
      its old key; v15 reload and settings export/import must restore exact masks.

### Task 10: Characterize existing normals and lighting, patch only proven defects

**Files:**

- Create: `src/app/grass/grass-scan-materials.test.ts` if no focused equivalent
  exists
- Modify: `src/app/grass/grass-hdr.test.ts`
- Modify: `e2e/grass-pbr-hdri.spec.ts`
- Modify only on failed proof: `src/app/grass/grass-scan-materials.ts`
- Modify only on failed proof: `src/app/grass/grass-hdri.ts`
- Modify only on failed proof: `src/app/grass/grass-scene.ts`

- [ ] Prove Base Color uses sRGB and AO/Roughness/Normal/Opacity remain linear.
- [ ] Prove ground, rocks, boulder, and foliage families bind supplied normal maps
      with positive X / negative Y scale and the intended bounded strength.
- [ ] Prove PMREM remains the global environment while key/fill/rim controls each
      produce a bounded visible pixel response independent of background display.
- [ ] Compare preview and export under the same environment, camera, and mask.
- [ ] If every proof passes, make no normal-map or lighting implementation change.
- [ ] If a proof fails, isolate the policy in its existing helper owner; do not add
      another material branch to `grass-scan-resource.ts` or another unrelated
      lighting policy directly inside `grass-scene.ts`.

### Task 11: Complete Batch B reference and persistence delivery

**Files:**

- Modify: `docs/toolcraft/agent-worklog.md`
- Verify: `src/app/app-performance-impact.json`

- [ ] Reset in the real browser, capture the same camera framing as the supplied
      reference, and compare subject luminance, highlight/shadow balance,
      saturation, silhouette, Lawn continuity, Tall localization, and pure-black
      background.
- [ ] Reload and import/export settings to prove v15 mask/default persistence.
- [ ] Run focused defaults, schema, material characterization, HDRI, acceptance,
      and browser reference checks.
- [ ] Run one impact-derived `npm run verify:delivery -- --tier=3` for Batch B.
      Do not request a second explicit-performance refresh unless renderer code or
      workload boundaries changed after Batch A.
- [ ] Start or reuse the verified dev URL and inspect the final scene with zero
      console/WebGL errors.

## Completion conditions

- Maximum Lawn and Tall density visibly fills the permitted mask regions without
  large unexplained holes.
- Preview Detail changes topology/cost, not world-space density or composition.
- Detailed and lightweight grass share PBR lighting, wind, anchored roots,
  shadows where applicable, and deterministic seed placement.
- Lawn, Tall, Tufted, Wild, White, Yellow, and Small Rocks each have a persisted,
  undoable, manually editable spatial distribution mask.
- Material Texture Masks remain independent and unchanged in meaning.
- Tall's reference localization is represented by its visible editable mask, not
  a hidden hard-coded runtime zone multiplier.
- Normal maps and physical lighting are not duplicated; existing behavior is
  changed only when a characterization test demonstrates a defect.
- Reset uses persistence v15, always-PBR output, Wind None, and the approved dense
  meadow light/color/composition.
- Batch A passes its explicit-performance Tier-3 delivery without lowering
  quality; Batch B passes its separate impact-derived Tier-3 delivery and final
  controlled-browser reference inspection.
