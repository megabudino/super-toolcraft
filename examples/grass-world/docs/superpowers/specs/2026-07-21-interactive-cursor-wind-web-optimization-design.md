# Interactive PBR Grass And Web Render Optimization

Date: 2026-07-21

## Goal

Replace the split Static/Dynamic preview model with one optimized, interactive,
always-PBR live preview. The field must keep its authored visual density, react
to cursor movement without per-blade CPU work, preserve a clean path for richer
grass animation later, and keep full-density deterministic PNG/JPG/video export.

This batch optimizes the current Toolcraft live renderer. It does not introduce
a standalone Web Embed exporter or record cursor gestures into exported video.

## Research Basis And Current Cost

The existing renderer already uses retained `InstancedBufferGeometry`, so its
draw-call structure is directionally correct. Instancing does not remove the
vertex, fragment, transparency, or shadow cost of submitted geometry.

The current bounded animated preview submits:

- 1,800 Tall Grass blades at 24 triangles per blade: 43,200 triangles;
- 12,000 Lawn Cover blades at 12 triangles per blade: 144,000 triangles;
- 187,200 generated-grass triangles before shadow work;
- potentially about 374,400 color-triangle submissions because double-sided
  transparent materials render front and back passes separately by default.

The selected live representation keeps the 43,200-triangle Tall Grass sample
and replaces Lawn Cover with 2,000 six-blade clumps at 12 triangles per clump,
for 67,200 generated-grass color triangles in one pass. That is about 5.6x fewer
generated-grass color-triangle submissions at reset preview quality. A Tall
shadow refresh adds 43,200 triangles on its own bounded cadence, so the expected
reduction for this grass subsystem on a shadow-refresh frame is about 3.8x. The
whole frame will improve by less because terrain, scans, lighting, and post-color
work remain.

The design follows established foliage practice: retain silhouette geometry
where it matters, represent dense low cover as instanced clumps, avoid per-blade
CPU simulation, bound transparent overdraw, and calculate deformation in the
vertex shader.

Sources:

