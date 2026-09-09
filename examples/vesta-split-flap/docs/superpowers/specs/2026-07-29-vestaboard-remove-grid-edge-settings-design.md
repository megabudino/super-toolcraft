# Vestaboard Remove Grid And Edge Settings Design

## Goal

Remove the `Grid` and `Edge sides` settings from the Board Surface controls panel entirely.

## Context

The current Board Surface section still exposes two segmented controls at the top: `Grid` (`board.grid.preset`) and `Edge sides` (`board.cell.edgeMode`). The updated product specification does not allow those settings in the panel.

## Design

- Remove both controls from `src/app/app-schema.ts`.
- Remove `disabledWhen` links from Width and Height because they referenced the removed Grid preset target.
- Keep the renderer behavior deterministic by ignoring old persisted/imported values for removed targets: the model no longer exposes grid preset or edge mode settings, the grid is always tile-derived, and highlights render on the bottom edge only.
- Remove acceptance, performance, and browser coverage entries that require users to interact with the removed settings.
- Add/keep browser coverage proving the controls are absent and the remaining Board Surface controls still render as standalone rows.

## Verification Tier

Verification tier: Tier 2
Reason: schema-backed controls and test coverage change; renderer output is pinned to the former defaults, with no export or runtime shell changes.
Run: targeted unit tests, focused browser absence/layout test, `pnpm verify:quick`, visual smoke on the running dev URL.
Skip: full final/perf unless quick or focused browser shows renderer workload drift.

## Spec Self-Review

- No placeholders.
- Scope is limited to removing `Grid` and `Edge sides` settings.
- Hidden persisted values cannot re-enable the removed settings.
