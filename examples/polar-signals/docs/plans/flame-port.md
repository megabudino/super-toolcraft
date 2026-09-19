# Flame Graph reference port

This is first product delivery. The scope is substantial because it combines procedural geometry, direct canvas editing, runtime state/history/persistence, worker rendering and artifact export.

Verification tier: Tier 3
Reason: Complete reference application transfer with a custom raster renderer and canvas handles.
Run: pnpm ai:check (baseline passed), focused geometry/color/interaction tests, focused product browser scenarios, then one npm run verify:delivery; manual Codex in-app browser inspection.
Skip: measured performance and kernel benchmarks; no performance complaint or full-audit request was made. No timeline, media or layers tests for absent features.

## Reference decisions

- Source: ../polar-signals-flame-graph/src/App.tsx, components/Sidebar.tsx, components/FlameGraphCanvas.tsx, components/HslColorPicker.tsx and utils/flameGraph.ts. The original runs at http://127.0.0.1:5174 and was inspected in Codex's embedded browser.
- Keep Center / Top Down, 50 columns, depth 10, border 5%, noise 20%, core 25, original seven-point envelopes and cosine interpolation. Preserve HSL shortest-hue interpolation, cubic segment weighting, terminal-block gradients and five-pixel segment minimum.
- Reuse built-in segmented, sliders and colors. Three colors are semantic core / intermediate segment / edge colors in a discrete rank-based shading algorithm. A generic Gradient would introduce unsupported stop cardinality, stop position, opacity, type and angle; preserve the three reference roles with color controls instead of exposing ignored fields.
- Canvas owns vertical point manipulation; panel owns appearance, structure and Regenerate. Arrays are fixed-size canvas-authored runtime values, not user-cardinality collections or tone-map curves. No mirrored panel point editor.
- Use one transparent Canvas2D foreground plus textless SVG guides. Preserve Canvas2D drawing logic; run preview rasterization in a retained worker, then present its completed bitmap. Export uses the same drawing function with runtime-provided context.
- Geometry uses an explicit random seed and a parameter-dependent random stream. Regenerate chooses a new seed; colors, border, core and sizing do not change geometry. Runtime undo, reload and export can reproduce the same composition.
- Runtime owns 1920×1080 editable initial frame, finite/Infinity, background #EEEBFF, render scale, toolbar, persistence and Image Export. PNG transparency uses Background off; Toolcraft's mandatory 2K/4K/8K output sizing replaces the reference's fixed 2× download sizing. These are Toolcraft-native transfers authorized by the requested Toolcraft rules.
- No animation, timeline, media import, layers, SVG artifact or video artifact. referenceInputs is empty (source application, no motion asset).

## Implementation order

1. Author source study, typed readiness/interaction/section inventory and schema; keep signed shell/default import untouched.
2. Declare workload dimensions (columns, depth, live backing scale, artifact resolution), canonical pipeline, adapters and paths. Run render-plan structural assessment before renderer code.
3. Port algorithm into focused src/flame modules; integrate worker, deterministic preview/export and runtime canvas handle commands.
4. Add product-owned unit tests, browser scenarios and performance adapters. Prove modes, all appearance/structure controls, live drag, history, reload, background, Infinity continuity, actual backing resolution and decoded image export without handles.
5. Resolve focused failures, complete protected first-delivery gate, open the running app and record results in worklog.

## Owners and risks

Product assembly: src/app/app-schema.ts, app-composition.tsx, app-acceptance-data.ts, app-performance.ts. Domain/rendering: src/flame. Tests: src/flame/*.test.ts, src/app/flame-contracts.test.ts, e2e/product-flame*.spec.ts and product support. No signed runtime, host or verification configuration edits.

Risks: asynchronous worker frame ordering, exact backing under zoom/DPR, clipping around minimum-height segments, drag ownership during Space pan, and maintaining the source's color-versus-geometry invalidation semantics. Focused tests address each.
