# Imported default settings

Request: «сделай эти настройки дефолтными сильные проверки не запускай».
Source: `/Users/kusnizza/Downloads/logos-grid-settings (2).json` (Toolcraft settings v2), superseding the first file after the user's «вот эти делай» correction in the same batch.

Verification tier: Tier 2
Reason: Schema defaults only; renderer, controls, persistence mechanics, and export implementation remain unchanged.
Run: focused schema/defaults and workload-configuration unit tests, typecheck, one short browser check for fresh defaults and section reset.
Skip: production build, aggregate delivery gate, export matrix, full browser suite, and measured performance, per the user's explicit no-heavy-checks instruction. No new protected receipt is claimed.

1. Set `app-schema.ts` defaults to Grid, 63 points, radius 360, logo size 110, depth 66, perspective 2.2, fisheye 46, the exact second-file orbit pose, mask 109, feather 30, rear opacity 10, stroke 0.5, and Infinity canvas. All other exported `values` already match. Preserve finite 1920×1080 sizing, 2× backing, existing default source media, and the 12-second timeline.
2. Align workload metadata in `app-performance.ts` and its focused tests with the new schema defaults, without changing boundaries/passes or running measurements.
3. Add a schema test for the supplied defaults and fresh canvas mode. Verify schema values against every key in the external JSON in a diagnostic browser session, then change/reset one sphere property and observe output.
4. Record the decisions and limits in the worklog. Preserve existing browser persistence; users may Reset controls to apply the new defaults to an existing workspace.

Runtime limitation: the supplied paused playhead at 2.073000000005625 seconds is workspace transport state, not a configurable schema default. Do not patch signed runtime/host code or add a mount-time command that overrides persisted transport. Schema supports only the already-matching timeline duration here; the exact paused frame remains available via ordinary settings import.

Preflight: schema/defaults route (control selection, layout, schema reference, component rules, acceptance) plus existing performance configuration contracts for workload-default alignment. No new product operation or interaction owner is introduced.
