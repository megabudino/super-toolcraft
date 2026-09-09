# Fold Studio logo in Toolcraft

The user clarified that the supplied `/Users/kusnizza/Desktop/covers/logo.svg`
belongs in this Toolcraft app, not the separate Percents website. The mistaken
header/footer changes in `percents-next` have been reversed.

Later focused edit: replace the native hero foreground's LOOPLANE logo with the
exact supplied Fold Studio SVG, retain its proportions at 32px high, and label
its existing link Fold Studio. Use a local CSS module and an app-owned asset.
The prior letter-specific logo morph is tied to the obsolete artwork; display
the supplied complete logo at rest and while scrolling. No scene, control,
timeline, persistence, export, or GPU changes are needed. Static SVG presentation
has fixed resource cost and adds no animation workload.

Files: `src/section/components/header-logo.tsx`, its adjacent CSS module,
`src/section/config/website-config.ts`, `src/section/assets/fold-studio-logo.svg`,
and `docs/toolcraft/agent-worklog.md`.

Preflight: generated app; renderer/canvas output route limited to static SVG
branding. Read workflow, runtime boundary, core performance, renderer technique,
performance and acceptance testing. Use the Toolcraft writing-plans workflow.

Verification: existing focused hero content and composition tests, then inspect
the actual app on port 3005 for the Fold Studio image and accessible name.
Skip aggregate tests, build and performance measurement, per the user's request
for minimal checks. Restore no unrelated changes and leave scene settings alone.
