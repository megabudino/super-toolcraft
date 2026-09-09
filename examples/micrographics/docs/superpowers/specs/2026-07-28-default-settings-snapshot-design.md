# Default Settings Snapshot Design

## Goal

Make the complete supported state from
`/Users/kusnizza/Downloads/micrographics-settings (1).json` the default
Micrographics state. A fresh app opening must show the exact imported poster,
and the runtime `Reset controls` action must restore that same state.

## Source Mapping

The JSON metadata (`appId`, `exportedAt`, `source`, and `version`) is transfer
metadata rather than product state. The product has no timeline, so the
exported timeline transport state remains intentionally ignored.

The canvas is already configured for the exported 1080 × 1350 px, 4:5 output.
The following visible schema defaults change:

- `composition.seed`: `375` → `447`
- `composition.count`: `5` → `3`
- `composition.kit`: `full` → `minimal`
- `elements.scale`: `80` → `71`
- `source.preset`: `chaos` → `fitness`

The existing defaults for template tier, template-library selection, element
opacity, global ink and glow, palette, source upload, background, image format,
and image resolution already match the JSON and remain unchanged.

The full serialized `composition.layout` becomes a product-owned default
snapshot. It preserves authored positions, sizes, text, colors, opacity,
template ids, deterministic seeds, and removed-element markers exactly as
exported.

## Runtime Behavior

A focused product module owns the immutable target-keyed defaults, including
the exact authored layout string. The existing Compose actions control owns
`composition.layout` directly and declares that snapshot as its schema
`defaultValue`.

This makes the layout part of runtime `state.defaults` from the first state
construction. Fresh opening and `Reset controls` therefore converge through
the standard Toolcraft default extraction and reset reducer rather than a
post-render initialization effect. Persisted, imported, or actively edited
layouts remain ordinary values and continue to win until the user invokes
Reset.

The local `Reset layout` command writes the same default layout. Shuffle remains
the intentional exception: it changes the seed and clears authored layout to
request a newly generated composition.

Because `composition.layout` is now an ordinary schema target, persistence and
settings transfer discover it automatically and no longer need
`additionalValueTargets`. The renderer, canvas editor, settings transfer,
persistence, and PNG export continue consuming the same runtime target; no
hidden control, parallel local state, or app-owned settings UI is added.

## Error Handling

The source snapshot is checked by focused tests through the existing
`parseElements` validator and a byte-stable SHA-256 assertion. Existing
renderer validation remains responsible for safely ignoring malformed authored
entries.

## Verification

Verification tier: Tier 3

Reason: Schema defaults and reset behavior change, and a product-owned canvas
state snapshot now determines the initial and reset renderer output. Renderer
technique, workload boundaries, pass invalidation, media flow, and export
mechanics remain unchanged.

Run:

- `npm run ai:check` before implementation;
- focused unit tests for every mapped schema default and the exact serialized
  layout;
- focused product tests proving fresh initialization, preservation of an
  existing layout, and reset-layout restoration;
- focused browser acceptance proving a clean opening and `Reset controls`
  restore the imported controls and exact visible composition;
- one exact Tier 3 `npm run verify:delivery` at the delivery boundary;
- `npm run dev` after the protected receipt.

Skip:

- timeline tests because timeline remains disabled;
- media-import tests because the default upload is null and the existing cover
  preset path is unchanged;
- full performance certification because no renderer pass, workload boundary,
  adapter, or interaction cost model changes.
