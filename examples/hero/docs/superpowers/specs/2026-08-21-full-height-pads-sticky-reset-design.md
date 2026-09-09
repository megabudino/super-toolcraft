# Full-Height Hero Pads And Sticky Reset Design

## Goal

Make the Hero Heading and Prompt Vector pads cover the complete usable hero height while keeping each element fully visible. Put a product Reset action directly beside Apply and make it restore Toolcraft, the iframe, neighboring website tabs, and the tracked applied-settings source to the same defaults.

## Approved interaction

- The top of either Vector pad places the complete element at the top edge of the usable hero area.
- The bottom of either pad places the complete element at the bottom edge.
- Intermediate pad values interpolate continuously across the full usable height.
- The default heading position is top-center and the default prompt position is bottom-center.
- The sticky action row shows outline `Reset` on the left and primary `Apply` on the right.
- Sticky Reset and the existing Controls-header Reset both restore the same complete default state.

## Full-height positioning

Replace edge-anchored `±28vh` translations with normalized absolute placement inside the first hero grid row, excluding the ticker. Give the positioning layer the existing responsive horizontal and vertical insets.

For a canonical Vector `y` in `[-1, 1]`:

```text
positionPercent = (y + 1) * 50
```

Set the element's CSS `top` to `positionPercent%` and translate it upward by the same percentage of its own height. Therefore `-1` yields `top: 0; translateY(0)`, `0` centers the element, and `1` yields `top: 100%; translateY(-100%)`. This covers the full available height without clipping the element itself.

Keep the existing horizontal pad mapping, but combine its viewport offset with `translateX(-50%)` because both elements become absolutely positioned from `left: 50%`.

## Defaults and migration

Change the canonical heading default to `{ x: 0, y: -1 }` and prompt default to `{ x: 0, y: 1 }`. Mirror those values in website reset defaults and the initial tracked `hero-applied-settings.json`, preserving the current top/bottom standalone appearance under the new absolute coordinate mapping.

Toolcraft persistence may contain older values. They remain valid normalized coordinates and are not deleted; the new mapping simply gives them full-height semantics. Global Reset restores the new top/bottom defaults.

## Reset action flow

Add `website.reset` beside `website.apply` in the built-in sticky `panelActions` control. The panel handler:

1. marks the next tagged global-reset observation as already handled;
2. dispatches runtime `controls.reset` so Toolcraft resets through its canonical history path;
3. sends `HERO_PREVIEW_DEFAULTS` through the existing version-9 save request;
4. waits for the website acknowledgement and reports stable feedback on failure.

The suppression marker prevents the reset-history observer from issuing a duplicate website write for sticky Reset. The existing Controls-header Reset does not set the marker, so its history observation continues to persist defaults through the same bridge.

The website endpoint atomically rewrites `hero-applied-settings.json`, and the successful response updates the iframe and broadcasts the defaults to neighboring tabs. A reload therefore remains at defaults.

## Contract decision

The existing Toolcraft contract normally reserves global Reset for the Controls header and rejects a duplicate sticky Reset. The user's explicit requirement overrides that product-level choice for this app because the nearby action must communicate and execute a combined Toolcraft-plus-website reset. The runtime header remains available and preserves the same behavior.

## Error handling

Toolcraft still resets locally if the website is unavailable. A failed source write reports stable sticky-action feedback and leaves the last successfully applied JSON intact. Header Reset failures remain console-reported because the header has no product feedback surface.

## Verification boundary

Per the user's standing instruction for this app, do not run tests, browser checks, lint, typecheck, formatting, build, or delivery commands. Update the acceptance sources and hand the implementation off for local user evaluation.

