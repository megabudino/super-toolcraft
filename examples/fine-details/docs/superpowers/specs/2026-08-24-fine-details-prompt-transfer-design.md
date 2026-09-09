# Fine Details Prompt Ownership Transfer

## Goal

Move the existing `AiPromptInput` block out of Hero and into the Fine Details section. Move only its existing Toolcraft editing surface: normalized two-axis position plus the complete shadow configuration. Do not add controls for prompt text, style preset, Create Your Own, output mode, references, or submission behavior.

## Ownership Boundary

Fine Details becomes the sole owner of the prompt block and its persisted settings.

- Hero no longer renders `AiPromptInput`.
- Hero no longer contains prompt position or shadow values in its website settings, Toolcraft schema, preview protocol, renderer pipeline, acceptance inventory, or applied settings JSON.
- Fine Details renders `AiPromptInput` above its background/grid layers and owns all prompt position and shadow values.
- Hero Apply/Reset does not read, publish, persist, or reset prompt state.
- Fine Details Apply/Reset publishes and resets background, grid, height, prompt position, and prompt shadow as one settings object.

No shared cross-app state or cross-section import is introduced. The two Toolcraft applications remain independent.

## Migrated Defaults

The new Fine Details prompt defaults preserve the currently applied Hero prompt appearance:

```json
{
  "position": { "x": 0, "y": 0.25 },
  "shadow": {
    "blur": 40,
    "colorOpacity": { "hex": "#000000", "opacity": 35 },
    "enabled": true,
    "offset": { "x": 0, "y": 0.125 },
    "spread": 0
  }
}
```

The position remains normalized to the section canvas. `x = -1..1` maps across the same horizontal range as the current Hero prompt, and `y = -1..1` maps from the top to the bottom of Fine Details with anchor compensation so the panel stays centered on the selected point.

## Website Rendering

`FineDetailsSection` renders three layers:

1. the configured solid background;
2. the existing repeated grid texture;
3. the prompt block above both background layers.

The block remains the existing `AiPromptInput` component with the existing default prompt text, Style Preset/Create Your Own UI, Exact selector, reference behavior, and submission behavior. Those internal controls remain interactive on the website but are not mirrored as Toolcraft settings.

The prompt wrapper keeps the existing responsive maximum width and horizontal viewport padding. Position is calculated relative to the Fine Details section, not the Hero viewport. Shadow CSS uses the same 48px normalized-offset scale, blur, spread, color, opacity, and enabled semantics as the current Hero implementation.

## Fine Details Toolcraft Controls

The existing `Background` section remains unchanged. Two sections are added:

### Prompt

- `Position`: built-in Vector control using screen coordinates and normalized `{ x, y }` state.

### Prompt Shadow

- `Shadow`: built-in Switch.
- `Shadow offset`: built-in Vector control, visible only while Shadow is enabled.
- `Shadow blur`: continuous `0..100px` Slider, visible only while Shadow is enabled.
- `Shadow spread`: continuous `-32..32px` Slider, visible only while Shadow is enabled.
- `Shadow color`: built-in ColorOpacity, visible only while Shadow is enabled.

These are direct ports of the current Hero controls. Layers, Timeline, uploads, custom canvas handles, prompt-content controls, and artifact export remain absent.

## Data And Protocol Flow

`FineDetailsSettings` adds a nested `prompt` object. The applied JSON, normalizer, development-only PUT endpoint, BroadcastChannel, iframe messages, Toolcraft preview values, and Reset defaults all carry the same complete shape.

The Fine Details iframe protocol version increases because the payload shape changes. Live valid settings update the iframe only. Apply persists the current complete Fine Details settings; Reset dispatches canonical Toolcraft reset and persists the shared complete defaults. A successful persistence acknowledgement updates the iframe and an already-open neighboring website tab.

Invalid prompt objects, vectors, colors, or numeric shadow fields reject the complete incoming settings message so the current valid rendered state remains unchanged. Numeric values from valid Toolcraft controls remain bounded to the declared domains.

The Hero settings shape removes `prompt`. Its Toolcraft bridge stops creating or sending prompt values. The site normalizer no longer restores a prompt fallback, so future Hero Apply operations write a prompt-free applied JSON document.

## Error Handling

- If the Fine Details iframe is not ready, Apply/Reset reports the existing Toolcraft feedback and does not claim success.
- If website persistence fails, Toolcraft reports failure; live preview state remains available for continued editing.
- Reset uses the shared Fine Details defaults rather than stale pre-reset runtime values.
- Invalid cross-window messages are ignored and cannot partially mutate prompt or background state.

## Scope Exclusions

- No new prompt text, preset, Create Your Own, Exact, reference, or submit controls.
- No visual redesign of `AiPromptInput`.
- No prompt duplication between Hero and Fine Details.
- No shared state between the Hero and Fine Details Toolcraft applications.
- No changes to gallery, heading, dispersion, Hero background, Fine Details grid design, later homepage sections, or artifact export.
- No commit or push.

## Verification And Handoff

Per the user's explicit request, automated tests, lint, typecheck, build, browser suites, delivery verification, formatting, and measured performance checks are not run. The already-running Next.js and Fine Details Toolcraft development servers receive the implementation through HMR, and the result is handed back for manual local review.
