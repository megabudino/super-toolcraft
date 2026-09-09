# Vestaboard Split Typography Design

## Goal

Give the Vestaboard separate font controls for the permanent phrase and the random background field text.

## Product Behavior

- Replace the single `Font` control with `Main font` for permanent phrase characters.
- Add `Background font` in `Random Field` for non-message filler characters.
- `Main font` targets `board.text.messageTypography`.
- `Background font` targets `field.typography`.
- Existing saved `board.text.typography` values remain a fallback for both new typography settings so older local state does not lose its font immediately.
- Text color remains shared across permanent and filler characters.
- Message wrapping, random fill, opacity, seed, cell layout, edge highlights, and PNG background behavior do not change.

## Renderer And Export

- DOM preview chooses typography per character: phrase cells use `messageTypography`; filler cells use `fieldTypography`.
- Canvas 2D export uses the same per-cell typography choice before drawing each visible character.
- `data-testid` values stay stable so existing product-output checks continue to target cells and characters.

## Acceptance

- Unit tests verify both typography settings resolve independently.
- Browser tests change `Main font` and verify a phrase character changes while a filler character does not.
- Browser tests change `Background font` and verify a filler character changes while a phrase character does not.
- Performance coverage splits the old font scenario into main-font and background-font scenarios because either control can repaint visible text.

## Verification

- `pnpm verify:quick`
- Focused Playwright tests for main/background typography.
- `pnpm build`
- `CREATIVE_APPS_KIT_TEST_PORT=3140 pnpm verify:final`
