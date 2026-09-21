import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";

import { cn } from "@/lib/cn";

// Mirrors toolcraft/ui/components/primitives/button.tsx (variants and sizes).
export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-transparent font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-[color:var(--ring)] focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_30%,transparent)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:color-mix(in_oklab,var(--primary)_88%,black)] active:bg-[color:color-mix(in_oklab,var(--primary)_82%,black)]",
        outline:
          "border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] hover:border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--input)_15%,transparent)] data-popup-open:bg-[color:color-mix(in_oklab,var(--input)_15%,transparent)]",
        ghost:
          "text-[color:var(--foreground)] hover:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] data-popup-open:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)]",
        "ghost-muted":
          "text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] hover:text-[color:var(--foreground)] data-popup-open:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] data-popup-open:text-[color:var(--foreground)]",
        destructive:
          "border-[color:color-mix(in_oklab,var(--destructive)_30%,transparent)] bg-[color:color-mix(in_oklab,var(--destructive)_15%,transparent)] text-[color:var(--destructive)] hover:border-[color:color-mix(in_oklab,var(--destructive)_60%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--destructive)_25%,transparent)]",
        solid:
          "bg-[color:color-mix(in_oklab,var(--foreground)_90%,transparent)] text-[color:var(--background)] hover:bg-[color:var(--foreground)]",
      },
      size: {
        sm: "h-6 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        default: "h-7 px-2.5 text-[13px] leading-[1.125rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[34px] px-3.5 text-sm tracking-tight [&_svg:not([class*='size-'])]:size-4",
        icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-6 [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type Variants = VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: React.ComponentProps<"button"> & Variants) {
  return <button type="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function ButtonLink({ className, variant, size, ...props }: React.ComponentProps<typeof Link> & Variants) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("size-3.5 animate-spin", className)} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
