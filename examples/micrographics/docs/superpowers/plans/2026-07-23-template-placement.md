# Template Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make template tiles place micrographics by click or drag-and-drop, clear the pending template after placement, and remove the product-canvas border.

**Architecture:** A focused custom control owns the draggable template tiles and stores only the pending template id in Toolcraft runtime state. A pure placement module owns click/drop geometry and deterministic element creation; the SVG canvas translates pointer/drop events into calls to that module and commits `composition.layout`.

**Tech Stack:** React 19, TypeScript, Toolcraft runtime schema/commands, SVG, native HTML5 drag-and-drop, Vitest, Playwright.

---

### Task 1: Add Pure Template Placement Geometry

**Files:**
- Create: `src/app/template-placement.ts`
- Modify: `src/app/micrographics-generator.test.ts`

- [ ] **Step 1: Write the failing unit tests**

Add tests that call:

```ts
createTemplatePlacement({
  canvasHeight: 1350,
  canvasWidth: 1080,
  elementIndex: 8,
  inkMode: "light",
  point: { x: 540, y: 675 },
  seed: 137,
  template: "radar",
})
```

and assert that the element uses `radar`, is centered around the point, stays within the canvas, contains deterministic content, and has a stable aspect-aware size. Add a second test with a point near the bottom-right edge and assert that `x + width <= 1080` and `y + height <= 1350`.

- [ ] **Step 2: Run the unit test and confirm failure**

Run:

```bash
npx vitest run src/app/micrographics-generator.test.ts
```

Expected: FAIL because `createTemplatePlacement` does not exist.

- [ ] **Step 3: Implement the pure helper**

Create:

```ts
export const MICROGRAPH_TEMPLATE_DRAG_TYPE =
  "application/x-toolcraft-micrographics-template";

export function createTemplatePlacement(input: TemplatePlacementInput): MicrographElement {
  const aspect = templateAspect(input.template);
  const maxWidth = input.canvasWidth * 0.32;
  const maxHeight = input.canvasHeight * 0.22;
  const width = Math.max(80, Math.min(maxWidth, maxHeight * aspect));
  const height = Math.max(64, width / aspect);
  const x = clamp(input.point.x - width / 2, 0, input.canvasWidth - width);
  const y = clamp(input.point.y - height / 2, 0, input.canvasHeight - height);
  const elementSeed =
    Math.round(input.seed) * 1009 + (input.elementIndex + 1) * 131 + 53;

  return {
    content: generateTemplateContent(input.template, elementSeed),
    height: Math.round(height),
    id: `element-${Date.now().toString(36)}-${input.elementIndex + 1}`,
    opacity: 100,
    seed: elementSeed,
    template: input.template,
    tone: input.inkMode === "dark" ? "dark" : "light",
    typeScale: 100,
    width: Math.round(width),
    x: Math.round(x),
    y: Math.round(y),
  };
}
```

Also expose a region-based helper that uses the same element factory and clamps the supplied rectangle. Keep DOM/event knowledge out of this module.

- [ ] **Step 4: Run the unit test and confirm pass**

Run:

```bash
npx vitest run src/app/micrographics-generator.test.ts
```

Expected: PASS.

### Task 2: Replace Picker Plus Place With A Draggable Custom Control

**Files:**
- Create: `src/app/template-library-control.tsx`
- Create: `src/app/template-library-control.module.css`
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-composition.tsx`
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/app-performance-impact.json`

- [ ] **Step 1: Add failing schema and acceptance assertions**

Update the schema test expectations so:

```ts
expect(state.values["library.template"]).toBe("");
expect(state.values["library.commands"]).toBeUndefined();
```

Update the acceptance row to require component type `templateLibrary`, custom-control coverage, and a built-in fit check whose closest built-in is `imagePicker` and whose insufficiency is native drag-and-drop plus one-shot pending selection.

- [ ] **Step 2: Run the targeted schema/acceptance tests and confirm failure**

Run:

```bash
npx vitest run src/app/micrographics-generator.test.ts src/app/app-schema.test.ts src/app/app-acceptance.custom-control-coverage.test.ts
```

Expected: FAIL while the schema still declares `imagePicker` plus `library.commands`.

- [ ] **Step 3: Implement the custom control**

Register:

```ts
export const micrographicsControlRenderers = {
  templateLibrary: TemplateLibraryControl,
} satisfies ToolcraftControlRendererMap;
```

The renderer receives `value` and `setValue`, renders all `micrographTemplateItems`, and uses:

```tsx
<button
  aria-label={item.alt}
  aria-pressed={value === item.value}
  draggable
  onClick={() => setValue(item.value)}
  onDragStart={(event) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(MICROGRAPH_TEMPLATE_DRAG_TYPE, item.value);
    setValue(item.value);
  }}
  type="button"
>
  <img alt="" draggable={false} src={item.src} />
</button>
```

Use `Field` and `ControlFieldLabel` from `@/toolcraft/ui`, local CSS modules, and Toolcraft CSS variables. No host selectors or built-in control imports.

- [ ] **Step 4: Wire schema and composition**

Replace the current `imagePicker` and `actions` controls with one cast custom control:

