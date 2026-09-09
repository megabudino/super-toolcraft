# Megascans Field Layers Implementation Plan

> **For agentic workers:** Execute inline in this standalone folder. The generic executing-plans skill is unavailable, subagents were not requested, and the signed Toolcraft workflow is the authoritative fallback. Track every checkbox in order.

**Goal:** Add the supplied moss ground, grass tufts, flowers, and rocks as independently configurable retained PBR layers in preview, PNG, and video export.

**Architecture:** Preprocess source FBX/JPG archives into compact product-owned GLB/WebP assets. Parse all new settings into `GrassSettings`, build deterministic terrain-aware layouts per layer, and render each variant through retained Three.js instanced meshes sharing one material family. Extend the canonical renderer pipeline, workload envelope, acceptance data, and browser evidence rather than creating parallel UI or renderer paths.

**Tech Stack:** TypeScript 6, React 19, Three.js 0.185, Vite 8, Toolcraft schema/runtime, Vitest, Playwright, Node asset preprocessing, WebP.

---

## File structure

- Create `scripts/process-grass-scans.mjs`: deterministic source extraction, FBX geometry conversion, and texture resizing/compression.
- Create `src/app/grass/assets/scans/**`: derived GLB/WebP runtime assets only.
- Create `src/app/grass/grass-scan-assets.ts`: static asset manifest and async loaders.
- Create `src/app/grass/grass-scan-controls.ts`: six Toolcraft product sections.
- Create `src/app/grass/grass-scan-layout.ts`: seeded terrain-aware placement and stable layout keys.
- Create `src/app/grass/grass-scan-resource.ts`: retained textures, materials, geometries, instanced meshes, update, render, and disposal.
- Create `src/app/grass/grass-scan-layout.test.ts`: count bounds, determinism, clumping, scale, and terrain contact.
- Create `src/app/app-acceptance-scan-data.ts`: acceptance rows for every visible scan control.
- Create `e2e/grass-scans.spec.ts`: real control, PBR, persistence, PNG, and video output proof.
- Modify `src/app/grass/grass-defaults.ts`, `grass-values.ts`, `grass-controls.ts`, `grass-scene.ts`, `grass-output.tsx`, and `grass-export.ts`.
- Modify `src/app/app-renderer-pipeline.ts`, `app-performance.ts`, `app-performance-impact.json`, and `app-acceptance-data.ts`.
- Modify `e2e/app-performance-path-adapters.ts` for the five new workload dimensions.
- Modify `docs/toolcraft/agent-worklog.md` with the Tier 3 decision trail and final evidence.

### Task 1: Produce bounded runtime assets

- [ ] Add `scripts/process-grass-scans.mjs` with an explicit manifest for the seven supplied archives. Select LOD2 variants A/C/E for Tufted Grass, A/D/G for Wild Grass, A/C/F/H for both flower families, and split the rock pack into independent child meshes.
- [ ] In the script, patch Three's `TextureLoader` during FBX parsing so source materials do not perform network/DOM loads; merge transformed mesh geometry per selected variant; normalize the geometry base to `y=0`; export binary GLB with `GLTFExporter`.
- [ ] Resize ground BaseColor/Normal/Roughness/AO to 4096 WebP. Resize plant/rock BaseColor/Normal/Roughness/AO/Opacity to 2048 WebP. Use `cwebp -quiet -q 88` for color, `-q 94` for normal/roughness/AO/opacity, and preserve alpha.
- [ ] Run `node scripts/process-grass-scans.mjs /Users/kusnizza/Desktop/scans` and verify every output is non-empty with `find src/app/grass/assets/scans -type f -size 0 -print` returning no paths.
- [ ] Inspect total bundle weight with `du -sh src/app/grass/assets/scans`; target under 45 MB. If above, reduce plant textures to 1024 while keeping ground at 4096.

### Task 2: Add schema state and controls

- [ ] Extend `grassDefaults` with these exact targets and defaults:

