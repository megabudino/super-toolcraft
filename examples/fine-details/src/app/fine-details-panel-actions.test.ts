import { beforeEach, describe, expect, it, vi } from "vitest";
import { createToolcraftState } from '@/toolcraft/runtime';
import { appSchema } from './app-schema';

const previewActions = vi.hoisted(() => ({
  sendPromptFlightCommand: vi.fn(),
}));

vi.mock("./fine-details-preview-website-actions", () => ({
  sendFineDetailsPromptFlightCommand: previewActions.sendPromptFlightCommand,
}));

import { handleFineDetailsPanelAction } from "./fine-details-panel-actions";
import {
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS,
  FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE,
} from "./fine-details-prompt-flight-command-contract";

describe("Fine Details panel actions", () => {
  beforeEach(() => {
    previewActions.sendPromptFlightCommand.mockReset();
    previewActions.sendPromptFlightCommand.mockResolvedValue(undefined);
  });

  it("main Reset restores controls and resets the local Prompt Flight", async () => {
    const dispatch = vi.fn();
    const reportFeedback = vi.fn();
    await handleFineDetailsPanelAction({
      action: { label: "Reset", value: "website.reset" },
      dispatch,
      reportFeedback,
      reportProgress: vi.fn(),
      resolveMediaResource: vi.fn(),
      state: createToolcraftState(appSchema),
    } as Parameters<typeof handleFineDetailsPanelAction>[0]);

    expect(dispatch.mock.calls).toEqual([[{ type: "controls.reset" }]]);
    expect(previewActions.sendPromptFlightCommand).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ command: "reset", type: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE }),
    );
    expect(reportFeedback).not.toHaveBeenCalled();
  });

  it("Prompt Flight Run and Reset send one-shot commands without mutating settings", async () => {
    const dispatch = vi.fn();
    const reportFeedback = vi.fn();
    const reportProgress = vi.fn();

    for (const [value, command] of [
      [
        FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.actionId,
        FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.command,
      ],
      [
        FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.actionId,
        FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.command,
      ],
    ] as const) {
      await handleFineDetailsPanelAction({
        action: { label: command, value },
        dispatch,
        reportFeedback,
        reportProgress,
        resolveMediaResource: vi.fn(),
        state: createToolcraftState(appSchema),
      } as Parameters<typeof handleFineDetailsPanelAction>[0]);
    }

    expect(previewActions.sendPromptFlightCommand).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        command: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.command,
        type: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE,
        version: 17,
      }),
    );
    expect(previewActions.sendPromptFlightCommand).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        command: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.reset.command,
        type: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_MESSAGE_TYPE,
        version: 17,
      }),
    );
    expect(dispatch).not.toHaveBeenCalled();
    expect(reportFeedback).not.toHaveBeenCalled();
    expect(reportProgress).not.toHaveBeenCalled();
  });

  it("reports Prompt Flight unavailable until its preview command sender is ready", async () => {
    previewActions.sendPromptFlightCommand.mockRejectedValueOnce(
      new Error("The website preview is not ready."),
    );
    const reportFeedback = vi.fn();

    await handleFineDetailsPanelAction({
      action: {
        label: "Run",
        value: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.actionId,
      },
      dispatch: vi.fn(),
      reportFeedback,
      reportProgress: vi.fn(),
      resolveMediaResource: vi.fn(),
      state: createToolcraftState(appSchema),
    } as Parameters<typeof handleFineDetailsPanelAction>[0]);

    expect(reportFeedback).toHaveBeenCalledWith({
      code: "fine-details-prompt-flight-run-failed",
      message: "Could not run Prompt Flight because the website preview is not ready.",
    });

    previewActions.sendPromptFlightCommand.mockResolvedValueOnce(undefined);
    reportFeedback.mockClear();

    await handleFineDetailsPanelAction({
      action: {
        label: "Run",
        value: FINE_DETAILS_PROMPT_FLIGHT_COMMAND_CONTRACTS.run.actionId,
      },
      dispatch: vi.fn(),
      reportFeedback,
      reportProgress: vi.fn(),
      resolveMediaResource: vi.fn(),
      state: createToolcraftState(appSchema),
    } as Parameters<typeof handleFineDetailsPanelAction>[0]);

    expect(reportFeedback).not.toHaveBeenCalled();
  });
});
