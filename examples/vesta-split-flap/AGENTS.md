# Creative Apps Kit App Template Assembly Guide

This is a standalone Creative Apps Kit template app generated from the base starter.

## Quick Entry Contract

1. Build through `defineCreativeAppsKit` and `CreativeAppsKitApp`.
2. Keep app state in Creative Apps Kit runtime schema and commands.
3. Keep product output in `canvasContent`; never render app UI there.
4. Use built-in Creative Apps Kit controls before custom controls.
5. Do not hand-compose runtime surfaces in routes with `CreativeAppsKitRoot`, `CanvasShell`, `ControlsPanel`, `TimelinePanel`, `LayersPanel`, or `ToolbarPanel`; fix shared runtime issues instead of replacing panel design locally.
6. Before writing controls, make a Control Section Inventory that groups controls by product entity or workflow stage, not by UI component type.
7. Enable layers and timeline only when product behavior requires them, then test the real UI.
8. Animated preview renderers suspend or coalesce non-essential animation work during canvas drag, pan, pinch, zoom, and radar/center interactions, then resume without changing user playback state.
9. If a Figma URL is provided, inspect the Figma file through MCP and rebuild from its structure; never implement from a screenshot or by eye.
10. Choose an explicit persistence policy; use schema `persistence` for user-edited app settings that should survive reload.
11. Use schema `settingsTransfer: "auto"` for complex apps that need import/export of control settings; never implement settings import/export through `panelActions` or route-local file inputs.
12. Product apps expose `Background` color and `Include background` controls and wire them into PNG export; live preview, workspace canvas backing, and video export keep the background.
13. Keep `docs/creative-apps-kit/agent-worklog.md` current with product decisions, evidence, verification, and risks.
14. Prove every visible entity through acceptance, browser, and performance coverage.
15. Workload performance scenarios must declare `stressFixture`; browser perf tests must use `getCreativeAppsKitPerformanceStressValue(appPerformance, scenarioId)` so heavy-case tests cannot use toy values.
16. Classify every implementation pass with a verification tier before editing. Use targeted checks for incremental edits and the full final gate only for final delivery, exports, or architecture/runtime/template changes.

## Starter Baseline

The generated folder starts as a neutral Creative Apps Kit shell: canvas upload plus toolbar. It intentionally does not include demo controls, prompt fields, layers, or timeline. Do not treat test fixtures or documentation examples as product requirements. Add controls, timeline, layers, sticky actions, persistence, and custom renderers only after the requested product or reference app requires them.

When the folder becomes a real product, update `src/app/app-acceptance.ts` from `appProductReadiness.mode: "starter"` to `mode: "product"` and fill `productName`, `productSummary`, and `requestedBehavior`. Renamed product folders are not allowed to keep neutral starter readiness.

## Local Reference Docs

Use this `AGENTS.md` as the entry contract. Use local docs for detail; the app must remain buildable without the website.

- `docs/creative-apps-kit/assembly-workflow.md` — runtime assembly, canvas output, and reference clone path.
- `docs/creative-apps-kit/decision-contract.md` — rule ids, levels, and enforcement expectations.
- `docs/creative-apps-kit/schema-reference.md` — schema authoring rules for `src/app/app-schema.ts`.
- `docs/creative-apps-kit/component-rules.md` — slider, segmented, color, upload, image picker, vector, layers, timeline, and footer action rules.
- `docs/creative-apps-kit/acceptance-testing.md` — app entity matrix and browser acceptance for `src/app/app-acceptance.ts`.
- `docs/creative-apps-kit/performance.md` — performance roles, scenarios, and workload coverage for `src/app/app-performance.ts`.
- `docs/creative-apps-kit/renderer-technique.md` — DOM, SVG, Canvas 2D, WebGL, and mixed renderer choices.
- `docs/creative-apps-kit/agent-worklog.md` — implementation decisions, evidence, verification, and remaining risks.
- `docs/creative-apps-kit/custom-controls.md` — custom control registration through `controlRenderers`.

## Edit Surface

- Build the product by editing `src/app/app-schema.ts` and app-specific files under `src/app` and `src/routes`.
- Keep route files thin: routes compose schema-backed app screens and product renderers.
- Keep `src/app/app-acceptance.ts` aligned with every visible product entity.
- Keep `src/app/app-performance.ts` as app-specific performance matrix config only.
- Do not paste, restore, or duplicate runtime validators inside `src/app/app-performance.ts`.
- Do not edit `src/creative-apps-kit` unless you are intentionally changing the local copied Creative Apps Kit runtime.
- Before final delivery, replace the starter worklog with `Mode: product` and concrete decisions for renderer, timeline, layers, controls, export, and performance. `pnpm test` fails if the worklog is missing or still describes the neutral starter.
- `pnpm test` includes Creative Apps Kit source integrity and local docs checks. If a desired control style is missing, fix the schema or regenerate from the upstream template/runtime; do not patch copied `src/creative-apps-kit` files for one app.

