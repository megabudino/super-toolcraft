# Diverse, scene-relative world generator

Status: implemented and locally verified — protected delivery receipt blocked by one signed clean-home skill fixture

Verification tier: Tier 3

Reason: Randomize changes Terrain and the real instance layouts for Tall, Lawn, five scan layers, and the boulder. It preserves renderer technique, workload ceilings, field dimensions, authored lighting/material treatment, wind, exports, timeline, and canvas behavior.

Run: AI/code-health, TypeScript, focused generator/coverage/layout/schema tests, production build, the exact scene-randomizer browser scenario, affected impact-derived verification, and one `npm run verify:delivery` invocation at the delivery boundary.

Skip: No explicit full performance refresh. This changes generated composition, not renderer optimization or workload ceilings.

Delivery outcome: the sandboxed `npm run verify:delivery` invocation passed integrity, local docs, code health, product boundary, and 140/143 signed Node tests, then stopped before product Vitest on one clean-home skill assertion plus sandbox-denied IPv6/IPv4 listener fixtures. The required elevated-network retry proved both port fixtures pass and reached 142/143; only the signed clean-home skill fixture remains because it receives empty stderr instead of its expected fallback message. Product-focused Vitest, TypeScript, production build, controlled Chromium, and the exact Playwright acceptance all pass; no signed framework file was changed to bypass that infrastructure failure and no delivery receipt was minted.

## Ground-only color and macro-pattern correction

### Reproduced root cause

- The 197,568 numeric identities currently collapse to only seven coverage topologies. `GRASS_WORLD_STEP % 7 === 4`, so Randomize walks the same seven topology families in a fixed order and returns to the first family on click eight.
- Six families are ultimately concentrated with the same `max()` union of random ellipses. Seed changes move those ellipses but do not change the composition grammar. A 15×15 coarse diagnostic measured about 60% mean agreement for worlds sharing a topology and up to 88% agreement for individual pairs.
- Several supposedly different families produce mostly low coverage, so their coarse masks are visually dominated by the same empty-field silhouette.
- `appearance.groundColor` is currently only the material fallback. With the default full PBR texture mask, the ground and Clover base-color textures replace that fallback completely, so randomizing this value alone has no visible effect on textured earth.

### Corrected visible behavior

- Add an independent catalog of 16 named macro-pattern grammars. The catalog includes broad cover, central island/clearing, paired lobes, opposing corners, diagonal and cross chains, full and broken rings, a crescent, winding and parallel bands, archipelago, corridor, fragmented pockets, and ridge-with-clearing.
- Select the macro pattern with `worldId % 16`. Because `GRASS_WORLD_STEP % 16 === 3` and 3 is coprime to 16, the first 16 Randomize clicks visit all 16 grammars exactly once. The same topology/pattern pair cannot recur before 112 clicks, while hashed offsets, rotation, aspect, and falloff keep later uses from being exact copies.
- Topology remains the micro/noise relationship. Macro pattern becomes a separate compositional layer with shared world anchors and only small per-channel jitter, so Tall, Lawn, scans, and rocks belong to one coherent spatial composition.
- Macro masks range from broad cover through low-density exterior to exact clearings around dense cores. Concentrated worlds therefore form visible groups, while bounded candidate pools and non-empty fallbacks keep every enabled layer present.
- Randomize owns exactly one color target: `appearance.groundColor`. Tall and Lawn gradients/instance colors plus every scan and boulder tint remain byte-equal to the scene that started the sequence.
- Ground colors use a reversible, deterministic set of natural hue offsets around the authored Ground color. The panel-action adapter keeps an exact per-app marker containing the prior world id, generated Ground, and authored Ground reference. An unchanged generated color recovers that reference without drift; a manual Ground edit breaks the exact match and becomes the new baseline.
- The retained ground shader applies Ground color as a luminance-preserving tint to both PBR ground and Clover albedo after their mask blend. Normal, roughness, AO, brightness/contrast controls, lighting, shadows, HDRI, and texture detail remain unchanged.

### Files and proof

- Product modules: `grass-world-patterns.ts`, `grass-world-topologies.ts`, `grass-world-coverage.ts`, `grass-world-colors.ts`, `grass-ground-blend-material.ts`, `grass-scan-resource.ts`, generator/randomizer wiring, and the performance impact inventory.
- Product metadata: Randomize description, readiness/acceptance rows, this plan, and the product worklog.
- Unit proof: all 16 pattern ids appear once in 16 consecutive worlds; 112 consecutive worlds have unique topology/pattern pairs and real Tall, Lawn, scan, and boulder geometry; 24 coarse Tall masks pass translation-tolerant area/component/perimeter descriptors; only Ground color appears in the generated color patch; the other 14 layer colors remain exact across a long sequence; manual Ground re-anchors the following 48-world sequence without drift.
- Browser proof: the exact Scene Randomizer scenario observes changed terrain/layout signatures and changed Ground color while the complete fixed layer palette, lighting, HDRI, PBR response, masks, fade, wind, view, quality, and export settings remain unchanged.

