"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { db, schema } from "@/db/client";
import { getApp } from "@/lib/apps";
import { requireAdmin } from "@/lib/auth/guards";
import { invalidateUserSessions } from "@/lib/auth/session";
import { isValidEmail, normalizeEmail } from "@/lib/auth/tokens";
import { createInvite } from "@/lib/invites";
import { SLUG_PATTERN } from "@/lib/slug";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function refresh() {
  revalidatePath("/", "layout");
}

async function isManifestWorkspace(workspaceId: string): Promise<boolean> {
  const [row] = await db
    .select({ slug: schema.workspaceApps.appSlug })
    .from(schema.workspaceApps)
    .where(and(eq(schema.workspaceApps.workspaceId, workspaceId), eq(schema.workspaceApps.source, "manifest")))
    .limit(1);
  return Boolean(row);
}

export async function createWorkspace(input: { name: string; slug: string }): Promise<ActionResult<{ slug: string }>> {
  await requireAdmin();
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!name) return { ok: false, error: "Give the workspace a name." };
  if (!SLUG_PATTERN.test(slug)) return { ok: false, error: "The URL can only contain lowercase letters, digits and dashes." };
  const inserted = await db
    .insert(schema.workspaces)
    .values({ id: crypto.randomUUID(), slug, name })
    .onConflictDoNothing({ target: schema.workspaces.slug })
    .returning({ id: schema.workspaces.id });
  if (inserted.length === 0) return { ok: false, error: `/w/${slug} is already taken.` };
  refresh();
  return { ok: true, data: { slug } };
}

export async function renameWorkspace(input: { workspaceId: string; name: string }): Promise<ActionResult> {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "The name can't be empty." };
  await db.update(schema.workspaces).set({ name }).where(eq(schema.workspaces.id, input.workspaceId));
  refresh();
  return { ok: true };
}

export async function deleteWorkspace(input: { workspaceId: string }): Promise<ActionResult> {
  await requireAdmin();
  if (await isManifestWorkspace(input.workspaceId)) {
    return { ok: false, error: "Apps declare this workspace in their platform.json: remove it there first, or it will be recreated on the next deploy." };
  }
  await db.delete(schema.workspaces).where(eq(schema.workspaces.id, input.workspaceId));
  refresh();
  return { ok: true };
}

export async function setWorkspaceApp(input: { workspaceId: string; appSlug: string; enabled: boolean }): Promise<ActionResult> {
  await requireAdmin();
  if (!(await getApp(input.appSlug))) return { ok: false, error: "This app is not deployed." };
  if (input.enabled) {
    await db.insert(schema.workspaceApps).values({ workspaceId: input.workspaceId, appSlug: input.appSlug, source: "admin" }).onConflictDoNothing();
  } else {
    const [row] = await db
      .select()
      .from(schema.workspaceApps)
      .where(and(eq(schema.workspaceApps.workspaceId, input.workspaceId), eq(schema.workspaceApps.appSlug, input.appSlug)))
      .limit(1);
    if (row?.source === "manifest") return { ok: false, error: `Declared in apps/${input.appSlug}/platform.json: edit that file to remove it.` };
    await db
      .delete(schema.workspaceApps)
      .where(and(eq(schema.workspaceApps.workspaceId, input.workspaceId), eq(schema.workspaceApps.appSlug, input.appSlug)));
  }
  refresh();
  return { ok: true };
}

export async function addMember(input: { workspaceId: string; userId: string }): Promise<ActionResult> {
  await requireAdmin();
  await db.insert(schema.workspaceMembers).values(input).onConflictDoNothing();
  refresh();
  return { ok: true };
}

export async function removeMember(input: { workspaceId: string; userId: string }): Promise<ActionResult> {
  await requireAdmin();
  await db
    .delete(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.workspaceId, input.workspaceId), eq(schema.workspaceMembers.userId, input.userId)));
  refresh();
  return { ok: true };
}

async function origin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3100";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function createInviteLink(input: { workspaceId: string | null; email: string; isAdmin: boolean }): Promise<ActionResult<{ url: string }>> {
  const admin = await requireAdmin();
  const email = input.email.trim() ? normalizeEmail(input.email) : null;
  if (email && !isValidEmail(email)) return { ok: false, error: "That email doesn't look right." };
  if (!input.workspaceId && !input.isAdmin) return { ok: false, error: "Pick a workspace, or invite as administrator." };
  const token = await createInvite({ workspaceId: input.workspaceId, email, isAdmin: input.isAdmin, createdBy: admin.id });
  refresh();
  return { ok: true, data: { url: `${await origin()}/invite/${token}` } };
}

export async function revokeInvite(input: { inviteId: string }): Promise<ActionResult> {
  await requireAdmin();
  await db.update(schema.invites).set({ revokedAt: new Date() }).where(eq(schema.invites.id, input.inviteId));
  refresh();
  return { ok: true };
}

export async function setUserDisabled(input: { userId: string; disabled: boolean }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (input.userId === admin.id) return { ok: false, error: "You can't disable your own account." };
  await db.update(schema.users).set({ disabledAt: input.disabled ? new Date() : null }).where(eq(schema.users.id, input.userId));
  if (input.disabled) await invalidateUserSessions(input.userId);
  refresh();
  return { ok: true };
}

export async function setUserAdmin(input: { userId: string; isAdmin: boolean }): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (input.userId === admin.id) return { ok: false, error: "You can't change your own role." };
  await db.update(schema.users).set({ isAdmin: input.isAdmin }).where(eq(schema.users.id, input.userId));
  refresh();
  return { ok: true };
}
