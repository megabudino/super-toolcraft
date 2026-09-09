# Template Library Scroll Chaining Design

## Problem

The Template Library is intentionally capped at ten visible rows and uses its
own `ScrollFade` viewport. Once that viewport reaches its bottom edge, continued
wheel or trackpad input does not scroll the containing Toolcraft controls
panel.

Browser inspection reproduced the failure and showed the cause:

- the library viewport is scrollable (`clientHeight: 548`,
  `scrollHeight: 715`);
- its computed `overscroll-behavior-y` is `contain`;
- both the shared `ScrollFade` primitive and the product CSS currently request
  containment.

`contain` explicitly prevents native scroll chaining to an ancestor.

## Desired Behavior

- The library keeps its ten-row maximum height.
- The library keeps leading and trailing fade masks.
- Wheel/trackpad input scrolls the library while it has remaining content.
- At the library bottom, continued downward input scrolls the whole controls
  panel.
- At the library top, continued upward input may likewise return to the outer
  panel.
- Template click, drag-and-drop, tab switching, and one-shot placement remain
  unchanged.

## Approaches Considered

### 1. Allow native scroll chaining on this viewport — selected

Set `overscrollBehaviorY: "auto"` on the library `ScrollFade` viewport and
remove the product CSS containment rule. The inline viewport style wins over
the shared primitive's default `overscroll-contain` class without changing the
shared behavior for selects, font lists, or other independent scrollers.

This is the smallest browser-native fix and preserves inertial trackpad
behavior.

### 2. Forward `wheel` events manually

Detect the inner boundary and mutate the outer panel's `scrollTop`. This adds
browser-specific delta handling, risks double scrolling, and degrades trackpad
momentum and accessibility.

Rejected.

### 3. Remove the nested scroll viewport

Let the whole template grid expand inside the controls panel. This restores
panel scrolling but violates the requested ten-row cap and makes the section
too tall.

Rejected.

## Implementation

The change is product-local in `template-library-control.tsx` and its CSS
module:

- always pass `overscrollBehaviorY: "auto"` in the `ScrollFade` viewport
  `style`;
- retain the measured `maxHeight` in the same style object;
- remove `.scroller { overscroll-behavior: contain; }`.

No runtime schema, renderer, persistence, export, or workload model changes.

## Verification

Verification tier: Tier 2

Reason: One custom control's nested scrolling behavior changes; runtime state,
renderer output, and workload boundaries are unchanged.

Focused browser proof:

1. open the real app;
2. locate the Template Library viewport and outer controls-panel viewport;
3. scroll the inner viewport to its maximum;
4. hover it and issue further downward wheel input;
5. assert the inner viewport remains at its maximum;
6. assert the outer controls-panel `scrollTop` increases;
7. assert the library still reports the ten-row cap and both fade endpoints
   update normally.

The full performance audit is not required because no renderer or measured
interaction path changes.
