# Media Upload

Read this module before changing image upload, file upload, source material import, media defaults, source images, sorting, or image transform actions.

## FileDrop Ownership

- Use `fileDrop` for source material uploads in the controls panel.
- Do not place upload UI on the canvas.
- Do not build custom file lists, custom upload buttons, or custom sorting when `fileDrop` can represent the source set.
- Use `assetKind: "image"` for image-only source uploads.
- Use `assetKind: "file"` for arbitrary uploaded files.
- Use `assetKind: "model"` for one geometry-only 3D model bundle.
- Image mode accepts images only by default.
- File mode accepts any file by default unless `accept` narrows extensions or MIME types.

## Empty Source State

- When upload/import is part of the source-material flow, the empty product canvas stays neutral.
- Do not invent canvas placeholder artwork, CTA copy, helper text, fake sample output, decorative placeholder, or agent-made source preset before real content exists.
- A default procedural/reference source is allowed only when the prompt or reference explicitly defines it and the worklog records the evidence.

## Image Uploads

- In single-layer apps, the runtime shows uploaded image preview and clear button in the file control.
- Clearing removes the attached source from the renderer and canvas.
- With exactly one uploaded image, image transform actions are visible immediately.
- With multiple uploaded images, users select a thumbnail first; until then transform actions are hidden.
- Once selected, transform actions apply only to that selected image.
- The FileDrop panel preview is not product canvas rendering. It keeps a stable preview frame across rotate/flip actions and contains the transformed bitmap inside that frame.
- Horizontal or vertical uploads must not be cropped by the control preview.

## Image Transform Actions

- Runtime owns image transform actions directly below image uploaders.
- Actions render through the built-in `actions` control, not through a custom image action grid.
- Use one row of three compact action buttons:
  - `90°` for rotate right;
  - `Flip H`;
  - `Flip V`.
- Keep a 6px vertical gap between uploader and action row.
- Product preview/export consumes `state.mediaAssets[].transform`.
- Do not keep separate product-only image transform state.

## Multiple Uploads And Sorting

- Use `multiple: true` when the app needs several uploaded images or files as one source set.
- Multiple image uploads render as a sortable four-column thumbnail grid.
- The add-more tile is last.
- Per-image removal stays inside the file control.
- Dragging thumbnails updates runtime media order.
- Product renderers and exports consume runtime media order instead of keeping a separate product-only order.

## File Uploads

- In file mode, uploaded files render as a sortable list with a paperclip icon, filename, remove button, and `--border/5` separators.
- Long filenames fade/truncate at the end instead of hard-clipping.
- The last item has no bottom separator.
- The add row is part of the file control and uses the same width and hover behavior as list rows.
- When an app contains both image and file uploaders, canvas drops route by asset kind:
  - image files prefer visible image uploaders;
  - non-image files prefer visible file uploaders;
  - file uploaders may accept images only when no image uploader matches.
- Product renderers filter `state.mediaAssets` by `sourceTarget`.

## 3D Model Uploads

- A model `fileDrop` is a runtime-owned compound control. Product code declares the target, optional `modelFormats`, optional narrowed `modelLimits`, and `topologyProfile`; it does not build loaders, topology UI, repair buttons, workers, or a parallel model state.
- Production formats are `glb`, `gltf`, `fbx`, `obj`, `stl`, and `ply`. The normalized default advertises every production format. Narrow the list only when product semantics require it; never advertise an adapter that is absent from the production worker registry.
- Import consumes the complete selected `File[]` batch. A glTF root may resolve exact local buffer dependencies from that batch. Remote resources, path traversal, ambiguous roots, appearance-only files, and unsupported external dependencies are rejected instead of fetched.
- The model pipeline keeps static geometry and topology only. Authored materials, textures, lights, cameras, animation clips, rigs, skins, and morph behavior do not become product state or renderer authority.
- One accepted bundle becomes one model item and one model layer. Binary source, canonical geometry, repair plans, workers, and Three.js resources remain outside Toolcraft state, history, and localStorage; serializable state stores validated resource references and analysis summaries.

### Analysis And Repair

- Import decodes and structurally validates in the runtime module worker before topology analysis or canvas presentation.
- Lifecycle is `clean`, `repairable`, `fixed`, `restoring`, or `unavailable`. Fatal input is rejected atomically and must not replace the last committed model.
- Runtime shows `Fix model` only when it has already compiled a deterministic safe repair plan. The action uses the built-in actions control and its canonical button loader; duplicate repair is disabled while the worker runs.
- Safe repair may remove invalid or duplicate triangles, compact unused vertices, regenerate normals, repair locally provable winding, and recalculate bounds. It must not weld, remesh, fill holes, smooth, merge shells, guess indices, or mutate authored transforms.
- Repair commits only after the derived canonical document is structurally validated and topology is reanalyzed. Failure keeps the original committed model and exposes typed feedback.

### Preview, Orientation, And Export

- The runtime canvas layer renders committed models through the standard lazy Three binding. A structurally valid staged draft may preview during analysis without replacing committed state.
- Analyzing and repairing preview opacity is `40%`; committed preview and export opacity is `100%`.
- Rotatable model products use `orientationGizmo`. Direct drag on model geometry and the gizmo write the same orientation target; a canvas miss remains viewport pan. Preview, undo/reset, and export read that shared pose.
- Product image export creates its normal target canvas, renders product-owned pixels, then awaits `renderModelsToCanvas(exportCanvas)` from `onPanelAction` before encoding or downloading. This composites visible committed model layers at the current canvas size, target pixel ratio, and shared orientation. Do not enumerate model assets or call Three loaders in product export code.
- Video export must render the same visible models and shared pose through the runtime model binding for every exported frame; it cannot substitute the panel preview or omit model layers.

### Persistence And Proof

- With `"media"` in `persistence.include`, model records restore asynchronously from the binary repository. Missing, corrupt, forged, or stale resources produce typed `unavailable` state rather than a partial model or crash.
- Reset restores default model attachments through the same async import pipeline. Delete, replacement, undo, redo, reset, hydration, and active jobs participate in repository reachability and cleanup.
- Model acceptance uses complete `modelImportCoverage` and protected browser recipes. Required proof covers every advertised format, staged and committed output, repair diagnosis/action/progress/result, fatal preservation, persistence/unavailable restoration, preview/export output, and history/reset.
- Model workload and responsiveness checks derive from normalized model limits and run as targeted model paths. They do not refresh a generated app's full performance checkpoint during ordinary later feature work.

## Canvas Source Images

- Uploaded background/source images inside product canvases use `editable-output`.
- Uploaded source images do not change `canvas.size`.
- Setup canvas controls remain visible.
- Draw source/background images as cover/crop inside current canvas bounds without letterbox or aspect distortion.
- Scale proportionally until the current canvas bounds are fully covered, then crop overflow at canvas bounds.
- Reserve `intrinsic-media` for true media-viewer/source-native products where imported media natural dimensions intentionally own `canvas.size`, and prove that with acceptance coverage.

## Default Assets

- Use `media.defaultAssets` when an app starts with predefined files, source images, masks, symbol sets, or background images.
- Each default asset sets `sourceTarget` to the matching `fileDrop` target.
- Runtime treats these as attached files: users see them in the uploader, can remove them, and Reset restores them.
- If removal, reorder, or transforms of predefined media should survive reload, add `"media"` to `persistence.include`.
- Do not mirror the file list into product `values`.
- Do not hard-code default source files inside `canvasContent` or the renderer.

## Layers

- In multi-layer apps, deletion and visibility belong to the Layers panel.
- `fileDrop` stays an upload target.
