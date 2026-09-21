import { cn } from "@/lib/cn";
import { hueFor, initials } from "@/lib/visual";

export function Avatar({ name, seed, size = "md", square = false, className }: { name: string; seed?: string; size?: "xs" | "sm" | "md" | "lg"; square?: boolean; className?: string }) {
  const hue = hueFor(seed ?? name);
  const sizes = { xs: "size-4 text-[7px]", sm: "size-5 text-[9px]", md: "size-6 text-[10px]", lg: "size-9 text-[13px]" };
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center font-semibold tracking-tight text-white/90", square ? "rounded-md" : "rounded-full", sizes[size], className)}
      style={{ background: `linear-gradient(135deg, oklch(0.6 0.15 ${hue}), oklch(0.45 0.14 ${(hue + 50) % 360}))` }}
    >
      {initials(name)}
    </span>
  );
}
