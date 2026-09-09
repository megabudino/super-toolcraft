# Studio Room Wall Fill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent, live Toolcraft color control for the Studio Room inner back-wall fill.

**Architecture:** Extend the canonical `room` settings group with one `wallFill` hex color and carry it through Toolcraft values, schema, acceptance records, the strict v4 preview bridge, website normalization, and persistence. `PreFooterRoom` applies the normalized value through a CSS custom property used only by the inner `.backWall` element.

**Tech Stack:** TypeScript, React, Toolcraft schema/runtime, postMessage preview protocol, CSS Modules, Vitest, Node test runner

---

### Task 1: Extend the canonical Toolcraft settings and preview protocol

**Files:**
- Modify: `src/app/studio-room-values.test.ts`
- Modify: `src/app/studio-room-values.ts`
- Modify: `src/app/studio-room-preview-protocol.ts`
- Modify: `src/app/studio-room-preview-pipeline.ts`
- Modify: `src/app/studio-room-preview.product.test.ts`
- Modify: `src/app/app-performance.ts`

- [x] **Step 1: Write failing value and protocol expectations**

Add assertions for the default and a nondefault mapped value:

```ts
expect(STUDIO_ROOM_DEFAULTS.room.wallFill).toBe("#F1F6DE");
expect(
  createStudioRoomSettingsFromValues({
    [studioRoomTargets.roomWallFill]: "#123abc",
  }).room.wallFill,
).toBe("#123ABC");
```

Update the product test to expect protocol `4`, runtime ID `studio-room-external-preview-v4`, the `room.wallFill` target in the preview pipeline, and `wallFill: "#F1F6DE"` in defaults.

- [x] **Step 2: Run the focused Toolcraft tests and verify failure**

```bash
pnpm exec vitest run src/app/studio-room-values.test.ts src/app/studio-room-preview.product.test.ts --reporter=default
```

Expected: FAIL because `roomWallFill`, the field, and protocol v4 are not implemented.

- [x] **Step 3: Add the target, field, default, and value mapping**

In `studio-room-values.ts`, add:

```ts
roomWallFill: "room.wallFill",
```

Add `wallFill: string` to the `room` settings type, default it to `"#F1F6DE"`, and map it with:

```ts
wallFill: colorValue(
  values[studioRoomTargets.roomWallFill],
  STUDIO_ROOM_DEFAULTS.room.wallFill,
),
```

- [x] **Step 4: Upgrade and validate the strict preview contract**

Set `STUDIO_ROOM_PREVIEW_VERSION = 4`, require `wallFill` in the strict room payload, and validate it with the existing `color()` helper:

```ts
!hasOnlyKeys(room, ["depth", "vanishing", "wallBorder", "wallFill"]) ||
!color(room.wallFill)
```

Add `studioRoomTargets.roomWallFill` to `studioRoomPreviewSettingsTargets`, change the runtime ID to `studio-room-external-preview-v4`, and update the protocol description in `app-performance.ts` to v4.

- [x] **Step 5: Run the focused Toolcraft tests**

```bash
pnpm exec vitest run src/app/studio-room-values.test.ts src/app/studio-room-preview.product.test.ts --reporter=default
```

Expected: both test files PASS.

### Task 2: Publish the Toolcraft control and product records

**Files:**
- Modify: `src/app/app-schema.ts`
- Modify: `src/app/app-schema.test.ts`
- Modify: `src/app/app-acceptance-data.ts`
- Modify: `src/app/studio-room-preview.product.test.ts`

- [x] **Step 1: Write the failing schema expectation**

Assert the Room section exposes:

```ts
wallFill: {
  defaultValue: "#F1F6DE",
  label: "Wall fill",
  target: studioRoomTargets.roomWallFill,
  type: "color",
}
```

Also expect six interaction ownership entries and include `room.wallFill` in the Room inventory and pipeline assertions.

- [x] **Step 2: Add the Room color control**

Add this control beside the wall border controls:

```ts
wallFill: color(
  "Wall fill",
  studioRoomTargets.roomWallFill,
  STUDIO_ROOM_DEFAULTS.room.wallFill,
),
```

- [x] **Step 3: Register acceptance, ownership, and inventory**

Add one panel `property-edit` ownership row targeting `studioRoomTargets.roomWallFill`, one `color` acceptance entry with an observable describing only the inner wall, and add the target to the `Room` control-section inventory. Change current v3 acceptance fixture strings to v4.

- [x] **Step 4: Run focused schema and product tests**

```bash
pnpm exec vitest run src/app/app-schema.test.ts src/app/studio-room-preview.product.test.ts --reporter=default
```

Expected: the schema and product tests PASS with the new Room control covered.

### Task 3: Normalize, persist, and render the website setting

**Files:**
- Modify: `../../recraft-v4-styles/src/components/pages/home/studio-room-settings.test.ts`
- Modify: `../../recraft-v4-styles/src/components/pages/home/studio-room-settings.ts`
- Modify: `../../recraft-v4-styles/src/components/pages/home/studio-room-applied-settings.json`
- Modify: `../../recraft-v4-styles/src/components/pages/home/studio-room-preview-protocol.ts`
- Modify: `../../recraft-v4-styles/src/components/pages/home/studio-room-preview-boundary.test.ts`
- Modify: `../../recraft-v4-styles/src/components/pages/home/pre-footer-room.tsx`
- Modify: `../../recraft-v4-styles/src/components/pages/home/pre-footer-room.module.css`

- [x] **Step 1: Write failing website settings expectations**

Add `wallFill: "#F1F6DE"` to default expectations, assert lowercase input normalizes to uppercase, assert legacy rooms without `wallFill` receive the default, and assert persisted settings retain a nondefault fill. Update boundary expectations to protocol v4.

- [x] **Step 2: Extend website normalization compatibly**

Add `wallFill: string` to `StudioRoomRoomSettings` and its default. Permit `wallFill` in `normalizeRoom`, default it when absent, and reject malformed values when present:

```ts
const wallFill = roomKeys.includes('wallFill')
  ? normalizeColor(value.wallFill)
  : defaultStudioRoomSettings.room.wallFill;
```

Return `{ depth, vanishing, wallBorder, wallFill }`, add the default field to `studio-room-applied-settings.json`, and set the website preview version to `4`.

- [x] **Step 3: Apply the fill only to the inner back wall**

Publish:

```ts
'--room-wall-fill': settings.room.wallFill,
```

Replace the hardcoded `.backWall` background with:

```css
background: var(--room-wall-fill);
```

Leave `.stage { background: #f1f6de; }` unchanged.

- [x] **Step 4: Run only focused website tests and diff validation**

```bash
node --import ./scripts/register-test-hooks.mjs --import tsx --test src/components/pages/home/studio-room-settings.test.ts src/components/pages/home/studio-room-preview-boundary.test.ts src/components/pages/home/pre-footer-room-motion.test.ts
git diff --check
```

Expected: all selected tests PASS and diff validation reports no errors.

- [x] **Step 5: Commit the complete feature**

```bash
git add recraft-tools/studio-room recraft-v4-styles/src/components/pages/home/studio-room-settings.test.ts recraft-v4-styles/src/components/pages/home/studio-room-settings.ts recraft-v4-styles/src/components/pages/home/studio-room-applied-settings.json recraft-v4-styles/src/components/pages/home/studio-room-preview-protocol.ts recraft-v4-styles/src/components/pages/home/studio-room-preview-boundary.test.ts recraft-v4-styles/src/components/pages/home/pre-footer-room.tsx recraft-v4-styles/src/components/pages/home/pre-footer-room.module.css
git commit -m "feat: add Studio Room wall fill control"
```
