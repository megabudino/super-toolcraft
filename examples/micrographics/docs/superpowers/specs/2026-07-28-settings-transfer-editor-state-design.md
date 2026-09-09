# Settings Transfer Editor State Design

## Problem

Toolcraft Settings Transfer currently exports only value targets owned by visible
schema controls. Micrographics canvas editing writes the authored poster to
`composition.layout`, which is a product-owned runtime value rather than a
panel control. Export therefore omits manual positions, sizes, inserted
templates, edited text, per-element colors, and deletions. Persistence filters
the same target on reload.

The supplied `micrographics-settings.json` proves the failure: all ordinary
controls are present, while `composition.layout` is absent. An isolated browser
reproduction confirmed that Import Settings restores the included controls
exactly but a new export after dragging an element still omits the layout.

## Chosen Design

Extend the shared Toolcraft schema with explicit additional value-target
allowlists:

- `settingsTransfer.additionalValueTargets`
- `persistence.additionalValueTargets`

The runtime unions these allowlists with its existing control/default targets.
Settings export includes the allowed values, settings import accepts them, and
localStorage persistence writes and reads them. Unknown undeclared targets
remain excluded.

Micrographics declares `composition.layout` in both lists. The canvas continues
to own direct editing and continues writing through `controls.setValue`; no
hidden control, duplicate Project panel, or app-local settings implementation
is introduced.

## Alternatives Rejected

- A hidden fake control for `composition.layout`: it would evade the runtime
  boundary and acceptance model.
- An app-owned Export/Import Settings UI: runtime Setup is the mandatory owner.
- Exporting every entry in `state.values`: this could leak transient,
  runtime-only, or unrelated targets and would weaken import validation.
- Storing layout inside `library.template`: it would conflate template arming
  with authored poster state and complicate the custom control value model.

## Data Flow

1. Canvas operations serialize authored elements to `composition.layout`.
2. Settings Transfer resolves control targets plus declared additional targets.
3. Export writes the serialized layout into `values`.
4. Import dispatches the layout through the existing command/history path.
5. The poster parser validates and renders the restored composition.
6. Persistence retains the same declared target across reload.

Older settings files remain valid but cannot recover layout data they never
contained. A fresh export from a still-open authored poster will contain the
layout after this change.

## Delivery And Verification

Verification tier: Tier 4

Reason: The fix changes shared runtime schema, persistence, settings transfer,
starter documentation, CLI-generated framework output, and the standalone app.

Targeted development proof:

- shared runtime unit test for additional settings-transfer targets;
- shared runtime persistence round-trip test;
- runtime/starter typecheck;
- generated-app browser test that exports a moved composition, mutates it,
  imports the file, and observes the exact layout restored.

Delivery proof:

- monorepo runtime/starter/CLI checks required for the touched architecture;
- regenerate the protected standalone framework into a fresh folder, sync the
  generated framework-owned files, and preserve product-owned source;
- one protected Tier 4 `verify:delivery` in Micrographics;
- confirm the saved development URL serves the regenerated app.

The complete operator-only performance audit is skipped because the renderer
workload and interaction cost do not change.
