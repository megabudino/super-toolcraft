"use client";

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";
import { useActionState, useRef, useState } from "react";

import { FormError } from "@/components/auth/auth-panel";
import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-rules";
import { cn } from "@/lib/cn";
import { slugify } from "@/lib/slug";

import { setupAction } from "./actions";

const STEPS = ["Your account", "First workspace"] as const;

function Steps({ current }: { current: number }) {
  return (
    <ol className="mb-5 flex items-center gap-2 text-[11px] font-medium">
      {STEPS.map((label, index) => (
        <li key={label} className={cn("flex items-center gap-1.5", index <= current ? "text-[color:var(--foreground)]" : "text-faint")}>
          <span
            className={cn(
              "inline-flex size-4 items-center justify-center rounded-full text-[10px]",
              index < current ? "bg-[color:var(--accent)] text-white" : index === current ? "bg-[color:color-mix(in_oklab,var(--foreground)_15%,transparent)]" : "bg-fill",
            )}
          >
            {index < current ? <CheckIcon weight="bold" className="size-2.5" /> : index + 1}
          </span>
          {label}
          {index < STEPS.length - 1 ? <span className="bg-fill ml-1 h-px w-6" /> : null}
        </li>
      ))}
    </ol>
  );
}

export function SetupWizard({ token }: { token: string }) {
  const [state, action] = useActionState(setupAction, undefined);
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState(state?.values?.workspaceName ?? "");
  const [slugEdited, setSlugEdited] = useState(false);
  const [workspaceSlug, setWorkspaceSlug] = useState(state?.values?.workspaceSlug ?? "");
  const accountRef = useRef<HTMLDivElement>(null);

  const next = () => {
    const invalid = accountRef.current?.querySelector<HTMLInputElement>("input:invalid");
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    setStep(1);
  };

  return (
    <form action={action} className="grid gap-4">
      <Steps current={step} />

      <div ref={accountRef} className={cn("grid gap-4", step !== 0 && "hidden")}>
        {token ? <input type="hidden" name="token" value={token} /> : (
          <Field label="Setup token" htmlFor="token" hint="The SETUP_TOKEN value from your environment.">
            <PasswordInput id="token" name="token" required />
          </Field>
        )}
        <Field label="Your name" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" required autoFocus defaultValue={state?.values?.name} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} />
        </Field>
        <Field label="Password" htmlFor="password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
          <PasswordInput id="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
        </Field>
        <FormError message={state?.error} />
        <Button size="lg" className="w-full" onClick={next}>
          Continue <ArrowRightIcon weight="bold" className="size-3.5" />
        </Button>
      </div>

      <div className={cn("grid gap-4", step !== 1 && "hidden")}>
        <p className="text-dim -mt-1 text-[13px] leading-relaxed">
          Workspaces group apps and people. Create one per client, e.g. <span className="text-[color:var(--foreground)]">Acme</span>. You can skip this and do it later.
        </p>
        <Field label="Workspace name" htmlFor="workspaceName">
          <Input
            id="workspaceName"
            name="workspaceName"
            placeholder="Acme Inc."
            value={workspaceName}
            onChange={(event) => {
              setWorkspaceName(event.target.value);
              if (!slugEdited) setWorkspaceSlug(slugify(event.target.value));
            }}
          />
        </Field>
        <Field label="URL" htmlFor="workspaceSlug">
          <div className="flex items-center rounded-lg border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_5%,transparent)] pl-2.5 focus-within:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]">
            <span className="text-faint text-[13px]">/w/</span>
            <input
              id="workspaceSlug"
              name="workspaceSlug"
              className="h-8 min-w-0 flex-1 bg-transparent pr-2.5 text-[13px] outline-none placeholder:text-[color:var(--muted-foreground)]"
              placeholder="acme"
              pattern="[a-z][a-z0-9\-]*"
              value={workspaceSlug}
              onChange={(event) => {
                setSlugEdited(true);
                setWorkspaceSlug(slugify(event.target.value) || event.target.value.toLowerCase());
              }}
            />
          </div>
        </Field>
        <FormError message={state?.error} />
        <div className="grid gap-2">
          <SubmitButton>{workspaceSlug ? "Create account and workspace" : "Create account"}</SubmitButton>
          <Button variant="ghost-muted" onClick={() => setStep(0)}>
            <ArrowLeftIcon className="size-3.5" /> Back
          </Button>
        </div>
      </div>
    </form>
  );
}
