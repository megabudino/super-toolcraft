# Vestaboard Single Column Board Surface Controls Design

## Goal

Make Vestaboard controls match the current UI rule that Board Surface controls cannot share one row in the right controls panel.

## Context

The Board Surface section declared explicit `layoutGroups` with `columns: 2`. The runtime rendered those groups through `ControlInlineGroup`, producing side-by-side rows such as Width/Height, Gap/Radius, Cell opacity/Bottom opacity, Cell seed/Bottom seed, and later Cell fill/Cell border. This is the wrong product layout for this app.

## Design

Keep the section grouping by product entity, but remove Board Surface inline layout groups entirely. Each Board Surface control should render as a standalone full-width row in schema order.

## Behavior

- Runtime values, targets, defaults, reset, persistence, settings transfer, renderer output, PNG export, and video export remain unchanged.
- Board Surface controls keep the same order.
- Cell fill and Cell border render as separate rows.
- No `src/creative-apps-kit` runtime or copied UI files are edited.
- Browser coverage must prove slider-like fields in Board Surface do not share the same horizontal row.

## Verification Tier

Verification tier: Tier 2
Reason: schema-backed controls panel layout changes without renderer, export, timeline, or runtime state changes.
Run: schema regression, focused browser layout regression, `pnpm verify:quick`, visual smoke on the running dev URL.
Skip: full browser performance suite because no renderer workload or interaction budget changes.

## Spec Self-Review

- No placeholders.
- Scope is limited to Board Surface layout in the controls panel.
- Product behavior remains unchanged.
- Verification commands are concrete.
