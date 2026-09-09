import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlPartCoverage,
} from "../acceptance/types";

export const DOTS_AUTOMATED_TEST_NAME =
  "Dot Formation product contract updates deterministic output";
export const DOTS_BROWSER_TEST_NAME =
  "browser: Dot Formation updates product output";
export const DOTS_DEFAULT_SETTINGS_BROWSER_TEST_NAME =
  "browser: imported settings are the fresh and reset defaults";
export const DOTS_INFINITY_BROWSER_TEST_NAME =
  "browser: Dot Formation Infinity canvas preserves workspace and exports scene bounds";
export const DOTS_SPILL_BROWSER_TEST_NAME =
  "browser: settled dots use chaotic palette and adjustable edge spill";
export const DOTS_TIMING_BROWSER_TEST_NAME =
  "browser: active and calm timing sliders preserve seamless loop";
export const DOTS_THEME_BROWSER_TEST_NAME =
  "browser: color theme actions restyle palette and background";
export const DOTS_FIXTURE =
  "the default Hi! text with 1800 deterministic ring-launched particles";

export const DOTS_DEFAULT_SETTINGS_ACCEPTANCE: ToolcraftComponentAcceptance = {
  automated: true,
  automatedTestName: DOTS_AUTOMATED_TEST_NAME,
  browser: true,
  browserTestName: DOTS_DEFAULT_SETTINGS_BROWSER_TEST_NAME,
  componentType: "custom-renderer",
  evidence: "product-output",
  expectedObservable:
    "A fresh workspace and Reset render the supplied text, particle, color, look, and timeline defaults.",
  fixture: DOTS_FIXTURE,
  id: "product.default-settings",
  kind: "runtime",
  userAction:
    "Open a fresh workspace, change representative product values, use Reset controls, and compare the restored composition.",
};

export function dotsBrowserTestName(id: string): string {
  return `browser: Dot Formation proves ${id}`;
}

export function controlAcceptance({
  componentType,
  expectedObservable,
  id,
  target = id,
  userAction,
  ...coverage
}: {
  componentType: string;
  expectedObservable: string;
  id: string;
  target?: string | null;
  userAction: string;
  actionCoverage?: readonly string[];
  backgroundOutputCoverage?: ToolcraftComponentAcceptance["backgroundOutputCoverage"];
  browserTestName?: string;
  controlPartCoverage?: readonly ToolcraftControlPartCoverage[];
  evidence?: ToolcraftComponentAcceptance["evidence"];
  interactionId?: string;
  optionCoverage?: ToolcraftComponentAcceptance["optionCoverage"];
}): ToolcraftComponentAcceptance {
  return {
    automated: true,
    automatedTestName: DOTS_AUTOMATED_TEST_NAME,
    browser: true,
    browserTestName: coverage.browserTestName ?? dotsBrowserTestName(id),
    componentType,
    evidence: coverage.evidence ?? "rendered-pixels",
    expectedObservable,
    fixture: DOTS_FIXTURE,
    id,
    kind: "control",
    userAction,
    ...coverage,
    ...(target === null ? {} : { target: target ?? id }),
  };
}
