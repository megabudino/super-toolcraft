# Flat Bead Rendering Implementation Plan

1. Update `src/app/dot-ring-types.ts` and `src/app/dot-ring-drawing.ts` so frame geometry no longer carries shadow blur, the shared Canvas 2D drawing path never configures bead shadows, and opaque flat circles are batched by fill within each separated row.
2. Update `src/app/dot-ring-scene-bounds.ts` so Infinity bounds include bead radius but no removed shadow padding.
3. Update `src/app/app-acceptance-data.ts` to describe flat visible bead bounds.
4. Add a focused app-owned drawing test that fails if the renderer writes Canvas shadow properties.
5. Record the renderer, export, and verification decisions in `docs/toolcraft/agent-worklog.md`.
6. Run targeted checks, inspect the real app in a browser, verify the Infinity export, refresh selected proof receipts, and run the official delivery command.
