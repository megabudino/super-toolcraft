# Blender-Inspired Wind Profiles

Date: 2026-07-20, animation correction 2026-07-21

## Goal

Extend Grass Studio with several clearly different wind behaviors and a powerful directional blast. The blast must push both tall grass and lawn cover consistently in one authored world-space direction instead of visibly swaying back and forth.

The controls borrow Blender force-field concepts without claiming to reproduce Blender's full soft-body simulation. Blender Wind supplies constant force along an effector axis; its common field settings include Strength, Flow, Noise Amount, and Seed. Blender Vortex is intentionally out of scope because it produces rotation around an axis rather than the requested one-way blast.

Sources:

- [Blender 5.0 Force Fields](https://docs.blender.org/manual/en/dev/physics/forces/force_fields/introduction.html)
- [Blender Wind](https://docs.blender.org/manual/es/3.3/physics/forces/force_fields/types/wind.html)
- [Blender Vortex](https://docs.blender.org/manual/en/2.90/physics/forces/force_fields/types/vortex.html)

## User-Visible Behavior

The wind field exposes four profiles:

- `Off`: no wind deformation on either grass layer.
- `Breeze`: smooth, low-frequency motion with a light directional bias.
- `Gust`: coherent pressure fronts travel across the field while every loaded blade remains bent in the selected direction.
- `Blast`: sustained high directional pressure with a forward-traveling pressure texture. Timeline progress animates the gust texture while pressure stays positive, so blades never swing back through their rest pose or reverse the authored direction.

The direction is authored as a world-space angle on the field's XZ plane:

- `0°` points toward positive X.
- `90°` points toward positive Z.
- `180°` points toward negative X.
- `270°` points toward negative Z.

Camera orbit does not change this world-space direction.

Both grass layers consume the same field. Tall grass uses full response. Lawn cover uses a 0.45 response multiplier so short blades visibly bend while appearing stiffer than tall blades.

## Controls

The existing `Tall Grass Wind` section becomes one global `Wind Field` section because the effect now owns both grass layers. The eight controls stay together because `Profile` gates all seven dependents; every control declares either the `field` or `variation` semantic group so the larger section remains structurally explicit.

### Wind Field

- `Profile`: segmented `Off / Breeze / Gust / Blast` selection.
- `Direction`: `0–360°` slider.
- `Strength`: `0–100%` directional load.
- `Flow`: `0–100%` sustained alignment with the air stream. Higher values preserve more mean directional load between pressure changes; lower values allow more recovery toward the rest pose.

Variation controls in the same `Wind Field` section:

- `Noise`: `0–100%` pressure variation.
- `Gust scale`: spatial width/frequency of coherent fronts.
- `Turbulence`: `0–100%` contribution from finer bounded harmonics.
- `Seed`: deterministic variation seed using Blender's documented `1–128` range.

The global wind section remains available even when both grass layers are temporarily disabled, so users can configure the field before restoring a layer. All controls except `Profile` are hidden when the profile is `Off`. In `Blast`, its noise controls add bounded spatial irregularity without adding periodic directional sway.

The default profile is `Gust` to preserve the character of the existing animated field. Existing rightward wind maps to `0°`. Persistence advances to version 2 because the old `wind.direction` string is replaced by numeric direction and the new behavior targets need deterministic defaults. On initial restore, a non-Off wind in Static preview switches once to Dynamic preview and starts the Toolcraft timeline so the field is visibly alive without an extra Play click. Later Pause and explicit Static selection remain authoritative: Pause freezes the current wind frame, and choosing Static after initialization stops playback until the user plays or returns to Dynamic.

## State And Renderer Mapping

Runtime schema state remains the sole owner of final wind settings. The new targets are:

- `wind.profile`
- `wind.directionAngle`
- `wind.strength`
- `wind.flow`
- `wind.noiseStrength`
- `wind.noiseScale`
- `wind.noiseDetail`
- `wind.seed`

The renderer converts `wind.directionAngle` to a normalized XZ vector. Both stylized and PBR vertex paths consume the same uniforms and deformation formula. Position and normals bend along that vector rather than only along world X.

Profile pressure functions are fixed-cost shader branches:

- `Breeze` uses smooth broad harmonics and low mean load.
- `Gust` uses forward-traveling coherent fronts and bounded fine harmonics.
- `Blast` uses sustained mean load shaped by Strength and Flow plus forward-traveling broad and fine pressure variation. The scalar pressure remains strictly positive, so time changes intensity and local compression without reversing direction.

Horizontal bending increases with blade height and normalized blade position. Vertical compression grows with total wind load. The lawn response multiplier is applied before bend and compression so both layers share direction and profile while retaining different stiffness.

The timeline remains the existing playback timeline. Breeze, Gust, and Blast derive seamless forward-only progress from Toolcraft timeline time. Video export and PNG export consume the same evaluated settings and field direction as the live preview. `Off` remains invariant.

## Performance And Pipeline

The implementation extends the existing retained WebGL material with bounded uniforms and fixed harmonic branches. It does not add per-blade CPU simulation, new renderer passes, variable loop counts, or stateful velocity integration.

Reachable renderer inputs expand to the new wind targets. None is a workload dimension because they do not change instance count, geometry resolution, output resolution, pass frequency, or algorithmic iteration count. The existing scene render passes and animation invalidation remain the owners; their declared inputs and cache/invalidation metadata must include every new target.

`src/app/app-performance-impact.json` will classify shader/material modules against the exact existing scene render passes and keep schema/acceptance wiring functional unless it changes pass execution semantics.

## Acceptance And Verification

Automated and browser coverage will prove:

- every profile is reachable and visibly distinct;
- `Off` removes wind from tall grass and lawn cover;
- cardinal angles produce the expected normalized XZ directions;
- both layers bend in the same direction, with lower lawn response;
- Strength and Flow change sustained directional load;
- Noise, Gust scale, Turbulence, and Seed change deterministic variation;
- Blast holds one direction while producing different deformation at separated timeline samples;
- Breeze and Gust keep the existing seamless forward-only timeline behavior;
- a restored non-Off field becomes visibly animated without an extra Play click, while Pause still freezes the rendered frame;
- reset restores every wind default;
- version-2 localStorage persistence restores the new wind settings after reload;
- PNG and video exports consume the same wind configuration as preview;
- canvas drag and zoom remain stable with the animated renderer.

Verification tier: Tier 3.

Reason: the delivery changes schema behavior, animation inputs, retained WebGL vertex deformation, both grass layers, persistence, and exported renderer output.

Development checks: targeted wind unit tests, schema/acceptance tests, affected browser acceptance, and exact affected performance scenarios only when renderer pass semantics require them.

Delivery for the animation correction: targeted type/unit/build and the exact wind/timeline browser proof, followed by `npm run dev` and a real-browser visual check. The user explicitly excluded performance checks for this correction, so no performance or protected delivery checkpoint is run.

Skipped: no full performance refresh unless the protected delivery lifecycle identifies this as the first stable baseline. The request is feature work, not explicit performance optimization.

## Rejected Alternatives

- A literal Blender Vortex was rejected because it rotates around an axis and does not match the requested one-way blast.
- A controls-only Blender clone without profiles was rejected because it makes the requested Breeze/Gust/Blast outcomes harder to reproduce quickly.
- A stateful per-blade spring simulation and positioned effector with falloff were rejected because they add substantial runtime, export, and verification complexity without improving the requested global directional field.
- Spatial Falloff was rejected for this batch because the wind source is a global plane field with no authored source position.
