import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { EmptyState, PageHeader } from "@/components/page-header";
import { WorkspaceForm } from "@/components/shell/new-workspace-dialog";
import { Panel } from "@/components/ui/panel";
import { LAST_WORKSPACE_COOKIE } from "@/lib/auth/constants";
import { getVisibleWorkspaces } from "@/lib/queries";

export default async function Home() {
  const { user, workspaces } = await getVisibleWorkspaces();
  const last = (await cookies()).get(LAST_WORKSPACE_COOKIE)?.value;
  const target = workspaces.find((workspace) => workspace.slug === last) ?? workspaces.find((workspace) => workspace.apps.length > 0) ?? workspaces[0];
  if (target) redirect(`/w/${target.slug}`);

  if (!user.isAdmin) {
    return (
      <EmptyState icon={<SquaresFourIcon />} title="Nothing here yet">
        You&apos;re not part of any workspace. When someone invites you, the apps will show up here.
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-md pt-[8vh]">
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} description="Start with a workspace: one per client or project. Its members will only see its apps." />
      <Panel className="rise-in p-5">
        <WorkspaceForm submitLabel="Create first workspace" />
      </Panel>
    </div>
  );
}
