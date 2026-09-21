import type { Metadata } from "next";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db/client";
import { PageHeader } from "@/components/page-header";
import { PeoplePanel } from "@/components/people-panel";
import { InviteButton } from "@/components/workspace/invite-button";
import { requireAdmin } from "@/lib/auth/guards";
import { fromNow } from "@/lib/time";

export const metadata: Metadata = { title: "People" };

export default async function PeoplePage() {
  const admin = await requireAdmin();
  const [users, memberships] = await Promise.all([
    db.select().from(schema.users).orderBy(schema.users.name),
    db
      .select({ userId: schema.workspaceMembers.userId, slug: schema.workspaces.slug, name: schema.workspaces.name })
      .from(schema.workspaceMembers)
      .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.workspaceMembers.workspaceId))
      .orderBy(schema.workspaces.name),
  ]);

  return (
    <>
      <PageHeader title="People" description="Everyone with an account. Access is granted per workspace; administrators see everything." actions={<InviteButton workspaceId={null} label="Invite people" />} />
      <PeoplePanel
        currentUserId={admin.id}
        people={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          disabled: Boolean(user.disabledAt),
          joined: fromNow(user.createdAt),
          workspaces: memberships.filter((row) => row.userId === user.id).map(({ slug, name }) => ({ slug, name })),
        }))}
      />
    </>
  );
}
