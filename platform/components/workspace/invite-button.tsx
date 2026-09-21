"use client";

import { UserPlusIcon } from "@phosphor-icons/react";

import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";

export function InviteButton({ workspaceId, variant = "default", label = "Invite" }: { workspaceId: string | null; variant?: "default" | "outline"; label?: string }) {
  const { openInvite } = useShell();
  return (
    <Button variant={variant} onClick={() => openInvite(workspaceId)}>
      <UserPlusIcon /> {label}
    </Button>
  );
}
