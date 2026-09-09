# Studio Room

Standalone native Toolcraft app. The original section renders directly from `src/section`; no iframe or Next.js server is used.

```sh
pnpm install --frozen-lockfile
TOOLCRAFT_PORT=3103 pnpm dev
```

Build: `pnpm build`. Node.js 22 was used for verification. Images and fonts are local under `public`.

Original room geometry, grids, tile media, shuffle, pointer parallax/trail, title and CTA are preserved. Settings update the native section directly. The canvas is the section viewport, including responsive layout and Motion scroll measurements; the Toolcraft page size and zoom do not alter section geometry.

Settings persist locally. Apply/Reset do not write to the original website. No artifact export is included; Export/Import Settings transfers JSON configuration only. Source outbound links retain their original targets.

See `docs/toolcraft/agent-worklog.md` for verification and `docs/reference/source-manifest.json` for source provenance. Production build and focused checks pass; the protected complete delivery gate is blocked by inherited signed-template drift. No validator or signature was bypassed.
