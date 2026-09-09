# Gallery v8 Settings Defaults

Verification tier: Tier 3
Reason: The imported settings change schema/reset defaults and the initial WebGL backing resolution through `canvas.renderScale`, but do not change renderer code, media, controls, exports, or workload limits.
Run: Targeted product-contract unit coverage, the existing exact persistence/browser scenario, and a live inspection at the saved local URL.
Skip: Full unit, browser, and performance matrices; if the protected receipt requires prior pending performance evidence, do not run that benchmark under this request.

## Implementation

1. Update `src/app/app-schema.ts` so every applicable value in `image-gallery-settings.json` is the startup and section-reset default; keep the 14 default JPG assets unchanged and advance localStorage persistence to v8 so older saved values cannot shadow the new profile.
2. Extend `src/app/spiral-gallery-product.test.ts` with exact assertions for the imported default profile and v8 persistence identity.
3. Keep Flow-oriented browser fixtures explicit while updating the existing persistence scenario to prove the clean v8 startup is Deck at 2x with all fourteen default images.
4. Add the delivery decision and verification evidence to `docs/toolcraft/agent-worklog.md`.

## Behavior Boundaries

- Controls and sections: existing controls only; all imported product and runtime defaults apply, while source images remain the existing shuffled fourteen-card set.
- Renderer output: unchanged WebGL pipeline; it starts in Deck with the imported geometry, depth, physics, interaction, view, and 2x resolution-scale settings.
- Timeline/layers: remain disabled.
- Persistence/settings transfer: localStorage key/version moves to v8; built-in settings import/export remains unchanged.
- Export: transparent live/PNG background remains the default, background color remains `#D8D5CB`, and image export remains PNG at 4K.

## Verification

- Unit: `src/app/spiral-gallery-product.test.ts` proves the exact schema default-value map, presets, and persistence version.
- Browser: the existing persistence scenario proves the v8 settings remain editable and survive a real reload; a focused live inspection confirms Deck, 2x resolution scale, and all 14 presets on first load.
- Performance: no performance test or full audit; the pipeline and workload are unchanged, and the higher backing scale is an explicit imported user default within the existing supported 1–2 range.
