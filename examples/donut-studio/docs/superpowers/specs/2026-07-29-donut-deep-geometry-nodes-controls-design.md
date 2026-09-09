# Donut Studio Deep Geometry Nodes Port

## Goal

Turn the existing visual reconstruction into a full donut authoring simulator.
Preserve every independent public Geometry Nodes modifier input from the supplied
Blender file, then surface the meaningful output-affecting domains that were
previously fixed inside the hidden graph: donut proportions, icing formation,
sprinkle distribution, visible material response, HDR environment, and the three
authored studio lights.

The goal is not to expose hundreds of inactive socket defaults or implementation
plumbing. Every visible Toolcraft control must make a persistent observable
change to the product or invoke a real product command.

## Source Findings

- `icing` exposes four independent public inputs: Colour, Enable, Clear Base,
  and Clear Detail.
- `Sprinkle` exposes seven independent public inputs: Flow, Scale, Shape Type,
  Colour Type, Metallic, Solid Colour, and Clear.
- `Main group` contains 314 nodes, 391 links, five simulation zones, and most of
  the internal drivers. Four of its non-geometry inputs mirror the public icing
  and sprinkle controllers. `Realize instances` changes representation rather
  than the visible product and remains renderer-owned.
- `sprinkle instance` and `Subtractive mix` expose internal data-flow sockets,
  not modifier settings.
- Across the five Geometry Nodes groups the file contains 430 nodes and 532
  links. Blender records 28 drivers: six modifier-to-modifier mirrors and
  twenty-two internal node drivers.
- Sequential evaluation at frames 1, 2, 10, 30, and 60 produces identical Icing
  and Sprinkle output geometry. The hidden Main Group state changes during its
  startup, but there is no visible product animation, authored camera, action,
  or keyframe transport.

## Product Decisions

### Runtime and renderer

- Keep the signed Toolcraft shell and the existing retained Three.js/WebGL
  renderer.
- Keep exact evaluated Base and Plate source geometry.
- Deform a retained copy of the source Base positions for donut proportion and
  organic-surface controls instead of replacing the source with a generic torus.
- Rebuild icing from the same donut shape settings and explicit formation
  controls.
- Keep sprinkles instanced and deterministic. Distribution settings rebuild
  matrices and colors without changing the enforced 900-instance capacity.
- Preview and export continue to use the same scene builder and normalized
  settings.

### Timeline and layers

- Timeline remains disabled because visible source output is static across
  sequential frames and there is no video export.
- Layers remain disabled because Base, Icing, Sprinkles, and Plate are one
  composed product rather than a reorderable document.
- Simulation is control-driven and deterministic. Clear commands mutate
  Toolcraft state; reset and settings transfer remain runtime-owned.

### Interaction ownership

- Canvas owns direct orbit.
- Panel owns exact donut, icing, sprinkle, material, environment, and light
  authoring.
- The Orientation Gizmo remains the only panel-side view operation and shares
  `scene.orientation` with canvas orbit.
- Runtime Setup owns workspace transfer, background normalization, canvas size,
  Infinity canvas, and render scale.
- Sticky `Export PNG` owns final still output.

## Control Section Inventory

### Donut Shape

Entity: Blender-derived Base geometry.

- `donut.majorRadius` — Ring, slider, 0.78–1.28, default 1.
- `donut.thickness` — Thickness, slider, 0.65–1.35, default 1.
- `donut.height` — Height, slider, 0.65–1.35, default 1.
- `donut.organic` — Organic, slider, 0–2, default 1.
- `scene.orientation` — hidden-label Orientation Gizmo.

The four shape controls deform the source mesh and provide the missing donut
creation workflow. Icing and sprinkle placement consume the same normalized
shape.

### Donut Material

Entity: Blender `Material`.

- `material.donut.color`
- `material.donut.roughness`
- `material.donut.subsurface`
- `material.donut.softness`
- `material.donut.coat`
- `material.donut.sheen`

Defaults come from the source Principled material. The WebGL material maps
subsurface intent to a bounded edible-softness response without claiming
byte-identical EEVEE shading.

### Icing Shape

Entity: Blender `icing` group and hidden coating simulation.

