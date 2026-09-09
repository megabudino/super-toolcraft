# Toolcraft Workflow

<!-- toolcraft-performance-lifecycle: prototype=bounded-smoke; ordinary=exact-targeted; complaint=one-bounded-performance-iteration; repeated-complaint=another-bounded-performance-iteration -->
<!-- toolcraft-performance-iteration: selectors=exact-affected-functional+canonical-performance; fixture=reachable-development; after-pass=return-app-to-user+stop -->
<!-- toolcraft-performance-full-authority: automatic=forbidden; recommendation=two-compatible-iterations-or-broad-unlocalizable-problem; command=npm run verify:perf; authority=explicit-user-request-or-accepted-offer -->

This file is the app-local routing layer for Toolcraft work. It does not replace the detailed contracts; it tells an agent which contract to read and which verification path to use before editing.

## Required Preflight

Before planning or editing app code, runtime code, controls, canvas, panels, renderer, timeline, layers, export, or tests:

1. Confirm the nearest `AGENTS.md` is the active project contract.
2. Classify the project type:
   - **Generated app**: use local `docs/toolcraft/*`.
   - **Starter source**: use `starter/AGENTS.md`, local starter docs, and runtime contracts.
   - **Runtime/template source**: use root `AGENTS.md` and runtime contracts.
3. Classify the task type.
4. Read the task-specific docs below.
5. Choose and record one verification tier for the coherent user-visible delivery batch before implementation.

Do not edit implementation files until this preflight is complete.

Renderer and performance work also completes this pre-code sequence: reachable controls and inputs; workload dimensions and enforced boundaries; pass cost, frequency, lifecycle, and invalidation; render-plan assessment and protected kernel benchmark when required; derived paths and combined fixtures. Keep the product implementation impact inventory current while implementing. Development uses impact-derived targeted checks without minting delivery evidence; the first product delivery receives bounded prototype smoke, and a performance complaint receives one targeted iteration. Full certification is a separate operator/CI action described in the canonical performance docs.

## Local Contract Authority

The signed local `AGENTS.md` plus `docs/toolcraft/*` are sufficient and mandatory workflow input for a standalone generated app. External workflow skills should be used when available, but missing skills never invalidate `--no-skills` generation and never justify skipping the equivalent local spec, plan, debugging, browser, or verification requirement. `npm run ai:check` enforces local code health and reports missing external skills as actionable guidance rather than a build failure.

Core modules are required reading when listed by the routing table. Read each listed module fully, one phase at a time. Open exactly one listed document per terminal or tool read, even when several documents belong to the same route and phase. Do not concatenate documents or rely on a truncated excerpt; finish the current phase, then open the next phase when the work reaches it. The signed host and runtime validators enforce platform boundaries, while product organization remains open inside those boundaries.

## Task Routing

Use the smallest route set that covers the changed surface. When a task matches multiple routes, process them sequentially inside the phase currently in progress and skip documents already read in that phase; open each document separately and never concatenate route documents into one terminal output. Read Plan documents before the spec or implementation plan, Implementation documents immediately before code, and Verification documents immediately before writing or running proof. A broken behavior still starts with the failing test, log, or reproduction before its Plan documents; a Figma task still starts with Figma MCP/design context.

