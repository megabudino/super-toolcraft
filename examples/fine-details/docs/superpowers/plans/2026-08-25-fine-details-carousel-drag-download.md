# Fine Details Carousel Drag, Hover Pause, and Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the overflowing Fine Details carousel pause only over cards, support direct horizontal drag, and expose a Phosphor download action on every hovered card in both Toolcraft and the standalone site.

**Architecture:** Keep the existing CSS transform marquee and add a normalized loop phase for drag handoff instead of introducing a JavaScript animation loop. Make the Toolcraft iframe pointer-interactive only in Carousel mode; Trail keeps the existing parent-owned pointer pipeline. Card shells own visual effects and download UI while the existing geometry module still decides static versus overflow behavior.

**Tech Stack:** React 19, Next.js 16 `Image`, CSS Modules, Phosphor React icons, Vitest, Node test runner.

**Commit policy:** Do not commit or push; the user will test locally first and explicitly request Git actions later.

---

## File map

- Modify `recraft-tools/fine-details/src/app/fine-details-preview.tsx`: select the iframe interaction class from `settings.imagesMode`.
- Modify `recraft-tools/fine-details/src/app/fine-details-preview.module.css`: keep Trail non-interactive and enable iframe pointer events in Carousel mode.
- Create `recraft-tools/fine-details/src/app/fine-details-carousel-preview-interaction.test.ts`: focused Toolcraft source contract for mode-dependent iframe interaction.
- Modify `recraft-v4-styles/src/components/pages/home/fine-details-image-carousel.tsx`: card shells, normalized phase, pointer capture, drag lifecycle, and download action.
- Create `recraft-v4-styles/src/components/pages/home/fine-details-carousel-phase.ts`: pure loop-phase normalization shared by the component and focused tests.
- Modify `recraft-v4-styles/src/components/pages/home/fine-details-image-carousel.module.css`: phase animation, card-only hover pause, grab states, and download button styling.
- Modify `recraft-v4-styles/src/components/pages/home/fine-details-carousel.test.ts`: focused website contracts for the new interaction while preserving Next Image and geometry behavior.
- Modify `recraft-v4-styles/package.json` and `recraft-v4-styles/pnpm-lock.yaml`: add `@phosphor-icons/react`.
- Modify `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`: record the interaction decision and limited verification.

### Task 1: Make the Toolcraft iframe interactive only for Carousel

- [ ] **Step 1: Add a failing focused Toolcraft contract test**

Create `src/app/fine-details-carousel-preview-interaction.test.ts` that reads the preview TSX and CSS and asserts:

```ts
expect(previewSource).toMatch(
  /settings\.imagesMode === ['"]carousel['"] \? styles\.interactiveFrame : ['"]['"]/,
);
expect(cssSource).toMatch(/\.frame[\s\S]*pointer-events:\s*none/);
expect(cssSource).toMatch(/\.interactiveFrame[\s\S]*pointer-events:\s*auto/);
expect(previewSource).toMatch(/sandbox="allow-downloads allow-same-origin allow-scripts"/);
```

- [ ] **Step 2: Run the test and confirm it fails**

Run from `recraft-tools/fine-details`:

```bash
pnpm exec vitest run src/app/fine-details-carousel-preview-interaction.test.ts --reporter=default
```

Expected: failure because `interactiveFrame` does not exist.

- [ ] **Step 3: Add the conditional iframe class**

In `fine-details-preview.tsx`, retain `styles.frame` and add `styles.interactiveFrame` only for `settings.imagesMode === 'carousel'`:

```tsx
className={`${styles.frame} ${
  settings.imagesMode === 'carousel' ? styles.interactiveFrame : ''
}`}
```

In `fine-details-preview.module.css`, add:

```css
.interactiveFrame {
  pointer-events: auto;
}
```

Add `allow-downloads` to the existing iframe sandbox so the explicit download anchor works in Toolcraft. Do not change the Trail pointer bridge or preview protocol.

- [ ] **Step 4: Run the focused Toolcraft test**

Expected: the new test passes.

### Task 2: Add card-only pause, normalized drag phase, and Download

- [ ] **Step 1: Extend the website contract test first**

Update `fine-details-carousel.test.ts` to require:

- `DownloadIcon` imported directly from `@phosphor-icons/react/Download`;
- a card shell around every Next Image;
- a 40px download anchor using the authored static image URL and stable filename;
- pointer down/move/up/cancel handlers and pointer capture;
- a normalized phase helper using `loop.shift`;
- the CSS animation starts at `--fd-carousel-phase`;
- `.cardShell:hover` pauses `.animated` through `:has(...)` or an equivalent card-hover state;
- `grab` and `grabbing` cursor states;
- the old whole-band `.root:hover .animated` pause rule is absent.

