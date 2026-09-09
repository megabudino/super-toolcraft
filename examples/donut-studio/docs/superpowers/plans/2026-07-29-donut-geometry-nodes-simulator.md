# Donut Geometry Nodes Simulator Implementation Plan

> **For agentic workers:** Execute this plan sequentially in the current
> workspace. The folder is not a Git repository, so preserve the normal
> test-first checkpoints but omit commit commands.

**Goal:** Turn the neutral Toolcraft starter into a browser-native simulator of
the supplied Blender Geometry Nodes donut, preserving the authored base and
plate geometry, public node-group controls, material character, three-light
studio rig, world environment, deterministic sprinkles, orbit interaction, and
PNG export.

**Architecture:** Use Toolcraft schema and runtime state as the only product
state authority. Render the exact Blender-derived static meshes plus
procedurally generated icing and instanced sprinkles in one retained native
Three.js scene. Compile one canonical renderer pipeline registration and reuse
it for runtime invalidation, export, and performance ownership. Recreate exports
offscreen from the same scene builder so preview and PNG share geometry,
materials, lights, orientation, and background rules.

**Tech Stack:** React 19, TypeScript 6, Three.js 0.185, Toolcraft runtime,
Vitest, Playwright, Blender 4.5 background export, Vite.

---

## Product authority and verification

- Design authority:
  `docs/superpowers/specs/2026-07-29-donut-geometry-nodes-simulator-design.md`.
- Source authority:
  `/Users/kusnizza/Desktop/Donut Simulation Blender Geometry Nodes.blend`.
- Verification tier: Tier 4.
- Required delivery: one bare `npm run verify:delivery`, then `npm run dev`.
- Development feedback: focused Vitest and Playwright only.
- Explicitly skipped: measured performance and `npm run verify:perf`, because
  the request does not authorize a performance iteration or full audit.
- Before implementation edits, complete the Implementation-phase Toolcraft
  preflight for schema, decision contract, components, renderer, and
  performance.
- Before proof, complete the Verification-phase acceptance and performance
  preflight.

## Task 1: Produce reproducible source assets

**Files:**

- Create: `scripts/export-donut-reference.py`
- Create: `public/donut-studio/donut-reference.glb`
- Create: `public/donut-studio/brown_photostudio_02_1k.hdr`
- Create: `public/donut-studio/reference-manifest.json`

**Steps:**

1. Write a Blender background script that opens the supplied `.blend`, copies
   only the evaluated `Base` and `Plate` objects into an export collection,
   applies evaluated geometry while preserving object transforms, removes
   animation and unrelated helpers, and exports a compact GLB.
2. Include stable source facts in the manifest: Blender file name and size,
   object names, polygon counts, bounds, three area-light transforms/colors/
   energies/sizes, world rotation/strengths, public node-group defaults, and
   material constants.
3. Run the export through
   `/Applications/Blender.app/Contents/MacOS/Blender --background --python`.
4. Download the official CC0 Poly Haven
   `brown_photostudio_02_1k.hdr`; fail if the response is not an HDR payload.
5. Validate the GLB with `@gltf-transform/core`: exactly two named scene
   meshes, finite accessors, nonzero triangle counts, and bounds matching the
   Blender study within a small tolerance.
6. Validate the manifest and asset checksums. Do not modify or embed missing
   private palette PNGs; their five public modes are reconstructed
   deterministically in code.

## Task 2: Lock reference constants and typed product values

**Files:**

- Create: `src/app/donut/donut-reference.ts`
- Create: `src/app/donut/donut-types.ts`
- Create: `src/app/donut/donut-values.ts`
- Test: `src/app/donut/donut-values.test.ts`

**Steps:**

1. Write failing tests for all Blender public defaults, clamping, shape/palette
   enum parsing, linear-to-sRGB icing color handling, clear-state parsing,
   background inclusion, render scale, and image resolution.
2. Run:
   `pnpm vitest run src/app/donut/donut-values.test.ts`.
3. Add immutable typed reference constants for base, plate, materials, lights,
   world, camera framing, palette banks, and the five public color modes.
4. Implement one `readDonutSettings(values)` boundary that returns a complete
   immutable render model with safe defaults and enforced bounds.
5. Re-run the focused test and confirm it passes.

## Task 3: Define the Toolcraft product schema

**Files:**

- Modify: `src/app/app-schema.ts`
- Test: `src/app/app-schema.test.ts`
- Test: existing `src/app/app-acceptance.*.test.ts`

**Steps:**

1. Express the design spec through `defineToolcraft`:
   editable-output canvas at 1920×1080, render scale 1–2, no upload, no
   timeline, no layers, history/radar/theme/zoom toolbar, and local persistence
   for values/canvas/panels.
