# Hero settings defaults

Request: Make `/Users/kusnizza/Downloads/hero-settings.json` the defaults, without unnecessary checks. Target the existing native hero preview on port 3005.

Verification tier: Tier 2, later focused defaults edit.
Reason: Only authored mask defaults and the timeline's default loop duration differ; no control model, renderer, viewport, persistence implementation or artifact changes.
Run: Exact defaults/reset regression plus existing duration-default assertions, using one filtered Vitest invocation.
Skip: Browser/GPU, build, typecheck, aggregate delivery, performance and persistence/reload matrices per the user's minimal-check instruction. Existing saved sessions must not be reset to inspect fresh defaults.

## Plan

1. Retain the supplied settings as a dated reference fixture; preserve the earlier reference and legacy motion defaults not present in the new file.
2. Update the first mask's opacity to 100 and stretch to 1.8 in `src/app/domain/wave-default-values.ts`; set `FLOW_DURATION_SECONDS` to 8 in `src/app/domain/flow.ts`. Other supplied control defaults and canvas geometry already match.
3. Align default/reset tests and timeline acceptance descriptions with this reference. The runtime schema supports a duration default but not initial transport time/play state; do not add mount-time overrides or rewrite persisted workspace state. The captured cursor and paused status remain session state, not new schema defaults.
4. Run the focused default tests and record the result in `docs/toolcraft/agent-worklog.md`.

Preflight: writing-plans skill; workflow; schema/defaults and timeline routes through control-selection, layout, timeline-animation, core/performance, schema-reference, component-rules, decision-contract and acceptance-testing. No new behavior specification, reference motion, renderer, controls, layers or export work is needed.
