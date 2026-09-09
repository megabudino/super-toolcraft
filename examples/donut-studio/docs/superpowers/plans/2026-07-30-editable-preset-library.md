# Editable Persistent Preset Library

## Product behavior

Each named donut flavor owns an independent editable snapshot. While a named
preset is selected, changes to donut shape, edible materials, icing, sprinkles,
plate, background, HDRI, shadows, and authored lights automatically update that
preset's snapshot. Switching away and back restores the saved snapshot.
`Custom` remains an unsaved free-editing mode.

The controls panel exposes the existing Flavor select, a neighboring structured
Preset Library editor, and local Preset Tools actions:

- `Download JSON` downloads the clean preset-library document.
- `Apply JSON` validates the editor contents, updates every known preset, and
  reapplies the selected named preset.
- `Reset current` restores only the selected named preset to its built-in
  factory snapshot.

The preset library is a normal Toolcraft value. Existing local persistence and
runtime Export Settings / Import Settings therefore preserve it without direct
product `localStorage` access. The dedicated download contains only the preset
library, while runtime settings transfer continues to own whole-app settings.

## Control selection inventory

- Product need: choose a named preset.
  - Value model: one fixed option.
  - Built-in: `select`.
  - Target: `donut.preset`.
- Product need: inspect or edit the complete preset document.
  - Value model: long structured JSON.
  - Built-ins checked: `code`, `text`, `fileDrop`.
  - Best built-in: `code` with `textValueKind: "structured"`.
  - Rejected: `text` cannot represent long structured content; `fileDrop`
    would incorrectly treat configuration as product media and add a media
    lifecycle.
  - Target: `donut.presetLibrary`.
- Product need: apply, download, or restore the nearby preset entity.
  - Value model: three local commands.
  - Built-ins checked: `actions`, `panelActions`.
  - Best built-in: `actions`.
  - Rejected: sticky `panelActions` remain reserved for final product image
    export.
  - Target: `donut.presetActions`.

Control Section Inventory change: `Presets`, `Preset Library`, and `Preset
Tools` form one adjacent workflow. They are separate authored sections because
the runtime treats the long structured editor as a standalone surface and the
local commands as a compact grouped surface. Their targets are
`donut.preset`, `donut.presetLibrary`, and `donut.presetActions`.

## Verification tier

Verification tier: Tier 2
Reason: Adds schema controls, persistent product state, local commands, JSON download/import behavior, acceptance rows, and preset switching semantics without changing renderer geometry, resource lifecycle, workload limits, timeline, layers, or image export.
Run: focused preset-library, schema, composition-action, persistence/settings-transfer, and pipeline Vitest coverage; focused browser proof for per-preset autosave, JSON apply/download/reset, and reload restoration; `pnpm typecheck`; one bare `npm run verify:delivery`; keep the existing dev server running.
Skip: measured performance and `npm run verify:perf`, because this is ordinary schema/product behavior and no performance iteration or full audit was requested.

## Implementation

1. `src/app/donut/donut-preset-library.ts`
   - Define the versioned preset JSON format and full visual preset target set.
   - Expand built-in curated flavors over complete default visual settings.
   - Parse, validate, normalize, serialize, update, and reset known presets.
   - Convert current Toolcraft values/canvas mode into a normalized snapshot.

2. `src/app/donut/donut-schema-sections.ts`
   - Add adjacent structured JSON and local library-action sections after
     Presets.
   - Keep the three sections in one named-preset editing workflow while
     respecting the standalone editor layout.

3. `src/app/donut/donut-canvas.tsx`
   - Apply named presets from the current valid library.
   - Automatically save the selected named preset when owned visual settings
     change.
   - Suppress intermediate autosaves while a preset is being applied.

4. `src/app/app-composition.tsx`
   - Handle apply, download, and factory-reset actions.
   - Report typed feedback for malformed JSON or invalid action state.
   - Keep image export behavior unchanged.

5. `src/app/donut/donut-pipeline.ts`
   - Declare that editing the preset JSON alone invalidates no renderer pass.
   - Retain ordinary per-control invalidation when a preset is applied.

6. Acceptance and records
   - Extend `src/app/app-acceptance-data.ts`,
     `src/app/app-verification-impact.json`, and the Presets section inventory.
   - Add focused Vitest and Playwright coverage.
   - Record the delivery in `docs/toolcraft/agent-worklog.md`.

## Acceptance

- Editing a named preset, switching to another, and switching back restores the
  edited product output and exact control values.
- Editing in `Custom` does not overwrite any named preset.
- Downloaded JSON has the expected format/version, ten known preset ids, and
  current normalized values.
- Applying valid JSON updates the selected preset and visible output.
- Invalid JSON does not replace the last valid library or product state.
- Reset current restores only the active named preset.
- Reload and whole-app settings transfer preserve the library through the
  existing `values` persistence slice.
