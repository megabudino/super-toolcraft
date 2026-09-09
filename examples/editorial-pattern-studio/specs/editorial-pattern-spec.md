# Editorial Pattern Studio — Product Spec

## Product goal

Create a static editorial poster tool that combines thirty strict asymmetric typography grids with a deeply explorable, repeatable parametric line system. The supplied images remain visual references rather than output to copy. The tool preserves their dense woven curves, bottom crop, modular hierarchy, restrained Swiss typography, and large fields of negative space while expanding the geometry and editorial system into original templates.

## Reference study

### Pattern references

- `/Users/alex/Desktop/toolcraft-test/2026-07-09 20.46.01.jpg`
- `/Users/alex/Desktop/toolcraft-test/2026-07-09 20.46.14.jpg`
- `/Users/alex/Desktop/toolcraft-test/2026-07-09 20.46.20.jpg`

The visible formulas combine a slow base orbit with faster integer harmonics. Integer frequencies close over `0..2π`; nearby unequal frequencies create woven interference; nonlinear radial or cubic terms create pinches and lobes. The revised app keeps every exposed system closed and repeatable by deriving all frequencies from integers.

### Editorial references

- `/Users/alex/Desktop/toolcraft-test/2026-07-09 20.47.47.jpg`
- `/Users/alex/Desktop/toolcraft-test/2026-07-09 20.47.52.jpg`
- `/var/folders/2j/stcqcdnd0mz1hk427cm8wcwc0000gn/T/codex-clipboard-3a815b1f-bc7a-46d4-98a5-2b9051b4b630.png`
- `/var/folders/2j/stcqcdnd0mz1hk427cm8wcwc0000gn/T/codex-clipboard-e140c437-3480-47a3-8fdf-707a2d96b7e0.png`

The reference system is not a collection of arbitrary poster compositions. It uses a repeatable modular grammar:

- a 12-column field with text beginning and ending on column boundaries;
- 18–24 baseline intervals that align unrelated copy blocks vertically;
- large empty regions that separate information before rules or color do;
- one dominant anchor per page: an issue number, a cropped phrase, or a large headline;
- compact body copy in one- to three-column measures;
- hairline rules that reveal page divisions without becoming decoration;
- occasional visible construction grids with a much lighter value than content;
- typography pushed to edges or clipped by the page when scale is the organizing device.

The type hierarchy uses Geist Sans throughout. Display roles use restrained variable weights `500–650`, tight tracking around `-0.04em`, and leading from `0.84–0.96`. Body roles use weight `400`, approximately `1.2–1.3` leading, and short measures. Micro labels use weight `500–600`, uppercase copy, modest positive tracking, and tabular figures where numbers act as anchors. Geist is self-hosted so SVG preview and Canvas export resolve the same family.

## Thirty-template editorial system

The former Index, Agenda, and Feature modes are replaced by one full-width **Template** select. Thirty options are required because segmented controls cannot fit this domain. Each template owns its grid, text placement, typographic scale, construction-rule visibility, pattern anchor, marker, and unique authored copy.

1. **Modular Index** — large issue marker at the upper edge, compact copy in the upper-right columns, headline anchored across the lower-left field, and a partially clipped bottom pattern.
2. **Edge Catalogue** — cropped display words on opposing bottom edges, minimal top metadata, and rules spanning the central negative field.
3. **Service Grid** — visible 12-column construction grid, headline in the first four columns, body copy distributed across adjacent measures, and the pattern in a lower-right module.
4. **Baseline Field** — repeated horizontal rhythm, narrow upper metadata, a two-line headline aligned to the left measure, and a lower-left pattern.
5. **Type Scale** — an oversized numerical anchor, small explanatory copy, and a compact pattern that demonstrates contrast between display and micro typography.
6. **Negative Space** — a right-aligned headline, isolated upper-left copy, a wide unoccupied center, and a deeply cropped bottom pattern.
7. **Column Rhythm** — stacked headline in a narrow left measure, compact body in the middle columns, visible vertical guides, and a lower-right pattern.
8. **Optical Balance** — centered display type corrected by eye rather than mathematical symmetry, a far-right text measure, and a centered bottom pattern.
9. **Margin System** — a rotated margin label, central headline, outer-edge annotations, and a pattern held below the main reading field.
10. **Variable Order** — metadata across the top, a wide headline near the lower third, and the largest cropped pattern, demonstrating how one grid supports substantial variation.

