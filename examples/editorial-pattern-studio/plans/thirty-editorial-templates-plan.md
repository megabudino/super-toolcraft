# Thirty Editorial Templates Implementation Plan

Verification tier: Tier 4
Reason: The template library expands from 10 to 30 authored scenes, broadening the schema option universe, renderer text/grid workload, browser acceptance matrix, and production content surface.
Run: `npm run ai:check`; focused template/schema tests; `npm run verify:quick`; the thirty-template browser acceptance test with formula-rule clearance; targeted Template workload measurement at the new 25-element hard limit; isolated poster contact-sheet visual QA; `npm run verify:final`; production deployment and public browser verification.
Skip: The full performance checkpoint is not required for this post-first-working feature expansion because the user requested more content and layout variety rather than performance optimization. Timeline, video, layers, and media remain unchanged and intentionally absent.

1. Extend `src/app/editorial-templates.ts` with the 20 new template ids, a finite multi-grid column type, and a combined core/additional template export. Keep the existing ten definitions unchanged.
2. Add `src/app/additional-editorial-templates.ts` with twenty original Geist scenes. Give every scene unique authored copy, a distinct six-role composition, zero-to-nineteen template-owned annotations, varied 6/8/10/12/16-column grids, reference-derived frame/running-header/band/register systems, safe formula anchors, and bottom-cropped pattern placement.
3. Update `src/app/app-schema.ts`, `src/app/app-acceptance.ts`, `src/app/app-performance.ts`, and `specs/editorial-pattern-spec.md` so the Template select, product language, acceptance option coverage, and densest workload all describe the 30-template system.
4. Expand `src/app/app-schema.test.ts` and `e2e/app-controls.spec.ts` to prove all thirty options, unique content, varied grid definitions, six-to-twenty-five element scenes, rendered template selection, and four-line formula clearance across every variant.
5. Update `docs/toolcraft/agent-worklog.md` with the five supplied reference images, layout decisions, state/output mapping, verification evidence, and skipped full-performance rationale.
6. Run the required gates, inspect all thirty isolated posters in a browser contact sheet, measure the new densest template through the real control, then deploy and verify the stable Vercel URL.
