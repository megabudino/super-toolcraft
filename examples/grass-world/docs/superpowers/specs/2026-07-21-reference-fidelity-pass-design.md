# Reference Fidelity Pass Design

## Goal

Move the Grass Studio reset scene materially closer to the supplied compact moss-island reference while preserving the existing editable layers, physical PBR workflow, downloaded Megascans textures, shared preview/export renderer, and Toolcraft shell.

## Visual reference study

Reference input: `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-9c7bd89c-963e-4b67-8d17-e8e8051baab0.png`.

Observed composition:

- The island occupies roughly four fifths of the frame width and a little over half of its height, with black negative space on every side.
- A tall rounded mass sits behind and slightly right of center. A lower broad mass sits left/front. A shallow bright passage separates them and leads into the composition.
- The base surface reads as continuous moss and low cushions. Individual short blades do not form a regular vertical grid.
- Long grass is concentrated on the crown and right face of the rear mass, plus four or five isolated foreground tufts. It never forms a single opaque wall.
- Rocks are sparse and partly embedded. Warm flower accents are tiny and subordinate.
- Lighting is a strong warm top/back key with a pale lime rim, deep emerald occlusion, and a nearly black background. Highlights describe the silhouette without flattening the base color.

Current live reset mismatch:

- The field fills too much of the viewport and reads as a broad, flat plate.
- The short lawn reads as evenly spaced upright pegs.
- Reconstructed Tufted Grass cards overlap into one large opaque cluster.
- Fine procedural terrain noise determines the silhouette instead of two deliberate macro masses and a connecting trough.
- Ground tint is washed toward white, weakening the scanned albedo and normal relief.

## Visible result

- The reset scene becomes a compact irregular island with clear black breathing room.
- Terrain uses two authored low-frequency mound lobes, a smaller shoulder, a shallow central path depression, restrained micro-noise, and a low perimeter.
- A deterministic stratum of flattened PBR moss cushions breaks the ground silhouette and makes the downloaded ground material visibly volumetric.
- The Lawn layer becomes fine, irregular, leaning cover rather than crossed upright pegs.
- Procedural Tall Grass becomes the primary long-strand layer. Its visibility is biased into several authored crown/tuft zones, with thin varied strands and gaps.
- Tufted Megascans become a small secondary accent reconstructed from fewer crossed cards and placed at restrained size.
- Warm back/rim light and contact-capable directional shadows strengthen depth while PMREM remains the image-based PBR environment.
- Preview, PNG, and video continue to render the same scene graph and materials.

## Product decisions

- No new controls or sections. Existing Terrain, Lawn, Tall Grass, Scan, Surface, Environment, Lighting, and Background controls remain the editable owners.
- The authored macro composition scales with Field width/depth and remains deterministic under seed changes. Terrain controls still set the total height range, noise detail, roughness, and offset.
- Moss cushions are terrain surface detail, not a reorderable document layer. They use the same ground PBR material and follow Terrain/Surface state.
- Layers remain disabled. The playback timeline remains available for optional wind/video, while the reset scene stays static with wind off.
- Persistence advances to `v4` so the new reference-fidelity reset state is visible instead of being masked by a saved v3 scene.
- The renderer remains retained Three.js WebGL. No quality-reducing render-scale or export changes are permitted.

## Renderer technique and performance model

- Ground: one displaced indexed plane, rebuilt only when field or terrain layout invalidates.
- Moss cushions: one low-segment hemisphere geometry in a single instanced draw, rebuilt with the ground layout. Count is fixed and bounded; it introduces no user-controlled workload dimension.
- Lawn and Tall Grass: existing instanced-buffer draw paths. Defaults and vertex shaping change, but schema workload bounds remain unchanged.
- Scans: existing bounded instanced meshes. Tufted reconstruction reduces crossed-card copies from five to three.
- Lighting: existing PMREM plus bounded hemisphere/key/rim lights; only the key/scans/cushions participate in directional shadowing to avoid a high-cardinality grass shadow pass.
- Resource lifecycle remains retained across frames and disposed with the scene.

## Control and state mapping

- Field / Terrain: compact field proportions and reference-shaped macro elevation plus editable micro-noise.
- Lawn Cover / Lawn Blade / Lawn Appearance: dense fine surface fuzz with single ribbons, randomized lean, muted deep-to-lime gradient, high roughness, and low sheen.
- Tall Grass / Placement / Blade / Appearance: thin long strands, crown-zone visibility, height variation, and sparse density.
- Tufted / Wild / Flowers / Rocks: small clustered accents with existing independent counts, size, clumping, seed, and surface offset.
- Surface: downloaded moss albedo/AO/roughness/DirectX normal map and stronger visible relief without whitening.
- Scene Environment / Lighting: hidden Sunrise PMREM with a warm back key and cool-green rim.
- View orientation: low three-quarter view framed around the two masses and central passage.

## Verification tier

Verification tier: Tier 3

Reason: The default state, persistence namespace, terrain evaluation, grass vertex shaping, scan reconstruction, ground/cushion geometry, physical lighting, shadows, and final pixels change. Runtime shell, panels, controls, export actions, and workload boundaries do not.

Run: `npm run ai:check`; typecheck; focused terrain/layout/material/default tests; affected renderer tests; build; focused browser acceptance for reset, PBR/HDRI, scans, viewport, PNG, and video parity; live visual screenshot comparison; impact-derived `npm run verify:delivery`; then `npm run dev`.

Skip: No explicit full performance refresh because the request is visual fidelity rather than performance work. The delivery runner may still require existing lifecycle proof according to its receipts.

## Acceptance

- Reset/default values select the compact v4 composition, Static/PBR, Wind Off, hidden Sunrise environment, and near-black background.
- The terrain sampler produces a higher rear/right crown, lower left/front mound, low perimeter, and central depression at deterministic probe points.
- Lawn blade geometry uses one ribbon by default and vertex lean follows each instance angle rather than one global world direction.
- Tall Grass layout contains visible instances inside authored crown/tuft zones and suppresses instances in the central passage and most low foreground cover.
- Moss cushions share ground texture, roughness, AO, normal map, and tint; they remain bounded and follow updated terrain height.
- Tufted scan reconstruction uses three crossed cards, its reset count/size is restrained, and all five scan families remain independently editable and non-empty.
- Directional shadow configuration is bounded, and PBR environment rotation/intensity still changes visible pixels.
- Reset preview and exports remain non-empty and use the same camera, terrain, vegetation, scans, lighting, and background decisions.
