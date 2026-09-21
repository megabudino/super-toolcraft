"use client";

import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";

export function CopySnippet({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-1 text-left">
      {label ? <p className="text-faint text-[11px] font-medium">{label}</p> : null}
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="group flex w-full items-center gap-2 rounded-lg border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-black/30 px-2.5 py-2 text-left font-mono text-[11px] text-[color:color-mix(in_oklab,var(--foreground)_85%,transparent)] hover:border-[color:color-mix(in_oklab,var(--border)_25%,transparent)]"
      >
        <span className="min-w-0 flex-1 break-words">{value}</span>
        {copied ? <CheckIcon weight="bold" className="size-3.5 shrink-0 text-[color:var(--link)]" /> : <CopyIcon className="text-faint size-3.5 shrink-0 group-hover:text-[color:var(--foreground)]" />}
      </button>
    </div>
  );
}
