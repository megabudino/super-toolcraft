# Schema Reference

> Reading route: start with `workflow.md`. Core generated-app rules live in `core/*`; this file is a field reference for `src/app/app-schema.ts`.

Edit `src/app/app-schema.ts` as the public product surface. Use `defineToolcraft` to configure runtime surfaces, product controls, defaults, persistence, and product actions.

## Runtime Shape

Top-level schema fields:

| Field              | Purpose                                                                | Detailed rules                                                             |
| ------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `canvas`           | Product workspace, output size, upload/drop support, render scale.     | `core/runtime-boundary.md`, `core/setup-export.md`, `core/media-upload.md` |
| `media`            | Predefined attached files, images, and models shown in `fileDrop`.      | `core/media-upload.md`                                                     |
| `panels`           | Controls, layers, timeline.                                            | `core/runtime-boundary.md`, `core/timeline-animation.md`                   |
| `toolbar`          | History, radar, theme, zoom.                                           | `assembly-workflow.md`                                                     |
| `persistence`      | Intentional reload persistence for runtime slices.                     | `performance.md`, `acceptance-testing.md`                                  |
| `settingsTransfer` | Runtime-owned Export Settings / Import Settings identity.              | `core/setup-export.md`                                                     |
| `panelActions`     | Sticky product delivery actions such as export, copy, generate, apply. | `core/setup-export.md`, `core/control-selection.md`                        |

Schema controls always bind to a `target`, use `defaultValue` for reset behavior, and include `performanceRole` / `performanceReason` on visible non-action controls. Use built-in control `type` values before `controlRenderers`.

## Canvas

Canvas sizing modes:

- `editable-output`: product/export apps. Runtime `Setup` shows `Aspect ratio`, `Canvas width`, `Canvas height`, optional `Resolution scale`, and optional `Timeline`.
- `intrinsic-media`: explicit media-viewer/source-native products where imported media intentionally owns `canvas.size`.
- `fixed-output`: non-product/internal fixtures where users must not edit output size.

Product-output, exportable, shader, procedural, and reference-clone apps use `editable-output`. Uploaded background/source images inside a product canvas also use `editable-output`: keep the current canvas size and render the image as cover/crop inside current canvas bounds.

Use `canvas.renderScale: true` only for non-vector raster previews such as Canvas 2D, WebGL, or WebGPU. Do not enable it for DOM/SVG/vector-native previews.

## Media Defaults

Use `media.defaultAssets` for predefined files, images, or model packages with complete local appearance dependencies:

```ts
media: {
  defaultAssets: [
    {
      id: "default-source",
      assetKind: "image",
      dataUrl: "data:image/png;base64,...",
      fileName: "source.png",
      sourceTarget: "source.image",
    },
    {
      id: "default-model",
      assetKind: "model",
      fileName: "scene.gltf",
      sourceTarget: "source.model",
      sourceFiles: [
        {
          dataUrl: "data:model/gltf+json;base64,...",
          path: "scene/scene.gltf",
        },
        {
          dataUrl: "data:application/octet-stream;base64,...",
          path: "scene/geometry.bin",
        },
      ],
    },
  ],
}
```

`sourceTarget` must match a compatible `fileDrop` control target. Runtime shows the asset as an attached file, users can remove it, and Reset restores it. Model defaults require `assetKind: "model"`, a root `fileName`, and complete local `sourceFiles`; each source uses a serializable `dataUrl` plus its bundle-relative `path`. Runtime restores default models through the same validation, analysis, repair, repository, and rendering pipeline as a user upload. Persisted empty media remains empty until Reset and must not silently resurrect defaults.

## Model FileDrop

Declare appearance-preserving 3D import through the built-in control:

