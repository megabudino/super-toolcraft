import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthPanel } from "@/components/auth/auth-panel";
import { LogoMark } from "@/components/logo";
import { hasAnyUser } from "@/lib/auth/users";
import { PLATFORM_NAME } from "@/lib/brand";

import { SetupWizard } from "./setup-wizard";

export const metadata: Metadata = { title: "Set up" };
export const dynamic = "force-dynamic";

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  if (!process.env.SETUP_TOKEN || (await hasAnyUser())) notFound();
  const { token = "" } = await searchParams;

  return (
    <AuthPanel
      icon={<LogoMark className="size-9 gap-[3px] rounded-lg p-2" />}
      title={`Set up ${PLATFORM_NAME}`}
      description="Create the administrator account. This page disappears once the first user exists."
    >
      <SetupWizard token={token} />
    </AuthPanel>
  );
}
