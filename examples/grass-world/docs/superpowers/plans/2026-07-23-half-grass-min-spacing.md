# Halve Tall and Lawn minimum spacing

Status: Complete

Verification tier: Tier 3

Reason: Two existing schema defaults and lower bounds change deterministic Tall/Lawn layout density, but no renderer pass, workload ceiling, persistence model, export path, timeline, layer, or resource lifecycle changes.

Implementation:

1. Change Tall minimum/default spacing from `0.04 m` to `0.02 m`.
2. Change Lawn minimum/default spacing from `0.015 m` to `0.0075 m` and its step to `0.0025 m`.
3. Update the focused coverage-policy fixture to prove both advertised minima still reach their bounded requested counts.

Verification: Run only the focused coverage-policy test and TypeScript. Skip browser, performance, build, and protected delivery by explicit user request for no strong or long checks.

Result: Focused coverage policy passes 2/2 and TypeScript passes.
