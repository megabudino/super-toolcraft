# Vestaboard Subtle Depth Design

## Product Decision

Add a subtle, seeded depth field to the Vestaboard cells. The effect should make some cells feel slightly closer and others slightly recessed without changing the board grid, message centering, cell count, or export dimensions.

## Controls

- Add `Depth` to Board Surface as a slider from `0` to `100`, default `0`.
- Add `Depth seed` to Board Surface as a slider from `1` to `9999`, default `719`.
- `Depth` controls effect strength only. At `0`, the board matches the current flat rendering.
- `Depth seed` deterministically changes the depth distribution without changing text filler seed or cell fill opacity seed.

## Visual Behavior

- Each cell receives a deterministic `depth` value from `0` to `100`.
- Preview uses that value to apply a restrained combination of:
  - soft box shadow;
  - slight brightness/contrast/filter change;
  - a tiny upward visual translation for higher cells.
- The translation is visual only. It does not alter the cell's computed grid coordinates, phrase wrapping, canvas centering, or hit layout.
- The effect is intentionally restrained so the board reads as a clean relief surface, not as scattered blocks.

## Export Behavior

- PNG export must use the same model values and approximate the same subtle relief with Canvas 2D shadows and fill treatment.
- Export continues to use the standard retina PNG helper and honors `Background` / `Include background`.

## Acceptance

- The `Depth` slider visibly changes cell relief while preserving grid dimensions.
- `Depth seed` changes the deterministic relief distribution.
- Depth does not affect permanent phrase placement, random text seed, fill opacity seed, canvas size, or export output dimensions.
- Browser performance covers both `Depth` and `Depth seed` because they repaint the full computed cell field.

## Verification

- Unit tests cover default flat depth, max-depth distribution, and deterministic seed behavior.
- Browser tests cover visible style changes for `Depth` and distribution changes for `Depth seed`.
- Performance tests cover both controls with real Creative Apps Kit interactions.
