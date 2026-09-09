# Prompt lower-row padding design

## Goal

Align the left and right edges of the prompt form's lower-row content with the horizontal divider directly above it.

## Current state

- The divider uses a 20 px horizontal inset (`mx-5`).
- The lower row uses a 10 px inset by default and 12 px from the `sm` breakpoint.
- The lower-row controls therefore extend beyond the divider at both sides.

## Design

Give the lower row a 20 px horizontal inset (`px-5`) at every breakpoint. Keep its vertical padding, gaps, controls, divider, and responsive visibility rules unchanged.

This directly matches the divider's existing spacing without adding a wrapper or a new spacing token. The change is local to `AiPromptInput` and does not alter behavior or data flow.

## Alternatives considered

1. Use the divider's existing `px-5` value on the lower row. Selected because it is the smallest exact change.
2. Put the divider and lower row in a shared padded wrapper. Rejected because it adds unnecessary structure and can affect the divider width.
3. Introduce a shared CSS custom property for the inset. Rejected because one local repeated value does not justify a new abstraction.

## Verification

- Confirm the divider and lower row both use a 20 px horizontal inset.
- Run the formatter on the touched component.
- Run the website TypeScript check and `git diff --check`.
- Do not run broad browser or visual suites for this narrowly scoped spacing change, per the user's request for light verification.