[//]: # (toolcraft-workflow-routes:start)
| Task route | Plan phase | Implementation phase | Verification phase |
| --- | --- | --- | --- |
| App assembly, route structure, generated app porting | `core/runtime-boundary.md`<br>`assembly-workflow.md` | `decision-contract.md` | `acceptance-testing.md` |
| Reference app study, audit, or port | `core/reference-study.md`<br>`core/runtime-boundary.md`<br>`assembly-workflow.md` | `schema-reference.md`<br>`decision-contract.md` | `acceptance-testing.md` |
| Schema, controls, defaults, persistence, actions | `core/control-selection.md`<br>`core/layout.md` | `schema-reference.md`<br>`component-rules.md` | `acceptance-testing.md` |
| Custom controls | `core/control-selection.md`<br>`core/layout.md` | `custom-controls.md`<br>`component-rules.md` | `acceptance-testing.md` |
| Renderer, canvas output, visual technique | `core/runtime-boundary.md`<br>`core/performance.md` | `renderer-technique.md`<br>`performance.md` | `acceptance-testing.md` |
| Timeline, keyframes, animation transport | `core/timeline-animation.md`<br>`core/performance.md` | `decision-contract.md`<br>`component-rules.md` | `acceptance-testing.md` |
| Layers | `core/runtime-boundary.md`<br>`core/layout.md` | `decision-contract.md`<br>`component-rules.md` | `acceptance-testing.md` |
| Export, copy, media, background | `core/setup-export.md`<br>`core/media-upload.md` | `schema-reference.md`<br>`component-rules.md` | `acceptance-testing.md`<br>`performance.md` |
| Broken control, visual mismatch, failed build, export bug, performance issue | `decision-contract.md`<br>`core/runtime-boundary.md` | `component-rules.md`<br>`renderer-technique.md` | `acceptance-testing.md`<br>`performance.md` |
| Figma implementation | `core/reference-study.md`<br>`core/runtime-boundary.md`<br>`assembly-workflow.md` | `schema-reference.md`<br>`component-rules.md` | `acceptance-testing.md` |
[//]: # (toolcraft-workflow-routes:end)

## Worklog Gate

For product app work, update `docs/toolcraft/agent-worklog.md` before reporting completion. Record:

- one `Decision Trail` entry for each coherent user-visible delivery batch, including:
  - request;
  - task type;
  - user-visible result;
  - source/reference checked;
  - docs/contracts read;
  - contract rules applied;
  - typed view interaction mode, evidence, and orientation target mapping when the product has a spatial scene;
  - typed interaction ownership for operations that could live on canvas or in the panel, including evidence, selected surface, rejected duplicate surface, and complementary operations;
  - decision;
  - alternatives rejected;
  - state/output mapping from controls, commands, timeline, layers, media, or renderer to the visible product;
  - files changed;
  - verification;
  - skipped checks with reason;
  - risks or follow-ups.
- updated high-level decisions for renderer, view interaction, interaction ownership, timeline, layers, controls, export, and performance when those choices change.

If the folder is still the neutral starter, do not invent product decisions. Once it becomes a product, switch the worklog to product mode and keep it concrete.

## Runtime Boundary

Use the runtime extension points described in the current contracts:

- schema controls;
- `canvasContent` for product output only;
- `controlRenderers` only for true custom controls;
- `onPanelAction` for sticky product actions;
- runtime commands and hooks.

Do not recreate controls, panels, toolbar, timeline, layers, canvas shell, or runtime surfaces by hand. If a shared behavior is wrong, fix the shared runtime/template source and regenerate when needed.

Browser verification is outcome-based. Protected helpers attach versioned evidence only after a persistent observable change, an observed fixture application, a decoded non-empty export inspection, a completed output action, an immutable scenario measurement, and its matching budget check. The signed reporter derives required evidence from acceptance and performance config and fails skipped, missing, duplicate, transient, unmeasured, or unbudgeted scenarios.

## Verification Gate

Choose the tier from `AGENTS.md` before editing. Use the tier to decide checks.

- Tier 0-1: targeted docs/typecheck/unit plus focused browser when visual.
- Tier 2: targeted tests plus relevant browser acceptance during development; exact selectors through `npm run verify:delivery` at delivery.
- Tier 3: targeted browser acceptance and only affected performance scenarios during development; exact impact-derived proof through `npm run verify:delivery` at delivery.
- Tier 4: run `npm run verify:delivery` once after the coherent batch stabilizes, then start `npm run dev`. The protected lifecycle owns prototype functional-plus-smoke proof and later exact targeted proof.

First product delivery runs full functional acceptance plus bounded production-build prototype smoke; it does not require a baseline or run the complete matrix. Ordinary later delivery uses exact targeted checks only. A performance complaint runs one `performance-iteration` with exact affected functional and canonical performance selectors, returns the verified app, and waits for user evaluation; another complaint starts another bounded iteration. After two consecutive compatible iterations, offer the slower complete audit if the user remains unsatisfied. Full `npm run verify:perf` remains an operator command and runs only after an explicit user request or accepted agent offer; the user does not need to know its name.

Canonical classification details, failure behavior, and evidence wording live in `core/performance.md` and `performance.md`. Fast feature loops use focused non-durable checks; filename, verification tier, and touched subsystem do not trigger the full suite by themselves.

The app is not complete when required checks are failed, incomplete, pending, blocked, or listed as skipped. Resolve benchmark requirements with `pnpm verify:kernel` before accepting the renderer. At the delivery boundary run `npm run verify:delivery` with `--tier=<tier>` and any exact `--unit-test=<path>`, `--browser-test="browser: exact title"`, or `--performance-test="browser perf: exact title"` selectors required by `app-performance-impact.json`. The runner executes protected integrity and the lifecycle-specific checks atomically, binds evidence to exact pass ids, canonical path ids, test names, and current source, then advances the delivery anchor only after success. Do not precede it with `verify:quick` or follow it with `verify:perf`, `verify:perf:record-iteration`, or `verify:final` for unchanged source.