```ts
model: {
  type: "fileDrop",
  assetKind: "model",
  target: "source.model",
  label: "Model",
  topologyProfile: "realtime-mesh",
  modelFormats: ["glb", "gltf", "fbx", "obj", "stl", "ply"],
  modelLimits: {
    maxTriangles: 1_000_000,
  },
  performanceRole: "workload",
  performanceReason: "Imported topology controls decode, analysis, repair, and render cost.",
}
```

`modelFormats` may narrow the production adapters but cannot advertise an unavailable format. `modelLimits` may narrow normalized runtime admission limits; do not widen protected ceilings in product code. `topologyProfile` is `"realtime-mesh"` or `"solid-mesh"`. Model upload is one package (`multiple: false`): a standalone root, a folder batch with relative paths, or one bounded ZIP. Runtime preserves the supported authored appearance subset, selects the first normalized supported root, and uses the Blender-compatible fallback only when authored appearance is absent. Product code does not add loaders, topology state, repair actions, material reconstruction, or a second model store/cache.

Composition declares the presentation owner:

```ts
export const appComposition: ToolcraftAppComposition = {
  modelPresentation: { mode: "runtime" },
  schema: appSchema,
};
```

For a true custom model canvas, use `mode: "custom"` with unique `{ id, sourceTarget, orientationTarget? }` declarations and mount `useToolcraftModelPresentationConsumer` for each declaration. Custom consumers acquire and release presentation leases; they never parse source files or call format loaders. `renderDefaultCanvasMedia: false` does not suppress runtime model presentation.

## Panels

- `panels.controls` contains product sections after mandatory runtime `Setup`.
- `panels.layers` is only for multiple editable objects, media objects, groups, visibility, selection, or reorder.
- `panels.timeline` is required for product animation, keyframes, playback, and video export.

Timeline compact/extended presentation is runtime UI state owned by the auto-injected `Setup` switch. Do not create product targets for `panels.timeline.extended`.

## Toolbar

`toolbar` configures runtime-owned controls:

```ts
toolbar: {
  history: true,
  radar: true,
  theme: true,
  zoom: true,
}
```

History owns undo/redo and keyboard shortcuts. Do not add route-local undo/redo listeners.

## Control Fields

Common control fields:

| Field               | Purpose                                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `type`              | Built-in type or registered custom renderer type.                                                                            |
| `target`            | Runtime state target.                                                                                                        |
| `defaultValue`      | Initial value and reset value.                                                                                               |
| `label`             | Short UI label, `false`, or omitted.                                                                                         |
| `description`       | Product-specific help text only when it adds meaning beyond the label.                                                       |
| `visibleWhen`       | Mode/type/source/include/variant/count visibility. Hidden values are preserved.                                              |
| `orderRole`         | Makes section order testable.                                                                                                |
| `semanticGroup`     | Language-independent product sub-entity/workflow grouping, required on every control in sections larger than seven controls. |
| `sliderValueKind`   | `slider` intent: `"continuous"` or `"discrete"`.                                                                             |
| `textValueKind`     | `text`/`code` intent: `"single-line"`, `"multiline"`, or `"structured"`.                                                     |
| `curveIntent`       | `curves` composition: `"single-value-map"` or `"color-channels"`.                                                            |
| `performanceRole`   | `"workload"` or `"responsiveness"` for coverage derivation.                                                                  |
| `performanceReason` | Why the role fits this app.                                                                                                  |
| `commitMode`        | `text` controls: `"content"` applies while typing, `"setting"` commits on blur/Enter.                                        |
| `keyframeable`      | Timeline/keyframe capability override when structurally needed.                                                              |
| `variant`           | Component-specific variant.                                                                                                  |

Use `visibleWhen` for product availability. Do not use `disabled`, `disabledWhen`, or inert visible controls for generated product branches.

Conditions support `equals`, `notEquals`, `oneOf`, `notOneOf`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, and `lessThanOrEqual`.

Reserved runtime targets include `runtime.settingsTransfer`, `canvas.aspectRatio`, `canvas.size.width`, `canvas.size.height`, `canvas.renderScale`, and `panels.timeline.extended`. Product sections must not declare those controls.

