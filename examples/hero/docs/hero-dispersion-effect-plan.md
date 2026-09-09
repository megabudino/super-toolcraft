# Single-Row Roller Cards And Viewport Dispersion Plan

## Locked visual scope

- Preserve the current hero composition exactly: one horizontal row, five cards on the left, five cards on the right, the same card order and 7:9 assets, and the existing centered title/button content.
- Do not add a second row, reduce the card count, replace the images, or restructure the page.
- Change only how the ten cards are spaced and rendered: remove the current deep stack/fan treatment and present the cards as a flatter row whose outer cards progressively wrap around an implied vertical roller.
- The card nearest the center stays almost flat. Roll increases toward the outer viewport edge. The left group enlarges/curves toward its left edge; the right group is the exact mirror and enlarges/curves toward its right edge.
- Keep the current WebGL dispersion implementation and all of its optical controls, but move its spatial mask from each card's local outside edge to a shared band measured from the corresponding viewport edge.

## Control and protocol changes

1. Update `src/app/app-schema.ts` and the focused card-control module so the Card Stacks entity exposes the requested built-in controls:
   - `cards.gap`: horizontal separation/overlap between neighboring cards in the existing row.
   - `cards.scale`: the existing editable 60–300% scale control.
   - `cards.roll`: mirrored cylindrical distortion strength, where zero is flat and larger values increase the outward-edge enlargement and curvature.
2. Remove the obsolete stack-depth controls that describe the current fan (`spread`, `depth`, `lift`, and `tilt`) rather than keeping inactive or misleading properties.
3. Preserve Projection and all four dispersion sections. Reinterpret `edgeZone.width` as the width of the active left/right viewport band; preserve its reference defaults, range, curve, fade, turbulence, Wave/Prism branches, spectral, blur, aura, motion, and boundary-aura controls.
4. Advance `src/app/hero-preview-protocol.ts` and the website receiver together so the canonical payload contains `gap`, `scale`, `roll`, and the unchanged nested dispersion recipe. Keep normalization, persistence, reset, history, and settings transfer Toolcraft-owned.

## Website layout and WebGL implementation

5. Update `/Users/alex/Projects/recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx` without changing the hero DOM composition or image inventory:
   - Keep five card nodes per side in the same single row.
   - Replace index-based depth/fan transforms with horizontal placement derived from `gap` and shared `scale`.
   - Assign each card a normalized outward progress value: the center-adjacent card is near zero and the outermost card is one.
   - Mirror the direction for the right group rather than maintaining separate hand-tuned layouts.
6. Extend `/Users/alex/Projects/recraft-v4-styles/src/components/pages/home/hero-card-dispersion-webgl.ts` with a fixed-density tessellated card mesh and a mirrored cylindrical vertex deformation:
   - Roll strength is multiplied by outward progress so the row transitions from nearly flat at the center to most curved at the viewport edge.
   - The deformation changes both silhouette and perspective interpolation, producing the reference behavior where the outward edge is closer/larger, rather than approximating it with a flat CSS skew.
   - Mesh density is fixed and bounded; changing Roll updates uniforms and does not recreate textures, programs, buffers, or WebGL contexts.
7. Update `/Users/alex/Projects/recraft-v4-styles/src/components/pages/home/hero-dispersion-card.tsx` to measure each card/canvas against the hero viewport and pass the card rectangle, viewport width, side, scale, roll progress, and motion into the retained renderer.
8. Replace the card-local dispersion edge field with viewport coordinates:
   - Left cards use distance from the hero viewport's left edge.
   - Right cards use distance from the hero viewport's right edge.
   - Pixels outside `edgeZone.width` render as the clean rolled image.
   - Pixels inside the band receive the existing curve/fade, warp, spectral dispersion, blur, aura, motion boost, and boundary-aura equations.
   - A card crossing the band boundary is only partially affected; center-facing portions remain clean.
9. Preserve the `next/image` fallback, 7:9 crop behavior, transparent outward bleed, context-loss fallback, resize handling, and resource cleanup. Do not move Toolcraft code or dependencies into the website repository.

## Readiness, acceptance, and performance mapping

10. Update `src/app/app-acceptance-data.ts`, `src/app/hero-preview-pipeline.ts`, and `src/app/app-performance.ts`:
    - Replace removed stack targets with `cards.gap` and `cards.roll`.
    - Keep `cards.scale` acceptance through exact typed numeric values.
    - Declare the fixed roller mesh and viewport-rect uniforms in the canonical renderer pipeline.
    - Keep spectral sample count and blur radius as the existing bounded workload dimensions; fixed mesh density and Roll strength are uniform-cost inputs, not new workload controls.
11. Add focused unit coverage for payload versioning, normalization, mirrored roll direction, outward-progress calculation, viewport-band coordinates, and preservation of all ten card/image mappings.
12. Update browser acceptance to prove:
    - Exactly ten cards remain in one row, with five on each side and unchanged ordering.
    - Gap, typed Scale, and Roll each change the embedded website output.
    - The center-adjacent cards remain flatter than the outer cards, and left/right roll direction is mirrored.
    - Changing a dispersion control alters pixels inside the active outer viewport band while an inner control region remains unchanged.
    - Wave and Prism conditional controls remain reachable and continue to alter the masked output.

## Verification note

Verification tier: Tier 3
Reason: This later feature changes website card geometry, the retained WebGL vertex/fragment pipeline, the bridge payload, control targets, and viewport-relative masking while preserving the established composition.
Run: Toolcraft code health, targeted protocol/renderer Vitest, focused feature checks for `cards.gap`, `cards.scale`, `cards.roll`, `edgeZone.width`, `edgeZone.warpStyle`, `edgeZone.warpWaveEnabled`, and representative dispersion/aura controls; website format, lint, typecheck, build, and desktop plus narrow-viewport browser screenshots.
Skip: Aggregate `verify:delivery` because the initial product receipt already exists; measured performance because the user requested product behavior, not a performance iteration or full audit.

13. Record the implemented state/output mapping and focused proof in `docs/toolcraft/agent-worklog.md`. Do not claim completion until both repositories pass the targeted checks and the browser visually confirms one row, progressive mirrored roll, and viewport-banded dispersion.
