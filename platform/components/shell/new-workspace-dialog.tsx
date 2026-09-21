"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createWorkspace } from "@/app/(app)/actions";
import { Button, Spinner } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { slugify } from "@/lib/slug";

import { useShell } from "./shell-context";

export function WorkspaceForm({ onCreated, submitLabel = "Create workspace" }: { onCreated?: (slug: string) => void; submitLabel?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await createWorkspace({ name, slug });
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(`${name} is ready`, { description: "Add apps with a prompt in the repo, then invite people." });
          onCreated?.(slug);
          router.push(`/w/${slug}`);
        });
      }}
    >
      <Field label="Name" htmlFor="ws-name">
        <Input
          id="ws-name"
          autoFocus
          required
          placeholder="Acme Inc."
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugEdited) setSlug(slugify(event.target.value));
          }}
        />
      </Field>
      <Field label="URL" htmlFor="ws-slug" hint="Also used in apps/<slug>/platform.json to assign apps.">
        <div className="flex items-center rounded-lg border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_5%,transparent)] pl-2.5 focus-within:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]">
          <span className="text-faint text-[13px]">/w/</span>
          <input
            id="ws-slug"
            required
            className="h-8 min-w-0 flex-1 bg-transparent pr-2.5 text-[13px] outline-none placeholder:text-[color:var(--muted-foreground)]"
            placeholder="acme"
            value={slug}
            onChange={(event) => {
              setSlugEdited(true);
              setSlug(slugify(event.target.value) || event.target.value.toLowerCase());
            }}
          />
        </div>
      </Field>
      <Button type="submit" size="lg" disabled={pending || !name || !slug}>
        {pending ? <Spinner /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}

export function NewWorkspaceDialog() {
  const { dialog, closeDialog } = useShell();
  const open = dialog.kind === "new-workspace";
  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeDialog()}>
      <DialogContent title="New workspace" description="One workspace per client or project. Its members see only its apps.">
        {open ? <WorkspaceForm onCreated={closeDialog} /> : null}
      </DialogContent>
    </Dialog>
  );
}
