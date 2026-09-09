import type { FineDetailsPromptFlightSettings } from './fine-details-settings';

export interface FineDetailsPromptFlightCommandEvent {
  command: 'run' | 'reset';
  nonce: string;
}

export type FineDetailsPromptFlightMotionPolicy = 'animate' | 'snap';
export type FineDetailsPromptFlightRuntimeState = 'flying' | 'idle' | 'landed' | 'returning';

type FineDetailsPromptFlightScalarField = Exclude<keyof FineDetailsPromptFlightSettings, 'offset'>;
type FineDetailsPromptFlightOffsetField = `offset.${Extract<
  keyof FineDetailsPromptFlightSettings['offset'],
  string
>}`;
type FineDetailsPromptFlightTuningField =
  | FineDetailsPromptFlightOffsetField
  | FineDetailsPromptFlightScalarField;

interface FineDetailsPromptFlightTuningDescriptor {
  field: FineDetailsPromptFlightTuningField;
  read: (settings: FineDetailsPromptFlightSettings) => boolean | number;
}

function defineFineDetailsPromptFlightTuningFields<
  const Fields extends readonly FineDetailsPromptFlightTuningDescriptor[],
>(
  fields: Fields &
    (Exclude<FineDetailsPromptFlightTuningField, Fields[number]['field']> extends never
      ? unknown
      : readonly ['Missing prompt-flight tuning fields']),
) {
  return fields;
}

export const FINE_DETAILS_PROMPT_FLIGHT_TUNING_FIELDS = defineFineDetailsPromptFlightTuningFields([
  { field: 'bounce', read: (settings) => settings.bounce },
  { field: 'enabled', read: (settings) => settings.enabled },
  { field: 'flightTime', read: (settings) => settings.flightTime },
  { field: 'ghostFalloff', read: (settings) => settings.ghostFalloff },
  { field: 'ghostOpacity', read: (settings) => settings.ghostOpacity },
  { field: 'ghostSpacing', read: (settings) => settings.ghostSpacing },
  { field: 'ghosts', read: (settings) => settings.ghosts },
  { field: 'offset.x', read: (settings) => settings.offset.x },
  { field: 'offset.y', read: (settings) => settings.offset.y },
  { field: 'startDelay', read: (settings) => settings.startDelay },
  { field: 'vanishStagger', read: (settings) => settings.vanishStagger },
  { field: 'vanishTime', read: (settings) => settings.vanishTime },
] as const);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseFineDetailsPromptFlightCommand(
  value: unknown,
  channel: string,
  version: number,
): FineDetailsPromptFlightCommandEvent | null {
  if (
    !isRecord(value) ||
    value.channel !== channel ||
    value.type !== 'prompt-flight-command' ||
    value.version !== version ||
    (value.command !== 'run' && value.command !== 'reset') ||
    typeof value.nonce !== 'string' ||
    value.nonce.trim().length === 0 ||
    value.nonce.length > 128
  ) {
    return null;
  }

  return { command: value.command, nonce: value.nonce };
}

export function resolveFineDetailsPromptFlightCommandPlan(
  command: FineDetailsPromptFlightCommandEvent['command'],
) {
  return command === 'reset'
    ? {
        cancelCurrent: true as const,
        kind: 'reset-to-base' as const,
      }
    : {
        cancelCurrent: true as const,
        kind: 'run-forward' as const,
      };
}

export function resolveFineDetailsPromptFlightMotionPolicy({
  enabled,
  prefersReducedMotion,
}: {
  enabled: boolean;
  prefersReducedMotion: boolean;
}): FineDetailsPromptFlightMotionPolicy {
  return enabled && !prefersReducedMotion ? 'animate' : 'snap';
}

export function shouldCreateFineDetailsPromptGhostRun({
  ghostsEnabled,
  motionPolicy,
  pathLength,
}: {
  ghostsEnabled: boolean;
  motionPolicy: FineDetailsPromptFlightMotionPolicy;
  pathLength: number;
}) {
  return ghostsEnabled && motionPolicy === 'animate' && pathLength > 0;
}

function areFineDetailsPromptFlightSettingsEqual(
  first: FineDetailsPromptFlightSettings,
  second: FineDetailsPromptFlightSettings,
) {
  return FINE_DETAILS_PROMPT_FLIGHT_TUNING_FIELDS.every(({ read }) => read(first) === read(second));
}

export function resolveFineDetailsPromptFlightTuningUpdate(
  previous: FineDetailsPromptFlightSettings,
  next: FineDetailsPromptFlightSettings,
  state: FineDetailsPromptFlightRuntimeState,
) {
  const didChange = !areFineDetailsPromptFlightSettingsEqual(previous, next);
  const isActive = state === 'flying' || state === 'returning';
  return {
    cancelCurrent: didChange && isActive,
    restartOutbound: didChange && state === 'flying',
  };
}

export function createFineDetailsPromptFlightTuningKey(settings: FineDetailsPromptFlightSettings) {
  return JSON.stringify(FINE_DETAILS_PROMPT_FLIGHT_TUNING_FIELDS.map(({ read }) => read(settings)));
}
