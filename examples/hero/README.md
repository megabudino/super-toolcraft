# Recraft Hero

Standalone native Toolcraft app. The original Hero section renders directly from `src/section`; no iframe or Next.js server is used.

```sh
npm ci
TOOLCRAFT_PORT=3201 npm run dev
```

Build: `npm run build -- --base /demos/hero/`. Node.js 22 was used for verification. All required fonts/images and the original scene/shader code are local.

Sphere/Rows, drag, automatic motion, CRT/grain/dispersion, headings, ticker and mobile poster are retained. Canvas dimensions determine the section's responsive layout. Controls, media, history and workspace persistence remain Toolcraft-owned.

No image/video/SVG/snapshot export is mounted. Export/Import Settings remains JSON configuration transfer. Apply has been removed. Reset is local; the original website is not written. The original CTA anchor `#fine-details` is retained but its destination is outside this single-section app.

See `docs/reference/native-migration.md` and `docs/toolcraft/agent-worklog.md` for details. Build and focused browser checks pass; the protected complete delivery gate is blocked by inherited signed-file drift/legacy assumptions. Full-quality media is retained, so the initial bundle is large (about 37 MB before transfer compression). No performance certification is claimed.

## Hosting

Vercel installs with `npm ci` and builds into root `dist` using the actual `/demos/hero/` base. `vercel.json` maps base-prefixed assets, images, fonts and logo-mark.svg before the SPA fallback. No environment variables, scene build, source checkout, settings-save API or running Recraft server is required. All supplied public assets are retained.
