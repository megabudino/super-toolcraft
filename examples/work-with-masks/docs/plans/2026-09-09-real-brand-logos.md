# Restore real brand logos

Request: «логотипы сделай реальных брендов и цветные как были примерно».

Restore the exact 24 real-brand SVGs and their original order from the previous native-hero backup. Keep the Looplane header, rewritten copy, shopping video, grid dimensions, rotation and all editor controls unchanged. Preserve intrinsic brand colors; no recoloring or monochrome filter. This is demo/reference content, not evidence of a commercial relationship.

Change `src/section/components/pages/home/hero-content.ts`, the local public asset set and provenance manifest; retire only the 24 unused concept SVGs to a recoverable backup. Align the content unit test, native-hero browser assertion, README, media credits and acceptance description. No schema, runtime, layers, timeline, export or persistence change.

Verification tier: Tier 3, later focused media replacement.
Run: content and exact-asset unit tests, one `hero.native-section` browser case and embedded visual inspection. Build once only to refresh the production-preview bundle used by that focused case.
Skip: full tests, delivery, performance, controls/reload/export matrices and separate typecheck; their behavior is unchanged.

Preflight: generated app; media route. Plan: workflow, setup-export, media-upload. Implementation: schema-reference, component-rules. Verification: acceptance-testing, performance. Skills: local brainstorming, writing-plans, browser.

Completed: 24 exact source SVGs restored and manifest updated; retired concepts preserved in `/Users/kusnizza/.Trash/percent-hero-concept-logos.QxjsHz`. Three focused unit tests, build, and one `hero.native-section` browser case passed. Colored logos visually checked in the existing embedded preview on port 3005. Other content and editor behavior were not changed.
