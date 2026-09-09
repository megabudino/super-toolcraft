# Card Scale Range Plan

Verification tier: Tier 2

Reason: This later edit changes one existing control boundary and its website-side normalizer without changing the target, payload shape, renderer technique, section inventory, persistence, timeline, layers, or export behavior.

Implementation:

1. Keep `cards.scale` as the one canonical built-in continuous Slider so its numeric value label remains directly editable.
2. Raise the schema maximum and the website receiver clamp from 140% to 300%; preserve the 100% default and 60% minimum.
3. Change the focused product test to use 240%, above the old cap, and make the browser scenario enter `240` through the visible editable value label.
4. Run the exact mapping test, website typecheck, and `npm run test:feature -- cards.scale` once the local website preview is available.

Skip: aggregate delivery and measured performance checks because the initial product receipt already exists and this request changes no renderer workload model.
