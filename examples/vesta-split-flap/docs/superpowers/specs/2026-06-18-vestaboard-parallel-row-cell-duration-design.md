# Vestaboard Parallel Row Cell Duration Design

## Goal

Phrase transform animation should run across all visible text rows at the same time, while individual cells use deterministic durations from a user-controlled range.

## Behavior

- Add a `Cell duration` double slider in `Board Message`.
- The slider controls the minimum and maximum percent of a per-cell animation step spent flickering before a cell disappears or settles.
- Each removable source cell receives a deterministic duration within that range using the existing animation seed.
- Every row advances through its own deletion sequence using the same timeline progress, so rows shrink in parallel instead of waiting for a global phrase-wide queue.
- Within a row, letters still disappear one by one. A letter flickers, disappears, then the shortened row re-centers on the same board row.
- Re-centering remains Vestaboard-like: destination cells whose letters change flicker before settling.
- Target characters that are not present in the source row are never added.

## Verification

Unit tests should prove two rows have both narrowed by the same playback progress and that changing `Cell duration` changes the intermediate phrase-cell output. Browser tests should exercise the new slider in the phrase animation workflow. Performance coverage should classify the slider as workload because it changes timeline frame generation.
