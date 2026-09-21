"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/cn";

// Mirrors toolcraft/ui/components/primitives/switch.tsx (default size).
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-4 w-[28px] shrink-0 cursor-pointer items-center rounded-full bg-[color:color-mix(in_oklab,var(--input)_20%,transparent)] p-px transition-all outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_40%,transparent)] data-checked:bg-[color:var(--accent)] data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 rounded-full bg-[color:var(--background)] transition-transform data-checked:translate-x-[calc(100%-2px)]" />
    </SwitchPrimitive.Root>
  );
}
