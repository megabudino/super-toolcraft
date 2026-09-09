# Hero Heading Native Selection Design

## Request

Disable native selection for the hero heading text, the V4 badge, and the CTA button. The restriction is permanent, not limited to an active canvas drag.

## Design

The existing shared heading-group container will own the behavior through inherited `user-select: none`. This single boundary covers the badge label, both heading lines, and CTA label without duplicating selection rules across descendants.

The change will not alter pointer events, link navigation, keyboard focus, focus styling, or the gallery Pan interaction. The announcement ticker and the rest of the page remain outside this boundary.

## Implementation Surface

- Add the existing Tailwind `select-none` utility to the shared heading-group container in `recraft-v4-styles/src/components/pages/home/hero-v4-styles.tsx`.
- Do not add document-global styles or drag lifecycle state.
- Do not change the Toolcraft canvas handle or preview protocol.

## Verification Scope

Per the user's explicit request, no automated or manual verification commands will be run for this change. The handoff will state this unverified boundary.
