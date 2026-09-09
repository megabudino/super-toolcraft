import type {
  FineDetailsPreviewPromptFlightCommandMessage,
} from "./fine-details-preview-protocol";

type FineDetailsPromptFlightCommandSender = (
  message: FineDetailsPreviewPromptFlightCommandMessage,
) => Promise<void>;

type FineDetailsPromptFlightMessageTarget = Readonly<{
  postMessage: (
    message: FineDetailsPreviewPromptFlightCommandMessage,
    targetOrigin: string,
  ) => void;
}>;

let activePromptFlightCommandSender: FineDetailsPromptFlightCommandSender | null = null;

export function sendFineDetailsPromptFlightCommandToPreview({
  contentWindow,
  isReady,
  message,
  targetOrigin,
}: Readonly<{
  contentWindow: FineDetailsPromptFlightMessageTarget | null;
  isReady: boolean;
  message: FineDetailsPreviewPromptFlightCommandMessage;
  targetOrigin: string;
}>): Promise<void> {
  if (!contentWindow || !isReady) {
    return Promise.reject(new Error("The website preview is not ready."));
  }

  try {
    contentWindow.postMessage(message, targetOrigin);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(
      error instanceof Error
        ? error
        : new Error("Could not send the Prompt Flight command."),
    );
  }
}

export function registerFineDetailsPromptFlightCommandSender(
  sender: FineDetailsPromptFlightCommandSender,
): () => void {
  activePromptFlightCommandSender = sender;

  return () => {
    if (activePromptFlightCommandSender === sender) {
      activePromptFlightCommandSender = null;
    }
  };
}

export function sendFineDetailsPromptFlightCommand(
  message: FineDetailsPreviewPromptFlightCommandMessage,
): Promise<void> {
  return activePromptFlightCommandSender
    ? activePromptFlightCommandSender(message)
    : Promise.reject(new Error("The website preview is not ready."));
}
