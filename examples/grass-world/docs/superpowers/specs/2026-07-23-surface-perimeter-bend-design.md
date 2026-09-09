# Surface Perimeter Bend Design

## Goal

Turn the outer band of the existing Terrain surface downward so the field reads as a ground slab with a soft, authored edge. The bend follows the complete editable Field perimeter, including shape roundness and edge irregularity. No grass, scanned plants, flowers, rocks, or boulder may be rooted on the bent band.

## Product behavior

- Add `Surface Bend` immediately after `Surface` and before `Surface Fade`.
- `Include` enables the bend and its placement exclusion. Reset restores the enabled product default.
- `Depth` controls the maximum downward displacement at the outer perimeter in metres.
- `Width` controls how far the bend reaches inward as a percentage of the normalized Field radius. It also defines the exact vegetation- and object-free band.
- `Roundness` biases the profile between a late, tighter turn and an earlier, fuller roll without moving the inner or outer bend boundaries.
- `Smoothness` blends a straight chamfer profile toward a tangent-continuous eased profile.
- The center Terrain remains identical. At the inner bend boundary, the smooth profile begins with no height discontinuity. At the outer perimeter, it reaches the authored Depth.
- The existing `Surface Fade` remains an independent finishing effect and continues to operate across the complete field-space perimeter. Users can reduce its width or strength when they want the full bent edge to remain opaque.
- Interactive preview, pointer hit testing, still export, and video export use the same deformed geometry.

## Defaults and bounds

- `surface.bendEnabled`: `true`.
- `surface.bendDepth`: `0.75 m`, range `0–2.5 m`, step `0.05 m`.
- `surface.bendWidth`: `18%`, range `5–40%`, step `1%`.
- `surface.bendRoundness`: `65%`, range `0–100%`, step `1%`.
- `surface.bendSmoothness`: `85%`, range `0–100%`, step `1%`.

Turning `Include` off is the exact legacy geometry and placement behavior. A zero Depth is visually flat but retains the authored empty band while Include remains on; this keeps geometric amount and placement intent independent.

## Control selection

All values use built-in Toolcraft controls. `Include` is a switch because it gates one semantic feature. `Depth`, `Width`, `Roundness`, and `Smoothness` are bounded scalar sliders. A range slider is rejected because none of these values is a lower/upper pair. Curves and custom controls are rejected because the product needs four stable high-level parameters, not a freeform response editor.

`Surface Bend` owns these five targets as one Terrain-perimeter entity. The section stays adjacent to the existing Surface material workflow without expanding the already dense `Surface` section.

## Geometry and placement architecture

Create one focused surface-bend module that:

1. normalizes and exposes the bend settings;
2. computes the inner placement radius from Include and Width;
3. evaluates a deterministic downward profile from the shared Field relative distance;
4. derives the placement Field shape by uniformly scaling the current shaped perimeter to the inner bend boundary.

The Terrain builder keeps its current bounded segment grid and shared `getGrassFieldPoint` mapping. After sampling the unchanged procedural surface height, it subtracts the bend profile at each vertex and recomputes normals. The existing double-sided PBR ground material therefore shades the curve naturally with Current/Clover textures, color grade, shadows, and HDRI lighting intact.

Tall Grass, Lawn Cover, scan layers, rocks, and boulder use the derived inner placement shape. Existing footprint-safe scan placement continues to pull oversized objects inward, now relative to the bend-free contour. Counts, layer visibility, material state, wind, timeline, and world generators do not change.

## Renderer and invalidation

Add a canonical `grass-ground-geometry-build` pass instead of hiding Terrain rebuilding inside the Tall layout pass.

- Field dimensions, field shape, Terrain noise, and all bend parameters invalidate ground geometry plus scene render.
- Include and Width also invalidate Tall, Lawn, and every scan layout because they change the legal placement domain.
- Depth, Roundness, and Smoothness do not rebuild vegetation or scan transforms.
- The ground geometry remains a retained resource and is rebuilt only when its exact geometry key changes.
- Export constructs the same ground geometry before rendering its frame.

The pass cost is bounded CPU vector work over the existing Terrain grid, multiplied only by the already declared `terrain-octaves` dimension. No new workload dimension, draw call, texture, material, animation loop, or export encoder is introduced. The renderer runtime id advances because the canonical pipeline changes.

## Acceptance and verification

- Include off reproduces the legacy flat perimeter and allows placement throughout the original Field domain.
- Include on displaces only vertices inside the Width band and reaches the exact Depth at the outer edge.
- Roundness changes profile bias; Smoothness changes tangent continuity; neither moves the bend boundaries.
- The deformation follows rounded, squared, and irregular authored Field shapes.
- Tall, Lawn, tufted, wild, white, yellow, rocks, and boulder roots/footprints remain inside the bend-free contour.
- Ground normals remain finite and the center height is unchanged.
- Pointer hit testing follows the deformed ground mesh.
- Reset and localStorage persistence restore/retain all five targets.
- Preview, PNG/JPG, and video use the same surface settings.
- Focused browser proof changes the controls through the real panel, observes persistent product output, and verifies that the bend remains stable through viewport orbit/zoom.

Verification tier: Tier 3
Reason: changes schema state, retained Terrain geometry, every placement domain, renderer invalidation, preview, shadows, hit testing, and exported pixels without changing runtime/template code or dependencies.
Run: focused bend geometry/placement/schema/acceptance Vitest; render-plan and TypeScript checks; focused Chromium control/output/viewport proof; affected performance path only if required by the impact-derived delivery gate; one `npm run verify:delivery` invocation when stable; then `npm run dev`.
Skip: no full performance refresh because the request is a renderer feature, not performance optimization, and the bounded Terrain pass reuses the existing terrain-octaves envelope.

