# Donut Geometry Nodes Simulator Design

Date: 2026-07-29  
Mode: reference-runtime clone  
Reference: `/Users/kusnizza/Desktop/Donut Simulation Blender Geometry Nodes.blend`

## Goal

Turn the supplied Blender Geometry Nodes scene into a standalone Toolcraft
donut-building simulator. The app must preserve the authored donut base, plate,
icing and sprinkle behavior, the public Geometry Nodes inputs, the physical
material intent, the studio environment, and the three-light rig. The result is
an interactive WebGL product inside the standard Toolcraft shell, with real
runtime state, persistence, orbit interaction, and PNG/JPG export.

## Reference Study

The source was opened successfully in Blender 4.5.2 LTS. It is a Blender 4.0.2
file containing:

- 48 objects in three collections;
- six primary scene objects: `Base`, `Plate`, `Floor`, `Icing`, `Sprinkle`, and
  the hidden-render `Main Group`;
- five Geometry Nodes groups with 430 authored nodes and 532 links in total;
- five geometry simulation zones inside `Main group`;
- 28 drivers that transfer icing and sprinkle modifier values into simulation
  attributes and output geometry;
- ten materials, including physical `Material` for the donut, `Material.002`
  for the plate, `icing`, and `sprinkle`;
- three area lights;
- a `brown_photostudio_02_2k.exr` world environment rotated 90 degrees at
  strength 0.25;
- a separate blue camera-ray world background at strength 1.92;
- Filmic color management with Medium High Contrast;
- a 1920×1080, 30 fps scene with no camera, no keyframed action, and no
  authored camera animation.

The original was restored and observed by:

- reading object, modifier, node-interface, node-link, material, world, light,
  image, driver, and evaluated-mesh data through Blender Python;
- evaluating frames 1 through 240 sequentially;
- rendering the authored base/plate, the two dispensers, the hidden simulation
  output, and every sprinkle Shape Type and Colour Type with a temporary study
  camera;
- verifying that the saved modifier state does not produce an authored
  frame-to-frame animation across frames 1–240.

The temporary study camera is observation tooling only. It is not reference
camera evidence because the `.blend` contains no camera.

### Public Geometry Nodes Inputs

`icing`:

- `Colour`;
- `Enable`;
- `Clear Base`;
- `Clear Detail`.

`Sprinkle`:

- `Flow`, current value 1;
- `Scale`, current value 0.5, authored minimum 0.2;
- `Shape Type`, integer 1–3;
- `Colour Type`, integer 1–5;
- `Metallic`, 0–1;
- `Solid Colour`;
- `Clear`.

`Main group` receives those values through drivers, stores the attributes
`col`, `type`, `typec`, `sc`, `rand`, and emits the final simulated geometry.
The five simulation zones own icing deposition, icing relaxation/detail, point
distribution, sprinkle accumulation, and collision/proximity state.

### Sprinkle Modes

Rendered Geometry Nodes variants establish:

- Shape 1: short faceted pellets;
- Shape 2: round pearls;
- Shape 3: elongated rounded jimmies;
- Colour 1: `Solid Colour` from the `col` attribute;
- Colour 2: external palette image A;
- Colour 3: external palette image B;
- Colour 4: procedural random hue;
- Colour 5: external palette image C.

The three pasted palette images are not packed in the `.blend`, are not present
on disk, and retain their original Windows temp paths. Their intended switching
behavior is preserved with three deterministic product palettes: Chocolate,
Pastel, and Sugar. Solid and Rainbow preserve the actual authored data paths.

The HDRI is also absent from the `.blend`, but its source is recoverable as the
CC0 Poly Haven asset Brown Photostudio 02. The app uses its 1K HDR derivative to
retain the same lighting character without shipping the much larger 2K EXR.

## Approaches Considered

### 1. Baked GLB only

This would preserve one evaluated mesh exactly, but every Geometry Nodes input,
clear operation, shape mode, palette mode, and simulation response would be
lost. It is rejected because the result would be a viewer, not a simulator.

### 2. Remote/headless Blender renderer

This could run the source nodes directly, but would require Blender on a server,
large round trips, frame cache management, and non-local exports. It is rejected
because the generated Toolcraft app must remain standalone and responsive.

### 3. Hybrid WebGL recreation

Use exact Blender-derived static geometry for the donut base and plate, then
recreate icing and sprinkles as deterministic procedural Three.js geometry.
Rebuild the material and light intent numerically and use the recovered HDRI.
This approach is selected because it preserves the authored silhouette and
look while keeping every public control live in the browser.

## Product Surface

The Toolcraft runtime owns the app shell, canvas, toolbar, controls panel,
settings transfer, output sizing, background, persistence, history, reset,
orientation gizmo, and sticky export action.

The product canvas contains only:

