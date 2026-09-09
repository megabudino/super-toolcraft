# JSON Default Settings Design

Verification tier: Tier 3

Reason: The imported settings change the initial rendered composition, default
particle workload, runtime timeline duration, and the values restored by Reset.
The renderer implementation and workload boundaries remain unchanged.

Run: Focused schema and timing tests, one browser check for fresh-state defaults
and Reset, then one bare `npm run verify:delivery`.

Skip: The complete performance audit because no renderer pass, workload limit,
export algorithm, or viewport interaction changes.

## Product Goal

Promote the stable authored values from
`/Users/kusnizza/Downloads/dot-formation-settings (1).json` to the Dot
Formation product defaults.

New workspaces and Reset should produce the same composition controls as the
settings file without replacing a user's already-persisted workspace.

## Default Value Mapping

- Canvas size remains 1080×1350 at render scale 1. The resulting 4:5 ratio
  matches the file.
- Runtime timeline duration starts at 10 seconds and remains forward-looping.
- Text starts as `Hi!`.
- Typography remains Inter, 760 px, weight 700, uppercase, white, 100% opacity.
- Particle count starts at 1800.
- Shape fill starts at `outline`.
- Edge spill starts at 23%.
- Launch remains `ring`.
- Size range remains 4–11 px.
- Active and Calm remain 4 and 1 seconds. Editing either product timing slider
  continues to set the timeline duration to their sum; before such an edit, the
  imported 10-second runtime duration acts as the default global speed scale.
- Mass, attraction, damping, and turbulence remain 0.9, 0.72, 0.66, and 0.34.
- The existing angular spectrum palette remains unchanged.
- Spectrum background changes to `#CFBCB0`.
- Trails and size motion remain 0.68 and 0.82.
- Glow starts at 0.
- Background remains included.
- Image export remains PNG at 4K; video remains MP4 at current resolution.

## Runtime Session Boundary

The file also contains transient workspace state. These fields do not become
product defaults:

- `timeline.currentTimeSeconds`
- `timeline.isPlaying`
- `timeline.expanded`
- `canvas.mode`

The playhead starts at zero with the normal runtime playback behavior. Infinity
canvas remains a user-selected workspace mode and persisted workspaces keep
their current mode.

## Reset, Persistence, And Transfer

Every changed product value is declared through the existing schema
`defaultValue`, so runtime Reset and settings transfer keep a single state
owner. The persistence key and version stay unchanged: existing saved work is
preserved, while a fresh workspace or Reset receives the new defaults.

## Control And Animation Inventories

The existing control section inventory is unchanged because no control is added,
removed, renamed, or regrouped.

The animation intent remains a forward-only playback timeline. The top
Toolcraft timeline owns transport and global duration; Active and Calm own the
product phase ratio. Preview, image export, and video export continue reading
the same runtime values and timeline.

## Acceptance

- Schema tests assert the complete changed default set.
- Timing tests distinguish the 10-second runtime timeline default from the
  unchanged 4+1 product phase design.
- Browser verification starts from cleared app persistence, observes the new
  values through real controls/output, changes representative values, invokes
  Reset, and observes their restoration.
- Existing persistence behavior remains covered without bumping or clearing the
  user's saved state.
