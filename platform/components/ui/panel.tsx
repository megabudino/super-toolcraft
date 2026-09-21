import { cn } from "@/lib/cn";

/** Floating panel, like Toolcraft's properties panel (blurred, translucent). */
export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("floating-popup-surface panel-surface rounded-xl", className)} {...props} />;
}

export function PanelHeader({ title, actions, className }: { title: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-9 items-center justify-between gap-3 pr-1.5 pl-3", className)}>
      <p className="min-w-0 truncate text-[13px] font-medium">{title}</p>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  );
}

export function PanelSeparator({ className }: { className?: string }) {
  return <div className={cn("floating-popup-separator h-px", className)} />;
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "text-faint inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-sm border border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] px-1 font-sans text-[10px] font-medium",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Badge({ children, tone = "default", className }: { children: React.ReactNode; tone?: "default" | "primary" | "attention" | "destructive"; className?: string }) {
  const tones = {
    default: "bg-fill text-dim",
    primary: "bg-[color:color-mix(in_oklab,var(--accent)_18%,transparent)] text-[color:var(--link)]",
    attention: "bg-[color:color-mix(in_oklab,var(--attention)_16%,transparent)] text-[color:var(--attention)]",
    destructive: "bg-[color:color-mix(in_oklab,var(--destructive)_16%,transparent)] text-[color:var(--destructive)]",
  };
  return <span className={cn("inline-flex h-[18px] items-center rounded-md px-1.5 text-[11px] font-medium", tones[tone], className)}>{children}</span>;
}
