# Dot Formation Initial Palette Design

## Request

Match the app's initial colors to `/Users/kusnizza/Desktop/CleanShot 2026-07-27 at 10.13.23@2x.png`.

## Reference Read

The reference starts on a uniform warm gray-beige background. A sampled interior pixel is `#D4CECA`. The ring uses a broad, playful mix of coral, orange, lemon, olive, deep blue, powder blue, lavender, pink, and warm taupe. The colors remain individually legible instead of collapsing into one warm-to-cool rainbow.

## Approaches Considered

1. Replace the existing gradient stops and background defaults. This preserves the current editor, renderer, animation, and export behavior while changing the initial appearance. Selected.
2. Add a new named palette preset system. Rejected because the request concerns one initial state and does not require palette switching.
3. Change particle color assignment from gradient sampling to a discrete random color bank. Rejected because it would alter renderer behavior, performance scope, and the meaning of the existing editable gradient control.

## Design

- Keep `appearance.palette` as the existing built-in gradient control.
- Set the initial product background to the sampled `#D4CECA`.
- Replace the current seven-stop rainbow with a reference-led sequence covering coral, orange, lemon, olive, deep blue, powder blue, lavender, pink, and taupe, then close the angular gradient with the first coral stop.
- Keep background inclusion enabled by default.
- Keep persisted user-authored values untouched; new sessions and Reset use the new defaults.
- Keep the renderer and its malformed-state fallback unchanged; normal initial and Reset state is owned by the schema defaults.

## Verification

Verification tier: Tier 2

Reason: Schema product defaults and background-output defaults change, while control structure, state shape, renderer technique, animation workload, and export algorithms remain unchanged.

Run:

- Targeted schema unit test for the default background and palette.
- Focused browser check with cleared persistence for the initial canvas and Reset behavior.
- `npm run verify:delivery` with exact affected selectors.
- `npm run dev` after the delivery receipt.

Skip:

- Performance scenarios, because no renderer pass, primitive count, invalidation rule, canvas sizing, or export workload changes.
- Full browser matrix, because the change is limited to initial product values.
