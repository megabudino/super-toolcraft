import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

import { db, schema } from "@/db/client";
import { CopySnippet } from "@/components/copy-snippet";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { AppCard } from "@/components/workspace/app-card";
import { InviteButton } from "@/components/workspace/invite-button";
import { ManageAppsDialog, type CatalogApp } from "@/components/workspace/manage-apps-dialog";
import { readManifest } from "@/lib/apps";
import { getWorkspaceOr404 } from "@/lib/queries";

type Params = { params: Promise<{ workspace: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { workspace } = await getWorkspaceOr404((await params).workspace);
  return { title: workspace.name };
}

export default async function WorkspaceAppsPage({ params }: Params) {
  const { user, workspace } = await getWorkspaceOr404((await params).workspace);

  let catalog: CatalogApp[] = [];
  let memberCount = 0;
  if (user.isAdmin) {
    const [manifest, assignments, members] = await Promise.all([
      readManifest(),
      db.select().from(schema.workspaceApps).where(eq(schema.workspaceApps.workspaceId, workspace.id)),
      db.select({ userId: schema.workspaceMembers.userId }).from(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, workspace.id)),
    ]);
    const sourceBySlug = new Map(assignments.map((row) => [row.appSlug, row.source]));
    catalog = manifest.apps.map((app) => ({ slug: app.slug, title: app.title, description: app.description, source: sourceBySlug.get(app.slug) ?? null }));
    memberCount = members.length;
  }

  const actions = user.isAdmin ? (
    <>
      <ManageAppsDialog workspaceId={workspace.id} workspaceName={workspace.name} apps={catalog} />
      <InviteButton workspaceId={workspace.id} />
    </>
  ) : null;

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Avatar name={workspace.name} seed={workspace.slug} size="xs" square /> Workspace
          </>
        }
        title={workspace.name}
        description={
          user.isAdmin
            ? `${workspace.apps.length} ${workspace.apps.length === 1 ? "app" : "apps"} · ${memberCount} ${memberCount === 1 ? "member" : "members"}`
            : "Pick an app to open it. Your work is saved in this browser."
        }
        actions={actions}
      />

      {workspace.apps.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspace.apps.map((app, index) => (
            <AppCard key={app.slug} app={app} index={index} />
          ))}
        </div>
      ) : user.isAdmin ? (
        <EmptyState icon={<SquaresFourIcon />} title="No apps in this workspace yet">
          <p>Ask Claude in the repo to build one. It will be assigned here automatically on the next deploy.</p>
          <div className="mt-5 grid gap-3">
            <CopySnippet label="Prompt" value={`Create an app for ${workspace.name} (workspace ${workspace.slug}) that …`} />
            <CopySnippet label="Or by hand" value={`pnpm new-app <slug> --workspace ${workspace.slug}`} />
          </div>
          {catalog.length > 0 ? <p className="text-faint mt-4 text-xs">Already deployed apps can be added with “Manage apps”.</p> : null}
        </EmptyState>
      ) : (
        <EmptyState icon={<SquaresFourIcon />} title="No apps yet">
          Apps shared with {workspace.name} will appear here.
        </EmptyState>
      )}
    </>
  );
}