## Decision Contract Rule IDs

These ids mirror `CREATIVE_APPS_KIT_DECISION_CONTRACT` in `@/creative-apps-kit/template-runtime`. Keep this list synced so standalone instructions do not drift from runtime validators.

- `runtime-shell-required`
- `canvas-no-app-ui`
- `canvas-surface-preserved`
- `canvas-handle-placement`
- `panel-host-behavior`
- `layers-enable-only-when-needed`
- `layers-enabled-behavior`
- `timeline-mode-choice`
- `timeline-enabled-behavior`
- `controls-product-coverage`
- `output-export-required`
- `controls-layout-heuristics`
- `renderer-technique-inventory`
- `reference-clone-source-of-truth`
- `acceptance-product-observable`
- `performance-coverage-levels`
- `persistence-policy-explicit`
- `workflow-required`

## Runtime Contract

- Use `defineCreativeAppsKit` from `@/creative-apps-kit/template-runtime`.
- Render the app through `CreativeAppsKitApp` from `@/creative-apps-kit/template-runtime/react`.
- Use `<CreativeAppsKitApp schema={appSchema} />` for schema-only apps.
- Use `<CreativeAppsKitApp schema={appSchema} canvasContent={<ProductRenderer />} />` for custom product renderers.
- Use `renderDefaultCanvasMedia={false}` when a custom renderer replaces the default media preview.
- Use `CreativeAppsKitApp onPanelAction` for sticky footer product actions such as Generate, Apply, Export, Copy, or Download.
- Keep final app behavior in the schema and runtime command bus, not in isolated local control state.
- For animated products, write an Animation Intent Inventory before coding: use top playback timeline for product transport, keyframes timeline for editable property animation, and no timeline only for explicitly autonomous decorative output.
- For keyframes timeline apps, renderers read keyframed settings through Creative Apps Kit evaluated-value helpers/hooks. Do not parse timeline `valueLabel` strings or read raw `state.values` for keyframed targets.
- Use schema `defaultValue` for every resettable control.
- Route editor-owned actions through runtime commands such as `controls.reset`, `media.import`, `media.delete`, `canvas.center`, `history.undo`, and `history.redo`.

## Required AI Workflow Skills

AI must work on this app through the required workflow skills when the environment supports Codex skills. These skills are part of the task process, not optional reading.

- Before writing or changing an app spec, use `brainstorming` to decide product behavior, canvas sizing mode, panels, media flow, controls, export/copy behavior, renderer technique, timeline/layer choice, and ambiguous requirements.
- Before editing code from an approved spec, use `writing-plans` to produce a deterministic implementation plan focused on app files, tests, build, and browser verification.
- Before fixing any broken control, failed test, build failure, visual mismatch, export issue, or runtime regression, use `systematic-debugging` to find the root cause first.
- When the prompt includes a Figma URL, use Figma MCP/design context before implementation. Read the actual node, layer, component, variable, and asset structure; screenshots are only for final visual QA, not the source of truth.
- After implementation, use the `browser` workflow or equivalent local browser verification to test the running app, not only typecheck/build output. The automated browser gates are `pnpm test:browser` and `pnpm test:browser:perf`.
- Run `pnpm ai:check` before app generation or major changes.
- If a required skill is missing and the environment supports skill installation, install it before implementation and restart or refresh the session if the skill list does not update.
- If skill installation is not available, stop before implementation and tell the user exactly which required skills are missing.
- Do not silently skip required workflow skills, and do not replace them with an ad hoc plan.
- The Creative Apps Kit app contract overrides generic brainstorming approval and visual-companion rituals. If the user asks to build or port an app, that request is approval to produce the spec, plan, implementation, tests, build, and local run unless a product-critical ambiguity remains.
- Do not ask the user to confirm decisions already covered by this contract, the prompt, or the reference app. Record the decision in the spec and continue.
- Do not ask whether to enable a browser companion during brainstorming. Browser verification is mandatory after the app runs locally.
- In standalone folders that are not git repositories, save spec/plan files without asking about commit requirements.

## Verification Tier Classifier

Before editing, write a short verification note:

```md
Verification tier: Tier N
Reason: <changed surface and expected blast radius>
Run: <commands and browser checks>
Skip: <checks not needed for this pass and why>
```

