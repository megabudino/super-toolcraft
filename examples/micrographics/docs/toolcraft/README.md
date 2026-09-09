# Toolcraft Template Local Docs

This folder is the local operational reference for a standalone Toolcraft template app.

Use `../../AGENTS.md` as the entry contract, then read `workflow.md` before planning or editing app work. Use the remaining docs when a decision needs more detail:

The starter app itself is intentionally neutral. It should show the Toolcraft canvas/upload/toolbar baseline only until the product schema is authored. Demo controls, prompt inputs, layers, and timeline belong in tests/docs or in a real generated product that needs them.

## Core modules

`workflow.md` routes agents to these focused modules by Plan, Implementation, and Verification phase. Read each selected route sequentially within the current phase, skip repeated modules already read in that phase, and never rely on truncated terminal output.

- `core/runtime-boundary.md` — Toolcraft shell, allowed extension points, canvas boundary, and generated-app source boundary.
- `core/setup-export.md` — required Setup, canvas sizing, render scale, Timeline switch, Background, Image Export, Video Export, and sticky export actions.
- `core/control-selection.md` — built-in control fit, exact owners, compound controls, actions, collection actions, vector ownership, and custom control gate.
- `core/layout.md` — sections, dependency cohesion, headers, reset, spacing, dividers, labels, inline rows, actions layout, colors, select, and segmented fit.
- `core/media-upload.md` — file/image upload, multi-upload, sorting, transform actions, canvas source images, default assets, and source material behavior.
- `core/timeline-animation.md` — animation intent, timeline requirement, compact/extended timeline, seamless forward loops, duration changes, keyframes, and video timing.
- `core/performance.md` — verification triggers, workload envelopes, compiled path fixtures, render scale, live slider responsiveness, renderer pipeline inventory, and optimization evidence.
- `core/reference-study.md` — reference-runtime clone, feature inventory, reference study, Figma source, video references, acceptance mapping, and worklog evidence.

The broad docs below remain supplementary topic references. They do not replace `workflow.md` routing or the `core/*` modules.

1. `workflow.md` — required preflight, task routing, worklog gate, and verification routing.
2. `assembly-workflow.md` — how the app must be assembled.
3. `decision-contract.md` — hard rules, defaults, heuristics, and escape hatches.
4. `schema-reference.md` — how to write `src/app/app-schema.ts`.
5. `component-rules.md` — component-specific layout and behavior rules.
6. `acceptance-testing.md` — how every visible entity proves it works.
7. `performance.md` — performance matrix and responsiveness gates.
8. `renderer-technique.md` — how to choose DOM, SVG, Canvas 2D, WebGL, WebGPU, or mixed rendering.
9. `agent-worklog.md` — implementation decision trail, evidence, verification, and risks.
10. `custom-controls.md` — how to register custom controls without editing `src/toolcraft`.

`agent-worklog.md` starts as a neutral starter template. Once the folder becomes a product, change it to `Mode: product`, add one `Decision Trail` entry per coherent user-visible delivery batch, and record concrete renderer, timeline, layers, controls, export, and performance decisions with evidence. Each batch explains the user-visible result, source/reference checked, contract rules applied, rejected alternatives, state/output mapping, and focused development checks. Worklog verification text is planning and audit context; only the protected source-bound receipt proves a passed delivery. The delivery gate fails if this worklog is missing, stale, or lacks decision-trail fields or verification context.

Each coherent user-visible delivery batch chooses one verification tier before editing. Steering and fixes inside the same request stay in that batch. Use the smallest tier that covers the changed surface, and move one tier higher when unsure.

| Tier | Use for | Typical command |
| --- | --- | --- |
| Tier 0 | Docs/copy only | targeted docs/typecheck |
| Tier 1 | One control or panel visual state | targeted test + focused browser check |
| Tier 2 | Schema, defaults, persistence, actions, product mapping | targeted tests and browser acceptance during development; exact selectors through `npm run verify:delivery` at delivery |
| Tier 3 | Renderer, canvas, timeline, layers, upload, export, zoom, heavy controls, or a touched performance-sensitive path | targeted browser and affected performance paths during development; exact impact-derived proof through `npm run verify:delivery` at delivery |
| Tier 4 | First product delivery, fresh export, runtime/template/contract changes, broad renderer/product rewrites | one protected `npm run verify:delivery` after the coherent batch stabilizes |

First product delivery runs full functional acceptance plus bounded production-build prototype smoke and needs no performance baseline. Normal later delivery uses exact targeted proof relative to the immediately previous successful delivery. A performance complaint runs one bounded `performance-iteration` with exact affected selectors, returns the verified app, and waits for user evaluation. Full `npm run verify:perf` is a separate operator/CI certification command. Use the current AI agent's controlled browser for targeted diagnosis and visual checks.

Performance workload limits come from reachable schema and enforced runtime/input boundaries. Targeted development, prototype smoke, and performance iterations use compiled development fixtures; operator full certification proves the applicable maximum without reducing selected quality or silently narrowing the product range.

The app is not delivered until `npm run verify:delivery` records a protected delivery receipt. Prototype smoke is not full performance certification; later deliveries use exact test names and impact-derived current-source coverage. Filename, tier, and touched subsystem never force the full suite by themselves. Do not compose `verify:quick`, performance, and `verify:final` around a successful delivery run for unchanged source.

Fresh folders or dependency changes need `npm install` before verification. Final delivery still starts the local app after the gate:

```bash
npm run verify:delivery
npm run dev
```

Do not kill existing local servers to free `3002` during a first start. Dev, preview, and browser verification prefer `3002`, then move to the next free port only while assigning this app's first saved port. After that, normal dev/preview starts use the saved port; if that port is already serving this app, report the existing URL instead of creating a second server. A launch is successful only after the selected port serves this app's Toolcraft server identity endpoint plus the `toolcraft-app-title` marker from `index.html`; never trust a port only because some server responds there. When restarting the same app server, use `npm run dev:restart` or `npm run preview:restart`; restart mode reuses the saved app port and stops only the listener on that exact port before starting again, forcing it only when the soft stop does not release the port, then verifies the identity before saving/reporting the port.
