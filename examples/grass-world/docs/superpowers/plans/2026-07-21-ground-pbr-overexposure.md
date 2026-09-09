# Ground PBR Overexposure Fix

Verification tier: Tier 3
Reason: Ground-only WebGL material tuning changes the visible custom renderer output but does not alter schema, persistence, export structure, timeline, or layers.
Run: inspect the transformed renderer module from the running dev server and confirm the app identity endpoint still answers.
Skip: unit, browser acceptance, performance, and protected delivery checks because the user explicitly requested no tests; in-app visual verification is blocked by the browser localhost policy.

## Implementation

1. Update `src/app/grass/grass-scene.ts` so the ground material uses the existing tint unchanged outside PBR mode, while PBR mode removes the white lift, lowers the ground albedo multiplier, and reduces only the ground environment reflection response.
2. Keep HDRI intensity, scene exposure, grass, Megascans foliage, stones, camera, timeline, layers, persistence, settings transfer, and export paths unchanged.
3. Update `docs/toolcraft/agent-worklog.md` with the diagnosed cause, renderer mapping, skipped checks, and remaining visual-verification limitation.
4. Verify the running Vite server transforms the changed module and serves the correct Toolcraft app identity; do not run the test suite.
