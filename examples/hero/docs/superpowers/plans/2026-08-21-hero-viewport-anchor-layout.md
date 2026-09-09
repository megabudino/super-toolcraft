# Hero Viewport Anchor Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the published hero at visitor-viewport height while anchoring its heading to the top and prompt to the bottom with Toolcraft pads retained as relative offsets.

**Architecture:** Preserve the existing `100svh` height owner and two-row hero grid. Replace the centered first-row content stack with a full-height `justify-between` column; no protocol, schema, runtime state, or control changes are required.

**Tech Stack:** Next.js 16, React, Tailwind CSS, Toolcraft iframe preview protocol, Markdown worklog

---

### Task 1: Anchor the heading and prompt to opposite hero edges

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`

- [ ] **Step 1: Replace the centered first-row wrapper with the viewport-anchor layout**

Keep the section height and grid rows unchanged. Replace the nested centered wrappers around `data-hero-heading-group` and `data-hero-prompt` with one full-height flex column:

```tsx
<div className="relative flex min-h-0 flex-col items-center justify-between px-5 py-8 text-center md:px-8 md:py-10">
  <div
    className={`${styles.headingGroup} relative z-0 flex flex-col items-center`}
    data-hero-heading-group
    style={createHeroHeadingStyle(settings)}
  >
    {settings.heading.badgeVisible ? (
      <div className="relative size-11 md:size-14" data-hero-heading-badge>
        <Image
          className="size-full"
          src="/images/recraft-hero/v4-ring.svg"
          alt=""
          width={56}
          height={56}
          priority
          aria-hidden="true"
        />
        <span className="absolute inset-0 flex items-center justify-center pt-0.5 font-display-condensed text-2xl leading-none font-black tracking-wide text-[#e6e6e6] uppercase md:text-3xl">
          V4
        </span>
      </div>
    ) : null}

    <h1
      id="hero-title"
      className={`${settings.heading.badgeVisible ? 'mt-2.5' : ''} font-display-expanded font-black uppercase`}
    >
      <span className={`${styles.headingLine} ${styles.recraftLine}`}>Recraft</span>
      <span
        className={`${styles.headingLine} ${styles.stylesLine} font-display-wide-ultra-italic`}
      >
        Styles
      </span>
    </h1>
  </div>

  <div
    className={`${styles.prompt} relative z-20 w-[calc(100vw-2rem)] max-w-160`}
    data-hero-prompt
    style={createHeroPromptStyle(settings)}
  >
    <AiPromptInput
      className="w-full"
      defaultPrompt="Create four campaign visuals: a sneaker, camera, chair, and perfume bottle."
    />
  </div>
</div>
```

Remove the prompt's former `mt-8`. Do not change `h-[calc(100svh-4rem)]`, `grid-rows-[minmax(0,1fr)_5rem]`, the existing heading/prompt CSS transforms, or any scene z-index.

- [ ] **Step 2: Preserve the existing viewport and control data flow**

Confirm through source review only that no new height prop or protocol field was introduced and that these existing style mappings remain intact:

```ts
'--hero-heading-offset-x': `${heading.position.x * 36}vw`,
'--hero-heading-offset-y': `${heading.position.y * 28}vh`,
'--hero-prompt-offset-x': `${settings.prompt.position.x * 36}vw`,
'--hero-prompt-offset-y': `${settings.prompt.position.y * 28}vh`,
```

### Task 2: Record the delivery decision

**Files:**
- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Add Delivery 16 before the Decisions section**

Insert this entry:

```md
### Delivery 16 — Viewport-anchored heading and prompt