## Clustering and layer-color correction

### Visible behavior

- Generated worlds must include materially different grass concentration profiles, not only different noise seeds: broad cover, soft groups, bands/ridges, compact islands, fragmented groups, and sparse high-density clumps.
- A fixed, deterministic cluster profile belongs to each coverage topology. Strong profiles create several compact elliptical eligibility fields inside the authored field shape; broad profiles keep the current dispersed behavior.
- Tall and Lawn retain deterministic minimum-spacing candidates and mask filtering. Clustering changes where candidates survive rather than collapsing roots onto one point or violating the authored spacing contract.
- Existing scan `Clumping` remains an additional coordinate-level transform and must continue to produce a lower nearest-neighbor distance at high values.
- Randomize may vary only Ground color. Tall/Lawn gradients and instance palettes plus all scan and boulder tints stay exact.
- Ground color derives reversibly from the scene that began the generated sequence through bounded natural hue, saturation, and lightness offsets.
- Environment/HDRI, key/fill/rim colors and strengths, exposure, Sun Patches, global Color Grade, background, PBR response, texture masks, shadow colors, fade, wind, view, quality, and export settings remain unchanged.
- Color recovery uses an exact per-app marker rather than guessing from structural values: world id and generated Ground must both match before the authored Ground reference is reused. A manual edit is therefore promoted to the next baseline instead of being inverse-transformed as generated output.

### Control and runtime inventory

- Controls: keep the existing `Scene Randomizer` section and its single built-in `actions` control. No clumping or palette control is added in this batch.
- State/persistence: generated colors write the existing Ground schema target through `controls.setValue`. The non-persisted marker is isolated per mounted app through `WeakMap<dispatch, marker>` and Scratch clears only that app's marker. Reload/import intentionally treats the visible current Ground as a new scene baseline; no hidden value is added to exported settings.
- Renderer: keep the canonical retained WebGL pipeline. Color changes invalidate existing material/render inputs; clustering rebuilds only existing bounded Tall/Lawn/scan layouts.
- Timeline, layers, media, export, canvas sizing, and panel layout are unchanged.

### Performance model

- Reachable input remains the explicit Randomize action and persisted `field.seed`; density/count/detail schema boundaries are unchanged.
- Cluster-center count is a fixed catalog constant with a small hard maximum, not a new workload control.
- Affected passes remain `grass-layout-build`, `grass-lawn-layout-build`, and five scan layout builds. Each candidate evaluates the existing bounded noise plus a fixed number of analytic cluster falloffs; lifecycle, cache keys, execution location, draw calls, geometry limits, and export work are unchanged.
- No new renderer technique or kernel candidate is introduced. Development uses focused layout tests and the exact randomizer browser scenario; delivery uses impact-derived Tier-3 verification without a full performance refresh.

### Acceptance additions

- Sampling a representative identity set produces both dispersed and strongly concentrated Tall/Lawn layouts with a quantitative gap in empty-cell ratio and concentration score.
- Consecutive browser generations publish distinct layout/mask/clumping signatures and include visibly compact variants, while every enabled layer remains non-empty.
- A generated sequence produces several distinct natural Ground colors; an unchanged generated sequence recovers the starting Ground exactly, while a manual Ground edit becomes the exact new reference for subsequent worlds.
- Browser acceptance proves Ground color changes while every other layer color, environment, lighting, global grade, material response, background, wind, fade, quality, view, and export signatures remain equal to the starting scene.

## Product contract

- `Randomize` always derives the next variation from the current scene's `field.seed`; there is no Global scope or global toggle.
- The deterministic cycle contains 197,568 identities. A generated identity cannot repeat before wrap.
- Consecutive identities change coverage topology and at least four of six qualitative axes.
- The generator changes spatial composition plus the bounded Ground color owned below: relief, field silhouette, grass dimensions, quantities, spacing, seeds, clumping, scan sizes/offsets, correlated distribution, and Ground tint.
- Field width and depth stay byte-equal.
- Terrain height and every generated object size share one world-scale axis in the range `0.75...1.25` relative to the scene that started the randomization sequence. Repeated clicks recover that reference instead of multiplying the previous generated result, so scale cannot drift.
- Organic field-relative ceilings override the 25% envelope only when an imported/source scene is already physically implausible: terrain, Tall/Lawn height, scan assets, and the boulder are capped against the fixed field footprint. Ordered ranges keep their authored proportions.
- Lighting, HDRI, background, color grade, Sun Patches, PBR response, texture masks, Surface/Clover material blend, receive-shadows choice, shadow colors, Surface Fade, Tall/Lawn colors, scan tints, and boulder tint stay byte-equal. Only Ground color receives bounded natural variation.
- Wind, surface tilt, audio, view orientation, preview quality, geometry quality, export settings, timeline, media, and editor state stay byte-equal.
- Ground, Tall, Lawn, Tufted, Wild, White Flowers, Yellow Flowers, Small Rocks, and the boulder are always enabled after generation.
- Every enabled generated layer has real geometry after coverage filtering. The boulder searches deterministic eligible candidates and falls back to the highest-coverage candidate so its enabled state cannot render empty.
- Black/white distribution remains eligibility rather than priority-plus-refill: Tall, Lawn, and scan candidates are deterministically filtered by coverage.
- The same settings and identity produce the same spatial patch and coordinates on another machine. Ground variation is deterministic from the visible current Ground; reload/import intentionally starts a new Ground sequence from that visible value.

