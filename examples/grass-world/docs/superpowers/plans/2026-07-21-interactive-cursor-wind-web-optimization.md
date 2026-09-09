# Interactive PBR Grass And Web Render Optimization Implementation Plan

**Goal:** Replace Static/Dynamic and PBR/stylized switching with one optimized,
always-PBR live preview, add shader-driven Cursor Wind, and keep full-density PBR
still/video export.

**Architecture:** The live renderer always uses the bounded detailed Tall sample
plus retained six-blade Lawn clumps. One transient pointer controller projects a
coalesced terrain sample and feeds a representation-independent shader force
contract. Export explicitly selects full Tall/Lawn geometry and no pointer state.
`wind.profile` is the sole global wind-type choice and includes `off`/None.

**Expected renderer result:** Reset live generated grass drops from about
374,400 double-pass color-triangle submissions to 67,200 one-pass submissions:
43,200 Tall plus 24,000 Lawn. Tall alone owns a preview shadow refresh capped at
30 Hz. Fully opaque gradients use opaque depth-writing PBR materials; authored
translucency uses one transparent double-sided color pass.

**Tech stack:** React 19, TypeScript, Toolcraft runtime schema and canonical
renderer pipeline, Three.js 0.185.1/WebGL2/GLSL, Vitest, Playwright.

**Verification:** Tier 3, explicit performance optimization. Run targeted checks
during implementation and one protected explicit-performance delivery refresh
when the coherent batch is complete.

---

### Task 1: Complete Implementation Preflight And Lock Contracts Red-First

**Files:**

- Read separately: `docs/toolcraft/renderer-technique.md`
- Read separately: `docs/toolcraft/performance.md`
- Read separately: `docs/toolcraft/schema-reference.md`
- Read separately: `docs/toolcraft/component-rules.md`
- Read separately: `docs/toolcraft/decision-contract.md`
- Create: `src/app/grass/grass-pointer-wind.test.ts`
- Create: `src/app/grass/grass-lawn-clump-geometry.test.ts`
- Create: `src/app/grass-live-pbr-contract.test.ts`

- [ ] Run `npm run ai:check` before implementation and record pre-existing
      failures separately from new work.
- [ ] Record the batch verification note as Tier 3 with reason
      `explicit-performance-work`; do not run the delivery gate during iteration.
- [ ] Add failing state/schema tests proving `preview.mode`,
      `appearance.pbrEnabled`, `appearance.materialStyle`, and
      `lawn.materialStyle` are absent; preview Tall/Lawn counts and PBR
      Roughness/Sheen remain reachable without those conditions.
- [ ] Add a failing Wind Type test for exact visible options None, Breeze, Gust,
      and Blast backed by `off | breeze | gust | blast`, with dependents hidden
      only for None.
- [ ] Add failing Cursor Wind tests for defaults, bounds, terrain-hit acceptance,
      direction smoothing, speed threshold, bounded impulse, recovery, leave,
      reset, and inactive behavior.
- [ ] Add failing clump tests proving six single-segment ribbons, deterministic
      per-blade root/direction/rest-tilt/height/phase/stiffness variation,
      `ceil(equivalentCount / 6)`, and bounded attributes.
- [ ] Add failing renderer contract tests for only
      `interactive-preview | export`, PBR-only grass resources, opacity-aware
      material state, no preview coverage shader, and 30 Hz live shadow cadence.
- [ ] Add a failing canonical-pipeline expectation that the separate Dynamic
      scene pass and preview-mode change input no longer exist.
- [ ] Run the new tests plus `src/app/app-performance.gates.test.ts`; expect
      failures only for the not-yet-implemented contracts.

### Task 2: Simplify Product State And Controls To One PBR Preview

**Files:**

- Modify: `src/app/grass/grass-defaults.ts`
- Modify: `src/app/grass/grass-values.ts`
- Modify: `src/app/grass/grass-core-controls.ts`
- Modify: `src/app/grass/grass-appearance-controls.ts`
- Modify: `src/app/grass/grass-lawn-controls.ts`
- Modify: `src/app/grass/grass-wind-controls.ts`
- Create: `src/app/grass/grass-pointer-wind-controls.ts`
- Modify: `src/app/grass/grass-controls.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-acceptance-pbr-data.ts`
- Modify: `src/app/app-acceptance-layer-data.ts`
- Modify: `src/app/app-product-readiness.ts`
- Modify: `src/app/app-performance-impact.json`

