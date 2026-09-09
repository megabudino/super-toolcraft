# Pre-footer Toolcraft bridge design

## Goal

Create a second standalone Toolcraft app beside `recraft-tools/hero` for the existing Recraft pre-footer section. The first version only previews the real website section through a bridge and synchronizes its visible height from Toolcraft.

## Product boundary

- New app folder: `recraft-tools/pre-footer`.
- Product name: `Pre Footer`.
- Website source of truth: `recraft-v4-styles/src/components/pages/home/pre-footer.tsx`.
- Default section and canvas size: 1920 × 1080 px.
- No hero controls, media upload, app-authored setting sections, custom canvas handles, timeline, layers, artifact export, Apply, or Reset actions.
- The standard Toolcraft runtime shell remains intact. Its editable-output Setup owns canvas dimensions and persistence.
- Only `canvas.size.height` is mapped across the product bridge. Canvas width continues to define preview viewport width but is not persisted as a website section setting.

## Architecture

### Toolcraft app

Generate a fresh standalone app from the current stable Toolcraft starter into `recraft-tools/pre-footer`; do not copy the existing hero product files. Disable starter upload and configure a finite editable-output canvas with the existing pre-footer baseline size.

The app composition mounts one product output component: an iframe that points to the website's dedicated pre-footer preview route. A small versioned protocol sends `{ height }` with channel `recraft.pre-footer-section`. The iframe sends a `ready` message after mounting so Toolcraft can resend current canonical state after navigation or reload.

`canvas.size.height` stays in Toolcraft runtime state, history, reset, settings transfer, and local workspace persistence. The bridge reads that canonical value and does not keep a second editable copy in React state.

### Website

Keep `PreFooter` as the single section implementation. Add an optional numeric height prop with the existing 1080 px value as its default, so the normal home page remains unchanged.

Add a client preview boundary that:

- accepts messages only from the trusted Toolcraft parent origin;
- validates the channel, protocol version, message type, and positive finite integer height;
- applies the received height to `PreFooter`;
- announces readiness to the parent after mounting.

Expose this boundary at `/toolcraft/pre-footer` in a preview-only route group with the same project fonts but without the website header and footer. The Toolcraft iframe loads only this route, so no scrolling or DOM querying is required.

## Renderer and interaction decisions

- Renderer: DOM iframe using the website-owned React, image, and font implementation.
- View interaction: fixed-camera, supported by the supplied static composition and the request to edit section height rather than a spatial scene.
- Interaction ownership: Toolcraft Setup owns the exact canvas/section height; the canvas itself has no duplicate resize handle.
- Pipeline: one constant-cost main-thread `postMessage` synchronization pass invalidated by initial render and `canvas.size.height` changes. Viewport pan and zoom do not resend product settings.
- Export intent: image, SVG, and video export are not included because the user requested a website controller only.
- Timeline and layers: absent because the requested first slice has one static website-owned section and one global height value.
- Performance envelope: no variable renderer workload dimensions; changing height sends one small message and lets the browser perform normal layout.

## Error handling

- Toolcraft ignores messages from any source window or origin other than its iframe.
- The website ignores malformed, unsupported, or untrusted messages and keeps the last valid height.
- Until the iframe is ready, Toolcraft retains canonical height and sends it after the ready handshake.
- The bridge does not write source files or synchronize other browser tabs in this first version.

## Alternatives considered

1. Dedicated preview route plus a versioned height bridge. Selected because it keeps the website component authoritative and gives Toolcraft an isolated section canvas.
2. Load the complete home page and scroll the iframe to the pre-footer. Rejected because header/footer changes, document height, and responsive layout would make framing fragile.
3. Copy the pre-footer JSX and assets into Toolcraft. Rejected because the website and editor would drift and the bridge would no longer exercise the real section.

## Verification tier

Verification tier: Tier 4 — first generated app delivery.

Reason: this creates a new standalone Toolcraft folder, a website preview route, and a cross-origin bridge.

Run: generated-app integrity/code-health checks, focused protocol and mapping tests, website and Toolcraft typechecks, one focused browser check that changes Canvas height and observes the section and iframe height, then start both local servers.

Skip: measured performance and the full performance audit because the user did not request performance work. Avoid unrelated broad website browser suites.

## Success criteria

- `recraft-tools/pre-footer` exists beside `recraft-tools/hero` and opens as an independent Toolcraft app.
- The canvas displays the real pre-footer without the website header/footer.
- Changing Toolcraft Canvas height changes both the finite canvas height and the rendered pre-footer height to the same pixel value.
- Refreshing the Toolcraft app restores its persisted height and resynchronizes the preview after the ready handshake.
- The new app contains no hero-specific product code or controls.
