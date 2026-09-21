"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ArrowSquareOutIcon, MagnifyingGlassIcon, PlusIcon, UserPlusIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppCover } from "@/components/app-cover";
import { Avatar } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/panel";
import { cn } from "@/lib/cn";

import { useShell } from "./shell-context";

type Item = { id: string; group: string; label: string; hint?: string; icon: React.ReactNode; run: () => void };

export function CommandPalette() {
  const router = useRouter();
  const { user, workspaces, dialog, closeDialog, openPalette, openInvite, openNewWorkspace } = useShell();
  const open = dialog.kind === "palette";
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) closeDialog();
        else openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openPalette, closeDialog]);

  const items = useMemo<Item[]>(() => {
    const seen = new Set<string>();
    const apps: Item[] = [];
    for (const workspace of workspaces) {
      for (const app of workspace.apps) {
        if (seen.has(app.slug)) continue;
        seen.add(app.slug);
        apps.push({
          id: `app:${app.slug}`,
          group: "Apps",
          label: app.title,
          hint: workspace.name,
          icon: <AppCover seed={app.slug} title={app.title} compact className="size-5 rounded-[5px]" />,
          run: () => {
            window.location.href = `/a/${app.slug}`;
          },
        });
      }
    }
    const spaces: Item[] = workspaces.map((workspace) => ({
      id: `ws:${workspace.id}`,
      group: "Workspaces",
      label: workspace.name,
      hint: `${workspace.apps.length} ${workspace.apps.length === 1 ? "app" : "apps"}`,
      icon: <Avatar name={workspace.name} seed={workspace.slug} size="sm" square />,
      run: () => router.push(`/w/${workspace.slug}`),
    }));
    const actions: Item[] = user.isAdmin
      ? [
          { id: "act:invite", group: "Actions", label: "Invite people", icon: <UserPlusIcon />, run: () => openInvite(null) },
          { id: "act:new-ws", group: "Actions", label: "New workspace", icon: <PlusIcon />, run: openNewWorkspace },
          { id: "act:people", group: "Actions", label: "Manage people", icon: <UsersThreeIcon />, run: () => router.push("/people") },
        ]
      : [];
    return [...apps, ...spaces, ...actions];
  }, [workspaces, user.isAdmin, router, openInvite, openNewWorkspace]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => `${item.label} ${item.hint ?? ""}`.toLowerCase().includes(needle));
  }, [items, query]);

  const select = (item: Item | undefined) => {
    if (!item) return;
    // Actions may open another dialog; close the palette first.
    closeDialog();
    item.run();
  };

  const groups = [...new Set(filtered.map((item) => item.group))];

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) closeDialog();
        setQuery("");
        setActive(0);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="floating-popup-surface panel-surface fixed top-[18vh] left-1/2 z-50 w-[min(560px,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <div className="flex h-11 items-center gap-2 border-b border-[color:color-mix(in_oklab,var(--border)_8%,transparent)] px-3.5">
            <MagnifyingGlassIcon className="text-faint size-4" />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((index) => Math.min(index + 1, filtered.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((index) => Math.max(index - 1, 0));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  select(filtered[active]);
                }
              }}
              placeholder="Search apps, workspaces and actions…"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--muted-foreground)]"
            />
            <Kbd>Esc</Kbd>
          </div>
          <div ref={listRef} className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5">
            {filtered.length === 0 ? <p className="text-faint px-3 py-8 text-center text-[13px]">Nothing matches “{query}”.</p> : null}
            {groups.map((group) => (
              <div key={group} className="mb-1">
                <p className="text-faint px-2 pt-2 pb-1 text-[11px] font-medium">{group}</p>
                {filtered
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const index = filtered.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseMove={() => setActive(index)}
                        onClick={() => select(item)}
                        className={cn(
                          "flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] font-medium [&>svg]:text-faint [&>svg]:size-4",
                          index === active && "bg-[color:color-mix(in_oklab,var(--foreground)_7%,transparent)]",
                        )}
                      >
                        {item.icon}
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.hint ? <span className="text-faint truncate text-xs">{item.hint}</span> : null}
                        {item.group === "Apps" && index === active ? <ArrowSquareOutIcon className="text-faint size-3.5" /> : null}
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
          <div className="text-faint flex items-center gap-3 border-t border-[color:color-mix(in_oklab,var(--border)_8%,transparent)] px-3.5 py-2 text-[11px]">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> open
            </span>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