- [ ] Delete defaults, schema controls, normalized settings fields, conditions,
      render targets, readiness copy, and acceptance claims for the four removed
      targets. Do not leave a hidden mode/PBR/Cel branch in `GrassSettings`.
- [ ] Keep `preview.bladeCount` and `preview.lawnBladeCount`, make them always
      visible, and present the owning section as `Preview Quality` with no mode.
- [ ] Keep Tall/Lawn PBR Roughness and Sheen controls unconditionally visible;
      retain gradient, color, surface, HDRI, and lighting controls.
- [ ] Present `wind.profile` as `Type` with None/Breeze/Gust/Blast. Keep its seven
      parameter controls conditional on `profile !== "off"` and preserve their
      current bounds/defaults.
- [ ] Add exact Cursor Wind defaults: Active `true`, Radius `0.70 m`, Strength
      `100%`, Recovery `0.55 s`; show the section at all times and show its three
      sliders only while Active is true.
- [ ] Store only the four authored Cursor Wind settings in `GrassSettings`.
      Pointer position, velocity, direction, envelope, and interaction fields
      must remain absent from Toolcraft state.
- [ ] Keep persistence v14. Prove old stored/imported mode, PBR-toggle, and Cel
      values are ignored while unrelated settings survive and new Cursor Wind
      targets resolve to defaults.
- [ ] Update `appControlSectionInventory`: Preview Quality owns the two live
      workload controls; Tall/Lawn sections own their PBR response; Wind Field
      owns Type plus global force parameters; Cursor Wind owns local interaction.
- [ ] Register exact added/removed production ownership in
      `app-performance-impact.json` and run focused schema/acceptance tests.

### Task 3: Collapse The Renderer To Interactive Preview And Export

**Files:**

- Modify: `src/app/grass/grass-output.tsx`
- Modify: `src/app/grass/grass-scene.ts`
- Modify: `src/app/grass/grass-layer-resource.ts`
- Modify: `src/app/grass/grass-material.ts`
- Modify: `src/app/grass/grass-export.ts`

- [ ] Replace `static-preview | dynamic-preview | export` assumptions with only
      `interactive-preview | export` at every scene/render call site.
- [ ] Remove refs/effects that synchronize preview mode, disable PBR, force
      Dynamic when wind starts, or map Static/Dynamic to timeline Play/Pause.
- [ ] Ensure Wind Type never writes timeline state. When Type is None, global
      wind evaluates to zero and playback ticks do not request unchanged grass
      frames; Cursor Wind may still invalidate the live renderer.
- [ ] Make live Tall use `preview.bladeCount`, live Lawn use equivalent
      `preview.lawnBladeCount`, and exports use full `blade.count`/`lawn.count`.
- [ ] Make every export caller pass `export` explicitly. Export never consumes
      live clumps or transient interaction state.
- [ ] Refactor grass material ownership so each layer constructs only its PBR
      color material plus its required custom-depth material. Delete the unused
      stylized ShaderMaterial creation, switching, disposal, and shader code.
- [ ] Keep scene environment, ground, scans, boulder, grading, camera, and
      background/export behavior unchanged.
- [ ] Prove one retained live resource set survives unrelated controls and one
      full export resource path remains deterministic.

### Task 4: Implement The Cursor Wind Controller And Input Boundary

**Files:**

- Create: `src/app/grass/grass-pointer-wind.ts`
- Create: `src/app/grass/use-grass-pointer-wind.ts`
- Modify: `src/app/grass/grass-scene.ts`
- Modify: `src/app/grass/grass-output.tsx`

- [ ] Implement a deterministic controller for previous terrain point, time,
      smoothed direction, speed impulse, active/decaying state, and reset.
- [ ] Clamp accepted speed to `1.2 m/s`, use `0.05 m/s` as the quiet threshold,
      and decay exponentially with authored Recovery. Guard invalid/zero deltas
      and repeated coordinates.
- [ ] Coalesce raw pointer events and perform at most one terrain projection per
      animation frame. Reuse one retained Raycaster; return the actual world-XZ
      hit rather than only a boolean.
