import fs from "node:fs/promises";
import path from "node:path";

import { and, eq, inArray } from "drizzle-orm";

import { db, schema } from "@/db/client";

import type { SessionUser } from "./auth/session";

export type AppEntry = {
  slug: string;
  identity: string;
  title: string;
  description: string;
  workspaces: string[];
};

type Manifest = { hash: string; apps: AppEntry[] };

// Not traced automatically (it would copy every app into every function): see outputFileTracingIncludes.
export const APP_BUILDS_DIR = process.env.PLATFORM_APP_BUILDS_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), ".app-builds");
const MANIFEST_HASH_KEY = "manifest_hash";

let manifestCache: Promise<Manifest> | undefined;

export function readManifest(): Promise<Manifest> {
  const load = async () => {
    try {
      return JSON.parse(await fs.readFile(path.join(APP_BUILDS_DIR, "manifest.json"), "utf8")) as Manifest;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { hash: "empty", apps: [] };
      throw error;
    }
  };
  // In dev the manifest changes whenever `pnpm build:apps` runs.
  if (process.env.NODE_ENV !== "production") return load();
  return (manifestCache ??= load());
}

export function workspaceNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

let syncedHash: string | undefined;

/**
 * Mirrors the `workspaces` declared in apps/<slug>/platform.json into the database:
 * creates missing workspaces and the "manifest" app assignments, and removes manifest
 * assignments that are no longer declared. Runs once per manifest hash.
 */
export async function ensureManifestSynced(): Promise<void> {
  const manifest = await readManifest();
  if (syncedHash === manifest.hash) return;

  const [stored] = await db.select().from(schema.meta).where(eq(schema.meta.key, MANIFEST_HASH_KEY)).limit(1);
  if (stored?.value === manifest.hash) {
    syncedHash = manifest.hash;
    return;
  }

  const declared = manifest.apps.flatMap((app) => app.workspaces.map((workspace) => ({ app: app.slug, workspace })));
  const workspaceSlugs = [...new Set(declared.map((entry) => entry.workspace))];

  await db.transaction(async (tx) => {
    for (const slug of workspaceSlugs) {
      await tx
        .insert(schema.workspaces)
        .values({ id: crypto.randomUUID(), slug, name: workspaceNameFromSlug(slug) })
        .onConflictDoNothing({ target: schema.workspaces.slug });
    }
    const rows = workspaceSlugs.length
      ? await tx.select().from(schema.workspaces).where(inArray(schema.workspaces.slug, workspaceSlugs))
      : [];
    const idBySlug = new Map(rows.map((row) => [row.slug, row.id]));

    for (const entry of declared) {
      const workspaceId = idBySlug.get(entry.workspace)!;
      await tx
        .insert(schema.workspaceApps)
        .values({ workspaceId, appSlug: entry.app, source: "manifest" })
        .onConflictDoUpdate({
          target: [schema.workspaceApps.workspaceId, schema.workspaceApps.appSlug],
          set: { source: "manifest" },
        });
    }

    // Manifest assignments that disappeared from platform.json.
    const existing = await tx.select().from(schema.workspaceApps).where(eq(schema.workspaceApps.source, "manifest"));
    const keep = new Set(declared.map((entry) => `${idBySlug.get(entry.workspace)}:${entry.app}`));
    for (const row of existing) {
      if (!keep.has(`${row.workspaceId}:${row.appSlug}`)) {
        await tx
          .delete(schema.workspaceApps)
          .where(and(eq(schema.workspaceApps.workspaceId, row.workspaceId), eq(schema.workspaceApps.appSlug, row.appSlug)));
      }
    }

    await tx
      .insert(schema.meta)
      .values({ key: MANIFEST_HASH_KEY, value: manifest.hash })
      .onConflictDoUpdate({ target: schema.meta.key, set: { value: manifest.hash } });
  });
  syncedHash = manifest.hash;
}

export async function getApp(slug: string): Promise<AppEntry | undefined> {
  return (await readManifest()).apps.find((app) => app.slug === slug);
}

export async function canAccessApp(user: SessionUser, slug: string): Promise<boolean> {
  if (!(await getApp(slug))) return false;
  if (user.isAdmin) return true;
  const [row] = await db
    .select({ slug: schema.workspaceApps.appSlug })
    .from(schema.workspaceApps)
    .innerJoin(schema.workspaceMembers, eq(schema.workspaceMembers.workspaceId, schema.workspaceApps.workspaceId))
    .where(and(eq(schema.workspaceApps.appSlug, slug), eq(schema.workspaceMembers.userId, user.id)))
    .limit(1);
  return Boolean(row);
}

export type WorkspaceWithApps = {
  id: string;
  slug: string;
  name: string;
  apps: AppEntry[];
};

/** Workspaces visible to the user (all for admins) with the apps currently deployed. */
export async function listWorkspacesForUser(user: SessionUser): Promise<WorkspaceWithApps[]> {
  const manifest = await readManifest();
  const appsBySlug = new Map(manifest.apps.map((app) => [app.slug, app]));

  const workspaceRows = user.isAdmin
    ? await db.select().from(schema.workspaces).orderBy(schema.workspaces.name)
    : await db
        .select({ id: schema.workspaces.id, slug: schema.workspaces.slug, name: schema.workspaces.name, createdAt: schema.workspaces.createdAt })
        .from(schema.workspaces)
        .innerJoin(schema.workspaceMembers, eq(schema.workspaceMembers.workspaceId, schema.workspaces.id))
        .where(eq(schema.workspaceMembers.userId, user.id))
        .orderBy(schema.workspaces.name);
  if (workspaceRows.length === 0) return [];

  const assignments = appsBySlug.size
    ? await db
        .select()
        .from(schema.workspaceApps)
        .where(
          and(
            inArray(
              schema.workspaceApps.workspaceId,
              workspaceRows.map((row) => row.id),
            ),
            inArray(schema.workspaceApps.appSlug, [...appsBySlug.keys()]),
          ),
        )
    : [];

  return workspaceRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    apps: assignments
      .filter((assignment) => assignment.workspaceId === row.id)
      .map((assignment) => appsBySlug.get(assignment.appSlug))
      .filter((app): app is AppEntry => Boolean(app))
      .sort((left, right) => left.title.localeCompare(right.title)),
  }));
}
