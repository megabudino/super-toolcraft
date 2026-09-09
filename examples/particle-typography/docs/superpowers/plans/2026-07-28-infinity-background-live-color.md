# Infinity Background Live Color Implementation Plan

1. Add a failing shared-runtime unit case for an Infinity background stored as `{ hex }`, then make the background resolver accept both supported color value shapes.
2. Add a failing Setup normalization assertion that the runtime-owned Background switch has no description/help affordance, then strip the source description during normalization.
3. Add a failing Dots renderer equality case proving background-only live changes are ignored in Infinity mode but still invalidate finite rendering and all other product changes.
4. Implement the narrow Dots equality rule without changing output quality, render scale, finite preview background, scene bounds, timeline animation, or export behavior.
5. Refresh the signed Toolcraft platform in Dots Animation from the monorepo instead of editing `src/toolcraft` manually.
6. Update the verification impact inventory and product worklog with the exact performance complaint and affected canonical path.
7. Run targeted unit/browser checks, then one bare protected delivery, restart the saved app port, and verify the real visible canvas and live color interaction.

