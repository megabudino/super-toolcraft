# Hard Sun HDRI implementation plan

1. Add the official Poly Haven 1K HDR and 320×240 preview under `src/app/grass/assets/hdri`, verify the published MD5, and register `hardSun` in `grass-hdri.ts`.
2. Extend the environment preset value domain, set the v6 reset preset/rotation/intensity, and advance persistence in `app-schema.ts`.
3. Add one typed preset-lighting tuning helper and apply its fill/key/ambient/rim/exposure/stylized multipliers in `grass-scene.ts` and `grass-material.ts`; add bounded custom depth for Tall Grass and the ground without changing pipeline passes or workload limits.
4. Update unit and browser expectations for the seventh preset and add hard-sun decode/contrast assertions.
5. Keep `app-performance-impact.json` and `docs/toolcraft/agent-worklog.md` aligned with the renderer and lighting changes.
6. Run focused Vitest, typecheck, AI/code-health, the exact HDRI/PBR Playwright scenario, controlled browser inspection, one `npm run verify:delivery`, and confirm `npm run dev`.
