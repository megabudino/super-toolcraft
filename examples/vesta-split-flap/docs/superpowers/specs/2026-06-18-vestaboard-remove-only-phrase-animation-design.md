# Vestaboard Remove-Only Phrase Animation Design

## Goal

Keep phrase transformation strictly subtractive. During playback the source phrase must never grow, and the renderer must never reveal target characters that were not already present in the source phrase.

## Behavior

- At progress `0`, the board shows the source phrase exactly as entered.
- At progress `1`, the board shows the target phrase only when it can be produced by deleting characters from the source phrase, then normalizing repeated spaces.
- If the target contains characters that cannot be matched in source order, those characters are ignored instead of being appended or revealed.
- Intermediate frames animate only source indices that are known to be removed. A removable letter flips first, then disappears.
- After each disappearance, the phrase narrows and re-centers on the same board row. The row does not jump to a different line.
- Re-centering is also expressed as Vestaboard cell animation: cells whose visible letters change because the phrase moved show deterministic flicker before settling.
- The visible phrase length is monotonic non-increasing across playback frames.
- Empty target text keeps the source phrase unchanged.

## Implementation

Use the existing source-to-target greedy assignment as the source of truth for kept source indices. Divide playback progress into one deletion step per removable source index. In each step, flicker the active source character, remove it, rebuild the shortened phrase, and compare the previous and next centered cell maps. Any next-map cell whose character differs from the previous map flickers before settling. At progress `1`, normalize the remove-only result so repeated spaces collapse.

## Verification

Add unit coverage for a target that contains extra characters not present in source and assert every sampled frame is no longer than the previous sampled frame. Add model coverage that a narrowed phrase stays on the same row while its columns move inward after deletion. Update browser phrase animation coverage with a target containing an extra suffix and assert the end frame remains the remove-only phrase.
