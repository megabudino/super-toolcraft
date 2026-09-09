# Random Template Tier Design

## Goal

Open the Template Library on the Mega tab by default and let users choose which template tiers participate in seeded random composition generation.

## Product Behavior

- The Template Library initially shows `Mega`.
- The Composition section exposes one built-in segmented control with `Simple`, `Mega`, and `Both`.
- `Both` is the default so a new poster can draw from the complete visual language.
- The setting affects generated elements only. Manually clicking or dragging a library tile still inserts exactly that selected template.
- `Simple` uses the current Kit-filtered simple pool.
- `Mega` uses the complete Mega pool; Kit does not empty or narrow this tier because the current Mega catalog has no kit taxonomy.
- `Both` combines the current Kit-filtered simple pool with the complete Mega pool.
- Selection remains deterministic for the same seed, count, kit, and tier mode.

## Architecture

- Store the choice in Toolcraft runtime state at `composition.templateTier`.
- Parse and validate the target in `poster-model.ts`.
- Build the eligible pool before deterministic template selection.
- Keep renderer primitives, export, manual placement, and canvas interactions unchanged.
- Model the tier as a finite workload dimension because Mega templates emit denser SVG grammars than Simple templates. The existing poster and export passes consume element count multiplied by tier weight.

## Alternatives Rejected

- Filtering Mega through the existing Kit membership: several kits contain no Mega templates and would create an empty generator pool.
- Building a custom multi-checkbox control: the three mutually exclusive modes fit the built-in segmented control exactly.
- Coupling the library tab to the random filter: browsing and random-generation scope are separate operations and should not overwrite each other.

## Verification

- Schema test proves the new default and segmented options.
- Generator test proves `Simple` emits only simple templates, `Mega` emits only Mega templates, and `Both` emits both tiers deterministically.
- Focused browser test proves the library opens on Mega and the random tier control is reachable.
- This is a Tier 3 renderer-workload change because the selected tier changes generated primitive density. Run only the affected poster-scene and export paths; full performance certification is not required.
