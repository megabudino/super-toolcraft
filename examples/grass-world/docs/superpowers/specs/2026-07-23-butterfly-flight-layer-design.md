# Butterfly Flight Layer Design

Date: 2026-07-23

Status: approved by the user's feature request

## Goal

Add one independently switchable PBR butterfly layer to the existing grass
field. Butterflies fly in a deterministic seamless loop, expose bounded count and
motion controls, land on the Terrain while the pointer hovers the visible field,
and take off again when the pointer leaves the Terrain.

## Source Asset Study

Source: `/Users/kusnizza/Desktop/Butterflies 4K.zip`.

The archive is a Megascans atlas with eight butterfly variants arranged in two
columns and four rows. It supplies exact 4096 x 4096 Base Color, Opacity, Normal,
Roughness, AO, Bump, Cavity, Displacement, Gloss, Specular, and Translucency
maps. This delivery uses the Base Color, Opacity, Normal, and Roughness maps as
the live PBR set. The four source JPEGs remain at 4096 x 4096 and are copied
without resizing, re-encoding, or color alteration.

The atlas has no mesh. Product geometry is therefore one purpose-built
two-wing instanced primitive whose UVs address the eight atlas cells.

## Product Behavior

- `Visible` switches the complete butterfly layer in preview and export.
- `Count` selects the actual number of butterfly instances from 0 through 64.
- `Size` selects a minimum and maximum wingspan.
- `Seed` deterministically redistributes positions, species, size, heading, and
  animation phase.
- `Height` selects the minimum and maximum flight height above the current
  procedural Terrain.
- `Flight cycles` selects an integer number of complete path cycles per Timeline
  loop so first and last frames stitch.
- `Wing cycles` selects an integer number of complete wing beats per Timeline
  loop for the same seam guarantee.
- `Landing time` controls both descent and takeoff response.

Hover means an unpressed mouse or pen pointer projected onto the visible Terrain.
Entering or moving across the Terrain drives every butterfly toward its own
deterministic landing point. Moving into empty canvas, leaving the preview, or
starting a drag releases the hover and drives the flock back to flight. Touch
does not invent hover behavior.

Landing contracts the flight path toward the instance's ground anchor, lowers it
to the deformed Terrain, reduces wing amplitude, and preserves a small body
clearance. Takeoff reverses the same smooth transition. A hover transition
schedules frames until settled even when Timeline playback is paused.

## Control Section Inventory

### Butterflies

- Entity: butterfly layer population and stable layout.
- Targets: `butterflies.enabled`, `butterflies.count`,
  `butterflies.sizeRange`, `butterflies.seed`.
- Grouping reason: visibility, actual cardinality, physical size, and the
  deterministic placement seed define one editable layer.

### Butterfly Flight

- Entity: flight loop and hover landing response.
- Targets: `butterflies.heightRange`, `butterflies.flightCycles`,
  `butterflies.wingCycles`, `butterflies.landingTime`.
- Grouping reason: altitude, path speed, wing speed, and transition time define
  the motion of the same retained flock.

Built-in fit:

- switches use `switch`;
- count, seed, cycle counts, and landing time use `slider`;
- size and height bounds use atomic `rangeSlider`;
- no custom panel control is required.

## Animation Intent Inventory

Classification: playback Timeline plus pointer-driven preview interaction.

The existing six-second top playback Timeline remains the product transport
because the app still exports video. Butterfly path and wing cycles consume
Toolcraft loop progress and are forward-only and seamless. Hover landing is not
a second clock or transport: it is a bounded preview transition layered over the
current Timeline pose. Video and still export render the deterministic airborne
Timeline pose and never capture transient pointer hover state.

## Renderer Design

`GrassButterflyResource` owns:

- one retained `InstancedMesh`;
- one compact two-wing `InstancedBufferGeometry`;
- one `MeshStandardMaterial`;
- exact shared Base Color, Opacity, Normal, and Roughness textures;
- deterministic layout arrays and reusable matrix/vector objects;
- hover target/current blend and frame timing.

