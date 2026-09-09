# Hero shadows, badge color, and card radius design

Date: 2026-08-21
Status: approved

## Goal

Extend the existing Hero Toolcraft editor and website iframe bridge with four independently editable visual outcomes:

- a configurable shadow for the `RECRAFT STYLES` heading lines;
- a separate configurable shadow for the AI prompt panel;
- one color for both the `V4` badge text and circular outline;
- one corner-radius value shared by every gallery card in Rows and Sphere modes.

Every edit previews live through the existing iframe protocol. `Apply` persists the complete settings payload and updates the main website through the existing Hero settings boundary.

## Controls

Use built-in Toolcraft controls and persisted runtime values.

### Hero Heading

Keep the existing six controls unchanged:

- Recraft size
- Styles size
- Text color
- Line gap
- Badge
- Position

### Heading Effects

The heading entity exceeds ten controls after this feature, so split it into a second balanced workflow section with the same entity identity:

- Badge color — `color`, default `#E6E6E6`.
- Shadow — `switch`, default off.
- Shadow offset — screen-coordinate `vector`, mapped symmetrically to pixel X/Y offsets.
- Shadow blur — continuous slider in pixels.
- Shadow spread — continuous signed slider in pixels.
- Shadow color — `colorOpacity`, owning both color and opacity.

The heading shadow applies only to the two heading lines. It does not shadow or recolor the badge.

### Prompt

Keep Position and add the same five shadow controls with independent targets and values:

- Shadow
- Shadow offset
- Shadow blur
- Shadow spread
- Shadow color

The prompt defaults preserve the currently authored panel shadow: black at 35% opacity, X `0px`, Y `6px`, blur `40px`, spread `0px`, enabled.

### Gallery

Add `Card radius`, a continuous pixel slider, to the existing Gallery section. It is always applicable and affects every card in both Rows and Sphere modes. The default is `0px` to preserve the current output.

## Shared shadow value model

Both entities use the same typed shape:

```ts
interface HeroShadowSettings {
  enabled: boolean;
  offset: { x: number; y: number };
  blur: number;
  spread: number;
  colorOpacity: { hex: string; opacity: number };
}
```

The two settings instances remain independent. Toolcraft values are normalized before entering the preview payload, and website settings are normalized again at the iframe/apply boundary so older applied JSON remains valid.

## Rendering

### Heading

Use an SVG filter on the heading element so spread is real rather than approximated with repeated CSS text shadows:

- `feMorphology` dilates positive spread and erodes negative spread;
- `feGaussianBlur` applies blur;
- `feOffset` applies X/Y displacement;
- `feFlood` and compositing apply the selected color and opacity;
- the source heading is merged above its shadow.

The filter bounds must include the maximum configured shadow so it cannot clip. When disabled, the heading has no filter cost.

### Prompt panel

Pass a computed inline `box-shadow` to the root `AiPromptInput` form. The component keeps its existing default styling for every non-Hero consumer. The Hero instance replaces the authored static shadow with the persisted prompt shadow or `none` when disabled.

### Badge

Render the existing simple circular ring with a current-color border instead of a fixed-color image. The badge container supplies the persisted badge color, and both the ring and `V4` text inherit it. Visibility remains controlled by the existing Badge switch.

### Gallery cards

Add one corner-radius uniform to the shared dispersion fragment shader and apply a rounded-rectangle alpha mask in the canonical card sampler. Both the Rows card renderer and Sphere renderer use that sampler, so the same setting reaches both WebGL modes. Apply the same CSS radius to image fallbacks.

## Protocol and persistence

Bump the Hero preview protocol version once. Extend the settings payload with:

- `heading.badgeColor`
- `heading.shadow`
- `prompt.shadow`
- `gallery.cardRadius`

Update Toolcraft defaults, value decoding, preview mapping, Apply serialization, website normalization, and `hero-applied-settings.json`. Missing fields use the defaults above, preserving compatibility with older saved payloads.

## Acceptance and performance coverage

This is later feature work at Tier 3 because it changes schema targets and DOM/WebGL rendering. Add product acceptance rows for every new visible target and keep section inventory aligned. Add the new controls to the existing responsive preview pipeline and performance target inventory; no new workload dimension is introduced.

Focused verification only:

- focused value/protocol product tests for shadow, badge color, and radius mapping;
- focused website tests for settings normalization and render mapping;
- focused Hero browser feature scenarios proving independent shadows, badge color, and radius in both gallery modes;
- no broad delivery or measured performance suite.

## Risks and safeguards

- SVG morphology can be expensive at extreme values, so blur/spread ranges remain bounded and the filter is absent while disabled.
- The WebGL radius mask must use card-local pixel coordinates so aspect ratios and Sphere curvature do not change the authored radius.
- Existing uncommitted Hero gallery/lens work must be preserved; implementation is additive and avoids rewriting unrelated state.
