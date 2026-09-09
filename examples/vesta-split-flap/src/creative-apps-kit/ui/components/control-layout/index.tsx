import * as React from "react";

import { FieldLabel, ScrollFade } from "../primitives";
import { cn } from "../../lib/utils";

type ControlFieldLabelActionContextValue = {
  action: React.ReactNode;
  label: string;
};

const ControlFieldLabelActionContext =
  React.createContext<ControlFieldLabelActionContextValue | null>(null);

export const panelSectionSurfaceClassName = [
  "flex flex-col py-4 first:border-t-0 data-[effects-template-section-actions]:first:border-t",
  "border-t border-[color:color-mix(in_oklab,var(--border)_8%,transparent)]",
].join(" ");

export function ControlSection({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>): React.JSX.Element {
  return (
    <section
      {...props}
      className={cn(
        panelSectionSurfaceClassName,
        "group/control-section gap-[14px]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ControlList({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-[14px]" data-control-list="">
      {children}
    </div>
  );
}

export function ControlInlineGroup({
  children,
  className,
  columns = 2,
  kind = "default",
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  columns?: number;
  kind?: "default" | "slider";
}): React.JSX.Element {
  return (
    <div
      {...props}
      className={cn(
        "grid min-w-0",
        kind === "slider" ? "gap-4" : "gap-2",
        className,
      )}
      data-control-layout="inline"
      data-control-layout-columns={columns}
      data-control-layout-group=""
      data-control-layout-kind={kind}
      style={{
        ...style,
        gridTemplateColumns: `repeat(${Math.max(
          1,
          Math.floor(columns),
        )}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

export function ControlSectionHeader({
  action,
  children,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 px-3">
      <div className="flex min-w-0 items-center gap-1 has-data-[icon-active=true]:[&_[data-slot=panel-title]]:text-[color:var(--link)]">
        {children}
      </div>
      {action}
    </div>
  );
}

export function ControlItem({
  children,
  flush = false,
}: {
  children: React.ReactNode;
  flush?: boolean;
}): React.JSX.Element {
  return <div className={cn("min-w-0", !flush && "px-3")}>{children}</div>;
}

export function PanelTitle({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <p
      className="m-0 text-2xs leading-none font-semibold text-[color:color-mix(in_oklab,var(--foreground)_75%,transparent)] uppercase transition-colors duration-150 ease-out"
      data-slot="panel-title"
    >
      {children}
    </p>
  );
}

export type ControlFieldLabelProps = React.ComponentProps<typeof FieldLabel> & {
  textClassName?: string;
};

export function ControlFieldLabelActionProvider({
  action,
  children,
  label,
}: ControlFieldLabelActionContextValue & {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <ControlFieldLabelActionContext.Provider value={{ action, label }}>
      {children}
    </ControlFieldLabelActionContext.Provider>
  );
}

export function useControlFieldLabelAction(
  label: string | undefined,
): React.ReactNode {
  const context = React.useContext(ControlFieldLabelActionContext);

  return context && context.label === label ? context.action : null;
}

export function ControlFieldLabel({
  children,
  className,
  textClassName,
  title: titleProp,
  ...props
}: ControlFieldLabelProps): React.JSX.Element {
  const title = getControlFieldLabelTitle(children);
  const displayChildren = getControlFieldLabelDisplayChildren(children, title);
  const labelAction = useControlFieldLabelAction(title);

  return (
    <span
      className={cn(
        "group/keyframe-control-label inline-flex min-w-0 max-w-full items-center gap-0.5 has-data-[icon-active=true]:[&_[data-slot=template-field-label-text]]:text-[color:var(--link)] has-data-[icon-active=true]:[&_[data-slot=template-field-label-text]]:opacity-100",
        className,
      )}
      data-control-field-label=""
      data-slot="field-label"
    >
      <FieldLabel
        className="min-w-0 max-w-full gap-0"
        title={titleProp ?? title}
        {...props}
      >
        <ScrollFade
          className="no-scrollbar min-w-0 max-w-full"
          containerClassName="min-w-0 max-w-full"
          preset="compact"
          side="right"
          watch={[title ?? ""]}
        >
          <span
            className={cn(
              "block whitespace-nowrap opacity-60",
              textClassName,
              "min-w-max",
            )}
            data-slot="template-field-label-text"
            title={title}
          >
            {displayChildren}
          </span>
        </ScrollFade>
      </FieldLabel>
      {labelAction}
    </span>
  );
}

function getControlFieldLabelTitle(
  children: React.ReactNode,
): string | undefined {
  const textParts = React.Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") {
      return String(child);
    }

    return null;
  });

  if (!textParts.length || textParts.some((part) => part === null)) {
    return undefined;
  }

  const title = textParts.join("").trim();

  return title || undefined;
}

function getControlFieldLabelDisplayChildren(
  children: React.ReactNode,
  title: string | undefined,
): React.ReactNode {
  if (!title || React.Children.count(children) !== 1) {
    return children;
  }

  const [child] = React.Children.toArray(children);

  if (typeof child !== "string" && typeof child !== "number") {
    return children;
  }

  const displayTitle = title.replace(/\s+\([^)]{1,80}\)\s*$/u, "").trim();

  return displayTitle || title;
}