The two wings live in one geometry and carry a signed wing-side vertex
attribute. Per-instance atlas index and wing phase attributes allow one
PBR material and one draw call for all eight species. The material shader
remaps UVs into the correct two-column/four-row atlas cell and folds both wings
around the body axis. Alpha test provides clean silhouettes without transparent
draw sorting.

Layout generation is deterministic from count, seed, Field shape, Terrain, and
Surface Bend. Every anchor stays inside the current Field. Ground height is read
from the same reference-surface function used by grass and scan placement.
Flight paths use integer harmonics so progress 0 and 1 match exactly.

The retained resource is attached to `surfaceRoot`, so existing field
orientation and Surface Tilt ownership remain coherent. It receives the same
scene PBR environment and directional lighting as other physical layers.

## Pipeline And Performance Model

Reachable workload control: `butterflies.count`.

Workload dimension:

- id: `butterfly-count`;
- unit: `butterfly-instances`;
- source: schema target `butterflies.count`;
- default: 18;
- interactive/batch maximum: 64;
- relationship: linear.

Executable passes:

1. `grass-butterfly-resource`
   - cost: constant source decode/upload;
   - frequency: initial/discrete;
   - lifecycle: retained source/resource;
   - invalidated by the fixed asset identity only.
2. `grass-butterfly-layout-build`
   - cost: linear in `butterfly-count`;
   - frequency: interaction;
   - lifecycle: memoized renderer layout;
   - invalidated by count, seed, Field boundary, Terrain, or Surface Bend inputs.
3. `grass-scene-render`
   - adds linear matrix/shader work in `butterfly-count`;
   - Timeline and hover invalidate only the real scene render;
   - count/layout controls invalidate layout plus scene render;
   - size and motion controls invalidate scene render only.
4. `grass-export-frame`
   - includes the same butterfly count and full-resolution PBR textures.

Viewport drag and zoom do not rebuild butterfly assets or layout. Hover
transitions coalesce through the existing render backpressure.

### Realistic Staggered Landing Correction

Terrain hover starts a deterministic landing wave rather than one synchronized
vertical translation. Each butterfly receives a unique Seed-derived landing
order. Butterflies whose delay has not elapsed continue their normal Timeline
flight; when an individual approach begins, its current world pose is captured
so subsequent Timeline frames cannot move the start of that approach.

Each approach follows a curved horizontal path from the captured pose to its
own Terrain anchor, descends with eased flare instead of constant vertical
speed, banks during the turn, levels at contact, and folds its wings
independently. The retained instanced geometry therefore carries a dynamic
per-instance landing attribute rather than one flock-wide wing-fold uniform.
Leaving Terrain reverses the same paths and stagger order, so the most recently
landed butterflies take off first without teleporting.

`butterflies.landingTime` owns the complete first-start to last-contact wave.
The transition uses elapsed wall time rather than a per-frame cap, so the
authored duration remains correct when the heavy preview renders below 60 FPS.

## Layer, Persistence, Randomizer, And Export

No runtime Layers panel is introduced. `butterflies.enabled` follows the app's
existing independently switchable visible-layer model and receives matching
canvas diagnostics.

Persistence remains `v20`/`20`; new targets restore schema defaults when absent.
Settings transfer includes them automatically. `Scratch` hides Butterflies with
all other non-Surface layers without clearing authored settings. `Randomize`
keeps the layer present and deterministically varies count, size, and seed.

PNG/JPG and video render the same material, count, species distribution, Terrain
anchors, and Timeline phase as preview. Source texture resolution remains 4K in
all paths.

## Verification Tier

Verification tier: Tier 3.

Reason: this adds a custom-renderer layer, animation, pointer interaction,
workload control, pipeline passes, persistence targets, and preview/export
pixels without changing the signed runtime or dependencies.

Development proof:

- focused defaults/value/layout/resource/shader tests;
- schema, acceptance, pipeline, and performance gates;
- focused browser acceptance for visibility, count, Timeline movement,
  hover landing/takeoff, and export inclusion;
- affected butterfly layout/frame performance path only.

Delivery proof uses one impact-derived `npm run verify:delivery -- --tier=3`
invocation after targeted checks are green, followed by the identity-verified
development server.
