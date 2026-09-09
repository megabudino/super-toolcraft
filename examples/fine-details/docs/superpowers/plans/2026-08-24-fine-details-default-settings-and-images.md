# Fine Details Default Settings And Images Implementation Plan

> **Execution note:** This is approved inline work. Implement the tasks below sequentially and preserve unrelated Hero changes already present in the worktree.

**Goal:** Make the supplied Fine Details settings and the 50 images currently attached in Dia the canonical defaults for Toolcraft and the website, while keeping website delivery on optimized `next/image` sources.

**Architecture:** Keep user-uploaded images on the existing runtime media/`blob:` path. Add a stable, ordered default-image identity (`fine-details-default-01` … `50`) shared by Toolcraft settings and website rendering. Toolcraft owns removable/resettable default attachments through `media.defaultAssets`; the website resolves those identities to checked-in 800 px WebP files and renders them through `next/image`. Persisted website settings continue to omit binary media and fall back to the built-in default image list when no live image list is supplied.

**Tech Stack:** Vite/React Toolcraft app, Next.js 16 Image component, TypeScript, Vitest, WebP assets.

**Verification tier:** Tier 3 — default media, renderer input, and reset behavior change.

**Run:** focused defaults/schema/media tests, focused website settings/media tests, touched-file format/lint/type checks where available, one focused browser check, and `git diff --check`.

**Skip:** aggregate delivery, broad browser/performance, and repository-wide rewrite because this is a later bounded media/defaults change.

---

## Task 1: Lock the requested defaults with failing tests

**Files:**

- Modify: `recraft-tools/fine-details/src/app/app-schema.test.ts`
- Create: `recraft-tools/fine-details/src/app/fine-details-defaults.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-settings.test.ts`

1. Assert the exact numeric, color, vector, border, shadow, typography, and prompt defaults from `fine-details-settings (2).json`.
2. Assert Toolcraft exposes exactly 50 ordered image default assets for `trail.images`.
3. Assert website normalization falls back to 50 built-in images when persisted settings omit `trail.images`, while an explicit live image array still wins.
4. Run the focused tests and record the expected red failures before implementation.

## Task 2: Produce bounded image assets and identity manifests

**Files:**

- Create: `recraft-v4-styles/public/images/home/fine-details-trail-v1/fine-details-trail-01.webp` … `50.webp`
- Create: `recraft-tools/fine-details/src/app/assets/fine-details-trail/fine-details-trail-01.webp` … `50.webp`
- Create: `recraft-tools/fine-details/src/app/fine-details-default-assets.ts`
- Create: `recraft-v4-styles/src/components/pages/home/fine-details-default-assets.ts`

1. Convert the 50 Dia JPEGs in their current order to WebP with a maximum website axis of 800 px.
2. Create smaller Toolcraft uploader previews from the same ordered sources.
3. Export stable ids, file names, intrinsic dimensions, and website URLs; keep the Toolcraft data URLs build-owned through a generated JSON data manifest that remains readable by both Vite and the plain-Node Playwright reporter.
4. Confirm counts, order, dimensions, and exact aggregate byte sizes.

## Task 3: Apply the supplied settings and default media in Toolcraft

**Files:**

- Modify: `recraft-tools/fine-details/src/app/fine-details-trail-values.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-typography-values.ts`
- Modify: `recraft-tools/fine-details/src/app/fine-details-prompt-values.ts`
- Modify: `recraft-tools/fine-details/src/app/app-schema.ts`

1. Replace the old defaults with the exact imported JSON values.
2. Register the ordered 50-image set through `media.defaultAssets`, with `sourceTarget: "trail.images"` and stable ids.
3. Leave the `fileDrop` value model empty; media owns the attachments, ordering, persistence, removal, and Reset restoration.
4. Run the focused Toolcraft tests to green.

## Task 4: Use the built-in defaults and Next Image on the website

**Files:**

- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-settings.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-applied-settings.json`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-image-trail.tsx`
- Modify: `recraft-v4-styles/src/components/pages/home/fine-details-trail-media-store.ts`

1. Set the exact supplied settings as website defaults and applied settings.
2. Seed `defaultFineDetailsTrailSettings.images` from the 50-image website manifest.
3. Preserve explicit live Toolcraft images, but restore built-in defaults when persisted settings omit the non-persisted image field.
4. Resolve stable default ids to the checked-in website URLs and render those cards with optimized `next/image`; retain `unoptimized` only for runtime `blob:` uploads.
5. Keep transforms, aspect ratios, media order, and readiness behavior identical across both source types.

## Task 5: Focused verification and worklog

**Files:**

- Modify: `recraft-tools/fine-details/docs/toolcraft/agent-worklog.md`

1. Read the Verification-phase contracts before running proof.
2. Run focused Toolcraft defaults/schema/media tests and focused website settings/media tests.
3. Format and lint only touched source files; run bounded type checking if the projects provide a focused route.
4. Verify in a browser that the default 50-image set appears in its final layout and that the website images use the Next Image optimizer URL. Record the existing base-uploader blocker honestly if a new upload is not committed while `media.defaultAssets` are present; do not substitute a false passing scenario.
5. Run `git diff --check`, review status for unrelated changes, and report the exact total bytes for the website set, Toolcraft preview set, and both checked-in sets together.
