# Creative Apps Kit Template Local Docs

This folder is the local operational reference for a standalone Creative Apps Kit template app.

Use `../../AGENTS.md` as the entry contract. Use these docs when a decision needs more detail:

The starter app itself is intentionally neutral. It should show the Creative Apps Kit canvas/upload/toolbar baseline only until the product schema is authored. Demo controls, prompt inputs, layers, and timeline belong in tests/docs or in a real generated product that needs them.

1. `assembly-workflow.md` — how the app must be assembled.
2. `decision-contract.md` — hard rules, defaults, heuristics, and escape hatches.
3. `schema-reference.md` — how to write `src/app/app-schema.ts`.
4. `component-rules.md` — component-specific layout and behavior rules.
5. `acceptance-testing.md` — how every visible entity proves it works.
6. `performance.md` — performance matrix and responsiveness gates.
7. `renderer-technique.md` — how to choose DOM, SVG, Canvas 2D, WebGL, WebGPU, or mixed rendering.
8. `agent-worklog.md` — implementation decisions, evidence, verification, and risks.
9. `custom-controls.md` — how to register custom controls without editing `src/creative-apps-kit`.

`agent-worklog.md` starts as a neutral starter template. Once the folder becomes a product, change it to `Mode: product` and record concrete renderer, timeline, layers, controls, export, and performance decisions with evidence. The final test gate fails if this worklog is missing, stale, or lacks verification.

Every implementation pass must choose a verification tier before editing. Use the smallest tier that covers the changed surface, and move one tier higher when unsure.

| Tier | Use for | Typical command |
| --- | --- | --- |
| Tier 0 | Docs/copy only | targeted docs/typecheck |
| Tier 1 | One control or panel visual state | targeted test + focused browser check |
| Tier 2 | Schema, defaults, persistence, actions, product mapping | `pnpm verify:quick` + relevant browser acceptance |
| Tier 3 | Renderer, canvas, timeline, layers, upload, export, zoom, heavy controls, performance-sensitive post-generation iterations | `pnpm verify:quick` + targeted browser/perf scenarios |
| Tier 4 | Final delivery, fresh export, runtime/template/contract changes, broad renderer/product rewrites | `pnpm verify:final` |

Major iterations after a working app exists must run `pnpm verify:perf` or `pnpm verify:final` before completion.

Fresh folders or dependency changes need `pnpm install` before verification. Final delivery still starts the local app after the gate:

```bash
pnpm verify:final
pnpm dev
```

Do not kill existing local servers to free `3002`. Dev, preview, and browser verification prefer `3002`, then move to the next free port automatically.
