# Color-phase continuity fix

Verification tier: Tier 3
Reason: The fix changes the custom renderer's cross-equation morph completion handoff and the full-detail curve ordering used by color segmentation.
Run: `npm run verify:quick`; focused morph unit tests; focused browser acceptance for near-end-to-final segment positions; existing morph-frame performance scenario; `npm run verify:final` before production deployment.
Skip: Media, layers, timeline, and video checks remain inapplicable because this is a static single-scene poster with transient input feedback.

## Root cause

Cross-equation morphs phase-align and may reverse the target closed loop to minimize geometry travel. During the final frame, the renderer currently replaces that aligned 1,200-point loop with the canonical full-detail equation sample. The closed geometry looks equivalent, but normalized color-segment fractions now begin at a different phase or winding, causing an instantaneous color-position jump. Keeping the arbitrary alignment after completion would make preview and stateless export disagree, so the transition must retain canonical equation parameter order throughout.

## Implementation

1. Refactor `src/app/pattern-morphing.ts` so every transient target uses the equation's canonical shared `t = 0…2π` order instead of a rotated/reversed topology alignment.
2. Keep transient and full-detail target samples in the same parameter order so normalized color-segment fractions have identical spatial anchors at completion and in export.
3. Add a unit regression proving a shifted/reversed target is not silently reordered and retains identical normalized anchors when refined from transient to full detail.
4. Strengthen `e2e/app-controls.spec.ts` to compare segment start positions immediately before and after morph completion, not only color-index arrays and RGB values.
5. Update the product spec, acceptance language, renderer pipeline/worklog evidence, then run targeted animation and release verification.

## Unchanged surfaces

- No schema controls, persistence keys, panel actions, timeline, layers, or export settings change.
- SVG preview and Canvas export continue to share the same final equation and segmentation settings.
- Reduced-motion behavior still presents the final target immediately.
