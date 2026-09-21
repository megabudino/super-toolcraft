import { Wordmark } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="canvas-dots relative flex min-h-dvh flex-col">
      {/* Soft glow behind the panel, like a selected object on the canvas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(600px 400px at 50% 45%, oklch(1 0 0 / 0.04), transparent 70%)" }}
      />
      <header className="relative flex h-14 items-center px-5">
        <Wordmark />
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 pb-16">{children}</main>
    </div>
  );
}
