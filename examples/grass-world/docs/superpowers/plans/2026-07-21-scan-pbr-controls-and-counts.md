# Scan PBR Controls And Count Limits Implementation Plan

Verification tier: Tier 3
Reason: Adds schema-backed PBR controls, changes retained material output and foliage shader work, and raises five existing workload boundaries to 1000.
Run: static contract audit and running-server transformed-module checks.
Skip: automated unit/type/build/browser/performance/delivery suites by the user's standing request; localhost visual browsing remains blocked by browser policy.

1. Extend `grass-defaults.ts`, `grass-values.ts`, and `grass-scan-contract.ts` with shared per-scan PBR settings and 1000-instance limits for the five repeatable scan families. Preserve existing default counts and persistence namespace.
2. Extend `grass-scan-controls.ts` with built-in Tint, Brightness, Roughness, Normal, AO, plant Sheen, and plant Backlight controls beside existing Contrast/Saturation, with semantic groups and conditional visibility.
3. Add a focused foliage-backlight material helper and update `grass-scan-resource.ts` so retained family/Boulder materials consume every setting without reallocating geometry or textures.
4. Add every new target to render-only invalidation, control-section inventory, acceptance rows, product-readiness wording, and performance-impact ownership. Keep Count mapped to the existing five workload dimensions, now reading 1000 from schema.
5. Update renderer pipeline/runtime id and performance wording for the 5000-instance maximum while preserving existing paths, fixture adapters, timeline, layers, persistence, exports, and pass structure.
6. Update product-owned expectation sources and `agent-worklog.md`. Do not modify protected Toolcraft runtime or framework-owned tests.
7. Verify all new targets have defaults, built-in controls, bounded settings, retained renderer consumers, acceptance ownership, and impact mappings; fetch changed modules from the running Vite server and confirm the Grass app marker.
