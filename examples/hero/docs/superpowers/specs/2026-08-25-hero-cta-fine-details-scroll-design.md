# Hero CTA → Fine Details design

## Goal

The Hero CTA displays `See How it Works` and scrolls quickly and smoothly to the Fine Details section when activated.

## Design

- Keep the CTA as the existing semantic Next.js link inside the shared Button.
- Keep `#fine-details` as the fallback destination and use native smooth scrolling for the enhanced click behavior.
- Respect reduced-motion preferences by retaining an immediate transition when motion is reduced.
- Give the Fine Details section the stable `fine-details` id.
- Keep website defaults, applied settings, Toolcraft defaults, and focused contracts on the exact same CTA copy.

## Verification

Run only the focused Hero CTA/settings contracts and `git diff --check`. Do not run broad browser, build, or performance suites.
