# Vestaboard Main Text Flash Fill Design

## Context

The board already animates the phrase text and the random background field through the playback timeline. The effect adds colored filled flashes to the cells of main-text letters that are already known to disappear during the source-to-target phrase animation.

## Decision

Add a Main text flash fill effect inside the Board Message controls:

- `Flash colors` controls how many palette slots are active, from 0 to 4. At 0 the effect is off.
- `Flash frequency` controls how often active disappearing letters receive a colored fill.
- `Flash 1`, `Flash 2`, `Flash 3`, and `Flash 4` define the palette slots.
- The effect applies only to currently active removable phrase letters and does not change kept phrase letters or random background cells.

## Behavior

Each removable source letter receives deterministic seeded flash state from its source index, active color count, frequency, and active removal progress. When that letter is in `removalState === "active"`, its cell fill color can be replaced by one of the active palette colors and the flickering text stays on top. If multiple palette slots are active, the letter cycles through the selected colors during its short removal lifetime. Once the letter is removed, the flash disappears with it. Kept letters never receive this fill.

The same model value is used by DOM preview, PNG export, and video export.

## Verification

- Unit tests prove color count 0 disables the effect.
- Unit tests prove higher frequency creates flash fills only for active disappearing letters.
- Unit tests prove changing a palette color changes disappearing-letter flash fill color and that two active colors animate across one disappearing letter lifetime.
- Browser tests change `Flash colors`, `Flash frequency`, and palette colors.
- Performance coverage includes count, frequency, and palette color changes.
