# Adjustable Loop Timing Implementation Plan

1. Add the built-in `Active` and `Calm` sliders to a new `Timing` schema section
   in `src/app/app-schema.ts`, keeping defaults at 4 and 1 seconds.
2. Extend `DotsSettings` and `readDotsSettings` with bounded timing values.
3. Replace fixed normalized phase constants in `src/app/dots/dots-timing.ts`
   with pure helpers that derive formation, calm, and release boundaries from
   the two timing values while preserving the 75/25 active split. Derive calm
   breathing from actual elapsed seconds at a fixed frequency with short
   boundary fades, so Calm changes duration without changing idle speed.
4. Update `dots-motion.ts`, `dots-renderer.tsx`, and export consumers to use the
   derived timing. Synchronize the runtime timeline duration only when either
   product timing value changes, leaving later direct timeline-duration edits as
   a proportional global speed scale.
5. Update the canonical renderer pipeline invalidators and
   `app-performance-impact.json` ownership only where timing can change
   preview/image/video output.
6. Add both controls and the Timing section to acceptance metadata, update
   requested behavior and animation mapping, and expose stable renderer data
   attributes.
7. Extend focused Vitest coverage for defaults, custom timing boundaries,
   duration sums, fixed calm-motion speed, continuity, and the unchanged
   first/last seam.
8. Add a focused Playwright scenario that moves both real sliders, observes the
   summed runtime duration, verifies calm duration and release timing, edits the
   top timeline duration to prove proportional scaling, and checks rendered
   output plus the loop seam.
9. Update `docs/toolcraft/agent-worklog.md` with the decision trail,
   interaction ownership, verification scope, and risks.
10. Run `npm run ai:check`, focused tests, typecheck, the focused browser
    scenario, exact affected performance paths, and one protected Tier 3
    delivery. Restart the app and inspect the live five-second default.
