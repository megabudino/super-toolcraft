import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";

import { AppCover } from "@/components/app-cover";
import type { AppEntry } from "@/lib/apps";

export function AppCard({ app, index = 0 }: { app: AppEntry; index?: number }) {
  return (
    // Plain <a>: the app is a separate SPA served by the /a route handler.
    <a
      href={`/a/${app.slug}`}
      className="group rise-in floating-popup-surface panel-surface block overflow-hidden rounded-xl border transition-[transform,border-color] duration-200 outline-none hover:-translate-y-0.5 hover:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_60%,transparent)]"
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
    >
      <div className="p-1.5 pb-0">
        <AppCover seed={app.slug} title={app.title} className="aspect-[16/9] rounded-lg transition-[filter] duration-300 group-hover:brightness-110" />
      </div>
      <div className="flex items-start gap-2 px-3 pt-2.5 pb-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{app.title}</p>
          <p className="text-faint mt-0.5 line-clamp-2 min-h-8 text-xs leading-4">{app.description || `/a/${app.slug}`}</p>
        </div>
        <span className="text-faint mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors group-hover:bg-[color:var(--primary)] group-hover:text-[color:var(--primary-foreground)]">
          <ArrowUpRightIcon weight="bold" className="size-3" />
        </span>
      </div>
    </a>
  );
}
