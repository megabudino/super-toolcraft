"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

// Mirrors toolcraft/ui/components/composites/dialog.tsx.
export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 isolate z-50 bg-black/72 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
      <DialogPrimitive.Popup
        className={cn(
          "floating-popup-surface fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border p-4 text-[13px] text-[color:var(--popover-foreground)] duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 sm:max-w-sm",
          className,
        )}
      >
        <div className="grid gap-1 pr-6">
          <DialogPrimitive.Title className="text-sm leading-tight font-semibold tracking-tight">{title}</DialogPrimitive.Title>
          {description ? <DialogPrimitive.Description className="text-dim text-xs leading-relaxed">{description}</DialogPrimitive.Description> : null}
        </div>
        {children}
        <DialogPrimitive.Close
          aria-label="Close"
          className="text-dim hover-fill absolute top-3 right-3 inline-flex size-6 items-center justify-center rounded-md hover:text-[color:var(--foreground)]"
        >
          <XIcon className="size-3.5" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}