```ts
"surface.textureScale": 1.25,
"surface.normalStrength": 70,
"surface.roughness": 92,
"scan.tufted.enabled": true,
"scan.tufted.count": 90,
"scan.tufted.sizeRange": [0.75, 1.25],
"scan.tufted.clumping": 48,
"scan.tufted.seed": 41,
"scan.tufted.surfaceOffset": 0.01,
"scan.wild.enabled": true,
"scan.wild.count": 140,
"scan.wild.sizeRange": [0.7, 1.2],
"scan.wild.clumping": 35,
"scan.wild.seed": 53,
"scan.wild.surfaceOffset": 0.01,
"scan.white.enabled": true,
"scan.white.count": 55,
"scan.white.sizeRange": [0.7, 1.1],
"scan.white.clumping": 72,
"scan.white.seed": 67,
"scan.white.surfaceOffset": 0.015,
"scan.yellow.enabled": true,
"scan.yellow.count": 45,
"scan.yellow.sizeRange": [0.65, 1.05],
"scan.yellow.clumping": 76,
"scan.yellow.seed": 79,
"scan.yellow.surfaceOffset": 0.015,
"scan.rocks.enabled": true,
"scan.rocks.count": 12,
"scan.rocks.sizeRange": [0.65, 1.35],
"scan.rocks.clumping": 28,
"scan.rocks.seed": 89,
"scan.rocks.surfaceOffset": -0.015,
```

- [ ] Create `grass-scan-controls.ts` using built-in `switch`, `slider`, and `rangeSlider`. Each scatter section has exactly Include, Count, Size range, Clumping, Seed, and Surface offset. Count maxima are 400/600/240/200/60 respectively and each Count declares `performanceRole: "workload"`.
- [ ] Extend `grassSurfaceSection` with Texture scale, Normal strength, and Roughness. Keep Ground tint and Show ground in the same semantic entity section.
- [ ] Insert scan sections after `Surface` and before `Background` in `grassControlSections`.
- [ ] Extend `GrassSettings` with typed `surface` and `scans` objects and parse every value with explicit bounds.
- [ ] Add unit assertions in `grass-product.test.ts` that defaults, controls, settings parsing, visibility conditions, and reset values agree.
- [ ] Run `npx vitest run src/app/grass-product.test.ts src/app/app-schema.test.ts`; expect both files to pass.

### Task 3: Build deterministic scan layouts

- [ ] Create `GrassScanLayerKind`, `GrassScanLayerSettings`, `GrassScanInstance`, and `GrassScanLayout` in `grass-scan-layout.ts`.
- [ ] Implement `createGrassScanLayout(kind, settings)` with a hard clamp to the schema ceiling, seeded R2 low-discrepancy candidates, terrain height/slope sampling, deterministic clumping acceptance, variant assignment, scale interpolation, Y rotation, and surface offset.
- [ ] Implement `getGrassScanLayoutKey(kind, settings)` from field extent, terrain, and only that scan layer's placement values.
- [ ] Write failing tests proving exact enabled counts, zero disabled counts, deterministic equal seeds, different-seed signatures, bounded size, terrain contact, and clumping concentration.
- [ ] Run `npx vitest run src/app/grass/grass-scan-layout.test.ts`; expect all assertions to pass.

### Task 4: Load and retain scan resources

- [ ] Create an asset manifest in `grass-scan-assets.ts` with literal Vite URL imports for every GLB/WebP file. Export `loadGrassScanAssets()` as one memoized Promise and a disposal-safe decoded asset result.
- [ ] In `grass-scan-resource.ts`, load GLBs with `GLTFLoader`, collect/merge their geometry, and create one `InstancedMesh` per variant. All plant materials use `MeshPhysicalMaterial` with Base Color, Normal, Roughness, AO, alpha test, double side, sheen, and non-premultiplied transparency. Rocks use `MeshStandardMaterial` without alpha.
- [ ] Add a shared moss ground material resource that applies repeat wrapping, anisotropy, color-space correctness, normal scale, roughness multiplier, and AO UVs to the existing ground material.
- [ ] Implement `prepare()`, `updateLayer(kind, layout)`, `applyMaterialSettings(settings)`, `getRenderedCounts()`, and `dispose()` with no resource creation inside per-frame render.
- [ ] Add dataset-ready count signatures and a source signature so browser tests can distinguish loaded scans from an empty procedural frame.
- [ ] Run `npm run typecheck`; expect no TypeScript errors.

### Task 5: Integrate preview and exports

