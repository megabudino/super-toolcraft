"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { ShellUser, ShellWorkspace } from "./types";

type DialogState = { kind: "none" } | { kind: "invite"; workspaceId: string | null } | { kind: "new-workspace" } | { kind: "palette" };

type ShellContextValue = {
  user: ShellUser;
  workspaces: ShellWorkspace[];
  dialog: DialogState;
  openInvite: (workspaceId?: string | null) => void;
  openNewWorkspace: () => void;
  openPalette: () => void;
  closeDialog: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ user, workspaces, children }: { user: ShellUser; workspaces: ShellWorkspace[]; children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const openInvite = useCallback((workspaceId: string | null = null) => setDialog({ kind: "invite", workspaceId }), []);
  const openNewWorkspace = useCallback(() => setDialog({ kind: "new-workspace" }), []);
  const openPalette = useCallback(() => setDialog({ kind: "palette" }), []);
  const closeDialog = useCallback(() => setDialog({ kind: "none" }), []);
  const value = useMemo(
    () => ({ user, workspaces, dialog, openInvite, openNewWorkspace, openPalette, closeDialog }),
    [user, workspaces, dialog, openInvite, openNewWorkspace, openPalette, closeDialog],
  );
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellContextValue {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside ShellProvider");
  return value;
}

/** The workspace in the current URL (/w/<slug>/…), if any. */
export function useCurrentWorkspace(pathname: string): ShellWorkspace | undefined {
  const { workspaces } = useShell();
  const slug = pathname.match(/^\/w\/([^/]+)/)?.[1];
  return workspaces.find((workspace) => workspace.slug === slug);
}