## Built-In Control Types

[//]: # (toolcraft-contract:built-in-control-table:start)
| `type` | Runtime visual owner |
| --- | --- |
| `aspectRatio` | `CanvasAspectRatioControl` |
| `slider` | `Slider` |
| `rangeSlider` | `RangeSlider` |
| `text` | `TextInput` |
| `rangeInput` | `RangeInput` |
| `code` | `CodeTextarea` |
| `select` | `Select` |
| `segmented` | `Segmented` |
| `switch` | `Switch` |
| `checkbox` | `Checkbox` |
| `actions` | `Actions` |
| `collectionActions` | `CollectionActions` |
| `panelActions` | `PanelActions` |
| `colorOpacity` | `ColorOpacity` |
| `palette` | `Palette` |
| `vector` | `Vector` |
| `orientationGizmo` | `ToolcraftOrientationGizmo` |
| `color` | `Color` |
| `gradient` | `Gradient` |
| `fontPicker` | `FontPicker` |
| `curves` | `Curves` |
| `anchorGrid` | `AnchorGrid` |
| `channelMixer` | `ChannelMixer` |
| `fileDrop` | `FileDrop` |
| `imagePicker` | `ImagePicker` |
| `settingsTransfer` | `SettingsTransfer` |
[//]: # (toolcraft-contract:built-in-control-table:end)

Use `component-rules.md` for component-specific fit, labels, variants, units, parser behavior, and exceptions. Use `core/control-selection.md` before deciding a custom control is needed.

`orientationGizmo` uses a non-degenerate `{ position: [x, y, z], up: [x, y, z] }` default, `label: false`, and `keyframeable: false`. Declare one target for the active/selected model and keep it beside at least one visible product control in the semantic model/view section; runtime renders the handle on the canvas rather than in the controls panel. Multiple declarations require statically provable mutually exclusive combined section/control visibility conditions, because runtime permits at most one active orientation handle.

## Product View Interaction

Product-mode `appProductReadiness` always declares the spatial view decision
before schema controls or renderer code:

```ts
export const appProductReadiness: ToolcraftProductReadiness = {
  interactionOwnership: [],
  mode: "product",
  productName: "Model Studio",
  productSummary: "An editable three-dimensional product scene.",
  requestedBehavior: "Rotate the model and export the selected view.",
  viewInteraction: {
    mode: "orbit",
    orientationTargets: ["view.orbit"],
  },
};
```

## Interaction Surface Ownership

Product readiness declares `interactionOwnership` before controls or canvas
interactions. Each operation uses one primary surface while distinct operations
may edit related state across surfaces:

```ts
interactionOwnership: [
  {
    alternative: {
      reason: "A panel copy would separate the same drag from visible output.",
      surface: "panel",
    },
    capability: "direct-spatial-edit",
    evidence: {
      detail: "The inspected reference exposes draggable handles over output.",
      source: "reference",
    },
    id: "output-position-drag",
    reason: "Canvas drag preserves spatial correspondence and immediate feedback.",
    surface: "canvas",
    target: "output.position",
  },
  {
    alternative: {
      reason: "The canvas would obscure output with persistent property chrome.",
      surface: "canvas",
    },
    capability: "property-edit",
    evidence: {
      detail: "A usability comparison keeps non-spatial properties discoverable.",
      source: "usability-analysis",
    },
    id: "output-position-properties",
    reason: "The panel exposes useful properties without duplicating direct drag.",
    surface: "panel",
    target: "output.position",
  },
]
```

Capabilities are `direct-spatial-edit`, `spatial-selection`,
`structured-selection`, `property-edit`, `precise-value-entry`,
`collection-edit`, and `command`. Evidence sources are `user-request`,
`reference`, and `usability-analysis`. Canvas handles and custom interactions
reference the inventory through acceptance `interactionId`; a built-in panel
control also references it when its target overlaps a canvas handle.

Use `non-spatial` only when no visible three-dimensional scene/model exists.
Use `fixed-camera` or `timeline-camera` only with `source:
"explicit-user-request" | "inspected-reference"` and non-empty `evidence`.
Timeline camera also requires timeline playback/keyframes. Orbit targets must
exactly match schema `orientationGizmo` targets.

## Control Section Inventory

Before writing `panels.controls.sections`, export `appControlSectionInventory` beside `appAcceptance`:

```ts
export const appControlSectionInventory = [
  {
    entity: "Text block",
    groupingReason:
      "These controls edit the text content, typography, and visible text fill together.",
    targets: ["text.content", "text.font"],
    title: "Text",
  },
] as const;
```

Every product control target appears exactly once in the inventory. Runtime `Setup`, sticky footer `Export`, settings transfer, and runtime canvas sizing targets do not need entries.

For sections larger than seven controls, each control also declares `semanticGroup`. Controls editing one tightly scoped product sub-entity share the same value; mixed groups make a broad section fail and should be split. This fact is structural and may not be inferred from English labels.

## Transfer Metadata

Reference and motion metadata lives in `appTransferMode`.

Use `transferMode: "reference-runtime-clone"` when porting an existing app unless the user explicitly asks for redesign. Reference clones declare `referenceStudy`, `referenceFeatureInventory`, and acceptance mapping; detailed evidence requirements live in `core/reference-study.md`.

Video references declare `videoReferenceStudy` before implementation. Animated products declare `animationIntent`, and playback/keyframe timeline apps declare a proven loop duration when known. Detailed animation rules live in `core/timeline-animation.md`.

## Export And Actions

Product apps expose delivery through sticky `panelActions`, not canvas UI or ordinary body controls. Still products expose `Export PNG`; animated products expose `Export Video` plus `Export PNG`.

Every app with `Export PNG` includes `Image Export` controls with `export.image.format` and `export.image.resolution`. Animated apps also include `Video Export` controls with `export.video.format` and `export.video.resolution`.

Use standard helpers:

- `createToolcraftPngExportCanvas({ resolution, includeBackground, state, render })`
- `shouldIncludeToolcraftPreviewBackground(state)`
- `getToolcraftVideoExportSize({ resolution, state })`

Detailed Setup, Background, Image Export, Video Export, sticky action, icon, and progress rules live in `core/setup-export.md`.

## Persistence

Use persistence only for intentional user-edited state:

```ts
persistence: {
  storage: "localStorage",
  key: "toolcraft:my-toolcraft-app:state:v1",
  version: 1,
  include: ["values", "canvas", "panels"],
  additionalValueTargets: ["composition.layout"],
}
```

Add `"timeline"`, `"layers"`, or `"media"` only when those runtime slices should survive reload. If localStorage is enabled, add reload acceptance coverage.

Control-backed values are included automatically. Use
`additionalValueTargets` only for product-owned runtime values that are not
represented by schema controls, such as an authored canvas layout. The
allowlist is trimmed and deduplicated, and undeclared state remains excluded.

## Settings Transfer

`settingsTransfer` customizes runtime-owned settings import/export identity:

```ts
settingsTransfer: {
  enabled: "auto",
  appId: "my-toolcraft-app",
  fileName: "my-toolcraft-app-settings.json",
  additionalValueTargets: ["composition.layout"],
};
```

Allowed values are `"auto"`, `true`, `false`, or
`{ enabled, appId, fileName, additionalValueTargets }`. Control-backed values
are transferred automatically. `additionalValueTargets` explicitly includes
product-owned editor state that has no visible schema control; undeclared
values remain excluded. None of these options hide mandatory runtime `Setup`.
Do not implement settings import/export through `panelActions`, hidden file
inputs, or route-local handlers.
