# Fine Details Carousel Hover and Download Refinement

## Goal

Refine the existing Fine Details carousel without adding modes or settings. Keep direct pointer dragging, remove the drag cursor, make the complete horizontal image strip (including card gaps) one hover pause region, and download the original authored JPEG from the per-card action.

## Interaction

- Direct carousel dragging remains unchanged.
- Carousel cards and gaps use the normal cursor; no `grab` or `grabbing` cursor is shown.
- The prompt and its existing cursor/drag behavior are unchanged.
- On hover-capable devices, entering the rendered carousel track pauses automatic movement. Moving horizontally across a configured gap does not resume it. Leaving the track resumes movement from the current phase.
- Empty vertical space outside the image track does not pause the carousel.
- Touch and reduced-motion behavior remain unchanged.

## Download Action

- Each card retains its 40px circular top-right download action.
- Use the Phosphor `ArrowLineDownIcon` at the existing 20px bold treatment.
- The button background is black at 40% opacity and becomes black at 60% opacity when the button itself is hovered or keyboard-focused.
- The action remains visible only for the hovered card or when keyboard-focused, and it does not start carousel dragging.
- Each asset exposes a stable direct `/images/recraft-fine-details/carousel/*.jpeg` URL and original filename. The download anchor uses that URL so the browser receives the checked-in source JPEG, not a Next optimizer response.

## Image Delivery

- Visible carousel cards continue to render with `next/image` using their imported static image metadata, intrinsic aspect ratio, and the existing calculated display dimensions.
- Download delivery is separate from preview delivery: Next Image owns preview optimization; the direct public asset URL owns the original-file download.

## Scope and Verification

- No Toolcraft controls, schema, protocol, Apply/Reset behavior, iframe behavior, prompt behavior, card geometry, or carousel motion algorithm changes.
- Update the focused source-contract tests for track-level hover, normal cursor, the Arrow Line Down icon, button background states, direct original URLs, and continued Next Image rendering.
- Run only the focused website carousel/settings tests, focused Toolcraft carousel interaction tests if touched by the contract, touched-file formatting, and `git diff --check`. Do not run broad build, browser matrix, performance checks, commit, or push.
