# Platform: every app in one deployment

Technical guide for Super Toolcraft. A single host (`platform/`, Next.js on Vercel) serves every client app (`apps/<slug>/`) at `/a/<slug>/`, behind an invite-only login, and groups the apps into workspaces.

```
apps/<slug>/        standalone Toolcraft app (one per project) + platform.json
platform/           Next.js: login, setup, invites, admin, protected /a/<slug>/ route
scripts/            new-app.mjs · build-all.mjs · platform-init.mjs
starter/, examples/ templates for new apps (from upstream Toolcraft): never edit
```

## First-time setup

1. `pnpm install`
2. `pnpm platform:init --turso <db-name>`. This needs the `turso` CLI, already logged in. Without the CLI, use `--url … --token …`. For local testing only, plain `pnpm platform:init` is enough.
   The script writes `platform/.env.local` (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`, a random `SETUP_TOKEN`) and applies the migrations.
3. Local test: `pnpm build:apps && pnpm dev`, then open `http://localhost:3100/setup?token=<SETUP_TOKEN>`.
4. Vercel:
   1. create a project from the GitHub repo with **Root Directory = `platform`**;
   2. add the three env vars;
   3. deploy. Every deploy runs the migrations and builds all the apps (see `platform/vercel.json`).
5. Open `https://<domain>/setup?token=<SETUP_TOKEN>` and create the admin. From then on `/setup` returns 404.

The `/setup-platform` skill walks through these steps.

## Adding an app for a client

Write a prompt in the repo, for example *"create an app for Acme that does X"*. The `/new-app` skill:
1. runs `pnpm new-app acme-x --workspace acme`;
2. builds the app in `apps/acme-x` following its `AGENTS.md`;
3. checks that it integrates with the platform and commits.

After the push and the deploy, the app shows up in the `acme` workspace, which is created if it does not exist. To give the client access: open the workspace → **Invite** → copy the link (or the ready-made message) and send it to them.

It also works by hand:
```bash
pnpm new-app <slug> --workspace <ws> --title "Title" [--template neon-globe]
pnpm install
cd apps/<slug> && pnpm dev
```

`apps/<slug>/platform.json`:
```json
{ "title": "Acme Configurator", "description": "…", "workspaces": ["acme"] }
```
Assignments declared here are synced on every deploy and locked in **Manage apps**. Assignments added from there are kept separately.

## Interface

The platform looks like the apps it hosts: same dark theme tokens (from `toolcraft/runtime/styles.css`), Inter, Phosphor icons, Base UI primitives and translucent floating panels on the dotted canvas.

- **Sidebar**: workspace switcher, the current workspace's Apps / Members / Settings, your other workspaces, and (for admins) People and Invite.
- **⌘K**: search apps, workspaces and actions from anywhere.
- **Apps**: cards with a generated cover; admins use **Manage apps** to toggle deployed apps for the workspace.
- **Invites**: a dialog that creates the link and copies it, alone or with a ready-to-send message.
- **Inside an app**: a small "Your apps" pill (top left, collapses to an icon) takes you back to the last workspace.
- The name in the UI comes from `NEXT_PUBLIC_PLATFORM_NAME` (default "Super Toolcraft").

## Access model

- **Admin**: sees and manages everything. The first admin comes from `/setup`, the others from an "admin" invite.
- **Member**: sees only the apps of the workspaces they belong to. One person can be in several workspaces: if they get a second invite, they sign in and are added to the new workspace.
- **Invites**: single-use links, valid for 7 days, revocable. They can be restricted to one email. Only the sha256 of the token is stored in the database.
- **Sessions**: httpOnly cookie that lasts 30 days and is renewed with use. Disabling a user ends their sessions immediately.
- **Login**: rate-limited per email+IP and per IP. Passwords are hashed with scrypt.

## Technical details

- Each app's build (`vite build --base /a/<slug>/`) goes into `platform/.app-builds/<slug>/`, outside `public/`. The `/a/[slug]/[[...path]]` route serves it only after checking the session and the workspace membership.
- All apps share one domain. The platform injects a shim into `index.html` that prefixes `localStorage`/`sessionStorage` keys and IndexedDB database names with `app:<slug>:`, so two apps never overwrite each other's data, even when they come from the same template.
- Each app has its own `pnpm-lock.yaml` (`sharedWorkspaceLockfile: false`), as the Toolcraft scripts expect.
- Apps stay on the Toolcraft version they were created with (`toolcraft.cliVersion` in the root `package.json` sets the version for new apps). To upgrade an app: `npx @pixel-point/toolcraft@<new> create /tmp/x --template apps/<slug> --name <slug> --yes --no-install --no-skills`, then compare and replace.
- Vercel limit: 250 MB per function. The `/a` route includes every build, so keep an eye on the size of `platform/.app-builds` as the number of apps grows.
- App data stays in the user's browser, as in Toolcraft: the platform protects access, it does not sync state.