- [Unreal Engine Foliage Mode](https://dev.epicgames.com/documentation/en-us/unreal-engine/foliage-mode-in-unreal-engine)
- [GPU Gems: Toward Photorealism in Virtual Botany](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-1-toward-photorealism-virtual-botany)
- [GPU Gems: Rendering Countless Blades of Waving Grass](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass)
- [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)
- [Three.js Material](https://threejs.org/docs/pages/Material.html)

## Product Model

### One Live Preview

Remove the `Static / Dynamic` preview selector and its hidden renderer coupling.
There is one live preview:

- Tall Grass uses the existing bounded preview count and detailed blade shape;
- Lawn Cover uses retained six-blade clumps;
- both layers always use the physical PBR material path;
- both layers can receive global Wind Field deformation and Cursor Wind;
- preview quality counts stay editable and always visible;
- export keeps the complete authored Tall and Lawn counts.

The renderer has only two explicit purposes:

- `interactive-preview`: optimized counts, Lawn clumps, transient pointer state,
  and preview shadow cadence;
- `export`: complete authored geometry, no pointer state, and a shadow update for
  every requested still or video frame.

No code may infer geometry or material quality from a removed preview mode.

### Always PBR

Remove `appearance.pbrEnabled` and always render Tall Grass and Lawn Cover with
their physical materials in preview and export. Also remove the now-unreachable
stylized material selectors `appearance.materialStyle` and
`lawn.materialStyle`. PBR Roughness and Sheen remain editable and become
unconditionally visible in their owning Tall and Lawn sections.

The retained grass resources must stop constructing unused stylized materials;
this is a real renderer simplification, not a hidden `pbrActive = true` branch.
Terrain, Megascans layers, the boulder, environment lighting, and grading remain
on their existing PBR paths.

### Wind Type Is The Motion Choice

Keep one `Wind Field` segmented control backed by `wind.profile`, presented as
`Type` with four states:

- `None` (`off` internally): global wind contribution is exactly zero;
- `Breeze`;
- `Gust`;
- `Blast`.

The seven existing wind parameter controls remain visible only when Type is not
None. Type selects a global force profile; it does not replace the Toolcraft
timeline transport or silently rewrite Play/Pause. Pausing freezes global wind
phase. `None` disables global wind but does not disable Cursor Wind, so the field
can still react locally to the pointer.

## Controls

### Preview Quality

Remove Mode from the existing Preview section. Keep the two bounded preview
quality controls and make them always reachable:

- Tall preview count, existing `preview.bladeCount` target;
- equivalent Lawn preview count, existing `preview.lawnBladeCount` target.

The values describe live workload only. Export continues to use the complete
authored `blade.count` and `lawn.count` values.

### Cursor Wind

Add one product-owned section using built-in Toolcraft controls:

- `Active`: switch, target `interaction.cursorWindEnabled`, default `true`;
- `Radius`: slider, target `interaction.cursorWindRadius`, `0.15–2.00 m`,
  default `0.70 m`, step `0.05 m`;
- `Strength`: slider, target `interaction.cursorWindStrength`, `0–200%`,
  default `100%`, step `5%`;
- `Recovery`: slider, target `interaction.cursorWindRecovery`, `0.10–2.00 s`,
  default `0.55 s`, step `0.05 s`.

Radius, Strength, and Recovery are hidden when Active is off. The section is
always available because the single live preview is always interactive.

These authored settings participate in reset, existing localStorage
persistence, and settings transfer. Keep the v14 persistence namespace so
unrelated user settings survive. Removed Preview/PBR/Cel targets are no longer
part of the schema or settings readers; stale stored/imported values cannot
affect output. New Cursor Wind targets fall back to their schema defaults.

Current pointer position, velocity, direction, decay, and interaction-field
contents are transient renderer state. They are not persisted, undoable,
keyframeable, or exported.

## Animation Intent Inventory

- Global wind remains a playback-timeline animation with the existing seamless
  forward-only six-second loop.
- `wind.profile` selects the force function; `off` returns zero force.
- Cursor Wind is pointer-driven transient interaction state and remains live
  while the global timeline is paused.
- Cursor Wind is not a second transport, timeline, keyframe track, or autonomous
  decorative loop.
- While the pointer envelope is active, rendering is requestAnimationFrame
  coalesced. Once it recovers and global playback is not invalidating the scene,
  no cursor-owned animation frame remains scheduled.
- A future character, footprint, explosion, or multi-pointer animation source
  must be able to join the same grass-force sampling contract without changing
  clump geometry.

## Pointer Interaction Model

Never raycast against grass instances or update individual blade/instance
matrices on the CPU.

Coalesce raw mouse/pen pointer events and resolve at most one terrain projection
per animation frame. Start with the retained terrain Raycaster because it is the
current authoritative visible surface. Keep projection behind one focused
interface so profiling can replace it with an analytic heightfield intersection
and one or two height refinements if terrain raycasting becomes a measurable CPU
bottleneck.

For each accepted terrain sample:

1. Convert client coordinates to one terrain world point.
2. Compute world-XZ delta and elapsed time from the previous valid point.
3. Smooth direction and clamp speed to a bounded `0–1.2 m/s` domain.
4. Convert speed to an impulse with a quiet threshold at `0.05 m/s`.
5. Decay the envelope exponentially with authored Recovery.

The renderer sends one bounded interaction sample:

- pointer world XZ;
- normalized travel direction;
- radius;
- normalized strength envelope.

Stationary hover does not sustain a permanent force. Moving the pointer creates
a directional wake, then the field recovers. A canvas drag, orbit, pan, pinch,
zoom, touch, or any pointer with pressed buttons does not create Cursor Wind.

## Force And Future-Animation Contract

Grass deformation is expressed through one shader-owned force sampler:

```text
totalForce = sampleGlobalWind(bladeRoot, time)
           + sampleGrassInteraction(bladeRoot)
```

The combined force is then multiplied by per-blade stiffness and normalized
height response before one final safe bend clamp. Roots remain fixed and PBR
normals follow the resulting bend.

`sampleGrassInteraction(vec2 bladeRoot)` initially reads the single Cursor Wind
uniform sample. Its input/output contract is intentionally representation
independent. A later version can read a low-resolution interaction texture for
multiple forces, lingering trails, character footsteps, or explosions without
rebuilding Tall or Lawn geometry.

Every blade within a Lawn clump owns deterministic local metadata:

- local root offset;
- local direction/rest tilt;
- height scale;
- phase offset;
- stiffness.

Global and interaction forces are evaluated at each local blade root, not once
at the clump origin. Six blades therefore share one instance but do not move as
one rigid card.

## Live Lawn Representation

Use a fixed six-blade clump for live Lawn Cover:

- six single-segment flat ribbons;
- deterministic local root offsets, height scales, directions, phase offsets,
  rest tilts, and stiffness values;
- one retained instance represents six equivalent lawn blades;
- `preview.lawnBladeCount` remains the user-facing equivalent density budget;
- actual clump count is `ceil(preview.lawnBladeCount / 6)`;
- the reset live preview submits 2,000 clumps instead of 12,000 individual Lawn
  instances.

Derive clump instances from the existing memoized Lawn layout. Do not resample
terrain, create a second planting distribution, or allocate per-frame clump
data. The shader preserves Lawn gradient, color variation, terrain alignment,
PBR roughness/sheen, global wind, Cursor Wind, and the current 0.45 Lawn response
multiplier.

Do not add procedural fragment FBM or a new terrain-coverage pass in this batch.
The existing Uncut Grass PBR surface is the sub-pixel ground coverage. Validate
clumps at low and high camera angles. If a later quality pass proves a real gap,
the only acceptable first fallback is a tileable coverage/normal texture using
at most one or two bounded samples; multi-octave screen-wide fragment noise is
out of scope.

Tall Grass keeps its current detailed geometry and bounded live preview count.
Spatial cell LOD/streaming remains deferred because the 7x5 m orbit view usually
sees most of the field and extra cells would increase draw calls without useful
culling.

## PBR Transparency And Shadows

Select the cheapest correct PBR material state per grass layer:

- if every authored gradient opacity is 100%, use the opaque fast path with
  `transparent = false` and `depthWrite = true`;
- if any opacity is below 100%, use `transparent = true` with
  `forceSinglePass = true` and the existing bounded alpha test.

Do not force all grass through transparent blending. Do not introduce
`alphaHash`; without TAA it can shimmer during pointer motion.

Keep current shadow ownership: Tall Grass casts the directional shadow, Lawn
Cover does not. Live preview color can update at display cadence while the Tall
shadow map refreshes at no more than 30 Hz, with immediate invalidation after
camera, layout, visibility, material-opacity, light, or shadow-setting changes.
Export refreshes the shadow for every requested frame. Cursor/global deformation
must use the same force uniforms in Tall's custom-depth material so shadow shape
matches the most recent shadow refresh.

## Renderer And Resource Boundary

Retain one full Lawn resource for export and one live Lawn clump resource. Both
derive from the same memoized layout and have explicit lifetime/disposal.

The single live preview uses one canonical scene-render pass. Remove the separate
Static/Dynamic scene branch, `grass-dynamic-scene-render`, preview-mode change
target, and mode-driven playback/material effects. Export callers pass `export`
explicitly so optimized clumps and pointer state can never leak into PNG/JPG or
video output.

Pointer listeners live in product canvas output, are scoped to the grass host,
and update the retained scene through a focused controller. Toolcraft canvas,
panel, timeline, toolbar, and orientation-gizmo surfaces remain runtime-owned.

## Performance And Quality Proof

Reachable workload dimensions remain the two bounded live counts:

- `preview.bladeCount` for detailed Tall Grass;
- `preview.lawnBladeCount` for equivalent Lawn density, mapped six-to-one to
  actual clump instances.

The four Cursor Wind settings, Wind Type, and one transient pointer sample are
fixed-cost shader inputs, not workload dimensions. Pointer motion invalidates
only the canonical live scene-render pass and never rebuilds layouts, scans,
environment resources, clump attributes, or export geometry.

Measure more than source-level triangle counts:

- generated-grass actual/equivalent instance counts;
- `renderer.info.render.calls` and `renderer.info.render.triangles`;
- CPU frame time and GPU frame time when
  `EXT_disjoint_timer_query_webgl2` is available;
- p50 and p95 frame time, not only average FPS;
- default and maximum Tall/Lawn preview counts;
- DPR 1 and DPR 2;
- opaque and translucent gradient cases;
- shadow-refresh and non-shadow-refresh frames;
- visual screenshots at representative low and high camera angles.

Run `assessToolcraftRenderPlan` after updating the typed renderer pipeline and
performance model. Add a protected kernel benchmark only if assessment requires
one. Do not lower render scale, canvas/output resolution, export density, PBR
quality, or authored scan counts to pass budgets.

## Acceptance

Automated and browser coverage must prove:

- no Static/Dynamic selector, PBR switch, or Cel/material-style selector remains;
- there is one optimized live preview and generated grass is PBR in preview and
  every export path;
- PBR Roughness and Sheen remain reachable without conditional PBR visibility;
- Preview Quality exposes Tall and equivalent Lawn counts at all times;
- Wind Type offers None, Breeze, Gust, and Blast; None contributes zero global
  force while Cursor Wind still works;
- Wind Type never rewrites explicit timeline Play/Pause;
- Cursor Wind controls have exact defaults, bounds, reset, dependent visibility,
  persistence, and settings-transfer behavior;
- pointer movement over terrain changes Tall and Lawn frame signatures in the
  same travel direction;
- each Lawn clump evaluates distinct deterministic blade motion rather than one
  rigid transform;
- stationary hover and pointer leave recover to rest;
- Active off prevents local pointer response;
- Radius, Strength, and Recovery produce distinct bounded behavior;
- orbit/drag/touch/miss inputs do not create Cursor Wind or break viewport input;
- timeline Pause freezes global wind while Cursor Wind remains interactive;
- reset live Lawn density reports 12,000 equivalent blades and 2,000 clumps;
- export uses complete Tall/Lawn geometry, always PBR, and no pointer state;
- opaque gradients take the opaque fast path and translucent gradients take one
  transparent color pass without visual alpha regression;
- live shadow cadence is bounded and exports update shadows every frame;
- no WebGL errors, per-frame geometry allocation, or material recompilation
  occurs during steady pointer movement.

## Verification Tier

Verification tier: Tier 3

Reason: the future delivery changes the custom WebGL geometry, material model,
shadow cadence, retained resources, high-frequency pointer interaction,
animation-frame invalidation, schema controls, preview pixels, export routing,
and measured renderer workload. It is explicit performance work.

Run: focused state/control/model/geometry/material tests; render-plan assessment;
affected browser acceptance; exact live scene-render performance paths; one
protected `npm run verify:delivery -- --reason=explicit-performance-work` call
with impact-derived Tier-3 selectors; `npm run dev`; controlled-browser visual,
motion, timing, and console checks.

Skip: no Layers changes, no new timeline/keyframes, no media flow, no standalone
embed exporter, no cursor recording, no persistent interaction texture, and no
open-world cell streaming. Do not run unrelated full gates during development.

## Rejected Alternatives

- Keeping a hidden Static/Dynamic mode: rejected because the product now has one
  optimized interactive preview and explicit full-density export.
- Keeping a hidden stylized material branch: rejected because always-PBR should
  remove unused material compilation/resource ownership, not only hide a switch.
- Per-blade CPU physics: rejected because cost scales with visible blades and
  duplicates deformation state already suited to the GPU.
- One force sample per clump: rejected because six blades would move like one
  rigid card and limit future animation quality.
- Raycasting grass instances: rejected because terrain supplies one bounded
  world-space interaction point.
- One `THREE.LOD` object per blade: rejected because thousands of Object3D
  updates replace GPU work with avoidable CPU overhead.
- Blanket transparent `forceSinglePass`: rejected because fully opaque gradients
  should use early-Z and skip blending entirely.
- Procedural terrain FBM coverage: rejected because screen-wide fragment work
  can erase the vertex/topology savings.
- Immediate open-world grid streaming: rejected because most of the current
  field remains visible in the orbit-only view.
- Persistent trail render target: deferred until multiple forces, footsteps, or
  lingering trails are requested; the interaction sampler contract keeps that
  evolution open.
- Cursor motion in exported video: rejected because deterministic export needs
  an authored input track rather than transient live state.
