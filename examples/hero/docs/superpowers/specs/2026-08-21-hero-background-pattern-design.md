# Hero Background Pattern Design

## Request

Add editable hero background color and a native checker pattern matching the supplied 64 × 64 PNG. The tile contains a 2 × 2 checker: two opaque white squares alternating with two transparent squares. Users must be able to change the square size, pattern color, and pattern opacity.

## Product Behavior

- Keep the existing runtime-owned `Background` switch and `Background color` control in Setup.
- Add a separate `Pattern` product section so the runtime can continue relocating the canonical background pair into Setup.
- `Pattern` contains:
  - `Pattern` Switch targeting `background.pattern.enabled`;
  - `Color & opacity` Color Opacity control targeting `background.pattern.colorOpacity` with canonical `{ hex, opacity }` state;
  - `Square size` continuous Slider targeting `background.pattern.squareSize`.
- The Pattern section is hidden while the runtime Background is off. Pattern color and square-size controls are visible only while the pattern is enabled.
- Pattern defaults to off so existing compositions do not change. Its authored defaults are white at 12% opacity and 32px per square.
- Turning the runtime `Background` switch off hides both the solid hero color and the pattern. Turning it back on restores the current pattern settings.
- Reset, undo/redo, persistence, and settings transfer use the canonical Toolcraft values.

## Control Selection

- Use built-in `switch` for pattern presence.
- Use built-in `colorOpacity` because one pattern entity owns both color and opacity.
- Use built-in continuous `slider` for square size, bounded to 4–160px with a 1px step.
- Keep these controls in one `Pattern` section because they jointly define one hero-background pattern entity.
- Panel owns all pattern editing. No canvas handles or direct manipulation are added.

## Rendering

- Extend the versioned iframe settings protocol from version 7 to version 8 with nested `pattern` settings.
- Normalize pattern input on the website and clamp canonical opacity to 0–100 and square size to 4–160px. Convert the percentage to CSS layer opacity only at the render boundary.
- Render one pointer-transparent absolute background layer inside `HeroV4Styles`.
- Build the checker natively with a CSS `conic-gradient`, sized to twice the selected square size in both directions. No bitmap, SVG, data URL, canvas, or additional request is used.
- Place the pattern above the solid section background and below cards, heading, prompt, and announcement content.

## Performance And Lifecycle

- This is ordinary product work. The controls update retained DOM style variables and add no renderer pass, animation, resource, workload dimension, or measured-performance authority.
- Pattern changes join the existing preview synchronization pipeline as responsiveness controls.

## Verification Boundary

- This is later Tier 2 schema/product behavior work.
- Per the user's standing instruction for this app, implementation is handed off without running unit tests, feature tests, browser checks, lint, typecheck, or build.
- Acceptance metadata and the worklog are updated so a later reviewer can run the relevant checks explicitly.

## Risks

- Very small squares can create a visually dense pattern; the 4px minimum keeps the CSS tile bounded.
- High opacity intentionally creates strong contrast over the selected background color.
- Protocol version 8 must match on both Toolcraft and website sides.
