# Dot Ring Studio Default Background Design

## Context

Dot Ring Studio currently initializes `appearance.background` from the schema
with `#030A16`, while its defensive settings fallback still uses `#1e1b00`.
The requested default is `#0C1A32`.

## Approved Outcome

- Fresh Dot Ring Studio state uses `#0C1A32` as its background color.
- `Reset controls` restores `#0C1A32`.
- Preview, Infinity canvas presentation, PNG export, and video export continue to
  consume the same runtime background setting.
- Existing user-authored values restored from local persistence remain intact.
- No deployment is included because the request only changes the application
  source default.

## Approaches Considered

1. Update the schema default and the settings fallback together. This is the
   selected approach because fresh/reset state and malformed-state recovery stay
   aligned.
2. Update only the schema default. Rejected because an incomplete value state
   could still resolve to the old fallback color.
3. Bump persistence version 2. Rejected because a default-only change does not
   justify deleting saved canvas, panel, timeline, or creative settings.

## Implementation Design

Change the background in two product sources:

- `src/app/app-schema.ts`: set the authored `appearance.background` color
  control default to `{ hex: "#0C1A32" }`.
- `src/app/dot-ring-settings.ts`: set the `readColorHex` fallback for
  `appearance.background` to `#0C1A32`.

Add focused coverage that creates fresh runtime state, resolves Dot Ring
settings, and asserts `#0C1A32`. Extend the existing real browser control check
to assert the visible `Background color` field begins with the same value before
testing color changes.

The Background/Infinity dependency, renderer draw algorithm, export composition,
control layout, persistence key/version, palette, canvas defaults, and animation
settings remain unchanged. Invalid or missing background state safely resolves to
the same new default.

## Verification

Classify this as an ordinary Tier 2 default change. Use the focused schema/settings
test and the existing browser background-control scenario during development.
At the coherent delivery boundary, run one bare `npm run verify:delivery` so the
app-local protected runner derives the exact required proof. Do not run the full
performance audit because the request does not change renderer workload or report
a performance problem.

## Risk

A browser with a previously saved custom background continues to show that value
until the user resets or changes it. This is intentional persistence behavior;
fresh state and Reset receive `#0C1A32`.
