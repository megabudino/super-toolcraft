# Refresh First Preset Asset Design

## Goal

Replace the first Matcha preset with the complete scene snapshot from `/Users/kusnizza/Downloads/donut-studio-settings (1).json` and give every other named preset the same scene orientation as that first donut without changing their own appearance values.

## Source authority

- Source SHA-256: `bfa7e93d136dbf16e5791f72539bc434dc603bafefdbe3d50c7e7a40b36a9004`.
- The embedded `donut.presetLibrary` is the preset-data authority.
- Its first `matcha-cream` entry supplies all 65 factory values for the first donut.
- Its first `scene.orientation` supplies the shared position for all ten named presets.

## Merge behavior

The first factory preset is replaced in full. The remaining nine factory presets retain their current geometry, icing, sprinkle, material, plate, background, HDRI, and lighting values; only `scene.orientation` is aligned with Matcha. Infinity canvas normalization and the app-owned 170% named-preset zoom remain unchanged.

## Verification scope

Verification tier: Tier 2 — factory preset defaults and persistence behavior.

The user previously instructed that no checks be run for this workstream. Source files and acceptance expectations will be updated without invoking tests, typecheck, build, browser verification, or delivery verification.
