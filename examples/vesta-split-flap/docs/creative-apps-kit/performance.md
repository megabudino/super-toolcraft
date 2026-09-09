# Performance

Every visible non-action control needs a `performanceRole` and `performanceReason`.

Performance coverage has two levels:

- workload coverage for controls that change render cost;
- responsiveness coverage for ordinary controls that still must not freeze input or break the viewport.

## Workload Coverage

Use workload coverage for controls that change rendering cost:

- output size;
- media resolution;
- sample count;
- character or grid density;
- particle count;
- blur radius;
- shader complexity;
- iterations;
- quality;
- timeline playback;
- keyframe scrubbing.

Sensitive controls need min/default/max scenarios, `stressFixture`, and real product-output checks.

`stressFixture` is the machine-checkable heavy case for a workload scenario. It must include:

- `kind`: `large-text`, `large-canvas`, `high-density`, `many-items`, `max-value`, `media`, or `custom`;
- `reason`: why this value is the heaviest useful product case;
- `value`: the actual value the browser performance test will apply.

For multiline text, prompt, code, JSON, CSS, shader, script, or template workload controls, use `kind: "large-text"`. The fixture must contain at least `50_000` characters and `1_000` lines unless the product has a stricter real-world maximum.

Browser performance tests for workload scenarios must read the heavy value through:

```ts
getCreativeAppsKitPerformanceStressValue(appPerformance, "scenario-id")
```

Do not type a separate short value in the Playwright test. If a test uses a toy value while `app-performance.ts` claims a heavy fixture, `pnpm verify:perf` must fail.

## Responsiveness Coverage

Ordinary controls still need lightweight responsiveness checks. They should not cause:

- frozen pointer drag;
- delayed input;
- broken slider movement;
- stale async renders;
- canvas zoom or offset jumps;
- panel scroll affecting canvas zoom;
- timeline or layer interactions destabilizing the viewport.

## Renderer Performance

Custom renderers should:

- initialize contexts, programs, shaders, pipelines, textures, and large buffers once;
- update uniforms or stable buffers when controls change;
- cache decoded media;
- debounce, coalesce, or defer heavy preview work;
- cancel stale async renders;
- avoid re-decoding media on every control change;
- cancel scheduled frames during cleanup.

Pixel-output renderers may use a capped preview pixel budget, but export/copy must render final product output at `state.canvas.size`.

Text-output and vector-output previews must preserve native output fidelity. Do not render low-resolution text/vector output into an offscreen canvas and upscale it.

## Required Browser Checks

Use real interactions for:

- `preview-render`;
- `control-change`;
- `control-drag`;
- `media-import` when upload exists;
- `export-copy` for product export actions and clipboard actions; measure retina output dimensions, not CSS preview size;
- `timeline-playback` or `timeline-scrub` when timeline exists;
- `layers-interactions` when layers exist;
- `viewport-zoom-stress` for detail-heavy or animated custom renderers;
- `viewport-stability`.

Animated custom renderers also need `animation-viewport-drag`. Animation-only frame sampling and viewport-only stability are not enough: the browser test must sample frames while physically dragging or panning the canvas viewport. If SVG/DOM cannot pass that combined budget, choose a different renderer strategy from evidence instead of loosening the budget.

Detail-heavy or animated custom renderers also need `viewport-zoom-stress`. This test must use the real toolbar zoom controls while sampling frame gaps and long tasks. Do not satisfy it by calling `canvas.zoom`, mutating runtime state directly, or checking only the final zoom value.

During canvas drag, pan, pinch, zoom, and radar/center interactions, animated preview renderers must suspend or coalesce non-essential animation work. This is an interaction-performance throttle, not a user-visible playback command: do not flip the user's Play/Pause state, do not reset timeline time, and do not change export behavior. After the interaction settles, resume from the correct timeline or autonomous time without canvas offset or zoom jumps.

Animation checks should sample enough frames to catch jank. Interaction budgets must match scenario type rather than using one universal number.

Use `app-performance.ts` as the single budget and fixture source. Browser performance tests must call `getCreativeAppsKitPerformanceStressValue(appPerformance, scenarioId)` for workload values and `expectCreativeAppsKitScenarioPerformanceBudget(..., appPerformance, scenarioId)` for budgets.

Run `pnpm verify:perf` for Tier 3 performance-sensitive edits and inside `pnpm verify:final` before delivery. It runs `e2e/app-performance.spec.ts` and every `browser perf:` scenario with one worker so budget failures are not hidden or created by unrelated parallel browser tests.

Run the same performance gate after every major post-generation iteration: adding animation/keyframes/layers, replacing renderer technique, changing canvas behavior, changing many controls at once, or rewriting product output. A broad rework that passes unit tests and browser acceptance can still be rejected if `pnpm verify:perf` exposes drag, zoom, animation, or viewport jank.

Do not use the full performance suite as the default loop for Tier 0-2 edits. Those edits still need the targeted checks named by the verification tier, but they should not pay for renderer and viewport stress tests unless their changed surface can affect performance.
