import type { AppEntry } from "@/lib/apps";

export type ShellUser = { id: string; name: string; email: string; isAdmin: boolean };
export type ShellWorkspace = { id: string; slug: string; name: string; apps: AppEntry[] };
