"use client";

import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "floating-popup-surface panel-surface flex w-[356px] items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] font-medium text-[color:var(--foreground)]",
          description: "text-dim text-xs font-normal",
          icon: "[&_svg]:size-4",
          success: "[&_[data-icon]]:text-[color:var(--link)]",
          error: "[&_[data-icon]]:text-[color:var(--destructive)]",
          actionButton: "ml-auto rounded-md bg-[color:var(--primary)] px-2 py-1 text-xs text-[color:var(--primary-foreground)]",
        },
      }}
    />
  );
}