The template copy is original and covers design, typography, grids, rhythm, optical alignment, margins, negative space, publishing, archives, criticism, and systems. Every template has a unique eyebrow, headline, body, footer, and marker. Templates also own different quantities of independent microcopy, captions, folios, and column notes: the additional scenes range from six to twenty-five text elements rather than repeating one fixed role count. Their grids vary across 6, 8, 10, 12, and 16 columns, with distinct row rhythms and visible-guide policies. The twenty added compositions translate the supplied references into original Geist systems: perimeter ledgers, sparse colophons, running headers, stacked display statements, lower event bands, split registers, side rails, and modular proof sheets. Extra authored blocks have unique content, type roles, and grid positions and remain template-owned. Formula blocks support the longest current four-line wrap and keep at least `8px` of visible clearance from intersecting structural editorial rules at the authored `480×600` composition; faint construction grids remain intentionally behind the page content. A **Custom copy** switch is off by default: template selection therefore always changes composition, text, and editorial density. When enabled, the existing four copy editors replace the matching active-template roles without flattening its template-specific annotations.

## Design approaches considered

1. **Equation-specific parameter panels** — each equation would expose differently named controls. This is scientifically explicit but creates a long conditional panel, makes comparison harder, and forces users to relearn controls when switching equations.
2. **Shared expressive variables across curated equations** — every equation consumes the same five variables while interpreting them through its own physical model. This keeps exploration fast, makes before/after comparison legible, and lets every slider remain visibly useful.
3. **Raw formula editor** — maximum freedom, but unsafe evaluation, poor discoverability, difficult reset/export guarantees, and no reliable browser acceptance.

The app uses approach 2. It delivers substantial variety without custom controls or an expression language.

## First-launch defaults

A clean browser profile starts from the latest user-supplied settings export `/Users/kusnizza/Downloads/editorial-pattern-studio-settings.json`. The deployable app owns a normalized copy of those values; it does not read the Downloads path at runtime. Built-in color controls use the exported `hex` values as schema strings, and exported vector strings are normalized to numeric X/Y values.

- Canvas: custom `4:3`, `1440×1080px`.
- Explore: Preserve colors on.
- Editorial: Negative Space template, authored template copy active, with the supplied eyebrow, `ORDER / CREATES / FREEDOM` headline, body, and footer retained as the hidden Custom copy defaults.
- Equation: Harmonic Halo; Symmetry `15`, Resonance `9`, Coupling `43%`, Phase `106°`, Warp `44%`.
- Line form: Position `-0.18 / -0.04`, Scale `92%`, Detail `6400`, Stroke `1.15px`.
- Segmentation: Segment size `0.5%`, Randomness `60%`, Color spread `88%`.
- Appearance: line palette `#E6D0F0 / #EF6CB1 / #9BED87`; white headline/detail/rule inks; included `#0C925F` background.
- Image export: PNG at 4K.

Schema `defaultValue` owns both first launch and section/global Reset. Existing localStorage key/version `toolcraft:editorial-pattern-studio:state:v3` remains unchanged, so persisted returning-user state wins over these defaults. The settings export's generic timeline metadata is not applied because this product intentionally has no timeline or video export.

## Equation system

The Equation control is a full-width `select`, not a segmented button group. It offers twelve closed, physically inspired systems:

