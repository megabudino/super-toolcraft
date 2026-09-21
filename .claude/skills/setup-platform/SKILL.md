---
name: setup-platform
description: First-time setup of this platform (Turso database, env vars, migrations, Vercel project, first admin). Use when someone uses the repo for the first time or asks to "configure/deploy the platform".
---

# First-time platform setup

Confirm with the user before every external action (creating a Turso DB, linking/deploying Vercel, adding env vars).

1. **Install**: `pnpm install` at the repo root (Node ≥ 22, pnpm 10).
2. **Database + env**:
   - Production: needs the `turso` CLI logged in (`turso auth login`). Run `pnpm platform:init --turso <db-name>`.
   - Only local: `pnpm platform:init` (uses `file:local.db`).
   - Without the turso CLI: `pnpm platform:init --url libsql://… --token …` with values from the Turso dashboard.
   This writes `platform/.env.local` (with a random `SETUP_TOKEN`) and runs migrations. Never print the token values in chat; tell the user where they are.
3. **Try locally**: `pnpm build:apps && pnpm dev`, then the user opens `http://localhost:3100/setup?token=<SETUP_TOKEN from platform/.env.local>` and creates the admin account themselves (don't type passwords for them).
4. **Vercel** (user confirms each step):
   - Create/import the project from the GitHub repo with **Root Directory = `platform`** (framework Next.js; install/build commands come from `platform/vercel.json`).
   - Add env vars `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `SETUP_TOKEN` (Production + Preview; ideally a separate Turso DB for Preview).
   - With the Vercel CLI: `cd platform && vercel link`, `vercel env add …`, `vercel deploy --prod`.
5. **First admin in production**: the user opens `https://<domain>/setup?token=<SETUP_TOKEN>`. After the first user exists `/setup` returns 404. They can then rotate/remove `SETUP_TOKEN` in Vercel.
6. **Next**: create the first client app with the `/new-app` skill, push, then invite the client from the workspace page (**Invite**).
