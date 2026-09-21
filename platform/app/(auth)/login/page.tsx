import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAnyUser, safeNextPath } from "@/lib/auth/users";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNextPath(next));

  if (!(await hasAnyUser())) {
    return (
      <AuthPanel
        title="This instance isn't set up yet"
        description={
          <>
            Open <code className="rounded bg-fill px-1 py-0.5 font-mono text-xs text-[color:var(--foreground)]">/setup?token=…</code> with the{" "}
            <code className="rounded bg-fill px-1 py-0.5 font-mono text-xs text-[color:var(--foreground)]">SETUP_TOKEN</code> from your environment to create the first administrator.
          </>
        }
      />
    );
  }

  return (
    <AuthPanel title="Welcome back" description="Sign in to open your apps." footer="Access is by invitation only.">
      <LoginForm next={safeNextPath(next)} />
    </AuthPanel>
  );
}
