# Donut Preset Surface and Infinity Canvas Plan

**Goal:** Make every curated donut preset open on the existing coloured
infinite canvas, give Classic Glazed a visibly fuller icing shell, and keep
sprinkles planted on the icing instead of overlap-relaxation lifting them into
the air.

**Verification tier:** Tier 3. The batch changes renderer geometry and canvas
mode. During development, run only the affected unit tests and focused browser
checks. At delivery, run one bare `pnpm verify:delivery`. Do not run measured
performance because this request contains no performance authority.

## Product decisions

- Preserve the current background color. Presets enable Background and Infinity
  canvas but do not overwrite `appearance.background`.
- Keep the runtime-owned initial/reset canvas behavior unchanged. The generated
  runtime has no schema field for a global initial Infinity mode; every curated
  preset explicitly enables Infinity while retaining the dormant finite output
  size for restoration and export.
- Give Classic Glazed the maximum authored coverage and a thicker icing shell;
  no other flavor geometry changes.
- Give every preset a zero sprinkle surface offset.
- Keep overlap relaxation tangential to the icing and re-project every moved
  sprinkle to its authored surface anchor. Remove the normal lift and permissive
  height clamp that created floating instances.

## Implementation

1. Extend preset tests to prove a shared background/infinity/surface contract,
   preserved background color, and the larger Classic Glazed shell.
2. Extend sprinkle-layout tests to prove relaxation introduces no positive
   normal displacement from the authored icing surface.
3. Update `donut-presets.ts` and `donut-sprinkle-layout.ts` with the smallest
   changes that satisfy those tests.
4. Run:
   `pnpm vitest run src/app/donut/donut-presets.test.ts
   src/app/donut/donut-sprinkle-layout.test.ts
   src/app/donut/donut-schema.test.ts src/app/app-schema.test.ts`.
5. Restart the saved development port with `pnpm dev:restart`, select all ten
   flavors in the running app, and verify Background/Infinity remain enabled,
   the color remains unchanged, Classic Glazed icing is fuller, and sprinkle
   presets have no floating layer.
6. Record the decision/evidence in `docs/toolcraft/agent-worklog.md`, read the
   verification-phase contract docs, then run one bare
   `pnpm verify:delivery`.
