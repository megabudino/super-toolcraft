# Hero Sphere Card Visibility Design

## Context

With the imported `hero-settings (1).json`, the Sphere gallery can briefly collapse to one visible row while vertically panning. The missing rows return after a small additional Pan movement.

The layout already includes vertical-cycle candidates whose card rectangle intersects the visible lens latitude band. It then applies a second center-only cutoff at `±85°`. In the reported state, two candidate cards span the visible band but have centers at approximately `-86.4°` and `88.8°`, so the center cutoff removes both complete rows.

## Goal

Keep every Sphere card in the draw list while any projected part of that card remains visible. Cards must leave naturally only after their complete projected geometry moves outside the visible lens or is clipped by the existing camera and backface rules.

## Non-goals

- Do not change card size, row count, `Row gap`, horizontal gap, Pan mapping, row speed, or row order.
- Do not compress or redistribute rows to fit the lens.
- Do not change lens geometry, dispersion behavior, protocol, Toolcraft controls, or persisted settings.
- Do not address the separate top/bottom blur seam in this change.

## Design

`getLimitedCycleRange` remains the coarse vertical candidate selector. Its existing half-card-height allowance intentionally retains a cycle when the card body intersects the visible latitude band even if its center is outside that band.

`layoutHeroSphereGallery` will stop discarding a candidate solely because `abs(phiCenter) > maximumLatitude`. Each candidate will instead proceed through the existing full-card viewport intersection test. The scene pass will continue to rely on the existing WebGL backface culling and homogeneous near-plane clipping for geometry crossing the lens silhouette or camera plane.

No new setting or rendering branch is introduced. The existing 96-card frame budget, nearest-card selection, depth ordering, texture cache, field pass, and post pass remain unchanged.

## Data Flow

1. Toolcraft sends the unchanged Sphere settings and Pan values through protocol v14.
2. The website derives row centers, panel period, and vertical cycle candidates exactly as today.
3. A cycle candidate remains eligible based on the full card extent rather than only its center latitude.
4. `cardIntersectsViewport` removes fully offscreen candidates.
5. The scene shader and WebGL culling clip geometry that has naturally crossed the visible surface.
6. Field and post passes process the resulting scene without new uniforms or settings.

## Verification

- Add a focused layout regression using the reported geometry: card height `610`, row gap `17`, three rows, lens height `410`, and Pan Y near `-0.676016`. The layout must retain visible candidates from all three row indices.
- Cover adjacent Pan positions around the former `±85°` center threshold to prove rows do not blink when the center crosses it.
- Preserve the existing card-count cap and deterministic depth ordering in unit assertions.
- Import the supplied JSON through the real Toolcraft UI and verify in the iframe that upper and lower cards remain continuously visible while moving through the failing Pan range.
- Compare a stable ordinary Pan position before and after the fix to confirm unchanged card geometry, spacing, and lens appearance.

## Performance And Risk

The fix can add scene draw calls only for cards that already intersect the visible lens but were incorrectly removed by the center cutoff. The global 96-card cap and viewport culling remain active, so the workload stays bounded. The focused browser check will also confirm that no fully offscreen vertical cycles remain in the draw list.

The main visual risk is exposing geometry behind the lens rim. Existing backface and near-plane clipping are the authority for that boundary; the browser regression must inspect the exact reported high-bend configuration before completion.
