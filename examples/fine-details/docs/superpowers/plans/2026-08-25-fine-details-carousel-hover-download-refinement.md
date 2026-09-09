# Fine Details Carousel Hover and Download Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the existing Fine Details carousel so gaps remain inside its hover pause region, manual dragging keeps the normal cursor, and the per-card Arrow Line Down action downloads the original JPEG while previews remain optimized Next Images.

**Architecture:** Keep the existing CSS marquee and pointer-drag phase implementation. Move hover pause ownership from individual card shells to the whole rendered track, separate each asset's imported `StaticImageData` preview source from its direct public download URL, and update only the card action styling/icon.

**Tech Stack:** Next.js 16, React 19, CSS Modules, `next/image`, Phosphor Icons, Node test runner through Vite Node.

---

### Task 1: Lock the refined carousel contract

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-carousel.test.ts`

- [ ] **Step 1: Replace the old card-only hover and Download icon assertions**

Assert that the source and CSS contain the new track-hover pause contract, no carousel `grab`/`grabbing` cursor declarations, the Arrow Line Down subpath import, original public download URLs, black 40%/60% button backgrounds, and the existing `next/image` import:

```ts
assert.match(cssSource, /\.root:has\(\.track:hover\) \.animated/);
assert.doesNotMatch(cssSource, /cursor:\s*grab(?:bing)?/);
assert.match(componentSource, /import \{ ArrowLineDownIcon \} from '@phosphor-icons\/react\/ArrowLineDown'/);
assert.match(assetsSource, /downloadUrl: '\/images\/recraft-fine-details\/carousel\/carousel-01\.jpeg'/);
assert.match(componentSource, /href=\{asset\.downloadUrl\}/);
assert.match(cssSource, /background:\s*rgb\(0 0 0 \/ 40%\)/);
assert.match(cssSource, /\.downloadButton:hover[\s\S]*background:\s*rgb\(0 0 0 \/ 60%\)/);
assert.match(componentSource, /import Image from 'next\/image'/);
```

- [ ] **Step 2: Run the focused carousel test and confirm RED**

Run:

```bash
node ../recraft-tools/fine-details/node_modules/.pnpm/vite-node@3.2.4_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.33.0/node_modules/vite-node/vite-node.mjs src/components/pages/home/fine-details-carousel.test.ts
```

Expected: the new hover, icon, direct URL, cursor, and background assertions fail against the previous implementation.

### Task 2: Implement track hover and original download

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-carousel-assets.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-image-carousel.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-image-carousel.module.css`

- [ ] **Step 1: Give each asset a direct original-file download contract**

Keep the imported static image for Next Image and add a stable public URL plus original filename:

```ts
{
  id: 'fine-details-carousel-01',
  image: carousel01,
  downloadUrl: '/images/recraft-fine-details/carousel/carousel-01.jpeg',
  fileName: 'carousel-01.jpeg',
}
```

Apply the same mapping to assets 02 through 04 in authored order.

- [ ] **Step 2: Switch the action to Arrow Line Down and the original asset URL**

Use the direct Phosphor subpath and asset fields without changing the visible Next Image:

```tsx
import { ArrowLineDownIcon } from '@phosphor-icons/react/ArrowLineDown';

<Image src={asset.image} width={imageWidth} height={imageHeight} alt="" draggable={false} />
<a
  aria-label={`Download image ${index + 1}`}
  className={styles.downloadButton}
  download={asset.fileName}
  href={asset.downloadUrl}
  onPointerDown={(event) => event.stopPropagation()}
  tabIndex={isClone ? -1 : undefined}
>
  <ArrowLineDownIcon aria-hidden size={20} weight="bold" />
</a>
```

- [ ] **Step 3: Refine hover and cursor CSS**

Delete carousel `grab` and `grabbing` cursor selectors. Pause on the complete track and use explicit button background states:

```css
.downloadButton {
  background: rgb(0 0 0 / 40%);
}

.downloadButton:hover,
.downloadButton:focus-visible {
  background: rgb(0 0 0 / 60%);
}

@media (hover: hover) {
  .root:has(.track:hover) .animated {
    animation-play-state: paused;
  }
}
```

Keep per-card action visibility, the 40px geometry, pointer drag handlers, keyframes, prompt code, and Toolcraft iframe behavior unchanged.

- [ ] **Step 4: Run the focused carousel test and confirm GREEN**

Run the Task 1 command.

Expected: 13/13 carousel tests pass.

### Task 3: Focused verification and handoff

**Files:**
- Modify: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`

- [ ] **Step 1: Run website settings coverage**

Run:

```bash
node ../recraft-tools/fine-details/node_modules/.pnpm/vite-node@3.2.4_@types+node@22.19.19_jiti@2.7.0_lightningcss@1.33.0/node_modules/vite-node/vite-node.mjs src/components/pages/home/fine-details-settings.test.ts
```

Expected: 9/9 tests pass.

- [ ] **Step 2: Format and check only touched website files**

Run:

```bash
pnpm exec oxfmt src/components/pages/home/fine-details-carousel-assets.ts src/components/pages/home/fine-details-image-carousel.tsx src/components/pages/home/fine-details-image-carousel.module.css src/components/pages/home/fine-details-carousel.test.ts
pnpm exec oxfmt --check src/components/pages/home/fine-details-carousel-assets.ts src/components/pages/home/fine-details-image-carousel.tsx src/components/pages/home/fine-details-image-carousel.module.css src/components/pages/home/fine-details-carousel.test.ts
```

Expected: all four files match the configured format.

- [ ] **Step 3: Record the interaction ownership and verification result**

Append a worklog decision stating that only the carousel track hover/action changed; prompt, Toolcraft protocol, controls, and card geometry stayed unchanged; and record the exact focused pass counts.

- [ ] **Step 4: Check the repository diff**

Run `git diff --check` from `recraft-landing`.

Expected: no output. Do not run broad build, browser matrix, performance checks, commit, or push.
