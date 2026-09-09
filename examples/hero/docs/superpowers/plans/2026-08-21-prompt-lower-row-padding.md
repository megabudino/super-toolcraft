# Prompt Lower-Row Padding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the prompt form's lower-row content with both ends of the horizontal divider.

**Architecture:** Keep the existing `AiPromptInput` structure and behavior. Replace only the lower row's responsive horizontal padding with the same fixed 20 px Tailwind spacing used by the divider.

**Tech Stack:** React, TypeScript, Tailwind CSS, Next.js, pnpm

---

### Task 1: Align the lower row

**Files:**

- Modify: `recraft-v4-styles/src/components/ai-prompt-input.tsx:266`

- [ ] **Step 1: Confirm the existing mismatch**

Run:

```bash
rg -n 'mx-5 h-px|px-2\.5 py-2.*sm:px-3' src/components/ai-prompt-input.tsx
```

Expected: the divider reports `mx-5`, while the lower row reports `px-2.5` and `sm:px-3`.

- [ ] **Step 2: Apply the matching inset**

Change the lower-row container to:

```tsx
<div className="mt-auto flex min-h-[3.75rem] items-center gap-2 px-5 py-2 sm:gap-3">
```

This preserves vertical padding and responsive gaps while making both horizontal insets 20 px.

- [ ] **Step 3: Format the component**

Run:

```bash
pnpm exec oxfmt src/components/ai-prompt-input.tsx
```

Expected: exit code 0.

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm typecheck
rg -n 'mx-5 h-px|px-5 py-2 sm:gap-3' src/components/ai-prompt-input.tsx
git diff --check
```

Expected: typecheck exits successfully, both matching 20 px insets are present, and the diff has no whitespace errors. Broad browser and visual suites are intentionally excluded at the user's request.

- [ ] **Step 5: Review the scoped diff**

Run:

```bash
git diff -- src/components/ai-prompt-input.tsx
```

Expected: the only product-code change is the lower-row horizontal padding. Do not create a commit without explicit authorization.
