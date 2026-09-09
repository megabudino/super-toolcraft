# Unified Preset Viewport Design

## Goal

Give every donut preset the same camera pose, 170% viewport zoom, and Infinity canvas without changing any preset-specific geometry, color, material, lighting, icing, or sprinkle values.

## Source of truth

- The bundled Matcha camera pose is the canonical camera for every preset.
- Infinity canvas is always `true` inside normalized preset values.
- Viewport zoom is runtime canvas state rather than a preset value, so selecting a named preset dispatches the built-in `canvas.setViewport` command with `zoom: 170` while preserving the current pan offset.

## Data flow

Factory defaults, imported libraries, edited preset snapshots, and exported libraries all pass through the existing preset normalization boundary. That boundary replaces only `scene.orientation` and `canvas.infinity`; every other candidate value remains untouched.

When a named preset is applied, the app writes its normalized values and then sets viewport zoom to 170%. Custom mode remains manually editable and does not repeatedly force the viewport while the user works.

## Compatibility

Existing persisted or imported preset libraries retain their current donut appearance. Their per-preset camera and finite-canvas flags are migrated in memory through normalization and are written back in the canonical form when the library is updated or exported.

## Verification scope

Verification tier: Tier 2 — schema/product behavior.

The user explicitly requested that no checks be run for this pass. Implementation will therefore be limited to focused source edits and worklog documentation without invoking tests, typecheck, build, browser verification, or delivery verification.
