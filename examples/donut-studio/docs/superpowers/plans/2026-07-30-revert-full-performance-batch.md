# Roll Back Full Performance Batch

Verification tier: Tier 4
Reason: Revert the broad renderer, material, scene-loading, export-worker, and gizmo-preview changes introduced after the last known-good Iteration 9 boundary.
Run: Targeted type/tests and browser smoke checks, then `npm run verify:delivery` and `pnpm dev:restart`.
Skip: `npm run verify:perf`; this is an ordinary rollback request, not authority for a new measured performance audit.

## Implementation

1. Reconstruct the exact pre-request state by reversing every recorded patch from the latest full-performance batch in reverse chronological order.
2. Remove files that were introduced only by that batch.
3. Preserve all product changes through Iteration 9, including the Blender-derived geometry, edible materials, HDRI lighting, plate shadow, and demand-driven shadow rendering.
4. Add a rollback decision entry to the Toolcraft worklog and align verification ownership with the restored production files.

## Verification

1. Run focused type and product tests for restored renderer/material/export behavior.
2. Run the lifecycle delivery gate once.
3. Restart the saved-port development server and verify the real app loads on the existing URL.
