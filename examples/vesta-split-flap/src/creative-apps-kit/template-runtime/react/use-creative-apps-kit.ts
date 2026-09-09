"use client";

import * as React from "react";

import {
  evaluateCreativeAppsKitTimelineValue,
  evaluateCreativeAppsKitTimelineValues,
} from "../state/keyframe-evaluation";
import { CreativeAppsKitContext } from "./creative-apps-kit-root";

export function useCreativeAppsKit() {
  const context = React.useContext(CreativeAppsKitContext);

  if (!context) {
    throw new Error("useCreativeAppsKit must be used inside CreativeAppsKitRoot");
  }

  return context;
}

export function useCreativeAppsKitValue(target: string): unknown {
  return useCreativeAppsKit().state.values[target];
}

export function useCreativeAppsKitEvaluatedValues(timeSeconds?: number): Record<string, unknown> {
  const { state } = useCreativeAppsKit();

  return React.useMemo(
    () => evaluateCreativeAppsKitTimelineValues(state, timeSeconds),
    [state, timeSeconds],
  );
}

export function useCreativeAppsKitEvaluatedValue(target: string, timeSeconds?: number): unknown {
  const { state } = useCreativeAppsKit();

  return React.useMemo(
    () => evaluateCreativeAppsKitTimelineValue(state, target, timeSeconds),
    [state, target, timeSeconds],
  );
}
