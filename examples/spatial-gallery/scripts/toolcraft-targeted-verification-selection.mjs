function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function readToolcraftTargetedVerificationArguments(arguments_) {
  const values = { browserTests: [], performanceTests: [], unitTests: [] };
  let verificationTier;
  for (const argument of arguments_) {
    if (argument === "--") continue;
    if (argument.startsWith("--tier=")) {
      if (verificationTier !== undefined) {
        throw new Error("Toolcraft targeted verification accepts one --tier.");
      }
      verificationTier = Number(argument.slice("--tier=".length));
      continue;
    }
    const testArgument = [
      ["--unit-test=", values.unitTests],
      ["--browser-test=", values.browserTests],
      ["--performance-test=", values.performanceTests],
    ].find(([prefix]) => argument.startsWith(prefix));
    if (testArgument) {
      const [prefix, target] = testArgument;
      target.push(argument.slice(prefix.length));
      continue;
    }
    throw new Error(
      `Unsupported Toolcraft targeted verification argument: ${argument}`,
    );
  }
  return { ...values, verificationTier };
}

export function sortToolcraftPlaywrightSelections(selections) {
  return selections.sort((left, right) =>
    compareCodeUnits(left.fullTitle, right.fullTitle),
  );
}

export function createToolcraftCanonicalTestEvidence(selections) {
  return selections.map(({ fullTitle, leafTitle }) => ({
    fullTitle,
    leafTitle,
  }));
}

export function getToolcraftCanonicalLeafTitles(evidence) {
  return [...new Set(evidence.map(({ leafTitle }) => leafTitle))].sort(
    compareCodeUnits,
  );
}
