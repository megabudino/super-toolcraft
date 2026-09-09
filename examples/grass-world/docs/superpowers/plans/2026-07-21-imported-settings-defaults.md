# Imported Grass Studio defaults implementation plan

1. Replace every compatible product default in `src/app/grass/grass-defaults.ts` with the values from `/Users/kusnizza/Downloads/grass-studio-settings.json`, including camera, environment, Sun Patches, Lawn, Tall Grass, scan families, and background.
2. Keep the already matching 1920×1080 canvas, 16:9 aspect ratio, render scale 2, six-second timeline, export settings, and null custom HDRI behavior. Exclude the transient exported playhead time.
3. Advance `src/app/app-schema.ts` persistence key/version to v7 so the imported reset scene is not hidden by prior v6 local state.
4. Update performance impact ownership for the default values because the reset instance counts change existing layout, scan, render, and export workloads without changing maxima.
5. Align product and authored browser expectation sources with the new reset values, including realistic preset, persistence identity, HDRI source, scan counts, lawn gradient, camera reset, and Static layout counts.
6. Update `docs/toolcraft/agent-worklog.md` with the source file, mapping decisions, persistence change, workload impact, and explicit skipped verification. Do not run automated checks or `verify:delivery`; leave the existing development server available.
