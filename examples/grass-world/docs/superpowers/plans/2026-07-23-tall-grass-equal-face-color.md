# Tall Grass equal-face color

Status: Complete

Verification tier: Tier 3

Reason: One retained Tall Grass fragment-shader branch changes lighting-normal behavior in preview and export. Schema, controls, state, layouts, animation, workload dimensions, resources, draw calls, and Lawn geometry remain unchanged.

Root cause: Three.js `MeshPhysicalMaterial` flips the interpolated normal for `DoubleSide` back-facing fragments. Tall Grass therefore uses opposite PBR lighting on the reverse of the same ribbon even though its authored gradient and instance color are identical.

Implementation:

1. Give non-clump Tall Grass materials a dedicated shader define.
2. After the standard Three.js double-sided normal chunk, restore the original Tall Grass normal on back-facing fragments and keep `nonPerturbedNormal` aligned.
3. Leave Lawn clumps on their existing two-sided normal behavior.
4. Add focused shader-compilation proof that Tall receives equal-face normal handling and Lawn does not.
5. Record the renderer decision in the worklog.

Verification: By explicit user request, the focused Tall Grass material test passes 1/1 and TypeScript passes. Browser, build, performance, kernel, and protected delivery were skipped.
