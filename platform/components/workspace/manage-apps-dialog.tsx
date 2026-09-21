"use client";

import { LockSimpleIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import { useOptimistic, useTransition } from "react";

import { setWorkspaceApp } from "@/app/(app)/actions";
import { AppCover } from "@/components/app-cover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";

export type CatalogApp = { slug: string; title: string; description: string; source: "manifest" | "admin" | null };

export function ManageAppsDialog({ workspaceId, workspaceName, apps }: { workspaceId: string; workspaceName: string; apps: CatalogApp[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(apps, (state, change: { slug: string; enabled: boolean }) =>
    state.map((app) => (app.slug === change.slug ? { ...app, source: change.enabled ? ("admin" as const) : null } : app)),
  );

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <SlidersHorizontalIcon /> Manage apps
      </DialogTrigger>
      <DialogContent title="Apps in this workspace" description={`Choose which deployed apps ${workspaceName} members can open.`} className="sm:max-w-md">
        {optimistic.length === 0 ? (
          <p className="text-dim bg-fill rounded-lg p-3 text-[13px]">No apps are deployed yet. Create one with a prompt in the repo (the /new-app skill), then push.</p>
        ) : (
          <ul className="-mx-1 grid max-h-[60vh] gap-0.5 overflow-y-auto">
            {optimistic.map((app) => {
              const locked = app.source === "manifest";
              return (
                <li key={app.slug} className="hover-fill flex items-center gap-3 rounded-lg px-1 py-1.5">
                  <AppCover seed={app.slug} title={app.title} compact className="size-8 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{app.title}</p>
                    <p className="text-faint truncate font-mono text-[11px]">/a/{app.slug}</p>
                  </div>
                  {locked ? (
                    <Tooltip content={`Assigned in apps/${app.slug}/platform.json`}>
                      <span className="text-faint inline-flex items-center gap-1 text-[11px]">
                        <LockSimpleIcon className="size-3" /> platform.json
                      </span>
                    </Tooltip>
                  ) : null}
                  <Switch
                    checked={app.source !== null}
                    disabled={locked}
                    aria-label={`Show ${app.title} in ${workspaceName}`}
                    onCheckedChange={(enabled) =>
                      startTransition(async () => {
                        setOptimistic({ slug: app.slug, enabled });
                        const result = await setWorkspaceApp({ workspaceId, appSlug: app.slug, enabled });
                        if (!result.ok) toast.error(result.error);
                        else toast.success(enabled ? `${app.title} added` : `${app.title} removed`);
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