Choose the tier by blast radius, not by line count. If uncertain, move one tier higher, not automatically to the full final gate.

| Tier | Use When | Required Checks |
| --- | --- | --- |
| Tier 0 — docs/copy | Documentation, comments, copy, labels, or titles change without schema targets, values, runtime behavior, renderer output, or layout mechanics. | Targeted docs/typecheck or targeted app test. Browser is not required unless visual text fitting is the risk. |
| Tier 1 — local control presentation | One control or panel visual state changes: spacing, hover, focus, disabled, marker visibility, label fit, or component variant display. Runtime state shape and product renderer are unchanged. | Targeted unit/component test plus one focused browser check for the affected control or panel. |
| Tier 2 — schema/product behavior | Controls, sections, defaults, persistence, panel actions, export actions, acceptance rows, or product behavior mapping changes. | `pnpm verify:quick` plus relevant browser acceptance. Run perf only when the changed control affects renderer workload or responsiveness. |
| Tier 3 — renderer/canvas/runtime feature | Custom renderer, animation loop, canvas sizing, upload/media, timeline, layers, toolbar, export bytes, WebGL/Canvas/SVG output, zoom, radar, history, heavy control behavior changes, or a post-generation iteration that touches renderer workload or viewport stability. | `pnpm verify:quick`, targeted browser acceptance, and relevant `pnpm verify:perf` scenarios for touched workload/viewport/export paths. |
| Tier 4 — final delivery/template architecture | Fresh generated app completion, folder export, commit-ready delivery, dependency changes, runtime/template/contract/CLI changes, broad refactors, or major post-generation iterations that rewrite renderer, canvas, animation, timeline/keyframes, layers, media, export, or control mapping. | Fresh folders run `pnpm install` once, then `pnpm verify:final`, then start `pnpm dev` to provide the local URL. |

Do not rerun `pnpm install` after every edit. Run it after fresh export, dependency changes, lockfile changes, or a missing package error.

Do not run the full browser performance suite for Tier 0-2 edits unless the edit changes renderer workload, animation, canvas viewport behavior, upload/export, or a performance-sensitive control.

Major iterations after a working app exists must not skip performance. Adding animation/keyframes/layers, replacing renderer technique, changing canvas behavior, changing many controls at once, or rewriting product output counts as Tier 3 or Tier 4 even if the app still builds. Run `pnpm verify:perf` or `pnpm verify:final` before reporting completion, and record the command in the verification note.

## Required Checks

For final delivery, run:

```bash
pnpm verify:final
pnpm dev
```

Use `pnpm install` before this final gate when the folder is fresh or dependencies changed.

`pnpm test` must include `node scripts/check-creative-apps-kit-docs.mjs`, `node scripts/check-creative-apps-kit-integrity.mjs`, and app tests. `pnpm verify:ui` / `pnpm test:browser` must run against the real app UI and product output. `pnpm verify:perf` / `pnpm test:browser:perf` must run the performance browser suite sequentially so budgets are measured without parallel e2e noise.

Do not stop or kill existing local servers to free a port. `pnpm dev`, `pnpm preview`, and browser verification prefer port `3002`, but automatically move to the next free port when it is busy. Use `CREATIVE_APPS_KIT_PORT`, `CREATIVE_APPS_KIT_DEV_PORT`, or `CREATIVE_APPS_KIT_TEST_PORT` only to change the preferred starting port.

## App Completion Bar

The app is complete only when:

- the Creative Apps Kit runtime shell is present;
- `canvasContent` contains product output only;
- the runtime canvas backing remains visible behind product output;
- every visible control affects runtime state and product output or a command side effect;
- reset returns schema controls to `defaultValue`;
- sticky footer export actions operate on final product output at `state.canvas.size`;
- still products expose Export PNG; animated products expose Export Video plus Export PNG;
- PNG export uses `Background` and `Include background` runtime controls with the standard export helper, while live preview, workspace canvas backing, and video keep background;
- all export paths use retina output dimensions from the standard export helper;
- layers are absent for single-layer apps and fully working when enabled;
- timeline is absent, playback, keyframes, or custom reference timeline according to product behavior;
- performance checks cover workload and responsiveness for all relevant controls;
- detail-heavy or animated custom renderers pass real viewport drag and zoom stress checks;
- workload browser perf tests use the declared `stressFixture` value from `app-performance.ts`;
- browser tests verify upload/clear, controls, canvas sizing, toolbar, timeline/layers when enabled, sticky actions, output dimensions, and viewport stability.
