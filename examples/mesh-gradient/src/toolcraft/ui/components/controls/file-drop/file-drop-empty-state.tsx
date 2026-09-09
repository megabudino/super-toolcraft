"use client";

import { CloudArrowUpIcon } from "@phosphor-icons/react";

type FileDropEmptyStateProps = {
  description: string;
  onActivate: () => void;
  title: string;
};

export function FileDropEmptyState({
  description,
  onActivate,
  title,
}: FileDropEmptyStateProps): React.JSX.Element {
  return (
    <button
      className="flex w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-[calc(var(--radius-lg)-4px)] border-0 bg-transparent px-3 py-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
      onClick={onActivate}
      type="button"
    >
      <CloudArrowUpIcon
        className="size-6 flex-none text-[color:var(--muted-foreground)] transition-colors duration-150 ease-out group-data-[drag-over=true]/file-upload:text-[color:var(--link)]"
        weight="light"
      />
      <p className="m-0 flex max-w-full flex-col text-xs leading-tight text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)] transition-colors duration-150 ease-out group-hover/file-upload:text-[color:color-mix(in_oklab,var(--foreground)_85%,transparent)] group-data-[drag-over=true]/file-upload:text-[color:var(--link)]">
        <span>{title}</span>
        <span>{description}</span>
      </p>
    </button>
  );
}
