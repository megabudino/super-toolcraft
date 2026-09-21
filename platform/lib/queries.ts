import { notFound } from "next/navigation";
import { cache } from "react";

import { ensureManifestSynced, listWorkspacesForUser } from "./apps";
import { requireUser } from "./auth/guards";

/** Per-request cached: the layout and the page share one query. */
export const getVisibleWorkspaces = cache(async () => {
  const user = await requireUser();
  // Layout and page render in parallel: sync here so both see the same, up-to-date data.
  await ensureManifestSynced();
  return { user, workspaces: await listWorkspacesForUser(user) };
});

export async function getWorkspaceOr404(slug: string) {
  const { user, workspaces } = await getVisibleWorkspaces();
  const workspace = workspaces.find((entry) => entry.slug === slug);
  if (!workspace) notFound();
  return { user, workspace, workspaces };
}