2. Add product sections grouped by meaning:
   Donut (`Plate`, orientation gizmo), Icing (`Icing`, `Colour`, `Clear Base`,
   `Clear Detail`), Sprinkles (`Flow`, `Scale`, `Shape`, `Palette`,
   `Metallic`, conditional `Solid colour`, `Clear`), normalized Background,
   Image Export, and sticky Export PNG.
3. Give workload roles only to `sprinkles.flow` and
   `export.image.resolution`; use responsiveness roles for retained visual
   changes.
4. Use schema defaults for every resettable control and runtime action targets
   for clear operations.
5. Run the schema test and the focused contract tests for sections,
   orientation, background/export, persistence, readiness, and control state.
6. Adjust only app-owned schema/configuration. Do not patch copied runtime or
   protected acceptance code.

## Task 4: Implement deterministic sprinkle layout

**Files:**

- Create: `src/app/donut/donut-random.ts`
- Create: `src/app/donut/donut-sprinkle-layout.ts`
- Test: `src/app/donut/donut-sprinkle-layout.test.ts`

**Steps:**

1. Write failing tests for repeatability, bounded count, valid torus-surface
   positions, outward normals, scale bounds, shape signatures, five distinct
   palette signatures, solid-color authority, metallic preservation, and clear
   producing zero instances.
2. Run the focused test and confirm failure.
3. Implement a seeded low-allocation PRNG and a deterministic icing-surface
   sampler. Map the Blender Flow default to a reference count and clamp the
   maximum to 900 live instances.
4. Produce retained instance transforms and packed colors for:
   faceted pellet, pearl, and rounded rod.
5. Implement source-backed palette semantics:
   solid, pastel bank A, candy bank B, procedural hue, and chocolate bank C.
6. Re-run the focused test and confirm it passes.

## Task 5: Implement icing geometry and clear semantics

**Files:**

- Create: `src/app/donut/donut-icing-geometry.ts`
- Test: `src/app/donut/donut-icing-geometry.test.ts`

**Steps:**

1. Write failing tests for finite indexed geometry, donut-hole preservation,
   source bounds, stable output, visible top coating, distinct base/detail clear
   modes, and disabled icing.
2. Run the focused test and confirm failure.
3. Build a toroidal coating mesh whose cross-section, crown offset, organic
   radial modulation, and lower drips reproduce the evaluated Blender icing
   silhouette without self-intersection.
4. Treat `Clear Detail` as removing drip/detail displacement while retaining
   the base coating. Treat `Clear Base` or disabled icing as no icing mesh.
5. Re-run the focused test and confirm it passes.

## Task 6: Declare and assess the renderer pipeline

**Files:**

- Create: `src/app/donut/donut-pipeline.ts`
- Modify: `src/app/app-performance.ts`
- Test: `src/app/donut/donut-pipeline.test.ts`

**Steps:**

1. Write pipeline contract tests for the canonical passes:
   `scene-bootstrap`, `icing-geometry`, `sprinkle-layout`, `preview-render`,
   `image-export`, and `resource-cleanup`.
2. Register invalidation so camera/plate/material changes retain source
   geometry, icing controls rebuild only icing plus preview, sprinkle controls
   rebuild only sprinkle layout plus preview, canvas size rebuilds the render
   target, render scale redraws the backing canvas, and export runs its isolated
   pass.
3. Configure one WebGL renderer technique inventory, retained resource
   lifecycle, explicit preview/export difference, and workload dimensions for
   900 sprinkles, render scale, and 8192-pixel still export.
4. Derive performance paths and scenarios from the same registration.
5. Run `assessToolcraftRenderPlan` through the focused test/config validation.
   Add a protected kernel candidate only if the assessment explicitly requires
   it; never invent timing evidence.

## Task 7: Build the retained Three.js scene

**Files:**

- Create: `src/app/donut/donut-assets.ts`
- Create: `src/app/donut/donut-materials.ts`
- Create: `src/app/donut/donut-scene.ts`
- Test: `src/app/donut/donut-scene.test.ts`

**Steps:**

1. Write failing resource-level tests for two exact GLB meshes, icing attach/
   detach, all three shared sprinkle geometries, maximum three instanced draw
   groups, light inventory, environment fallback, plate visibility, setting
   updates without renderer recreation, and complete disposal.
2. Load the static GLB once and clone retained geometries into one root scene.
3. Reconstruct the source material intent:
   red-brown subsurface-like donut with coat/sheen response, rough
   noise-modulated icing, glossy off-white plate, and metallic-variable
   sprinkles with per-instance color.
4. Add the exact three Blender area lights and the rotated Poly Haven
   environment. Use the authored blue camera-ray world color as the visible
   product background while the HDRI supplies reflections and soft studio
   illumination.
5. Use one `InstancedMesh` per active sprinkle shape/material path and update
   its matrices/colors in place.
6. Expose `resize`, `updateSettings`, `setOrientation`, `render`,
   `getEvidence`, and idempotent `dispose`.
7. Re-run the focused tests and inspect Three.js warnings.

## Task 8: Integrate the Toolcraft canvas and orbit interaction

