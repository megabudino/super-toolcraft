# Dot Ring Studio Default Infinity Canvas Design

## Goal

Open Dot Ring Studio in Infinity canvas mode by default while preserving the
existing runtime-owned switch, finite 1024×1024 fallback, persistence,
undo/redo, settings transfer, scene-bounds export, and renderer behavior.

## Verification Classification

Verification tier: Tier 4

Reason: The product request is a Tier 2 default change, but the supported
implementation adds a reusable canvas default to the shared Toolcraft schema
and refreshes the generated app's signed runtime copy. Runtime/template and
generated-framework changes require Tier 4 verification.

Run: Runtime schema/state unit tests and typecheck in the Toolcraft source
repository; focused Dot Ring schema and Infinity browser tests; one bare
`npm run verify:delivery`; production build; then an agent-controlled browser
check of a clean workspace and Reset.

Skip: `npm run verify:perf` because the request changes initial state only and
does not authorize a performance audit.

## Product Decision

- Add optional `canvas.sizing.defaultMode` to the shared schema for
  `editable-output` canvases.
- Resolve omitted values to `finite` so every existing Toolcraft app keeps its
  current behavior.
- Set Dot Ring Studio to `defaultMode: "infinite"`.
- Use the same resolved default for initial state, the generated Infinity
  switch's `defaultValue`, and global/targeted Reset.
- Let a valid persisted canvas mode continue to override the schema default.
  This preserves the user's explicit finite/infinite choice across reloads.
- Keep the dormant finite size at 1024×1024 so disabling Infinity restores the
  current finite output exactly.

## Alternatives Rejected

- A product renderer mount effect was rejected because it would overwrite a
  persisted finite choice, create an avoidable history entry, and diverge from
  Reset.
- Directly patching the generated app's signed runtime was rejected because the
  generated runtime is immutable; the shared runtime must own the capability.
- Forcing a persistence-key reset was rejected because it would discard user
  settings unrelated to canvas mode.

## State And Output Mapping

`canvas.sizing.defaultMode` resolves the initial `state.canvas.mode` only when
no persisted or explicit initial mode exists. The runtime Setup switch reads
the same default, and Reset restores that mode. Dot Ring Studio's existing
renderer and scene-bounds provider already consume `state.canvas.mode`, so no
renderer, export, timeline, or performance mapping changes are needed.

## Acceptance

- A fresh state created from Dot Ring Studio's schema has
  `canvas.mode === "infinite"`.
- The runtime Setup control reports `defaultValue: true`.
- Turning Infinity off and invoking Reset restores Infinity.
- Existing schemas without `defaultMode` remain finite.
- A persisted finite mode remains finite after reload.
