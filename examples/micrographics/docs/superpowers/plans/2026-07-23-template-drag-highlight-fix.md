# Template Drag Highlight Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the Toolcraft full-canvas upload highlight from remaining active after a micrographics template is dropped.

**Architecture:** Keep template drag-and-drop owned by the product SVG. When the drag payload contains the micrographics template MIME type, prevent default and stop propagation during `dragover`, so the outer Toolcraft upload shell never enters its file-drop highlight state. Preserve bubbling for unrelated drags so runtime media upload continues to work.

**Tech Stack:** React, TypeScript, native HTML Drag and Drop, Toolcraft runtime, Playwright.

---

Verification tier: Tier 3

Reason: The change affects canvas drag behavior and its interaction with the runtime upload surface.

Run: Targeted browser acceptance for direct micrographics placement, targeted schema/generator tests, typecheck, and impact-derived `npm run verify:delivery` selectors.

Skip: Full performance certification because the request is an ordinary interaction bug, not a performance complaint.

### Task 1: Reproduce the leaked runtime drag highlight

**Files:**
- Modify: `e2e/app-canvas.spec.ts`

- [ ] **Step 1: Add a failing assertion after template drop**

After `barcodeButton.dragTo(...)`, locate `[data-slot="toolcraft-runtime-canvas"]` and assert:

```ts
await expect(runtimeCanvas).toHaveAttribute("data-drag-over", "false");
```

- [ ] **Step 2: Run the exact browser test**

Run:

```bash
npm run test:browser -- --grep "browser: direct micrographics placement"
```

Expected: FAIL because the outer canvas remains `data-drag-over="true"` after the product SVG stops the drop event.

### Task 2: Stop template dragover at the product boundary

**Files:**
- Modify: `src/app/micrographics-canvas.tsx`

- [ ] **Step 1: Implement the minimal event-boundary fix**

Inside `handleDragOver`, only for `MICROGRAPH_TEMPLATE_DRAG_TYPE`, add:

```ts
event.preventDefault();
event.stopPropagation();
event.dataTransfer.dropEffect = "copy";
```

Do not stop unrelated drag payloads; runtime media upload must retain ownership of them.

- [ ] **Step 2: Re-run the exact browser test**

Run:

```bash
npm run test:browser -- --grep "browser: direct micrographics placement"
```

Expected: PASS. Template insertion works, `library.template` clears, and runtime canvas `data-drag-over` is `"false"`.

### Task 3: Record and verify the delivery

**Files:**
- Modify: `docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add a Decision Trail entry**

Record the user request, traced CanvasShell event flow, the MIME-scoped propagation boundary, files changed, Tier 3 verification, and the risk that unrelated file drags must continue bubbling.

- [ ] **Step 2: Run focused checks**

Run:

```bash
npm run ai:check
npm run typecheck
npx vitest run src/app/app-schema.test.ts src/app/micrographics-generator.test.ts
```

Expected: all commands pass.

- [ ] **Step 3: Run protected delivery verification**

Run `npm run verify:delivery` with Tier 3, the exact direct-placement browser test, the two unit-test paths, and the canonical performance selectors required by `app-performance-impact.json`.

Expected: protected targeted delivery receipt passes.

- [ ] **Step 4: Confirm the saved server**

Run:

```bash
npm run dev
```

Expected: Toolcraft reports the Micrographics app at `http://127.0.0.1:3014/`.

This workspace is not a Git repository, so commit steps are intentionally omitted.
