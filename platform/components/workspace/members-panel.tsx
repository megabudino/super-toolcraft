"use client";

import { ClockIcon, DotsThreeIcon, LinkBreakIcon, PlusIcon, UserMinusIcon } from "@phosphor-icons/react";
import { useTransition } from "react";

import { addMember, removeMember, revokeInvite } from "@/app/(app)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "@/components/ui/menu";
import { Badge, Panel, PanelHeader, PanelSeparator } from "@/components/ui/panel";
import { toast } from "@/components/ui/toaster";

type Member = { id: string; name: string; email: string; isAdmin: boolean; joined: string };
type PendingInvite = { id: string; email: string | null; isAdmin: boolean; expires: string; createdBy: string | null };
type Candidate = { id: string; name: string; email: string };

function Row({ children }: { children: React.ReactNode }) {
  return <li className="flex min-h-12 items-center gap-3 px-3 py-2">{children}</li>;
}

export function MembersPanel({
  workspaceId,
  workspaceName,
  currentUserId,
  members,
  invites,
  candidates,
}: {
  workspaceId: string;
  workspaceName: string;
  currentUserId: string;
  members: Member[];
  invites: PendingInvite[];
  candidates: Candidate[];
}) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-4">
      <Panel className="rise-in overflow-hidden">
        <PanelHeader
          title={
            <>
              Members <span className="text-faint ml-1">{members.length}</span>
            </>
          }
          actions={
            candidates.length ? (
              <Menu>
                <MenuTrigger render={<Button variant="ghost-muted" size="sm" disabled={pending} />}>
                  <PlusIcon /> Add existing
                </MenuTrigger>
                <MenuContent align="end" className="w-64">
                  <MenuLabel>People without access to {workspaceName}</MenuLabel>
                  {candidates.map((candidate) => (
                    <MenuItem
                      key={candidate.id}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await addMember({ workspaceId, userId: candidate.id });
                          if (result.ok) toast.success(`${candidate.name} can now open ${workspaceName}`);
                          else toast.error(result.error);
                        })
                      }
                    >
                      <Avatar name={candidate.name} seed={candidate.email} size="sm" />
                      <span className="min-w-0 flex-1 truncate">{candidate.name}</span>
                      <span className="text-faint truncate text-[11px]">{candidate.email}</span>
                    </MenuItem>
                  ))}
                </MenuContent>
              </Menu>
            ) : null
          }
        />
        <PanelSeparator />
        {members.length === 0 ? (
          <p className="text-dim px-3 py-6 text-center text-[13px]">No members yet. Invite someone to give them access to {workspaceName}.</p>
        ) : (
          <ul className="divide-y divide-[color:color-mix(in_oklab,var(--border)_6%,transparent)]">
            {members.map((member) => (
              <Row key={member.id}>
                <Avatar name={member.name} seed={member.email} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[13px] font-medium">
                    {member.name}
                    {member.id === currentUserId ? <span className="text-faint text-[11px] font-normal">you</span> : null}
                    {member.isAdmin ? <Badge tone="primary">Admin</Badge> : null}
                  </p>
                  <p className="text-faint truncate text-xs">{member.email}</p>
                </div>
                <span className="text-faint hidden text-xs sm:block">Joined {member.joined}</span>
                <Menu>
                  <MenuTrigger render={<Button variant="ghost-muted" size="icon" aria-label={`Actions for ${member.name}`} />}>
                    <DotsThreeIcon weight="bold" />
                  </MenuTrigger>
                  <MenuContent align="end">
                    <MenuItem
                      destructive
                      onClick={() =>
                        confirm({
                          title: `Remove ${member.name}?`,
                          description: `They will lose access to the apps in ${workspaceName}. Their other workspaces are not affected.`,
                          confirmLabel: "Remove",
                          destructive: true,
                          onConfirm: async () => {
                            const result = await removeMember({ workspaceId, userId: member.id });
                            if (result.ok) toast.success(`${member.name} removed`);
                            else toast.error(result.error);
                          },
                        })
                      }
                    >
                      <UserMinusIcon /> Remove from workspace
                    </MenuItem>
                  </MenuContent>
                </Menu>
              </Row>
            ))}
          </ul>
        )}
      </Panel>

      {invites.length ? (
        <Panel className="rise-in overflow-hidden" style={{ animationDelay: "60ms" }}>
          <PanelHeader
            title={
              <>
                Pending invites <span className="text-faint ml-1">{invites.length}</span>
              </>
            }
          />
          <PanelSeparator />
          <ul className="divide-y divide-[color:color-mix(in_oklab,var(--border)_6%,transparent)]">
            {invites.map((invite) => (
              <Row key={invite.id}>
                <span className="bg-fill text-dim inline-flex size-6 items-center justify-center rounded-full">
                  <ClockIcon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[13px] font-medium">
                    {invite.email ?? "Anyone with the link"}
                    {invite.isAdmin ? <Badge tone="primary">Admin</Badge> : null}
                  </p>
                  <p className="text-faint truncate text-xs">
                    Expires {invite.expires}
                    {invite.createdBy ? ` · by ${invite.createdBy}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost-muted"
                  size="sm"
                  onClick={() =>
                    confirm({
                      title: "Revoke this invite?",
                      description: "The link will stop working immediately.",
                      confirmLabel: "Revoke",
                      destructive: true,
                      onConfirm: async () => {
                        const result = await revokeInvite({ inviteId: invite.id });
                        if (result.ok) toast.success("Invite revoked");
                        else toast.error(result.error);
                      },
                    })
                  }
                >
                  <LinkBreakIcon /> Revoke
                </Button>
              </Row>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
