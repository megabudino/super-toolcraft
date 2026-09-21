"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteWorkspace, renameWorkspace } from "@/app/(app)/actions";
import { CopySnippet } from "@/components/copy-snippet";
import { Button, Spinner } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Field, Input } from "@/components/ui/input";
import { Panel, PanelHeader, PanelSeparator } from "@/components/ui/panel";
import { toast } from "@/components/ui/toaster";

export function WorkspaceSettings({ workspace, lockedByManifest }: { workspace: { id: string; slug: string; name: string }; lockedByManifest: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [name, setName] = useState(workspace.name);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid max-w-2xl gap-4">
      <Panel className="rise-in">
        <PanelHeader title="General" />
        <PanelSeparator />
        <form
          className="grid gap-4 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await renameWorkspace({ workspaceId: workspace.id, name });
              if (result.ok) toast.success("Workspace renamed");
              else toast.error(result.error);
            });
          }}
        >
          <Field label="Name" htmlFor="name">
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="URL" hint="The URL can't change: it's how apps reference this workspace.">
            <Input value={`/w/${workspace.slug}`} readOnly />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending || name.trim() === workspace.name || !name.trim()}>
              {pending ? <Spinner /> : null}
              Save changes
            </Button>
          </div>
        </form>
      </Panel>

      <Panel className="rise-in" style={{ animationDelay: "40ms" }}>
        <PanelHeader title="Assign apps from the repo" />
        <PanelSeparator />
        <div className="text-dim grid gap-3 p-3 text-[13px] leading-relaxed">
          <p>Apps list the workspaces they belong to in their <code className="bg-fill rounded px-1 font-mono text-xs text-[color:var(--foreground)]">platform.json</code>. They are assigned here on every deploy.</p>
          <CopySnippet value={`{ "workspaces": ["${workspace.slug}"] }`} />
        </div>
      </Panel>

      <Panel className="rise-in border-[color:color-mix(in_oklab,var(--destructive)_25%,transparent)]" style={{ animationDelay: "80ms" }}>
        <PanelHeader title="Danger zone" />
        <PanelSeparator />
        <div className="flex flex-wrap items-center gap-3 p-3">
          <p className="text-dim min-w-0 flex-1 text-[13px] leading-relaxed">
            {lockedByManifest
              ? "Some apps declare this workspace in their platform.json. Remove it there first, or it will come back on the next deploy."
              : "Deleting removes the workspace and its memberships. Apps and people are not deleted."}
          </p>
          <Button
            variant="destructive"
            disabled={lockedByManifest}
            onClick={() =>
              confirm({
                title: `Delete ${workspace.name}?`,
                description: "Members will lose access to its apps. This can't be undone.",
                confirmLabel: "Delete workspace",
                destructive: true,
                onConfirm: async () => {
                  const result = await deleteWorkspace({ workspaceId: workspace.id });
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success(`${workspace.name} deleted`);
                  router.push("/");
                },
              })
            }
          >
            <TrashIcon /> Delete workspace
          </Button>
        </div>
      </Panel>
    </div>
  );
}
