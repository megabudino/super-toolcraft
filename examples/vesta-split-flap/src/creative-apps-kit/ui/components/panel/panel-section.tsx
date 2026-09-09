"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import {
  ControlItem,
  ControlList,
  ControlSection,
  ControlSectionHeader,
  PanelTitle,
} from "../control-layout";

export type PanelSectionProps = {
  action?: React.ReactNode;
  actionGroup?: "primary" | "secondary";
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
  title?: React.ReactNode;
};

export function PanelSection({
  action,
  actionGroup,
  children,
  className,
  flush = false,
  title,
}: PanelSectionProps): React.JSX.Element {
  const isActionSection = actionGroup !== undefined;

  return (
    <ControlSection
      className={cn(isActionSection && "p-3", className)}
      data-effects-template-section-action-group={actionGroup}
      data-effects-template-section-actions={isActionSection ? "" : undefined}
    >
      {title ? (
        <ControlSectionHeader action={action}>
          <PanelTitle>{title}</PanelTitle>
        </ControlSectionHeader>
      ) : null}
      <ControlList>
        {React.Children.toArray(children).map((child, index) => (
          <ControlItem
            flush={flush || isActionSection}
            key={getPanelSectionChildKey(child, index)}
          >
            {child}
          </ControlItem>
        ))}
      </ControlList>
    </ControlSection>
  );
}

function getPanelSectionChildKey(
  child: React.ReactNode,
  index: number,
): React.Key {
  return React.isValidElement(child) && child.key !== null ? child.key : index;
}
