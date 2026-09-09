# Hero Heading CTA Design

## Goal

Add the Figma button from node `6061:442` to the existing Hero Heading group and make its authored appearance editable in Toolcraft, previewable through the Hero iframe bridge, and persistent through Apply and settings import/export.

## Figma source

- File: `Zdk7j8qu8hvslsrEFYsL9z`
- Node: `6061:442`
- Text: `See how it works`
- Font: Geist Medium, `18px`, line-height `1`, tracking `-0.36px`
- Fill: `#E6E6E6`
- Text color: `#000000`
- Radius: `10px`
- Padding: `20px` horizontal, `16px` vertical
- Natural rendered size: `179×50px`
- No image or icon assets

## Product behavior

The CTA is an anchor inside `data-hero-heading-group`, immediately after the two-line heading. It moves with the V4 badge and heading, remains below the gallery in the current stacking order, and links to `#hero-cta`, matching the existing header action.

The button owns these editable values:

- text;
- font size;
- horizontal padding;
- vertical padding;
- text color;
- background color;
- gap from the heading text;
- shadow enabled;
- shadow offset;
- shadow blur;
- shadow spread;
- shadow color and opacity.

Padding controls determine button height and width; there is no separate fixed width or height control. The CTA uses one line of text and preserves the Figma `white-space: nowrap` behavior.

## Settings and bridge

Add `heading.cta` to the canonical Hero scene settings. Normalize all untrusted preview, Apply, and imported settings at the existing boundary. The website and Toolcraft protocol advance together from v16 to v17 so older payloads cannot be mistaken for complete CTA settings.

The Toolcraft values model exposes stable targets under `heading.cta.*`. All controls are schema-owned and use existing built-ins: text, slider, color, switch, vector, and colorOpacity. No custom control is needed.

The CTA is the same logical `hero-heading-group` entity as the badge and heading. Because the group exceeds ten controls, its sections remain split by workflow stage:

- `CTA Button`: seven primary appearance/content controls;
- `CTA Shadow`: five conditional shadow controls.

## Rendering

Render a semantic `<a href="#hero-cta">` using the project font classes and dynamic inline style only for authored values. Use CSS `box-shadow` for the button shadow; it provides offset, blur, spread, color, and opacity without an additional SVG filter. Add a visible keyboard focus state that does not change the authored idle appearance.

## Acceptance

Focused source tests prove defaults, normalization/clamping, protocol v17, complete pipeline target registration, schema sections, and acceptance inventory. A focused browser check proves that Toolcraft edits update the iframe CTA and that Apply persists the same values. Visual QA compares the default button against the Figma screenshot at the current Hero scale.

## Verification tier

Verification tier: Tier 2 — schema/product behavior.

Reason: the change adds settings, controls, persistence, bridge protocol, and DOM product output without changing the WebGL renderer.

Run: focused Hero settings/protocol/Toolcraft tests, the CTA acceptance scenario, focused formatting, and `git diff --check`.

Skip: aggregate delivery, full browser matrix, build, and measured performance because this is later feature work with a bounded DOM/settings surface.
