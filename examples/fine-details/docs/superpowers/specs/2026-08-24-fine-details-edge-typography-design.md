# Fine Details Edge Typography Design

**Date:** 2026-08-24

## Goal

Add the two edge-anchored typography compositions from Figma node `6063:943` to the
Fine Details section and expose their placement and typography measurements in the
Fine Details Toolcraft app.

The existing Fine Details background, grid, and centered AI prompt remain unchanged.

## Reference Composition

The reference canvas is 1920 × 1080.

- The upper-left composition is the fixed text `TRY IT`.
- The lower-right composition contains the fixed heading `YOUR WAY` and the fixed body
  copy `Bring a style reference, and every image you generate will hold true to it.`
- Both compositions are decorative and do not accept pointer input.

The initial values follow the updated Figma frame:

| Setting | Default |
| --- | ---: |
| Upper-left left inset | 112px |
| Upper-left top inset | 112px |
| `TRY IT` font size | 131px |
| Lower-right right inset | 112px |
| Lower-right bottom inset | 112px |
| `YOUR WAY` font size | 88px |
| Body font size | 24px |
| Heading-to-body gap | 16px |

## Typography

Reuse the font files and theme aliases already registered by the website:

- `TRY IT`: ABC Gravity Ultra through the existing variable upright
  `font-heading` face at its heaviest registered weight.
- `YOUR WAY`: ABC Gravity Wide Trial Ultra Italic through
  `font-display-wide-ultra-italic`.
- Body copy: Geist Medium through the existing site sans font.

Both headings are uppercase, black, single-line, and use a `0.96` line height to match
the Figma frame. The body uses a `1.25` line height, medium weight, and the Figma
tracking of `-0.02em`. Its reference width remains 465px so the default copy wraps to
two lines as designed.

## Layout

Render the two compositions as independent absolute groups inside the Fine Details
section:

- The upper-left group is positioned with CSS `left` and `top` pixel insets.
- The lower-right group is positioned with CSS `right` and `bottom` pixel insets.
- The lower-right group uses a vertical layout with a configurable pixel gap between
  its heading and body.
- The grid stays behind the typography. The prompt remains above it, preserving its
  existing position and shadow behavior.
- The section retains `overflow: hidden`; large user values may intentionally move
  text partially or fully outside the visible section.

Insets and font sizes remain literal CSS pixel values on the website. They do not
scale proportionally with viewport width. This keeps Toolcraft values predictable and
matches the requested edge-distance model.

## Toolcraft Controls

Add two control sections to the existing Fine Details controls panel.

### Upper-left Typography

- `Left` — pixel distance from the section's left edge.
- `Top` — pixel distance from the section's top edge.
- `Font size` — `TRY IT` size in pixels.

### Lower-right Typography

- `Right` — pixel distance from the section's right edge.
- `Bottom` — pixel distance from the section's bottom edge.
- `Heading size` — `YOUR WAY` size in pixels.
- `Body size` — body copy size in pixels.
- `Gap` — vertical pixel distance between the heading and body.

Each control exposes exact numeric input alongside its slider behavior and updates the
iframe preview immediately. No text-content fields, font selectors, color controls, or
export controls are added.

## Settings Contract

Extend `FineDetailsSettings` with a `typography` object:

```ts
interface FineDetailsTypographySettings {
  lowerRight: {
    bodyFontSize: number;
    bottom: number;
    gap: number;
    headingFontSize: number;
    right: number;
  };
  upperLeft: {
    fontSize: number;
    left: number;
    top: number;
  };
}
```

The Toolcraft preview protocol advances from version 2 to version 3 so stale preview
messages cannot be mistaken for the expanded settings shape.

Use bounded finite-number normalization for every new value. Insets and gap are
non-negative. Horizontal and vertical insets use a `0–8192px` range so they cover the
existing maximum editable section dimension. Heading and body sizes use `8–512px`,
and the internal gap uses `0–512px`. All values use a one-pixel step.

## Apply and Reset

- Live edits update only the Toolcraft iframe preview until Apply is used.
- Apply persists the complete Fine Details settings object, including typography, to
  the local website settings file and updates the adjacent website tab.
- Reset restores background, grid, section height, prompt position/shadow, and all new
  typography values to their defaults in both Toolcraft and the website.
- Existing validation and save-result messaging remain the error boundary for malformed
  or failed settings updates.

## Implementation Scope

- Add Toolcraft target/default/value adapters for the typography settings.
- Add the two Toolcraft control sections.
- Extend preview, apply, reset, acceptance-data, performance, and worklog settings
  snapshots with the new shape.
- Extend website settings types, defaults, normalization, and applied JSON.
- Render both typography groups in `FineDetailsSection` using existing font aliases.
- Do not change the prompt component, prompt geometry, background grid asset, section
  height behavior, or unrelated Hero/gallery code.

## Verification

Per the project workflow for this app, hand the implementation off for local manual
review without running the full test, lint, typecheck, build, or browser suites.

The manual review should confirm:

1. The default 1920 × 1080 preview visually matches the updated Figma composition.
2. Every new control updates the expected measurement live.
3. The two groups stay anchored to their specified edges while values change.
4. Apply updates the website in the adjacent tab.
5. Reset restores the complete Fine Details default state in Toolcraft and the website.
