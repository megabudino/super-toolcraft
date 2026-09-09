# Vestaboard Realistic Flip Design

## Goal

Make the flip animation read like a real split-flap machine: modules step through a fixed drum sequence instead of random glyphs, timing follows physical flap distance at a mechanical rate, motion leaves a short trail, the board vibrates subtly while many modules run, the machine clatters (preview and video export), and the board can snap to the authentic 22 by 6 layout with uppercase text.

## Product Decisions

- `Flip mode` (`board.flip.mode`, segmented `Drum` / `Random`, default `random`) selects the character engine. `Random` keeps the existing deterministic random-flicker behavior byte-for-byte so saved settings and existing coverage stay stable. `Drum` is the realistic engine.
- Drum engine: every module steps forward-only through a fixed drum `" ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!?$&@#%+-*/=:."`; removal spins to blank, background fill-in spins from blank, kept letters spin from source char to target char during the layout morph. Spin duration is drum distance divided by the module flap rate, so nearby characters land early and far characters keep spinning — durations are physical, not sampled from `Duration spread` (that control disables in drum mode, same for `Field duration`).
- `Letter speed` and `Field speed` map to flap rate (3–20 flaps/second) in drum mode. Every module starts near progress 0 with a small seeded start jitter (up to 120 ms), each module gets a seeded ±3% rate variance, and the per-module rate is raised just enough to guarantee the module finishes inside its stage window so final frames stay exact.
- Flash palette colors become color chips on the drum in drum mode: a module that passes the chip section shows the chip as a solid tile fill (existing `messageFlashColor` rendering). `Flash colors` selects how many chips are on the drum; `Flash frequency` keeps its meaning as the share of modules whose drum carries chips.
- `Wear` (`board.flip.wear`, slider 0–100, default 12, disabled in random mode) gives a seeded share of spinning modules one mid-spin sticky pause (100–350 ms) before they continue — the aged-board tick.
- `Trail` (`board.flip.trailOpacity`, slider 0–100, default 30) draws the previous character of an actively flipping module as a ghost behind the current one, in DOM preview and Canvas export. 0 disables.
- `Vibration` (`board.flip.shake`, slider 0–100, default 25) shifts the whole board by a deterministic sub-pixel offset (max ~1.1 px) scaled by how many modules are flipping. Applied to the DOM foreground layer and as Canvas export offset; settles to zero when the board is at rest.
- `Sound` (`board.sound.enabled`, switch, default off) plus `Volume` (`board.sound.volume`, slider 0–100, default 60, disabled while sound is off) synthesize flap clicks with WebAudio during playback: click density follows how many modules changed character this frame, each click gets random pitch, and stereo pan follows the module column. Video export mixes the same synthesized clicks into the recording through a `MediaStreamAudioDestinationNode` track; with sound off, video export keeps the current silent pipeline and MIME selection.
- `Grid preset` (`board.grid.preset`, segmented `Custom` / `22×6`, default `custom`) forces the authentic Vestaboard 22-column by 6-row grid; cell size derives from the canvas minus gaps, and the tile Width/Height sliders disable while the preset is active. `Gap`, radius, and all surface controls stay live.
- `Uppercase` (`board.text.uppercase`, switch, default off) uppercases Message and Target message before layout, matching the real all-caps board.
- Random-mode-only concepts (`Duration spread`, `Field duration`, launch window) keep their exact current behavior in random mode; trail, vibration, and sound work in both modes.

## Renderer And Export

- `buildVestaboardModel` accepts `durationSeconds` so drum timing works in wall-clock seconds; renderer and both exports pass the timeline duration. Cells expose `trailChar` and `isFlipping`; the model exposes `shakeX`, `shakeY`, and `flippingCellCount`.
- DOM preview adds a ghost span per flipping cell (`vestaboard-trail-{row}-{col}`) and applies the shake offset to the foreground layer transform. Canvas export draws the same trail glyphs and applies the same shake offset, keeping preview/export parity.
- Sound is renderer-side (frame-to-frame character diff, gated on `isPlaying`) with a lazily created `AudioContext`; export synthesizes clicks per recorded frame into the recorder stream when enabled.

## Acceptance

- Unit tests prove drum order (forward-only adjacency, wrap, blank endpoints), distance-proportional durations, guaranteed final frames, wear pauses, chip gating, trail characters, shake determinism and rest state, preset grid counts, and uppercase mapping.
- Browser tests cover every new control through the real UI: flip mode segmented, wear, trail, vibration, sound switch and volume, grid preset, uppercase.
- Performance matrix adds workload/responsiveness scenarios with stress fixtures for every new visible control.

## Verification Note

Verification tier: Tier 4
Reason: Rewrites the animation engine, adds renderer layers/audio, changes export composition, and adds eight controls with matrix coverage.
Run: `pnpm verify:quick`, `pnpm build`, `pnpm verify:final` (browser gates run on the development machine), then `pnpm dev` for visual QA.
Skip: none for final delivery.
