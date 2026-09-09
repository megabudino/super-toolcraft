import { describe, expect, it, vi } from 'vitest';

import {
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_ACCEPTANCE_ID,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_BROWSER_TEST_NAME,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET,
  getFineDetailsPromptFlightCommandForAction,
} from './fine-details-prompt-flight-command-contract';
import { createFineDetailsPreviewPromptFlightCommandMessage } from './fine-details-preview-protocol';
import { sendFineDetailsPromptFlightCommandToPreview } from './fine-details-preview-website-actions';

describe('Fine Details Prompt Flight command contract', () => {
  it('keeps the nonpersistent UI, acceptance, action, and message identifiers canonical', () => {
    expect(FINE_DETAILS_PROMPT_FLIGHT_COMMAND_TARGET).toBe('promptFlight.commands');
    expect(FINE_DETAILS_PROMPT_FLIGHT_COMMAND_ACCEPTANCE_ID).toBe('prompt.flight.commands');
    expect(FINE_DETAILS_PROMPT_FLIGHT_COMMAND_BROWSER_TEST_NAME).toBe(
      'browser: Prompt Flight Run replays current settings and Reset cancels transient motion',
    );
    expect(FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE).toBe('prompt-flight-command');
    expect(FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS).toEqual({
      reset: { actionId: 'prompt.flight.reset', command: 'reset' },
      run: { actionId: 'prompt.flight.run', command: 'run' },
    });
    expect(getFineDetailsPromptFlightCommandForAction('prompt.flight.run')).toBe('run');
    expect(getFineDetailsPromptFlightCommandForAction('prompt.flight.reset')).toBe('reset');
    expect(getFineDetailsPromptFlightCommandForAction('prompt.flight.unknown')).toBeNull();
  });

  it('rejects before readiness without posting a command', async () => {
    const postMessage = vi.fn();

    await expect(
      sendFineDetailsPromptFlightCommandToPreview({
        contentWindow: { postMessage },
        isReady: false,
        message: createFineDetailsPreviewPromptFlightCommandMessage('run', 'run-before-ready'),
        targetOrigin: 'http://localhost:3000',
      }),
    ).rejects.toThrow('The website preview is not ready.');
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('rejects a missing content window without posting a command', async () => {
    await expect(
      sendFineDetailsPromptFlightCommandToPreview({
        contentWindow: null,
        isReady: true,
        message: createFineDetailsPreviewPromptFlightCommandMessage('reset', 'reset-no-window'),
        targetOrigin: 'http://localhost:3000',
      }),
    ).rejects.toThrow('The website preview is not ready.');
  });

  it('posts exact v17 Run and Reset messages only when ready', async () => {
    const postMessage = vi.fn();

    for (const [command, nonce] of [
      ['run', 'run-ready'],
      ['reset', 'reset-ready'],
    ] as const) {
      const message = createFineDetailsPreviewPromptFlightCommandMessage(command, nonce);
      await expect(
        sendFineDetailsPromptFlightCommandToPreview({
          contentWindow: { postMessage },
          isReady: true,
          message,
          targetOrigin: 'http://localhost:3000',
        }),
      ).resolves.toBeUndefined();
      expect(postMessage).toHaveBeenLastCalledWith(message, 'http://localhost:3000');
      expect(message).toEqual({
        channel: 'recraft.fine-details',
        command,
        nonce,
        type: 'prompt-flight-command',
        version: 17,
      });
    }
  });
});
