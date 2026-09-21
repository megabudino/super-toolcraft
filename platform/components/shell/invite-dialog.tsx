"use client";

import { CaretDownIcon, ChatTextIcon, CheckIcon, CopyIcon, LinkIcon, ShieldCheckIcon, UserIcon } from "@phosphor-icons/react";
import { useState, useTransition } from "react";

import { createInviteLink } from "@/app/(app)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button, Spinner } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { toast } from "@/components/ui/toaster";
import { PLATFORM_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

import { useShell } from "./shell-context";

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (value: T) => void; options: { value: T; label: string; icon?: React.ReactNode }[] }) {
  return (
    <div role="radiogroup" className="bg-fill grid auto-cols-fr grid-flow-col gap-1 rounded-lg p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex h-7 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors [&_svg]:size-3.5",
            value === option.value ? "bg-[color:color-mix(in_oklab,var(--foreground)_12%,transparent)] text-[color:var(--foreground)]" : "text-dim hover:text-[color:var(--foreground)]",
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CopyRow({ label, icon, value }: { label: string; icon: React.ReactNode; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      className="flex-1"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <CheckIcon weight="bold" /> : icon}
      {label}
    </Button>
  );
}

function InviteForm({ initialWorkspaceId }: { initialWorkspaceId: string | null }) {
  const { workspaces } = useShell();
  const [workspaceId, setWorkspaceId] = useState<string | null>(initialWorkspaceId ?? workspaces[0]?.id ?? null);
  const [role, setRole] = useState<"member" | "admin">("member");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const workspace = workspaces.find((entry) => entry.id === workspaceId);

  if (link) {
    const target = workspace?.name ?? PLATFORM_NAME;
    const message = `You're invited to ${target}. Create your account here (the link works once and expires in 7 days):\n${link}`;
    return (
      <div className="grid gap-4">
        <div className="bg-fill grid gap-2 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[color:var(--accent)] text-white">
              <CheckIcon weight="bold" className="size-2.5" />
            </span>
            Invite link ready{email ? ` for ${email}` : ""}
          </div>
          <input
            readOnly
            value={link}
            onFocus={(event) => event.currentTarget.select()}
            className="h-8 rounded-md border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-black/30 px-2 font-mono text-[11px] text-[color:color-mix(in_oklab,var(--foreground)_80%,transparent)] outline-none"
          />
          <p className="text-faint text-[11px]">Copy it now: for security it won&apos;t be shown again. It works once and expires in 7 days.</p>
        </div>
        <div className="flex gap-2">
          <CopyRow label="Copy link" icon={<CopyIcon />} value={link} />
          <CopyRow label="Copy with message" icon={<ChatTextIcon />} value={message} />
        </div>
        <Button variant="ghost-muted" onClick={() => { setLink(null); setEmail(""); }}>
          Invite someone else
        </Button>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await createInviteLink({ workspaceId, email, isAdmin: role === "admin" });
          if (result.ok && result.data) setLink(result.data.url);
          else if (!result.ok) toast.error(result.error);
        });
      }}
    >
      <Field label="Workspace">
        <Menu>
          <MenuTrigger className="flex h-8 w-full items-center gap-2 rounded-lg border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_5%,transparent)] px-2 text-left text-[13px] outline-none hover:border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] data-popup-open:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]">
            {workspace ? <Avatar name={workspace.name} seed={workspace.slug} size="xs" square /> : null}
            <span className={cn("min-w-0 flex-1 truncate", !workspace && "text-faint")}>{workspace?.name ?? "No workspace (administrators only)"}</span>
            <CaretDownIcon className="text-faint size-3" />
          </MenuTrigger>
          <MenuContent className="w-(--anchor-width)">
            {workspaces.map((entry) => (
              <MenuItem key={entry.id} onClick={() => setWorkspaceId(entry.id)}>
                <Avatar name={entry.name} seed={entry.slug} size="xs" square />
                <span className="flex-1 truncate">{entry.name}</span>
                {entry.id === workspaceId ? <CheckIcon weight="bold" /> : null}
              </MenuItem>
            ))}
            {role === "admin" ? (
              <MenuItem onClick={() => setWorkspaceId(null)}>
                <span className="text-faint flex-1">No workspace</span>
                {workspaceId === null ? <CheckIcon weight="bold" /> : null}
              </MenuItem>
            ) : null}
          </MenuContent>
        </Menu>
      </Field>
      <Field label="Role">
        <Segmented
          value={role}
          onChange={(value) => {
            setRole(value);
            if (value === "member" && !workspaceId) setWorkspaceId(workspaces[0]?.id ?? null);
          }}
          options={[
            { value: "member", label: "Member", icon: <UserIcon /> },
            { value: "admin", label: "Administrator", icon: <ShieldCheckIcon /> },
          ]}
        />
      </Field>
      <p className="text-faint -mt-2 text-[11px] leading-relaxed">
        {role === "member" ? "Members only see the apps of the workspaces they belong to." : "Administrators see every workspace and can invite people."}
      </p>
      <Field label="Email" htmlFor="invite-email" aside={<span className="text-faint text-[11px]">Optional</span>} hint="If set, only this email can use the link.">
        <Input id="invite-email" type="email" placeholder="client@company.com" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Button type="submit" size="lg" disabled={pending || (role === "member" && !workspaceId)}>
        {pending ? <Spinner /> : <LinkIcon />}
        Create invite link
      </Button>
    </form>
  );
}

export function InviteDialog() {
  const { dialog, closeDialog, workspaces } = useShell();
  const open = dialog.kind === "invite";
  const initialWorkspaceId = open ? dialog.workspaceId : null;
  const workspace = workspaces.find((entry) => entry.id === initialWorkspaceId);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeDialog()}>
      <DialogContent title={workspace ? `Invite to ${workspace.name}` : "Invite people"} description="Create a personal link and send it however you like: email, chat, anywhere.">
        {open ? <InviteForm key={String(initialWorkspaceId)} initialWorkspaceId={initialWorkspaceId} /> : null}
      </DialogContent>
    </Dialog>
  );
}