- [ ] Put projection behind `projectPointerToTerrain` so a measured Raycaster CPU
      bottleneck can later use analytic heightfield projection without changing
      controller or shader contracts.
- [ ] Accept mouse/pen hover only. Ignore touch, pressed buttons, active
      orbit/pan/zoom/drag, invalid bounds, and terrain misses.
- [ ] Coalesce recovery to at most one requestAnimationFrame and invalidate only
      the canonical live scene-render pass while the envelope is nonzero.
- [ ] Reset transient state when Active turns off, the scene/layout is replaced,
      export begins, or the component unmounts; cancel every owned frame.
- [ ] Expose diagnostic state for hit/miss, world point, direction, envelope, and
      frame scheduling without emitting protected evidence from product code.
- [ ] Prove timeline Pause is unchanged and freezes only global wind phase while
      Cursor Wind remains responsive.

### Task 5: Add Retained Six-Blade Live Lawn Clumps

**Files:**

- Create: `src/app/grass/grass-lawn-clump-geometry.ts`
- Create: `src/app/grass/grass-lawn-clump-resource.ts`
- Modify: `src/app/grass/grass-geometry.ts`
- Modify: `src/app/grass/grass-layer-resource.ts`
- Modify: `src/app/grass/grass-scene.ts`
- Modify: `src/app/grass/grass-output.tsx`

- [ ] Build one clump base geometry containing six two-triangle flat ribbons.
      Encode deterministic local root, local direction/rest tilt, height scale,
      phase offset, and stiffness per blade.
- [ ] Derive clump instance attributes from the existing memoized Lawn layout;
      do not resample terrain, random planting, or allocate per frame.
- [ ] Retain one live `GrassLawnClumpResource`; dispose its geometry, PBR
      material, and buffers exactly once.
- [ ] Submit `ceil(preview.lawnBladeCount / 6)` clumps in live preview and hide
      the full Lawn resource there. Submit full Lawn in export and no clumps.
- [ ] Preserve equivalent density as the user-facing value and expose actual
      clump count as a separate diagnostic.
- [ ] Keep Tall on existing detailed geometry, all scans unchanged, and Lawn
      excluded from shadow casting.
- [ ] Add no terrain-coverage fragment noise, extra framebuffer, or pass. Use the
      existing Uncut Grass PBR surface beneath clumps.
- [ ] Run clump geometry/resource, dual-layer, resource-lifetime, and export tests.

### Task 6: Build A Future-Proof PBR Grass Force Pipeline

**Files:**

- Modify: `src/app/grass/grass-material.ts`
- Modify: `src/app/grass/grass-layer-resource.ts`
- Modify: `src/app/grass/grass-lawn-clump-resource.ts`
- Modify: `src/app/grass/grass-scene.ts`

- [ ] Define shared shader functions equivalent to
      `sampleGlobalWind(bladeRoot, time)`,
      `sampleGrassInteraction(bladeRoot)`, and their bounded sum.
- [ ] Initially implement `sampleGrassInteraction` from the single Cursor Wind
      world point/direction/radius/envelope uniform set. Keep the signature ready
      for a later low-resolution interaction texture without geometry changes.
- [ ] Evaluate global and cursor force at each clump blade's local world root,
      then apply its phase/stiffness/height response. Do not evaluate one rigid
      force at the clump origin.
- [ ] Keep root vertices fixed, apply strongest response toward tips, clamp final
      bend, and rotate PBR normals consistently with the deformation.
- [ ] Share the same force uniforms/functions with Tall's custom-depth material
      so its most recent preview shadow shape matches color deformation.
- [ ] Add an opacity-aware retained material update: all gradient stops at 100%
      selects `transparent=false`, `depthWrite=true`; otherwise select
      `transparent=true`, `forceSinglePass=true` with bounded alpha test.
- [ ] Ensure changing within the same opacity class updates uniforms only; only
      crossing opaque/translucent class changes material compile/render state.
- [ ] Do not add `alphaHash`, multi-octave terrain fragment work, per-blade CPU
      state, per-frame material creation, or per-frame geometry/buffer updates.
- [ ] Add focused shader/material tests and controlled-browser checks at low and
      high camera angles with opaque and translucent gradients.

