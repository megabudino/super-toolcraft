# Hero Badge Scale, Gap, and Shadow Design

## Goal

Extend the existing Hero Heading controls so the V4 badge can be scaled as one unchanged artwork unit, spaced precisely from the heading text, and given an independent configurable shadow.

## Product behavior

- `Badge scale` scales the complete existing badge composition together: circle, stroke, and V4 lettering. Its internal geometry is not recalculated.
- The scale range is 25–300%, with 100% preserving the current badge.
- `Badge gap` controls the visible distance between the scaled badge and the first heading line. Its range is 0–160 px, with the current 10 px spacing as the default.
- The badge keeps its existing responsive authored base size. A layout wrapper reserves the scaled visual bounds so the configured gap remains exact instead of collapsing around a CSS transform.
- Badge shadow is independent from Heading Shadow and CTA Shadow. It provides the same built-in controls: enabled, two-axis offset, blur, spread, and color with opacity.
- Badge shadow is disabled by default, so existing output does not change after this feature lands.

## Controls and state

Add canonical runtime targets under `heading`:

- `heading.badgeScale`
- `heading.badgeGap`
- `heading.badgeShadow.enabled`
- `heading.badgeShadow.offset`
- `heading.badgeShadow.blur`
- `heading.badgeShadow.spread`
- `heading.badgeShadow.colorOpacity`

`Badge scale`, `Badge gap`, and the existing badge color remain in the `Badge` workflow section. The independent five-field shadow model is placed in a balanced `Badge Shadow` workflow section and reuses built-in Switch, Vector, Slider, and Color & Opacity controls.

Defaults:

- scale: 100%
- gap: 10 px
- shadow: disabled, 24 px blur, 0 px spread, black at 25% opacity, offset `{ x: 0, y: 0.125 }`

## Preview and website data flow

Toolcraft values are normalized into the hero preview protocol, posted to the iframe, normalized again by the website, and applied to the Hero V4 heading renderer. The protocol version is incremented because the settings envelope changes.

The renderer keeps the badge artwork unchanged and applies a single CSS scale transform to it. A surrounding layout box reflects the scaled bounds. A separate SVG filter, following the existing heading/CTA shadow implementation, applies the badge shadow without affecting the heading shadow.

Apply, Reset, persistence, and settings import/export receive the new values through the existing runtime-owned schema state and website settings envelope. No product export behavior is added or changed.

## Acceptance and focused verification

Acceptance covers:

- scale changes the complete badge while leaving heading sizes unchanged;
- gap changes only the visible badge-to-heading spacing;
- each shadow control affects only the badge;
- disabling or resetting shadow removes it;
- default values preserve the current visual result.

Verification tier: Tier 2 — schema/product behavior.

Run the directly affected value/protocol tests and focused feature checks for the new badge targets. Perform one local browser check in Hero Toolcraft. Skip aggregate delivery, full browser suites, builds, and measured performance.
