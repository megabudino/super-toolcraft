# Studio Room Toolcraft Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone Toolcraft app that previews the real Recraft Studio Room website section and synchronizes its preview size live, without Apply or website persistence.

**Architecture:** The website remains the only visual renderer. A small versioned iframe boundary receives the Toolcraft canvas height; Toolcraft owns its normal canvas/workspace state but has no product controls or panel actions yet. The app is isolated as `studio-room` from the existing mountain `pre-footer` product.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Motion, Toolcraft generated runtime, Vite, Vitest, Playwright, `postMessage`.

---

### Task 1: Website Preview Boundary

**Files:**
- Create: `recraft-v4-styles/src/components/pages/home/studio-room-settings.ts`
- Create: `recraft-v4-styles/src/components/pages/home/studio-room-settings.test.ts`
- Create: `recraft-v4-styles/src/components/pages/home/studio-room-preview-protocol.ts`
- Create: `recraft-v4-styles/src/components/pages/home/studio-room-preview-boundary.tsx`
- Create: `recraft-v4-styles/src/components/pages/home/studio-room-preview-boundary.test.ts`
- Create: `recraft-v4-styles/src/app/(toolcraft-preview)/toolcraft/studio-room/page.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/pre-footer.tsx`

- [ ] Write focused RED tests for default height `1080`, clamp/round `576..8192`, strict `recraft.studio-room` v1 `settings`/`ready` messages, trusted parent source/origin, and the preview route.
- [ ] Run `pnpm dlx tsx --test src/components/pages/home/studio-room-settings.test.ts src/components/pages/home/studio-room-preview-boundary.test.ts` and confirm the missing-contract RED.
- [ ] Implement `StudioRoomSettings { height }`, normalization, and a preview boundary that starts from defaults, posts `ready`, accepts only normalized live settings from the trusted parent, removes its listener on cleanup, and renders only `<PreFooter settings={settings} />`.
- [ ] Keep normal `<PreFooter />` responsive at `100svh`; apply a numeric height only when preview settings are supplied.
- [ ] Run the same focused tests, focused `oxfmt`/`oxlint`, and a scoped `git diff --check`.

### Task 2: Standalone Toolcraft App

**Files:**
- Create generated app: `recraft-tools/studio-room/`
- Create product modules: `recraft-tools/studio-room/src/app/studio-room-preview-protocol.ts`, `studio-room-preview-pipeline.ts`, `studio-room-preview.module.css`, `studio-room-preview.tsx`, `studio-room-preview.product.test.ts`
- Modify: `package.json`, `index.html`, `src/app/app-identity.ts`, `app-schema.ts`, `app-composition.tsx`, `app-acceptance-data.ts`, `app-performance.ts`, `docs/toolcraft/agent-worklog.md`

- [ ] Copy the current generated Toolcraft shell without `node_modules`, build/test output, `.toolcraft`, source-product modules, or source-product E2E; preserve the signed runtime/bootstrap/contracts.
- [ ] Set package/id/title to `studio-room` / `Studio Room`; install dependencies once with `pnpm install --frozen-lockfile`.
- [ ] Declare editable finite canvas `1920 × 1080`, normal history/radar/zoom, an empty Controls panel, and no actions, layers, timeline, uploads, or artifact export.
- [ ] Add one DOM iframe pipeline pass invalidated by initial render and `canvas.size.height`.
- [ ] Implement the external preview at `http://localhost:3000/toolcraft/studio-room`: attach the listener before mounting the iframe, never post before strict `ready`, preserve ready-before-load state for current and subsequent height sync, schedule sync for later `ready` messages, fill the scene frame, and expose `data-toolcraft-product-output="studio-room-external-preview"`.
- [ ] Declare product readiness, empty control inventory/workload envelope, fixed inspected-reference view, no exports, and acceptance for live height, exact finite/infinity scene restoration, and workspace reload.
- [ ] Record the first Decision Trail entry with explicit no-Apply/no-persistence scope and measured performance not run.
- [ ] Run only focused product/schema tests, `pnpm ai:check`, `pnpm typecheck`, `pnpm docs:check`, and scoped `git diff --check`.

### Task 3: Short Integration Check

**Files:**
- Create: `recraft-tools/studio-room/e2e/product-studio-room-preview.spec.ts`

- [ ] Add one focused browser case that changes Canvas height through the real Toolcraft UI and observes the real iframe section height.
- [ ] Start the website and Toolcraft development servers only if they are not already serving the correct identities.
- [ ] Run the single focused browser case; do not run broad delivery, build, export, or performance suites.
- [ ] Confirm the room, tile animation, centered CTA, and pointer perspective still render in the iframe with no console errors.
- [ ] Review the final diff and confirm unrelated Hero/Fine Details work plus the existing mountain `pre-footer` app are untouched.
