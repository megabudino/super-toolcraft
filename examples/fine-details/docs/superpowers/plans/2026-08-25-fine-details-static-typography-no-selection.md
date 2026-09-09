# Fine Details Static Typography Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent native selection of the marked `TRY IT` and `YOUR WAY` static typography while preserving editable prompt selection.

**Architecture:** Add inherited Tailwind `select-none` boundaries only to the two existing static typography owners. Keep the Fine Details section and draggable prompt outside those boundaries so prompt editing, pointer events, and drag ownership remain unchanged.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS 4, Node test runner

---

### Task 1: Lock native selection to the two static typography owners

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-section.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail-prompt-focus.test.ts`
- Modify: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`

- [x] **Step 1: Add the failing source contract**

Add this test after the existing stacking test:

```ts
test('static typography is non-selectable while the prompt stays selectable', () => {
  assert.match(
    sectionSource,
    /className="[^"]*pointer-events-none[^"]*select-none[^"]*"[\s\S]{0,250}data-fine-details-upper-left-typography/,
  );
  assert.match(
    sectionSource,
    /className="[^"]*pointer-events-none[^"]*select-none[^"]*"[\s\S]{0,250}data-fine-details-lower-right-typography/,
  );
  assert.match(
    sectionSource,
    /<FineDetailsDraggablePrompt[\s\S]{0,250}className="(?![^"]*select-none)[^"]*"/,
  );
});
```

- [x] **Step 2: Run the focused test and observe the meaningful RED**

Run:

```bash
node --test src/components/pages/home/fine-details-image-trail-prompt-focus.test.ts
```

Expected: the new test fails because both static typography class lists omit `select-none`; existing prompt/stacking assertions stay green.

- [x] **Step 3: Add the two inherited selection boundaries**

In `fine-details-section.tsx`, change the upper-left class to:

```tsx
className="pointer-events-none absolute z-[1] m-0 select-none font-heading leading-[0.96] font-black whitespace-nowrap text-black uppercase"
```

Change the lower-right group class to:

```tsx
className="pointer-events-none absolute z-[1] flex w-max select-none flex-col items-start text-black"
```

Do not add `select-none` to the section, draggable prompt, or `AiPromptInput`.

- [x] **Step 4: Run the focused GREEN check**

Run:

```bash
node --test src/components/pages/home/fine-details-image-trail-prompt-focus.test.ts
```

Expected: all tests in the file pass.

- [x] **Step 5: Verify the browser behavior directly**

On the running website, confirm computed `user-select: none` for `[data-fine-details-upper-left-typography]` and `[data-fine-details-lower-right-typography]`, drag across each marked block, and confirm `window.getSelection()?.toString()` stays empty. Then select text inside the central prompt and confirm its selection remains non-empty.

- [x] **Step 6: Record the focused delivery**

Append a worklog entry with the exact request, screenshot-mapped scope, `pointer-events` versus `user-select` diagnosis, rejected section-wide/JavaScript alternatives, focused test/browser results, and any remaining verification limits. Do not commit or push without explicit user authorization.
