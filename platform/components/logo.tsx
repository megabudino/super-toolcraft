import { cn } from "@/lib/cn";
import { PLATFORM_NAME } from "@/lib/brand";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid size-6 shrink-0 grid-cols-3 place-items-center gap-[2px] rounded-md p-[5px]", className)}
      style={{ background: "var(--primary)" }}
    >
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className={cn("size-[3px] rounded-full bg-[color:var(--primary-foreground)]", index % 2 === 0 ? "opacity-95" : "opacity-35")} />
      ))}
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[13px] font-semibold tracking-tight", className)}>
      <LogoMark />
      {PLATFORM_NAME}
    </span>
  );
}