- the plate;
- the donut base;
- an optional icing surface;
- deterministic sprinkle instances;
- the authored studio light/environment response.

The Blender dispenser objects are workflow helpers, not final simulated output:
`Main Group` reads them as sources and the `.blend` has no output camera. Their
user-facing inputs become the app’s Icing and Sprinkles sections. The final
canvas presents the resulting donut rather than the off-axis Blender editing
layout.

## Controls

Runtime Setup is normalized by Toolcraft:

- Export Settings;
- Import Settings;
- Background;
- Infinity canvas;
- Background color;
- Aspect ratio;
- Canvas width;
- Canvas height;
- Resolution scale.

Product sections:

### Donut

- `Plate`: switch, default on, mapped from the authored `Plate` object’s render
  visibility;
- Orientation Gizmo, hidden-label runtime owner for `scene.orientation`.

The donut base appearance and the visible plate appearance are authored
reference constants rather than free-form styling controls.

### Icing

- `Icing`: switch, default on, mapped from Geometry Nodes `Enable`;
- `Colour`: color, default from the modifier’s authored linear color;
- `Clear`: two local actions, `Base` and `Detail`, mapped from `Clear Base` and
  `Clear Detail`.

The clear actions write real simulation-state targets. `Base` removes the whole
icing layer. `Detail` removes only the accumulated drip/detail variation while
leaving the base coating. Changing `Icing` back on or changing Colour
deterministically rebuilds the corresponding visible layer.

### Sprinkles

- `Flow`: slider 0–2, default 1;
- `Scale`: slider 0.2–1.5, default 0.5;
- `Shape`: segmented control with Pellet, Pearl, Jimmy;
- `Palette`: select with Solid, Chocolate, Pastel, Rainbow, Sugar;
- `Metallic`: slider 0–1, default 0;
- `Solid colour`: color visible only for Solid;
- `Clear`: local action.

The Blender inputs use unbounded float maxima. The app records and enforces the
finite ranges above because they cover the authored useful state while bounding
browser geometry and export cost.

### Background

The authored source section contains:

- `export.includeBackground`, default on;
- `appearance.background`, initialized from the blue camera-ray world color.

Toolcraft consumes this pair into Setup.

### Image Export

- Format: PNG/JPG;
- Resolution: 2K/4K/8K;
- sticky `Export PNG` action using the standard Toolcraft export helper.

## Renderer Architecture

The renderer is a native Three.js WebGL canvas managed by a focused product
component. No React Three Fiber dependency is added.

Focused modules:

- reference constants and palette definitions;
- deterministic random/layout utilities;
- icing parametric geometry builder;
- sprinkle primitive/instance builder;
- scene asset and material builder;
- Three renderer lifecycle and state synchronization;
- PNG/JPG export renderer;
- canonical renderer pipeline registration and performance config.

The static Blender asset contains only the exact evaluated `Base` and `Plate`
meshes. Their materials are replaced with authored Three.js physical materials
so browser preview and export share one appearance path.

### Geometry

Base:

- exact Blender evaluated mesh;
- 21,504 polygons;
- source scale and plate relationship retained.

Plate:

- exact Blender evaluated mesh;
- 3,840 polygons;
- glossy white physical material.

Icing:

- parametric upper torus shell fitted to the Blender base bounds;
- deterministic low-frequency edge variation and high-frequency surface detail;
- base and detail state separated so the two source clear operations remain
  observable;
- slightly elevated surface to prevent z-fighting.

Sprinkles:

- deterministic samples on the icing-facing torus surface;
- count derived from Flow and clamped to 900;
- Pellet, Pearl, and Jimmy primitives matching the three rendered reference
  modes;
- instanced meshes grouped by palette/material;
- scale, orientation, hue, metallic response, and random attribute derived from
  stable seeded values.

## Materials And Lighting

Donut:

- source base tone and procedural warm variation;
- roughness 0.54;
- subsurface weight intent;
- subsurface scale 0.113;
- specular level 0.55;
- coat 0.25;
- sheen 0.2.

Icing:

- user colour mixed with subtle position noise;
- roughness centered near 0.47;
- full subsurface response;
- subsurface scale near 0.099;
- specular level near 1;
- coat 0.186;
- subtle bump/detail.

Plate:

- glossy near-white material;
- roughness 0.195;
- specular level 0.896.

Sprinkles:

- attribute/palette-driven base color;
- roughness range 0.3–0.8 from the authored material graph;
- user Metallic value;
- authored specular and sheen intent.

Lighting:

- Brown Photostudio 02 HDRI, rotated 90 degrees, low environment intensity;
- white key area light at Blender position `[-11.05, 5.82, 12.18]`;
- warm fill at `[-4.84, 2.10, 6.86]`;
- cool rim at `[4.14, 4.84, 3.92]`;
- source area sizes and relative energies retained;
- ACES Filmic tone mapping with tuned contrast/exposure corresponding to
  Blender Filmic Medium High Contrast;
