import type {
  CreativeAppsKitState,
  CreativeAppsKitTimelineBezierControlPoints,
  CreativeAppsKitTimelineKeyframe,
  CreativeAppsKitTimelineKeyframeEasing,
  CreativeAppsKitTimelineKeyframeGroup,
} from "./types";

const defaultTimelineKeyframeEasing: CreativeAppsKitTimelineKeyframeEasing = {
  controlPoints: [0.65, 0, 0.35, 1],
  type: "bezier",
};

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function getBezierPoint(
  time: number,
  firstControlPoint: number,
  secondControlPoint: number,
): number {
  const inverseTime = 1 - time;

  return (
    3 * inverseTime * inverseTime * time * firstControlPoint +
    3 * inverseTime * time * time * secondControlPoint +
    time * time * time
  );
}

function getBezierYForX(
  progress: number,
  [x1, y1, x2, y2]: CreativeAppsKitTimelineBezierControlPoints,
): number {
  let min = 0;
  let max = 1;
  let time = progress;

  for (let index = 0; index < 30; index += 1) {
    time = (min + max) / 2;

    if (getBezierPoint(time, x1, x2) < progress) {
      min = time;
    } else {
      max = time;
    }
  }

  return clampUnit(getBezierPoint(time, y1, y2));
}

function easeProgress(
  progress: number,
  easing: CreativeAppsKitTimelineKeyframeEasing | undefined,
): number {
  const clampedProgress = clampUnit(progress);
  const resolvedEasing = easing ?? defaultTimelineKeyframeEasing;

  if (resolvedEasing.type === "step") {
    return clampedProgress >= 1 ? 1 : 0;
  }

  return getBezierYForX(clampedProgress, resolvedEasing.controlPoints);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function interpolateCreativeAppsKitValue(
  fromValue: unknown,
  toValue: unknown,
  progress: number,
): unknown {
  if (typeof fromValue === "number" && typeof toValue === "number") {
    return fromValue + (toValue - fromValue) * progress;
  }

  if (Array.isArray(fromValue) && Array.isArray(toValue) && fromValue.length === toValue.length) {
    return fromValue.map((item, index) =>
      interpolateCreativeAppsKitValue(item, toValue[index], progress),
    );
  }

  if (isPlainRecord(fromValue) && isPlainRecord(toValue)) {
    const fromKeys = Object.keys(fromValue);
    const toKeys = Object.keys(toValue);

    if (
      fromKeys.length === toKeys.length &&
      fromKeys.every((key) => Object.prototype.hasOwnProperty.call(toValue, key))
    ) {
      return Object.fromEntries(
        fromKeys.map((key) => [
          key,
          interpolateCreativeAppsKitValue(fromValue[key], toValue[key], progress),
        ]),
      );
    }
  }

  return progress >= 1 ? toValue : fromValue;
}

function getKeyframeRuntimeValue(keyframe: CreativeAppsKitTimelineKeyframe): unknown {
  return "value" in keyframe ? keyframe.value : undefined;
}

function getEvaluatedTimelineGroupValue(
  group: CreativeAppsKitTimelineKeyframeGroup,
  timeSeconds: number,
  fallbackValue: unknown,
): unknown {
  const keyframes = group.keyframes
    .filter((keyframe) => "value" in keyframe)
    .sort((first, second) => first.timeSeconds - second.timeSeconds);

  if (keyframes.length === 0) {
    return fallbackValue;
  }

  const firstKeyframe = keyframes[0];
  const lastKeyframe = keyframes[keyframes.length - 1];

  if (!firstKeyframe || !lastKeyframe) {
    return fallbackValue;
  }

  if (timeSeconds <= firstKeyframe.timeSeconds) {
    return getKeyframeRuntimeValue(firstKeyframe);
  }

  if (timeSeconds >= lastKeyframe.timeSeconds) {
    return getKeyframeRuntimeValue(lastKeyframe);
  }

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const fromKeyframe = keyframes[index];
    const toKeyframe = keyframes[index + 1];

    if (!fromKeyframe || !toKeyframe) {
      continue;
    }

    if (timeSeconds < fromKeyframe.timeSeconds || timeSeconds > toKeyframe.timeSeconds) {
      continue;
    }

    const durationSeconds = toKeyframe.timeSeconds - fromKeyframe.timeSeconds;
    const progress = durationSeconds <= 0 ? 1 : (timeSeconds - fromKeyframe.timeSeconds) / durationSeconds;
    const easedProgress = easeProgress(progress, fromKeyframe.easing);

    return interpolateCreativeAppsKitValue(
      getKeyframeRuntimeValue(fromKeyframe),
      getKeyframeRuntimeValue(toKeyframe),
      easedProgress,
    );
  }

  return fallbackValue;
}

export function evaluateCreativeAppsKitTimelineValue(
  state: CreativeAppsKitState,
  target: string,
  timeSeconds = state.timeline.currentTimeSeconds,
): unknown {
  const group = state.timeline.keyframeGroups.find((item) => item.controlId === target);

  if (!group) {
    return state.values[target];
  }

  return getEvaluatedTimelineGroupValue(group, timeSeconds, state.values[target]);
}

export function evaluateCreativeAppsKitTimelineValues(
  state: CreativeAppsKitState,
  timeSeconds = state.timeline.currentTimeSeconds,
): Record<string, unknown> {
  const values = { ...state.values };

  for (const group of state.timeline.keyframeGroups) {
    values[group.controlId] = getEvaluatedTimelineGroupValue(
      group,
      timeSeconds,
      state.values[group.controlId],
    );
  }

  return values;
}
