# Fine Details Trail-to-Carousel Mock Design

## Goal

Turn the standalone website Fine Details section into one deterministic two-state mock. It starts with the Trail image effect and changes to Carousel when the prompt is submitted. The section itself, its typography, background, grid, and prompt remain one persistent composition.

## State Ownership

- A website-only client wrapper owns the transient mock state: `trail` initially and `carousel` after the first valid prompt submission.
- Reloading the page restores `trail`. The state is not persisted, exported, sent to an API, or written through Apply/Reset.
- Repeated submissions while already in `carousel` are idempotent.
- The Toolcraft preview keeps its existing settings-owned mode selector. Submitting the prompt inside Toolcraft does not change its mode, so both visual states remain independently editable.
- The existing applied Fine Details settings remain the source of all visual values. The mock wrapper overrides only `imagesMode` for the standalone website flow.

## Organic Image-State Transition

- Fine Details remains one section; no duplicate full-section markup is created.
- Only the image-effect layer participates in the transition. Trail exits with a short opacity fade of approximately 250ms while Carousel enters with an overlapping opacity fade of approximately 350ms.
- Background, grid, upper-left typography, lower-right typography, and prompt remain mounted and do not animate or jump.
- The outgoing image layer remains mounted only for its exit interval and is removed afterward. The hidden Trail and Carousel renderers do not continue running indefinitely.
- Reduced-motion users switch image layers immediately.
- Once `carousel` becomes the active state, the existing prompt drag capability is enabled. Trail keeps prompt dragging disabled.

## Component Boundaries

- Add a focused homepage mock wrapper that owns `trail | carousel`, passes the effective settings into `FineDetailsSection`, and changes state from the prompt submission callback.
- Extend `FineDetailsSection` with an optional prompt-submit callback and an optional image-layer transition capability. Toolcraft calls the existing default path without the website mock transition.
- Keep the transition coordinator focused on the mutually exclusive Trail and Carousel renderers. It receives the active mode and existing renderer settings; it does not own prompt or Toolcraft state.
- The homepage uses the mock wrapper. The `/toolcraft/fine-details` route continues to use `FineDetailsPreviewBoundary` directly.

## Prompt Simplification

- Remove the output-mode divider and `OutputModeSelect` from `AiPromptInput`.
- Remove the `outputMode` React state and omit it from `AiPromptSubmission` because no remaining caller or UI can author it.
- Remove the unused output-mode data/type/component from `ai-prompt-input-controls.tsx` if no other consumer remains.
- Style preset selection, custom references, textarea behavior, submit enablement, keyboard submit, file lifecycle, status messaging, and current prompt visuals remain unchanged.

## Error and Interaction Behavior

- Empty prompts do not submit and therefore cannot change the state.
- The transition requires no network request and has no loading or error state.
- Submit retains the current prompt text and reference state because the prompt is not remounted.
- Trail pointer behavior stops when its exiting layer unmounts. Carousel hover, manual drag, original-image download, border, shadow, and auto-height behavior remain unchanged.

## Verification

- Add focused source/behavior coverage for the initial Trail state, valid-submit transition to Carousel, idempotent repeated submission, reduced-motion behavior, persistent prompt ownership, and Toolcraft route isolation.
- Update prompt source-contract coverage to prove the divider, Exact control, output-mode state, and submission property are gone while submit and reference behavior remain.
- Run only the focused Fine Details mock, carousel/settings/prompt tests, touched-file formatting, and `git diff --check`.
- Do not run a broad build, full browser matrix, performance suite, commit, or push.