- solid blue product background separated from environment lighting.

## State And Data Flow

All product values live in Toolcraft schema state. The renderer reads runtime
values and rebuilds only invalidated resources:

1. controls update Toolcraft state;
2. icing controls invalidate icing geometry/material;
3. sprinkle controls invalidate instance transforms and/or materials;
4. orientation updates only the root scene transform/camera relation;
5. background changes preview/export composition;
6. reset and persistence operate through runtime targets;
7. export resolves the current Toolcraft frame, renders the runtime scene, then
   renders the product scene at the selected resolution.

The product does not write localStorage or IndexedDB directly.

## View Interaction, Timeline, And Layers

`viewInteraction.mode` is `orbit`. The visible spatial scene uses
`scene.orientation` through the Toolcraft Orientation Gizmo and direct model
orbit interaction. Canvas misses remain available to Toolcraft pan.

Interaction ownership:

- scene orbit: canvas;
- icing configuration: panel;
- sprinkle configuration: panel;
- clear operations: panel;
- export: sticky panel action.

No operation is mirrored across canvas and panel.

Timeline is disabled. The source contains simulation zones but no authored
camera, action, or frame-varying saved result. Sequential Blender evaluation
from frame 1 through 240 remains unchanged with the supplied state. Product
changes are therefore owned by explicit controls and deterministic simulation
state rather than an invented animation.

Layers are disabled. The scene is one product composition; users do not need to
select, reorder, add, or delete independent layers.

## Renderer Technique And Performance

Technique decision:

- DOM/SVG: rejected; cannot provide the required 3D material/light response;
- Canvas 2D: rejected; would require a custom software 3D rasterizer;
- WebGL/Three.js: selected; supports the exact static meshes, instancing,
  physical materials, HDR environment, orbit, and offscreen export.

Reachable workload dimensions:

- sprinkle count, sourced from Flow, interactive maximum 900;
- output long edge, sourced from Image Export resolution, batch maximum 8192;
- selected render scale, runtime-owned 1×/2× preview backing.

Renderer passes:

- `scene-bootstrap`: one-time/static GLB and HDR resource setup;
- `icing-geometry`: variable-cost geometry generation on icing state changes;
- `sprinkle-layout`: variable-cost instance generation on sprinkle state
  changes;
- `preview-render`: GPU render on state/orbit/resize invalidation;
- `image-export`: batch offscreen render at selected output resolution;
- `resource-cleanup`: releases renderer, geometry, materials, textures, and
  listeners.

The implementation will compile one canonical renderer pipeline registration,
run `assessToolcraftRenderPlan`, and add a kernel benchmark only if the protected
assessment requires one. No measured performance run is authorized by this
request.

Raster render-scale coverage must prove real backing pixels in interaction and
steady states.

## Acceptance

Browser-backed acceptance proves:

- the exact Blender-derived base and plate are visible;
- Plate toggles only the authored plate without changing the donut;
- the source physical material/light identity produces nontransparent output;
- Icing toggles output and Colour changes its visible pixels;
- both icing clear operations have distinct observable results;
- Flow changes sprinkle count;
- Scale changes instance size;
- all three shapes produce distinct geometry;
- all five palette modes produce distinct color output;
- Metallic changes highlight response;
- Solid colour is conditional and changes Solid output;
- Clear removes sprinkles;
- orientation gizmo/direct orbit changes the visible scene;
- background on/off and color affect preview/export correctly;
- 2K/4K/8K export returns decodable non-empty bytes at the selected long edge;
- reset restores every default;
- values, canvas, and panel workspace survive real reload;
- render scale preserves CSS size and produces the selected backing pixels.

## Verification Tier

Verification tier: Tier 4  
Reason: fresh product conversion with custom WebGL renderer, Blender-derived
assets, schema controls, orbit interaction, export, acceptance, and performance
ownership.  
Run: `pnpm ai:check`; focused Vitest and Playwright checks while developing;
bare `npm run verify:delivery` once at the delivery boundary; `npm run dev` and
identity/browser verification.  
Skip: measured targeted performance and `npm run verify:perf`, because this is
the first functional product delivery and the user did not request a
performance iteration or full audit.

## Risks And Resolutions

- Three palette images are unavailable: preserve their distinct palette slots
  with deterministic Chocolate, Pastel, and Sugar palettes, while retaining
  exact Solid and Rainbow behavior.
- The source has no camera: use required Toolcraft orbit interaction and a
  product-derived initial framing rather than claiming a reference camera.
- The Blender simulation is stateful but the saved scene has no authored motion:
  preserve the public state transitions deterministically without inventing a
  timeline.
- 8K export is large: use the standard Toolcraft preflight and offscreen render
  path, with bounded sprinkle count and explicit completion feedback.