**Files:**

- Create: `src/app/donut/donut-canvas.tsx`
- Create: `src/app/donut/donut-canvas.module.css`
- Test: `src/app/donut/donut-canvas.test.tsx`

**Steps:**

1. Render only a local-class-anchored canvas inside `canvasContent`; never
   render app controls or shell UI in product output.
2. Read Toolcraft state with selectors and `readDonutSettings`.
3. Use the runtime orientation pose and
   `useToolcraftModelOrbitInteraction` for direct orbit, pan, pinch, wheel,
   radar/center, and orientation gizmo ownership.
4. Coalesce resize and drag renders with `requestAnimationFrame`; suspend
   nonessential work during view interaction and preserve state.
5. Set backing dimensions from CSS size × device pixel ratio ×
   `canvas.renderScale` while preserving CSS dimensions.
6. Emit stable product-owned `data-*` evidence for output signature, mesh/
   instance counts, mode, settings signature, orientation, render scale, and
   backing dimensions only after a successful frame.
7. Register the scene’s preview work with the compiled pipeline.

## Task 9: Implement exact PNG export

**Files:**

- Create: `src/app/donut/donut-export.ts`
- Create: `src/app/donut/donut-download.ts`
- Test: `src/app/donut/donut-export.test.ts`
- Modify: `src/app/app-composition.tsx`

**Steps:**

1. Write failing tests for 2K/4K/8K long edges, canvas aspect preservation,
   transparent PNG when Background is off, authored blue/background color when
   on, state-orientation parity, valid Blob encoding, file naming, progress,
   and disposal on success/failure.
2. Create the output through `createToolcraftPngExportCanvas`, passing the
   selected `export.image.resolution`.
3. Rebuild the same canonical Three.js scene offscreen at pixel ratio 1,
   render with the current settings and orientation, and composite into the
   export canvas.
4. Route the sticky `export.png` panel action through the pipeline
   `image-export` pass.
5. Export the product composition with `schema`, `canvasContent`,
   `renderDefaultCanvasMedia: false`, `onPanelAction`, and the canonical
   `rendererPipelineRegistration`.

## Task 10: Complete product acceptance and ownership

**Files:**

- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-verification-impact.json`
- Create: `e2e/donut-product.spec.ts`

**Steps:**

1. Change readiness from starter to product and fill product name, summary,
   requested behavior, interaction ownership, orbit view interaction,
   reference study, feature inventory, `referenceTimeline: "none"`,
   section inventory, renderer technique inventory, conditional visibility,
   background/output, persistence, viewport, render-scale, and entity rows.
2. Add acceptance IDs for plate, icing enabled/color/base clear/detail clear,
   sprinkle flow/scale/shape/palette/metallic/solid/clear, orientation,
   background, image resolution/export, render-scale backing, reset, and
   persistence.
3. Use fixed protected browser recipes for orientation, conditional solid
   color, background output, render scale, persistence, and image export.
   Product tests may assert product-specific pixel/signature changes, but may
   not emit reserved evidence directly.
4. Map every product production module to its nearest acceptance IDs and
   renderer passes in `app-verification-impact.json`, with explicit functional,
   presentation, or performance ownership.
5. Run focused Vitest acceptance tests and the product Playwright spec.

## Task 11: Update the decision trail

**Files:**

- Modify: `docs/toolcraft/agent-worklog.md`

**Steps:**

1. Replace starter mode with `Mode: product`.
2. Add one decision-trail entry for this coherent user-visible delivery:
   request, resulting product, Blender source inspected, missing external assets,
   source/reference evidence, rules applied, rejected alternatives, state/output
   mapping, renderer/timeline/layer/control/export decisions, Tier 4
   classification, and known risks.
3. Record that the source has no authored camera/action/keyframes; orbit is the
   primary spatial interaction and no timeline is enabled.
4. Record workload authority without performance-run authority. Leave executed
   check receipts to the protected delivery runner.

## Task 12: Verification and handoff

**Steps:**

1. Run formatting if configured, then:
   `pnpm ai:check`.
2. Run focused product and acceptance Vitest tests.
3. Start or reuse the Toolcraft app server and use the browser workflow to
   visually verify:
   source-like base/plate silhouette, blue studio view, icing color and clears,
   each sprinkle shape and palette, solid-color condition, plate/sprinkle
   clears, orbit/gizmo, background transparency behavior, reset, real reload,
   render-scale backing pixels, and a decodable PNG at selected size.
4. Fix root causes and repeat only affected targeted checks while developing.
5. Run the first-delivery gate exactly once when ready:
   `npm run verify:delivery`.
6. Run `npm run dev`; if the saved Toolcraft port already serves this app,
   report that verified existing URL instead of starting a duplicate.
7. Deliver the local URL, key source files, verification receipt outcome, and
   any faithful-reconstruction caveat. Do not claim the unavailable private
   palette images were recovered.

