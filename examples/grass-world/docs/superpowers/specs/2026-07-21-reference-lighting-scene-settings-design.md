# Reference Lighting Scene Settings Design

## Goal

Rebuild the supplied mossy grass island reference as closely as the current Grass Studio controls allow, with priority on lighting direction, shadow depth, highlight color, and the relationship between the dense short carpet and the long rim-lit grass.

The result is an importable settings preset based on the user's current `grass-studio-settings.json`. This batch does not add controls, change renderer code, alter workload boundaries, or replace the user's existing settings file.

## Reference study

Reference: `/var/folders/59/s44c8y816ss64d4trvkqybsm0000gn/T/codex-clipboard-ef0e5d7a-2162-4b51-b130-b3755d35c1a8.png`.

Visible lighting structure:

- a black studio background isolates one low, irregular terrain island;
- the dominant key arrives from above and behind the upper-left/center of the subject, producing pale yellow-green rim light on the longest grass;
- the opposite fill is weak and cool, preserving deep emerald cavities between the two terrain masses;
- highlights are concentrated on upward-facing crowns and long blade tips rather than distributed evenly across the field;
- the lower foreground remains darker and less saturated than the upper crowns;
- the subject keeps a wide tonal range: near-black background, dark green internal shadows, medium moss green cover, and narrow near-straw highlights.

Measured reference characteristics:

- subject bounding box: approximately `102,141` to `1991,1081` in a `2182x1252` image;
- subject median luminance: approximately `0.43`;
- approximately `15%` of subject pixels exceed `0.75` luminance while approximately `11%` fall below `0.15`;
- average shadow RGB is approximately `(0.06, 0.13, 0.06)`;
- average highlight RGB is approximately `(0.79, 0.82, 0.48)`;
- highlight energy is centered near the horizontal middle and upper half of the terrain, while the bottom band is materially darker.

## Approaches considered

### Existing-settings preset — selected

Tune the supplied settings through existing schema targets, save a separate importable JSON file, import it into the running app, and iterate against browser screenshots. This is the smallest reversible change and directly satisfies the request to work within current settings.

### Change application defaults — rejected

Changing `grass-defaults.ts` would make the reference scene the reset state for every user and would require persistence/version, acceptance, and delivery changes. The user requested a scene in the current controls, not a new application baseline.

### Add a lighting preset or new renderer feature — rejected

A dedicated reference preset, extra light, volumetric scattering, or distribution-mask feature could improve fidelity, but would expand scope beyond the current settings and make it harder to separate tuning quality from renderer changes.

## Scene design

### Composition and camera

- Preserve the compact `7m x 5m` field and the existing two-mass authored terrain composition.
- Use a low three-quarter camera with the main rear crown near the upper center and the smaller front-left mound clearly separated by a dark trough.
- Keep the black included background and hide the HDRI image while retaining HDRI illumination.
- Keep wind disabled so visual comparison is deterministic.

### Vegetation hierarchy

- Lawn Cover forms the continuous moss-like carpet across the island at the current maximum authored density and maximum equivalent live-preview budget.
- Tall Grass uses the existing authored crown/tuft zones at maximum authored density and maximum detailed live-preview budget. Blades stay thin, long, and slightly varied so the backlit silhouette reads as hair rather than broad ribbons.
- Tufted and Wild scan layers create a restrained middle scale around the mound edges and foreground.
- Flowers remain rare warm accents; rocks remain sparse cool-gray anchors; the boulder stays disabled.
- Solo values are cleared so enabled-state composition, rather than temporary isolation, controls the scene.

### Lighting and tone

- Use the hidden Sunrise environment as the physical base because it already supplies a warm directional profile.
- Rotate the environment so the key grazes the upper crowns from the rear-left/upper-center relative to the camera.
- Use a pale warm key rather than saturated orange. The key is strong enough to create near-straw tips but is balanced below clipping.
- Use a weak deep teal-green fill so cavities retain readable detail without becoming gray.
- Use a moderate pale green-yellow rim from the opposite side to separate the right silhouette from black.
- Increase scene contrast, keep saturation controlled, add moderate highlight warmth, and preserve cool shadow bias.
- Use one broad, soft sun-patch pattern to concentrate light on the crown and central path instead of producing many small bright islands.

### Material color

- Tall Grass transitions from deep forest root through yellow-green middle to pale straw-green tip, with a restrained three-color instance palette.
- Lawn stays darker and slightly cooler than Tall Grass so long blades remain the brightest vegetation layer.
- Surface tint stays dark moss green; physical texture, normal, roughness, and AO remain fully applied.
- Texture masks stay in the full-texture endpoint because this batch tunes the look rather than changing mask semantics.

## State and deliverables

- Input base: `/Users/kusnizza/Downloads/grass-studio-settings.json`.
- New preset: `/Users/kusnizza/Downloads/grass-studio-reference-lighting-settings.json`.
- The original settings file remains unchanged.
- The new preset preserves Toolcraft settings metadata, canvas size, timeline, export settings, and every unrelated supported target.
- The preset is imported into the running Grass Studio instance so the current local scene shows the tuned result.

## Verification

Verification tier: Tier 3

Reason: The delivered state materially changes custom WebGL output, visible workload values, lighting, camera, terrain, and vegetation composition, but does not modify renderer code, schema boundaries, or exported application source.

Run: Validate the JSON, import it through the real settings flow, inspect the resulting WebGL scene in the browser, confirm the black background and enabled layers, capture comparison screenshots, and verify there are no WebGL shader errors.

Skip: Do not run protected delivery or performance suites because product source and performance boundaries are unchanged; the user requested visual scene tuning rather than renderer optimization.

## Acceptance

- The current app loads the new preset without schema/import errors.
- The HDRI remains hidden against a black background while still lighting the scene.
- The strongest illumination reads as a warm upper/rear key with bright rim-lit long blades.
- Inner terrain cavities remain deep cool green rather than flat black or bright ambient green.
- Lawn creates continuous cover; Tall Grass creates a dense long-blade crown; scans remain secondary.
- The foreground is darker than the upper crown and the scene avoids uniform neon-green illumination.
- A browser screenshot has the same broad perceptual hierarchy as the reference: black isolation, two terrain masses, luminous upper grass, dense carpet, and sparse rocks/accents.

## Known limit

Current Tall Grass placement is constrained by the fixed authored crown/tuft visibility mask, and live preview has separate Tall/Lawn budgets. This preset raises both preview budgets to their current schema maxima but does not change those renderer rules.
