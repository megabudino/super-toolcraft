# Studio Room Center Composition Design

## Goal

Replace the current central Studio Room title with the Figma composition from node `6105:1330` and expose only the live visual controls needed to tune it in Toolcraft.

## Composition

- Center the entire composition inside the Studio Room back wall.
- First row: `TRY IN RECRAFT`.
  - `TRY` and `IN`: ABC Gravity Condensed Bold Italic.
  - `RECRAFT`: ABC Gravity Condensed Ultra upright.
  - Figma base size: 96px.
- Second row: `STUDIO` in ABC Gravity Expanded Ultra Italic.
  - Figma base size: 128px.
- Button: `Try it for Free` in Geist Medium, 22px, black text, `#D5F940` fill, 12px radius, 26px horizontal and 20px vertical padding.
- Only the button is interactive. It links to the existing Recraft Studio login URL.

## TRY IN Font Asset

- Use the supplied `ABCGravityCondensedTrial-BoldItalic.otf` as the exact source for `TRY` and `IN`.
- Convert that source to WOFF2 so it follows the existing website font-asset convention.
- Register it as a dedicated local `ABC Gravity Condensed Bold Italic` face and expose a dedicated font variable/class.
- Apply the new face only to `TRY` and `IN`; do not replace the existing shared condensed italic face or change typography elsewhere.
- Keep the authored bold-italic weight/style metadata instead of synthesizing either property in CSS.

## Live Toolcraft Controls

Add a `Center Composition` section with four live controls:

1. `First row scale`: 50–150%, default 100%.
2. `Second row scale`: 50–150%, default 100%.
3. `Line gap`: -40–80px, default -12px to match Figma overlap.
4. `Button gap`: 0–160px, default 6px after reducing the approved Studio Room spacing by 40px.

Scaling must preserve each row's internal proportions and keep the combined composition centered. Changing either gap must participate in layout rather than visually translating an element outside the centered stack.

## Data Flow

Extend the existing Studio Room settings payload and iframe live-sync protocol with a `composition` object containing `firstRowScale`, `secondRowScale`, `lineGap`, and `buttonGap`. Normalize and clamp these values on both Toolcraft and website sides. The website renderer consumes the values directly.

Do not add or modify Apply/Reset behavior. Do not add new actions, persistence workflows, assets, or interaction states.

## Verification Scope

Run only focused settings/control tests and a quick browser load of the existing Studio Room preview. Do not run aggregate, build, or broad browser suites.
