# Remove Redundant Preset JSON UI

## Product behavior

Keep independent autosaved named presets, but remove the visible `Preset JSON`
textarea and the separate `Preset Tools` buttons. The existing runtime
`Export Settings` and `Import Settings` actions become the only transfer
surface and carry the complete preset library together with the rest of the
workspace.

`Custom` remains unsaved. Named preset switching, persistence, reset, renderer,
timeline, layers, canvas interaction, and image export otherwise remain
unchanged.

## Control selection and section inventory

- `Presets / Flavor` remains the only value editor; one compact `Reset flavor`
  command appears only for a named flavor and restores it without duplicating
  transfer UI.
- `Preset Library` and `Preset Tools` are removed from the visible Control
  Section Inventory.
- `donut.presetLibrary` remains a registered Toolcraft value so runtime
  persistence and Settings Transfer can serialize and validate it. It is owned
  by the label-free `Reset flavor` action co-located with `Flavor`; browser
  verification must prove there is no JSON textarea or duplicate transfer
  button.
- Runtime `settingsTransfer` remains the exact owner of Export Settings and
  Import Settings. No product file picker, storage API, duplicate buttons, or
  custom transfer UI is introduced.

## Implementation

1. `src/app/donut/donut-preset-schema.ts`
   - Remove the visible library editor and tools sections.
   - Keep the library default on a compact `Reset flavor` action beside Flavor.

2. `src/app/app-composition.tsx`
   - Remove product-owned preset apply/download transfer actions and their
     browser download helper.
   - Keep only selected-flavor reset, which is not an import/export duplicate.
   - Keep image export and existing icing/sprinkle actions unchanged.

3. Preset acceptance and browser tests
   - Remove `donut.presetActions`.
   - Change `donut.presetLibrary` proof to tune a named preset, export through
     `Export Settings`, mutate it, import the exported settings, and prove the
     named preset restores; also prove Reset flavor restores curated defaults.
   - Prove there is no visible `Preset JSON`, `Preset Library`, or `Preset
     Tools` UI.

4. Records
   - Update section inventory, product readiness wording, verification impact,
     schema tests, and worklog.

## Verification

Verification tier: Tier 2
Reason: Removes schema controls and local actions while preserving persistent named-preset behavior through the existing Settings Transfer surface; renderer passes and workload boundaries are unchanged.
Run: focused schema, preset-library, pipeline, acceptance, Settings Transfer, and preset browser checks; `pnpm ai:check`; `pnpm exec tsc --noEmit`; one bare `npm run verify:delivery`; keep the saved dev server on port 3003.
Skip: measured performance and `npm run verify:perf`, because the user reported redundant UI rather than a performance problem and no renderer workload changed.
