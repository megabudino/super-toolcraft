import { eq } from "drizzle-orm";
import type { Metadata } from "next";

import { db, schema } from "@/db/client";
import { AuthPanel } from "@/components/auth/auth-panel";
import { LogoMark } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { AppCover } from "@/components/app-cover";
import { readManifest } from "@/lib/apps";
import { getCurrentUser } from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/auth/users";
import { PLATFORM_NAME } from "@/lib/brand";
import { findValidInvite } from "@/lib/invites";

import { AcceptForm, JoinForm } from "./invite-forms";

export const metadata: Metadata = { title: "Invitation" };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = await findValidInvite(token);
  if (!found) {
    return (
      <AuthPanel
        title="This invite link doesn't work"
        description="It has expired, was already used or was revoked. Ask the person who invited you for a new link."
      />
    );
  }

  const { invite, workspace } = found;
  const [inviter] = invite.createdBy
    ? await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, invite.createdBy)).limit(1)
    : [];
  const appSlugs = workspace
    ? (await db.select({ slug: schema.workspaceApps.appSlug }).from(schema.workspaceApps).where(eq(schema.workspaceApps.workspaceId, workspace.id))).map((row) => row.slug)
    : [];
  const apps = (await readManifest()).apps.filter((app) => appSlugs.includes(app.slug));
  const user = await getCurrentUser();
  const targetName = workspace?.name ?? PLATFORM_NAME;
  const defaultMode = invite.email && (await findUserByEmail(invite.email)) ? "existing" : "new";

  const header = (
    <div className="flex items-center gap-3">
      {workspace ? <Avatar name={workspace.name} seed={workspace.slug} size="lg" square /> : <LogoMark className="size-9 gap-[3px] rounded-lg p-2" />}
      <div className="min-w-0">
        <p className="text-faint text-[11px] font-medium tracking-wide uppercase">Invitation</p>
        <p className="truncate text-[13px] font-medium">{targetName}</p>
      </div>
    </div>
  );

  const preview = apps.length ? (
    <div className="bg-fill mb-5 rounded-lg p-2">
      <div className="flex gap-1.5">
        {apps.slice(0, 4).map((app) => (
          <AppCover key={app.slug} seed={app.slug} title={app.title} className="h-10 flex-1 rounded-md" compact />
        ))}
      </div>
      <p className="text-dim mt-2 px-0.5 text-xs">
        {apps.length === 1 ? apps[0].title : `${apps.length} apps`} {apps.length === 1 ? "is" : "are"} waiting for you
        {apps.length > 1 ? `: ${apps.slice(0, 3).map((app) => app.title).join(", ")}${apps.length > 3 ? "…" : ""}` : ""}.
      </p>
    </div>
  ) : null;

  const description = (
    <>
      {inviter ? <span className="text-[color:var(--foreground)]">{inviter.name}</span> : "You"} invited you to{" "}
      {workspace ? (
        <>
          the <span className="text-[color:var(--foreground)]">{workspace.name}</span> workspace
        </>
      ) : (
        <>join {PLATFORM_NAME}</>
      )}
      {invite.isAdmin ? " as an administrator" : ""}.
    </>
  );

  if (user) {
    return (
      <AuthPanel icon={header} title={`Join ${targetName}`} description={description} footer={<>Signed in as {user.email}. <form action="/logout" method="post" className="inline"><input type="hidden" name="next" value={`/invite/${token}`} /><button className="underline underline-offset-2 hover:text-[color:var(--foreground)]">Use another account</button></form></>}>
        {preview}
        <JoinForm token={token} label={`Join ${targetName}`} />
      </AuthPanel>
    );
  }

  return (
    <AuthPanel icon={header} title={`Join ${targetName}`} description={description} footer="This link works once and expires after 7 days.">
      {preview}
      <AcceptForm token={token} lockedEmail={invite.email} defaultMode={defaultMode} />
    </AuthPanel>
  );
}
