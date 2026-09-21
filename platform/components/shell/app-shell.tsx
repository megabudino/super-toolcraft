"use client";

import { ListIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { Wordmark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ConfirmProvider } from "@/components/ui/confirm";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { CommandPalette } from "./command-palette";
import { InviteDialog } from "./invite-dialog";
import { NewWorkspaceDialog } from "./new-workspace-dialog";
import { ShellProvider, useShell } from "./shell-context";
import { Sidebar } from "./sidebar";
import type { ShellUser, ShellWorkspace } from "./types";

function MobileBar() {
  const [open, setOpen] = useState(false);
  const { openPalette } = useShell();
  return (
    <div className="floating-popup-surface panel-surface sticky top-2 z-30 mx-2 mt-2 flex h-11 items-center justify-between rounded-xl pr-1.5 pl-3 md:hidden">
      <Wordmark />
      <div className="flex items-center gap-1">
        <Button variant="ghost-muted" size="icon" aria-label="Search" onClick={openPalette}>
          <MagnifyingGlassIcon />
        </Button>
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Trigger render={<Button variant="ghost-muted" size="icon" aria-label="Menu" />}>
            <ListIcon />
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop className="fixed inset-0 z-40 bg-black/60 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
            <DialogPrimitive.Popup className="floating-popup-surface panel-surface fixed inset-y-2 left-2 z-50 w-[min(280px,calc(100%-3rem))] rounded-xl border outline-none data-open:animate-in data-open:slide-in-from-left-4 data-closed:animate-out data-closed:fade-out-0">
              <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
              <Sidebar onNavigate={() => setOpen(false)} />
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </div>
    </div>
  );
}

export function AppShell({ user, workspaces, children }: { user: ShellUser; workspaces: ShellWorkspace[]; children: React.ReactNode }) {
  return (
    <ShellProvider user={user} workspaces={workspaces}>
      <ConfirmProvider>
      <div className="canvas-dots min-h-dvh">
        <aside className="floating-popup-surface panel-surface fixed inset-y-2 left-2 z-30 hidden w-60 rounded-xl md:block">
          <Sidebar />
        </aside>
        <MobileBar />
        <main className="md:pl-64">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
      <CommandPalette />
      <InviteDialog />
      <NewWorkspaceDialog />
      </ConfirmProvider>
    </ShellProvider>
  );
}
