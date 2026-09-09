# Hero Site Defaults Design

## Goal

Make the currently approved Hero state from Toolcraft on port 3003 the authored default on the Recraft website.

## Design

- Use `/Users/kusnizza/Downloads/hero-settings (14).json` as the exact schema-v2 value source.
- Ignore exported canvas and timeline metadata; this delivery changes the website Hero only.
- Preserve all 36 active JPEG files from Dia's current `127.0.0.1:3003` media store byte-for-byte and commit them under the website Hero assets.
- Use Next static image imports for all 36 files so the authored WebGL sources receive the emitted URL plus exact width and height metadata.
- Keep the existing preview protocol and runtime media override behavior unchanged.
- Convert percentage controls to the normalized website representation already used by the protocol: sphere bend, grain amount, CRT scanline strength, and CRT flicker.

## Verification

Run only a focused TypeScript check for the changed source files when available and `git diff --check`; skip the full build, lint, and browser suite at the user's request.

## Settings 16 Refresh

- Use `/Users/kusnizza/Downloads/hero-settings (16).json` only as a data source.
- Update the canonical Hero subtitle defaults to 28px text, 0px gap, and the enabled 12px blur / 1px spread / 40% black shadow from the export.
- Update the six authored Sphere row speeds to `-4, 4, -4, 4, -4, 4` while preserving every row offset and image assignment.
- Keep Auto Scroll unchanged because the exported Interval `4` and Jump time `0.3` already match the website.
- Apply the same subtitle and row-speed defaults in Toolcraft Reset state and the website authored/applied settings.
- Run only focused default-mapping tests and whitespace checks; do not run the full build, browser matrix, or repository-wide suite.
