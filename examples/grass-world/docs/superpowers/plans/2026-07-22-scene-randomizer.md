# Scene randomizer

Verification tier: Tier 2

Reason: This adds persisted schema controls and a local action that writes existing renderer targets. It changes no renderer technique, pass, resource, workload bound, canvas behavior, timeline, layer model, or export path.

Run: AI/code-health, focused schema/randomizer/acceptance tests, TypeScript, production build, exact browser proof for both scopes, and one protected delivery invocation.

Skip: Full performance checkpoint because one user click only updates existing bounded settings and does not add continuous work or increase any maximum count.

## Product behavior

- Insert `Scene Randomizer` after the complete scene-lighting/color setup and before `Field`.
- Use the built-in `switch` for `Global` and built-in local `actions` for one `Randomize` command.
- Default `Global` off so an authored HDRI/light setup is protected.
- Local mode chooses one of several strongly differentiated typed world archetypes, then varies it within curated safe ranges. Field width and length always stay untouched. Each archetype owns perimeter silhouette, Terrain height mask, Tall coverage mask, Clover coverage mask, slope filtering, grass-layer visibility/density, scan-layer composition, rocks, material palette, and deterministic seeds as one coherent world recipe.
- Global mode applies the same surface/content patch plus HDRI preset/orientation, environment lighting, light balance, sun patches, color grade, and background.
- Never randomize canvas/export settings, timeline, wind, camera orientation, preview caps, or the randomizer toggle itself.
- Every archetype guarantees at least one core grass layer but may deliberately disable the other and chooses a distinct scan-layer composition, so successive worlds can be dense meadow, compact moss garden, long ridge, flower valley, irregular island, or sparse highland rather than the same filled island.
- Dispatch the patch with history skipped: Toolcraft currently has no atomic multi-target value command, and its merge mode replaces rather than combines target patches. This avoids publishing a corrupted partial Undo entry until an upstream batch command exists.

## Implementation

1. Add `randomizer.global` to defaults and a two-control `Scene Randomizer` section in `grass-controls.ts`; place it after `Color Grade` and update the section inventory.
2. Add typed `grass-randomizer-recipes.ts` data and keep `grass-randomizer.ts` as a small compiler from one coherent recipe to a strongly keyed runtime patch; remove the current flat untyped bag of independent random values.
3. Route `randomize.scene` from the existing Toolcraft panel-action handler without changing export behavior.
4. Add functional ownership for the new module and acceptance rows for the action and its scope toggle.
5. Add deterministic unit proof that sequential RNG fixtures keep width/length absent and produce materially different layer composition, perimeter silhouette, Terrain/Tall/Clover masks, and relief; local scope preserves every environment/background value; global scope changes them and removes a custom HDRI override; all produced targets exist; dispatch does not create corrupt merged history.
6. Add one exact browser test proving local randomization changes product output while keeping the environment signature stable, then Global randomization changes the environment and product output.
7. Update product readiness and the worklog, run the selected verification, and keep the app available on its saved port.
