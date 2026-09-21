"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { cn } from "@/lib/cn";

export const Menu = MenuPrimitive.Root;
export const MenuTrigger = MenuPrimitive.Trigger;

// Mirrors toolcraft/ui/components/composites/dropdown-menu.tsx.
export function MenuContent({
  children,
  className,
  align = "start",
  side = "bottom",
  sideOffset = 6,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner className="isolate z-50 outline-none" align={align} side={side} sideOffset={sideOffset}>
        <MenuPrimitive.Popup
          className={cn(
            "floating-popup-surface z-50 max-h-(--available-height) min-w-44 origin-(--transform-origin) overflow-y-auto rounded-lg border p-1 text-xs font-medium tracking-tight text-[color:var(--popover-foreground)] duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export function MenuItem({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & { destructive?: boolean }) {
  return (
    <MenuPrimitive.Item
      className={cn(
        "relative flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 outline-hidden select-none data-highlighted:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0",
        destructive ? "text-[color:var(--destructive)]" : "[&_svg]:text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-dim px-2 py-1.5 text-[11px]">{children}</div>;
}

export function MenuSeparator() {
  return <MenuPrimitive.Separator className="floating-popup-separator -mx-1 my-1 h-px" />;
}
