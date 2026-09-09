# Starter Audio FileDrop Design

## Request

Replace the product-owned music-file uploader with the file-upload design and lifecycle already provided by the current Toolcraft starter.

## Source Of Truth

- The current starter runtime `fileDrop` implementation in `/Users/kusnizza/Projects/primeui-v2/packages/ui/src/components/controls/file-drop`.
- The matching signed generated runtime already present in `src/toolcraft`.
- Existing Dot Ring Studio audio decoding, fallback profile, renderer, export, and persistence behavior.

The generated and current-starter `fileDrop` UI implementations are equivalent. The visual mismatch comes from `src/app/audio-source-control.tsx`, which bypasses the built-in control.

## Approaches Considered

1. Use schema `fileDrop` with `assetKind: "file"` — selected. It reuses the starter presentation, runtime media import, deletion, filtering, persistence, and drag-and-drop behavior.
2. Restyle the custom audio control — rejected because it would preserve duplicate upload and deletion logic.
3. Copy starter uploader components into product code — rejected because product code must not recreate runtime controls and copied UI would drift from future starter updates.

## Product Design

The `Source Audio` section remains the product owner for the music source. Its `audio.source` control becomes a built-in, single-file `fileDrop` narrowed to common audio MIME types and extensions.

Before a user imports a file, the existing bundled audio-analysis profile continues to drive the animation. The empty starter uploader invites the user to choose or drop a file. After import, the built-in file-list presentation shows a paperclip, the filename, and the standard remove button. Removing the file restores the bundled profile.

No upload affordance is added to the canvas. The controls panel remains the sole interaction owner for selecting and removing source audio.

## Architecture And State Flow

- `src/app/app-schema.ts` declares `audio.source` as `type: "fileDrop"`, `assetKind: "file"`, `multiple: false`, with an audio-only `accept` value.
- Runtime source-asset coordination imports the file, stores the durable resource, updates `state.mediaAssets`, renders file status, and deletes the asset.
- Existing audio code continues to select only audio file assets whose `sourceTarget` is `audio.source`.
- The renderer continues to decode the selected asset and falls back to the bundled profile when no matching media asset exists.
- `src/app/app-composition.tsx` no longer registers a custom audio control renderer.
- `src/app/audio-source-control.tsx` is removed.

## Acceptance And Error Handling

- Unsupported files are rejected by the runtime based on the schema `accept` constraint.
- Runtime status and feedback presentation own staging or rejection messages.
- Uploading the WAV fixture must change the rendered source name and waveform signature.
- Removing the attached file through the built-in row action must restore `Minimal Electro Bass Pulse`.
- Reload persistence must continue to restore the imported audio resource.
- Acceptance metadata changes from custom-control coverage to built-in `fileDrop` media lifecycle coverage.
- Browser helpers and performance adapters use standard file-list output and rendered-product attributes, not custom `data-audio-source-*` markers.

## Verification

Verification tier: Tier 3

Reason: The control presentation, media import/remove lifecycle, schema control type, acceptance ownership, and browser interaction selectors change. Renderer technique and workload boundaries remain unchanged.

Run: targeted schema/acceptance tests and the focused browser audio lifecycle during development; then one bare `npm run verify:delivery`; finally `npm run dev` and verify the starter uploader in the real app.

Skip: `npm run verify:perf`, because this is not an explicit full-audit request or a performance complaint.

## Risks

- The built-in empty state does not display the bundled profile name; that fallback remains documented by the control description and observable in the product output.
- Tests that depend on custom audio-control data attributes must move to stable runtime `fileDrop` roles, labels, and file-list content.
