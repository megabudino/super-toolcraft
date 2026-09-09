# Fine Details Carousel Drag, Hover Pause, and Download

## Goal

Make the Fine Details carousel interactive in both the standalone website and the Toolcraft preview:

- automatic marquee motion runs only while the pointer is not over an image;
- an overflowing marquee can be dragged horizontally by mouse or touch;
- automatic motion resumes from the dragged position after the pointer leaves the image;
- the hovered image exposes a download action in its top-right corner.

This delivery does not add controls, settings, persistence fields, or protocol fields.

## Pointer routing

The Toolcraft website iframe remains non-interactive in Trail mode so the existing parent-owned trail pointer pipeline continues to work. In Carousel mode the iframe receives pointer events directly. The sandbox adds `allow-downloads` so the explicit user download action is permitted. This makes the website-owned cards, drag gesture, prompt, and download action behave identically in Toolcraft and on the standalone site.

The existing prompt bridge stays in place. In Carousel mode the prompt receives native iframe events; in Trail mode the current parent bridge behavior remains unchanged.

## Carousel motion

Keep the current GPU-backed CSS marquee rather than replacing it with a JavaScript animation loop.

The track receives a normalized horizontal phase in the interval `[-shift, 0]`. Automatic animation runs from that phase to `phase - shift`; the endpoint is visually identical to the start because the overflowing carousel contains two copies of the authored sequence.

Hovering a card pauses the animated track immediately. Hovering empty space in the typography band does not pause it.

Pointer drag is enabled only when the authored row overflows and the carousel is animated. On pointer down:

1. read the track's current computed horizontal transform;
2. normalize it to the loop interval;
3. disable the animation and capture the pointer;
4. update the phase directly from horizontal pointer movement.

On pointer up or cancel, retain the normalized dragged phase. If the pointer remains over a card, the carousel remains paused. Once the pointer leaves the image, automatic motion restarts from the retained phase. Touch drag resumes after the gesture ends because touch has no persistent hover.

Static centered rows keep their current behavior and are not draggable. Reduced-motion behavior remains unchanged.

## Card and download action

Each image is rendered inside a relative card shell. Existing shared radius, border, and shadow styles move to that shell; the Next Image still preserves aspect ratio, remains optimized, and is not draggable.

The card shell uses `grab`; active drag uses `grabbing` and suppresses text/image selection.

The hovered or keyboard-focused card shows a download action:

- position: top-right, 12px inset;
- size: 40px by 40px;
- shape: circle;
- background: black at 70% opacity;
- icon: white Phosphor `DownloadIcon`, 20px;
- action: download the authored source JPEG with a stable filename;
- interaction: pointer down on the action does not initiate carousel drag.

The button is hidden when the card is not hovered or focused. Duplicate marquee cards expose the same visual action so every visible image behaves consistently.

`@phosphor-icons/react` is added to the website package because the icon must come from Phosphor.

## Component boundaries

- `fine-details-preview.tsx` and its CSS own the Trail-versus-Carousel iframe pointer policy.
- `fine-details-image-carousel.tsx` owns phase normalization, pointer capture, drag lifecycle, and download markup.
- `fine-details-image-carousel.module.css` owns paused/dragging states, card shell presentation, and the download affordance.
- Existing carousel geometry continues to decide whether the row is static or overflowing.

No changes are made to Toolcraft controls, Apply/Reset payloads, saved settings, image order, card sizing, border/shadow values, or the preview protocol version.

## Focused verification

Only focused checks are required:

- source-level carousel contract tests for card-only hover pause, phase-based animation, pointer drag, download markup, Phosphor icon, and the unchanged Next Image contract;
- Toolcraft contract test for conditional iframe pointer events by image mode;
- existing focused Fine Details carousel/settings tests;
- `git diff --check`.

Do not run a full build, broad suite, performance suite, or deep browser verification unless requested separately.
