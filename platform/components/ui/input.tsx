"use client";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { cn } from "@/lib/cn";

// Mirrors toolcraft/ui/lib/input-control-style.ts (lg size for forms).
export const inputClassName =
  "h-8 w-full min-w-0 rounded-lg border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_5%,transparent)] bg-clip-padding px-2.5 text-[13px] text-[color:var(--foreground)] transition-colors outline-none placeholder:text-[color:var(--muted-foreground)] [&:not(:focus):hover]:border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] focus:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] focus:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 read-only:text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)] aria-invalid:border-[color:color-mix(in_oklab,var(--destructive)_50%,transparent)]";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(inputClassName, className)} {...props} />;
}

export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input type={visible ? "text" : "password"} className={cn(inputClassName, "pr-8", className)} {...props} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="text-dim absolute inset-y-0 right-0 flex w-8 items-center justify-center hover:text-[color:var(--foreground)]"
      >
        {visible ? <EyeSlashIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
      </button>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  aside,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-xs font-medium text-[color:color-mix(in_oklab,var(--foreground)_80%,transparent)]">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {hint ? <p className="text-faint text-xs">{hint}</p> : null}
    </div>
  );
}
