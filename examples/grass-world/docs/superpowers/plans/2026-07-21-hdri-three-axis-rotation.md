# HDRI three-axis rotation implementation plan

1. Add 0° `environment.rotationX` and `environment.rotationZ` defaults, extend `GrassSettings`, and read both values as bounded −180–180° angles while retaining the existing Y target and persistence version.
2. Add built-in `Rotate X` and `Rotate Z` sliders around the renamed `Rotate Y` control in `grass-environment-controls.ts`; update the Scene Lighting section inventory.
3. Add both targets to `grassRenderSliderTargets`, then compute one reusable XYZ Euler in `grass-scene.ts` and apply it to the panorama, PMREM orientation, decoded physical key, rim, and stylized grass direction.
4. Align product unit expectations, PBR acceptance rows, and the authored HDRI browser scenario with all three axis controls. Do not edit protected runtime tests.
5. Update `docs/toolcraft/agent-worklog.md` with the control choice, state/output mapping, unchanged performance envelope, and skipped proof.
6. Do not run automated tests, build, browser acceptance, performance checks, or `verify:delivery`; leave the existing dev server available.
