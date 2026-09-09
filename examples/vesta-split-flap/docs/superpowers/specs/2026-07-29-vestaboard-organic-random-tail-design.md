# Vestaboard Organic Random Tail Design

## Goal

Make the sparse random-field tail look organic instead of forming synthetic vertical or diagonal bands when `fillStart` is high, `fillEnd` is low, and `Final hold` keeps the tail visible.

## Context

The attached settings use a full starting field (`field.fillStart=100`), an empty ending field (`field.fillEnd=0`), a long per-cell duration range (`field.durationRange=[39,74]`), and `field.seed=137`. Near the end of playback, the visible background cells are the cells whose seeded duration is still above the current field progress.

The current helper computes seeded range values with one linear expression over the linear cell `index`. That is deterministic, but sparse threshold selections reveal the sequence's regularity as vertical and diagonal grid-like bands.

## Design

- Keep the same controls and saved setting shape.
- Keep deterministic output: the same seed, canvas, timeline, and settings still produce the same frame in preview, PNG, and video.
- Add a small avalanche-style 32-bit mixer for the random-field stream.
- Use the mixed stream for random-field occupancy, duration, opacity, and glyph selection only.
- Keep the existing phrase/drum seeded stream unchanged so target text movement and previously tuned phrase timing do not shift.
- Keep all seeded values pure functions of `(seed, index, salt)` or `(seed, index, flicker bucket)`.
- Do not add visual noise after layout; fix the source random stream so sparse duration thresholds are spatially decorrelated.
- Add regression coverage using the user's sparse-tail settings shape and assert that the active tail has enough adjacency and avoids excessive isolated single-cell columns.

## Verification Tier

Verification tier: Tier 3
Reason: deterministic animated renderer/model output changes for the random field and applies to preview/export parity.
Run: targeted model tests, TypeScript, app contract tests, `pnpm verify:quick`, focused browser acceptance for Final hold/random tail, and relevant performance checks.
Skip: full final gate unless quick/perf finds broader runtime drift.

## Spec Self-Review

- No placeholders.
- The change is scoped to seeded randomness, not UI controls.
- The same model still drives preview, PNG, and video.
