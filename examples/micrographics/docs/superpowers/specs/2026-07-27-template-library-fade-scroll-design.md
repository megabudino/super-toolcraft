# Template Library Fade Scroll

## Goal

Limit the Template Library grid to ten visible rows and place all remaining template tiles in an internal Toolcraft `ScrollFade` viewport.

## Behavior

- The `Template` label and Simple/Mega toggle stay outside the scroll viewport.
- The grid viewport is at most ten tile rows high, including nine existing 10px row gaps.
- If a tier contains fewer than ten rows, the viewport shrinks to its content and shows no fade.
- Overflow uses the built-in `ScrollFade` with a bottom fade at the start and a top fade after scrolling.
- Switching between Simple and Mega resets the template grid to the top.
- Template click, one-shot placement, native drag-and-drop, selected state, and thumbnail aspect ratio remain unchanged.

## Layout Technique

Measure the rendered tile height and grid row gap with `ResizeObserver`. Derive the viewport maximum as `tileHeight × 10 + rowGap × 9`, so resizing the controls panel preserves exactly ten visible rows. Use the built-in Toolcraft `ScrollFade` primitive rather than a product-authored mask or scrollbar.

## Verification

Verification tier: Tier 1.

- A focused browser assertion proves the viewport height equals ten rendered rows, has overflow, exposes ScrollFade state, scrolls vertically, and resets to the top after switching tiers.
- Existing direct-placement acceptance continues to prove clicks and drag-and-drop from the library reach poster output.
- Typecheck and the exact protected browser selector run through `verify:delivery`.

