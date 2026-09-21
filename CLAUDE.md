# Super Toolcraft

**One deployment that hosts every client app**, behind invite-only auth with workspaces. It started as a fork of `pixel-point/toolcraft` (remote `upstream`) but is its own project now and is never merged back: only `starter/` and `examples/` still come from upstream.

## Repo map

| Path | Owner | Notes |
|---|---|---|
| `starter/`, `examples/*` | upstream (Toolcraft CLI syncs) | **Never edit.** They are templates for new apps and get rewritten by `chore: sync Toolcraft CLI …` commits. |
| `apps/<slug>/` | us | One Toolcraft app per client project. Standalone Vite app + `platform.json`. |
| `platform/` | us | Next.js host: auth (Turso/libSQL + Drizzle), workspaces, admin, serves app builds at `/a/<slug>/`. |
| `scripts/` (root) | us | `new-app.mjs`, `build-all.mjs`, `platform-init.mjs`, shared `platform-lib.mjs`. |
| `README.md`, `PLATFORM.md` | us | Product overview and technical guide. They describe this project, not Toolcraft. |
| `LICENSE.md`, `NOTICE.md` | us | Keep both copyright lines (Pixel Point and Davide Ruggeri) and never remove `LICENSE.md`/`NOTICE.md` from apps. |

## Creating a client app

Use the `/new-app` skill (`.claude/skills/new-app/SKILL.md`). A request like "create an app for Acme that does X" means: scaffold with `pnpm new-app`, build the product inside `apps/<slug>`, verify, commit.

Never scaffold by copying `starter/` by hand: `src/app/app-identity.ts` and other files are hash-protected by the signed manifest in `src/toolcraft/.toolcraft-manifest.json`; only the pinned Toolcraft CLI (invoked by `scripts/new-app.mjs`, version in root `package.json` → `toolcraft.cliVersion`) produces a valid app.

## Working inside an app

- `cd apps/<slug>` and follow **that app's `AGENTS.md`** (read it and `docs/toolcraft/workflow.md` before editing). Its rules on protected files, verification tiers and product-owned files all apply.
- Dev server: `pnpm dev` inside the app (standalone, as upstream intends). The platform is not needed to develop an app.
- `apps/<slug>/platform.json` is ours: `{ "title", "description", "workspaces": ["<workspace-slug>"] }`. Declared workspaces are created automatically and the app is assigned to them on the next deploy.
- Storage is namespaced per slug by the platform (`app:<slug>:` prefix injected into `index.html`), so apps never need to change persistence code.

## Platform

- Local: `pnpm install`, `pnpm platform:init` (writes `platform/.env.local`, runs migrations), `pnpm build:apps`, `pnpm dev` → http://localhost:3100.
- Tests: `pnpm test` (root script tests + `platform` vitest). Typecheck: `pnpm --filter platform typecheck`.
- Schema changes: edit `platform/db/schema.ts`, then `pnpm --filter platform db:generate --name <change>`; migrations run on every deploy.
- Auth code (`platform/lib/auth/**`, `platform/proxy.ts`, `platform/app/a/**`, `platform/app/setup/**`, `platform/app/invite/**`) is security-sensitive: change it only when explicitly asked, and keep the tests in `platform/tests/` passing.
- UI: keep it consistent with the Toolcraft apps. Tokens in `platform/app/globals.css` mirror `starter/src/toolcraft/runtime/styles.css` (dark theme); primitives in `platform/components/ui/` mirror `toolcraft/ui` (button variants, input, panel surface, dialog, menu, switch). Reuse them instead of new styles; don't import from `apps/` or `starter/`.
- There is intentionally **no sign-up route**. Accounts come from `/setup` (first admin, needs `SETUP_TOKEN`) or invite links created from a workspace (**Invite**) or from **People**.

## Git

- Work on a branch; the user pushes/deploys (a push to `main` deploys to Vercel).
- Upstream sync (optional, only to refresh the templates): `git fetch upstream && git merge upstream/main`. Take theirs for `starter/` and `examples/`; keep ours for everything else (`README.md`, root files, `platform/`, `apps/`, `scripts/`).
