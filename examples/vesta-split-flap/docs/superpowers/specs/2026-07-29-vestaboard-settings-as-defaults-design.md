# Vestaboard Settings as Defaults Design

## Goal

Make `/Users/kusnizza/Downloads/vestaboard-settings (3).json` the default Vestaboard app setup for new sessions and Reset-backed controls.

## Source Settings

- Use the JSON `values` block as schema control defaults.
- Use the JSON canvas size `1920x1080`.
- Use the JSON timeline duration `3.5s`, loop enabled, and collapsed timeline panel.
- Start new sessions at time `0s` instead of the exported mid-animation timestamp because `currentTimeSeconds` is transport state from the moment of export, not a reusable design setting.
- Keep playback paused on first load, matching the exported settings file and avoiding browser WebAudio autoplay warnings while Sound is enabled by default.

## Design

- Add app-specific default constants for canvas size, settings values, persistence version, and initial timeline.
- Update `src/app/app-schema.ts` control defaults to read from those constants.
- Bump the localStorage persistence version so old saved state does not hide the new defaults.
- Add an app-specific persistence bootstrap before `CreativeAppsKitApp` mounts. It writes the new default timeline snapshot only when no current-version saved state exists, so future user edits survive reloads.
- Do not edit the copied Creative Apps Kit runtime and do not change renderer/model behavior.

## Verification Tier

Verification tier: Tier 2
Reason: schema defaults, default canvas size, persistence version, and initial timeline state change product startup behavior but not renderer workload.
Run: targeted schema test, TypeScript, app contract tests, `pnpm verify:quick`, and browser smoke with clean localStorage.
Skip: perf suite because no renderer workload, animation loop, or export path changed.

## Spec Self-Review

- No placeholders.
- Scope is limited to defaults and startup state.
- Old/current user-edited state at the new persistence version remains preserved.
