import { parseToolcraftDeliveryArguments } from "./toolcraft-delivery-arguments.mjs";

function isFullPerformanceScript(value) {
  return value === "verify:perf";
}

const supportedPackageScriptOptions = new Set([
  "--if-present",
  "--silent",
  "-s",
]);
const packageScriptOptionsWithValues = new Set([
  "--dir",
  "--prefix",
  "-C",
]);
const packageScriptInlineValueOptions = ["--dir=", "--prefix=", "-C="];
const protectedAuthorityMarkers = [
  "verify:delivery",
  "verify:perf",
  "run-browser-performance.mjs",
  "run-delivery-verification.mjs",
  "run-performance-iteration.mjs",
];
const nonAuthorityCompatibilityScripts = new Set([
  "verify:perf:record-iteration",
]);
const unsupportedShellSyntax = new Set([
  "!",
  "#",
  "&",
  "(",
  ")",
  "*",
  ";",
  "<",
  ">",
  "?",
  "[",
  "]",
  "{",
  "|",
  "}",
  "~",
]);

function normalizeCommandSource(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Toolcraft worklog verification command is empty.");
  }

  let source = value.trim();
  if (source.endsWith(".")) source = source.slice(0, -1).trimEnd();
  if (source.startsWith("`") && source.endsWith("`")) {
    source = source.slice(1, -1).trim();
  }
  if (source.length === 0) {
    throw new Error("Toolcraft worklog verification command is empty.");
  }

  return source;
}

function tokenizeDirectCommand(source) {
  const tokens = [];
  let current = "";
  let quote = null;
  let tokenStarted = false;

  const pushCurrent = () => {
    if (!tokenStarted) return;
    tokens.push(current);
    current = "";
    tokenStarted = false;
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quote !== null) {
      if (character === quote) {
        quote = null;
        continue;
      }
      if (character === "`" || character === "\\" || character === "$") {
        throw new Error(
          "Toolcraft worklog verification command contains unsupported shell expansion.",
        );
      }
      current += character;
      continue;
    }

    if (character === "\n" || character === "\r") {
      throw new Error(
        "Toolcraft worklog verification command contains unsupported shell syntax.",
      );
    }
    if (/\s/u.test(character)) {
      pushCurrent();
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      tokenStarted = true;
      continue;
    }
    if (character === "`" || character === "\\" || character === "$") {
      throw new Error(
        "Toolcraft worklog verification command contains unsupported shell expansion.",
      );
    }
    if (unsupportedShellSyntax.has(character)) {
      throw new Error(
        "Toolcraft worklog verification command contains unsupported shell syntax.",
      );
    }

    tokenStarted = true;
    current += character;
  }

  pushCurrent();
  if (quote !== null) {
    throw new Error("Toolcraft worklog verification command has a malformed quote.");
  }
  return tokens;
}

function readPackageScript(tokens) {
  const packageManager = tokens[0]?.split(/[\\/]/u).at(-1);
  if (packageManager !== "pnpm" && packageManager !== "npm") return null;

  let index = 1;
  while (index < tokens.length) {
    if (supportedPackageScriptOptions.has(tokens[index])) {
      index += 1;
      continue;
    }
    if (packageScriptOptionsWithValues.has(tokens[index])) {
      if (!tokens[index + 1]) return null;
      index += 2;
      continue;
    }
    if (
      packageScriptInlineValueOptions.some((prefix) =>
        tokens[index].startsWith(prefix),
      )
    ) {
      index += 1;
      continue;
    }
    break;
  }

  if (tokens[index] === "run") {
    index += 1;
    while (supportedPackageScriptOptions.has(tokens[index])) index += 1;
  } else if (packageManager === "npm") {
    return null;
  }

  const script = tokens[index];
  return script
    ? { arguments_: tokens.slice(index + 1), script }
    : null;
}

function containsProtectedAuthorityMarker(source) {
  return protectedAuthorityMarkers.some((marker) => source.includes(marker));
}

function assertNonEmptyTargetedValues(targetedArguments) {
  const tierArguments = targetedArguments.filter((argument) =>
    argument.startsWith("--tier="),
  );
  if (tierArguments.length > 1) {
    throw new Error("Toolcraft worklog verification command accepts one --tier.");
  }

  for (const argument of targetedArguments) {
    const separatorIndex = argument.indexOf("=");
    const value = separatorIndex < 0 ? "" : argument.slice(separatorIndex + 1);
    if (value.trim().length === 0) {
      throw new Error(
        "Toolcraft worklog verification command contains an empty or whitespace selector.",
      );
    }
  }
}

export function parseToolcraftWorklogVerificationCommand(value) {
  const source = normalizeCommandSource(value);
  const tokens = tokenizeDirectCommand(source);
  const command = readPackageScript(tokens);
  if (nonAuthorityCompatibilityScripts.has(command?.script)) {
    return { kind: "other" };
  }
  if (!command || !["verify:delivery", "verify:perf"].includes(command.script)) {
    if (!containsProtectedAuthorityMarker(source)) return { kind: "other" };
    throw new Error(
      "Toolcraft worklog verification command uses an unsupported package-script invocation or authority wrapper.",
    );
  }
  const isFullPerformanceCommand = isFullPerformanceScript(command?.script ?? "");

  if (isFullPerformanceCommand) {
    return { kind: "full-performance", script: command.script };
  }

  const parsed = parseToolcraftDeliveryArguments(command.arguments_);
  assertNonEmptyTargetedValues(parsed.targetedArguments);

  return { kind: "delivery", ...parsed };
}
