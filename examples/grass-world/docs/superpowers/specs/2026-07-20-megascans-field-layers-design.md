# Megascans Field Layers Design

Date: 2026-07-20
Mode: approved through the user's explicit implementation request

## Goal

Add the supplied Quixel Megascans as retained physical layers beneath and among the existing procedural Lawn Cover and Tall Grass. The result must remain editable through Toolcraft controls, use the same terrain, camera, HDRI, PBR lighting, preview, PNG export, and video export, and remain bounded for browser rendering.

## Source inventory

The user supplied these archives in `/Users/kusnizza/Desktop/scans/`:

- `Mossy Forest Floor 4K.zip`: tileable ground PBR maps.
- `Tufted Grass.zip`: five FBX variants with LOD0-LOD2 and a shared 4K atlas.
- `Wild Grass.zip`: eight FBX variants with LOD0-LOD3 and a shared 4K atlas.
- `White Everlasting.zip`: eight FBX variants with LOD0-LOD3 and a shared 4K atlas.
- `Yellow Flower.zip`: eight FBX variants with LOD0-LOD3 and a shared 4K atlas.
- `Small Rocks Pack.zip`: one FBX pack with shared 4K PBR maps.
- `Small Rocks Pack 4K.zip`: duplicate valid download; the complete `Small Rocks Pack.zip` is the canonical source.

## Chosen approach

Use a hybrid retained WebGL renderer:

1. Keep the existing procedural Lawn Cover and Tall Grass unchanged as the primary animated field.
2. Apply the Mossy Forest Floor Base Color, Normal, Roughness, and AO maps to the existing procedural terrain geometry. Do not use source displacement because the app's terrain noise already owns visible terrain shape.
3. Preprocess selected LOD2 plant variants into product-owned geometry assets and use instanced meshes for each scanned plant layer.
4. Extract several independent rock variants from the rock pack and instance those on the same terrain.
5. Use one retained material/texture set per scan family, one retained layout per scan layer, and deterministic seeded placement.

Rejected alternatives:

- Runtime LOD0 FBX loading: source decode and triangle cost are unnecessary for the camera range and 4K output.
- A single prebuilt meadow mesh: it would not follow the editable terrain and would prevent per-layer count controls.
- Texture-only flowers and tufts: acceptable for distant backgrounds but too flat for the user-provided close meadow reference.
- Source displacement on the ground: it would double-author terrain height and cause grass roots to intersect or float.

## Product layers and controls

### Mossy Ground

- `field.showGround`: existing Include/visibility owner.
- `surface.textureScale`: texture repeats per metre, bounded for stable sampling.
- `surface.normalStrength`: normal-map contribution.
- `surface.roughness`: multiplier applied to the scanned roughness map.
- `appearance.groundColor`: existing tint owner.

### Tufted Grass and Wild Grass

Each layer owns:

- `enabled`: Include switch.
- `count`: bounded workload slider.
- `sizeRange`: minimum/maximum instance scale.
- `clumping`: deterministic bias toward shared terrain regions.
- `seed`: deterministic placement and variant selection.
- `surfaceOffset`: root lift/sink for terrain contact.

Count defaults and ceilings are 90/400 for Tufted Grass and 140/600 for Wild Grass.

### White Flowers and Yellow Flowers

Each layer owns the same six controls. Flower defaults use lower counts, smaller scales, and stronger clumping than grass tufts so flowers appear in sparse patches rather than uniform noise.

Count defaults and ceilings are 55/240 for White Flowers and 45/200 for Yellow Flowers.

### Small Rocks

The layer uses Include, Count, Size range, Clumping, Seed, and Surface offset. The count ceiling is intentionally much lower than plant ceilings.

The rock count default and ceiling are 12/60.

All sections remain within the normal two-to-seven-control Toolcraft section size. Built-in `switch`, `slider`, and `rangeSlider` controls cover every value model; no custom controls are added.

## State and renderer flow

Schema values are parsed into `GrassSettings`. Each scan layer receives a stable layout key from its field extent, terrain settings, count, size range, clumping, seed, and offset. A scan resource pass retains decoded geometry and textures. A scan layout pass rebuilds only the layer whose placement inputs changed. Material-only changes update retained textures/material parameters without rebuilding placements.

All layouts sample the existing terrain height and slope. Plants remain vertical with limited normal alignment so flowers do not lie flat on steep terrain; rocks align more strongly to the terrain normal. Deterministic low-discrepancy placement avoids visible grids. Clumping modulates acceptance through seeded coarse noise while the requested count remains a hard cap.

Static PBR uses the same PMREM-filtered HDRI as procedural grass. Non-PBR/dynamic preview uses the existing direct light group, while scanned materials remain physically based. Scanned layers are static during wind playback in this batch; the existing procedural Tall Grass continues to own animation.

## Asset policy

Only derived runtime assets required by the product are copied under `src/app/grass/assets/scans/`; source archives remain outside the repository. Plant geometry uses selected LOD2 variants. Textures are resized/compressed for browser delivery while preserving Base Color, Normal, Roughness, AO, and Opacity where applicable. Gloss, Specular, Bump, Displacement, Cavity, billboard, and duplicate maps are omitted from the runtime bundle.

Asset loading is asynchronous and retained. Preview shows the existing field while scans prepare, then renders the complete scene. Export awaits scan preparation before rendering the first frame. A failed scan resource is isolated to its layer and reported in the console; the procedural field and other scan layers continue rendering.

## Performance plan

Reachable workload controls are the five scan-layer Count sliders. Each maps to one bounded workload dimension. Scan decode is a discrete retained source pass. Each layer has an interaction-frequency layout pass and contributes to the shared frame/export render passes. Count, field extent, terrain, clumping, seed, size range, and offset invalidate placement; material settings invalidate render only.

The declared count ceilings are hard renderer limits as well as schema maxima. Dynamic preview uses bounded prefixes of the same deterministic layouts rather than rebuilding lower-quality layouts. Viewport pan/zoom must not recreate scan resources or layouts.

Verification tier: Tier 3

Reason: new retained scan resources, instanced renderer layers, workload controls, terrain material maps, and PNG/video output.

Run during development:

- `npm run ai:check`
- targeted Vitest coverage for settings, deterministic layouts, and control/output mapping
- targeted Playwright coverage for layer controls, PBR pixels, reload persistence, PNG, and video inclusion
- affected canonical performance scenarios for scan counts, scene render, export, and viewport stability

Delivery:

- one impact-derived `npm run verify:delivery` invocation with exact selectors required by the updated impact inventory
- `npm run dev` and a final browser visual check

## Acceptance result

The delivery is accepted when each scan layer can be independently included, counted, scaled, clustered, reseeded, and seated on the terrain; the ground displays the mossy PBR maps; reload restores settings; Static PBR shares HDRI response with procedural grass; and preview, PNG, and every video frame contain the same enabled scan layers at the requested canvas/export dimensions.
