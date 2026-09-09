# Vestaboard Latest Starter Refresh Design

## Goal

Run a full rebuild-style refresh of the Vestaboard Creative Apps Kit app against the latest local starter contract in `AGENTS.md` and `docs/creative-apps-kit/*`, preserving the current product logic and behavior unless a contract, visual, or browser check exposes drift.

## Context

The app is already a product-mode Creative Apps Kit app. It uses `defineCreativeAppsKit`, renders through `CreativeAppsKitApp`, keeps Vestaboard output in `canvasContent`, exposes playback timeline transport, uses runtime Settings Transfer, includes background and PNG transparency controls, and provides Export Video plus Export PNG footer actions.

The current folder is not a git repository, so this refresh records evidence in docs instead of commits. The previous header PNG layer has already been removed; current visual QA must prove the live app no longer contains deprecated header-image or old layer-panel compositions.

## Control Section Inventory

- Board Surface: edits tile geometry, cell fill, border, edge mode, opacity distributions, fill coverage, and deterministic seeds because these controls define the physical board surface.
- Board Message: edits source and target messages, phrase removal timing, outgoing opacity, flash palette, main typography, and text color because these controls define the animated product text.
- Random Field: edits background filler start/end density, per-cell field animation timing, field typography, opacity, and seed because these controls define non-message tile content.
- Video Export: edits video format and quality because animated delivery settings must be separate from renderer and appearance controls.
- Background: edits output background and PNG include-background behavior because preview/video keep the background while PNG can be transparent.
- Export: exposes sticky product delivery actions only.

## Animation Intent Inventory

- Mode: playback timeline.
- Reason: users can play, pause, scrub, loop, set duration, export PNG at the current time, and export the full animation as video.
- Source of truth: renderer progress maps `state.timeline.currentTimeSeconds / state.timeline.durationSeconds`; no route-local transport UI is introduced.
- Interaction policy: animated DOM preview work is coalesced during controls-panel collapse and should remain responsive during canvas viewport interactions.

## Refresh Scope

1. Run the current starter validators and app tests through `pnpm verify:quick`.
2. Run the full final gate through `pnpm verify:final`, including browser acceptance and browser performance suites.
3. Run a real-browser visual layout audit on the current composition, including the minimum supported app width with the controls panel open and collapsed.
4. If a check fails, use systematic debugging to identify the exact starter-contract or visual drift, then fix only the failing app-specific surface.
5. Keep `src/creative-apps-kit` untouched unless a failure proves a shared runtime issue.
6. Update `docs/creative-apps-kit/agent-worklog.md` with the refresh evidence.
7. Start `pnpm dev` and report the actual free local URL.

## Expected Result

The app remains the same Vestaboard product, but it is proven against the latest local starter rules: product readiness, schema-backed controls, timeline, settings transfer, exports, acceptance coverage, performance coverage, docs integrity, browser acceptance, browser performance, production build, current visual composition, and a running local dev server.

## Verification Tier

Verification tier: Tier 4
Reason: full starter refresh can touch schema, renderer/export, acceptance, performance, docs, browser gates, and delivery evidence.
Run: targeted visual/collapse Playwright coverage, `pnpm verify:quick`, `pnpm verify:final`, browser smoke of the resulting dev URL, then `pnpm dev`.
Skip: `pnpm install` unless a missing package or dependency drift appears; dependencies and lockfile are already present.

## Spec Self-Review

- No placeholders or TODOs.
- Scope is focused on starter compliance refresh plus current visual composition QA, not product redesign.
- Product behavior remains unchanged unless a validator or visual check exposes drift.
- Verification commands are concrete and aligned with the local AGENTS contract.
