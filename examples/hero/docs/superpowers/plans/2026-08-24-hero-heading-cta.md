# Hero Heading CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Figma CTA to the Hero Heading group with complete Toolcraft preview, Apply, and persistence controls.

**Architecture:** Extend the canonical Hero settings with a nested `heading.cta` value object shared by website normalization and Toolcraft mapping. Render one semantic anchor inside the heading group and expose two schema sections for primary CTA styling and its conditional shadow controls. Advance the iframe protocol atomically to v17.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Toolcraft schema controls, postMessage iframe bridge, Vitest, Playwright.

---

### Task 1: Add canonical CTA settings

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-scene-settings.test.ts`
- Modify: `recraft-tools/hero/src/app/hero-heading-values.ts`
- Test: `recraft-tools/hero/src/app/hero-heading-values.test.ts`

- [x] **Step 1: Write failing normalization and defaults tests**

Assert the Figma defaults (`See how it works`, `18`, `20`, `16`, `#000000`, `#E6E6E6`) plus gap and disabled shadow, then assert numeric clamping and invalid-value fallback. The Figma `10px` radius remains a fixed visual property rather than an authored setting.

- [x] **Step 2: Run the focused tests and record the expected RED**

Run the website scene-settings test and Toolcraft heading-values test. Expect failures because `heading.cta` and CTA targets do not exist.

- [x] **Step 3: Implement the value model**

Add `HeroHeadingCtaSettings`, nested defaults, numeric bounds, and normalization. Reuse `HeroShadowSettings` for the CTA shadow and define stable `heading.cta.*` Toolcraft targets.

- [x] **Step 4: Re-run the focused tests**

Expect the new defaults and normalization cases to pass.

### Task 2: Extend protocol, pipeline, and Apply

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-preview-boundary.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-preview-contract.test.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview-protocol.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview-pipeline.ts`
- Modify: `recraft-tools/hero/src/app/hero-preview.product.test.ts`

- [x] **Step 1: Write failing protocol and pipeline tests**

Require protocol version `17`, reject v16 messages, and require every CTA target in the appropriate change or drag target list.

- [x] **Step 2: Run the focused tests and record RED**

Expect failures on v16 and missing CTA payload values.

- [x] **Step 3: Map CTA values through the bridge**

Normalize the Toolcraft values into `heading.cta`, include them in settings/save payloads, and advance both sides to v17 without changing channel names or Apply semantics.

- [x] **Step 4: Re-run protocol tests**

Expect complete CTA payload parity and strict v16 rejection.

### Task 3: Add Toolcraft controls and acceptance ownership

**Files:**
- Modify: `recraft-tools/hero/src/app/app-schema.ts`
- Modify: `recraft-tools/hero/src/app/hero-visual-control-sections.ts`
- Modify: `recraft-tools/hero/src/app/app-acceptance-data.ts`
- Modify: `recraft-tools/hero/src/app/hero-product-control-acceptance.ts`
- Modify: `recraft-tools/hero/src/app/hero-visual-preview-cases.ts`
- Create: `recraft-tools/hero/src/app/hero-heading-cta-toolcraft.test.ts`

- [x] **Step 1: Write the failing Toolcraft contract test**

Assert the `CTA Button` seven-control section, `CTA Shadow` five-control section, shared entity identity, conditional shadow applicability, defaults, acceptance rows, and preview cases.

- [x] **Step 2: Run the test and record RED**

Expect missing sections, targets, and acceptance rows.

- [x] **Step 3: Add schema controls**

Use text for copy; sliders for font size, gap, and horizontal/vertical padding; colors for fill/text; switch/vector/sliders/colorOpacity for shadow. Keep shadow detail controls conditional on the switch.

- [x] **Step 4: Register inventory and acceptance**

Add the two workflow stages to `appControlSectionInventory`, register observable CTA outcomes, and add visual preview cases for colors and primary geometry.

- [x] **Step 5: Re-run Toolcraft contract tests**

Expect schema, inventory, acceptance, and preview coverage to pass.

### Task 4: Render the Figma CTA in Hero

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/hero-v4-styles.module.css`
- Create: `recraft-v4-styles/src/components/pages/home/hero-heading-cta.test.ts`

- [x] **Step 1: Write the failing source contract test**

Require one `data-hero-heading-cta` anchor inside the heading group, `href="#hero-cta"`, CTA text/settings bindings, authored padding/radius/colors/gap, and box-shadow mapping.

- [x] **Step 2: Run the test and record RED**

Expect failure because the CTA element is absent.

- [x] **Step 3: Implement the CTA**

Render the anchor after the heading using Geist Medium semantics, one-line text, dynamic authored styles, accessible focus-visible styling, and no fixed dimensions.

- [x] **Step 4: Re-run the website tests**

Expect CTA structure and style mapping to pass.

### Task 5: Focused browser proof and worklog

**Files:**
- Modify: `recraft-tools/hero/e2e/product-effects-preview.spec.ts`
- Modify: `recraft-tools/hero/docs/toolcraft/agent-worklog.md`

- [x] **Step 1: Add focused CTA scenarios**

Register real Toolcraft control scenarios for copy, padding, colors, gap, and shadow; assert the iframe output changes, retain `#hero-cta` in the website contract, and prove Apply serializes the matching v17 CTA settings.

- [x] **Step 2: Run only directly relevant tests**

Run the CTA unit/contract files and the CTA feature acceptance id. Do not run the aggregate delivery or performance suite.

- [x] **Step 3: Format touched files and check the diff**

Use focused `oxfmt`, then run `git diff --check`. Preserve the unrelated Fine Details plan modification.

- [x] **Step 4: Record truthful verification**

Add one worklog delivery entry with Figma source, control mapping, protocol v17, executed checks, and remaining visual/browser risk.
