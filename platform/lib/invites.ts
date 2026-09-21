import { and, eq, gt, isNull, sql, TransactionRollbackError } from "drizzle-orm";

import { db, schema } from "@/db/client";

import { INVITE_DURATION_MS } from "./auth/constants";
import { generateToken, hashToken } from "./auth/tokens";

export async function createInvite(input: { workspaceId: string | null; email: string | null; isAdmin: boolean; createdBy: string }) {
  const token = generateToken();
  await db.insert(schema.invites).values({
    id: crypto.randomUUID(),
    tokenHash: hashToken(token),
    workspaceId: input.workspaceId,
    email: input.email,
    isAdmin: input.isAdmin,
    createdBy: input.createdBy,
    expiresAt: new Date(Date.now() + INVITE_DURATION_MS),
  });
  return token;
}

export async function findValidInvite(token: string) {
  const [row] = await db
    .select({ invite: schema.invites, workspace: schema.workspaces })
    .from(schema.invites)
    .leftJoin(schema.workspaces, eq(schema.workspaces.id, schema.invites.workspaceId))
    .where(
      and(
        eq(schema.invites.tokenHash, hashToken(token)),
        isNull(schema.invites.usedAt),
        isNull(schema.invites.revokedAt),
        gt(schema.invites.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row;
}

/** Marks the invite used (single-use, race-safe) and grants what it carries. */
export async function redeemInvite(
  inviteId: string,
  userId: string,
  newUser?: { email: string; name: string; passwordHash: string },
): Promise<boolean> {
  return db
    .transaction(async (tx) => {
    // New accounts are created in the same transaction, so a lost race leaves no orphan user.
    if (newUser) await tx.insert(schema.users).values({ id: userId, ...newUser });
    const claimed = await tx
      .update(schema.invites)
      .set({ usedAt: new Date(), usedBy: userId })
      .where(and(eq(schema.invites.id, inviteId), isNull(schema.invites.usedAt), isNull(schema.invites.revokedAt), gt(schema.invites.expiresAt, new Date())))
      .returning({ workspaceId: schema.invites.workspaceId, isAdmin: schema.invites.isAdmin });
    const invite = claimed[0];
    if (!invite) {
      tx.rollback();
      return false;
    }
    if (invite.workspaceId) {
      await tx.insert(schema.workspaceMembers).values({ workspaceId: invite.workspaceId, userId }).onConflictDoNothing();
    }
    if (invite.isAdmin) {
      await tx.update(schema.users).set({ isAdmin: sql`1` }).where(eq(schema.users.id, userId));
    }
    return true;
  })
    .catch((error) => {
      if (error instanceof TransactionRollbackError) return false;
      throw error;
    });
}
