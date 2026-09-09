# Fine Details Carousel Auto Height and Text Gap Design

**Goal:** Make carousel card height fully automatic from the vertical space between the two typography blocks, with one shared top/bottom text-gap control and a hard 800px card-height cap.

## Approved behavior

- There is no Fill mode and no manually adjustable carousel Height.
- The measured carousel band remains the space from the bottom edge of `TRY IT` to the top edge of `YOUR WAY`.
- One `Text gap` slider sets the same minimum inset from both text-block edges.
- `Text gap` ranges from `0` to `200px` and defaults to `24px`.
- Card height is always:

  ```text
  min(800px, measuredBandHeight - 2 × textGap)
  ```

- When the usable height is non-finite or not positive, the carousel renders no cards and reports an invalid band through its existing data attribute.
- When the usable height is larger than 800px, cards stay vertically centered in the measured band; the remaining space is distributed equally above and below them.
- All cards preserve their authored aspect ratio and continue using the same height.

## Toolcraft and protocol

- Replace the `carousel.height` target/control with `carousel.textGap`.
- Keep the Carousel section at six controls: Images mode, Images shown, Text gap, Corner radius, Gap, and Speed.
- `carousel.textGap` is a continuous `0–200px` slider with default `24px`.
- Remove manual-height normalization/defaults/acceptance/pipeline coverage and add the equivalent text-gap coverage.
- Increment the paired Fine Details preview protocol from v6 to v7 because the settings payload changes shape.
- Legacy website settings without `textGap` use `24px`; a legacy `height` field is ignored and is not written back by Apply.

## Website renderer

- Replace `carousel.height` with `carousel.textGap` in types, defaults, normalization, and persistence.
- Keep measuring the section and both typography blocks, including explicit remeasurement when their vertical settings change.
- Derive the effective card height only from measured band height, `textGap`, and the fixed 800px cap.
- Existing fit/overflow marquee behavior, Next Image sizing, border, shadow, hover pause, and reduced-motion behavior remain unchanged.

## Verification scope

- Update focused Toolcraft values/control/payload tests and focused website settings/geometry contracts.
- Update the authored browser scenario to stop editing Height and to use image count/gap for deterministic overflow/static states.
- Run only focused tests and `git diff --check`; do not run Playwright, builds, full suites, or measured performance.

## Non-goals

- No Fill switch or other height mode.
- No separate top and bottom gap controls.
- No user-adjustable maximum height.
- No carousel media upload, export, or performance workload changes.
