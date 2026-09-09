# Hero Heading Spacing Parity Design

## Goal

Make Toolcraft Reset, the website fallback, and the website applied Hero state use the exact heading-group distances from `hero-settings (16).json`.

## Root Cause

The Toolcraft export has `heading.cta.gap = 39`, while the website fallback and applied JSON use `32`. Browser measurement confirms the website maps that value directly to a 32px subtitle-to-CTA boundary gap. Subtitle typography, subtitle shadow, heading line gap, badge gap, and subtitle gap already match the export.

## Design

- Set Toolcraft heading defaults to line gap `-24`, badge gap `28`, subtitle gap `0`, and CTA gap `39`.
- Set the website typed fallback and applied JSON CTA gap to `39`; its other three distances already match.
- Keep the existing direct `margin-top` mapping, protocol v23, controls, and renderer unchanged.
- Add focused expectations for all four distances and the subtitle typography/shadow payload.

## Verification

Run only focused Toolcraft heading tests, focused website heading/settings tests, a browser DOM measurement, formatting, and scoped whitespace checks. Do not run full suites, build, typecheck, or browser matrices.
