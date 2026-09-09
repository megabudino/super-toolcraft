# Mesh Gradient Color Point Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every mesh point visible when a preset color is edited through the Toolcraft color control.

**Architecture:** Preserve the shared Toolcraft collection/color control and normalize its supported string and `{ hex }` value forms at the Mesh Gradient product-model boundary. Protect the behavior with a focused model test and extend the existing preset browser acceptance so the real color field proves that point count and rendered output stay intact.

**Tech Stack:** React 19, TypeScript, Vitest, Playwright, Vite, Vercel

---

Verification tier: Tier 3
Reason: The fix changes the normalized color array consumed by the mesh handles, preview, and export passes, while leaving their algorithms, workload boundary, and renderer architecture unchanged.
Run: focused Vitest for `mesh-model.test.ts`, the exact preset Playwright test, then the first-stable `npm run verify:delivery` lifecycle because this checkout has no prior delivery receipt.
Skip: no separate explicit performance refresh; the protected first-stable lifecycle owns the one required baseline attempt.

### Task 1: Lock the color normalization regression

**Files:**
- Create: `src/app/mesh-gradient/mesh-model.test.ts`
- Modify: `src/app/mesh-gradient/mesh-model.ts`

- [ ] **Step 1: Write the failing model test**

```ts
import { describe, expect, it } from "vitest";

import { readMeshColors } from "./mesh-model";

describe("readMeshColors", () => {
  it("keeps edited color-control objects in their original mesh positions", () => {
    expect(
      readMeshColors(["#24102F", { hex: "#FFFFFF" }, "#FFD166", "#FF7A1A"]),
    ).toEqual(["#24102F", "#FFFFFF", "#FFD166", "#FF7A1A"]);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the current implementation fails**

Run: `npx vitest run src/app/mesh-gradient/mesh-model.test.ts`
Expected: FAIL because the `{ hex: "#FFFFFF" }` entry is currently discarded.

- [ ] **Step 3: Normalize both supported color value forms**

Update `readMeshColors` so every collection item is passed through `readColorHex(item, "")`, invalid entries are filtered out, ordering is preserved, and the existing minimum/fallback behavior remains unchanged.

- [ ] **Step 4: Run the focused test again**

Run: `npx vitest run src/app/mesh-gradient/mesh-model.test.ts`
Expected: PASS.

### Task 2: Prove the real preset and color-picker flow

**Files:**
- Modify: `e2e/mesh-presets.spec.ts`

- [ ] **Step 1: Extend the existing preset acceptance**

After applying a 12-point preset, edit the first `mesh.colors` hex field through the real UI and assert:

```ts
await expect(pointOverlay).toHaveAttribute("data-mesh-point-count", "12");
await expect(pointOverlay.locator("[data-mesh-point-handle]")).toHaveCount(12);
```

Also assert that the preset changes to `custom` and the mesh frame signature changes, proving that the edit updates output without deleting topology.

- [ ] **Step 2: Run the exact browser test**

Run: `npx playwright test e2e/mesh-presets.spec.ts --grep "browser: mesh preset gallery applies twelve rectangular mesh gradients"`
Expected: PASS with 12 visible point handles after the color edit.

### Task 3: Record and deliver the fix

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add the decision trail entry**

Record the reproduced 12-to-11 point loss, the `{ hex }` runtime value shape, the product-boundary normalization decision, Tier 2 checks, and the skipped full performance checkpoint.

- [ ] **Step 2: Run the protected delivery gate once**

Run: `npm run verify:delivery`
Expected: successful delivery receipt for the current source.

- [ ] **Step 3: Commit and push only Mesh Gradient changes**

Stage only the files under `examples/mesh-gradient`, commit with `fix(mesh-gradient): preserve points while editing colors`, and push `docs-new` without including unrelated website changes.

- [ ] **Step 4: Deploy the linked Mesh Gradient project to production**

Run from `examples/mesh-gradient`: `vercel deploy --prod -y`
Expected: Vercel returns a READY production deployment and its production URL.

- [ ] **Step 5: Verify the production interaction**

Open the production URL, apply `Sunset`, edit its first color, and confirm the point overlay still declares and renders 12 handles with no console errors.