1. **Harmonic Halo** — a slow carrier orbit with paired high-frequency sidebands.
2. **Coupled Pendulum** — superposed normal modes with opposite-axis coupling.
3. **Magnetic Orbit** — counter-rotating cyclotron modes plus a weak harmonic drift.
4. **Standing Wave** — a radial standing wave wrapped around a phase-modulated orbit.
5. **Torus Knot** — a projected toroidal resonance with radial breathing.
6. **Hypotrochoid** — internal rolling-circle motion with a tertiary harmonic.
7. **Duffing Trace** — a nonlinear cubic-oscillator phase portrait approximation.
8. **Vortex Ring** — radial circulation with nested angular phase modulation.
9. **Wave Packet** — a beat envelope coupling two integer carrier modes.
10. **Membrane Mode** — orthogonal standing-wave modes on an elastic surface.
11. **Superformula** — a Gielis-style radial field with resonance modulation.
12. **Shell Interference** — a reference-derived carrier with paired high harmonics.

All systems consume the same variables:

- `n = Symmetry`, integer `2..16`; changes lobe/topology count.
- `m = n + Resonance`, where Resonance is integer `1..16`; changes mode ratio and crossings.
- `c = 0.12 + 0.78 × Coupling/100`; changes secondary-mode energy.
- `φ = Phase × π/180`; shifts interference alignment.
- `w = Warp/100`; changes nonlinear phase/radial deformation.

Every evaluator uses `n`, `m`, `c`, `φ`, and `w`. The equation label on the poster updates to show the active system and substituted values. Frequencies remain integers, so first and last samples stitch.

## Short multicolor segmentation

The product is still one continuous sampled line, but it is rendered as many short consecutive SVG/Canvas strokes. Segmentation is deterministic for the same settings so the preview does not flicker.

- **Segment size** is `0.35..2.5%` of the sampled path, default `0.50%`. The default produces roughly 200 colored strokes instead of 30 long blocks; the minimum produces roughly 285.
- **Randomness** is `0..100%`, default `60%`. It jitters segment lengths and color-order choice through a seeded PRNG without changing total line coverage.
- **Color spread** is `0..100%`, default `88%`. Low values form longer same-color neighborhoods; high values interleave all palette colors rapidly and evenly.
- The deterministic segmentation seed is independent of equation identity and geometry parameters. Segment boundaries and color identities therefore stay attached to stable path indices while the curve morphs, preventing palette flicker during equation and slider changes.

Each generated segment owns a `colorIndex`; SVG preview and Canvas export consume the same segment list, so the color rhythm matches exactly.

## Harmony palette shuffle

Line Palette contains three editable color controls plus a local schema `actions` control labeled **Harmony** with one **Shuffle** button. The action updates the three runtime color targets through `controls.setValue` commands.

The algorithm hashes the current palette to advance around the hue wheel using the golden angle, then chooses an analogous, triadic, or split-complementary spacing. It constrains saturation and lightness into editorial-safe ranges and adapts lightness to the current background luminance. Repeated shuffles therefore produce different but deterministic, contrast-aware combinations instead of unrelated random RGB values. Global and section reset still restore the authored defaults.

## Whole composition shuffle

An **Explore** section appears first in the controls panel and contains a built-in **Preserve colors** switch plus one built-in `actions` control labeled **Composition** with a **Shuffle all** action. It is a product exploration action, not an export action, so it does not appear in the sticky footer.

Each activation hashes the current poster state and advances a deterministic seeded generator. It updates runtime values only through `controls.setValue`, preserving history, reset, settings transfer, and persistence. The shuffle:

- selects a different editorial template whenever more than one option exists;
- turns Custom copy off so the chosen template's unique authored text is visible;
- selects a different equation;
- assigns new Symmetry, Resonance, Coupling, Phase, and Warp values within their authored schema ranges;
- generates a coordinated background, headline ink, detail ink, rule ink, and three-color line palette;
- keeps Background Include on so the generated contrast relationship remains visible.

**Preserve colors** is on by default. When enabled, Shuffle all still selects a different template and equation, resets Custom copy to authored template content, and changes all five shared equation variables, but it omits `appearance.background`, `appearance.headline`, `appearance.detail`, `appearance.rule`, `pattern.colorA`, `pattern.colorB`, `pattern.colorC`, and `export.includeBackground` from the dispatched target set. The user's complete color and background-visibility system therefore remains byte-for-byte unchanged. Turning it off restores the contrast-safe whole-palette shuffle branch. The switch itself persists through the existing localStorage `values` slice and resets with the Explore section.

