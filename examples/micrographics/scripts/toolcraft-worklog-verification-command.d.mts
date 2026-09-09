export type ToolcraftWorklogVerificationCommand =
  | {
      kind: "delivery";
      requestedReason: "performance-iteration" | undefined;
      targetedArguments: string[];
    }
  | { kind: "full-performance"; script: string }
  | { kind: "other" };

export function parseToolcraftWorklogVerificationCommand(
  value: string,
): ToolcraftWorklogVerificationCommand;