## Explicit target ownership

`grass-world-generator.ts` exports two exhaustive inventories whose union equals every current key in `grassDefaults`:

### Generated spatial and Ground-color targets

- Terrain noise/detail/levels/max height/offset/roughness/seed.
- Field edge shape, Tall distribution noise, density, spacing, alignment, random rotation, top-facing placement, and canonical world seed.
- Tall and Lawn heights, thickness, taper, tilt, offsets, density/spacing, and secondary seeds.
- Scan counts, sizes, clumping, offsets, seeds, and visibility.
- Boulder size, offset, seed, and visibility.
- Ground color only. Tall/Lawn gradients and instance colors plus Tufted, Wild, White, Yellow, Small Rocks, and boulder tints are preserved.
- Visibility for Ground, Tall, Lawn, every scan family, and boulder is forced `true`.

### Preserved targets

- Every `environment.*` target and `scene.background`.
- Every Tall/Lawn/scan/boulder color and every non-literal material-response target under Appearance, Lawn appearance, Surface, and scan PBR/color treatment; all contrast/saturation controls, roughness, sheen, brightness, normals, AO, backlight, shadow colors, texture masks, Clover blend mask, and Surface Fade.
- `field.width`, `field.depth`, geometry-quality controls, `preview.*`, `wind.*`, `view.orientation`, and `export.*`.
- All other app/editor/runtime state outside `grassDefaults`.

Adding a future setting without classifying it fails the exhaustive partition test. Writing any preserved target fails compiler coverage.

## Identity and coherent variation

- Keep `field.seed` as the canonical persisted identity in `0...197567`.
- Advance with `(currentId + 12163) % 197568`; the step is coprime to the world count.
- Decode mixed-radix axes for coverage topology, terrain morphology, vegetation balance, feature composition, scale variation, and abundance variation.
- Use named deterministic hash channels, never `Math.random`.
- Couple dependent values: density with spacing/abundance, terrain height with scale/detail/roughness, scan count with clumping, and terrain/object dimensions with one shared non-accumulating scale axis.
- The scale and abundance axes replace the earlier palette and material axes; only the reversible Ground tint is generator-owned.
- Detect whether the current values are the previous compiler output using a multi-target structural marker (terrain/distribution/layer seeds and placement values). On the first click, capture sizes from the authored current scene; on later clicks, divide the previous output by its known world scale before compiling the next world. This keeps the implementation deterministic and persistence-safe without hidden React/module state.

## Coverage and layouts

- Build one deterministic base candidate set from requested capacity and minimum spacing.
- Filter the base set once by coverage without refill.
- Tall uses the editable distribution noise, one of seven micro-topology transforms, and one of 16 independent macro-pattern grammars instead of treating seed changes as new compositions.
- Lawn and scans derive correlated shared/complement/edge/island coverage from the same world identity.
- Scan layouts no longer use fixed reference anchors; cluster centers and final candidates obey coverage, and their generated clumping values measurably reduce nearest-neighbor distance.
- Actual coordinate signatures are published for browser proof, not as the product behavior itself.

## Implementation boundaries

- `grass-world-catalog.ts`: compact compatible topology, relief, vegetation, feature, scale, and abundance profiles.
- `grass-world-generator.ts`: identity, exhaustive target ownership, deterministic compiler.
- `grass-world-coverage.ts`: correlated coverage and compact coordinate signatures.
- `grass-randomizer.ts`: advance once, pass the explicit Ground marker into the pure variation compiler, dispatch the generated patch, and retain the returned marker per app instance.
- `grass-placement-candidates.ts`, `grass-layout.ts`, `grass-scan-layout.ts`: deterministic base placement and coverage filtering.
- Renderer/PBR/shader/material code is not redesigned by this feature.

## Acceptance

- The Scene Randomizer section contains only `Scene variation` / `Randomize`; no Global switch exists.
- Two successive real clicks produce three distinct actual layout signatures and distinct spatial settings.
- Field width/depth, environment signature, full authored wind signature, fade, every non-Ground color, material response, quality, view, and export settings remain equal to the initial scene.
- Every content visibility value is true and every actual Tall/Lawn/scan/boulder count is positive after each click.
- The controlled browser shows coherent terrain with the current scene's original visual treatment and no white/black material corruption.
- Focused tests exhaust the full identity cycle, prove target partition and deterministic patches, exercise mask topology/clustering, sample generated worlds for non-empty layers, and run a long click sequence proving every size remains inside the initial scene's 25% envelope and the organic field caps.
