# Super Toolcraft

One private place for every app you build for your clients.

Super Toolcraft hosts all your apps in a **single deployment**, behind an **invite-only login**, organized in **workspaces**. Each client sees only their own apps. Adding a new app is a prompt to your AI agent and a push: no new project, no new deploy, no new domain.

## Table of contents

- [How it works](#how-it-works)
- [Getting started](#getting-started)
- [Adding an app](#adding-an-app)
- [Inviting people](#inviting-people)
- [Repository structure](#repository-structure)
- [Commands](#commands)
- [FAQ](#faq)
- [License](#license)

## How it works

- **One deploy for all apps.** Every app lives in `apps/<slug>/` and is served at `/a/<slug>/` by the Next.js host in `platform/`, deployed once on Vercel with a Turso (libSQL) database.
- **Invite-only access.** The first time the instance runs, `/setup` creates the administrator. There is no sign-up page: everyone else joins through single-use invite links.
- **Workspaces.** A workspace groups apps and people, typically one per client. Members see only the apps of the workspaces they belong to; administrators see everything.
- **Apps stay private.** App files are never public: they are served only after checking the session and the workspace membership. App data stays in the user's browser, isolated per app.
- **Consistent interface.** The dashboard uses the same design language as the apps: dark canvas, floating panels, ⌘K search, and a "Your apps" button inside every app to get back.

## Getting started

Requirements: Node.js 22+, pnpm 10, a [Vercel](https://vercel.com) account and a [Turso](https://turso.tech) account.

You can ask your agent to do it (the `/setup-platform` skill walks through every step), or run:

```bash
pnpm install
pnpm platform:init --turso <db-name>   # creates the database, writes platform/.env.local, runs migrations
pnpm build:apps && pnpm dev            # http://localhost:3100
```

Open `http://localhost:3100/setup?token=<SETUP_TOKEN>` (the token is in `platform/.env.local`) and create the administrator account.

To try it locally without Turso, run `pnpm platform:init` with no options: it uses a local `file:local.db` database.

### Deploy

1. Create a Vercel project from this repository with **Root Directory = `platform`**.
2. Add the environment variables `DATABASE_URL`, `DATABASE_AUTH_TOKEN` and `SETUP_TOKEN` (values in `platform/.env.local`). Optionally set `NEXT_PUBLIC_PLATFORM_NAME` to change the name shown in the interface.
3. Deploy, then open `https://<your-domain>/setup?token=<SETUP_TOKEN>` to create the administrator.

Every deploy runs the database migrations and builds all the apps.

## Adding an app

Ask your agent, for example:

```text
Create an app for Acme that generates product labels from a CSV.
```

The `/new-app` skill:

1. scaffolds `apps/acme-labels` (from the neutral starter, or from one of the templates in `examples/`);
2. builds the app following the rules in its own `AGENTS.md`;
3. checks that it builds inside the platform and commits it.

Push, and after the deploy the app appears in the `acme` workspace, which is created automatically if it doesn't exist.

By hand, the same thing is:

```bash
pnpm new-app acme-labels --workspace acme --title "Label Studio" [--template <example>]
pnpm install
cd apps/acme-labels && pnpm dev
```

Each app declares its workspaces in `apps/<slug>/platform.json`:

```json
{ "title": "Label Studio", "description": "Product labels from a CSV.", "workspaces": ["acme"] }
```

Administrators can also add or remove deployed apps from a workspace in the dashboard (**Manage apps**).

## Inviting people

Open a workspace and click **Invite**. Choose the role (member or administrator) and optionally restrict the link to one email. Then copy the link, or the ready-made message, and send it however you like.

Invite links work once and expire after 7 days. If the person already has an account, they sign in and are added to the new workspace. Pending invites can be revoked from **Members**. From **People** you can promote administrators or disable accounts, which signs them out immediately.

## Repository structure

| Path | What it is |
|---|---|
| `platform/` | Next.js host: login, setup, invites, dashboard, admin, and the protected `/a/<slug>/` route |
| `platform/db/` | Drizzle schema and migrations (Turso / libSQL) |
| `platform/lib/auth/` | Passwords (scrypt), sessions, guards, rate limiting |
| `apps/<slug>/` | One standalone app per project, plus its `platform.json` |
| `scripts/` | `new-app`, `build-all`, `platform-init` |
| `starter/`, `examples/` | Templates new apps are created from (don't edit them directly) |
| `.claude/skills/` | `/new-app` and `/setup-platform` |
| `CLAUDE.md` | Rules for AI agents working on this repository |
| `PLATFORM.md` | Detailed technical guide |

## Commands

```bash
pnpm install              # Install all dependencies
pnpm platform:init        # First-time setup: database, env, migrations
pnpm dev                  # Start the platform on http://localhost:3100
pnpm new-app <slug> ...   # Create a new app in apps/<slug>
pnpm build:apps           # Build every app under /a/<slug>/
pnpm build                # Build all apps and the platform (what Vercel runs)
pnpm db:migrate           # Apply database migrations
pnpm test                 # Script tests and platform tests
```

## FAQ

<details>
<summary>Do I need a new deployment for each client?</summary>

No. All apps share one Vercel project and one database. A new app is a new folder in `apps/`, and access is managed with workspaces and invites.

</details>

<details>
<summary>Can a client see another client's apps?</summary>

No. Members only see and open the apps of their workspaces. The app files are served by an authenticated route that checks the membership on every request.

</details>

<details>
<summary>Where is the app data stored?</summary>

In the user's browser (localStorage and IndexedDB), prefixed per app so different apps never mix. The database only stores accounts, workspaces, invites and sessions.

</details>

<details>
<summary>Can I work on an app without the platform?</summary>

Yes. Each app in `apps/` is a standalone project: `cd apps/<slug> && pnpm dev`.

</details>

## License

[MIT](LICENSE.md). The app starter and templates are based on [Toolcraft](https://github.com/pixel-point/toolcraft) by Pixel Point.