The color generator begins with a bold chromatic background at `90–100%` HSL saturation and a mid-depth starting lightness modeled on vivid colors such as `#000ECC`. It never emits white, off-white, gray, beige, or low-saturation backgrounds. For each hue it evaluates both a deep/white-ink direction and a bright/black-ink direction, then moves lightness by the smaller distance needed to guarantee accessible text; this preserves electric blues, violets, reds, oranges, yellows, greens, cyan, and magenta without muddy midtones. Headline and detail text must reach at least `7:1` contrast against the generated background so even template microcopy exceeds WCAG AA. Rule and each line color must reach at least `3:1`, keeping thin construction and pattern strokes visibly separated from the page. All generated colors are six-digit hex values; the three line colors remain distinct. The same seed returns the same palette for testability, while the state-derived next seed makes repeated shuffles advance to new compositions.

The local Line Palette **Shuffle** remains available and continues to harmonize only the three line colors against the current background.

## Complete pattern transitions

Every visual pattern value uses one coordinated transition instead of changing at different moments. Equation, Symmetry, Resonance, Coupling, Phase, Warp, Detail, template-owned anchor, Position X/Y, Scale, Stroke, Segment size, Randomness, Color spread, all three line colors, background, headline/detail inks, and rule ink share the same `480ms` progress. This includes the template-owned pattern anchor and radius, so a global shuffle never teleports the line system when the editorial composition changes.

The renderer treats every equation as a closed sampled loop and uses this pipeline:

1. Resample the current displayed loop and target loop to the same bounded point count.
2. Downsample both loops by their shared canonical `t = 0..2π` parameter index, preserving phase, winding, and color-segment anchors through the full-detail completion frame.
3. Interpolate parameter-matched point pairs with an ease-in-out cubic curve for approximately `480ms`.
4. Interpolate pattern transform, stroke, segmentation values, palette, background, and inks with the same eased progress.
5. Build short color segments from normalized `0..1` curve spans using stable segment identities and React keys. Boundaries no longer depend on the temporary point count, so the final full-detail handoff cannot reassign colors.
6. On completion, replace the bounded transient curve with the full-detail target points while preserving the same normalized segment boundaries and color indices.

The animation is interruptible: when any pattern control or shuffle supplies a new target mid-morph, the current displayed geometry and appearance become the next start state. Only one `requestAnimationFrame` loop exists and intermediate work is coalesced to the browser paint cycle. Transient morph sampling is capped at `1,200` points to protect slider and viewport responsiveness; the final preview and all Canvas exports still use the selected full Detail value. Export always renders the final schema target and never captures a transient midpoint.

`prefers-reduced-motion: reduce` disables interpolation and presents the target immediately. The SVG exposes morph state as product observables for acceptance without making motion into saved product state.

This is transient control-response feedback, not an authored time dimension: it has no play/pause, scrub position, looping behavior, video output, or export-at-time semantics. The Toolcraft timeline therefore remains absent.

## Product behavior

- Default canvas is editable `1440×1080` at 4:3; 2K/4K/8K export remains independent.
- The pattern remains bottom-positioned and partially clipped by default.
- Template is a full-width select with thirty visibly and structurally different editorial systems.
- Selecting a template changes its grid, pattern anchor, typography, marker, unique design-related text, and number of text elements.
- Every template keeps the longest four-line formula at least `8px` clear of structural editorial rules at both the original `480×600` composition and the current `1440×1080` default.
- Shuffle all changes template, equation, and all shared equation parameters. With Preserve colors off it also generates background, text/rule inks, and line palette at the documented contrast thresholds; with Preserve colors on it leaves every user color and Background Include unchanged.
- Custom copy is a switch; its four text editors are hidden until enabled and then override the selected template copy.
- Geist Sans Variable replaces Inter across the Toolcraft shell, SVG preview, and Canvas export.
- Position, scale, detail, and stroke remain live controls.
- Equation, Symmetry, Resonance, Coupling, Phase, and Warp materially change the pattern.
- Equation, all pattern controls, template-owned placement, and generated color roles transition from the currently displayed state to the new state on one progress clock; reduced-motion users receive the target immediately.
- Segment size, Randomness, and Color spread materially change the short multicolor rhythm.
- Users can still edit copy, line colors, editorial ink, rule, and background.
- Background Include and image export behavior remain unchanged.
- Settings, palette changes, geometry, segmentation, copy, and canvas state persist in localStorage.

