# Hero Heading Subtitle Design

## Goal

Add the Figma text `Style it once, every image matches` directly below the hero heading, preserve its authored typography proportions, and expose the requested Toolcraft controls for font size, heading distance, and an independent adjustable shadow.

## Figma Source

- File: `Zdk7j8qu8hvslsrEFYsL9z`
- Node: `6057:643`
- Text: `Style it once, every image matches`
- Typography: Geist Medium, 24px, 1.25 line height, -0.48px letter spacing
- Presentation: centered, white, single line

The Figma node is a text layer, not a button or link. It therefore renders as semantic paragraph text and does not add an interaction target.

## Product Behavior

The subtitle belongs to the existing hero heading group and moves with that group. It renders after the two-line `Recraft Styles` heading and before the existing CTA. Its `gap` is the exact vertical distance from the heading to the subtitle. The existing CTA remains unchanged and follows the subtitle in document flow.

The subtitle has an adjustable font size with the Figma 24px value as its default. Line-height remains 1.25 and letter spacing stays proportional at `-0.02em`, which reproduces the Figma `-0.48px` tracking at 24px. It also has a dedicated shadow rather than sharing the heading, badge, or CTA shadow. Shadow is disabled by default. When enabled, Toolcraft exposes offset, blur, spread, and color with opacity. The website uses the same SVG-filter technique already used by heading and badge shadows so every control, including spread, has a real visual effect.

## Toolcraft State And Controls

Add one `Hero Subtitle` section on the shared `hero-heading-group` entity with these built-in controls:

- `Gap`: continuous slider, 0–160px, default 24px.
- `Font size`: continuous slider, 10–64px, default 24px.
- `Shadow`: switch, default off.
- `Shadow offset`: conditional screen-coordinate vector.
- `Shadow blur`: conditional continuous slider, 0–100px.
- `Shadow spread`: conditional continuous slider, -32–32px.
- `Shadow color`: conditional color+opacity control.

No text, font-family, line-height, tracking, or text-color controls are added. Font size is adjustable, while line-height and tracking preserve the supplied Figma proportions.

## Data Flow

Toolcraft owns `heading.subtitle.*` values. `createHeroPreviewSettingsFromValues` normalizes them into a subtitle settings object inside the existing hero preview payload. The website normalizer accepts the new object, supplies defaults for older saved settings, and persists it through the existing Apply/Reset flow. The preview protocol advances to v23 so Toolcraft and the website agree on the expanded subtitle payload.

## Alternatives Rejected

- Reusing the heading shadow was rejected because the user asked to add and regulate the subtitle shadow independently.
- Rendering the text as another CTA was rejected because the Figma node is plain text and carries no button styling or interaction.
- CSS `text-shadow` was rejected because it cannot represent the existing spread control; the current SVG shadow filter already supports the full setting model.

## Verification

This is later feature work at Tier 2. Use only focused checks: the subtitle settings/controls test, the website subtitle/settings test, and one feature-scoped browser scenario for live gap and shadow updates. Do not run delivery, export, performance, or full browser suites.
