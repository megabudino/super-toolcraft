# Fine Details Trail Card Radius Design

## Goal

Add one Toolcraft slider that controls the corner radius of every Fine Details image-trail card. The setting must update the local website preview immediately and follow the existing Apply and Reset behavior.

## Control

The Trail section gets a `Card radius` continuous slider next to `Card size`.

- Range: `0–100 px`.
- Step: `1 px`.
- Default: `0 px`, preserving the current square-card appearance.
- The control is available only while the trail is active, matching the other trail geometry controls.

Pixels are used instead of percentages so the configured value is explicit and stable when card dimensions vary with image aspect ratio.

## Settings Flow

A numeric `cardRadius` field is added to the complete trail settings path:

1. Toolcraft target and defaults.
2. Toolcraft value normalization and preview invalidation.
3. Preview message/settings bridge.
4. Website settings type, defaults, normalization, persistence, and applied settings JSON.
5. Fine Details trail renderer.

Live slider movement invalidates only the existing preview-sync pass. It does not regenerate uploaded image derivatives or change media handling.

Apply persists the selected radius with the other Fine Details settings. Reset restores both Toolcraft and the website preview to the `0 px` default through the existing reset path.

## Rendering

The radius is applied to the existing outer trail-card element. Its existing `overflow: hidden` clips the Next Image content to the same rounded outline. Shadow, rotation, size falloff, aspect ratio, position, animation timing, stacking order, and focus behavior remain unchanged.

## Compatibility

Older settings payloads that do not contain `cardRadius` normalize to `0 px`. Incoming values are clamped to `0–100 px` in both Toolcraft and website settings normalization.

## Verification

Focused checks only:

- Toolcraft exposes `Card radius` with the approved range, step, default, and target.
- The preview-sync pass invalidates when the radius changes without invalidating media preprocessing.
- Website normalization defaults a missing radius to `0` and clamps it to `0–100`.
- The trail card applies the normalized radius to its outer clipping element.
- Existing targeted Fine Details tests remain green.

Repository-wide build, lint, and broad browser suites remain outside this handoff unless requested.

## Out of Scope

- Changing card geometry or image aspect-ratio calculations.
- Reprocessing uploaded images.
- Per-image radius values.
- Percentage-based or independently configured corner radii.
- Changes to trail animation, layering, prompt focus behavior, shadows, or image order.
