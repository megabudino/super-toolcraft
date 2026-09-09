# Hero Scene Lab verification note

Verification tier: Tier 4
Reason: First product delivery adds an external iframe renderer bridge, product schema, website scene implementation, persistence, and browser acceptance.
Run: Focused type and product tests, both repository builds, live browser checks for the bridge and controls, then the single protected first-delivery gate.
Skip: Measured performance and the complete maximum-fixture audit because neither was requested.

## Supplied portrait update

Verification tier: Tier 3
Reason: This later edit changes the website-owned card renderer assets and card geometry inside the Toolcraft iframe without changing schema, messaging, controls, or runtime state.
Run: Website formatting, lint, type, architecture, unit, and production build checks; one focused Toolcraft browser scenario proving all eight supplied assets load across ten cards at the native 7:9 ratio; one live visual check.
Skip: The aggregate Toolcraft delivery gate, export matrices, and measured performance because the initial receipt already exists and this is ordinary focused renderer work.
