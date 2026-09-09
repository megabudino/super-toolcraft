# Imported Default State Design

## Goal

Make the supported product state from
`/Users/kusnizza/Downloads/micrographics-settings.json` the default state of
the Micrographics app.

## Source Mapping

The exported state already matches the app for canvas size, aspect ratio,
template tier, kit, colors, palette, background, source upload, and image
export. Four schema defaults differ and will change:

- `composition.seed`: `137` → `375`
- `composition.count`: `8` → `5`
- `elements.scale`: `100` → `80`
- `source.preset`: `atlas` → `chaos`

The exported metadata (`appId`, `source`, `exportedAt`, `version`) is not
product state. Timeline state is ignored because this product intentionally has
no timeline. The null uploaded image remains represented by the existing
`source.image` default.

## Runtime Behavior

The schema remains the single source of resettable defaults. No startup import
side effect is added, persistence is not cleared, and existing saved user state
is preserved. `Reset controls` restores the imported product values. New
sessions without saved state start from the same values, while the runtime Setup
continues to own the already-matching 1080 × 1350 canvas size.

## Verification

Verification tier: Tier 2

Reason: Product schema defaults and reset behavior change, while the renderer,
state shape, workload dimensions, and canvas mechanics remain unchanged.

Run:

- focused schema unit test for every imported default;
- focused browser acceptance proving Reset controls restores the imported
  defaults and visible Chaos cover;
- exact Tier 2 delivery selectors.

Skip:

- performance scenarios because no reachable workload boundary, renderer pass,
  or invalidation behavior changes;
- timeline tests because timeline remains disabled;
- media import tests because the imported default contains no uploaded file.
