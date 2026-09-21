---
name: new-app
description: Create a new client app in this platform from a prompt (e.g. "create an app for Acme that does X", "new app for client Y from the neon-globe template", or the same in Italian). Scaffolds apps/<slug> with the pinned Toolcraft CLI, assigns it to a workspace, builds the product following the app's AGENTS.md, verifies it integrates with the platform and commits.
---

# New client app

## 1. Work out the parameters

From the request, derive — ask only if something essential is truly ambiguous:

- **slug**: lowercase, digits, dashes, unique under `apps/` (e.g. `acme-configurator`). Check `ls apps`.
- **workspace**: the client's workspace slug (e.g. `acme`). Reuse an existing one if the client already has apps: `grep -h workspaces -A3 apps/*/platform.json`.
- **template**: `starter` (default, neutral app) or an example from `examples/` when the request resembles it (`ls examples`). An existing `apps/<slug>` can also be a template.
- **title** / **description**: human-readable, shown on the dashboard.

## 2. Scaffold

```bash
pnpm new-app <slug> --workspace <workspace> --title "<Title>" --description "<one line>" [--template <example>]
pnpm install
```

Never copy `starter/` manually (protected files are signed; only the CLI produces a valid app).

## 3. Build the product

```bash
cd apps/<slug>
```

Now you are inside a standalone Toolcraft app: **read `AGENTS.md` and follow it exactly** (preflight, `docs/toolcraft/workflow.md`, edit surface, protected files, verification tiers). Develop the requested product there. Use `pnpm dev` inside the app to try it.

Known upstream issue (Toolcraft CLI 0.0.26): 3 tests in `pnpm test` also fail in a pristine generated app (`two compatible targeted iterations…`, `CLI accepts direct and documented pnpm enable forms…`, `Infinity mode recipe accepts exact restored dormant…`). Don't try to fix them; report any other failure.

## 4. Check platform integration

From the repo root:

```bash
pnpm build:apps --only <slug>
```

It must succeed and `platform/.app-builds/<slug>/index.html` must reference `/a/<slug>/assets/…`. Optionally run the platform (`pnpm dev`) and open `/a/<slug>` as admin.

## 5. Commit

Commit `apps/<slug>` (including its `pnpm-lock.yaml` and `platform.json`) on the current branch. Don't push unless the user asks: a push to `main` deploys.

## 6. Tell the user

- the URL path (`/a/<slug>`) and the workspace it was assigned to;
- that after deploy they only need to open the workspace `/w/<workspace>` → **Invite** to give the client access (if the client isn't already a member).
