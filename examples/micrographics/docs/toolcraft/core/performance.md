# Performance

<!-- toolcraft-performance-lifecycle: prototype=bounded-smoke; ordinary=exact-targeted; complaint=one-bounded-performance-iteration; repeated-complaint=another-bounded-performance-iteration -->
<!-- toolcraft-performance-iteration: selectors=exact-affected-functional+canonical-performance; fixture=reachable-development; after-pass=return-app-to-user+stop -->
<!-- toolcraft-performance-full-authority: automatic=forbidden; recommendation=two-compatible-iterations-or-broad-unlocalizable-problem; command=npm run verify:perf; authority=explicit-user-request-or-accepted-offer -->

Read this module before changing renderer technique, animation, canvas, media, export, render scale, workload controls, or performance tests.

## Normative Sequence

Use this order for every product:

1. Reachable controls and inputs.
2. Workload dimensions and enforced boundaries.
3. Pass cost, frequency, lifecycle, and invalidation.
4. Render-plan assessment and, only when required, a protected kernel benchmark decision.
5. Derived paths and combined fixtures.
6. Targeted development checks.
7. Lifecycle-appropriate delivery proof: prototype smoke, ordinary exact targeted checks, or one targeted performance iteration. Full certification is a separate operator/CI action.

Do not begin renderer implementation before steps 1-4 are represented in typed configuration and the render-plan assessment has no unresolved errors or benchmarks.

## Envelope

- Inventory every reachable schema control, runtime-state input, and external input.
- Mark workload controls explicitly with `performanceRole: "workload"`; never infer workload from labels, target names, units, option text, or keywords.
- Map every workload role to exactly one numeric `workloadEnvelope` dimension.
- Each dimension declares a stable id, unit, source, mapping, `defaultValue`, and every applicable `interactiveMax` or `batchMax`.
- `interactiveMax` and `batchMax` mean maximum workload for that profile, not the numerically largest value. A numeric `schema-target` source declares `workloadBoundary: "minimum" | "maximum"`; every declared profile boundary equals that selected schema endpoint. A lower endpoint is valid when smaller values create more work.
- Declare only boundaries consumed by passes of that profile. A control may change a batch-only dimension without claiming an `interactiveMax` when interactive passes do not consume it.
- Schema-backed limits equal schema limits. Other limits equal enforced runtime or input boundaries.
- Slider and range controls use their effective numeric domain. Any other schema control is numeric only when it declares a complete finite `min`, `max`, and numeric `defaultValue`; partial, inverted, or out-of-range domains fail validation instead of being guessed from the control type.
- The neutral starter declares `workloadEnvelope: { dimensions: [] }` and omits `fixtureAdapters`.

## Render Plan

Custom renderers declare `rendererPipeline.runtimeId`, passes, and exact interaction invalidation before renderer code. Every pass declares:

- workload dimensions and cost relationship;
- execution frequency;
- lifecycle and resource scope;
- execution location and output quality;
- concrete inputs, invalidators, and cache keys where applicable.

Include `initial-render` and every reachable interaction that executes or intentionally avoids renderer work. Run `assessToolcraftRenderPlan`. If it returns a benchmark requirement, declare the selected candidates in `kernelBenchmarkDecisions`, implement only their executable harnesses in `e2e/app-kernel-benchmarks.ts`, and run protected `pnpm verify:kernel`. The protected runner measures the exact workload, verifies equal deterministic full-quality output, and records a current-source receipt; authored timing values are invalid. High-frequency variable-cost pixel-transform, rasterize, and composite passes always compare a Canvas 2D baseline with WebGL, independent of the already-selected execution location; WebGPU joins the comparison only when it is the selected implementation.

## Compiled Fixtures And Paths

