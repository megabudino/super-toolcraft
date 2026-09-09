# HDRI three-axis rotation design

Verification tier: Tier 3

Reason: the batch adds two live scene-lighting controls and changes how the retained environment, physical key light, stylized light direction, preview, and export pixels are oriented without adding renderer passes or workload dimensions.

Run: no automated test, build, browser, performance, or delivery commands in this batch because the user previously requested that tests remain disabled. Keep the current development server running.

Skip: all automated proof and `verify:delivery`; this implementation does not claim a new protected receipt.

## Goal

Expand HDRI orientation from one yaw angle to complete three-axis rotation so the user can place the bright and shaded regions more precisely.

## Product behavior

- Rename the existing visible `Rotation` control to `Rotate Y`; retain its `environment.rotation` target, 0–360° range, 90° default, and persisted values.
- Add `Rotate X` and `Rotate Z` sliders with −180–180° ranges and 0° defaults.
- Apply one XYZ Euler orientation to the scene environment, visible panorama, decoded dominant physical light, and stylized horizontal light direction.
- Keep the derived key light above the field after rotation so tilting an HDRI cannot place the primary directional light below the terrain.
- Translation controls are intentionally absent because an equirectangular image-based environment is infinitely distant and has no meaningful XYZ position.

## Control section inventory

- `Scene Environment`: unchanged source entity; Scene HDRI and Custom HDRI remain the two source controls.
- `Scene Lighting`: one image-based environment entity with Intensity, Rotate X, Rotate Y, Rotate Z, Visible HDRI, and conditional Background blur. All six controls affect the same retained lighting workflow.

The three angle values are direct-authored scalar settings. Built-in full-width sliders are a better fit than a Vector control because the product exposes three independent Euler axes, while `orientationGizmo` belongs to the visible field model and must not also own the environment.

## State and renderer mapping

- `environment.rotationX` → Euler X (pitch).
- Existing `environment.rotation` → Euler Y (yaw).
- `environment.rotationZ` → Euler Z (roll).
- `GrassSceneRenderer` stores one reusable `THREE.Euler` and copies it to `scene.environmentRotation` and `scene.backgroundRotation`.
- The HDR-derived `keyDirection` receives the same Euler before the bounded upward-light correction. The resulting XZ projection continues to feed both procedural grass shaders.
- Preview, PNG/JPG, and every video frame continue using the same retained scene renderer and settings object.

## Persistence, acceptance, and performance

- Keep persistence v6. Existing Y values are preserved; the two missing targets resolve through schema defaults at 0°.
- Extend the control inventory and acceptance rows with both axes. Existing product and browser scenarios are authored to exercise all three sliders when verification is next enabled.
- Add both targets to the existing live renderer-slider target set. They invalidate only `grass-scene-render` and `grass-dynamic-scene-render`, never environment decoding/PMREM filtering, layout, or retained scene resources.
- The change adds constant-cost Euler updates only; no workload boundary, derived magnitude, pass, allocation-heavy loop, or export format changes.
