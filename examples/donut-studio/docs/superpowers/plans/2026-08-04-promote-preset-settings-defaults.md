# Promote supplied donut presets to defaults

## Product decision

Use `/Users/kusnizza/Downloads/donut-studio-settings.json` (SHA-256
`8d0f014256542236c107c213ed877a1b0b1a94381957fc16e880917e9d0bee64`) as
the exact authority for all ten named preset scene snapshots. Keep Matcha Cream
as the clean-start selection, place it first in the Flavor options and exported
preset library, and place Custom last. Do not promote the file's selected
Double Chocolate top-level workspace or its global image-export settings.

The Presets section inventory and interaction ownership stay unchanged: Flavor
owns named-scene choice, Reset flavor restores the selected source-backed
default, runtime Settings Transfer owns JSON import/export, and canvas orbit
continues to own `scene.orientation`. Timeline and layers remain disabled; no
custom control is introduced.

## Implementation

1. Add an app-owned, Matcha-first preset-default resource extracted from the
   supplied Settings JSON and load `DONUT_PRESETS` from that complete source.
2. Order Flavor options as Matcha, the other nine named scenes, then Custom.
3. Align clean-start Matcha defaults and the schema orientation pose with the
   supplied Matcha scene so initial mount, Reset, and the default preset library
   agree.
4. Update unit/browser acceptance to prove exact source-backed values, Matcha
   first in the real menu, Reset flavor behavior, and Settings JSON output.
5. Update verification impact ownership and the product decision trail.

## Verification

Verification tier: Tier 2

Reason: schema defaults, preset ordering, Reset flavor, persistence defaults,
and Settings Transfer payload change; renderer implementation and workload do
not change.

Run during development: focused preset/library/schema Vitest and the
`donut.preset` plus `donut.presetLibrary` browser acceptance scenarios.

Delivery: one bare `npm run verify:delivery`, then confirm the saved local app
port serves Donut Studio.

Skip: measured performance checks because the request changes static defaults
and option order without changing passes, invalidation, resource lifecycle, or
workload boundaries.
