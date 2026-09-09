# Studio Room Unbounded Tile Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Studio Room Tile Images collection limit while preserving strict validation and media order.

**Architecture:** Make the Toolcraft file-drop control unbounded, stop truncating media-derived settings, and let both protocol validators accept any finite collection of individually valid unique descriptors. Keep the existing transformed derivative and object-URL lifecycle unchanged.

**Tech Stack:** TypeScript, React, Toolcraft runtime schema, Next.js website settings, Vitest, Node test runner.

---

### Task 1: Add a larger-than-12 contract

**Files:**
- Modify: `recraft-tools/studio-room/src/app/studio-room-preview.product.test.ts`
- Modify: `recraft-v4-styles/src/components/pages/home/studio-room-settings.test.ts`

- [ ] **Step 1: Add the Toolcraft collection proof**

Create 20 ordered ready image assets, pass them through `createStudioRoomTileImagesFromMediaAssets`, `createStudioRoomSettingsFromValues`, and `createStudioRoomPreviewSettingsMessage`, then assert all 20 descriptors remain ordered and `isStudioRoomPreviewSettingsMessage` accepts the message. Assert the uploader has neither `hardMaxItems` nor `recommendedMaxItems`.

- [ ] **Step 2: Add the website normalization proof**

Create 20 valid unique descriptors with orders `0..19`, pass them to `normalizeStudioRoomSettings`, and assert all 20 survive unchanged.

### Task 2: Remove Toolcraft limits

**Files:**
- Modify: `recraft-tools/studio-room/src/app/app-schema.ts`
- Modify: `recraft-tools/studio-room/src/app/studio-room-values.ts`
- Modify: `recraft-tools/studio-room/src/app/studio-room-preview-protocol.ts`

- [ ] **Step 1: Make the uploader unbounded**

Remove `hardMaxItems: 12` and `recommendedMaxItems: 12` from the Tile Images file-drop control while retaining `multiple: true`.

- [ ] **Step 2: Preserve every media asset**

Remove both `.slice(0, 12)` calls so media conversion and settings construction map every valid image and rewrite contiguous order values.

- [ ] **Step 3: Accept all non-negative safe order values**

Replace the protocol's `0..11` order bound with a non-negative safe-integer check, and remove the collection-length rejection. Retain uniqueness and descriptor validation.

### Task 3: Remove the website limit

**Files:**
- Modify: `recraft-v4-styles/src/components/pages/home/studio-room-settings.ts`

- [ ] **Step 1: Normalize unbounded order values**

Replace the `0..11` order normalization with a non-negative safe-integer check.

- [ ] **Step 2: Accept the complete collection**

Remove the `value.length > 12` guard while retaining the array, descriptor, uniqueness, and media-reference checks.

### Task 4: Focused verification

**Files:**
- Verify only the two focused test files and touched production files.

- [ ] **Step 1: Run the two focused test files**

Run the Studio Room product test in Toolcraft and the Studio Room settings test on the website. Expected: the new 20-image contracts pass.

- [ ] **Step 2: Run scoped formatting and diff checks**

Format only touched files and run `git diff --check` for them. Do not run aggregate tests, builds, typechecks, or browser suites.
