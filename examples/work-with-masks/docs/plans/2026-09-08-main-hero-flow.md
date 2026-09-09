# Flow in the main hero editor (port 3005)

Request: “применить механику из плана туда при этмо не менять текущие настрйоки сцены”. The main app is percent-hero-iframe-generator. Export is excluded and verification stays focused.

Verification tier: Tier 3 — later animation change.
Run: Focused Flow geometry/domain/schema tests, one typecheck for shader integration, and bounded actual renderer samples for the original pose, intermediate direction, and seam. One local UI check on 3005.
Skip: Full tests, build, integrity/AI/docs audits, delivery gate, performance and browser contract matrices per user scope.

Preflight: Local AGENTS.md and workflow.md read. Selected routes: schema/controls, renderer, timeline. All routed Plan/Implementation/Verification documents are byte-identical to the ones read in full earlier for percent-hero-static; those readings are reused.

## Decisions

- Keep the existing scene values, their defaults, presets' static values, persistence identity, typography, hero iframe, wave placement, masks, and renderer/post-processing unchanged.
- Replace Motion and Light motion with Flow's four controls. Travel is 1 rib per loop; direction Toward; glow orbit defaults to zero to retain the authored lighting, with optional integer turns/radius controls. Old oscillation values no longer drive the renderer.
- Keep the existing standard playback timeline and saved duration. New/reset timelines use 12 seconds. Duration changes speed only. No keyframes or layers are added.
- Keep Three.js WebGL and the existing deformation/material/post-pass formulas. Before their wave/twist transform, move the rib center along the axis, resample its dome radius, and preserve its profile offsets. One guard rib closes finite ends. All depth/normal materials share the deformation. Timeline and Flow invalidate shadow/shade; geometry/environment/resources remain retained.
- Panel owns Flow edits; timeline owns transport; canvas navigation and mask handles retain their existing ownership. Camera remains authored and is not animated.

## Implementation

1. Add domain/flow.ts and renderer/rib-flow.ts; extend retained rib geometry attributes and rib-deformation.ts. Switch hero-canvas.tsx from evaluateHeroMotion to evaluateHeroFlow. Keep hero frame placement and iframe untouched.
2. Replace animation sections/acceptance/inventory/pipeline targets, remove obsolete character actions and preset motion writes, preserve all scene values. Update the animation default duration and describe Flow acceptance.
3. Add focused tests proving preservation of the authored scene at phase zero and monotonic travel for both directions; adapt geometry/schema expectations and browser scenario definitions.
4. Compare actual renderer samples before/after, include a small ordered sequence through the seam, document focused results in the worklog, and leave the app on 3005.
