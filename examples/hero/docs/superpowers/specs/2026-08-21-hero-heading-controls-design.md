# Hero Heading Controls Design

## Goal

Make the `V4` badge and two-line `RECRAFT STYLES` heading editable from Hero Scene Lab while preserving Toolcraft ownership of control state and the website's ownership of rendered output.

## Selected design

Add one `Hero Heading` controls section with five built-ins:

- `Recraft size` slider, 32–200 px;
- `Styles size` slider, 32–200 px;
- `Line gap` slider, −64–160 px;
- `Badge` switch;
- `Position` Vector pad, with normalized X/Y values from −1 to 1.

The position pad moves the badge and heading together across the fixed 1920 × 1080 Toolcraft scene. The prompt remains independently placed. The card gallery is rendered above the heading group, while the prompt and announcement strip remain above the gallery.

The Toolcraft app sends a nested `heading` payload through protocol version 5. The website validates the payload, maps normalized position to responsive viewport offsets, and applies responsive font-size multipliers that preserve the current default 48/60/72/80 px breakpoints when both line-size controls remain at 80 px.

## Alternatives considered

1. Built-in Toolcraft controls plus protocol extension — selected. It preserves reset, undo/redo, persistence, settings import/export, and the existing cross-origin boundary.
2. Custom drag handles over the iframe — rejected because the iframe is pointer-transparent and canvas manipulation would duplicate panel-owned property editing.
3. Query parameters or direct iframe DOM mutation — rejected because query parameters reload during editing and direct DOM access is blocked across localhost origins.

## Data flow

`appSchema` values → `createHeroPreviewSettingsFromValues` → version-5 `postMessage` → `normalizeHeroSceneSettings` → `HeroV4Styles` CSS variables and stacking order.

## Verification scope

This is later ordinary feature work. Per the user's request, skip aggregate delivery, browser, and performance verification. Run only the focused Toolcraft product mapping test, Toolcraft typecheck, website typecheck, and `git diff --check` if time permits.
