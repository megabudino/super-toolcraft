import type { ToolcraftPanelActionHandler } from "@/toolcraft/runtime/react";

import {
  createFineDetailsPreviewPromptFlightCommandMessage,
} from "./fine-details-preview-protocol";
import { getFineDetailsPromptFlightCommandForAction } from "./fine-details-prompt-flight-command-contract";
import {
  sendFineDetailsPromptFlightCommand,
} from "./fine-details-preview-website-actions";

export const handleFineDetailsPanelAction: ToolcraftPanelActionHandler = async ({
  action,
  dispatch,
  reportFeedback,
}) => {
  const isReset = action.value === "website.reset";
  if (isReset) {
    dispatch({ type: "controls.reset" });
  }
  const command = isReset
    ? "reset"
    : getFineDetailsPromptFlightCommandForAction(action.value);
  if (command) {
    try {
      await sendFineDetailsPromptFlightCommand(
        createFineDetailsPreviewPromptFlightCommandMessage(
          command,
          crypto.randomUUID(),
        ),
      );
    } catch {
      reportFeedback({
        code: `fine-details-prompt-flight-${command}-failed`,
        message: `Could not ${command} Prompt Flight because the website preview is not ready.`,
      });
    }
    return;
  }
};