Keep the current assertions for optimized Next Image, no crop, clone-on-overflow, reduced motion, equal text gaps, borders, and shadows.

Import `normalizeFineDetailsCarouselPhase` from the new pure helper and assert that positive, negative, non-finite, and zero-shift inputs normalize into `[-shift, 0]`.

- [ ] **Step 2: Run the website carousel test and confirm it fails**

Run from `recraft-v4-styles`:

```bash
pnpm dlx tsx --test src/components/pages/home/fine-details-carousel.test.ts
```

Expected: new interaction assertions fail against the current image-only cards and whole-band hover rule.

- [ ] **Step 3: Add the Phosphor dependency**

Run from `recraft-v4-styles`:

```bash
pnpm add @phosphor-icons/react@^2.1.10
```

This updates only the website package manifest and lockfile.

- [ ] **Step 4: Move card presentation to a card shell**

Import `DownloadIcon`. Wrap each Next Image in a relative shell sized with the existing `displayWidth` and `effectiveHeight`. Apply the existing radius, border, shadow, width, and height to the shell. Keep the Next Image optimized, `alt=""`, `draggable={false}`, and sized to fill the shell without crop.

Add an anchor inside the shell:

```tsx
<a
  aria-label={`Download image ${index + 1}`}
  className={styles.downloadButton}
  download={`${asset.id}.jpeg`}
  href={asset.image.src}
  onPointerDown={(event) => event.stopPropagation()}
>
  <DownloadIcon aria-hidden size={20} weight="bold" />
</a>
```

- [ ] **Step 5: Add normalized phase and drag lifecycle**

Create `fine-details-carousel-phase.ts`, add `--fd-carousel-phase` to the track variables, and normalize every manual offset:

```ts
export function normalizeFineDetailsCarouselPhase(offset: number, shift: number) {
  if (!Number.isFinite(offset) || !Number.isFinite(shift) || shift <= 0) return 0;
  return -(((-offset % shift) + shift) % shift);
}
```

On primary pointer down for an animated overflowing row, ignore download-action targets, read the current computed track transform, store the normalized starting phase, set the dragging state, and capture the pointer. During pointer move, write the normalized phase directly to the track CSS variable. On pointer up/cancel/lost capture, retain the phase, release capture, and end dragging.

Do not enable drag for static rows or change reduced-motion behavior.

- [ ] **Step 6: Update CSS interaction states**

Use phase-aware keyframes:

```css
@keyframes fine-details-carousel-scroll {
  from { transform: translate3d(var(--fd-carousel-phase), 0, 0); }
  to {
    transform: translate3d(
      calc(var(--fd-carousel-phase) - var(--fd-carousel-shift)),
      0,
      0
    );
  }
}
```

Pause only when a card is hovered, disable animation while dragging, and style the interaction:

```css
.root:has(.cardShell:hover) .animated { animation-play-state: paused; }
.dragging { animation: none; transform: translate3d(var(--fd-carousel-phase), 0, 0); }
.cardShell { position: relative; cursor: grab; }
.root[data-fd-carousel-dragging='true'] .cardShell { cursor: grabbing; }
.downloadButton {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: rgb(0 0 0 / 70%);
  color: white;
}
```

Hide the action by default and reveal it for card hover or keyboard focus. Prevent selection and native image dragging during carousel drag.

- [ ] **Step 7: Run focused website tests**

Run:

```bash
pnpm dlx tsx --test \
  src/components/pages/home/fine-details-carousel.test.ts \
  src/components/pages/home/fine-details-settings.test.ts
```

Expected: all focused carousel and settings tests pass.

### Task 3: Record and verify the delivery

- [ ] **Step 1: Update the Fine Details worklog**

Add a dated decision entry explaining:

- Carousel mode enables iframe pointer events; Trail does not.
- CSS marquee remains the automatic motion engine.
- hover is card-only, drag retains the loop phase, and Download uses the authored JPEG.
- no settings or protocol migration occurred.
- only focused tests were run.

- [ ] **Step 2: Run all agreed focused checks**

Run the Toolcraft interaction test, existing Toolcraft carousel tests, website carousel/settings tests, formatting on touched website files, and `git diff --check`.

Expected: all commands pass. Do not run browser E2E, a full build, the full suite, or performance checks.

- [ ] **Step 3: Hand off for local verification**

Report the implemented hover, drag, download behavior, focused test counts, and the checks intentionally not run. Do not commit or push.
