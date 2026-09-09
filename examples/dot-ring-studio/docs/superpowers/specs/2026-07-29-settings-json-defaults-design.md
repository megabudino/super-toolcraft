# Settings JSON Defaults Design

## Source

Use `/Users/kusnizza/Downloads/dot-ring-studio-settings.json` as the source for
Dot Ring Studio product-control defaults.

## Default Mapping

Update schema defaults for every supported authored value:

- Background inclusion and color.
- Canvas render scale.
- Ring radius, density, rows, color mode, palette, spread, dot size, size
  response, and glow.
- Wave formula, speed, rotations, amplitudes, sector angle, and row echo.
- Image and video export format/resolution.

Canvas size and timeline duration already match the JSON at `1024×1024` and
`12s`, so they remain unchanged.

## Runtime-Only State

Do not convert snapshot-only editor state into product-control defaults:

- Canvas Infinity mode has no app-schema default extension point.
- Timeline current time, expanded state, and play/pause state are runtime state,
  not schema control defaults.
- `audio.source` remains `null`. The JSON value describes the bundled fallback,
  while a `fileDrop` default attachment requires a real `media.defaultAssets`
  file. No uploaded audio file was supplied.

## Reset And Persistence

Schema `defaultValue` remains the authority for section reset and global reset.
Existing persisted workspace state may continue to override defaults until the
user resets controls or clears/imports workspace state.

## Verification

Verification tier: Tier 2 — schema/product behavior.

Run: none, per the user's explicit request not to run checks.

Skip: unit tests, browser checks, kernel checks, build, and
`npm run verify:delivery`.

