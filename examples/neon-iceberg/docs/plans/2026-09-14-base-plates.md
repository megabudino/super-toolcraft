# Four equal base plates

Later feature work on `codex/iceberg-experiments`. Substantial because topology, shader coordinates, scene bounds and runtime control coverage must agree.

- Interpret the two supplied still images as horizontal cuts below the irregular boundary: four equal lower plates and the remainder carrying the complete mountain. The optional clarification has no reply; use the annotated-image interpretation. No new motion reference or export capability.
- Add one built-in continuous `Base / Plate gap` slider (`iceberg.plateGap`, 0–0.6, default 0). Panel owns this global property; existing canvas orbit remains unchanged. A zero gap reconstructs the existing output. Runtime owns persistence, history and reset.
- Derive a guaranteed solid core from the existing seam height envelope. Divide that core into four equal lower plates; the unsliced remainder above keeps the complete mountain. This keeps cuts below every reachable recess without flattening or moving the mountain. Deeper recesses leave thinner plates.
- Retain one fixed topology containing the existing mountain and four small closed boxes. GLSL sets their source heights and rigid vertical offsets. Keep material sampling in original coordinates, with closed plain-ice horizontal cuts and the existing side grid. No new context, framebuffer, per-frame allocation, animation, editable collection or Layers panel.
- Expand the shared projected scene bounds downward by four gaps, preserving projection/world scale and the existing preview/export owner.
- Owners: `iceberg-controls`, `iceberg-inventory`, `iceberg-topology`, new `iceberg-plates`, `iceberg-shaders`, `iceberg-engine`, `iceberg-camera`, acceptance/performance metadata and focused product unit/browser tests.

Verification tier: Tier 3, later focused feature
Reason: Closed sliced geometry, one live control and projected bounds.
Run: Existing render-plan assessment before renderer edits; focused plate topology/layout, camera and product contract tests; `npm run test:feature -- iceberg.plateGap` with held-pointer pixel evidence, four equal gaps/five visible parts, closure, zero restoration, orbit, reload and one PNG content check; embedded browser inspection.
Skip: Aggregate delivery/build, unrelated control matrices and measured performance; this is later functional work with unchanged dependencies/provider.
