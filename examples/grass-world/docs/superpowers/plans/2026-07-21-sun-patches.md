# Sun Patches implementation plan

1. Add Sun Patches defaults and bounded settings parsing, including a normalized two-axis Offset mapped to world X/Z; keep persistence v6.
2. Add the seven-control `Sun Patches` schema section with built-in switch, stepped-continuous sliders, and Vector Offset, then place it after `Scene Lighting` and add its section inventory.
3. Create `grass-sun-patches.ts` with shared retained uniforms, deterministic fixed-octave GLSL noise, standard-material shader composition, stylized shader chunks, and uniform updates.
4. Share those uniforms across ground/moss, every scan material, Static PBR Lawn/Tall Grass, and Dynamic Lawn/Tall Grass; update only final render uniforms and preserve existing material maps, normals, roughness, shadows, HDRI, wind, and exports.
5. Add the new targets to final-render invalidation, register the new production module in `app-performance-impact.json`, and keep all pipeline passes and workload envelopes unchanged.
6. Extend product expectations, acceptance rows, and authored browser coverage for all scalars plus `vector.x`/`vector.y`; do not edit protected runtime tests.
7. Update `docs/toolcraft/agent-worklog.md`. Do not run automated tests, build, browser acceptance, performance checks, or `verify:delivery`; leave the current development server available.
