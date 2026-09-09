# Vestaboard Final Hold Design

## Goal

Add a user-controlled tail after the main phrase animation where the overall playback/video becomes longer, the main phrase keeps its original timing, and the random/background board letters are stretched across the longer total duration.

## Context

The previous implementation mapped `Final hold` by making phrase progress reach `1` inside the existing timeline duration. That created the requested visual tail but did it by shortening the main text animation. The product needs the opposite behavior: changing `Final hold` should extend the runtime timeline by that amount, preserving the main phrase duration and stretching the background field over the new total duration.

The attached settings example has a short `3s` timeline, strong background removal (`field.fillStart=100`, `field.fillEnd=0`), and `board.flip.shake=23`. The model currently computes shake from all flipping cells and applies one foreground transform to phrase and background together, so background flips near the end can move a target phrase letter such as `R` even after the phrase itself is settled.

## Design

- Add a Board Message slider named `Final hold`, target `board.text.finalHoldSeconds`, with seconds as the unit.
- Default is `0s` so existing settings preserve current timing.
- Clamp the value from `0` to `8` seconds.
- When the Final hold value changes by direct control interaction or reset, adjust runtime `timeline.durationSeconds` by the same delta. For example, if the timeline is `3s` and Final hold changes from `0s` to `2s`, the runtime timeline becomes `5s`; the main phrase still uses the first `3s`, and the background field uses the full `5s`.
- When Settings Transfer imports both a Final hold value and a timeline duration, do not add the delta a second time; imported timeline duration is already authoritative.
- Split timeline progress through a shared model helper:
  - `durationSeconds` means total runtime duration, including Final hold.
  - `fieldProgress` remains `timeSeconds / durationSeconds`.
  - `phraseProgress` reaches `1` at `durationSeconds - Final hold`.
  - Because the timeline is extended by the Final hold delta, the phrase duration is preserved instead of compressed.
  - If Final hold is longer than the timeline after import/manual duration edits, keep at least `0.1s` for the phrase transform and use the remaining time as the effective hold.
  - If no target message exists, phrase progress stays `1`.
- Use the shared split progress helper in live preview, PNG export, and video export so all outputs match.
- Compute board shake from phrase flipping cells only, so a settled target phrase stays visually stable while background cells continue their held tail.
- Add acceptance/performance coverage for the new control and browser coverage proving the phrase is final while background cells are still mid-animation.

## Verification Tier

Verification tier: Tier 3
Reason: timeline-driven renderer/export progress mapping, runtime timeline duration sync, and shake behavior change.
Run: targeted model tests, TypeScript, app contract tests, focused browser acceptance/perf for Final hold and stable final phrase shake, `pnpm verify:quick`, and visual smoke on the running dev URL.
Skip: full final/perf unless focused checks show renderer workload drift.

## Spec Self-Review

- No placeholders.
- The default preserves existing saved behavior.
- Preview, PNG, and video use the same progress split.
- Final hold now changes runtime timeline duration by direct user delta so the overall animation becomes longer.
