# Fine Details Trail Card Border Design

## Goal

Let Toolcraft users enable and configure one shared border for every Fine Details image-trail card without changing card geometry, animation, media processing, or the existing corner-radius behavior.

## Controls

Add a dedicated `Trail Border` section after `Trail Motion` and before `Trail Shadow`.

- `Border`: switch, disabled by default.
- `Border width`: continuous `1–20 px` slider with a `1 px` default.
- `Border color`: solid color control with a `#FFFFFF` default.

The switch is available while the trail is active. Width and color are available only while both the trail and border are enabled. Opacity is intentionally not included.

## Settings Contract

Add a nested border object to the trail settings on both sides of the Toolcraft-to-website bridge:

```ts
border: {
  color: "#FFFFFF";
  enabled: false;
  width: 1;
}
```

Toolcraft owns three targets: `trail.border.enabled`, `trail.border.width`, and `trail.border.color`. All three invalidate only the existing preview-sync pass. Border changes do not invalidate media preprocessing and do not recreate display-sized image derivatives.

Apply persists the complete border object with the other numeric and visual Fine Details settings. Reset restores both Toolcraft and the website preview to the disabled, white, `1 px` defaults.

## Rendering

Apply the border to the existing outer Motion card element that already owns `overflow: hidden`, corner radius, shadow, dimensions, position, and animation.

- Use a native solid CSS border.
- Use `box-sizing: border-box` so border width is contained inside the existing card width and height.
- When disabled, render a zero-width border while retaining the configured width and color in settings.
- Keep `borderRadius` on the same element so the border and clipped Next Image share one outline.

The border does not alter card width, height, aspect ratio, spawn coordinates, size falloff, rotation, or shadow calculations.

## Compatibility and Validation

Older settings payloads without a border object normalize to the complete default border object. If a partial border object is received, missing fields use their defaults.

- `enabled` must be boolean when provided.
- `width` is clamped to `1–20`.
- `color` accepts a six-digit hexadecimal color and normalizes it consistently with existing color settings.

Invalid provided field types continue to reject the settings payload through the existing normalization boundary.

## Product Acceptance

The new section is registered as one shared trail-card-border entity. Each control receives a focused product acceptance entry:

- Switching Border updates every retained and newly spawned card.
- Changing width updates the internal solid border without changing card bounds.
- Changing color updates the shared border color without changing image or shadow settings.

## Verification

Focused checks only:

- Toolcraft exposes the dedicated section, switch, conditional width slider, and conditional solid-color control with approved defaults and ranges.
- Toolcraft normalization defaults and clamps the border object.
- Preview invalidation includes all border targets and excludes media preprocessing.
- Website normalization supports old payloads, bounds width, validates color, and persists the border object.
- The existing outer card applies `boxSizing`, border style, conditional width, and color alongside `borderRadius`.
- Existing targeted radius, Next Image, motion, and prompt-layer tests remain green.

Repository-wide build, lint, and broad browser suites remain outside this handoff unless requested.

## Out of Scope

- Border opacity, gradients, dashed styles, or per-edge controls.
- Per-image border settings.
- Changing card geometry, aspect ratios, animation, layering, shadows, or focus behavior.
- Reprocessing or re-uploading images.
