# Vestaboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Creative Apps Kit Vestaboard app with centered rectangular tiles, permanent phrase text, deterministic random filler characters, opacity distribution, seed control, and PNG export.

**Architecture:** Keep the CAK route thin: `CreativeAppsKitApp` owns shell, controls, canvas, toolbar, settings transfer, persistence, and footer actions. Add a focused board model module for deterministic layout, a DOM product renderer for preview, and a Canvas 2D export path that reuses the same model.

**Tech Stack:** React 19, TypeScript, Creative Apps Kit runtime, DOM preview, Canvas 2D PNG export, Vitest, Playwright.

---

## File Structure

- Create `src/app/vestaboard-model.ts`: typed settings, seeded RNG, phrase wrapping/centering, filler generation, board layout, DOM font helpers, Canvas 2D drawing.
- Create `src/app/vestaboard-renderer.tsx`: reads runtime state and renders product output only.
- Modify `src/app/app-schema.ts`: product schema, controls, persistence, settings transfer, Export PNG action.
- Modify `src/routes/index.tsx`: render `CreativeAppsKitApp` with `canvasContent` and `onPanelAction`.
- Modify `src/app/app-acceptance.ts`: product readiness and acceptance rows.
- Modify `src/app/app-performance.ts`: custom renderer technique and scenarios.
- Modify `src/app/app-schema.test.ts`: product schema, default values, control order, performance matrix smoke tests.
- Modify `src/app/app-performance.test.ts`: app-specific automated performance scenario tests.
- Replace `e2e/app-controls.spec.ts`: real UI acceptance tests for product controls and export.
- Extend `e2e/app-performance.spec.ts`: scenario-backed browser performance tests.
- Modify `docs/creative-apps-kit/agent-worklog.md`: product decisions and evidence.

## Verification Tier

Verification tier: Tier 4
Reason: Fresh product completion changes schema, renderer, export, acceptance, performance, docs, and browser tests.
Run: `pnpm install` if dependencies are missing; `pnpm verify:final`; `pnpm dev`; in-app browser visual QA at the local URL.
Skip: No final delivery checks are intentionally skipped.

## Tasks

### Task 1: Product Schema

**Files:**
- Modify: `src/app/app-schema.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] Define `appSchema` with `canvas.sizing.mode: "editable-output"`, an initial `1200x720` canvas, controls panel, toolbar, persistence, `settingsTransfer: "auto"`, and `export.png.background: "include"`.
- [ ] Add `Board Surface` controls: `board.tile.width`, `board.tile.height`, `board.tile.gap`, `board.tile.radius`, `board.tile.fill`, `board.tile.stroke`.
- [ ] Add `Board Text` controls: `board.text.typography` as `fontPicker` and `board.text.color` as `color`.
- [ ] Add `Permanent Message` control: `board.message.text` as `code`.
- [ ] Add `Random Field` controls: `field.fill`, `field.opacityRange`, `field.seed`.
- [ ] Add `Background` controls: `appearance.background` as `color` and `export.includeBackground` as `switch`.
- [ ] Add sticky `panelActions` with one primary Export PNG action.
- [ ] Every non-action control must declare `defaultValue`, `orderRole`, `performanceRole`, and `performanceReason`.
- [ ] Tests should assert editable output sizing, sections, control order, settings transfer, persistence include list, and Export PNG action.

### Task 2: Deterministic Board Model

**Files:**
- Create: `src/app/vestaboard-model.ts`
- Test: `src/app/app-schema.test.ts`

- [ ] Implement typed defaults and `resolveVestaboardSettings(values, canvasSize)`.
- [ ] Implement seeded RNG from `field.seed`.
- [ ] Implement phrase wrapping: split by newline, chunk lines into 22-character rows, trim only trailing carriage returns, preserve spaces inside each row, center line rows horizontally, center block vertically.
- [ ] Implement random filler: fill non-phrase cells by deterministic probability from `field.fill`; choose characters from a fixed Vestaboard-like alphabet; choose opacity inside `field.opacityRange`.
- [ ] Implement layout: fixed 22 columns by 6 rows, requested tile width/height/gap, computed board size, fit scale, left/top offsets centered in canvas.
- [ ] Export `buildVestaboardModel(settings)` and `drawVestaboardToCanvas(context, model)`.
- [ ] Tests should prove phrase centering, newline mapping, fill 0 and fill 100 behavior, seed determinism, opacity range bounds, and fit scale preventing clipping.

### Task 3: Product Renderer And Export

**Files:**
- Create: `src/app/vestaboard-renderer.tsx`
- Modify: `src/routes/index.tsx`
- Test: `e2e/app-controls.spec.ts`

- [ ] Render `<VestaboardRenderer />` as `canvasContent` with `renderDefaultCanvasMedia={false}`.
- [ ] Add `data-creative-apps-kit-product-output` to the renderer root and product text markers to character elements.
- [ ] Add stable selectors for background and foreground layers matching performance config.
- [ ] Style the board layer as centered and scaled from the model. Cells are absolute positioned inside a model-sized board group so the complete board remains centered and visible.
- [ ] Implement `onPanelAction` for `export-png`: call `createCreativeAppsKitPngExportCanvas({ state, background, includeBackground, render })`, convert to a PNG blob, and download it.
- [ ] Keep all visible UI controls in the CAK panel only; canvas content contains product output only.

### Task 4: Acceptance Matrix And Browser Acceptance

**Files:**
- Modify: `src/app/app-acceptance.ts`
- Replace: `e2e/app-controls.spec.ts`
- Test: `src/app/app-acceptance.test.ts`

- [ ] Set `appProductReadiness.mode` to `product` and describe Vestaboard behavior.
- [ ] Keep `appTransferMode.animationIntent.mode` as `none`.
- [ ] Add one acceptance row per visible control, including `controlPartCoverage` for `fontPicker` and `rangeSlider`.
- [ ] Add runtime rows for editable canvas sizing, toolbar viewport behavior, product output, and Export PNG.
- [ ] Browser tests must change the real UI and assert product output changes for each row.
- [ ] PNG tests must prove retina dimensions, background color inclusion, and transparent PNG alpha while live preview remains colored.

### Task 5: Performance Matrix And Browser Perf

**Files:**
- Modify: `src/app/app-performance.ts`
- Modify: `src/app/app-performance.test.ts`
- Modify: `e2e/app-performance.spec.ts`

- [ ] Declare custom renderer config with `usesCustomRenderer: true`, `rendererStrategy: "dom"`, `rendererWorkload: "text-output"`, and renderer technique layer inventory.
- [ ] Add workload targets for tile dimensions, gap, text size through `fontPicker`, message textarea, fill, opacity range, and seed.
- [ ] Add scenarios for preview render, tile-size drag, gap drag, message large-text change, Export PNG, viewport stability, and viewport zoom stress.
- [ ] Workload scenarios must include `stressFixture`; large text fixture must have at least 50,000 characters and 1,000 lines.
- [ ] Browser performance tests must read heavy values with `getCreativeAppsKitPerformanceStressValue(appPerformance, scenarioId)` and assert budgets with `expectCreativeAppsKitScenarioPerformanceBudget`.

### Task 6: Worklog And Final Gate

**Files:**
- Modify: `docs/creative-apps-kit/agent-worklog.md`

- [ ] Replace starter status with `Mode: product`.
- [ ] Record renderer, timeline, layers, controls, export, and performance decisions with concrete evidence.
- [ ] Run `pnpm install` once if there is still no `node_modules` folder.
- [ ] Run `pnpm verify:final`.
- [ ] Start `pnpm dev` and open the local URL in the in-app browser for visual QA.
