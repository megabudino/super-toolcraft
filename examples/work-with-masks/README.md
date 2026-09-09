# Work with Masks — Fold Studio hero in Toolcraft

The complete header and hero preview are local React components. The historic folder name is retained to preserve the existing workspace, but the application no longer uses an iframe, postMessage, Next.js, or another development server.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

For the standalone production bundle, run `pnpm build --base /demos/work-with-masks/`, then `pnpm preview --base /demos/work-with-masks/`. The port wrapper selects and reports an available local address.

## Source boundaries

- `src/section`: the actual Percents header, hero copy, partner-logo rotation, video reveal, local typography and narrowly required helpers.
- `src/section/reference`: local Image/Link adapters, isolated CSS and a canvas-sized viewport; no iframe or source-server connection.
- `src/app`: the existing Toolcraft controls, live wave, masks, presets, history and timeline. Typography/layout settings feed the local section directly.
- `public`: 24 real-brand SVGs in their original colors, one 1920×1080 JPEG95 opening-frame preview and two Latin font files. All 24 logos are used by the rotating grid. No videos, unused fictional wordmarks or other website sections are shipped.
- `docs/reference/native-hero-manifest.json`: original source paths, asset byte counts and hashes. Those paths are provenance only, not runtime dependencies.

Imported from `percent-hero-iframe-generator`, not the background-only `percent-hero` editor. Original projects are unchanged. The content is a fictional Fold Studio concept. [Media credits](docs/reference/hero-content-media.md) document the licensed footage used for the static first frame. The editable background wave retains its Toolcraft playback. Default section fonts and media are local; choosing an additional catalog font may load it from Google Fonts, as before. Artifact export is intentionally not included; settings import/export remain available.

The migration scripts document the one-time copy and mechanical adaptations. They are not build dependencies; do not rerun them over edited section source.
