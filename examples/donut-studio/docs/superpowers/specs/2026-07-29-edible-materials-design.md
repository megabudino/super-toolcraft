# Donut Studio Edible Materials Design

## Goal

Replace the flat/plastic appearance of the donut and icing with a procedural
edible PBR treatment that remains live under every existing shape, color,
lighting, orbit, persistence, and still-export path.

## Product decisions

- Keep the exact Blender-derived Base and Plate geometry and the procedural
  icing/sprinkle geometry.
- Keep the current HDR environment, three authored area lights, ACES tone
  mapping, sRGB output, Toolcraft orbit, and shared preview/export scene.
- Extend `MeshPhysicalMaterial` with one deterministic object-space food shader.
  It combines low-frequency procedural variation with the user-supplied scanned
  BaseColor, Roughness, and Normal atlases through triplanar projection, because
  the Blender-derived Base has no UV attribute.
- Remove emissive as the subsurface approximation. Use bounded physical
  transmission/thickness plus subtle procedural surface response instead.
- Add a dough shader with baked color variation, pore dimples, moisture response,
  and organic roughness breakup.
- Add an icing shader with thickness-like color variation, microtexture, and a
  controlled glaze response.
- Keep sprinkles and plate physical, but retune them so the edible materials own
  the visual hierarchy.
- Prepare the supplied 4K scanned maps as bounded 2K runtime assets and retain a
  SHA-256 source manifest.
- Do not add a node editor, material-upload workflow, general texture library,
  layers, timeline, video export, or custom controls.

## Controls

### Donut Surface

- `material.donut.bake`: amount of browned low-frequency crust variation.
- `material.donut.pores`: strength of fine crumb/pore color and normal breakup.
- `material.donut.moisture`: softens roughness and increases bounded edible
  translucency.
- `material.donut.variation`: strength of organic color and roughness variation.

### Icing Material additions

- `material.icing.glaze`: wet clear highlight and bounded transmission.
- `material.icing.texture`: microtexture and soft marbling strength.

All controls are built-in continuous sliders, resettable, persistent, exported
through settings transfer, and classified as responsiveness controls. Existing
material sections and controls remain available.

## Renderer and export

- Procedural noise and scanned triplanar sampling are deterministic in object
  space, so they follow shape deformation and orbit without swimming.
- Shader uniforms update in place; geometry, environment, lights, and sprinkle
  instances remain retained.
- Preview and PNG/JPG export use the same material construction and shader
  uniforms.
- Shader detail is resolution-independent and the selected render-scale backing
  remains unchanged.

## Reference status

This is an explicitly approved visual enhancement over the supplied Blender
lookdev. Geometry, public Geometry Nodes behavior, material colors, light
defaults, and World defaults remain source-driven; the food surface response is
marked as intentionally changed by the user's request for more realistic,
appetizing materials and the supplied `/Users/kusnizza/Desktop/Donut/` scanned
PBR reference.

## Verification note

Verification tier: Tier 3

Reason: custom fragment shading, physical-material behavior, six schema targets,
preview pixels, and export pixels change while the runtime shell and workload
boundaries remain unchanged.

Run: code health, render-plan assessment, focused material/value/schema tests,
targeted product browser acceptance, visual browser inspection, then one bare
`npm run verify:delivery` and `npm run dev`.

Skip: measured performance and full performance certification because the user
requested a visual material feature, not a performance iteration or audit.