### Task 7: Bound Live Shadow Work And Instrument Real Frame Cost

**Files:**

- Create: `src/app/grass/grass-shadow-cadence.ts`
- Modify: `src/app/grass/grass-scene.ts`
- Modify: `src/app/grass/grass-output.tsx`
- Modify: `src/app/grass/grass-render-diagnostics.ts` if an existing diagnostic
  module is not already the correct owner

- [ ] Set live shadow-map updates to explicit invalidation with a maximum 30 Hz
      cadence while color frames may follow display cadence.
- [ ] Force an immediate live shadow refresh after camera, layout, visibility,
      light, material-opacity class, environment-shadow, or scene-resource
      changes. Pointer/global animation alone uses the cadence.
- [ ] Force a shadow refresh for every still/video export frame; never apply the
      live cadence to export.
- [ ] Stop shadow scheduling once global wind is not advancing and Cursor Wind
      has recovered. Lawn/clumps remain non-casters.
- [ ] Expose actual/equivalent grass instances, color triangles, shadow-refresh
      state, renderer calls/triangles, CPU frame duration, and GPU duration when
      `EXT_disjoint_timer_query_webgl2` is available.
- [ ] Treat unavailable/disjoint GPU queries as unavailable data, not zero time;
      keep diagnostic queries bounded and disabled outside measurement sessions.
- [ ] Verify moving-shadow quality at 30 Hz against color motion and reject a
      lower cadence if separation is visibly distracting.

### Task 8: Consolidate The Canonical Pipeline And Performance Model

**Files:**

- Modify: `src/app/grass/grass-render-targets.ts`
- Modify: `src/app/app-renderer-pipeline.ts`
- Modify: `src/app/app-renderer-pipeline-types.ts`
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-performance-impact.json`
- Modify: `e2e/app-performance-path-adapters.ts`
- Modify: `e2e/app-kernel-benchmarks.ts` only if assessment requires a candidate

- [ ] Delete `grass-dynamic-scene-render`, its invalidation edges, runtime id,
      preview-mode input, and Static/Dynamic decision text. Route every live
      input through one canonical `grass-scene-render` pass.
- [ ] Keep both preview count targets as bounded workload dimensions and rename
      their dimension/fixture language from Dynamic to Live Preview. Record the
      fixed six-to-one equivalent-Lawn mapping.
- [ ] Add Cursor Wind settings, Wind Type, transient pointer input, opacity class,
      and shadow cadence as fixed-cost live render inputs, not new workload
      dimensions.
- [ ] Make animation-frame invalidation conditional: active global wind and/or a
      nonzero cursor envelope invalidate only live scene render; None plus a
      recovered cursor submits no unchanged grass frames.
- [ ] Explicitly protect terrain/grass/scan layouts, environment decode/PMREM,
      retained scene resources, and export geometry from pointer invalidation.
- [ ] Update renderer technique, reachable-input, workload, pass-frequency,
      lifecycle, invalidation, derived-path, and combined-fixture inventories.
- [ ] Run `assessToolcraftRenderPlan`. Implement and run a protected kernel
      candidate only if the assessment requires one.
- [ ] Add focused development scenarios for default/max live counts at DPR 1/2,
      opaque/translucent gradients, pointer active/recovery, global Wind Type,
      and shadow/non-shadow frames.
- [ ] Measure p50/p95 CPU and available GPU frame time plus renderer counters.
      Do not lower render scale, PBR quality, authored export counts, or scan
      counts to pass.

### Task 9: Add Outcome-Based Acceptance And Browser Proof

**Files:**

- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-acceptance-pbr-data.ts`
- Modify: `src/app/app-acceptance-layer-data.ts`
- Create: `e2e/grass-pointer-wind.spec.ts`
- Modify: `e2e/grass-preview-mode.spec.ts` or rename it to a live-preview spec
- Modify: `e2e/grass-output.spec.ts`
- Modify: `e2e/grass-timeline-persistence.spec.ts`
- Modify: affected performance Playwright specs selected by the compiled paths

- [ ] Prove the removed preview/PBR/Cel controls do not exist and no hidden state
      changes live/output material or representation.
- [ ] Prove one live preview always uses PBR Tall plus Lawn clumps and exports use
      full PBR Tall/Lawn geometry.
