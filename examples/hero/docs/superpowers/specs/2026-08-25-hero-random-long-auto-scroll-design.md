# Hero Random Long Auto-Scroll Design

**Date:** 2026-08-25

## Goal

Make the Hero Sphere gallery occasionally perform a visibly long automatic glide in addition to its existing short automatic glides. The long movement should feel like part of the same motion system: smooth, interruptible, and paced by the existing Auto Scroll settings.

## Current Behavior

Each automatic glide currently:

- picks a horizontal distance between `0.10` and `0.45` gallery turns;
- picks another row using the shortest path around the repeating row stack;
- uses the configured Auto Scroll duration for the complete glide;
- yields to drag, reduced-motion, inactive-scene, and lifecycle cancellation behavior.

## Approved Behavior

Short glides remain unchanged.

A long glide:

- travels a random horizontal distance from `1.0` through `1.5` full gallery turns;
- chooses its horizontal direction independently and randomly;
- keeps the existing random vertical row target behavior;
- preserves the exact unwrapped horizontal target so multiple turns are rendered instead of being collapsed to the shortest periodic path.

Long glides do not occur independently on every timer tick. After each long glide, the scheduler randomly selects whether the next long glide occurs on the second or third subsequent automatic-glide trigger. This guarantees either one or two short glides between long glides, avoiding both long-glide clusters and arbitrarily long runs of only short glides.

The initial sequence follows the same rule: the first long glide is scheduled for the second or third automatic-glide trigger after initialization.

## Duration and Easing

The existing easing curve remains unchanged.

Short glides continue to use the configured Auto Scroll duration exactly. Long-glide duration scales linearly with horizontal distance relative to the current maximum short distance:

```text
effective duration = configured duration × long distance / 0.45
```

With the current `0.3 s` default, a `1.0–1.5` turn glide lasts approximately `0.67–1.0 s`. This retains the speed character of the longest existing short glide and avoids turning the new movement into a sudden jump.

## State and Lifecycle

The retained Hero renderer owns a small countdown for long-glide cadence. It consumes the existing injected random source so behavior remains deterministic in tests.

The countdown is reset when retained auto-scroll state is fully reset. Pausing, context loss, snapshot rendering, or a temporary drag interruption must not consume an automatic-glide slot. Starting an actual scheduled glide consumes one slot.

Existing behavior remains authoritative for:

- drag cancellation and later timer re-arming;
- reduced motion;
- inactive or disposed renderers;
- Auto Scroll enable/disable changes;
- row-count changes during or between glides.

No new Toolcraft controls or persisted settings are added. `Auto scroll`, `Interval`, and `Jump time` keep their current contract; `Jump time` remains the base duration used by the long-glide multiplier.

## Implementation Boundaries

The pure Sphere motion module will expose enough information to distinguish a short glide from a long glide and determine its effective duration. The retained WebGL renderer will own cadence selection and pass the selected glide kind into the pure target generator.

The change is limited to the Sphere gallery auto-scroll path. Manual drag, wheel/pan input, the Rows gallery, shaders, texture loading, and Toolcraft schema are out of scope.

## Verification

Focused deterministic tests will verify:

- long horizontal magnitude is bounded to `1.0–1.5` turns in both directions;
- long cadence is always every second or third automatic glide;
- short glides retain the existing `0.10–0.45` distance and configured duration;
- long duration follows the approved distance multiplier;
- row targeting, completion, cancellation, lifecycle timers, reduced motion, and injected-random determinism remain intact.

No broad repository or browser suite is required for this isolated motion change.