- Derive paths with `deriveToolcraftPerformancePaths`; never author path ids by hand.
- Declare exactly one scenario for each canonical path. The scenario uses that path's `pathId` and exact `coversTargets`; do not create one scenario per equivalent control.
- Equivalent controls share a path when interaction, invalidated passes, execution locations, workload dimensions, and profile are equal.
- Register one `fixtureAdapters.dimensions` adapter per envelope dimension. Each adapter only applies and observes exact numeric values; envelope boundaries and central path profiles remain the sole sources of load and budget policy.
- Finite inputs use an `exhaustive-discrete` entries domain that binds each numeric workload value to the product value actually applied. Schema `select` and `segmented` domains match all schema options one-to-one; other finite sources carry exhaustive provenance aligned with the dimension source.
- A development checkpoint moves from each `defaultValue` toward its declared maximum-workload boundary, including numerically downward ranges. It is available only when the combined vector has exact normalized development pressure `0.8` within the runtime tolerance. For discrete dimensions every value must also belong to the exhaustive domain; otherwise development is unavailable. Maximum remains independently available and execution observes every applied value exactly. Inverse checkpoints use the same domain.
- Discrete path search is deterministic and lazy. The runtime-owned `toolcraftDiscreteDimensionBudget` is 256 searched dimensions and `toolcraftDiscreteCombinationBudget` is 4096 combinations. Dimension overflow, cardinality overflow, or a path above either budget is an actionable planning error, not an unavailable exact vector. A valid exact inverse checkpoint for a custom or benchmark development path bypasses search budgets because no search runs, while its full vector still requires exhaustive-domain membership and exact normalized pressure `0.8` within tolerance.
- Compile development and maximum vectors with `compileToolcraftPerformanceFixturePlan`.
- Combined fixtures include every dimension on the path.
- Add measured inverse full-vector evidence only when a dimension mapping is `custom` or a pass relationship is `benchmark`.
- Performance profile names and budgets come from the runtime-owned profile manifest shared by runtime validation and generated runners. Product scenarios and copied scripts do not redefine those thresholds.

Browser checks apply compiled values through the real UI, observe every dimension, exercise the real preview or export path, assert the product result, and then check the budget. Export scenarios keep exact `actionValue`, visible `controlLabel`, and `completionEvidence` proof.

## Verification Triggers

Keep `src/app/app-performance-impact.json` complete: every product production module is `functional` or `performance`, and performance modules name their exact renderer pass ids. `performance` means the module can change a named pass's execution, invalidation, workload, resource lifecycle, or measured output. Pure wiring, schema and acceptance metadata, labels, and orchestration remain `functional` unless they change one of those pass semantics. Shared modules name only the passes they can actually change; an inventory where every module claims every pass is invalid. The protected delivery runner compares the inventory with the immediately previous successful delivery, derives the minimum tier, and requires functional browser proof or exact pass/path/test performance proof for the changed implementation. A durable full-performance baseline, when one exists, remains historical evidence rather than the ordinary change anchor. Missing modules, stale paths, unknown pass ids, unowned renderer passes, and blanket ownership fail before a receipt can be written.

Run targeted functional and browser checks during development. Add the exact affected path performance checks only when an edit changes that path's pipeline, workload boundary, adapter, interaction, or measured output. The targeted Playwright reporter binds passed test names, pass ids, canonical path ids, nonce, and current source hash; product code and prose cannot mint that evidence. Do not run the full performance suite merely because a renderer, canvas, export, timeline, layer, filename, verification tier, or performance-sensitive control changed.

Ordinary targeted verification requests the compiled development fixture at exact normalized pressure `0.8` and may use a path's compiled maximum only when its finite domain has no exact development vector. Performance-iteration and prototype smoke are stricter: each selected path must have its exact reachable development fixture or verification fails with a configuration error. They never fall back to maximum. The separate operator/CI certification command uses compiled maximum fixtures across the complete current matrix.

The protected conversational lifecycle has three modes:

- **Prototype:** the first product delivery runs full functional acceptance plus one bounded production-build prototype smoke on an exact reachable development fixture. Smoke uses a fixed two-times tolerance over the selected path's profile budget to catch material stalls without turning noisy browser scheduling into full certification. Its evidence level is `prototype-smoke`; no durable baseline is required or created and smoke cannot claim profile compliance.
- **Ordinary:** a later ordinary product delivery runs exact targeted checks derived from the changed implementation. It preserves any existing baseline and cannot silently invoke full performance.
- **Performance iteration:** a direct or repeated performance complaint starts exactly one `performance-iteration`. Record one canonical delivery command in the latest Decision Trail and one identical executed `Run`; the protected report binds both to the exact `Request evidence`, and the same request authority cannot produce a second successful iteration. Run `npm run verify:delivery -- --reason=performance-iteration --tier=<3-or-4> --performance-test="browser perf: exact title"` with the exact affected functional selectors and canonical performance tests against the reachable development fixture. Deliver the verified app, then stop and wait for user evaluation. A later complaint, even if the wording repeats, must be recorded as a new Decision Trail iteration and starts another bounded iteration from the immediately previous successful delivery.

Request classification is tri-state. High-confidence performance language selects `performance-iteration`; high-confidence ordinary product work remains ordinary; ambiguous or unrecognized language becomes `needs-agent-judgment`, and the AI decides from the complete request. Local negation and product commands are interpreted in their own clause rather than through a global phrase list. Before a performance iteration, the worklog must contain a nontrivial exact raw substring of Request as evidence. Whitespace and Unicode code units must match exactly; invented, whitespace-collapsed, NFKC-equivalent, or otherwise mismatched text is rejected. Complaint wording, repetition, tier, filename, and touched subsystem never launch the complete matrix automatically.