## Control Section Inventory

| Section | Entity/workflow | Targets | Grouping reason |
| --- | --- | --- | --- |
| Explore | Whole poster exploration | `composition.preserveColors`, `composition.shuffle` | The switch scopes whether the composition action also replaces the user's color system; both values jointly define one shuffle workflow. |
| Editorial Template | Template and copy mode | `editorial.template`, `editorial.customCopy`, `editorial.eyebrow`, `editorial.headline`, `editorial.body`, `editorial.footer` | The template owns grid and authored copy; custom fields appear only when the user opts into overriding that copy. |
| Field Equation | Closed physical system | `pattern.preset`, `pattern.symmetry`, `pattern.resonance`, `pattern.coupling`, `pattern.phase`, `pattern.warp` | The selector and shared variables jointly define one closed equation. |
| Line Form | Pattern presentation | `pattern.position`, `pattern.scale`, `pattern.detail`, `pattern.stroke` | These controls place and resolve the resulting line system. |
| Color Segments | Short color rhythm | `pattern.segmentSize`, `pattern.segmentRandomness`, `pattern.colorSpread` | These values partition one continuous line into stable short colored strokes. |
| Line Palette | Pattern color harmony | `pattern.colorA`, `pattern.colorB`, `pattern.colorC`, `pattern.paletteActions` | Editable colors and local harmony shuffle belong to the same line palette. |
| Editorial Ink | Text and rule colors | `appearance.headline`, `appearance.detail`, `appearance.rule` | These colors belong to the fixed editorial hierarchy. |
| Background | Output background | `export.includeBackground`, `appearance.background` | Runtime-required inclusion and poster background. |
| Image Export | Image delivery | `export.image.format`, `export.image.resolution` | Runtime-required image type and output-size pair. |

## Control selection inventory

- Template library: finite choice with thirty descriptive labels; built-in `select` is the closest owner and is required by the segmented-control fit limits.
- Whole composition shuffle: one local generation command; built-in `actions` is the exact owner and keeps the sticky footer reserved for output delivery.
- Preserve colors: binary choice controlling whether Shuffle all may replace background, inks, line palette, and background inclusion; built-in `switch` is the exact owner.
- Custom copy: binary choice between authored template text and user overrides; built-in `switch` is the exact owner, with dependent editors gated by `visibleWhen`.
- Eyebrow/footer: short user copy; built-in `text` remains the exact owner.
- Headline/body: multiline user copy; built-in `code` remains the exact owner.
- Equation library: finite choice with twelve text labels; `select` is the closest built-in and avoids segmented overflow.
- Symmetry and Resonance: small semantic integer domains; built-in discrete `slider` with markers.
- Coupling, Phase, Warp, Segment size, Randomness, Color spread: numeric ranges; built-in continuous `slider`.
- Palette shuffle: local command affecting the nearby palette; built-in `actions` is the exact owner.
- Position: stable direct-authored X/Y value; built-in `vector` remains the exact owner.
- No custom controls are required.

## Timeline, layers, media, and persistence

- Timeline: none; the final output remains static and has no video export. Complete pattern transitions are interruptible input feedback with no user-owned time, playback, looping, scrubbing, or export-at-time state.
- Layers: none; the poster remains one composed output.
- Media: none; supplied screenshots remain references only.
- Persistence: localStorage includes `values`, `canvas`, and `panels`.

## Renderer Technique Decision Matrix

