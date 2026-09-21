"use client";

import { useActionState, useState } from "react";

import { FormError } from "@/components/auth/auth-panel";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-rules";
import { cn } from "@/lib/cn";

import { acceptInvite, joinWithCurrentAccount } from "./actions";

export function JoinForm({ token, label }: { token: string; label: string }) {
  const [state, action] = useActionState(joinWithCurrentAccount, undefined);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="token" value={token} />
      <FormError message={state?.error} />
      <SubmitButton>{label}</SubmitButton>
    </form>
  );
}

export function AcceptForm({ token, lockedEmail, defaultMode }: { token: string; lockedEmail: string | null; defaultMode: "new" | "existing" }) {
  const [state, action] = useActionState(acceptInvite, undefined);
  const [mode, setMode] = useState<"new" | "existing">(defaultMode);
  const [lastState, setLastState] = useState(state);
  // Follow the server's suggestion (e.g. "this email already has an account").
  if (state !== lastState) {
    setLastState(state);
    if (state?.values?.mode === "new" || state?.values?.mode === "existing") setMode(state.values.mode);
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="mode" value={mode} />

      <div role="tablist" className="bg-fill grid grid-cols-2 gap-1 rounded-lg p-0.5">
        {(
          [
            ["new", "Create account"],
            ["existing", "I have an account"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              "h-7 rounded-md text-xs font-medium transition-colors",
              mode === value ? "bg-[color:color-mix(in_oklab,var(--foreground)_12%,transparent)] text-[color:var(--foreground)]" : "text-dim hover:text-[color:var(--foreground)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Field label="Email" htmlFor="email">
        {lockedEmail ? (
          <Input id="email" value={lockedEmail} readOnly />
        ) : (
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} />
        )}
      </Field>
      {mode === "new" ? (
        <Field label="Your name" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" required defaultValue={state?.values?.name} />
        </Field>
      ) : null}
      <Field label="Password" htmlFor="password" hint={mode === "new" ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}>
        <PasswordInput
          key={mode}
          id="password"
          name="password"
          autoComplete={mode === "new" ? "new-password" : "current-password"}
          minLength={mode === "new" ? MIN_PASSWORD_LENGTH : undefined}
          required
        />
      </Field>
      <FormError message={state?.error} />
      <SubmitButton>{mode === "new" ? "Create account and join" : "Sign in and join"}</SubmitButton>
    </form>
  );
}
