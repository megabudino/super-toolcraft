# Independent Layer Distribution Maps Design

## Goal

Repair the spatial-distribution contract so every visible layer control owns the layer named by its section. Tall Grass keeps its existing procedural map as the authoritative Tall mask. Lawn gains a separate editable procedural map. Scanned vegetation, flowers, rocks, and the boulder stop consuming hidden derivatives of the Tall map and obey their own Count, Clumping, and Seed controls.

## Diagnosed Failure

- `field.distribution.*` currently renders raw Voronoi noise in the control preview, then the scene applies a hidden world topology and macro pattern.
- The same Tall settings are transformed into derived masks for Lawn, Tufted, Wild, White Flowers, Yellow Flowers, Small Rocks, and the boulder.
- Tall and Lawn placement can refill rejected candidates from a larger pool, weakening visible mask edits.
- Scan Count is applied before a hidden coverage filter, so the final instance count can be far below the authored Count.

This makes the controls technically connected but semantically misleading.

## Product Behavior

### Tall Grass

- `field.distributionOffset`, Scale, Detail, Roughness, Seed, and Black / white directly define final Tall coverage.
- The preview and CPU placement evaluate the same Voronoi function and the same endpoint handling.
- Density remains a maximum/candidate budget; the map may reduce the accepted Tall count.
- Rejected candidates are not replaced from a larger hidden pool.
- Tall map edits do not move Lawn, scans, flowers, rocks, or the boulder.

### Lawn

Add one new `Lawn Distribution` section containing:

- `lawn.distributionOffset` — existing `grassNoisePreview` custom map interaction;
- `lawn.distributionScale` — built-in slider;
- `lawn.distributionDetail` — built-in workload slider;
- `lawn.distributionRoughness` — built-in slider;
- `lawn.distributionSeed` — built-in slider;
- `lawn.distributionLevels` — built-in range slider.

The map is authoritative for Lawn only. Default Black / white is `[0, 1]`: the narrow valid range keeps the initial carpet effectively full while respecting the runtime rule that range-slider defaults use distinct handles. Users can still set `[0, 0]` for the explicit full-white endpoint.

### Scanned Layers And Boulder

- Tufted, Wild, White Flowers, Yellow Flowers, and Small Rocks use only their own Count, Clumping, Seed, Size, and field/terrain boundaries.
- Count is the actual retained instance count whenever Count is non-zero and the layer is visible.
- Footprint repair moves an invalid clumped point inward or falls back to its valid base point instead of silently deleting the item.
- The boulder Seed chooses one deterministic footprint-safe point without a hidden Tall/world mask.
- Global Scene Randomize may still author each visible control, but no hidden topology remains active after generation.

### Terrain And Surface PBR

- Terrain height preview and geometry remain unchanged because they already share the same value-noise, level remap, and perimeter envelope.
- Clover Surface preview and shader remain unchanged because they already share `grassCloverEvaluateMask`.
- PBR BaseColor, Normal, Roughness, and AO texture-mask behavior remains unchanged and independent from placement masks.

## Control Selection Inventory

Product need: Lawn spatial map with direct manipulation and procedural tuning.

Value model: Stable two-axis offset plus bounded scalar noise parameters and an ordered black/white range.

Candidate built-ins checked: `vector`, sliders, `rangeSlider`, image picker, curves, and the existing `grassNoisePreview` custom control.

Best fit: Reuse `grassNoisePreview` for direct spatial-map manipulation; use built-in sliders and `rangeSlider` for every numeric parameter.

Why custom preview remains necessary: Built-ins can edit the offset numerically but cannot show and directly drag the generated map that controls final growth. The existing custom control already supplies that visualization and interaction without duplicating scalar controls.

Rejected alternatives: A second hidden mask; sharing Tall controls; six custom controls; an uploaded bitmap; a generic vector without preview; applying topology only in the renderer; or adding independent maps to every scan layer in this batch.

Targets: `lawn.distributionOffset`, `lawn.distributionScale`, `lawn.distributionDetail`, `lawn.distributionRoughness`, `lawn.distributionSeed`, and `lawn.distributionLevels`.

Renderer/export mapping: Runtime values are read into `settings.lawn.distribution`; preview and final CPU placement consume the same settings; retained Lawn layout rebuilds; preview and export reuse the same layout semantics.

Acceptance coverage: Real map drag, both range-slider parts, scalar controls, conditional visibility, Lawn-only output change, Tall isolation, reload-safe defaults, and final scan count equality.

## Control Section Inventory Change

- `Lawn Cover`: visibility, density maximum, minimum spacing, root offset, base placement seed.
- `Lawn Distribution`: Lawn-only live map, scale, detail, roughness, mask seed, black/white levels.
- `Lawn Blade`: unchanged geometry.
- `Tall Grass Distribution`: existing controls, now direct and Tall-only.
- Scan sections: unchanged visible controls, corrected Count/Clumping/Seed semantics.

## State And Renderer Mapping

1. Schema controls persist through the existing localStorage policy and settings transfer.
2. `readGrassSettings` normalizes Tall and Lawn distribution settings independently.
3. The custom preview selects Terrain, Tall, Lawn, or Clover from its target.
4. Tall and Lawn build one deterministic base candidate set at their authored density maximum, then filter that set once with their own map.
5. Scan layouts retain exactly Count footprint-safe transforms and do not read either grass map.
6. Renderer invalidation narrows Tall map edits to Tall layout and Lawn map edits to Lawn layout; scans no longer rebuild for either map.

## Performance Plan

- Reachable new workload input: `lawn.distributionDetail`, bounded 1–6 octaves.
- New workload dimension: Lawn distribution octaves, consumed only by Lawn layout and the fixed-size noise preview.
- Pass costs: Tall map edits no longer rebuild Lawn and five scan layouts; Lawn map edits rebuild only Lawn plus preview; scan placement removes coverage sampling but adds bounded footprint repair.
- Lifecycle: no new GPU resource, texture, draw call, shader pass, animation work, or export pass.
- Render-plan assessment: existing CPU/WebGL techniques remain suitable; no kernel benchmark candidate is introduced.
- Performance impact inventory must assign changed layout/preview modules only to their exact existing passes.

## Verification Tier

Verification tier: Tier 3.

Reason: The batch adds persisted schema controls and changes CPU layout semantics, renderer invalidation, visible counts, and preview/output agreement across multiple retained scene layers.

Run: Focused red/green distribution, scan-layout, schema, acceptance, performance-config, and TypeScript checks; targeted Tall/Lawn/scan browser scenarios; exact affected performance path only if the impact-derived configuration requires it; one protected delivery invocation at the completed batch boundary.

Skip: No explicit full performance refresh because the request is correctness and control ownership, not performance optimization; unrelated lighting, materials, wind, export formats, and navigation suites are not development-loop checks.

## Acceptance Criteria

- Tall preview pixels and Tall layout respond to the same map settings.
- A Tall map edit leaves Lawn and every scan layout signature unchanged.
- Lawn exposes its own visible map section and a map drag changes Lawn output only.
- Lawn `[0,0]` yields full coverage; `[1,1]` yields zero coverage; both range parts work.
- Each enabled scan layer reports actual count equal to its Count control.
- Changing one scan Clumping or Seed changes only that scan layout.
- Boulder Seed changes one footprint-safe boulder position without reading Tall or Lawn maps.
- Terrain and Clover mask behavior remain unchanged.
- Reset restores Tall and Lawn defaults, and older persisted settings without Lawn targets safely receive Lawn defaults.
