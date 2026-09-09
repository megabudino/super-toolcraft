"use client";

import type * as React from "react";
import type { ControlChangeMeta } from "@/creative-apps-kit/ui";

import type { CreativeAppsKitControlSchema } from "../schema/types";
import type { CreativeAppsKitCommand, CreativeAppsKitState } from "../state/types";

export type CreativeAppsKitCustomControlSetValue<Value = unknown> = (
  value: Value,
  meta?: ControlChangeMeta,
) => void;

export type CreativeAppsKitCustomControlRendererProps<Value = unknown> = {
  control: CreativeAppsKitControlSchema;
  controlId: string;
  dispatch: React.Dispatch<CreativeAppsKitCommand>;
  keyframeAction: React.ReactNode;
  name: string;
  setValue: CreativeAppsKitCustomControlSetValue<Value>;
  state: CreativeAppsKitState;
  value: Value;
};

export type CreativeAppsKitCustomControlRenderer<Value = unknown> = (
  props: CreativeAppsKitCustomControlRendererProps<Value>,
) => React.ReactNode;

export type CreativeAppsKitControlRendererMap = Readonly<
  Record<string, CreativeAppsKitCustomControlRenderer>
>;
