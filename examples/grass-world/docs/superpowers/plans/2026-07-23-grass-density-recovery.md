# Grass density recovery

Status: Complete

Verification tier: Tier 3

Reason: Tall/Lawn layout counts, live Lawn geometry, schema workload maxima, randomizer bounds, and renderer workload envelopes change. The renderer architecture, materials, masks, animation, persistence, and export paths remain unchanged.

Implementation:

1. Filter the existing bounded `4 × Density` candidate pool through the selected Tall/Lawn mask, then retain at most Density accepted roots.
2. Keep true black regions empty and minimum spacing enforced.
3. Restore six visible ribbons in lightweight Lawn clumps so equivalent count matches rendered coverage.
4. Raise Tall maximum/hard cap from `20,000` to `24,000` and Lawn from `30,000` to `36,000`.
5. Align schema-derived performance limits, randomizer clamps, and focused tests.

Verification: By explicit user request, focused layout, coverage, clump, schema, and delivery-contract tests pass 30/30; TypeScript passes. Browser, build, performance, kernel, and protected delivery were skipped.

Measured current-scene result: Tall reaches its authored default `12,500` instead of the previous `6,429`; Lawn retains `30,000` roots and now renders all six ribbons in every clump instead of reducing lightweight clumps to three. At the new maxima, Lawn reaches `36,000`; Tall reaches `23,293` of `24,000` because the current mask plus the real `0.02 m` minimum spacing exhausts the legal positions.
