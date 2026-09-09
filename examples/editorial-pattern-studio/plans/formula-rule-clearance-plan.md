# Formula-to-rule clearance plan

Verification tier: Tier 3
Reason: This corrects a custom SVG/Canvas editorial layout mismatch across multiple renderer templates and adds browser-observable geometry coverage.
Run: `npm run ai:check`; focused template geometry test; focused browser acceptance across all ten templates using the longest four-line equation; `npm run verify:quick`; `npm run verify:final` before production deployment.
Skip: Targeted performance is not required because the pass changes only static normalized text anchors and test metadata; text count, wrapping work, SVG primitive count, animation workload, viewport behavior, and export resolution are unchanged. Timeline, video, layers, and media remain inapplicable.

## Root cause

Equation copy always starts as two authored lines, but the shared 48-character wrapping rule expands Standing Wave, Vortex Ring, and Superformula to four rendered lines. Seven template baselines were positioned for shorter copy and leave less than 8px clearance—or directly intersect—their structural horizontal rule at the default 480×600 canvas.

## Implementation

1. Adjust only the equation `y` anchors in the seven affected entries in `src/app/editorial-templates.ts`, preserving their alignment, scale, weight, content, grid, and pattern composition.
2. Add a conservative unit assertion in `src/app/app-schema.test.ts` that derives the maximum wrapped equation line count from every equation option and requires at least 8px between each formula block and every intersecting horizontal editorial rule.
3. Mark construction-grid and editorial rules distinctly in `src/app/editorial-pattern-renderer.tsx` so browser coverage targets structural rules rather than intentionally faint grid lines.
4. Extend `e2e/app-controls.spec.ts` to select the four-line Superformula and inspect actual SVG formula/rule geometry for all ten template variants.
5. Update template acceptance language, the specification, and the worklog with the supplied screenshot, measured failures, corrected evidence, and verification results.

## Unchanged surfaces

- No schema control, persistence, panel action, timeline, layer, canvas-sizing, or export setting changes.
- SVG preview and Canvas export continue to consume the same normalized scene.
- Formula typography, wording, font sizes, weights, wrapping rules, and ink colors remain unchanged.
