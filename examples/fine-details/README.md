# Recraft Playground

Standalone native Toolcraft app. The original section renders directly from `src/section`; no iframe or Next.js server is used.

```sh
npm ci
TOOLCRAFT_PORT=3202 npm run dev
```

Build: `npm run build -- --base /demos/fine-details/`. Node.js 22 was used for verification. Images and fonts are local under `public`.

The native adapter connects the existing controls and media repository to the unchanged section settings. Trail, Loading, Carousel, prompt drag/flight, style controls and responsive layouts are retained. Canvas dimensions determine breakpoints; editor zoom does not change layout or drag distances.

Settings persist locally through Toolcraft. Apply has been removed; Reset restores local controls/default media and resets Prompt Flight without writing to the original website. No Toolcraft artifact export is included; JSON settings transfer and original section links remain. This preserves the existing section preview, not a new image-generation backend.

See `docs/toolcraft/agent-worklog.md` for verification and `docs/reference/source-manifest.json` for source provenance. Production build and focused checks pass; the protected complete delivery gate is blocked by inherited signed-template drift. No validator or signature was bypassed.

## Hosting

Vercel installs with `npm ci` and builds into root `dist` using the actual `/demos/fine-details/` base. `vercel.json` maps base-prefixed assets, images, fonts and logo-mark.svg before the SPA fallback. No environment variables, scene build, source checkout, settings-save API or running Recraft server is required. All supplied public assets are retained.
