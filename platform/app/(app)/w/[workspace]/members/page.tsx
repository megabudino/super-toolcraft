import { and, desc, eq, gt, isNull } from "drizzle-orm";
import type { Metadata } from "next";

import { db, schema } from "@/db/client";
import { PageHeader } from "@/components/page-header";
import { InviteButton } from "@/components/workspace/invite-button";
import { MembersPanel } from "@/components/workspace/members-panel";
import { requireAdmin } from "@/lib/auth/guards";
import { getWorkspaceOr404 } from "@/lib/queries";
import { fromNow } from "@/lib/time";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({ params }: { params: Promise<{ workspace: string }> }) {
  const admin = await requireAdmin();
  const { workspace } = await getWorkspaceOr404((await params).workspace);

  const [memberRows, inviteRows, users] = await Promise.all([
    db
      .select({ user: schema.users, joinedAt: schema.workspaceMembers.createdAt })
      .from(schema.workspaceMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.workspaceMembers.userId))
      .where(eq(schema.workspaceMembers.workspaceId, workspace.id))
      .orderBy(schema.users.name),
    db
      .select()
      .from(schema.invites)
      .where(and(eq(schema.invites.workspaceId, workspace.id), isNull(schema.invites.usedAt), isNull(schema.invites.revokedAt), gt(schema.invites.expiresAt, new Date())))
      .orderBy(desc(schema.invites.createdAt)),
    db.select().from(schema.users).where(isNull(schema.users.disabledAt)).orderBy(schema.users.name),
  ]);
  const nameById = new Map(users.map((user) => [user.id, user.name]));
  const memberIds = new Set(memberRows.map((row) => row.user.id));

  return (
    <>
      <PageHeader
        title="Members"
        description="Who can open the apps of this workspace. Administrators always see every workspace."
        actions={<InviteButton workspaceId={workspace.id} />}
      />
      <MembersPanel
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        currentUserId={admin.id}
        members={memberRows.map(({ user, joinedAt }) => ({ id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin, joined: fromNow(joinedAt) }))}
        invites={inviteRows.map((invite) => ({
          id: invite.id,
          email: invite.email,
          isAdmin: invite.isAdmin,
          expires: fromNow(invite.expiresAt),
          createdBy: invite.createdBy ? (nameById.get(invite.createdBy) ?? null) : null,
        }))}
        candidates={users.filter((user) => !memberIds.has(user.id)).map(({ id, name, email }) => ({ id, name, email }))}
      />
    </>
  );
}
