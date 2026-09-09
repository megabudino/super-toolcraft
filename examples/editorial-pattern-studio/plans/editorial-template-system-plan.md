# Geist Editorial Template System — Implementation Plan

**Goal:** Replace the three generic editorial layouts with ten reference-derived modular grid templates, unique authored copy per template, an opt-in custom-copy workflow, and Geist typography across the editor, preview, and export.

**Verification tier:** Tier 4

**Reason:** This pass changes a dependency, persisted schema targets, the custom renderer scene model, SVG and Canvas typography/layout, acceptance mappings, browser coverage, and the production deployment.

**Run:** `npm run ai:check`; targeted template/schema tests; `npm run verify:quick`; focused browser acceptance and template-switch performance measurement; `npm run verify:final`; real-browser visual QA; production Vercel deployment and public health check.

**Skip:** The full performance checkpoint is not triggered because this is a post-first-working feature iteration and the user did not report performance problems. Timeline, layers, media, and video remain absent.

## Task 1 — Lock the template contract with tests

**Files:**

- Create `src/app/editorial-templates.ts`
- Modify `src/app/app-schema.test.ts`

- Add failing tests for exactly ten template ids and visible labels.
- Require unique marker, eyebrow, headline, body, footer, annotation content, and combined-copy signatures for every template.
- Require a different total text-element count for every template, spanning sparse and dense editorial compositions.
- Require normalized 12-column/baseline layout definitions, at least one dominant display role, bounded pattern anchors below the page midpoint, and safe text/rule coordinates.
- Test template lookup fallback and template-vs-custom copy resolution.
- Run the focused unit test once before implementation to prove the new contract is missing.

## Task 2 — Build the normalized editorial template library

**Files:**

- Create `src/app/editorial-templates.ts`

- Define ten ids: Modular Index, Edge Catalogue, Service Grid, Baseline Field, Type Scale, Negative Space, Column Rhythm, Optical Balance, Margin System, and Variable Order.
- Author distinct design/typography/layout copy for every template.
- Define normalized text roles, variable Geist weights, size/leading/tracking, alignment/rotation, grid visibility, accent rules, template-relative pattern anchors, and zero-to-nine independent annotation blocks so scenes contain six to fifteen text elements.
- Keep all patterns bottom-positioned and partially clipped while preserving the existing Position and Scale offsets.
- Expose pure helpers for option generation, id validation, fallback lookup, and copy resolution.

## Task 3 — Replace the Editorial schema model and font dependency

**Files:**

- Modify `src/app/app-schema.ts`
- Modify `src/styles.css`
- Modify `package.json`
- Modify `package-lock.json`

- Replace `editorial.layout` segmented control with a full-width `editorial.template` select containing ten options.
- Add `editorial.customCopy` switch.
- Gate eyebrow, headline, body, and footer editors with `visibleWhen` so they appear only for custom copy.
- Keep existing copy targets for user-authored overrides and give every control a default, performance role, and reason.
- Bump persistence identity/version to avoid reviving the retired three-layout target.
- Replace Inter with the self-hosted Geist Variable package and global font token.
- Leave Field Equation, Line Form, Color Segments, palette, background, image export, timeline, layers, settings transfer, and sticky action behavior unchanged.

## Task 4 — Rewrite the preview/export text-layout scene

**Files:**

- Modify `src/app/editorial-pattern-renderer.tsx`

- Read the selected template and resolve either template-authored or custom copy.
- Replace the fixed five-block scene with a normalized role-based scene containing a variable number of core and template-authored annotation blocks, grid rules, accent rules, and a template-relative pattern anchor.
- Add rotation, alignment, opacity, tracking, and variable-weight support shared by SVG and Canvas text rendering.
- Generate faint construction grids behind the product foreground only for templates that declare them.
- Keep the equation label dynamic and keep the parametric line behind semantic text.
- Use Geist Variable in both SVG `fontFamily` and Canvas `font` after `document.fonts.ready`.
- Preserve background inclusion, 2K/4K/8K image export, color segmentation, palette shuffle, and control-driven pattern transforms.

## Task 5 — Align acceptance, performance, browser tests, and worklog

**Files:**

- Modify `src/app/app-acceptance.ts`
- Modify `src/app/app-acceptance.test.ts`
- Modify `src/app/app-performance.ts`
- Modify `e2e/app-controls.spec.ts`
- Modify `e2e/editorial-pattern-performance.spec.ts` only if the template target needs targeted timing coverage
- Modify `docs/toolcraft/agent-worklog.md`

- Replace layout coverage with template-select coverage across all ten options.
- Prove every template changes product output and renders distinct text through the real select.
- Prove Custom copy reveals the editors, each field changes product text, switching it off restores selected-template copy, and reload persistence restores the selected template/copy mode.
- Assert Geist is loaded and applied to product text.
- Update the renderer pipeline so template/copy controls invalidate only text-layout and preview composite passes.
- Add a targeted template-switch timing check because template selection rebuilds multiple SVG text/rule nodes.
- Record the new references, design decisions, state/output mapping, verification evidence, skipped full-performance reason, and deployment.

## Task 6 — Verify visually, run the final gate, and deploy

- Run `npm run verify:quick` during implementation.
- Start/reuse the project dev server and use a real browser to inspect the default template plus at least four contrasting templates, including one visible-grid layout and one edge/cropped layout.
- Check console errors, font resolution, text fitting, pattern crop, panel control visibility, and representative mobile/desktop viewport behavior.
- Run the targeted template-switch performance scenario.
- Run `npm run verify:final`.
- Redeploy the verified build to the existing Vercel production project.
- Confirm the public alias serves the new ten-template build and has no browser console errors.
