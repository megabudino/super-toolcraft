# Custom Controls

Use a custom control only when no built-in Creative Apps Kit control represents the product interaction.

Built-ins come first: `slider`, `rangeSlider`, `select`, `segmented`, `switch`, `checkbox`, `color`, `colorOpacity`, `vector`, `gradient`, `curves`, `fontPicker`, `imagePicker`, `fileDrop`, `text`, `code`, `rangeInput`, `palette`, and `panelActions`.

Register custom renderers through `CreativeAppsKitApp controlRenderers`.

Do not edit `ControlsPanel`, copied `src/creative-apps-kit`, or Creative Apps Kit internals inside a generated app.

Import custom renderer types from `@/creative-apps-kit/template-runtime/react`.

## Required Schema

Custom control schemas still need:

- `type`;
- `target`;
- `defaultValue`;
- `label`;
- `orderRole`;
- acceptance coverage;
- browser coverage;
- performance coverage when they can trigger product work.

## State Rules

Custom renderers must write through the provided `setValue(nextValue, meta)` callback or existing runtime commands.

Local-only custom control state is invalid unless it is transient draft, hover, focus, or drag state. Final product state belongs to the Creative Apps Kit runtime.

## Keyframes

If a custom value is keyframe-capable, the renderer must work with runtime keyframes instead of local animation state. Store typed values in keyframes through runtime commands and consume `useCreativeAppsKitEvaluatedValues`, `useCreativeAppsKitEvaluatedValue`, `evaluateCreativeAppsKitTimelineValues`, or `evaluateCreativeAppsKitTimelineValue`.

## Visual Rules

Custom controls should use Creative Apps Kit tokens, spacing, focus states, disabled opacity, and interaction patterns. A custom control should look like it belongs in the controls panel.

If a custom control is really direct manipulation of the product output, prefer a product editing handle in `canvasContent` plus a schema-backed target.
