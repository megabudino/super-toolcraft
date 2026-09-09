# Studio Room Toolcraft Setup Design

**Date:** 2026-08-25

## Goal

Create a standalone Toolcraft app for the existing homepage section rendered by `PreFooterRoom` and `PreFooter`. The first delivery establishes a real-website iframe and versioned live synchronization. More visual controls will be added in later deliveries without replacing this boundary.

## Source Of Truth

- Website renderer: `recraft-v4-styles/src/components/pages/home/pre-footer-room.tsx`
- Website section composition and copy: `recraft-v4-styles/src/components/pages/home/pre-footer.tsx`
- Reference appearance: the supplied screenshot of the perspective room with image tiles and the centered “Try in Recraft Studio” link
- Toolcraft assembly pattern: the current generated Toolcraft shell

The Toolcraft app must embed the real website component. It must not reconstruct the room, typography, images, pointer animation, or layout in Toolcraft-owned JSX.

## Naming And Isolation

Use `studio-room` as the product and route name:

- Toolcraft app: `recraft-tools/studio-room`
- Website preview route: `/toolcraft/studio-room`
- Bridge channel: `recraft.studio-room`

The existing `recraft-tools/pre-footer` app remains untouched because it owns a different mountain/parallax section.

## First-Delivery Behavior

The first settings payload contains only:

```ts
type StudioRoomSettings = {
  height: number;
};
```

- Default Toolcraft frame: `1920 × 1080` pixels.
- Canvas height changes immediately resize the website-owned preview section.
- Canvas width controls the Toolcraft scene frame and iframe width; the section stays responsive within that frame.
- Live edits are preview-only and are never persisted to the homepage.
- Settings are clamped to a finite safe range before rendering.

No room geometry, tile, color, typography, motion, or image controls are exposed in this delivery.

## Website Architecture

Introduce a small preview-settings model beside the section with defaults and normalization.

`PreFooter` accepts optional normalized preview settings and uses the numeric height only when they are supplied. The normal homepage call keeps the existing `100svh` behavior. Minimum height, overflow clipping, content, and room animation remain unchanged.

`StudioRoomPreviewBoundary` owns iframe communication. It:

1. starts from preview defaults;
2. accepts versioned live settings messages from Toolcraft;
3. rejects wrong origins, channels, versions, and payloads.

The homepage and preview route render the same section component. The homepage has no dependency on preview state.

## Toolcraft Architecture

Generate `studio-room` from the current standalone Toolcraft app template, excluding copied runtime state such as `node_modules`, build output, test output, and saved server-port files.

The app uses:

- `defineToolcraft` and the signed `ToolcraftApp` host;
- finite editable output sizing;
- `canvasContent` containing only the iframe product output;
- one DOM renderer pipeline pass for settings synchronization;
- no layers, timeline, uploads, custom controls, panel actions, or Toolcraft artifact export;
- normal Toolcraft persistence for canvas and panels.

The iframe remains the sole visual renderer. Toolcraft does not inspect or manipulate its DOM.

## Data Flow

```text
Toolcraft canvas height
  -> studio-room settings payload
  -> postMessage to website iframe
  -> StudioRoomPreviewBoundary normalization
  -> real PreFooterRoom render

```

## Failure Handling

- The message listener is attached before the iframe mounts.
- Live changes begin only after the iframe sends `ready`.
- Iframe load never posts before readiness; `ready` received before load stays valid and replays current settings, while every later `ready` still schedules the canonical sync pass.
- Invalid payloads never reach the renderer.

## Verification

**Verification tier:** Tier 4 — first standalone product delivery.

Focused development checks cover:

- settings normalization;
- protocol validation and readiness lifecycle;
- Toolcraft schema/composition/acceptance contracts;
- iframe readiness, live height synchronization, and reload cleanup;
- homepage preservation of its existing responsive height.

The first completed app runs the protected functional delivery gate and starts its local development server. Measured performance is not authorized or run.

## Explicit Non-Goals

- No visual reconstruction from the screenshot.
- No controls beyond the runtime-owned canvas size.
- No Apply action or website persistence API.
- No edits to the existing mountain `pre-footer` Toolcraft app.
- No shared-runtime refactor.
- No image replacement, upload, export, timeline, or layer support.
