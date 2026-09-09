# Current-look scene randomizer

Status: Complete

Verification tier: Tier 2

Reason: The existing Scene Setup action changes product state ownership and generated output, but adds no control, renderer pass, workload dimension, media behavior, timeline behavior, or export path.

Implementation:

1. Remove every Ground, Clover, Tall, Lawn, plant, flower, rock, and boulder color target from the generated world patch so Randomize preserves the exact active project colors.
2. Remove obsolete generated-palette marker recovery from the action path; repeated Randomize actions keep using the active pre-generated scale reference.
3. Reduce the correlated scale ceiling from `1.25` to `1.20`, covering Terrain maximum height, Tall/Lawn height ranges, boulder size, and all scan size ranges without cumulative growth.
4. Keep field width/depth, lighting, HDRI, material response, wind, fade, visibility guarantees, density, distribution, clumping, seeds, and terrain morphology behavior unchanged.
5. Align Scene Setup copy, acceptance/performance descriptions, ownership tests, deterministic randomizer tests, and this worklog.

Verification: By explicit user request, focused randomizer and world-generator Vitest pass 16/16; TypeScript passes. Browser, build, performance, kernel, and protected delivery were skipped.
