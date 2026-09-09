# Modifiable Food Materials and Viscous Icing

## Product goal

Make the supplied Megascans donut material the visible surface basis while
keeping the donut and icing artistically editable. Every control in Donut
Material, Donut Surface, Icing Shape, Icing Flow, and Icing Material must
produce an obvious, bounded change in the rendered food. Replace the current
angular icing teeth with a continuous viscous-flow silhouette.

## Diagnosis

- The shader currently replaces 90% of the selected donut colour with the scan
  base colour, so the colour control has very little authority.
- Bake, pores, moisture, and variation alter narrow shader ranges that are
  difficult to perceive at the default camera and lighting.
- The icing drip displacement is multiplied by `exp(-v * 14)`. Almost all
  displacement is therefore confined to the first tube row, stretching the
  adjacent triangles into visible teeth.
- Existing browser acceptance observes persisted setting signatures. It does
  not independently require a material control to change real canvas pixels.

## Reference source

- `/Users/kusnizza/Desktop/Donut/`
- Base colour, normal, and roughness maps prepared at 2K under
  `public/donut-studio/materials/`
- The maps remain the texture-detail source. User colours tint normalized scan
  luminance instead of being replaced by the scan's baked brown hue.

## Visible output

### Donut

- Preserve scan pores, crust mottling, and roughness breakup.
- Make the selected colour the dominant hue.
- Bake visibly moves from pale dough through golden brown to a deeper toasted
  surface.
- Pores visibly scale micro-relief and cavity darkening.
- Moisture visibly moves from dry/matte to softly moist without glass-like
  transmission.
- Variation visibly changes broad and mid-frequency tonal breakup.
- Roughness, subsurface, softness, coat, and sheen remain independently
  adjustable and produce bounded physical-material changes.

### Icing

- Use the supplied maps for fine tonal and roughness detail without inheriting
  the donut's baked brown colour.
- Make the selected icing colour the dominant hue.
- Default to a soft, edible sugar-icing response rather than plastic.
- Roughness spans matte frosting to smoother icing.
- Glaze introduces a wet highlight by coordinating roughness and a modest
  clearcoat response without turning the icing into glass.
- Texture visibly scales scan/procedural relief.
- Shape thickness changes the visible coating shell.

### Viscous flow

- Add an explicit `icing.flow` slider.
- Move flow controls into a dedicated **Icing Flow** section:
  Flow, Drip length, Drip frequency, and Detail.
- Keep Include, Coverage, Thickness, and Clear in **Icing Shape**.
- Construct a deterministic periodic flow field from wide smooth lobes and
  low-frequency undulation.
- Blend displacement through several tube rows with smooth easing so each drip
  pulls a continuous patch of icing downward.
- Flow controls lobe width and relaxation; Drip length controls vertical reach;
  Drip frequency controls cadence; Detail adds bounded secondary breakup.
- Keep tessellation fixed and workload-bounded.

## Control section inventory

| Section | Product entity | Targets | Grouping reason |
| --- | --- | --- | --- |
| Donut Material | Dough optical response | existing `material.donut.*` optical targets | One physical dough material |
| Donut Surface | Scanned dough surface | bake, pores, moisture, variation | One supplied-scan surface treatment |
| Icing Shape | Coating shell | include, coverage, thickness, clear | Presence and bulk shell construction |
| Icing Flow | Coating edge flow | flow, drip amount, drip frequency, detail | Viscous boundary formation |
| Icing Material | Sugar coating optical response | colour and existing `material.icing.*` targets | One editable icing material |

Built-in sliders, switches, colour controls, and actions remain the correct
owners. No custom control is required. Panel state owns all edits; the canvas
continues to own orbit only.

## Renderer and performance decisions

- Keep the retained Three.js/WebGL renderer and current orbit interaction.
- Add `icing.flow` to the icing-geometry invalidation path.
- Keep fixed ring/tube tessellation; flow changes vertex positions, not vertex
  count, texture resolution, pass count, or workload envelope dimensions.
- Reuse the retained material and shader uniforms for material changes.
- No timeline or layers are introduced.
- Persistence and PNG export continue to consume the same runtime settings and
  retained scene.

## Acceptance

- Unit tests prove deterministic, finite geometry, fixed topology, smooth
  multi-row displacement, thickness response, and independent flow/length
  response.
- Material unit tests prove all optical controls update retained material or
  shader uniforms with meaningful ranges.
- Product browser tests compare actual canvas pixels after representative
  extreme changes for donut colour/surface and icing colour/material.
- Browser coverage proves `icing.flow`, thickness, and drip length change the
  rendered coating.
- Existing reset, persistence, orbit, and PNG export coverage remains valid.

## Verification tier

Verification tier: Tier 3

Reason: Custom shader response, procedural icing geometry, schema sections,
acceptance mapping, and canvas output change; runtime/template architecture and
dependencies do not.

Run: focused unit tests, focused product browser checks, then one bare
`npm run verify:delivery`; finish with `npm run dev` and real-browser visual
inspection.

Skip: measured performance and `npm run verify:perf`, because the request is a
functional/visual correction and does not authorize a performance iteration or
full audit.
