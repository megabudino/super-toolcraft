"use client";

import {
  CaretUpDownIcon,
  CheckIcon,
  GearSixIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SignOutIcon,
  SquaresFourIcon,
  UserPlusIcon,
  UsersIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";

import { LogoMark } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Kbd, PanelSeparator } from "@/components/ui/panel";
import { PLATFORM_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

import { useCurrentWorkspace, useShell } from "./shell-context";

function NavItem({ href, icon, children, active, trailing }: { href: string; icon: React.ReactNode; children: React.ReactNode; active: boolean; trailing?: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-7 items-center gap-2 rounded-md px-2 text-[13px] font-medium transition-colors [&_svg]:size-3.5 [&_svg]:shrink-0",
        active ? "bg-[color:color-mix(in_oklab,var(--foreground)_8%,transparent)] text-[color:var(--foreground)]" : "text-dim hover-fill hover:text-[color:var(--foreground)]",
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </Link>
  );
}

function WorkspaceSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { workspaces, user, openNewWorkspace } = useShell();
  const current = useCurrentWorkspace(pathname);

  return (
    <Menu>
      <MenuTrigger className="hover-fill data-popup-open:bg-fill flex h-10 w-full items-center gap-2 rounded-lg px-1.5 text-left outline-none">
        {current ? <Avatar name={current.name} seed={current.slug} square /> : <LogoMark />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold tracking-tight">{current?.name ?? PLATFORM_NAME}</span>
          <span className="text-faint block truncate text-[11px]">
            {current ? `${current.apps.length} ${current.apps.length === 1 ? "app" : "apps"}` : `${workspaces.length} workspaces`}
          </span>
        </span>
        <CaretUpDownIcon className="text-faint size-3.5" />
      </MenuTrigger>
      <MenuContent className="w-60">
        <MenuLabel>Workspaces</MenuLabel>
        {workspaces.map((workspace) => (
          <MenuItem key={workspace.id} onClick={() => router.push(`/w/${workspace.slug}`)}>
            <Avatar name={workspace.name} seed={workspace.slug} size="sm" square />
            <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
            {workspace.id === current?.id ? <CheckIcon weight="bold" /> : null}
          </MenuItem>
        ))}
        {workspaces.length === 0 ? <div className="text-faint px-2 py-1.5">No workspaces yet</div> : null}
        {user.isAdmin ? (
          <>
            <MenuSeparator />
            <MenuItem onClick={openNewWorkspace}>
              <PlusIcon /> New workspace
            </MenuItem>
          </>
        ) : null}
      </MenuContent>
    </Menu>
  );
}

function UserMenu() {
  const { user } = useShell();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <>
      <form ref={formRef} action="/logout" method="post" hidden />
      <Menu>
      <MenuTrigger className="hover-fill data-popup-open:bg-fill flex h-10 w-full items-center gap-2 rounded-lg px-1.5 text-left outline-none">
        <Avatar name={user.name} seed={user.email} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{user.name}</span>
          <span className="text-faint block truncate text-[11px]">{user.isAdmin ? "Administrator" : user.email}</span>
        </span>
      </MenuTrigger>
      <MenuContent side="top" className="w-56">
        <MenuLabel>{user.email}</MenuLabel>
        <MenuSeparator />
        <MenuItem onClick={() => formRef.current?.requestSubmit()}>
          <SignOutIcon /> Sign out
        </MenuItem>
      </MenuContent>
      </Menu>
    </>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, workspaces, openPalette, openInvite } = useShell();
  const current = useCurrentWorkspace(pathname);

  return (
    <nav className="flex h-full flex-col gap-2 p-2" onClickCapture={(event) => (event.target as HTMLElement).closest("a") && onNavigate?.()}>
      <WorkspaceSwitcher />

      <button
        type="button"
        onClick={openPalette}
        className="text-faint flex h-7 items-center gap-2 rounded-md border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_5%,transparent)] px-2 text-[13px] transition-colors hover:border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] hover:text-[color:var(--foreground)]"
      >
        <MagnifyingGlassIcon className="size-3.5" />
        <span className="flex-1 text-left">Search</span>
        <Kbd>⌘K</Kbd>
      </button>

      {current ? (
        <div className="grid gap-0.5">
          <NavItem href={`/w/${current.slug}`} icon={<SquaresFourIcon />} active={pathname === `/w/${current.slug}`} trailing={<span className="text-faint text-[11px]">{current.apps.length}</span>}>
            Apps
          </NavItem>
          {user.isAdmin ? (
            <>
              <NavItem href={`/w/${current.slug}/members`} icon={<UsersIcon />} active={pathname.startsWith(`/w/${current.slug}/members`)}>
                Members
              </NavItem>
              <NavItem href={`/w/${current.slug}/settings`} icon={<GearSixIcon />} active={pathname.startsWith(`/w/${current.slug}/settings`)}>
                Settings
              </NavItem>
            </>
          ) : null}
        </div>
      ) : null}

      {workspaces.length > 1 ? (
        <>
          <PanelSeparator className="mx-1 my-1" />
          <p className="text-faint px-2 text-[11px] font-medium">Workspaces</p>
          <div className="-mr-1 grid max-h-64 gap-0.5 overflow-y-auto pr-1">
            {workspaces.map((workspace) => (
              <NavItem
                key={workspace.id}
                href={`/w/${workspace.slug}`}
                icon={<Avatar name={workspace.name} seed={workspace.slug} size="xs" square />}
                active={false}
                trailing={workspace.id === current?.id ? <span className="size-1.5 rounded-full bg-[color:var(--link)]" /> : null}
              >
                {workspace.name}
              </NavItem>
            ))}
          </div>
        </>
      ) : null}

      {user.isAdmin ? (
        <>
          <PanelSeparator className="mx-1 my-1" />
          <p className="text-faint px-2 text-[11px] font-medium">Administration</p>
          <div className="grid gap-0.5">
            <NavItem href="/people" icon={<UsersThreeIcon />} active={pathname.startsWith("/people")}>
              People
            </NavItem>
            <button
              type="button"
              onClick={() => openInvite(current?.id ?? null)}
              className="text-dim hover-fill flex h-7 items-center gap-2 rounded-md px-2 text-[13px] font-medium hover:text-[color:var(--foreground)]"
            >
              <UserPlusIcon className="size-3.5" /> Invite people
            </button>
          </div>
        </>
      ) : null}

      <div className="mt-auto">
        <UserMenu />
      </div>
    </nav>
  );
}