- `icing.enabled` — source Enable.
- `icing.coverage` — vertical coating coverage.
- `icing.thickness` — coating shell thickness.
- `icing.dripAmount` — simulation drip displacement.
- `icing.dripFrequency` — large/small drip cadence.
- `icing.detail` — organic surface/detail amplitude.
- `icing.clearMode` actions — source Clear Base and Clear Detail.

### Icing Material

Entity: Blender `icing` material and source Colour socket.

- `icing.color` — source Colour.
- `material.icing.roughness`
- `material.icing.subsurface`
- `material.icing.coat`
- `material.icing.sheen`

### Sprinkles

Entity: Blender `Sprinkle` modifier.

- `sprinkles.flow` — source Flow and workload boundary.
- `sprinkles.scale` — source Scale.
- `sprinkles.shape` — source Shape Type 1–3.
- `sprinkles.palette` — source Colour Type 1–5.
- `sprinkles.solidColor` — source Solid Colour, visible only for Solid.
- `sprinkles.clear` — source Clear command.

### Sprinkle Distribution

Entity: hidden distribution, random, rotation, and surface-placement nodes.

- `sprinkles.seed`
- `sprinkles.coverage`
- `sprinkles.sizeVariation`
- `sprinkles.rotation`
- `sprinkles.surfaceOffset`

These settings control deterministic placement and never expose simulated
per-instance pose as panel state.

### Sprinkle Material

Entity: Blender `sprinkle` material.

- `sprinkles.metallic` — source Metallic.
- `material.sprinkle.roughness`
- `material.sprinkle.coat`

### Plate

Entity: Blender Plate and `Material.002`.

- `scene.plateVisible`
- `material.plate.color`
- `material.plate.roughness`
- `material.plate.coat`

### Environment

Entity: Blender World.

- `studio.environmentStrength` — source strength 0.25.
- `studio.environmentRotation` — source rotation 90°.

### Key Light, Warm Light, Cool Light

Entities: `Area`, `Area.001`, and `Area.002`.

Each section exposes:

- power;
- color;
- size.

Source positions remain authored constants so the light rig keeps its original
composition. Power, color, and size are the visible output-affecting settings
that the browser renderer can reproduce directly.

### Background

- `export.includeBackground`
- `appearance.background`

Runtime normalizes these into Setup.

### Image Export

- `export.image.format`
- `export.image.resolution`
- sticky `actions.output` Export PNG.

## Value and renderer mapping

- Donut shape changes invalidate base deformation, icing geometry, sprinkle
  layout, and preview.
- Icing shape changes invalidate icing geometry and preview.
- Sprinkle flow/shape/distribution changes invalidate sprinkle layout and
  preview.
- Material, environment, light, visibility, and background values mutate
  retained resources and invalidate preview only.
- Export selectors do not invalidate preview.
- Export rebuilds an isolated canonical scene using all current values.

## Performance model

- Retain the existing `sprinkle-flow` interactive workload dimension with an
  enforced 900-instance maximum.
- Retain the `image-long-edge` batch dimension through 8192 pixels.
- Add a fixed-cost base deformation pass.
- Icing tessellation remains fixed, so thickness, coverage, drips, and detail
  change values but not vertex count.
- Material and studio-light updates are constant-cost retained-resource
  mutations.
- No measured performance run is authorized by this ordinary product request.

## Acceptance

Every new visible target receives:

- a product acceptance row;
- deterministic unit coverage for normalization or renderer mapping;
- a unique browser test that changes the real UI and observes persistent product
  output evidence;
- persistence/reset coverage through the existing workspace recipes;
- export coverage proving current shape/material/studio values reach final
  output.

## Verification note

Verification tier: Tier 4

Reason: Major post-generation rewrite of schema controls, normalized product
state, retained geometry, materials, lighting, renderer invalidation, export,
acceptance, and browser coverage.

Run: focused unit tests, typecheck, code-health, focused browser acceptance,
catalog validation, `npm run test`, then one bare `npm run verify:delivery` and
`npm run dev`.

Skip: measured performance and `npm run verify:perf`, because the user requested
product fidelity and controls rather than a performance iteration or full audit.