Every protected targeted performance report stores the independently validated `cold`, `warm`, and `sustained` numeric observations for each selected canonical path. When the immediately previous successful delivery contains compatible targeted measurements, the next complaint records metric deltas against that report; otherwise it records an explicit non-comparable result. Deltas are diagnostic evidence, not a noisy strict-improvement gate: the current iteration must pass its absolute profile budgets, then return to the user without launching another optimization pass.

The preferred conversational delivery boundary is `npm run verify:delivery`. A targeted failure starts targeted diagnosis and architecture repair; it does not automatically expand into the full suite. After the selected evidence passes, return the app to the user instead of continuing speculative optimization. When two consecutive compatible protected performance iterations have passed, the runner emits an evidence-backed recommendation and the agent must offer the user a slower complete audit if performance remains unacceptable. A demonstrably broad or unlocalizable cross-system problem may justify the same offer earlier through agent judgment; a path-count threshold is not authority.

`npm run verify:perf` is the single protected operator/CI full-certification command: it runs maximum fixtures across every canonical path, writes `full-performance` evidence, and creates or refreshes the durable baseline. It runs only after an explicit natural-language request for the complete audit or explicit acceptance of the agent's offer; the user does not need to know the command name. A complaint, repeated complaint, tier, filename, or changed subsystem alone never authorizes it. The full audit is diagnostic and certification evidence, not an automatic optimization loop: repair and rerun failed paths with focused checks, then run the complete matrix only once at the requested certification boundary. `verify:perf:record-iteration` remains a targeted compatibility command, and `verify:final` remains a focused-CI command; neither is a second conversational delivery chain.

`TOOLCRAFT_PERFORMANCE_VERIFICATION_LIFECYCLE` is runtime-owned: protected Playwright owns prototype, ordinary, performance-iteration, and operator full-certification receipts. Product config cannot override this lifecycle.

Completion wording must name the evidence level. For prototype delivery report: “Functional acceptance and bounded prototype responsiveness smoke passed. Full performance certification was not requested or run.” A performance iteration reports only its exact targeted proof and asks the user to evaluate the verified app. After the second consecutive compatible iteration it also offers the slower complete audit without launching it. Never describe `prototype-smoke` or targeted iteration evidence as a complete audit, baseline, maximum-workload proof, or full certification. Only the separate explicitly authorized operator command may report certification after `full-performance` evidence and its durable baseline pass.

## Render Scale And Quality

Render Scale preserves selected backing resolution and visible quality. Do not pass budgets by silently reducing selected quality, backing resolution, product range, source fidelity, export fidelity, or live interaction semantics. Diagnose pass cost, invalidation, cache lifetime, scheduling, and execution location first.

## Slider Responsiveness

Slider Responsiveness means the real product response remains live through the gesture. Model the slider's reachable interaction and invalidated passes, then measure its derived path; a label, target name, or control kind never classifies workload by itself.

Source lifecycle guards remain mandatory: resources are created outside React render, retained according to the declared lifecycle, reused across unrelated interactions, and released during cleanup. Animation frames are cancelled during cleanup, and timeline-only updates do not recreate source-bound resources.

## Non-Normative Examples

These examples illustrate the model; they do not define product categories or minimum fixture sizes:

- An export selector can adapt an option value to a numeric output-width dimension.
- A collection editor can adapt runtime items to a numeric item-count dimension.
- A source importer can expose numeric source dimensions as external-input dimensions.

Choose dimensions from the real product cost model and enforced boundaries, not from these examples.

## Model Appearance Paths

Model `fileDrop` performance proof names six affected passes: `package-extraction`, `canonical-decode`, `model-presentation`, `canvas-orbit`, `export`, and `resource-cleanup`. Extraction and canonical decode execute in the worker; presentation, orbit, export, and cleanup execute on the main thread/GPU boundary.

Use fixtures for authored textures/materials, vertex colors, fallback-only models, equivalent folder/ZIP packages, missing dependencies, multiple roots, and hostile archives. Derive a combined geometry-plus-texture envelope from normalized `modelLimits`; source bytes alone are insufficient because decoded RGBA pixels and GPU resources coexist with canonical geometry. Measure visible completion and frame gaps, cache reuse across preview/export or replacement, and zero active presentation leases after remove/reset/failure/unmount. Do not pass by dropping textures, changing the selected root, replacing authored appearance with fallback, or rendering only metadata.
