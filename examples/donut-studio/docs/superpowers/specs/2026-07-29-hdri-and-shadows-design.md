# HDRI and Shadows Design

## Request

Add visible shadows and HDRI lighting to Donut Studio.

## Product Result

- The supplied `brown_photostudio_02_1k.hdr` remains the single retained image-based-lighting source.
- HDRI lighting is enabled by default; Strength at zero removes its contribution without rebuilding the scene.
- Users can optionally show the HDRI as a blurred studio backdrop. The backdrop follows the standard Background include switch, so disabling Background still produces a transparent preview/export.
- The donut, icing, sprinkles, and plate cast and receive shadows.
- A retained directional shadow light supplies the contact/directional shadow that Three.js area lights cannot cast.
- Shadows are enabled by default and expose independent Strength and Softness controls.

## Control Section Inventory

### Environment

- Entity: retained HDRI environment.
- Targets: `studio.hdriVisible`, `studio.environmentStrength`, `studio.environmentRotation`, `studio.environmentBlur`.
- Grouping reason: these settings all configure the same HDR lighting/backdrop source.
- Built-ins: a backdrop switch and sliders for strength, rotation, and blur.

### Shadows

- Entity: retained scene shadow rig.
- Targets: `studio.shadowsEnabled`, `studio.shadowStrength`, `studio.shadowSoftness`.
- Grouping reason: these settings configure one retained directional shadow map.
- Built-ins: switch plus two sliders.

Existing Key, Warm, and Cool Light sections remain unchanged. No custom controls are required.

## Renderer and State Mapping

- Schema values are read through `readDonutSettings`; reset, persistence, history, and settings transfer remain runtime-owned.
- Scene bootstrap loads and retains the HDR texture and one 2048² shadow map.
- Environment and shadow controls invalidate only `donut.preview-render`.
- `scene.environment` retains the supplied HDRI while Strength controls its contribution.
- `scene.background` uses the HDR texture only when HDRI backdrop and standard Background inclusion are both enabled.
- Preview and image export use the same scene path.
- No layers or timeline are added.

## Performance Assessment

- Reachable inputs: four Environment controls and three Shadows controls.
- Workload dimensions: none; the HDR texture and fixed 2048² shadow map do not change size through controls.
- Lifecycle: HDR texture, PMREM conversion, lights, and shadow map are retained for the scene lifetime and disposed with the scene/renderer.
- Frequency: control changes update retained scene/light properties and render one frame; they do not reload HDRI, rebuild geometry, or recreate the renderer.
- No protected kernel benchmark is required.

## Acceptance

- Environment and shadow controls persist and reset to defaults.
- HDRI strength, rotation, backdrop, and blur produce observable WebGL output changes.
- Shadow enable, strength, and softness produce observable WebGL output changes.
- Background off remains transparent even when HDRI backdrop is enabled.
- Export uses the same HDRI/shadow composition.
- No runtime console errors; the existing missing favicon response is unrelated product chrome.

## Verification

Verification tier: Tier 3

Reason: retained WebGL environment/background and shadow-rendering behavior changes, plus new schema controls and acceptance mappings.

Run: focused unit tests, focused browser acceptance for the seven targets, `pnpm ai:check`, `pnpm exec tsc --noEmit`, then one bare `npm run verify:delivery` and a live browser visual check.

Skip: measured performance and `npm run verify:perf`; the request is ordinary product work and does not authorize a performance iteration or full audit.