- `sourceRepresentation`: procedural-data
- `productRepresentation`: mixed vector geometry and text
- `previewRenderer`: SVG
- `exportRenderer`: Canvas 2D
- `rendererWorkload`: vector-output
- `rendererStrategy`: SVG
- `whyNotAlternativeStrategies`: Canvas preview would rasterize linework/type; WebGL adds complexity without benefit for a static maximum near 300 short paths and 10,000 points; DOM cannot express the dense geometry compactly.
- `fidelityRisks`: SVG and Canvas font metrics can differ slightly; segmentation must share the same generated data across preview and export.
- `performanceRisks`: equation sampling at 10,000 points and minimum segment size near 285 paths are the heavy preview state; transient morphing adds frame-by-frame point interpolation and segmentation, so it is capped at 1,200 points, coalesced to one animation frame, and finalizes at full detail.

## Renderer Layer Inventory

- `backgroundLayer`: conditional product background rectangle, low SVG primitive count, included in image output when Background Include is on.
- `productForegroundLayer`: short colored equation strokes, editorial text, rule, and equation label, high SVG primitive count, included in image output.
- `editingHandlesLayer`: absent because Position is authored through the built-in Vector control.
- `exportComposite`: Canvas 2D export-only composite using the same generated points and color indices.

## Render Pipeline Inventory

Renderer modules:

- `pattern-equations.ts`: equation metadata, parameter normalization, evaluation, labels, and closed point sampling.
- `pattern-segmentation.ts`: point normalization, deterministic PRNG, short segment boundaries, and color-index assignment.
- `palette-harmonies.ts`: palette hashing, background luminance, harmony selection, and HSL-to-hex conversion.
- `pattern-morphing.ts`: parameter-preserving closed-loop resampling, interpolation, easing, and interruptible reduced-motion-aware React animation state.
- `editorial-pattern-renderer.tsx`: state normalization, editorial scene, SVG composition, shared Canvas export, and action routing.

Pipeline passes:

1. `equation-sample`: equation + five variables + detail → normalized target points.
2. `morph-resample`: currently displayed loop + canonical `t`-ordered target loop → bounded point pairs that preserve normalized segment anchors through full-detail completion.
3. `morph-interpolate`: parameter-matched point pairs + eased frame progress → transient display points; invalidated only by the active RAF until completion.
4. `appearance-interpolate`: current and target transform, stroke, segment values, palette, background, and inks + eased frame progress → coordinated transient appearance.
5. `color-segmentation`: displayed points + normalized curve spans + stable seed + interpolated size/randomness/spread → short paths with stable color indices.
6. `text-layout`: selected template + copy mode + copy/canvas size → normalized 6/8/10/12/16-column scene, construction rules, and text hierarchy; paint is applied later so animation frames do not rebuild layout.
7. `preview-composite`: cached paths/text + interpolated placement/paint → SVG.
8. `export-rasterize`: final full-detail target points/text/state → selected image bytes, independent of transient preview progress.

## Verification note

Verification tier: Tier 4

Reason: This major post-generation iteration adds a whole-product action that changes many persisted runtime targets and rewrites the custom SVG renderer into an interruptible animated geometry pipeline. It also adds contrast-critical generation logic and changes renderer workload, invalidation, and browser-observable behavior.

Run: `npm run ai:check`; targeted unit tests for deterministic accessible palette generation, saturated-background bounds, whole-composition target selection, parameter-preserving closed-loop resampling/interpolation, easing, and reduced-motion behavior; `npm run verify:quick`; focused browser acceptance for repeated Shuffle all actions, background saturation, contrast ratios, intermediate morph frames, interrupted slider morphs, reduced motion, persistence/history/reset, and final export; targeted animation-frame and animation-viewport-drag performance scenarios at the declared heavy geometry fixture; `npm run verify:final`; real browser visual QA for saturated shuffled posters across black-ink and white-ink contrast polarities; deploy and verify the public Vercel app.

Skip: The full performance checkpoint is not required for this post-first-working feature iteration because the user requested behavior, not performance optimization. Targeted morph-frame and viewport-drag performance coverage is required because the custom renderer is now transiently animated. Timeline, video, layers, and media remain intentionally absent.
