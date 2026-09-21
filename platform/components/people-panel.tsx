"use client";

import { DotsThreeIcon, ProhibitIcon, ShieldCheckIcon, ShieldSlashIcon, UserCheckIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { setUserAdmin, setUserDisabled } from "@/app/(app)/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Badge, Panel, PanelSeparator } from "@/components/ui/panel";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/cn";

type Person = { id: string; name: string; email: string; isAdmin: boolean; disabled: boolean; joined: string; workspaces: { slug: string; name: string }[] };

export function PeoplePanel({ people, currentUserId }: { people: Person[]; currentUserId: string }) {
  const confirm = useConfirm();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? people.filter((person) => `${person.name} ${person.email} ${person.workspaces.map((w) => w.name).join(" ")}`.toLowerCase().includes(needle)) : people;
  }, [people, query]);

  const run = async (promise: Promise<{ ok: boolean; error?: string }>, success: string) => {
    const result = await promise;
    if (result.ok) toast.success(success);
    else toast.error(result.error ?? "Something went wrong");
  };

  return (
    <Panel className="rise-in overflow-hidden">
      <div className="p-2">
        <Input placeholder={`Search ${people.length} people…`} value={query} onChange={(event) => setQuery(event.target.value)} className="h-7" />
      </div>
      <PanelSeparator />
      <ul className="divide-y divide-[color:color-mix(in_oklab,var(--border)_6%,transparent)]">
        {filtered.map((person) => (
          <li key={person.id} className={cn("flex min-h-13 items-center gap-3 px-3 py-2", person.disabled && "opacity-55")}>
            <Avatar name={person.name} seed={person.email} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-[13px] font-medium">
                {person.name}
                {person.id === currentUserId ? <span className="text-faint text-[11px] font-normal">you</span> : null}
                {person.isAdmin ? <Badge tone="primary">Admin</Badge> : null}
                {person.disabled ? <Badge tone="destructive">Disabled</Badge> : null}
              </p>
              <p className="text-faint truncate text-xs">{person.email}</p>
            </div>
            <div className="hidden max-w-[40%] flex-wrap justify-end gap-1 md:flex">
              {person.isAdmin ? (
                <span className="text-faint text-xs">All workspaces</span>
              ) : person.workspaces.length ? (
                person.workspaces.map((workspace) => (
                  <a key={workspace.slug} href={`/w/${workspace.slug}/members`}>
                    <Badge className="hover:text-[color:var(--foreground)]">{workspace.name}</Badge>
                  </a>
                ))
              ) : (
                <span className="text-faint text-xs">No workspaces</span>
              )}
            </div>
            {person.id !== currentUserId ? (
              <Menu>
                <MenuTrigger render={<Button variant="ghost-muted" size="icon" aria-label={`Actions for ${person.name}`} />}>
                  <DotsThreeIcon weight="bold" />
                </MenuTrigger>
                <MenuContent align="end" className="w-52">
                  {person.isAdmin ? (
                    <MenuItem onClick={() => run(setUserAdmin({ userId: person.id, isAdmin: false }), `${person.name} is now a member`)}>
                      <ShieldSlashIcon /> Remove administrator
                    </MenuItem>
                  ) : (
                    <MenuItem
                      onClick={() =>
                        confirm({
                          title: `Make ${person.name} an administrator?`,
                          description: "Administrators see every workspace, invite people and manage access.",
                          confirmLabel: "Make administrator",
                          onConfirm: () => run(setUserAdmin({ userId: person.id, isAdmin: true }), `${person.name} is now an administrator`),
                        })
                      }
                    >
                      <ShieldCheckIcon /> Make administrator
                    </MenuItem>
                  )}
                  <MenuSeparator />
                  {person.disabled ? (
                    <MenuItem onClick={() => run(setUserDisabled({ userId: person.id, disabled: false }), `${person.name} can sign in again`)}>
                      <UserCheckIcon /> Re-enable account
                    </MenuItem>
                  ) : (
                    <MenuItem
                      destructive
                      onClick={() =>
                        confirm({
                          title: `Disable ${person.name}?`,
                          description: "They are signed out everywhere and can't sign in until you re-enable them.",
                          confirmLabel: "Disable account",
                          destructive: true,
                          onConfirm: () => run(setUserDisabled({ userId: person.id, disabled: true }), `${person.name} disabled`),
                        })
                      }
                    >
                      <ProhibitIcon /> Disable account
                    </MenuItem>
                  )}
                </MenuContent>
              </Menu>
            ) : (
              <span className="size-7" />
            )}
          </li>
        ))}
        {filtered.length === 0 ? <li className="text-faint px-3 py-8 text-center text-[13px]">No one matches “{query}”.</li> : null}
      </ul>
    </Panel>
  );
}
