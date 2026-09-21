"use client";

import { useActionState } from "react";

import { FormError } from "@/components/auth/auth-panel";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, Input, PasswordInput } from "@/components/ui/input";

import { loginAction } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" autoFocus required defaultValue={state?.values?.email} key={state?.values?.email} />
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </Field>
      <FormError message={state?.error} />
      <SubmitButton>Sign in</SubmitButton>
    </form>
  );
}
