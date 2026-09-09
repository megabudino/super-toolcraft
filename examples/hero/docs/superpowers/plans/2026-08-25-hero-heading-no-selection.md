# Hero Heading Native Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent native selection of the hero heading, V4 badge, and CTA label.

**Architecture:** Apply the existing Tailwind `select-none` utility at the shared heading-group boundary so all three descendants inherit `user-select: none`. Preserve pointer events, link behavior, focus behavior, and the gallery Pan gesture unchanged.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS 4

---

### Task 1: Make the hero heading group non-selectable

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`

- [x] **Step 1: Add the inherited selection boundary**

Change the heading group from:

```tsx
className={`${styles.headingGroup} absolute left-1/2 flex flex-col items-center`}
```

to:

```tsx
className={`${styles.headingGroup} absolute left-1/2 flex flex-col items-center select-none`}
```

This covers the V4 badge label, both heading lines, and CTA label without disabling pointer events or keyboard focus.

- [x] **Step 2: Record the user-visible behavior**

Append a concise worklog delivery entry containing the exact request, the shared heading-group ownership decision, the rejected per-element and whole-hero alternatives, and the explicit verification limit that no checks were run at the user's request.

- [x] **Step 3: Stop without verification or commit**

Do not run automated tests, manual browser checks, formatting, lint, typecheck, build, or `git diff --check`. Do not commit or push; report that verification was intentionally omitted by user request.
