import { cn } from "@/lib/cn";
import { coverStyle } from "@/lib/visual";

/** Generative cover for an app: a gradient "canvas" with the Toolcraft dot grid on top. */
export function AppCover({ seed, title, className, compact = false }: { seed: string; title: string; className?: string; compact?: boolean }) {
  return (
    <div aria-hidden data-title={title} className={cn("relative overflow-hidden", className)} style={coverStyle(seed)}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(circle at 1.5px 1.5px, rgb(255 255 255 / 0.22) 1.2px, transparent 0)",
          backgroundSize: compact ? "10px 10px" : "16px 16px",
        }}
      />
    </div>
  );
}
