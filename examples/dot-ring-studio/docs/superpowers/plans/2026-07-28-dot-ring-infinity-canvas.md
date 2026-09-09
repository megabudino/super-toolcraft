# Dot Ring Studio Infinity Canvas Implementation Plan

## Goal

Refresh Dot Ring Studio to the current Toolcraft starter and add its
runtime-owned Infinity canvas with canonical ring scene bounds.

## Implementation

1. Run `pnpm ai:check`, generate a fresh no-install/no-skills Toolcraft app in a
   temporary directory, compare manifests and dependencies, and synchronize
   only framework-owned files listed by the fresh signed manifest.
2. Migrate product entry points to the current `appComposition` host boundary
   while preserving `app-schema.ts`, the ring renderer, audio control, product
   acceptance/performance configuration, and thin signed routes.
3. Refactor `src/app/dot-ring-drawing.ts` to expose deterministic relaxed bead
   geometry used by both drawing and bounds.
4. Add `src/app/dot-ring-scene-bounds.ts` and focused tests for deterministic
   current-frame bounds, centered world coordinates, time-range union, visible
   shadow padding, and resolved-audio parity.
5. Wire `sceneBoundsProvider` into `src/app/app-composition.tsx`. Update preview,
   PNG, and video paths to use current starter background and scene-export
   helpers without adding app-authored canvas UI.
6. Update `src/app/app-schema.ts` with required Image Export settings while
   keeping Background, Infinity canvas, finite sizing, and Timeline
   runtime-owned. Preserve localStorage persistence of `canvas`.
7. Update product readiness, typed Infinity acceptance rows, browser evidence,
   performance ownership, and `docs/toolcraft/agent-worklog.md`.
8. Run focused unit tests, `pnpm verify:delivery`, start/reuse the dev server,
   load the app in a real browser, toggle Infinity canvas, pan/zoom, restore
   finite mode, and inspect the animated output.

## Verification Note

Verification tier: Tier 4

Reason: The implementation refreshes signed generated framework files and
adapts canvas, renderer, export, acceptance, and verification architecture.

Run: `pnpm ai:check`; focused Vitest/Playwright checks during development;
`pnpm verify:delivery`; `pnpm dev`; browser workflow visual and interaction
check.

Skip: `pnpm verify:perf` because current starter reserves the full performance
audit for an explicit operator request. Protected delivery supplies the
impact-derived performance proof.

