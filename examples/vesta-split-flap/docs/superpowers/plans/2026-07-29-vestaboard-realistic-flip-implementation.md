# Vestaboard Realistic Flip Implementation Plan

Spec: `docs/superpowers/specs/2026-07-29-vestaboard-realistic-flip-design.md`

## Steps

1. `src/app/vestaboard-model.ts`
   - Add drum constants (`VESTABOARD_DRUM_CHARS`), drum index lookup, forward distance, and `getDrumSpinFrame` (jitter, ±3% rate variance, wear pause, finish-guarantee rate floor, chip positions).
   - Extend `VestaboardSettings` with `flipMode`, `flipWear`, `flipTrailOpacity`, `flipShake`, `soundEnabled`, `soundVolume`, `gridPreset`, `uppercase`; resolve new targets in `resolveVestaboardSettings` (uppercase applied to `message` / `targetMessage`).
   - Extend `VestaboardModelOptions` with `durationSeconds`; extend `VestaboardCell` with `trailChar`, `isFlipping`; extend `VestaboardModel` with `shakeX`, `shakeY`, `flippingCellCount`.
   - Branch phrase removal, kept-letter morph, and field cells on `flipMode` — drum path spins to/from blank with distance-based timing; random path stays byte-identical.
   - Grid preset branch: `vestaboard` forces 22×6 and derives cell size from canvas minus gaps.
   - Draw trail glyphs and apply shake offset in `drawVestaboardToCanvas`.
2. `src/app/vestaboard-audio.ts` (new): framework-free WebAudio click engine — shared noise buffer, per-click bandpass + thock oscillator, master gain, column pan, `connectRecorder` for export destination tracks.
3. `src/app/app-schema.ts`: add `Flip Mechanics` section (mode, wear, trail, vibration, sound switch, volume) with `disabledWhen` wiring, `Grid preset` in Board Surface (tile sliders disable under preset), `Uppercase` in Board Message, `Duration spread` / `Field duration` disabled in drum mode.
4. `src/app/vestaboard-renderer.tsx`: pass `durationSeconds`, render trail spans, apply shake to the foreground transform, add the sound hook (frame diff → clicks, gated on `isPlaying` and the enabled switch).
5. `src/routes/index.tsx`: pass `durationSeconds` into both exports; when sound is enabled, add an audio destination track and synthesized per-frame clicks to the video recorder with audio-capable MIME candidates.
6. Coverage: acceptance entries + performance scenarios for all eight controls; unit tests for drum math, wear, preset, uppercase, trail, shake; browser tests (`e2e/app-controls.spec.ts`) for each new control acceptance and perf name.
7. Docs: refresh `agent-worklog.md` with decisions, evidence, and verification; keep spec/plan files.

## Verification

- `pnpm verify:quick`; focused vitest on new drum/preset/uppercase suites.
- `pnpm build`.
- Browser gates: `pnpm test:browser` (new control names) and `pnpm verify:perf` on the development machine.
