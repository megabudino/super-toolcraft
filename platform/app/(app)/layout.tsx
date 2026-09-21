import { AppShell } from "@/components/shell/app-shell";
import { getVisibleWorkspaces } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspaces } = await getVisibleWorkspaces();
  return (
    <AppShell user={user} workspaces={workspaces.map(({ id, slug, name, apps }) => ({ id, slug, name, apps }))}>
      {children}
    </AppShell>
  );
}
