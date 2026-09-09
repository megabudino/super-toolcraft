# Slider Drag Performance Implementation Plan

1. Refactor `src/app/dot-ring-scene-bounds.ts` around a serializable scene
   snapshot so the existing exact bounds algorithm can execute in either the
   main document or a worker without changing export semantics.
2. Add a focused scene-bounds worker that accepts one snapshot, audio profile,
   and request id, then returns the exact full-cycle scene rectangle.
3. Add a renderer hook that keeps the last completed Infinity envelope,
   computes one immediate current-frame safety rectangle, debounces worker
   startup, terminates stale work, and publishes only the newest result.
4. Replace the synchronous full-cycle `useMemo` in
   `src/app/dot-ring-renderer.tsx` with the new hook while preserving current
   paused-frame evidence attributes and live Canvas 2D drawing.
5. Extend scene-bounds unit coverage for snapshot parity and rectangle union,
   and update `src/app/app-verification-impact.json` for every new production
   module and affected preview pass.
6. Update `e2e/app-performance-path-adapters.ts` so the canonical
   `control-drag` scenario explicitly prepares Infinity canvas before dragging
   Density.
7. Record the exact complaint evidence, canonical path id, decision trail,
   measured reproduction, and remaining risk in
   `docs/toolcraft/agent-worklog.md`.
8. Run focused tests and type/code-health checks, repeat the six-step
   real-browser probe at the reproduced workload, then finish with one bare
   `npm run verify:delivery` and keep the verified dev server available.
9. If the authority-derived image-export path exposes a main-thread task above
   budget, retain the standard PNG helper and exact geometry but split geometry
   preparation and ordered row painting across browser frames; reprove PNG
   bytes, dimensions, and the exact development path.
