# Blend Sunset HDRI design

Verification tier: Tier 3

Reason: the batch adds a bundled environment resource and a selectable scene-lighting source that changes final WebGL, preview, and export pixels without changing renderer passes, workload dimensions, schema limits, or default state.

Run: no automated test or delivery commands in this batch at the user's request. Keep the existing development server running so Vite can pick up the resource and source changes.

Skip: unit, browser, performance, build, and `verify:delivery` checks because the user explicitly asked not to run tests. This batch is implemented but does not claim a new protected delivery receipt.

## Goal

Import the HDRI referenced by `/Users/kusnizza/Desktop/hdri.blend` and expose it as another selectable scene environment in Grass Studio.

## Source and visible behavior

- The Blender file uses World `Sunset.001` with an Environment Texture node referencing the available BlenderKit file `sunset_4K_b087b0e6-5fd0-4672-93e6-113fa3142894.exr` at 9000×4500.
- Convert that EXR to the Radiance HDR format already decoded by the app, using a bounded 2K equirectangular copy for the retained browser resource.
- Generate a compact PNG picker preview from the same source.
- Expose the preset as `Blend Sunset` in the existing `Scene HDRI` image picker.
- Keep `Hard Sun` as the reset preset. Keep the existing Intensity, Rotation, Visible HDRI, and Background blur behavior.

## Control section inventory

- `Scene Environment`: existing environment-source entity; `environment.preset` gains one image-picker item and `environment.hdriFile` remains the custom Radiance HDR override.
- `Scene Lighting`: unchanged workflow stage; `environment.intensity`, `environment.rotation`, `environment.visible`, and `environment.backgroundBlur` continue to affect the selected bundled or custom environment.

No new section, control type, action, timeline, layer, persistence key, export path, or custom runtime surface is required.

## State and renderer mapping

- `environment.preset = blendSunset` resolves to the bundled converted HDR with cache key `preset:blendSunset`.
- The existing source-keyed environment resource pass decodes the HDR, derives ambient and dominant-light data, and creates the retained PMREM.
- The existing lighting controls and `GrassSceneRenderer` apply the source consistently to preview, PNG/JPG export, and video frames.
- The preset uses neutral lighting tuning; the reference-specific `Hard Sun` tuning remains exclusive to `hardSun`.

## Acceptance and performance

- Acceptance metadata and authored test expectations list all eight bundled choices so a future protected run remains aligned.
- The new source uses the existing `environment-resource` lifecycle and invalidates the same two final-render passes. It adds no workload dimension, renderer pass, animation work, or per-frame allocation.
- Automated proof is intentionally deferred in this batch at the user's request.
