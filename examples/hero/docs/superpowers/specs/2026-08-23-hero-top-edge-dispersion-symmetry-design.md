# Hero Top-edge Dispersion Symmetry Design

## Problem

With the supplied Hero Sphere settings, dragging the gallery can create a hard horizontally duplicated strip when the lens effect reaches the top boundary. The equivalent transition at the bottom boundary does not show that defect. Static rendering is already acceptable.

The fix must not weaken, disable, or otherwise change the gallery motion response.

## Required behavior

- Keep the current Pan motion, Motion boost, row motion, smoothing, and decay unchanged.
- Keep the current Blur, Dispersion, Aura, Boundary Aura, and side-zone appearance unchanged.
- Keep the accepted bottom-boundary transition unchanged.
- Make the top-boundary transition the geometric mirror of the bottom-boundary transition.
- Remove the top-only directional displacement that appears as a duplicated horizontal strip during drag.
- Preserve card size, lens geometry, row spacing, and the scene -> field -> post pipeline.

## Design

The post shader will evaluate top and bottom treatment in one shared local vertical frame. The bottom path remains the reference implementation. Top samples use the same radius, blur distribution, dispersion weights, motion magnitude, and transition envelope, with only the vertical orientation mirrored when converting the local offset back to screen space.

No top-only additive translation may be applied after that mirrored conversion. Motion velocity remains an input to the shared treatment and is not reduced, clamped differently, or removed.

The change stays inside the existing post shader and its focused tests. It adds no render target, ownership texture, draw pass, sample loop, or Toolcraft setting.

## Alternatives considered

1. **Mirror the accepted bottom path for the top boundary (selected).** Smallest change, preserves motion and the accepted bottom appearance.
2. **Remove motion displacement from all blur samples.** Rejected because it changes the intended drag behavior and the bottom path is already correct.
3. **Add row/card ownership masking.** Rejected for this defect because it adds a render resource and changes cross-boundary sampling globally instead of correcting the asymmetric top treatment.

## Verification

- Add a focused shader regression proving top and bottom use the same local treatment and differ only by vertical orientation.
- Reproduce with `/Users/kusnizza/Downloads/hero-settings (2).json` through the real Toolcraft iframe.
- Capture multiple frames during an actual drag, not only the settled state.
- Confirm the top transition has no hard duplicated strip.
- Confirm the bottom transition and side effect remain visually unchanged.
- Confirm the same Motion boost still produces visible drag distortion.
- Run only focused shader tests and a focused browser check; no broad performance or build suite is required.

## Scope

Only the Sphere post-pass top/bottom symmetry is in scope. Rows mode, controls, protocol, persistence, layout density, and unrelated Hero styling are unchanged.
