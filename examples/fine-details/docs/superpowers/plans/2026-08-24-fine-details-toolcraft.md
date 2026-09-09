# Fine Details Toolcraft Implementation Plan

> **Execution note:** The user requested inline implementation and explicitly asked to skip automated/build/browser verification for this app. This plan therefore ends with a manual handoff and does not authorize tests, build, formatting, commit, push, or artifact export.

**Goal:** Replace the current Fine Details artwork with its light striped/grid background and add a standalone Toolcraft controller for background color, grid size, grid opacity, and section height, including live iframe preview plus adjacent Reset and Apply actions.

**Architecture:** The website owns the rendered section and a versioned preview/save bridge. Toolcraft embeds the real Next.js preview route in a pointer-transparent iframe, maps runtime schema state into the bridge, and persists only through the website's local development API. Apply writes the current settings; Reset resets Toolcraft state, the iframe, the adjacent website tab, and the tracked applied-settings JSON to shared defaults.

**Tech stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Zod, BroadcastChannel, Toolcraft generated runtime, CSS Modules.

---

## Task 1: Scaffold the standalone Fine Details Toolcraft app

**Files:**

- Create the generated app shell under `recraft-tools/fine-details/` from `recraft-tools/api-section/`.
- Preserve `recraft-tools/fine-details/docs/superpowers/specs/2026-08-24-fine-details-toolcraft-design.md`.
- Update `recraft-tools/fine-details/package.json`.
- Update `recraft-tools/fine-details/index.html`.
- Update `recraft-tools/fine-details/src/app/app-identity.ts`.

**Implementation:**

1. Copy the existing generated Toolcraft runtime, configs, scripts, and generic acceptance infrastructure without `node_modules`, `.toolcraft`, or the API Section superpowers documents.
2. Set the app/package identity to `fine-details` / `Fine Details`.
3. Keep the signed Toolcraft host structure and runtime extension points intact; product work stays under `src/app`.

## Task 2: Reduce the website Fine Details section to the retained background

**Files:**

- Create `recraft-v4-styles/src/components/pages/home/fine-details-applied-settings.json`.
- Create `recraft-v4-styles/src/components/pages/home/fine-details-settings.ts`.
- Modify `recraft-v4-styles/src/components/pages/home/fine-details-section.tsx`.
- Modify `recraft-v4-styles/src/app/(website)/page.tsx`.

**Implementation:**

1. Define shared defaults: 1920×1080 reference geometry, `#f2f2f2` background, 50px grid size, and 80% grid opacity.
2. Normalize height, hex color, grid size, and opacity into bounded settings.
3. Render only the section background and `/images/recraft-fine-details/grid.png` overlay; remove the parallax scene, heading, images, labels, palette, sticky note, clip, and other content from the active section tree without deleting reusable source assets.
4. Preserve responsive website height as `min(configured pixels, proportional viewport width)` so the default remains `min(1080px, 56.25vw)`.
5. Render the homepage through the settings-aware client boundary added in Task 3.

## Task 3: Add the website preview, Apply/Reset persistence, and adjacent-tab synchronization

**Files:**

- Create `recraft-v4-styles/src/components/pages/home/fine-details-preview-boundary.tsx`.
- Create `recraft-v4-styles/src/app/(toolcraft-preview)/toolcraft/fine-details/page.tsx`.
- Create `recraft-v4-styles/src/app/api/fine-details-settings/route.ts`.
- Create `recraft-v4-styles/src/features/fine-details-settings/index.server.ts`.
- Create `recraft-v4-styles/src/features/fine-details-settings/server/update-fine-details-settings.ts`.

**Implementation:**

1. Add the `/toolcraft/fine-details` route using the same real Fine Details section component as the homepage.
2. Accept only origin-checked version-1 `settings` and `save-settings` messages from a local Toolcraft parent.
3. Treat live `settings` messages as preview-only; ignore invalid messages and preserve the last valid view.
4. On Apply, atomically write normalized settings to `fine-details-applied-settings.json` through a development-only local PUT endpoint.
5. On Reset, persist the shared defaults instead of the incoming payload.
6. Broadcast successful Apply/Reset settings through `recraft.fine-details-settings` so an already-open website tab updates immediately.
7. Return a request-scoped acknowledgement to Toolcraft only after persistence succeeds.

## Task 4: Add the Fine Details controls and iframe bridge in Toolcraft

**Files:**

- Modify `recraft-tools/fine-details/src/app/app-schema.ts`.
- Modify `recraft-tools/fine-details/src/app/app-composition.tsx`.
- Create `recraft-tools/fine-details/src/app/fine-details-values.ts`.
- Create `recraft-tools/fine-details/src/app/fine-details-preview-protocol.ts`.
- Create `recraft-tools/fine-details/src/app/fine-details-preview-pipeline.ts`.
- Create `recraft-tools/fine-details/src/app/fine-details-preview-website-actions.ts`.
- Create `recraft-tools/fine-details/src/app/fine-details-panel-actions.ts`.
- Create `recraft-tools/fine-details/src/app/fine-details-preview.tsx`.
- Create `recraft-tools/fine-details/src/app/fine-details-preview.module.css`.
- Remove the copied API Section product bridge modules.

**Implementation:**

1. Use a 1920×1080 editable-output canvas so canonical Canvas height remains the section-height editor.
2. Add one `Background` section with built-in Color, Grid size, and Grid opacity controls bound to runtime schema state.
3. Add adjacent sticky Reset and Apply actions. Reset dispatches canonical `controls.reset` and saves shared defaults; Apply saves current canvas height plus current background settings.
4. Embed `http://localhost:3000/toolcraft/fine-details` in a pointer-transparent iframe and send compact settings payloads through the registered preview-sync pipeline.
5. Keep pending save requests request-scoped, time-bounded, and rejected when the iframe reloads or closes.
6. Do not add Layers, Timeline, uploads, canvas handles, custom controls, artifact export settings, export renderers, or export actions.

## Task 5: Align Toolcraft product metadata and handoff notes

**Files:**

- Modify `recraft-tools/fine-details/src/app/app-acceptance-data.ts`.
- Modify `recraft-tools/fine-details/src/app/app-performance.ts`.
- Modify `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`.

**Implementation:**

1. Declare a new non-spatial/fixed website-background product with explicit image export removal evidence and SVG/video not requested.
2. Record the Background entity section inventory and control-to-preview mappings.
3. Describe the iframe DOM renderer, empty workload envelope, no export renderer, no media, no timeline, and no layers.
4. Record that the workflow skill referenced by the local contract was unavailable, its local documentation fallback was followed, and automated/delivery/browser checks were skipped at the user's explicit request.
5. Hand the implementation to the user for local testing without running checks or changing Git history/remotes.
