# Vestaboard Settings Transfer Design

## Product Decision

Enable Creative Apps Kit runtime settings import/export for the Vestaboard editor. The app already has many schema-backed controls, editable canvas size, persistence, and playback timeline state, so settings transfer belongs in the built-in `settingsTransfer` runtime path rather than custom footer actions or route-local file inputs.

## Control Section Inventory

- Settings: runtime-inserted `Settings` section with a `settingsTransfer` control for importing and exporting JSON settings.
- Board Surface: tile geometry, cell fill, border, opacity distribution, highlight coverage, and seeds.
- Board Message: source phrase, target phrase, main typography, and text color.
- Random Field: filler density, background typography, opacity distribution, and seed.
- Video Export: video format and quality.
- Background: preview/export background and PNG include-background toggle.
- Export: product delivery actions only, `Export Video` and `Export PNG`.

## Behavior

The runtime Settings section exports a JSON file containing schema values, `canvas.size`, and playback timeline state. Import applies only known targets for this app, updates canvas size, applies timeline duration/current time/expanded/loop state, and pauses playback after import. Footer `panelActions` remain product delivery only.

Use an explicit object form:

```ts
settingsTransfer: {
  appId: "vesta-split-flap",
  enabled: true,
  fileName: "vesta-split-flap-settings.json",
}
```

## Acceptance

Acceptance must prove the settings section is allowed as a runtime-generated section, the schema resolves settings transfer as enabled, and browser tests can export a settings JSON and import it back to restore a changed value. Tests should not add app-specific hidden inputs or import/export actions.

## Verification

Run `pnpm verify:quick`, a focused Playwright settings-transfer test, `pnpm test:browser`, and `pnpm build`.
