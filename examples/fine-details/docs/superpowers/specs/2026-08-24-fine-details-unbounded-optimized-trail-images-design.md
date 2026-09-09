# Fine Details Unbounded Optimized Trail Images Design

## Goal

Remove the fixed 24-image limit from the Fine Details trail and keep large source files out of the website preview. Toolcraft retains each original upload, prepares one display-sized derivative for the preview, and the website renders that derivative through `next/image`.

“Unbounded” means there is no product-level item-count cap or silent truncation. Browser memory and available storage remain practical environmental limits.

## Current Constraints

- `Trail Images` declares `hardMaxItems: 24`, so Toolcraft rejects the twenty-fifth item before import.
- Trail settings and media validation independently truncate or reject collections over 24 items.
- Preview media sync fetches every original presentation blob and sends it unchanged through `postMessage`.
- The website decodes a temporary bounded bitmap but keeps and renders the original blob URL, so this decode step does not reduce transferred bytes or retained memory.
- Trail cards use a native `<img>` rather than `next/image`.
- Uploaded media uses runtime `blob:` URLs. The Next.js image optimizer cannot fetch those URLs, so changing only the JSX element would not reduce the payload.

## Chosen Approach

Toolcraft creates a preview derivative once per uploaded image. The derivative is sized for the largest possible trail card rather than the current slider value, so later `Card size` changes do not trigger collection-wide reprocessing.

- Maximum card height: `400px` from the existing control.
- Preview density: `2x`.
- Target card-axis resolution: `800px`.
- For rotations `0°` and `180°`, the source height is limited to 800 pixels and width follows the source aspect ratio.
- For rotations `90°` and `270°`, the source width is limited to 800 pixels and height follows the source aspect ratio.
- Images smaller than the target are not enlarged.
- Oversized raster inputs are encoded once as WebP with alpha support and a fixed visual-quality setting.
- Already bounded inputs may reuse the source blob when no resize is required.

This preprocessing, rather than `next/image`, is what prevents oversized blobs from entering the iframe. The website still uses `next/image` consistently, with `unoptimized` because the derivative source is a local `blob:` URL.

## Data Flow

1. Toolcraft imports and retains every original image through the existing media repository.
2. Preview media sync resolves the original presentation URL when that image has not yet been sent for the current iframe revision.
3. A preview-derivative helper decodes the source, computes the bounded dimensions, and produces the derivative blob.
4. Work runs with bounded concurrency and messages are emitted in small batches. The implementation must not create one `Promise.all` containing the entire unbounded collection.
5. The iframe media store creates an object URL for the derivative and records its actual derivative dimensions.
6. The trail cycles through the full ordered settings list. Only the existing `Length` number of live cards is rendered at once.
7. Card rendering uses `next/image` with explicit intrinsic dimensions, `unoptimized`, empty alternative text, and the existing visual transform and card geometry.

The derivative cache key is scoped to the source resource reference and its quarter-turn orientation. Removing an asset releases its presentation handle and allows the existing website media-store GC to revoke its derivative URL.

## Removing the Count Limit

Every independent 24-item boundary must be removed together:

- Remove `hardMaxItems` from the Toolcraft file-drop schema.
- Update descriptions and performance language that call the collection bounded.
- Remove `.slice(0, 24)` from Toolcraft trail-image/settings creation.
- Normalize every supplied settings image instead of slicing the array.
- Remove the media-message `images.length > 24` rejection.
- Keep per-item validation, duplicate protection, MIME validation, and resource cleanup.
- Keep `recommendedMaxItems` only if it remains purely advisory and produces no import rejection or disabled add button; otherwise remove it from this control.

Settings metadata may still travel as one lightweight ordered array. Binary image blobs must travel incrementally.

## Next.js Rendering

The native image element in the website trail is replaced with `Image` from `next/image`.

- `src`: derivative object URL.
- `width` and `height`: actual derivative dimensions adjusted for the existing rendered orientation.
- `unoptimized`: required for a local `blob:` source.
- `alt=""` and `aria-hidden="true"`: cards remain decorative.
- Existing absolute positioning, cropping, flips, rotations, fade, scale, shadow, and card geometry remain unchanged.

No server upload route, temporary server filesystem, or repository persistence is introduced.

## Failure Handling

- A failed decode or derivative encode marks only that image unavailable to the preview; it does not block the remaining collection.
- Aborted iframe revisions stop pending derivative work and do not post stale batches.
- A derivative is marked sent only after its batch is posted successfully.
- Removing images while work is pending must prevent those images from being retained as active preview media.
- The original Toolcraft asset remains available for retry after an iframe reload.

## Verification

Focused checks only:

- A Toolcraft product test proves the file-drop schema has no hard maximum.
- Settings/protocol tests prove 25 or more ordered image descriptors survive without truncation or rejection.
- Derivative helper tests cover landscape, portrait, quarter-turn orientation, no upscaling, and bounded output dimensions.
- A source or component test proves trail cards use `next/image` rather than a native `<img>`.
- Runtime browser verification uploads more than 24 images, confirms the error is absent, moves over the canvas, and confirms visible trail cards use derivative-sized blobs.

Repository-wide build, lint, and broad browser suites are outside this handoff unless requested.

## Out of Scope

- Persisting uploaded trail images to the website or a remote service.
- Server-side Next.js image optimization for runtime blob URLs.
- Reprocessing the collection whenever `Card size` changes.
- Changing trail geometry, animation behavior, ordering, transforms, or live-card `Length` limits.
- Promising unlimited physical memory; the requirement removes explicit application count caps.
