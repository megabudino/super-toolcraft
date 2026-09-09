export function parseToolcraftDeliveryArguments(arguments_) {
  const targetedArguments = [];
  let requestedReason;

  for (const argument of arguments_) {
    if (argument === "--") continue;
    if (argument.startsWith("--reason=")) {
      if (requestedReason !== undefined) {
        throw new Error("Toolcraft delivery verification accepts one --reason.");
      }
      requestedReason = argument.slice("--reason=".length);
      continue;
    }
    if (
      argument.startsWith("--tier=") ||
      argument.startsWith("--unit-test=") ||
      argument.startsWith("--browser-test=") ||
      argument.startsWith("--performance-test=")
    ) {
      targetedArguments.push(argument);
      continue;
    }
    throw new Error(`Unsupported Toolcraft delivery argument: ${argument}`);
  }

  if (
    requestedReason !== undefined &&
    requestedReason !== "performance-iteration"
  ) {
    throw new Error(
      "Toolcraft delivery --reason must be performance-iteration.",
    );
  }

  return { requestedReason, targetedArguments };
}