- Request: `по поводу высоты хиро секции. я хочу чтобы на сайте это было на высоту пользовательского экрана, а. выставлял высоту в тулкрафте для теста. давай такое разделение сделаем можно так? часть с хедингом прижата к верху на расстояние как в тулкрафте и часть с нижним промптом прижата к низу как я настраиваю в тулкрафте`.
- Task type: Later Tier 3 retained-DOM viewport-layout change; no protocol, schema, or workload changes.
- User-visible result: The published hero follows the visitor's available screen height. Heading stays anchored near the top and prompt near the bottom, while their existing Toolcraft pads tune offsets from those anchors.
- Source/reference checked: The existing `100svh` hero grid, Toolcraft finite-canvas iframe sizing, heading/prompt transform mappings, and current stacking order.
- Docs/contracts read: `workflow.md`; `core/runtime-boundary.md`; `core/performance.md`; `renderer-technique.md`; and `performance.md`. The `brainstorming` and `writing-plans` workflows supplied the design and implementation plan.
- Contract rules applied: `canvas-no-app-ui`, `interaction-surface-ownership`, `renderer-technique-inventory`, `renderer-view-interaction`, `performance-coverage-levels`, and `workflow-required`.
- View interaction intent: `fixed-camera` remains unchanged; responsive top/bottom layout changes no scene orientation behavior.
- Interaction ownership: Runtime `Canvas height` owns only the Toolcraft test iframe viewport. The panel's existing Heading position and Prompt position pads own authored offsets from the website's top and bottom anchors; no canvas interaction duplicates them.
- Decision: Preserve `height: calc(100svh - 4rem)` and the fixed ticker row, then make the flexible visual row a `justify-between` column with heading first and prompt last. Preserve their existing screen-coordinate transforms and z-indexes.
- Alternatives rejected: Absolute positioning because it adds overlap bookkeeping; a protocol height field because it couples the live site to an authoring test dimension; and fixed-layout scaling because it distorts responsive typography and prompt geometry.
- State/output mapping: Toolcraft `Canvas height` resizes the iframe viewport only. Existing heading/prompt vector values continue through protocol version 8 and become their current CSS transform variables, now applied relative to stable top and bottom layout anchors.
- Performance intent: ordinary-product-work. The retained DOM nodes and transform update paths are unchanged; only their flex layout ownership changes, with no new resources, passes, animation, workload dimensions, or measured-performance authority.
- Verification: Per the user's standing instruction, no tests, browser checks, lint, typecheck, formatting, or build are run; the implementation is handed off directly for review.
- Risks: Very short viewports or extreme pad values can overlap or move content beyond its visual inset; no clamp or minimum height is introduced because either would weaken viewport ownership and direct pad control.
```

- [ ] **Step 2: Update the high-level renderer and interaction-ownership decisions**

Describe the website-owned viewport anchors without changing the renderer type or control inventory:

```md
- Decision: A DOM iframe preview driven by the `recraft.hero-scene` version-8 message protocol, with a website-owned viewport-height layout that anchors heading and prompt to opposite edges, plus the native checker background and bounded card scene.
```

Add the viewport-anchor relationship to the existing panel ownership statement while keeping Toolcraft canvas ownership limited to viewport pan/zoom.

- [ ] **Step 3: Add the latest verification boundary**

At the top of `## Verification`, record that this is a Tier 3 viewport-stability layout change and that no checks were run under the user's standing direct-handoff instruction.

### Task 3: Hand off without running checks

**Files:**
- Review only: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Review only: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`
- Preserve: `recraft-tools/hero/docs/superpowers/plans/2026-08-21-hero-sphere-gallery.md`
- Preserve: `recraft-tools/hero/docs/superpowers/specs/2026-08-21-hero-sphere-gallery-design.md`

- [ ] **Step 1: Inspect only the intended diff and repository status**

Run:

```bash
git diff -- recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx recraft-tools/hero/docs/toolcraft/agent-worklog.md recraft-tools/hero/docs/superpowers/specs/2026-08-21-hero-viewport-anchor-layout-design.md recraft-tools/hero/docs/superpowers/plans/2026-08-21-hero-viewport-anchor-layout.md
git status --short
```

Expected: the hero layout, this feature's spec/plan, and worklog are changed; the pre-existing sphere-gallery documentation remains modified but untouched by this delivery.

- [ ] **Step 2: Do not run validation or publish changes**

Per the user's instruction, do not run automated tests, browser checks, lint, typecheck, formatting, build, or `git diff --check`. Do not commit or push because this request does not authorize publication.
