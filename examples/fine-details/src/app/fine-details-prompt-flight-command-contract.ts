export const FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET = 'promptFlight.commands';
export const FINE_DETAILS_PROMPT_FLIGHT_COMMAND_ACCEPTANCE_ID = 'prompt.flight.commands';
export const FINE_DETAILS_PROMPT_FLIGHT_COMMAND_BROWSER_TEST_NAME =
  'browser: Prompt Flight Run replays current settings and Reset cancels transient motion';
export const FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE = 'prompt-flight-command';

export const FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS = {
  reset: { actionId: 'prompt.flight.reset', command: 'reset' },
  run: { actionId: 'prompt.flight.run', command: 'run' },
} as const;

export type FineDetailsPromptFlightCommand =
  (typeof FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS)[keyof typeof FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS]['command'];

export function getFineDetailsPromptFlightCommandForAction(
  actionId: string,
): FineDetailsPromptFlightCommand | null {
  if (actionId === FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.actionId) {
    return FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.command;
  }
  if (actionId === FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.actionId) {
    return FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.command;
  }
  return null;
}