- [ ] Construct `GrassScanFieldResource` inside `GrassSceneRenderer`, add its group to the scene, and dispose it with the renderer.
- [ ] Add `prepareScans()`, `updateScanLayer(kind, settings)`, and scan count getters to `GrassSceneRenderer`. Apply moss maps when ground geometry is created or updated.
- [ ] In `GrassOutput`, await the canonical scan resource pass, compare five layout keys independently, run only the matching layout pass, then render. Add `data-grass-scan-resources`, per-layer authored counts, and per-layer rendered counts to the canvas and host.
- [ ] Extend frame signatures with scan settings and scan resource identity so all scan controls produce persistent observable output.
- [ ] In `renderGrassFrame` and `exportGrassVideo`, await `scene.prepareScans()` before the first render and build all five scan layouts. Keep enabled scan layers in every requested video frame.
- [ ] Run `npx vitest run src/app/grass-product.test.ts src/app/app-automated-runtime-evidence.test.ts`; expect pass.

### Task 6: Extend the canonical performance model

- [ ] Add `grass-scan-resource` and five layer layout passes to `GrassRendererPassContracts` and `grassRendererPipelineRegistration`.
- [ ] Declare precise interaction invalidation: each scan layer's six controls invalidate only its layout pass plus scene render; surface material controls invalidate scene render only; common field/terrain changes invalidate all scan layouts; export consumes all scan layouts and scan resources.
- [ ] Add workload dimensions `tufted-scan-count`, `wild-scan-count`, `white-flower-count`, `yellow-flower-count`, and `rock-scan-count`, each backed by its Count slider schema maximum.
- [ ] Include all five dimensions in static/dynamic scene and export pass costs, add fixture adapters, and let `deriveToolcraftPerformancePaths` regenerate canonical paths.
- [ ] Update `e2e/app-performance-path-adapters.ts` so each dimension applies its real slider and observes the matching `data-grass-*-count` attribute.
- [ ] Run `npx vitest run src/app/app-performance.gates.test.ts src/app/app-performance.fixture-helper.test.ts`; expect render plan and fixtures to pass without unresolved benchmark requirements.
- [ ] If `appRenderPlanAssessment` requires a kernel candidate, add only the exact executable candidate to `e2e/app-kernel-benchmarks.ts` and run `npm run verify:kernel`; otherwise record that no new kernel receipt was required.

### Task 7: Add acceptance and browser proof

- [ ] Create `app-acceptance-scan-data.ts` with one acceptance row for every new control. Use `product-output` for switches/count/size/clumping/seed/offset and `rendered-pixels` for ground PBR controls.
- [ ] Append the rows to `appAcceptance` and add six matching `appControlSectionInventory` entries with product-meaning grouping reasons.
- [ ] Create `e2e/grass-scans.spec.ts` with exact test titles:

```txt
grass scan layers configure independently and follow terrain
grass scan layers share PBR lighting and survive reload
grass scan layers are included in PNG and video exports
```

- [ ] In the first test, change every layer Count and Size range through the real controls and assert the corresponding authored/rendered count plus frame signature changes without changing neighboring layer counts.
- [ ] In the second test, enable Static PBR, change surface normal/roughness and scan controls, reload, and assert restored control values, scan resource signature, and non-empty rendered counts.
- [ ] In the third test, export 2K PNG and a one-second current-resolution video, decode both artifacts with existing helpers, and compare enabled versus disabled scan-frame content hashes.
- [ ] Update `app-performance-impact.json` with every new production module and exact owned pass IDs. Add new pass IDs to existing renderer modules only where they can actually change those passes.
- [ ] Run the three exact Playwright tests through `npx playwright test e2e/grass-scans.spec.ts`; expect pass.

### Task 8: Visual tuning, worklog, and delivery

- [ ] Start the app with `npm run dev` and inspect Static PBR at the saved Toolcraft URL. Verify moss scale, terrain contact, flower clustering, rock sinking, camera orbit, and visible repetition.
- [ ] Adjust defaults only through `grass-defaults.ts`; keep all schema maxima unchanged after performance planning.
- [ ] Verify Dynamic preview remains responsive and scans stay static while procedural Tall Grass moves.
- [ ] Read the Toolcraft Verification-phase documents before running proof.
- [ ] Update `docs/toolcraft/agent-worklog.md` with the supplied archives, derived asset policy, selected LODs/maps, control inventory, renderer passes, rejected alternatives, Tier 3 note, targeted checks, delivery result, and remaining risks.
- [ ] Run one delivery command with Tier 3 and the exact unit/browser/performance selectors derived from the changed impact inventory. Do not run a second aggregate or full performance gate for unchanged source.
- [ ] Start or reuse `npm run dev`, verify the Toolcraft identity endpoint and title marker, and report the existing/saved app URL.
