export function PageHeader({ title, description, actions, eyebrow }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <header className="rise-in mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <div className="text-faint mb-2 flex items-center gap-2 text-xs font-medium">{eyebrow}</div> : null}
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-dim mt-1 max-w-xl text-[13px] leading-relaxed">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({ icon, title, children, actions }: { icon: React.ReactNode; title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="rise-in floating-popup-surface panel-surface flex flex-col items-center rounded-xl border-dashed px-6 py-14 text-center">
      <div className="bg-fill text-dim mb-4 flex size-10 items-center justify-center rounded-xl [&_svg]:size-5">{icon}</div>
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {children ? <div className="text-dim mt-1.5 max-w-sm text-[13px] leading-relaxed">{children}</div> : null}
      {actions ? <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
