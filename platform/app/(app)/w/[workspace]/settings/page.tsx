import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";

import { db, schema } from "@/db/client";
import { PageHeader } from "@/components/page-header";
import { WorkspaceSettings } from "@/components/workspace/workspace-settings";
import { requireAdmin } from "@/lib/auth/guards";
import { getWorkspaceOr404 } from "@/lib/queries";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ params }: { params: Promise<{ workspace: string }> }) {
  await requireAdmin();
  const { workspace } = await getWorkspaceOr404((await params).workspace);
  const [manifestRow] = await db
    .select({ slug: schema.workspaceApps.appSlug })
    .from(schema.workspaceApps)
    .where(and(eq(schema.workspaceApps.workspaceId, workspace.id), eq(schema.workspaceApps.source, "manifest")))
    .limit(1);

  return (
    <>
      <PageHeader title="Settings" description="Name, app assignment and deletion of this workspace." />
      <WorkspaceSettings key={workspace.name} workspace={{ id: workspace.id, slug: workspace.slug, name: workspace.name }} lockedByManifest={Boolean(manifestRow)} />
    </>
  );
}