- [ ] Prove Preview Quality counts are always reachable and reset Lawn reports
      12,000 equivalent blades mapped to exactly 2,000 clumps.
- [ ] Prove Wind Type has None/Breeze/Gust/Blast, None yields zero global force,
      Cursor Wind still works under None, and Type changes do not rewrite Pause.
- [ ] Move a real pointer across two terrain points and assert world point,
      direction, envelope, Tall signature, and Lawn signature change coherently.
- [ ] Assert distinct deterministic motion among blades within one Lawn clump.
- [ ] Hold still and leave; prove recovery reaches zero and cursor-owned frame
      scheduling stops. Active off must block response.
- [ ] Exercise Radius, Strength, and Recovery through real controls; prove
      bounded distinct output and reset defaults.
- [ ] Prove terrain misses, touch-like input, pressed-button orbit/drag, canvas
      pan/zoom, and orientation-gizmo interaction do not create Cursor Wind.
- [ ] Reload after changing authored settings: settings restore, removed stale
      keys have no effect, and pointer envelope starts inactive.
- [ ] Prove opaque/translucent material-state selection, bounded shadow cadence,
      full export shadow updates, no WebGL error, no steady-motion material
      recompilation, and no per-frame geometry allocation.
- [ ] Capture diagnostic low/high-angle screenshots and run only focused Vitest,
      browser, and affected performance files during development.

### Task 10: Verification-Phase Preflight, Worklog, And Delivery

**Files:**

- Modify: `docs/toolcraft/agent-worklog.md`
- Verify: `src/app/app-performance-impact.json`

- [ ] Read `docs/toolcraft/acceptance-testing.md` in its own tool read.
- [ ] Read `docs/toolcraft/performance.md` in its own tool read.
- [ ] Update the current worklog decision trail plus Renderer, Controls,
      Timeline, Export, and Performance decisions after implementation matches
      the design. Record exact files, checks, metrics, visual findings, and risks.
- [ ] Run final focused type/unit/build checks reported by `npm run ai:check` and
      resolve every new failure.
- [ ] Run one protected delivery command with the exact impact-derived selectors:

  ```bash
  npm run verify:delivery -- --tier=3 --reason=explicit-performance-work \
    --unit-test=src/app/grass/grass-pointer-wind.test.ts \
    --unit-test=src/app/grass/grass-lawn-clump-geometry.test.ts \
    --unit-test=src/app/grass-live-pbr-contract.test.ts \
    --browser-test="grass live PBR clumps respond to cursor wind and export full geometry" \
    --performance-test="browser perf: <exact derived live-preview path title>"
  ```

- [ ] If protected selectors differ, use the exact set reported by the runner;
      do not retry with broader or duplicate gates after a successful receipt.
- [ ] Run `npm run dev` and reuse the saved Toolcraft port when the app identity
      already matches.
- [ ] In the controlled browser verify PBR-only live/export output, clump density
      and independent blade motion, wind None/active profiles, cursor direction
      and recovery, Pause ownership, orbit/drag isolation, opacity paths, moving
      shadows, default/max workload at DPR 1/2, and console/WebGL health.

## Completion Conditions

- The UI exposes no Static/Dynamic switch, PBR switch, or stylized material mode.
- One optimized live preview always renders PBR Tall Grass plus six-blade Lawn
  clumps; exports always render complete authored PBR geometry.
- Wind Type is the only global wind-mode selector and includes None.
- Cursor Wind is visibly responsive with no per-blade CPU work and remains usable
  when global wind is None or the timeline is paused.
- Clump blades retain independent deterministic deformation and the interaction
  sampler can later accept a texture-backed multi-force field.
- Reset live generated-grass color submissions are 67,200 before non-grass scene
  work, with opacity-correct one-pass/opaque routing and bounded Tall shadows.
- Pointer frames invalidate only the canonical live scene-render pass and never
  rebuild layouts, materials, environment resources, or export geometry.
- p50/p95 CPU/GPU diagnostics, renderer counters, DPR/opacity/shadow scenarios,
  and low/high-angle visuals demonstrate improvement without lowering quality.
- The protected Tier-3 explicit-performance delivery receipt passes and the
  verified app server is available.
