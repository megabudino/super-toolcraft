# Fine Details Draggable Prompt Design

## Goal

Allow visitors to reposition the Fine Details prompt panel directly on the website while preserving every existing form interaction. A double-click returns the panel to its Toolcraft-authored position with a short animation.

## Interaction

- A primary-pointer press on any non-interactive panel surface starts a drag.
- Every rendered interactive descendant is excluded from drag, including the Toolcraft iframe bridge: textareas, inputs, buttons, links, selects, editable content, focusable controls, explicit no-drag markers, and elements with interactive ARIA roles.
- Exclusion follows each control's actual bounding rectangle rather than a fixed row or estimated height. The outer padding, gaps between controls, and non-interactive lower-row space remain draggable.
- Pointer capture owns an active drag so movement remains continuous when the pointer leaves the panel.
- The panel follows the pointer in screen pixels without transition lag.
- The complete panel remains inside the Fine Details section with a 16px inset when the section is large enough. On smaller surfaces, the clamp keeps at least the panel's draggable edge reachable.
- A double-click on a non-interactive panel surface resets the transient offset to zero.
- Reset uses a 220ms ease-out transition. A new drag immediately cancels the transition.
- The offset is intentionally session-local and is not written into Toolcraft settings, history, persistence, Apply payloads, or exports.
- Resizing the viewport reclamps the current transient offset without changing the Toolcraft-authored base position.
- Reduced-motion preference changes reset duration to zero while preserving the same final position.

## Architecture

Add a focused client component around the existing `AiPromptInput`. It owns only the transient pixel offset, pointer lifecycle, clamping, and reset transition. `FineDetailsSection` remains the settings/layout owner and continues to calculate the base prompt position from `settings.prompt.position`.

The drag component receives the section boundary ref and renders the prompt wrapper at the existing base position. Its visual transform composes the authored centering transform with the transient `translate3d(x, y, 0)` offset, so Toolcraft updates and visitor movement remain separate authorities.

The Toolcraft preview keeps its iframe intentionally pointer-transparent. Protocol v5 uses a selective gesture bridge: the website publishes the prompt's current scene-space rectangle plus an ordered array of actual interactive-descendant rectangles. Toolcraft captures a pointer only when it starts inside the prompt and outside every interactive rectangle, and the website applies the forwarded gesture to the same transient offset. Gestures over controls or outside the prompt continue to belong to their existing interaction path, CanvasShell pan/zoom, and the image-trail hover bridge.

The geometry publisher remeasures the prompt and interactive descendants after layout changes and observes their rendered sizes. The protocol validator accepts only finite, ordered rectangles contained by the prompt; teardown sends an empty prompt geometry. Parent hit testing is a pure `inside prompt && outside all interactive rectangles` predicate shared by pointer-down and double-click reset.

## Boundaries and cleanup

- No native HTML drag-and-drop is used; it would conflict with the prompt's existing image-drop behavior.
- No new dependency is added.
- Active pointer capture is released on pointer-up, pointer-cancel, unmount, and lost capture.
- Dragging does not submit the form, select text from panel chrome, or interfere with style-reference file drops.
- The implementation does not modify the shared `AiPromptInput`, so other sections keep their current behavior.

## Verification

- Unit-test interactive-target exclusion, pointer delta calculation, bounds clamping, and reduced-motion reset duration.
- Unit-test prompt-minus-interactive-rectangles hit testing in shared scene coordinates, including textarea, button/select triggers, outer padding, inter-control gaps, and lower-row free space.
- Component/source-contract test the Fine Details section wiring and composed transform.
- Run one focused browser scenario proving a real pointer drag changes the prompt rectangle while the section remains fixed, then a double-click returns the rectangle to the authored position after the transition.
- Confirm drag attempts on the textarea and every rendered clickable control leave the prompt offset at zero, while a drag from padding still moves it and double-click reset still works.
- Confirm the textarea remains editable and its value is unchanged by the drag/reset sequence.
