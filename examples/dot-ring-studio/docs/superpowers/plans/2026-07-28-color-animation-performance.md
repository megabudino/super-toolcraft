# Color Animation Performance Implementation Plan

1. Refactor `src/app/dot-ring-drawing.ts` so spatial bead geometry is available without palette work, and compute the small palette-to-fill mapping once per rendered frame.
2. Update `src/app/dot-ring-scene-bounds.ts` to consume spatial geometry only while preserving the exact sampled bead-radius bounds.
3. Update `src/app/dot-ring-renderer.tsx` so Infinity scene-bound memos depend only on spatial settings, audio, canvas size, and timeline duration; palette, spread, and background changes must not invalidate them.
4. Add focused Vitest coverage proving palette-only settings produce identical spatial geometry and unchanged flat drawing semantics.
5. Update `e2e/app-performance-path-adapters.ts` so the canonical control-change adapter exercises `ring.color1`, and use Infinity canvas as the control-change precondition without changing animation quality.
6. Update `src/app/app-verification-impact.json` only if production-module ownership changes, and record exact complaint evidence, canonical paths, decisions, and risks in `docs/toolcraft/agent-worklog.md`.
7. Run targeted type/unit checks, repeat the real-browser color-change probe during playback at the reproduced workload, run `pnpm ai:check`, refresh a required kernel receipt if selected, and finish with one bare `npm run verify:delivery`.
