# Mesh Gradient Collection Topology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Color Points collection add/remove actions synchronized with the complete rectangular mesh so no handle exists outside the rendered grid.

**Architecture:** Add one product-owned reconciliation module between the generic collection value and the existing row/column topology operations. `MeshGradientCanvas` detects only count mismatches, asks the helper for a complete topology, and applies it through the existing topology-snapshot handshake; the signed Toolcraft runtime and Coons-patch renderer remain unchanged.

**Tech Stack:** React 19, TypeScript, Vitest, Playwright, WebGL2, Toolcraft runtime commands.

---

### Task 1: Specify collection topology reconciliation

**Files:**
- Create: `src/app/mesh-gradient/mesh-collection-topology.test.ts`
- Create: `src/app/mesh-gradient/mesh-collection-topology.ts`

- [ ] **Step 1: Write the failing unit tests**

Create fixtures from `createGridPoints` and assert these exact transitions:

```ts
it("expands a 4 by 3 mesh with a complete inserted column", () => {
  const result = reconcileMeshCollectionTopology({
    colors: [...colors12, "#7C3AED"],
    columns: 4,
    layoutValue: createMeshPointLayout(createGridPoints(12, 4), 4),
  });
  expect(result?.colors).toHaveLength(15);
  expect(result?.columns).toBe(5);
  expect(result?.layout.points).toHaveLength(15);
  expect(result!.colors.length % result!.columns).toBe(0);
});

it("contracts a 5 by 3 mesh by a complete edge column", () => {
  const result = reconcileMeshCollectionTopology({
    colors: colors15.slice(0, -1),
    columns: 5,
    layoutValue: createMeshPointLayout(createGridPoints(15, 5), 5),
  });
  expect(result?.colors).toHaveLength(12);
  expect(result?.columns).toBe(4);
  expect(result?.layout.points).toHaveLength(12);
});

it("ignores synchronized rectangular topology and snapshot-owned updates", () => {
  expect(reconcileMeshCollectionTopology({
    colors: colors12,
    columns: 4,
    layoutValue: createMeshPointLayout(createGridPoints(12, 4), 4),
  })).toBeNull();
});
```

- [ ] **Step 2: Run the focused test and verify red**

Run: `npx vitest run src/app/mesh-gradient/mesh-collection-topology.test.ts`

Expected: FAIL because `reconcileMeshCollectionTopology` does not exist.

- [ ] **Step 3: Implement the reconciliation helper**

Export a result with synchronized `colors`, `columns`, `layout`, and `label`. Read the stored `points.length` without padding it to the current color count. Return `null` when a topology snapshot owns the mutation, or when count and dimensions are already rectangular. Keep preset transitions eligible so the helper reads their original stored point count before preset deselection pads the layout.

For `colors.length === storedPointCount + 1`, call `insertMeshColumn` or `insertMeshRow`, choosing the valid operation that adds fewer nodes and remains at or below `MESH_MAX_POINTS`. For `colors.length === storedPointCount - 1`, call `deleteSelectedMeshLine` with a synthetic selection on the smallest removable edge line. Use the current color list plus one disposable final fallback color when reconstructing the pre-removal topology; the selected edge must contain that fallback.

When a stale incomplete topology cannot be represented by a direct line operation, pad to the next count at or below 16 that has a factor between 2 and `MESH_MAX_COLUMNS`, choose the factor closest to the current column count, and return `createMeshPointLayout(createGridPoints(count, columns), columns)`.

- [ ] **Step 4: Run the focused test and verify green**

Run: `npx vitest run src/app/mesh-gradient/mesh-collection-topology.test.ts src/app/mesh-gradient/mesh-point-interaction.test.ts`

Expected: both test files PASS.

### Task 2: Apply reconciliation through the existing snapshot handshake

**Files:**
- Modify: `src/app/mesh-gradient/mesh-canvas.tsx`
- Create: `e2e/mesh-collection-topology.spec.ts`
- Modify: `e2e/app-controls.spec.ts`

- [ ] **Step 1: Add the failing browser assertion**

Replace the old `Add` then manual `Reflow` setup with an automatic topology proof:

```ts
await page.getByRole("button", { name: "Sunset", exact: true }).click();
const editor = page.locator('[data-mesh-gradient-handles="true"]');
const columnsControl = page.getByRole("slider", { name: "Columns", exact: true });
await expect(editor).toHaveAttribute("data-mesh-point-count", "12");
await page.getByRole("button", { name: "Add color point", exact: true }).click();
await expect(editor).toHaveAttribute("data-mesh-point-count", "15");
await expect(columnsControl).toHaveAttribute("aria-valuenow", "5");
await expect(page.locator('[data-mesh-grid-axis="horizontal"]')).toHaveCount(12);
await expect(page.locator('[data-mesh-grid-axis="vertical"]')).toHaveCount(10);
```

Also assert Undo returns `12/4` and Redo restores `15/5` without pressing Reflow.

- [ ] **Step 2: Run the focused browser test and verify red**

Run: `npx playwright test e2e/app-controls.spec.ts --grep "mesh controls edit the rendered gradient"`

Expected: FAIL because Add currently produces 13 points with four columns.

- [ ] **Step 3: Wire the helper into `MeshGradientCanvas`**

Import `reconcileMeshCollectionTopology`. Add an effect after preset selection and before snapshot completion:

```ts
React.useEffect(() => {
  const reconciliation = reconcileMeshCollectionTopology({
    colors,
    columns,
    layoutValue: values["mesh.points"],
  });
  if (!reconciliation) return;
  dispatch(createMeshPointCommand({
    layout: {
      ...reconciliation.layout,
      topologySnapshot: {
        colors: [...reconciliation.colors],
        columns: reconciliation.columns,
        revision: `collection-${Date.now()}`,
      },
    },
    record: false,
  }));
}, [colors, columns, dispatch, values]);
```

The existing topology-snapshot effect then updates `mesh.colors`, `mesh.columns`, and removes the marker. Do not change `src/toolcraft`.

- [ ] **Step 4: Run unit and browser tests**

Run: `npx vitest run src/app/mesh-gradient/mesh-collection-topology.test.ts src/app/mesh-gradient/mesh-point-interaction.test.ts src/app/mesh-gradient/mesh-model.test.ts`

Run: `npx playwright test e2e/app-controls.spec.ts --grep "mesh controls edit the rendered gradient"`

Expected: all selected tests PASS; Add reaches `15/5`, Undo reaches `12/4`, and Redo reaches `15/5`.

### Task 3: Record and verify the delivery

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Record the decision trail**

Add a Tier 3 delivery entry containing the reproduced `12/4 -> 13/4` orphan state, the rectangular invariant, the rejected reflow and triangulation alternatives, affected files, focused test commands, browser result, and the unchanged performance envelope.

- [ ] **Step 2: Run the production build**

Run: `npm run build -- --base /demos/mesh-gradient/`

Expected: PASS and `dist/index.html` references `/demos/mesh-gradient/assets/`.

- [ ] **Step 3: Run the protected delivery gate once**

Run: `npm run verify:delivery`

Expected: PASS, or record the exact immutable signed-check failure separately if it is the already-known project-local skill discovery issue. Do not retry an unchanged protected gate.

- [ ] **Step 4: Verify the live local UI**

Use the existing local app server. Apply Sunset, click Add, inspect the editor at desktop size, verify a complete `15/5` grid with no detached handle or uncovered canvas region, and confirm there are no console errors.

- [ ] **Step 5: Commit only the Mesh Gradient batch**

```bash
git add examples/mesh-gradient/src/app/mesh-gradient/mesh-collection-topology.ts \
  examples/mesh-gradient/src/app/mesh-gradient/mesh-collection-topology.test.ts \
  examples/mesh-gradient/src/app/mesh-gradient/mesh-canvas.tsx \
  examples/mesh-gradient/e2e/app-controls.spec.ts \
  examples/mesh-gradient/docs/toolcraft/agent-worklog.md \
  examples/mesh-gradient/docs/superpowers/plans/2026-08-11-mesh-gradient-collection-topology.md
git diff --cached --check
git commit -m "fix(mesh-gradient): keep added points in the grid"
```

- [ ] **Step 6: Deploy and verify production**

Deploy the dedicated `pixelpoint/mesh-gradient` project from `examples/mesh-gradient`, then verify both `https://mesh-gradient-pixelpoint.vercel.app/demos/mesh-gradient` and `https://toolcraft.sh/demos/mesh-gradient`. If Vercel still returns 403 for this project, report the permission gate without pushing unrelated `docs-new` commits.