```ts
template: {
  defaultValue: "",
  description:
    "Click a template, then click the poster, or drag the template directly onto the poster.",
  label: "Template",
  orderRole: "primary",
  target: "library.template",
  type: "templateLibrary",
} as never
```

Pass `controlRenderers: micrographicsControlRenderers` in `appComposition`. Remove `library.commands` from section inventory and acceptance. Add the custom modules as `functional` entries in `app-performance-impact.json`.

- [ ] **Step 5: Run targeted schema/acceptance tests and confirm pass**

Run the same Vitest command from Step 2.

Expected: PASS.

### Task 3: Implement Click, Region, And Drop Placement

**Files:**
- Modify: `src/app/micrographics-canvas.tsx`
- Modify: `src/app/micrographics-canvas.module.css`

- [ ] **Step 1: Add the browser test before implementation**

Change `browser: direct micrographics placement` so it no longer clicks `Place`. The test must:

1. click `Radar template`;
2. assert `data-placement-mode="template"`;
3. click a visible poster coordinate;
4. assert the element count increases by one;
5. assert a new `[data-template-id="radar"]` exists;
6. assert the Radar tile has `aria-pressed="false"`;
7. drag `Barcode template` onto another visible poster coordinate;
8. assert another element is added and the Barcode tile is unpressed.

- [ ] **Step 2: Run the focused browser test and confirm failure**

Run:

```bash
npx playwright test e2e/app-canvas.spec.ts --grep "browser: direct micrographics placement"
```

Expected: FAIL because template selection does not arm the canvas and tiles are not draggable.

- [ ] **Step 3: Derive placement mode from the pending template**

Replace:

```ts
const placing = useToolcraftValue("library.commands") === "place-element";
```

with:

```ts
const templateValue = useToolcraftValue("library.template");
const pendingTemplate = isMicrographTemplateId(templateValue)
  ? templateValue
  : null;
const placing = pendingTemplate !== null;
```

Set `data-placement-mode` to `"template"` while pending and `"select"` otherwise.

- [ ] **Step 4: Share one commit path**

Add a local `placeElement(element)` helper that serializes the current scene, appends the element, records `composition.layout`, clears `library.template` to `""` with history skipped, clears placement gesture state, and selects the appended element.

Use the region helper on pointer-up. If pointer movement is below 6 CSS pixels, use `createTemplatePlacement` centered at the pointer instead of creating the old minimum 60×48 region.

- [ ] **Step 5: Add native drop handling**

Add `onDragOver` and `onDrop` to the root SVG. `dragover` calls `preventDefault()` only when the data transfer advertises the product MIME type. `drop` validates the id with `isMicrographTemplateId`, converts the event coordinate to poster space, calls `createTemplatePlacement`, and then calls the shared commit path.

- [ ] **Step 6: Remove the canvas border**

Update the local root class:

```css
.root {
  border: 0;
  box-shadow: none;
  outline: 0;
}
```

Keep element selection and resize handles unchanged.

- [ ] **Step 7: Run the focused browser test and confirm pass**

Run the Playwright command from Step 2.

Expected: PASS.

### Task 4: Align Product Contracts And Worklog

**Files:**
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Update typed ownership and acceptance**

Keep panel template selection under `panel-template-selection`, add canvas spatial placement under `canvas-template-placement`, and document why the panel does not duplicate coordinates. The custom control fit check must include:

```ts
builtInFitCheck: {
  capabilities: ["custom-interaction", "selection"],
  checkedBuiltIns: ["imagePicker", "actions"],
  closestBuiltIn: "imagePicker",
  interactionId: "panel-template-selection",
  productObservable:
    "Clicking or dragging a template inserts its grammar at the requested poster coordinate.",
  whyInsufficient:
    "ImagePicker selects a visual option but cannot initiate native drag-and-drop or model one-shot pending placement that clears after insertion.",
}
```

Record the Tier 3 decision trail, root cause, interaction ownership, files, development checks, and delivery command in the worklog.

- [ ] **Step 2: Run code health and targeted unit tests**

Run:

```bash
npm run ai:check
npx vitest run src/app/micrographics-generator.test.ts src/app/app-schema.test.ts
```

Expected: all checks pass.

### Task 5: Delivery Verification

**Files:**
- Modify only if verification exposes a product-owned defect.

- [ ] **Step 1: Read Verification-phase Toolcraft docs**

Read `docs/toolcraft/acceptance-testing.md` and `docs/toolcraft/performance.md` separately before proof.

- [ ] **Step 2: Run focused browser checks**

Run:

```bash
npx playwright test e2e/app-canvas.spec.ts --grep "browser: direct micrographics placement|micrographics export excludes editing handles"
```

Expected: PASS.

- [ ] **Step 3: Run the protected delivery gate once**

Run the exact selector accepted by the current Toolcraft delivery runner:

```bash
npm run verify:delivery -- --tier=3 --browser-test="browser: direct micrographics placement"
```

Expected: protected ordinary targeted delivery receipt succeeds.

- [ ] **Step 4: Reuse or start the dev server and visually inspect**

Confirm `http://127.0.0.1:3014/` serves this Toolcraft identity, reload the page, test one click placement and one drag placement, and confirm the canvas has no border.

This folder is not a Git repository, so commit steps are intentionally omitted.

