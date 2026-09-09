# Prompt Position Pad Design

## Goal

Let the user move only the AI prompt popup across the Hero Scene Lab canvas from a two-axis pad in the Toolcraft controls panel. The V4 badge, `RECRAFT STYLES` heading, cards, and announcement strip keep their current placement.

## Selected design

Add a one-control `Prompt` section containing the built-in Toolcraft `Vector` control:

- target: `prompt.position`;
- label: `Position`;
- coordinate mode: `screen`;
- normalized X/Y values from −1 to 1;
- default: `{ x: 0, y: 0 }`, preserving the current website layout.

The operation is a stable, directly authored two-axis product parameter, so `Vector` is its exact built-in owner. The panel is the sole interaction owner; the iframe remains pointer-transparent so canvas pan and zoom continue to work.

The Toolcraft app sends a nested `prompt.position` value through preview protocol version 6. The website validates and clamps both axes, maps them to responsive viewport offsets, and applies the transform only to the `AiPromptInput` wrapper. The popup keeps its existing responsive width, internal interactions, z-index above the cards, and default spacing from the heading. At extreme vertical positions, the existing hero overflow and announcement-strip stacking remain the visual boundary.

## Alternatives considered

1. Built-in `Vector` pad plus protocol extension — selected. It matches the requested panel interaction and preserves reset, history, persistence, and settings transfer.
2. Separate X and Y sliders — rejected because they split one spatial parameter and do not provide the requested pad interaction.
3. Direct canvas dragging — rejected because the user selected panel ownership, and making the iframe interactive would interfere with Toolcraft canvas pan/zoom.

## Data flow

`appSchema` value → `createHeroPreviewSettingsFromValues` → version-6 `postMessage` → `normalizeHeroSceneSettings` → prompt-only CSS transform in `HeroV4Styles`.

## Contract alignment

- Add `prompt.position` to panel interaction ownership with global selection scope.
- Add a dedicated `Prompt` section inventory entry because prompt placement is a complete one-control surface for a separate product entity.
- Add one Vector acceptance row with both `vector.x` and `vector.y` coverage.
- Add the target to the existing `preview-sync` control-drag invalidation path. It changes only retained DOM placement and adds no workload dimension, render pass, resource, or scheduled work.

## Verification

Verification tier: Tier 2 — schema/product behavior and cross-origin preview mapping change, while renderer technique and workload stay unchanged.

Run focused Toolcraft protocol/product tests, typecheck, code health, and `npm run test:feature -- prompt.position`. Run the website's available format, lint, typecheck, and build gates plus a focused browser/visual check proving X/Y movement, default restoration, and that the heading remains fixed. Record that architecture, unit-test, and e2e scripts are absent from this website checkout rather than inventing alternate commands. Do not run measured performance or the aggregate delivery gate.
