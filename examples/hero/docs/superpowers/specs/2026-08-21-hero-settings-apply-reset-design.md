# Hero Settings Apply And Reset Design

## Goal

Let the user tune the Recraft hero in Toolcraft, press `Apply`, and immediately inspect the same settings on the website in a neighboring local browser tab. Store the applied result in a tracked website source file so the user can later commit and push it. Make the existing Toolcraft `Reset` return both the editor controls and the website source configuration to one shared baseline.

## User workflow

1. Run the website development server at `http://localhost:3000` and Toolcraft locally.
2. Edit the existing hero controls while the iframe continues receiving live preview messages.
3. Press the new sticky `Apply` action.
4. Toolcraft waits for the website to validate and atomically write the current settings to a tracked JSON file.
5. The website iframe and any neighboring same-origin website tab update immediately.
6. The changed JSON file remains visible in Git for the user to commit later.
7. Pressing sticky `Reset` beside Apply returns Toolcraft values to schema defaults and persists those same defaults to the website JSON.
8. Pressing the existing global `Reset` in the Controls header produces the same durable reset through the history observer.

## Control ownership

Add one built-in sticky `panelActions` pair: outline `Reset` followed by primary `Apply`. The Toolcraft runtime also retains its global `Reset` button in the Controls header. The product-level Reset is an explicit user override of the normal no-duplicate-reset contract because it must sit beside Apply and communicate the combined Toolcraft-plus-website operation.

`Apply` is a panel-owned command with no canvas equivalent. Sticky `Reset` dispatches the runtime-owned global controls command and then persists the complete defaults. The bridge suppresses the matching history-observer write so this path performs one website request. Header Reset still uses the tagged reset-history observation. Manually returning values to defaults remains an ordinary edit and does not mutate the website source without Apply.

## Source of truth

Introduce a tracked `hero-applied-settings.json` beside the website hero settings module. Initialize it with the website's current standalone appearance so this feature does not visually change the site before the first action.

Separate two meanings that are currently combined:

- base defaults are the values Toolcraft schema reset restores;
- applied settings are the last locally published values stored in the JSON file.

The standalone website starts from normalized applied settings. The embedded iframe still replaces them with live Toolcraft values after the versioned preview handshake. Reset writes the base defaults into the applied-settings file, keeping the two products aligned after reset.

## Apply data flow

`Apply` panel action → current Toolcraft runtime values → normalized `HeroPreviewSettings` → version-9 iframe `save-settings` request with a unique request id → website preview boundary → same-origin `PUT /api/hero-settings` → bounded JSON parse and domain normalization → atomic temporary-file rename over `hero-applied-settings.json` → website response → same-origin `BroadcastChannel` update → iframe result message → Toolcraft action completion.

The Toolcraft action returns the real Promise so the runtime sticky-footer pending indicator remains authoritative. A failed request reports stable feedback and does not claim success.

## Reset data flow

Existing Controls-header `Reset` → runtime `controls.reset` → tagged reset-history generation advances → preview bridge issues version-9 `save-settings` with reset intent and the complete schema-default vector → the same website endpoint writes it → neighboring tabs update from the same-origin channel.

Sticky `Reset` → mark the matching history event as handled → dispatch runtime `controls.reset` → send the same defaults through one acknowledged save request → atomically rewrite the tracked JSON → update the iframe and neighboring tabs.

The bridge initializes its reset-generation observer from the mounted runtime state, so merely opening Toolcraft never resets an independently applied website configuration. It persists only a newly dispatched global Reset and ignores generation decreases caused by Undo.

## Website server boundary

Keep the App Router file as a route adapter and place write logic in a server-only hero-settings feature module. The route:

- accepts only `PUT`;
- runs only in `development` on a localhost/127.0.0.1 request host;
- rejects oversized request bodies before JSON parsing;
- validates and normalizes unknown input through a Zod boundary plus the canonical hero normalizer;
- writes only the fixed repository path for `hero-applied-settings.json`;
- uses write-then-rename so readers never observe a partial file;
- returns safe status codes and messages without filesystem details.

Production builds read the committed JSON but the mutation route refuses writes. No database, deployment mutation, or browser-local configuration is introduced.

## Client synchronization

The preview boundary listens for live settings and save requests only from its existing trusted Toolcraft parent origin. After a successful write it updates its own React state, broadcasts the normalized settings to other `localhost:3000` tabs, and posts a request-scoped success result to Toolcraft. Neighboring tabs listen to the same BroadcastChannel and update without using the channel as durable storage; reload durability comes from the tracked JSON import.

## Protocol and error handling

Bump both sides of `recraft.hero-scene` from version 8 to version 9. Add typed save request/result messages without changing the live `settings` message. Toolcraft rejects apply attempts when the iframe is not ready, times out abandoned requests, and settles all pending requests during unmount. Website failures return one safe message; Toolcraft surfaces it through panel-action feedback. Automatic reset persistence logs a failure without inventing a second product UI surface.

## Alternatives rejected

- Browser localStorage cannot be reviewed or committed and only affects one browser profile.
- Rewriting a TypeScript settings module would require code generation and risk malformed source; normalized JSON is deterministic and data-only.
- A production database or remote configuration service is unnecessary for the user's local-authoring-then-Git workflow.
- Removing the header Reset would require a runtime-shell fork; both surfaces therefore share the same canonical reset command while the sticky action adds website acknowledgement and feedback.
- Relying only on development HMR can delay or preserve client state; a same-origin broadcast makes the neighboring tab update explicit while JSON remains durable.

## Performance intent

This is ordinary product work. Live slider/control updates keep the existing preview-sync path. Only explicit Apply or an explicit global Reset performs one small JSON request and atomic file write. No workload dimension, renderer pass, animation lifecycle, shader work, or measured-performance authority is added.

## Verification boundary

This is a later Tier 3 cross-repository persistence and protocol feature. Per the user's standing instruction for this application, no automated checks, browser checks, lint, typecheck, formatting, build, or delivery command will be run; the feature will be handed off for local user evaluation.

## Risks

- Apply requires the website development server and its writable repository checkout.
- If the development server cannot write the source tree, Apply fails and leaves the previous JSON intact.
- Header-reset persistence cannot show sticky action progress and logs website failures; sticky Reset owns progress and stable panel feedback. Toolcraft still completes its local reset if the website is unavailable.
- The JSON file is intentionally modified source. The user must decide when to commit and push it.
