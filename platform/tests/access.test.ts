import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { db, schema } from "@/db/client";
import { canAccessApp, ensureManifestSynced, listWorkspacesForUser } from "@/lib/apps";
import { hashPassword } from "@/lib/auth/password";
import { createSession, validateSessionToken, type SessionUser } from "@/lib/auth/session";
import { createInvite, findValidInvite, redeemInvite } from "@/lib/invites";

const buildsDir = process.env.PLATFORM_APP_BUILDS_DIR!;

function writeManifest(hash: string, apps: { slug: string; workspaces: string[] }[]) {
  fs.writeFileSync(
    path.join(buildsDir, "manifest.json"),
    JSON.stringify({ hash, apps: apps.map((app) => ({ identity: app.slug, title: app.slug, description: "", ...app })) }),
  );
}

async function createUser(email: string, isAdmin = false): Promise<SessionUser> {
  const id = crypto.randomUUID();
  await db.insert(schema.users).values({ id, email, name: email, passwordHash: await hashPassword("password1234"), isAdmin });
  return { id, email, name: email, isAdmin };
}

let admin: SessionUser;

beforeAll(async () => {
  admin = await createUser("admin@example.com", true);
  writeManifest("v1", [
    { slug: "acme-tool", workspaces: ["acme"] },
    { slug: "globex-tool", workspaces: ["globex"] },
    { slug: "unassigned", workspaces: [] },
  ]);
  await ensureManifestSynced();
});

describe("manifest sync", () => {
  it("creates declared workspaces and manifest assignments", async () => {
    const workspaces = await db.select().from(schema.workspaces);
    expect(workspaces.map((workspace) => workspace.slug).sort()).toEqual(["acme", "globex"]);
    const rows = await db.select().from(schema.workspaceApps);
    expect(rows.every((row) => row.source === "manifest")).toBe(true);
    expect(rows).toHaveLength(2);
  });

  it("removes manifest assignments no longer declared, keeping admin ones", async () => {
    const [acme] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.slug, "acme"));
    await db.insert(schema.workspaceApps).values({ workspaceId: acme.id, appSlug: "unassigned", source: "admin" });
    writeManifest("v2", [
      { slug: "acme-tool", workspaces: [] },
      { slug: "globex-tool", workspaces: ["globex"] },
      { slug: "unassigned", workspaces: [] },
    ]);
    await ensureManifestSynced();
    const rows = await db.select().from(schema.workspaceApps).where(eq(schema.workspaceApps.workspaceId, acme.id));
    expect(rows.map((row) => `${row.appSlug}:${row.source}`)).toEqual(["unassigned:admin"]);

    writeManifest("v3", [
      { slug: "acme-tool", workspaces: ["acme"] },
      { slug: "globex-tool", workspaces: ["globex"] },
      { slug: "unassigned", workspaces: [] },
    ]);
    await ensureManifestSynced();
  });
});

describe("invites and access", () => {
  it("lets an invited client see only their workspace apps", async () => {
    const [acme] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.slug, "acme"));
    const token = await createInvite({ workspaceId: acme.id, email: "client@acme.com", isAdmin: false, createdBy: admin.id });
    const found = await findValidInvite(token);
    expect(found?.workspace?.slug).toBe("acme");

    const userId = crypto.randomUUID();
    expect(await redeemInvite(found!.invite.id, userId, { email: "client@acme.com", name: "Client", passwordHash: "x" })).toBe(true);
    // Single use: a second redemption (e.g. a concurrent request) fails and creates no user.
    const otherId = crypto.randomUUID();
    expect(await redeemInvite(found!.invite.id, otherId, { email: "other@acme.com", name: "Other", passwordHash: "x" })).toBe(false);
    expect(await db.select().from(schema.users).where(eq(schema.users.id, otherId))).toHaveLength(0);
    expect(await findValidInvite(token)).toBeUndefined();

    const client: SessionUser = { id: userId, email: "client@acme.com", name: "Client", isAdmin: false };
    expect(await canAccessApp(client, "acme-tool")).toBe(true);
    expect(await canAccessApp(client, "unassigned")).toBe(true); // assigned by admin to acme
    expect(await canAccessApp(client, "globex-tool")).toBe(false);
    expect(await canAccessApp(client, "does-not-exist")).toBe(false);
    expect(await canAccessApp(admin, "globex-tool")).toBe(true);

    const visible = await listWorkspacesForUser(client);
    expect(visible.map((workspace) => workspace.slug)).toEqual(["acme"]);
    expect(visible[0].apps.map((app) => app.slug).sort()).toEqual(["acme-tool", "unassigned"]);
  });

  it("rejects expired and revoked invites", async () => {
    const expired = await createInvite({ workspaceId: null, email: null, isAdmin: true, createdBy: admin.id });
    await db.update(schema.invites).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await findValidInvite(expired)).toBeUndefined();

    const revoked = await createInvite({ workspaceId: null, email: null, isAdmin: true, createdBy: admin.id });
    const found = await findValidInvite(revoked);
    await db.update(schema.invites).set({ revokedAt: new Date() }).where(eq(schema.invites.id, found!.invite.id));
    expect(await findValidInvite(revoked)).toBeUndefined();
  });

  it("promotes to admin through an admin invite", async () => {
    const user = await createUser("colleague@example.com");
    const token = await createInvite({ workspaceId: null, email: null, isAdmin: true, createdBy: admin.id });
    const found = await findValidInvite(token);
    expect(await redeemInvite(found!.invite.id, user.id)).toBe(true);
    const [row] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
    expect(row.isAdmin).toBe(true);
  });
});

describe("sessions", () => {
  it("validates tokens and drops sessions of disabled users", async () => {
    const user = await createUser("session@example.com");
    const token = await createSession(user.id);
    expect((await validateSessionToken(token))?.email).toBe("session@example.com");
    expect(await validateSessionToken("not-a-token")).toBeNull();

    await db.update(schema.users).set({ disabledAt: new Date() }).where(eq(schema.users.id, user.id));
    expect(await validateSessionToken(token)).toBeNull();
    expect(await db.select().from(schema.sessions).where(eq(schema.sessions.userId, user.id))).toHaveLength(0);
  });

  it("rejects expired sessions", async () => {
    const user = await createUser("expired@example.com");
    const token = await createSession(user.id);
    await db.update(schema.sessions).set({ expiresAt: new Date(Date.now() - 1) }).where(eq(schema.sessions.userId, user.id));
    expect(await validateSessionToken(token)).toBeNull();
  });
});
