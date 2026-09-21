import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";

export function AuthPanel({
  title,
  description,
  icon,
  children,
  footer,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rise-in w-full max-w-[360px]", className)}>
      <Panel className="p-5">
        {icon ? <div className="mb-4">{icon}</div> : null}
        <h1 className="text-[15px] leading-tight font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-dim mt-1.5 text-[13px] leading-relaxed">{description}</p> : null}
        {children ? <div className="mt-5">{children}</div> : null}
      </Panel>
      {footer ? <div className="text-faint mt-4 text-center text-xs">{footer}</div> : null}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-[color:color-mix(in_oklab,var(--destructive)_25%,transparent)] bg-[color:color-mix(in_oklab,var(--destructive)_10%,transparent)] px-2.5 py-2 text-xs text-[color:color-mix(in_oklab,var(--destructive)_85%,white)]"
    >
      {message}
    </p>
  );
}
