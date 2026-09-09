import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  defineCreativeAppsKit,
  type CreativeAppsKitActionSchema,
  type ResolvedCreativeAppsKitAppSchema,
} from "@/creative-apps-kit/template-runtime";

import {
  getCreativeAppsKitControlOrderTargets,
  type CreativeAppsKitComponentAcceptance,
  appAcceptance,
  appProductReadiness,
  appTransferMode,
  validateCreativeAppsKitAcceptanceCoverage,
} from "./app-acceptance";
import { appSchema } from "./app-schema";

const currentFileName = basename(fileURLToPath(import.meta.url));
const appDir = dirname(fileURLToPath(import.meta.url));
const e2eDir = join(appDir, "../../e2e");
const projectDir = join(appDir, "../..");
const routesDir = join(appDir, "../routes");
const agentWorklogPath = join(projectDir, "docs/creative-apps-kit/agent-worklog.md");
const creativeAppsKitAppRenderPattern =
  /<\s*CreativeAppsKitApp\b|React\.createElement\s*\(\s*CreativeAppsKitApp\b/;
const manualRuntimeSurfaceRenderPattern =
  /<\s*(?:CreativeAppsKitRoot|CanvasShell|ControlsPanel|LayersPanel|TimelinePanel|ToolbarPanel)\b|React\.createElement\s*\(\s*(?:CreativeAppsKitRoot|CanvasShell|ControlsPanel|LayersPanel|TimelinePanel|ToolbarPanel)\b/;
const customTimelineTransportRenderPattern =
  /<\s*[A-Z][A-Za-z0-9]*(?:Playback|Timeline|Transport)(?:Panel|Controls|Bar)\b/;
const requiredAgentWorklogDecisionSections = [
  "Renderer",
  "Timeline",
  "Layers",
  "Controls",
  "Export",
  "Performance",
] as const;
const requiredAgentWorklogSections = [
  "Status",
  "Decisions",
  ...requiredAgentWorklogDecisionSections,
  "Evidence",
  "Verification",
  "Risks",
] as const;

const playbackTimelineAcceptance: CreativeAppsKitComponentAcceptance = {
  automated: true,
  automatedTestName: "connects timeline playback controls to runtime state contract",
  browser: true,
  browserTestName: "browser: timeline playback transport controls runtime time",
  componentType: "timeline",
  evidence: "timeline-output",
  expectedObservable:
    "The timeline transport changes runtime playback state, editing timeline duration changes the playback range, and playback-only controls render without keyframe rows.",
  fixture: "starter playback timeline fixture",
  id: "timeline.playback",
  kind: "runtime",
  target: "timeline.playback",
  timelineCoverage: "playback",
  timelinePlaybackCoverage: [
    "pause-resume",
    "scrub",
    "duration",
    "loop",
    "rendered-frame",
  ],
  userAction:
    "Edit timeline duration, scrub the playback range, then pause and resume playback from the timeline panel.",
};

const staticFixtureTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-creative-apps-kit-app",
} as const;

function makeControlAcceptance(
  target: string,
  componentType: string,
): CreativeAppsKitComponentAcceptance {
  return {
    automated: true,
    automatedTestName: `${target} changes product output`,
    browser: true,
    browserTestName: `browser: ${target} changes product output`,
    componentType,
    evidence: "product-output",
    expectedObservable: `${target} changes the rendered product output.`,
    fixture: `${target} fixture`,
    id: target,
    kind: "control",
    target,
    userAction: `Change ${target}.`,
  };
}

function readSiblingAppTestSources(): string {
  return readdirSync(appDir)
    .filter((fileName) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(fileName))
    .filter((fileName) => fileName !== currentFileName)
    .map((fileName) => readFileSync(join(appDir, fileName), "utf8"))
    .join("\n");
}

function readBrowserTestSources(): string {
  return readdirSync(e2eDir)
    .filter((fileName) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(fileName))
    .map((fileName) => readFileSync(join(e2eDir, fileName), "utf8"))
    .join("\n");
}

function acceptanceCoversTimelineDurationEdit(
  entry: (typeof appAcceptance)[number],
): boolean {
  return (
    entry.timelinePlaybackCoverage === "all-playback-behavior" ||
    (Array.isArray(entry.timelinePlaybackCoverage) &&
      entry.timelinePlaybackCoverage.includes("duration"))
  );
}

function stripJsComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function getMarkdownHeadingLevel(line: string): number | null {
  const match = /^(#{1,6})\s+\S/.exec(line);

  return match ? match[1].length : null;
}

function getMarkdownSectionBody(source: string, heading: string): string {
  const lines = source.split(/\r?\n/);
  const headingPattern = new RegExp(`^(#{1,6})\\s+${escapeRegExp(heading)}\\s*$`, "i");
  const startIndex = lines.findIndex((line) => headingPattern.test(line.trim()));

  if (startIndex < 0) {
    return "";
  }

  const startLevel = getMarkdownHeadingLevel(lines[startIndex]);
  const bodyLines: string[] = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const nextLevel = getMarkdownHeadingLevel(lines[index]);

    if (startLevel !== null && nextLevel !== null && nextLevel <= startLevel) {
      break;
    }

    bodyLines.push(lines[index]);
  }

  return bodyLines.join("\n").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAgentWorklogValidationErrors(source: string): string[] {
  const errors: string[] = [];

  for (const section of requiredAgentWorklogSections) {
    if (!getMarkdownSectionBody(source, section)) {
      errors.push(`agent-worklog.md must include a populated "${section}" section.`);
    }
  }

  const statusBody = getMarkdownSectionBody(source, "Status");

  if (!/\bMode:\s*product\b/i.test(statusBody)) {
    errors.push('agent-worklog.md Status must declare "Mode: product" before final delivery.');
  }

  if (/\bMode:\s*starter\b/i.test(statusBody)) {
    errors.push('agent-worklog.md still declares "Mode: starter"; replace the starter template with product decisions.');
  }

  for (const section of requiredAgentWorklogDecisionSections) {
    const body = getMarkdownSectionBody(source, section);

    if (!/\bDecision:\s*\S/i.test(body)) {
      errors.push(`agent-worklog.md "${section}" must include a concrete Decision.`);
    }

    if (!/\bReason:\s*\S/i.test(body)) {
      errors.push(`agent-worklog.md "${section}" must include the Reason for the decision.`);
    }

    if (!/\bEvidence:\s*\S/i.test(body)) {
      errors.push(`agent-worklog.md "${section}" must include Evidence such as files, tests, browser checks, or contract rules.`);
    }
  }

  const evidenceBody = getMarkdownSectionBody(source, "Evidence");
  const verificationBody = getMarkdownSectionBody(source, "Verification");
  const risksBody = getMarkdownSectionBody(source, "Risks");

  if (!/\b(Source reviewed|Contract applied|Evidence):\s*\S/i.test(evidenceBody)) {
    errors.push("agent-worklog.md Evidence must name reviewed files, references, or contract rules.");
  }

  if (!/\bpnpm\s+(verify|test|build|typecheck)|browser|Playwright|perf/i.test(verificationBody)) {
    errors.push("agent-worklog.md Verification must list concrete test/build/browser/performance checks.");
  }

  if (!/\b(Risk|None):\s*\S/i.test(risksBody)) {
    errors.push('agent-worklog.md Risks must include either "Risk:" entries or "None:" with a reason.');
  }

  return errors;
}

function readSourceTree(
  rootDir: string,
  shouldSkipFile: (fileName: string, filePath: string) => boolean = () => false,
): string {
  const chunks: string[] = [];

  function visit(currentDir: string): void {
    for (const entryName of readdirSync(currentDir)) {
      const entryPath = join(currentDir, entryName);
      const entryStat = statSync(entryPath);

      if (entryStat.isDirectory()) {
        visit(entryPath);
        continue;
      }

      if (
        entryStat.isFile() &&
        /\.[cm]?[jt]sx?$/.test(entryName) &&
        !/\.(test|spec)\.[cm]?[jt]sx?$/.test(entryName) &&
        !shouldSkipFile(entryName, entryPath)
      ) {
        chunks.push(readFileSync(entryPath, "utf8"));
      }
    }
  }

  visit(rootDir);

  return stripJsComments(chunks.join("\n"));
}

function isNeutralTemplateProject(): boolean {
  return new Set(["starter", "creative-apps-kit-template"]).has(basename(projectDir));
}

function sourceDefinesProductCanvasContent(): boolean {
  const routeSource = readSourceTree(routesDir);

  return /canvasContent\s*=/.test(routeSource) || /renderDefaultCanvasMedia=\{false\}/.test(routeSource);
}

function schemaHasProductSurface(): boolean {
  return (
    (appSchema.panels.controls?.sections ?? []).some(
      (section) => Object.keys(section.controls).length > 0,
    ) ||
    appSchema.panels.layers === true ||
    appSchema.panels.timeline?.enabled === true ||
    sourceDefinesProductCanvasContent() ||
    appAcceptance.length > 0
  );
}

function getPanelActionSearchText(action: CreativeAppsKitActionSchema | string): string {
  return typeof action === "string"
    ? action
    : [action.label ?? "", action.value, action.icon ?? ""].join(" ");
}

function getSchemaPanelActionSearchTexts(): string[] {
  return (appSchema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.values(section.controls).flatMap((control) => {
      if (control.type !== "panelActions") {
        return [];
      }

      return (control.actions ?? []).map(getPanelActionSearchText);
    }),
  );
}

type ResolvedControlsSection =
  NonNullable<ResolvedCreativeAppsKitAppSchema["panels"]["controls"]>["sections"][number];

type ResolvedControl = ResolvedControlsSection["controls"][string];

function normalizeSectionTitle(title: string | undefined): string {
  return (title ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function getSchemaVideoExportSection(
  schema: ResolvedCreativeAppsKitAppSchema = appSchema,
): ResolvedControlsSection | undefined {
  return (schema.panels.controls?.sections ?? []).find(
    (section) => normalizeSectionTitle(section.title) === "video export",
  );
}

function getSectionControlByTarget(
  section: ResolvedControlsSection | undefined,
  target: string,
): ResolvedControl | undefined {
  if (!section) {
    return undefined;
  }

  return Object.values(section.controls).find((control) => control.target === target);
}

function getControlOptionValues(control: ResolvedControl | undefined): string[] {
  return control?.options?.map((option) => option.value.toLowerCase()) ?? [];
}

function sourceHasVideoCapabilityCheck(source: string): boolean {
  return /\bMediaRecorder\.isTypeSupported\b|\bVideoEncoder\b|\bffmpeg\b|\bFFmpeg\b|\btranscoder\b|\bencoder\b/i.test(
    source,
  );
}

function sourceHasVideoDurationMetadataCoverage(source: string): boolean {
  return (
    /\bloadedmetadata\b|\bonloadedmetadata\b/.test(source) &&
    /\bvideo\.duration\b|\bduration\b/.test(source) &&
    /\btimeline duration\b|\btimelineDuration\b|\bdurationSeconds\b|\baria-valuemax\b/.test(
      source,
    )
  );
}

function sourceHasCustomMovOrProResEncoder(source: string): boolean {
  return /\bVideoEncoder\b|\bffmpeg\b|\bFFmpeg\b|\bProRes\b|\bprores\b|\btranscoder\b/i.test(
    source,
  );
}

function getProductImplementationSource(): string {
  return `${readSourceTree(routesDir)}\n${readSourceTree(appDir)}`;
}

function getProductRuntimeImplementationSource(): string {
  return `${readSourceTree(routesDir)}\n${readSourceTree(appDir, (fileName) =>
    /^app-(schema|acceptance|performance)\.tsx?$/.test(fileName) ||
    fileName === "app-schema.ts"
  )}`;
}

function removePngExportCanvasHelperCalls(source: string): string {
  return source.replace(
    /\bcreateCreativeAppsKitPngExportCanvas\s*\(\s*\{[\s\S]*?\}\s*\)/g,
    "createCreativeAppsKitPngExportCanvas({})",
  );
}

function getSchemaBackgroundControlTargets(
  controlTypes: ReadonlySet<string>,
): string[] {
  return (appSchema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls).flatMap(([controlId, control]) => {
      if (!controlTypes.has(control.type)) {
        return [];
      }

      const searchText = [
        section.title ?? "",
        controlId,
        control.target,
        typeof control.label === "string" ? control.label : "",
      ]
        .join(" ")
        .replace(/([a-z])([A-Z])/g, "$1 $2");

      if (!/\b(background|backdrop|scene|canvas|transparent|transparency|alpha)\b/i.test(searchText)) {
        return [];
      }

      return [control.target];
    }),
  );
}

function textLooksLikePngExport(text: string): boolean {
  return /\b(export|download)\b/i.test(text) && /\bpng\b|\bimage\b/i.test(text);
}

function textLooksLikeVideoExport(text: string): boolean {
  return /\b(export|download)\b/i.test(text) && /\b(video|mp4|webm|mov)\b/i.test(text);
}

function schemaHasAnimatedProductOutput(): boolean {
  if (appSchema.panels.timeline?.enabled) {
    return true;
  }

  if (
    appTransferMode.animationIntent?.mode === "autonomous" ||
    appTransferMode.animationIntent?.mode === "timeline-keyframes" ||
    appTransferMode.animationIntent?.mode === "timeline-playback"
  ) {
    return true;
  }

  if (appTransferMode.mode !== "reference-runtime-clone") {
    return false;
  }

  if (appTransferMode.referenceTimeline.mode !== "none") {
    return true;
  }

  return appTransferMode.behaviorCoverage.some((coverage) =>
    [
      "renderer-loop",
      "pause-resume",
      "restart",
      "time-progress",
      "export-at-time",
    ].includes(coverage),
  );
}

describe("Creative Apps Kit template app acceptance coverage", () => {
  it("requires acceptance coverage for every visible schema control", () => {
    expect(validateCreativeAppsKitAcceptanceCoverage(appSchema, appAcceptance)).toEqual([]);
  });

  it("requires explicit runtime acceptance before locking canvas output size", () => {
    const fixedOutputSchema = defineCreativeAppsKit({
      canvas: {
        enabled: true,
        size: { height: 1080, unit: "px", width: 1920 },
        sizing: { mode: "fixed-output" },
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                prompt: {
                  defaultValue: "Describe the effect",
                  label: "Prompt",
                  orderRole: "input",
                  target: "generation.prompt",
                  type: "text",
                },
              },
              title: "Generation",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(validateCreativeAppsKitAcceptanceCoverage(fixedOutputSchema, appAcceptance)).toEqual(
      expect.arrayContaining([
        'canvas.sizing mode "fixed-output" requires a runtime acceptance entry with canvasSizingCoverage "fixed-output-size" explaining why width and height are intentionally non-editable. A user-provided base/default size should normally use "editable-output".',
      ]),
    );
  });

  it("rejects fixed canvas sizing acceptance that only restates a default size", () => {
    const fixedOutputSchema = defineCreativeAppsKit({
      canvas: {
        enabled: true,
        size: { height: 1080, unit: "px", width: 1920 },
        sizing: { mode: "fixed-output" },
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                prompt: {
                  defaultValue: "Describe the effect",
                  label: "Prompt",
                  orderRole: "input",
                  target: "generation.prompt",
                  type: "text",
                },
              },
              title: "Generation",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(fixedOutputSchema, [
        ...appAcceptance,
        {
          automated: true,
          automatedTestName: "canvas starts at 1920 by 1080",
          browser: true,
          browserTestName: "browser: canvas starts at 1920 by 1080",
          canvasSizingCoverage: "fixed-output-size",
          componentType: "canvas",
          evidence: "product-output",
          expectedObservable: "The canvas starts at 1920 by 1080.",
          fixture: "canvas default size fixture",
          id: "canvas.sizing",
          kind: "runtime",
          userAction: "Open the app.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        'canvas.sizing canvasSizingCoverage "fixed-output-size" must explain why the product output dimensions are intentionally fixed, not merely initialized from a default size.',
      ]),
    );
  });

  it("requires compound controls to cover every semantic value part", () => {
    const compoundSchema = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                anchor: {
                  defaultValue: "center",
                  label: "Anchor",
                  orderRole: "spatial",
                  target: "mesh.anchor",
                  type: "anchorGrid",
                },
                focus: {
                  defaultValue: { x: "0.00", y: "0.00" },
                  label: "Focus",
                  orderRole: "spatial",
                  target: "mesh.focus",
                  type: "vector",
                },
                gradient: {
                  defaultValue: {
                    angle: 120,
                    gradientType: "linear",
                    stops: [
                      { color: "#1D1264", opacity: 100, position: "0%" },
                      { color: "#22A7FF", opacity: 100, position: "50%" },
                      { color: "#FFE97A", opacity: 100, position: "100%" },
                    ],
                  },
                  label: "Gradient",
                  orderRole: "color",
                  target: "mesh.gradient",
                  type: "gradient",
                },
                palette: {
                  defaultValue: { family: "Amber", shade: "500" },
                  label: "Palette",
                  orderRole: "color",
                  target: "mesh.palette",
                  type: "palette",
                },
                range: {
                  defaultValue: { end: "80%", start: "20%" },
                  label: "Range",
                  orderRole: "primary",
                  target: "mesh.range",
                  type: "rangeInput",
                },
                band: {
                  defaultValue: [20, 80],
                  label: "Band",
                  max: 100,
                  min: 0,
                  orderRole: "primary",
                  step: 1,
                  target: "mesh.band",
                  type: "rangeSlider",
                },
                mixer: {
                  defaultValue: {
                    B: { B: 100, G: 0, R: 0 },
                    G: { B: 0, G: 100, R: 0 },
                    R: { B: 0, G: 0, R: 100 },
                  },
                  label: "Channels",
                  orderRole: "color",
                  target: "mesh.channels",
                  type: "channelMixer",
                },
                curves: {
                  defaultValue: {
                    activeChannel: "RGB",
                    points: {
                      B: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                      G: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                      R: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                      RGB: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                    },
                  },
                  label: "Curves",
                  orderRole: "color",
                  target: "mesh.curves",
                  type: "curves",
                },
              },
              title: "Compound",
            },
          ],
          title: "Controls",
        },
      },
    });

    const acceptance = [
      "mesh.anchor",
      "mesh.focus",
      "mesh.gradient",
      "mesh.palette",
      "mesh.range",
      "mesh.band",
      "mesh.channels",
      "mesh.curves",
    ].map((target) => ({
      automated: true,
      automatedTestName: `${target} changes output`,
      browser: true,
      browserTestName: `browser: ${target} changes output`,
      componentType:
        target === "mesh.anchor"
          ? "anchorGrid"
          : target === "mesh.focus"
            ? "vector"
            : target === "mesh.gradient"
              ? "gradient"
              : target === "mesh.palette"
                ? "palette"
                : target === "mesh.range"
                  ? "rangeInput"
                  : target === "mesh.band"
                    ? "rangeSlider"
                    : target === "mesh.channels"
                      ? "channelMixer"
                      : "curves",
      evidence: "product-output" as const,
      expectedObservable: `${target} changes the rendered product output.`,
      fixture: "compound fixture",
      id: target,
      kind: "control" as const,
      target,
      userAction: `Change ${target}.`,
    }));

    expect(
      validateCreativeAppsKitAcceptanceCoverage(compoundSchema, acceptance),
    ).toEqual(
      expect.arrayContaining([
        "anchor (mesh.anchor) must declare controlPartCoverage for every semantic value part: anchorGrid.position.",
        "focus (mesh.focus) must declare controlPartCoverage for every semantic value part: vector.x, vector.y.",
        "gradient (mesh.gradient) must declare controlPartCoverage for every semantic value part: gradient.gradientType, gradient.angle, gradient.stops.position, gradient.stops.color, gradient.stops.opacity.",
        "palette (mesh.palette) must declare controlPartCoverage for every semantic value part: palette.family, palette.shade.",
        "Compound / range (mesh.range) must declare controlPartCoverage for every semantic value part: rangeInput.start, rangeInput.end.",
        "Compound / band (mesh.band) must declare controlPartCoverage for every semantic value part: rangeSlider.lower, rangeSlider.upper.",
        "mixer (mesh.channels) must declare controlPartCoverage for every semantic value part: channelMixer.activeChannel, channelMixer.values.",
        "curves (mesh.curves) must declare controlPartCoverage for every semantic value part: curves.activeChannel, curves.points.",
      ]),
    );
  });

  it("accepts compound controls only when every semantic value part is declared", () => {
    const gradientSchema = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                gradient: {
                  defaultValue: {
                    angle: 120,
                    gradientType: "linear",
                    stops: [
                      { color: "#1D1264", opacity: 100, position: "0%" },
                      { color: "#22A7FF", opacity: 100, position: "50%" },
                      { color: "#FFE97A", opacity: 100, position: "100%" },
                    ],
                  },
                  label: "Gradient",
                  orderRole: "color",
                  target: "mesh.gradient",
                  type: "gradient",
                },
              },
              title: "Gradient",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(
        gradientSchema,
        [
          {
            automated: true,
            automatedTestName: "gradient type angle and stops change output",
            browser: true,
            browserTestName: "browser: gradient type angle and stops change output",
            componentType: "gradient",
            controlPartCoverage: [
              "gradient.gradientType",
              "gradient.angle",
              "gradient.stops.position",
              "gradient.stops.color",
              "gradient.stops.opacity",
            ],
            evidence: "product-output",
            expectedObservable:
              "Changing gradient type, angle, stop position, stop color, and stop opacity changes the rendered output.",
            fixture: "gradient fixture",
            id: "mesh.gradient",
            kind: "control",
            target: "mesh.gradient",
            userAction: "Change every visible part of the Gradient control.",
          },
        ],
        staticFixtureTransferMode,
      ),
    ).toEqual([]);
  });

  it("keeps the app route backed by the Creative Apps Kit template shell", () => {
    const routeSource = readSourceTree(routesDir);

    expect(
      routeSource,
      "The route must render CreativeAppsKitApp directly; mentions in tests/docs do not prove the app shell is used.",
    ).toMatch(creativeAppsKitAppRenderPattern);
    expect(
      routeSource,
      "Routes must not manually compose low-level runtime surfaces. Use CreativeAppsKitApp so panel, canvas, toolbar, layers, and timeline design stay runtime-owned.",
    ).not.toMatch(manualRuntimeSurfaceRenderPattern);
    expect(routeSource).not.toMatch(
      /<\s*iframe\b|React\.createElement\s*\(\s*["']iframe["']/i,
    );
  });

  it("detects manual runtime surface composition even when acceptance text mentions CreativeAppsKitApp", () => {
    const bypassRouteSource = stripJsComments(`
      import {
        CanvasShell,
        ControlsPanel,
        CreativeAppsKitRoot,
        ToolbarPanel,
      } from "@/creative-apps-kit/template-runtime/react";

      export function AppHome() {
        return (
          <CreativeAppsKitRoot schema={appSchema}>
            <CanvasShell renderDefaultMedia={false}>
              <ProductCanvas />
            </CanvasShell>
            <AppPlaybackPanel />
            <ControlsPanel panelPlacement="floating" />
            <ToolbarPanel panelPlacement="floating" />
          </CreativeAppsKitRoot>
        );
      }

      const acceptanceText =
        "preserve the reference renderer inside CreativeAppsKitApp canvasContent";
    `);

    expect(bypassRouteSource).not.toMatch(creativeAppsKitAppRenderPattern);
    expect(bypassRouteSource).toMatch(manualRuntimeSurfaceRenderPattern);
    expect(bypassRouteSource).toMatch(customTimelineTransportRenderPattern);
  });

  it("does not allow app-level playback transport beside the runtime timeline", () => {
    const routeSource = readSourceTree(routesDir);
    const referenceTimelineMode =
      appTransferMode.mode === "reference-runtime-clone"
        ? appTransferMode.referenceTimeline.mode
        : null;

    if (
      appSchema.panels.timeline?.enabled &&
      referenceTimelineMode !== "custom-reference-timeline"
    ) {
      expect(
        routeSource,
        "Creative Apps Kit playback/keyframe timelines must use the runtime TimelinePanel. App-level playback/transport panels are allowed only for explicit custom-reference-timeline transfers.",
      ).not.toMatch(customTimelineTransportRenderPattern);
    }
  });

  it("publishes control order targets for app schema tests", () => {
    expect(getCreativeAppsKitControlOrderTargets(appSchema)).toEqual([
      "runtime.settingsTransfer",
      "canvas.size.width",
      "canvas.size.height",
      "board.tile.width",
      "board.tile.height",
      "board.tile.gap",
      "board.cell.radius",
      "board.cell.fill",
      "board.cell.border",
      "board.cell.fillOpacityRange",
      "board.cell.bottomHighlightOpacityRange",
      "board.cell.bottomHighlightFillCanvas",
      "board.cell.fillSeed",
      "board.cell.bottomHighlightSeed",
      "board.text.message",
      "board.text.targetMessage",
      "board.text.finalHoldSeconds",
      "board.text.uppercase",
      "board.text.letterDurationRange",
      "board.text.letterSpeed",
      "board.text.outgoingOpacityRange",
      "board.text.flashColorCount",
      "board.text.flashFrequency",
      "board.text.flashColor1",
      "board.text.flashColor2",
      "board.text.flashColor3",
      "board.text.flashColor4",
      "board.text.messageTypography",
      "board.text.color",
      "board.flip.mode",
      "board.flip.wear",
      "board.sound.enabled",
      "board.flip.trailOpacity",
      "board.flip.shake",
      "board.sound.volume",
      "field.fillStart",
      "field.fillEnd",
      "field.durationRange",
      "field.speed",
      "field.typography",
      "field.opacityRange",
      "field.seed",
      "export.video.format",
      "export.video.quality",
      "appearance.background",
      "export.includeBackground",
    ]);
  });

  it("defaults generated apps to new Creative Apps Kit assembly mode", () => {
    expect(appTransferMode).toEqual({
      animationIntent: { mode: "timeline-playback" },
      mode: "new-creative-apps-kit-app",
    });
  });

  it("allows neutral readiness only for the source starter/template folder", () => {
    if (appProductReadiness.mode === "product") {
      expect(appProductReadiness.productName.trim()).not.toBe("");
      expect(appProductReadiness.productSummary.trim()).not.toBe("");
      expect(appProductReadiness.requestedBehavior.trim()).not.toBe("");
      expect(
        schemaHasProductSurface(),
        "Product readiness requires product surface: controls, layers, timeline, canvasContent, or acceptance coverage.",
      ).toBe(true);
      return;
    }

    expect(appProductReadiness.reason.trim()).not.toBe("");
    expect(
      isNeutralTemplateProject(),
      "Renamed/generated product folders must switch product readiness from starter to product so an empty template cannot pass as an implemented app.",
    ).toBe(true);
    expect(
      schemaHasProductSurface(),
      "Neutral starter readiness must not be used after adding product controls, timeline, layers, canvasContent, or acceptance coverage.",
    ).toBe(false);
  });

  it("keeps an implementation worklog available for generated app decisions", () => {
    expect(
      existsSync(agentWorklogPath),
      "Generated apps must include docs/creative-apps-kit/agent-worklog.md so implementation decisions and evidence survive the chat context.",
    ).toBe(true);
  });

  it("requires product apps to replace the starter worklog with decision evidence", () => {
    if (appProductReadiness.mode !== "product" && !schemaHasProductSurface()) {
      return;
    }

    expect(existsSync(agentWorklogPath)).toBe(true);

    const worklogSource = readFileSync(agentWorklogPath, "utf8");

    expect(getAgentWorklogValidationErrors(worklogSource)).toEqual([]);
  });

  it("rejects stale or incomplete product worklogs", () => {
    const staleWorklog = `
      # Implementation Worklog

      ## Status

      Mode: starter

      ## Decisions

      ### Renderer

      - Decision: No product renderer yet.
      - Reason: The starter is neutral.
      - Evidence: No canvasContent.

      ### Timeline

      - Decision: No timeline yet.
      - Reason: No animation.
      - Evidence: panels.timeline is omitted.

      ### Layers

      - Decision: No layers yet.
      - Reason: No layer workflow.
      - Evidence: panels.layers is omitted.

      ### Controls

      - Decision: No controls yet.
      - Reason: No product behavior.
      - Evidence: no sections.

      ### Export

      - Decision: No export yet.
      - Reason: No product output.
      - Evidence: no panelActions.

      ### Performance

      - Decision: No workload yet.
      - Reason: No renderer.
      - Evidence: neutral matrix.

      ## Evidence

      - Source reviewed: starter schema.

      ## Verification

      - Run: pnpm verify:quick

      ## Risks

      - Risk: starter template.
    `;

    expect(getAgentWorklogValidationErrors(staleWorklog)).toContain(
      'agent-worklog.md Status must declare "Mode: product" before final delivery.',
    );
    expect(getAgentWorklogValidationErrors(staleWorklog)).toContain(
      'agent-worklog.md still declares "Mode: starter"; replace the starter template with product decisions.',
    );
  });

  it("accepts product worklogs with concrete decisions, evidence, verification, and risk state", () => {
    const productWorklog = `
      # Implementation Worklog

      ## Status

      Mode: product

      ## Decisions

      ### Renderer

      - Decision: Use SVG for vector foreground and Canvas 2D for dense background.
      - Reason: Foreground geometry must stay crisp while background workload is raster-like.
      - Evidence: src/app/app-performance.ts rendererTechnique layers and browser perf trace.

      ### Timeline

      - Decision: Use Creative Apps Kit playback timeline.
      - Reason: The product has play, pause, scrub, duration, loop, and export-at-time behavior.
      - Evidence: appSchema.panels.timeline.mode and e2e timeline playback test.

      ### Layers

      - Decision: Do not enable layers.
      - Reason: The product edits one generated output, not independent layer objects.
      - Evidence: appSchema.panels.layers is omitted and acceptance has no layer rows.

      ### Controls

      - Decision: Group controls by Background, Motion, and Export.
      - Reason: Each section maps to a product entity or workflow stage.
      - Evidence: src/app/app-schema.ts control targets and app-acceptance rows.

      ### Export

      - Decision: Provide Export Video primary and Export PNG secondary.
      - Reason: The product is animated but still frames are useful.
      - Evidence: panelActions plus export browser tests.

      ### Performance

      - Decision: Run viewport-stability and animation drag budgets.
      - Reason: Animation and canvas movement are performance-sensitive.
      - Evidence: pnpm verify:perf browser run.

      ## Evidence

      - Source reviewed: src/app/app-schema.ts, src/app/app-performance.ts, e2e/app-controls.spec.ts.
      - Contract applied: runtime-shell-required, timeline-enabled-behavior, performance-coverage-levels.

      ## Verification

      - Run: pnpm verify:quick
      - Run: pnpm verify:perf
      - Browser: timeline pause/resume and canvas drag stress.

      ## Risks

      - None: remaining risks are covered by browser and performance gates.
    `;

    expect(getAgentWorklogValidationErrors(productWorklog)).toEqual([]);
  });

  it("requires product output apps to expose export actions in the sticky footer", () => {
    if (appProductReadiness.mode !== "product" && !schemaHasProductSurface()) {
      return;
    }

    const panelActionTexts = getSchemaPanelActionSearchTexts();
    const browserTestSources = readBrowserTestSources();
    const productImplementationSource = getProductImplementationSource();
    const productRuntimeImplementationSource = getProductRuntimeImplementationSource();
    const backgroundColorTargets = getSchemaBackgroundControlTargets(new Set(["color"]));
    const backgroundToggleTargets = getSchemaBackgroundControlTargets(
      new Set(["checkbox", "select", "segmented", "switch"]),
    );

    expect(
      panelActionTexts.length,
      "Product apps must define panelActions in the controls panel sticky footer.",
    ).toBeGreaterThan(0);
    expect(
      panelActionTexts.some(textLooksLikePngExport),
      "Every product app must expose Export PNG or Download PNG through panelActions.",
    ).toBe(true);
    expect(
      productImplementationSource,
      "PNG export must use createCreativeAppsKitPngExportCanvas so background transparency and retina sizing follow the standard runtime contract.",
    ).toMatch(/\bcreateCreativeAppsKitPngExportCanvas\b/);
    expect(
      productImplementationSource,
      "PNG export must pass includeBackground from runtime state to createCreativeAppsKitPngExportCanvas; do not hardcode PNG transparency or background inclusion in schema only.",
    ).toMatch(/\bcreateCreativeAppsKitPngExportCanvas\s*\(\s*\{[\s\S]*\bincludeBackground\s*:/);
    expect(
      removePngExportCanvasHelperCalls(productRuntimeImplementationSource),
      "export.includeBackground may only be read by the PNG export helper. Live preview, workspace canvas backing, and video renderers must not become transparent when Include background is off.",
    ).not.toMatch(/\bexport\.includeBackground\b/);
    expect(
      backgroundColorTargets.length,
      "Every product app with Export PNG must expose a user-facing background color control.",
    ).toBeGreaterThan(0);
    expect(
      backgroundToggleTargets.length,
      "Every product app with Export PNG must expose a user-facing Include background / Transparent background control.",
    ).toBeGreaterThan(0);

    for (const target of [...backgroundColorTargets, ...backgroundToggleTargets]) {
      expect(
        productRuntimeImplementationSource,
        `Runtime renderer/export code must read ${target}; declaring the control in schema is not enough.`,
      ).toContain(target);
    }

    if (!schemaHasAnimatedProductOutput()) {
      return;
    }

    const videoExportSection = getSchemaVideoExportSection();
    const videoFormatControl = getSectionControlByTarget(
      videoExportSection,
      "export.video.format",
    );
    const videoQualityControl = getSectionControlByTarget(
      videoExportSection,
      "export.video.quality",
    );
    const videoFormatOptionValues = getControlOptionValues(videoFormatControl);
    const videoQualityOptionValues = getControlOptionValues(videoQualityControl);
    const hasMovOrProResFormat = videoFormatOptionValues.some((value) =>
      /\b(mov|prores)\b/i.test(value),
    );

    expect(
      panelActionTexts.some(textLooksLikeVideoExport),
      "Animated product apps must expose Export Video through panelActions in addition to Export PNG.",
    ).toBe(true);
    expect(
      panelActionTexts.length,
      "Animated product apps need separate footer delivery actions for Export Video and Export PNG.",
    ).toBeGreaterThanOrEqual(2);
    expect(
      productImplementationSource,
      "Video export must use getCreativeAppsKitRetinaExportSize so video dimensions follow the same retina export contract.",
    ).toMatch(/\bgetCreativeAppsKitRetinaExportSize\b/);
    expect(
      productImplementationSource,
      "Video export must use shouldIncludeCreativeAppsKitExportBackground so PNG transparency does not remove the video background.",
    ).toMatch(/\bshouldIncludeCreativeAppsKitExportBackground\b/);
    expect(
      videoExportSection,
      'Animated product apps with Export Video must expose video settings in a separate controls section titled "Video Export".',
    ).toBeDefined();
    expect(
      videoFormatControl,
      'The separate "Video Export" section must include a format control with target "export.video.format".',
    ).toBeDefined();
    expect(
      ["select", "segmented"],
      "Video format must be a Select or Segmented control so the user chooses a supported container instead of typing a freeform value.",
    ).toContain(videoFormatControl?.type);
    expect(
      videoFormatOptionValues,
      'Video format options must include safe browser baseline choices: "auto", "webm", and "mp4".',
    ).toEqual(expect.arrayContaining(["auto", "webm", "mp4"]));
    expect(
      videoQualityControl,
      'The separate "Video Export" section must include a quality control with target "export.video.quality".',
    ).toBeDefined();
    expect(
      ["select", "segmented"],
      "Video quality must be a Select or Segmented control. Add extra bitrate controls only after the base quality control exists.",
    ).toContain(videoQualityControl?.type);
    expect(
      videoQualityOptionValues.some((value) => /\b(high|4k|source)\b/i.test(value)),
      'Video quality options must include a high-quality target such as "high", "4k", or "source".',
    ).toBe(true);
    expect(
      sourceHasVideoCapabilityCheck(productImplementationSource),
      "Video export must check the supported MIME/container through MediaRecorder.isTypeSupported or an explicit encoder/transcoder capability check.",
    ).toBe(true);
    expect(
      productRuntimeImplementationSource,
      'Video export implementation must read "export.video.format" from runtime state; declaring the control is not enough.',
    ).toContain("export.video.format");
    expect(
      productRuntimeImplementationSource,
      'Video export implementation must read "export.video.quality" from runtime state; declaring the control is not enough.',
    ).toContain("export.video.quality");
    expect(
      sourceHasVideoDurationMetadataCoverage(browserTestSources),
      "Video export browser coverage must load the exported blob as a <video>, wait for loadedmetadata, and compare video.duration with the edited timeline duration. blobSize/blobType checks alone do not prove timeline-length export.",
    ).toBe(true);
    if (hasMovOrProResFormat) {
      expect(
        sourceHasCustomMovOrProResEncoder(productImplementationSource),
        "MOV or ProRes are not baseline browser MediaRecorder outputs; they require a custom encoder/transcoder path.",
      ).toBe(true);
    }
  });

  it("rejects reset actions in sticky footer panelActions", () => {
    const schemaWithFooterReset = defineCreativeAppsKit({
      canvas: {
        enabled: true,
        sizing: { mode: "editable-output" },
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                outputActions: {
                  actions: [
                    {
                      command: "controls.reset",
                      icon: "rotate-ccw",
                      label: "Reset",
                      value: "reset",
                    },
                    {
                      icon: "export",
                      label: "Export PNG",
                      value: "export.png",
                    },
                  ],
                  target: "actions.output",
                  type: "panelActions",
                },
              },
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithFooterReset, [
        {
          actionCoverage: ["reset", "export.png"],
          automated: true,
          automatedTestName: "footer actions reset and export output",
          browser: true,
          browserTestName: "browser: footer actions reset and export output",
          componentType: "panelActions",
          evidence: "exported-bytes",
          expectedObservable: "Footer actions reset controls and export output.",
          fixture: "footer actions fixture",
          id: "actions.output",
          kind: "control",
          target: "actions.output",
          userAction: "Click Reset and Export PNG.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("must not include Reset footer actions (reset)"),
      ]),
    );
  });

  it("requires png export apps to expose background color and png background toggle controls", () => {
    const schemaWithoutBackgroundControls = defineCreativeAppsKit({
      canvas: {
        enabled: true,
        sizing: { mode: "editable-output" },
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                outputActions: {
                  actions: [
                    {
                      icon: "export",
                      label: "Export PNG",
                      value: "export.png",
                    },
                  ],
                  target: "actions.output",
                  type: "panelActions",
                },
              },
              title: "Output",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithoutBackgroundControls, [
        {
          actionCoverage: ["export.png"],
          automated: true,
          automatedTestName: "exports png output",
          browser: true,
          browserTestName: "browser: exports png output",
          componentType: "panelActions",
          evidence: "exported-bytes",
          expectedObservable: "Export PNG creates output bytes.",
          fixture: "export fixture",
          id: "actions.output",
          kind: "control",
          target: "actions.output",
          userAction: "Click Export PNG.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("must expose a user-facing background color control"),
        expect.stringContaining("must expose a user-facing Include background / Transparent background control"),
      ]),
    );
  });

  it("accepts png export apps that wire background controls into the schema", () => {
    const schemaWithBackgroundControls = defineCreativeAppsKit({
      canvas: {
        enabled: true,
        sizing: { mode: "editable-output" },
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                background: {
                  defaultValue: "#ffffff",
                  label: "Background",
                  target: "appearance.background",
                  type: "color",
                },
                includeBackground: {
                  defaultValue: true,
                  label: "Include background",
                  target: "export.includeBackground",
                  type: "switch",
                },
                outputActions: {
                  actions: [
                    {
                      icon: "export",
                      label: "Export PNG",
                      value: "export.png",
                    },
                  ],
                  target: "actions.output",
                  type: "panelActions",
                },
              },
              title: "Output",
            },
          ],
          title: "Controls",
        },
      },
    });
    const errors = validateCreativeAppsKitAcceptanceCoverage(schemaWithBackgroundControls, [
      makeControlAcceptance("appearance.background", "color"),
      {
        ...makeControlAcceptance("export.includeBackground", "switch"),
        expectedObservable:
          "Turning Include background off makes PNG output transparent while live preview, workspace canvas backing, and video output keep the product background.",
        userAction:
          "Toggle Include background off, export PNG, then verify the PNG has alpha while the live preview canvas still preserves the background.",
      },
      {
        actionCoverage: ["export.png"],
        automated: true,
        automatedTestName: "exports png output with current background settings",
        browser: true,
        browserTestName: "browser: exports png output with current background settings",
        componentType: "panelActions",
        evidence: "exported-bytes",
        expectedObservable:
          "Export PNG creates output bytes and reads background color plus include-background state.",
        fixture: "export fixture",
        id: "actions.output",
        kind: "control",
        target: "actions.output",
        userAction: "Toggle Include background, change Background, then click Export PNG.",
      },
    ]);

    expect(errors).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("must expose a user-facing background color control"),
        expect.stringContaining("must expose a user-facing Include background / Transparent background control"),
      ]),
    );
  });

  it("requires include-background acceptance to keep live preview and canvas backing visible", () => {
    const schemaWithBackgroundControls = defineCreativeAppsKit({
      canvas: {
        enabled: true,
        sizing: { mode: "editable-output" },
      },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                background: {
                  defaultValue: "#ffffff",
                  label: "Background",
                  target: "appearance.background",
                  type: "color",
                },
                includeBackground: {
                  defaultValue: true,
                  label: "Include background",
                  target: "export.includeBackground",
                  type: "switch",
                },
                outputActions: {
                  actions: [
                    {
                      icon: "export",
                      label: "Export PNG",
                      value: "export.png",
                    },
                  ],
                  target: "actions.output",
                  type: "panelActions",
                },
              },
              title: "Output",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithBackgroundControls, [
        makeControlAcceptance("appearance.background", "color"),
        makeControlAcceptance("export.includeBackground", "switch"),
        {
          actionCoverage: ["export.png"],
          automated: true,
          automatedTestName: "exports png output with current background settings",
          browser: true,
          browserTestName: "browser: exports png output with current background settings",
          componentType: "panelActions",
          evidence: "exported-bytes",
          expectedObservable:
            "Export PNG creates output bytes and reads background color plus include-background state.",
          fixture: "export fixture",
          id: "actions.output",
          kind: "control",
          target: "actions.output",
          userAction: "Toggle Include background, change Background, then click Export PNG.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "controls PNG background inclusion and acceptance must prove disabling it makes PNG output transparent while live preview, workspace canvas backing, and video output keep the product background.",
        ),
      ]),
    );
  });

  it("requires disabledWhen controls to reference a real target and prove disabled behavior", () => {
    const schemaWithDisabledDependency = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                fillMode: {
                  defaultValue: "full",
                  label: "Fill mode",
                  options: [
                    { label: "Full", value: "full" },
                    { label: "Partial", value: "partial" },
                  ],
                  target: "distribution.fillMode",
                  type: "segmented",
                },
                fillAmount: {
                  defaultValue: 50,
                  disabledWhen: {
                    equals: "full",
                    target: "distribution.mode",
                  },
                  label: "Fill level",
                  max: 100,
                  min: 0,
                  target: "distribution.fillAmount",
                  type: "slider",
                },
              },
              title: "Distribution",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithDisabledDependency, [
        makeControlAcceptance("distribution.fillMode", "segmented"),
        makeControlAcceptance("distribution.fillAmount", "slider"),
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "disabledWhen target distribution.mode does not match another schema control target",
        ),
        expect.stringContaining(
          "uses disabledWhen and acceptance must prove the control becomes disabled/unavailable",
        ),
      ]),
    );

    const schemaWithValidDependency = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                fillMode: {
                  defaultValue: "full",
                  label: "Fill mode",
                  options: [
                    { label: "Full", value: "full" },
                    { label: "Partial", value: "partial" },
                  ],
                  target: "distribution.fillMode",
                  type: "segmented",
                },
                fillAmount: {
                  defaultValue: 50,
                  disabledWhen: {
                    equals: "full",
                    target: "distribution.fillMode",
                  },
                  label: "Fill level",
                  max: 100,
                  min: 0,
                  target: "distribution.fillAmount",
                  type: "slider",
                },
              },
              title: "Distribution",
            },
          ],
          title: "Controls",
        },
      },
    });
    const errors = validateCreativeAppsKitAcceptanceCoverage(schemaWithValidDependency, [
      makeControlAcceptance("distribution.fillMode", "segmented"),
      {
        ...makeControlAcceptance("distribution.fillAmount", "slider"),
        expectedObservable:
          "Fill level changes partial fill output and becomes disabled when Fill mode is Full.",
        userAction: "Switch Fill mode to Full, verify Fill level is disabled, then switch to Partial and drag it.",
      },
    ]);

    expect(errors).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("disabledWhen target"),
        expect.stringContaining("uses disabledWhen and acceptance must prove"),
      ]),
    );
  });

  it("rejects Enable or Disable prefixes on binary control labels", () => {
    const schemaWithActionLabels = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                crt: {
                  defaultValue: true,
                  label: "Enable CRT",
                  target: "effects.crt",
                  type: "switch",
                },
                guides: {
                  defaultValue: false,
                  label: "Disable guides",
                  target: "overlay.guides",
                  type: "checkbox",
                },
              },
              title: "Effects",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithActionLabels, [
        makeControlAcceptance("effects.crt", "switch"),
        makeControlAcceptance("overlay.guides", "checkbox"),
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'effects.crt) toggle labels must name the setting context only; use "CRT", "Background", "Glow", or "Loop" instead of "Enable CRT".',
        ),
        expect.stringContaining(
          'overlay.guides) toggle labels must name the setting context only; use "CRT", "Background", "Glow", or "Loop" instead of "Disable guides".',
        ),
      ]),
    );

    const schemaWithContextLabels = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                crt: {
                  defaultValue: true,
                  label: "CRT",
                  target: "effects.crt",
                  type: "switch",
                },
                guides: {
                  defaultValue: false,
                  label: "Guides",
                  target: "overlay.guides",
                  type: "checkbox",
                },
              },
              title: "Effects",
            },
          ],
          title: "Controls",
        },
      },
    });

    const errors = validateCreativeAppsKitAcceptanceCoverage(schemaWithContextLabels, [
      makeControlAcceptance("effects.crt", "switch"),
      makeControlAcceptance("overlay.guides", "checkbox"),
    ]);

    expect(errors).not.toEqual(
      expect.arrayContaining([
        expect.stringContaining("toggle labels must name the setting context only"),
      ]),
    );
  });

  it("requires explicit reference behavior coverage in reference-runtime-clone mode", () => {
    expect(
      validateCreativeAppsKitAcceptanceCoverage(appSchema, appAcceptance, {
        behaviorCoverage: [
          "canvas-sizing",
          "control-mapping",
          "renderer-state",
          "renderer-loop",
        ],
        mode: "reference-runtime-clone",
        referenceName: "legacy badge wall",
        sourceOfTruth: "reference-runtime",
      } as never),
    ).toEqual(
      expect.arrayContaining([
        'reference-runtime-clone behaviorCoverage "canvas-sizing" is missing an acceptance entry with referenceCoverage "canvas-sizing".',
        'reference-runtime-clone behaviorCoverage "control-mapping" is missing an acceptance entry with referenceCoverage "control-mapping".',
        'reference-runtime-clone behaviorCoverage "renderer-state" is missing an acceptance entry with referenceCoverage "renderer-state".',
        'reference-runtime-clone behaviorCoverage "renderer-loop" is missing an acceptance entry with referenceCoverage "renderer-loop".',
        'reference-runtime-clone transferMode must declare referenceTimeline with mode "none", "creative-apps-kit-playback", "creative-apps-kit-keyframes", or "custom-reference-timeline".',
      ]),
    );
  });

  it("rejects reference-runtime-clone apps that disable the Creative Apps Kit canvas shell", () => {
    const schemaWithoutCanvas = defineCreativeAppsKit({
      canvas: {
        enabled: false,
        size: { height: 720, unit: "px", width: 1280 },
      },
      panels: {},
      toolbar: {
        history: false,
        radar: false,
        theme: false,
        zoom: false,
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(
        schemaWithoutCanvas,
        [
          ...appAcceptance,
          {
            automated: true,
            automatedTestName: "reference canvas size matches legacy renderer",
            browser: true,
            browserTestName: "browser: reference canvas size matches legacy renderer",
            componentType: "custom-renderer",
            evidence: "rendered-pixels",
            expectedObservable:
              "The Creative Apps Kit renderer uses the same output dimensions as the reference runtime.",
            fixture: "legacy renderer fixture",
            id: "reference.canvasSizing",
            kind: "runtime",
            referenceCoverage: "canvas-sizing",
            userAction: "Render the reference-sized output.",
          },
          {
            automated: true,
            automatedTestName: "reference control mapping preserves legacy output",
            browser: true,
            browserTestName: "browser: reference control mapping preserves legacy output",
            componentType: "custom-renderer",
            evidence: "product-output",
            expectedObservable:
              "Changing each mapped control updates the same renderer parameter as the reference app.",
            fixture: "legacy controls fixture",
            id: "reference.controlMapping",
            kind: "runtime",
            referenceCoverage: "control-mapping",
            userAction: "Change mapped controls and compare reference output behavior.",
          },
          {
            automated: true,
            automatedTestName: "reference renderer state preserves legacy lifecycle",
            browser: true,
            browserTestName: "browser: reference renderer state preserves legacy lifecycle",
            componentType: "custom-renderer",
            evidence: "product-output",
            expectedObservable:
              "The renderer preserves the reference runtime mutable state lifecycle across frames.",
            fixture: "legacy renderer state fixture",
            id: "reference.rendererState",
            kind: "runtime",
            referenceCoverage: "renderer-state",
            userAction: "Run the renderer across frames and compare stateful output.",
          },
        ],
        {
          behaviorCoverage: ["canvas-sizing", "control-mapping", "renderer-state"],
          mode: "reference-runtime-clone",
          referenceName: "legacy iframe shell",
          referenceTimeline: { behaviorCoverage: [], mode: "none" },
          sourceOfTruth: "reference-runtime",
        },
      ),
    ).toContain(
      "reference-runtime-clone must keep the Creative Apps Kit canvas shell enabled; preserve the reference renderer inside CreativeAppsKitApp canvasContent instead of replacing the app with the original UI.",
    );
  });

  it("accepts reference-runtime-clone mode only when required reference behavior is test-backed", () => {
    expect(
      validateCreativeAppsKitAcceptanceCoverage(
        appSchema,
        [
          ...appAcceptance,
          {
            automated: true,
            automatedTestName: "reference canvas size matches legacy renderer",
            browser: true,
            browserTestName: "browser: reference canvas size matches legacy renderer",
            componentType: "custom-renderer",
            evidence: "rendered-pixels",
            expectedObservable:
              "The Creative Apps Kit renderer uses the same output dimensions as the reference runtime.",
            fixture: "legacy renderer fixture",
            id: "reference.canvasSizing",
            kind: "runtime",
            referenceCoverage: "canvas-sizing",
            userAction: "Render the reference-sized output.",
          },
          {
            automated: true,
            automatedTestName: "reference control mapping preserves legacy output",
            browser: true,
            browserTestName: "browser: reference control mapping preserves legacy output",
            componentType: "custom-renderer",
            evidence: "product-output",
            expectedObservable:
              "Changing each mapped control updates the same renderer parameter as the reference app.",
            fixture: "legacy controls fixture",
            id: "reference.controlMapping",
            kind: "runtime",
            referenceCoverage: "control-mapping",
            userAction: "Change mapped controls and compare reference output behavior.",
          },
          {
            automated: true,
            automatedTestName: "reference renderer state preserves legacy lifecycle",
            browser: true,
            browserTestName: "browser: reference renderer state preserves legacy lifecycle",
            componentType: "custom-renderer",
            evidence: "product-output",
            expectedObservable:
              "The renderer preserves the reference runtime mutable state lifecycle across frames.",
            fixture: "legacy renderer state fixture",
            id: "reference.rendererState",
            kind: "runtime",
            referenceCoverage: "renderer-state",
            userAction: "Run the renderer across frames and compare stateful output.",
          },
        ],
        {
          behaviorCoverage: ["canvas-sizing", "control-mapping", "renderer-state"],
          mode: "reference-runtime-clone",
          referenceName: "legacy badge wall",
          referenceTimeline: { behaviorCoverage: [], mode: "none" },
          sourceOfTruth: "reference-runtime",
        },
      ),
    ).toEqual([]);
  });

  it("requires reference clones with pause resume behavior to choose a non-none timeline mode", () => {
    expect(
      validateCreativeAppsKitAcceptanceCoverage(appSchema, appAcceptance, {
        behaviorCoverage: [
          "canvas-sizing",
          "control-mapping",
          "renderer-state",
          "pause-resume",
        ],
        mode: "reference-runtime-clone",
        referenceName: "legacy pause animation",
        referenceTimeline: { behaviorCoverage: [], mode: "none" },
        sourceOfTruth: "reference-runtime",
      }),
    ).toContain(
      'reference-runtime-clone transport behaviorCoverage "pause-resume" requires referenceTimeline mode "creative-apps-kit-playback", "creative-apps-kit-keyframes", or "custom-reference-timeline"; mode "none" is only for references with no user-facing transport behavior.',
    );
  });

  it("rejects reference clones that hide restart transport behind timeline none", () => {
    expect(
      validateCreativeAppsKitAcceptanceCoverage(appSchema, appAcceptance, {
        behaviorCoverage: [
          "canvas-sizing",
          "control-mapping",
          "renderer-state",
          "restart",
          "time-progress",
        ],
        mode: "reference-runtime-clone",
        referenceName: "legacy restart animation",
        referenceTimeline: { behaviorCoverage: [], mode: "none" },
        sourceOfTruth: "reference-runtime",
      }),
    ).toContain(
      'reference-runtime-clone transport behaviorCoverage "restart", "time-progress" requires referenceTimeline mode "creative-apps-kit-playback", "creative-apps-kit-keyframes", or "custom-reference-timeline"; mode "none" is only for references with no user-facing transport behavior.',
    );
  });

  it("requires playback reference timelines to declare concrete behavior coverage", () => {
    expect(
      validateCreativeAppsKitAcceptanceCoverage(appSchema, appAcceptance, {
        behaviorCoverage: ["canvas-sizing", "control-mapping", "renderer-state"],
        mode: "reference-runtime-clone",
        referenceName: "legacy playback animation",
        referenceTimeline: { behaviorCoverage: [], mode: "creative-apps-kit-playback" },
        sourceOfTruth: "reference-runtime",
      }),
    ).toContain(
      'referenceTimeline mode "creative-apps-kit-playback" must list the concrete timeline transport behaviors in behaviorCoverage.',
    );
  });

  it("rejects right-panel transport controls when timeline playback owns transport", () => {
    const schemaWithPanelTransportControls = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                pause: {
                  defaultValue: false,
                  label: "Paused",
                  orderRole: "primary",
                  target: "animation.paused",
                  type: "switch",
                },
                restart: {
                  actions: [
                    {
                      icon: "rotate-ccw",
                      label: "Restart",
                      value: "animation.restart",
                    },
                  ],
                  defaultValue: null,
                  label: "Run",
                  orderRole: "action",
                  target: "animation.actions",
                  type: "actions",
                },
              },
              title: "Run",
            },
          ],
          title: "Controls",
        },
        timeline: { enabled: true, mode: "playback" as const },
      },
    } as const;

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithPanelTransportControls, [
        playbackTimelineAcceptance,
        {
          automated: true,
          automatedTestName: "paused switch freezes output",
          browser: true,
          browserTestName: "browser: paused switch freezes output",
          componentType: "switch",
          evidence: "timeline-output",
          expectedObservable: "Paused switch freezes the timeline output.",
          fixture: "timeline fixture",
          id: "animation.paused",
          kind: "control",
          target: "animation.paused",
          userAction: "Toggle Paused.",
        },
        {
          automated: true,
          automatedTestName: "restart action resets output",
          browser: true,
          browserTestName: "browser: restart action resets output",
          componentType: "actions",
          evidence: "timeline-output",
          expectedObservable: "Restart returns animation output to the first frame.",
          fixture: "timeline fixture",
          id: "animation.actions",
          kind: "control",
          target: "animation.actions",
          userAction: "Click Restart.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "Run / pause (animation.paused) looks like an app-wide timeline transport control. Play, Pause, Animate, Resume, and Restart animation belong to the top timeline; keep right-panel controls for renderer parameters, generation/apply actions, and output delivery.",
        "Run / restart (animation.actions) looks like an app-wide timeline transport control. Play, Pause, Animate, Resume, and Restart animation belong to the top timeline; keep right-panel controls for renderer parameters, generation/apply actions, and output delivery.",
      ]),
    );
  });

  it("rejects right-panel transport controls even when the timeline was omitted", () => {
    const schemaWithOmittedTimelineAndPanelPause = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                pause: {
                  defaultValue: false,
                  label: "Pause",
                  orderRole: "primary",
                  target: "animation.pause",
                  type: "switch",
                },
              },
              title: "Animation",
            },
          ],
          title: "Controls",
        },
        timeline: undefined,
      },
    } as const;

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithOmittedTimelineAndPanelPause, [
        playbackTimelineAcceptance,
        {
          automated: true,
          automatedTestName: "pause switch freezes output",
          browser: true,
          browserTestName: "browser: pause switch freezes output",
          componentType: "switch",
          evidence: "timeline-output",
          expectedObservable: "Pause switch freezes animation output.",
          fixture: "timeline fixture",
          id: "animation.pause",
          kind: "control",
          target: "animation.pause",
          userAction: "Toggle Pause.",
        },
      ]),
    ).toContain(
      "Animation / pause (animation.pause) looks like an app-wide timeline transport control. Play, Pause, Animate, Resume, and Restart animation belong to the top timeline; keep right-panel controls for renderer parameters, generation/apply actions, and output delivery.",
    );
  });

  it("requires autonomous animation intent when animation controls exist without a timeline", () => {
    const schemaWithAnimationControls = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                speed: {
                  defaultValue: 64,
                  label: "Speed",
                  max: 100,
                  min: 0,
                  orderRole: "strength",
                  target: "animation.speed",
                  type: "slider",
                  unit: "%",
                },
              },
              title: "Animation",
            },
          ],
          title: "Controls",
        },
        timeline: undefined,
      },
    } as const;

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithAnimationControls, [
        makeControlAcceptance("animation.speed", "slider"),
      ]),
    ).toContain(
      'Animation controls "Animation / speed" (animation.speed) exist while panels.timeline is omitted. Use panels.timeline mode "playback" for product animation transport, mode "keyframes" for editable keyframes, or declare appTransferMode.animationIntent mode "autonomous" with coverage proving there is no user-facing transport.',
    );
  });

  it("accepts explicit autonomous animation intent for decorative self-running output", () => {
    const schemaWithAutonomousAnimation = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                shimmer: {
                  defaultValue: 40,
                  label: "Shimmer",
                  max: 100,
                  min: 0,
                  orderRole: "detail",
                  target: "animation.shimmer",
                  type: "slider",
                  unit: "%",
                },
              },
              title: "Animation",
            },
          ],
          title: "Controls",
        },
        timeline: undefined,
      },
    } as const;

    expect(
      validateCreativeAppsKitAcceptanceCoverage(
        schemaWithAutonomousAnimation,
        [makeControlAcceptance("animation.shimmer", "slider")],
        {
          animationIntent: {
            behaviorCoverage: [
              "no-user-facing-transport",
              "no-play-pause",
              "no-scrub",
              "no-duration-control",
              "no-loop-control",
              "no-export-at-time",
            ],
            mode: "autonomous",
            reason:
              "The shimmer is decorative self-running output and does not expose product time transport.",
          },
          mode: "new-creative-apps-kit-app",
        },
      ),
    ).toEqual([]);
  });

  it("rejects timeline animation intent when the timeline mode does not match", () => {
    const schemaWithPlaybackTimeline = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        timeline: { enabled: true, mode: "playback" as const },
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(
        schemaWithPlaybackTimeline,
        [playbackTimelineAcceptance],
        {
          animationIntent: { mode: "timeline-keyframes" },
          mode: "new-creative-apps-kit-app",
        },
      ),
    ).toContain(
      'appTransferMode.animationIntent mode "timeline-keyframes" requires panels.timeline mode "keyframes".',
    );
  });

  it("rejects downgrading custom reference timeline behavior to Creative Apps Kit playback", () => {
    expect(
      validateCreativeAppsKitAcceptanceCoverage(appSchema, appAcceptance, {
        behaviorCoverage: ["canvas-sizing", "control-mapping", "renderer-state"],
        mode: "reference-runtime-clone",
        referenceName: "legacy state timeline",
        referenceTimeline: {
          behaviorCoverage: ["state-jump", "trim-range"],
          mode: "creative-apps-kit-playback",
        },
        sourceOfTruth: "reference-runtime",
      }),
    ).toEqual(
      expect.arrayContaining([
        'referenceTimeline mode "creative-apps-kit-playback" cannot preserve custom reference timeline behavior "state-jump". Use mode "custom-reference-timeline" and browser-backed referenceTimelineCoverage instead.',
        'referenceTimeline mode "creative-apps-kit-playback" cannot preserve custom reference timeline behavior "trim-range". Use mode "custom-reference-timeline" and browser-backed referenceTimelineCoverage instead.',
        'referenceTimeline behaviorCoverage "state-jump" is missing an acceptance entry with referenceTimelineCoverage "state-jump".',
        'referenceTimeline behaviorCoverage "trim-range" is missing an acceptance entry with referenceTimelineCoverage "trim-range".',
      ]),
    );
  });

  it("accepts custom reference timeline behavior only when it is test-backed", () => {
    expect(
      validateCreativeAppsKitAcceptanceCoverage(
        appSchema,
        [
          ...appAcceptance,
          {
            automated: true,
            automatedTestName: "reference canvas size matches legacy renderer",
            browser: true,
            browserTestName: "browser: reference canvas size matches legacy renderer",
            componentType: "custom-renderer",
            evidence: "rendered-pixels",
            expectedObservable:
              "The Creative Apps Kit renderer uses the same output dimensions as the reference runtime.",
            fixture: "legacy renderer fixture",
            id: "reference.canvasSizing",
            kind: "runtime",
            referenceCoverage: "canvas-sizing",
            userAction: "Render the reference-sized output.",
          },
          {
            automated: true,
            automatedTestName: "reference control mapping preserves legacy output",
            browser: true,
            browserTestName: "browser: reference control mapping preserves legacy output",
            componentType: "custom-renderer",
            evidence: "product-output",
            expectedObservable:
              "Changing each mapped control updates the same renderer parameter as the reference app.",
            fixture: "legacy controls fixture",
            id: "reference.controlMapping",
            kind: "runtime",
            referenceCoverage: "control-mapping",
            userAction: "Change mapped controls and compare reference output behavior.",
          },
          {
            automated: true,
            automatedTestName: "reference renderer state preserves legacy lifecycle",
            browser: true,
            browserTestName: "browser: reference renderer state preserves legacy lifecycle",
            componentType: "custom-renderer",
            evidence: "product-output",
            expectedObservable:
              "The renderer preserves the reference runtime mutable state lifecycle across frames.",
            fixture: "legacy renderer state fixture",
            id: "reference.rendererState",
            kind: "runtime",
            referenceCoverage: "renderer-state",
            userAction: "Run the renderer across frames and compare stateful output.",
          },
          {
            automated: true,
            automatedTestName: "reference timeline state buttons preserve legacy jumps",
            browser: true,
            browserTestName: "browser: reference timeline state buttons preserve legacy jumps",
            componentType: "custom-timeline",
            evidence: "timeline-output",
            expectedObservable:
              "Clicking each reference timeline state renders the matching legacy state.",
            fixture: "legacy state timeline fixture",
            id: "reference.timeline.stateJump",
            kind: "runtime",
            referenceTimelineCoverage: "state-jump",
            userAction: "Click each reference timeline state button.",
          },
          {
            automated: true,
            automatedTestName: "reference timeline trim handles preserve legacy range",
            browser: true,
            browserTestName: "browser: reference timeline trim handles preserve legacy range",
            componentType: "custom-timeline",
            evidence: "timeline-output",
            expectedObservable:
              "Dragging trim handles changes the same start/end state range as the reference.",
            fixture: "legacy trim timeline fixture",
            id: "reference.timeline.trimRange",
            kind: "runtime",
            referenceTimelineCoverage: "trim-range",
            userAction: "Drag reference timeline trim handles.",
          },
        ],
        {
          behaviorCoverage: ["canvas-sizing", "control-mapping", "renderer-state"],
          mode: "reference-runtime-clone",
          referenceName: "legacy state timeline",
          referenceTimeline: {
            behaviorCoverage: ["state-jump", "trim-range"],
            mode: "custom-reference-timeline",
          },
          sourceOfTruth: "reference-runtime",
        },
      ),
    ).toEqual([]);
  });

  it("rejects reference coverage entries outside reference-runtime-clone mode", () => {
    expect(
      validateCreativeAppsKitAcceptanceCoverage(appSchema, [
        ...appAcceptance,
        {
          automated: true,
          automatedTestName: "reference renderer state preserves legacy lifecycle",
          browser: true,
          browserTestName: "browser: reference renderer state preserves legacy lifecycle",
          componentType: "custom-renderer",
          evidence: "product-output",
          expectedObservable:
            "The renderer preserves the reference runtime mutable state lifecycle across frames.",
          fixture: "legacy renderer state fixture",
          id: "reference.rendererState",
          kind: "runtime",
          referenceCoverage: "renderer-state",
          userAction: "Run the renderer across frames and compare stateful output.",
        },
        {
          automated: true,
          automatedTestName: "reference timeline trim handles preserve legacy range",
          browser: true,
          browserTestName: "browser: reference timeline trim handles preserve legacy range",
          componentType: "custom-timeline",
          evidence: "timeline-output",
          expectedObservable:
            "Dragging trim handles changes the same start/end state range as the reference.",
          fixture: "legacy trim timeline fixture",
          id: "reference.timeline.trimRange",
          kind: "runtime",
          referenceTimelineCoverage: "trim-range",
          userAction: "Drag reference timeline trim handles.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        'reference.rendererState declares referenceCoverage "renderer-state" but transferMode is not "reference-runtime-clone".',
        'reference.timeline.trimRange declares referenceTimelineCoverage "trim-range" but transferMode is not "reference-runtime-clone".',
      ]),
    );
  });

  it("requires layer behavior coverage when a layers panel is enabled", () => {
    const layersSchema = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        layers: true,
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(layersSchema, appAcceptance),
    ).toEqual(
      expect.arrayContaining([
        'panels.layers requires a runtime acceptance entry with layerCoverage "selection" proving layer selection behavior.',
        'panels.layers requires a runtime acceptance entry with layerCoverage "visibility" proving layer visibility behavior.',
        'panels.layers requires a runtime acceptance entry with layerCoverage "reorder" proving layer reorder behavior.',
        'panels.layers requires a runtime acceptance entry with layerCoverage "grouping" proving layer grouping behavior.',
      ]),
    );
  });

  it("rejects selectedLayer targets when the layers panel is disabled", () => {
    const schemaWithSelectedLayerControl = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                opacity: {
                  defaultValue: 75,
                  label: "Opacity",
                  max: 100,
                  min: 0,
                  target: "selectedLayer.opacity",
                  type: "slider",
                  variant: "continuous",
                },
              },
              title: "Layer",
            },
          ],
          title: "Controls",
        },
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithSelectedLayerControl, [
        playbackTimelineAcceptance,
        {
          automated: true,
          automatedTestName: "opacity changes rendered output",
          browser: true,
          browserTestName: "browser: opacity slider changes rendered output",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Opacity changes layer transparency.",
          fixture: "opacity fixture",
          id: "selectedLayer.opacity",
          kind: "control",
          target: "selectedLayer.opacity",
          userAction: "Drag the Opacity slider.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "Layer / opacity (selectedLayer.opacity) uses reserved selectedLayer.* target without panels.layers enabled. Use an app-specific target for single-layer apps or enable layers with layerCoverage.",
      ]),
    );
  });

  it("requires selectedLayer controls to prove currently selected layer behavior", () => {
    const layeredSchema = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                opacity: {
                  defaultValue: 75,
                  label: "Opacity",
                  max: 100,
                  min: 0,
                  target: "selectedLayer.opacity",
                  type: "slider",
                  variant: "continuous",
                },
              },
              title: "Layer",
            },
          ],
          title: "Controls",
        },
        layers: true,
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(layeredSchema, [
        playbackTimelineAcceptance,
        {
          automated: true,
          automatedTestName: "layer selection changes selected runtime layer",
          browser: true,
          browserTestName: "browser: layers selection changes selected runtime layer",
          componentType: "layers",
          evidence: "product-output",
          expectedObservable: "Selecting another layer changes which output layer is edited.",
          fixture: "layered output fixture",
          id: "layers.selection",
          kind: "runtime",
          layerCoverage: "selection",
          userAction: "Select another layer.",
        },
        {
          automated: true,
          automatedTestName: "layer visibility hides nested layer output",
          browser: true,
          browserTestName: "browser: layers visibility hides nested layer output",
          componentType: "layers",
          evidence: "product-output",
          expectedObservable: "Toggling layer visibility removes that layer from output.",
          fixture: "layered output fixture",
          id: "layers.visibility",
          kind: "runtime",
          layerCoverage: "visibility",
          userAction: "Toggle a layer visibility button.",
        },
        {
          automated: true,
          automatedTestName: "layer reorder changes render order",
          browser: true,
          browserTestName: "browser: layers reorder changes render order",
          componentType: "layers",
          evidence: "product-output",
          expectedObservable: "Dragging a layer changes composited render order.",
          fixture: "overlapping layers fixture",
          id: "layers.reorder",
          kind: "runtime",
          layerCoverage: "reorder",
          userAction: "Drag a layer before another layer.",
        },
        {
          automated: true,
          automatedTestName: "layer grouping nests layer output",
          browser: true,
          browserTestName: "browser: layers grouping nests layer output",
          componentType: "layers",
          evidence: "product-output",
          expectedObservable:
            "Dragging a layer into a group nests it and group visibility affects the nested output.",
          fixture: "grouped layers fixture",
          id: "layers.grouping",
          kind: "runtime",
          layerCoverage: "grouping",
          userAction: "Drag a layer into a group.",
        },
        {
          automated: true,
          automatedTestName: "opacity changes rendered output",
          browser: true,
          browserTestName: "browser: opacity slider changes rendered output",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Opacity changes layer transparency.",
          fixture: "opacity fixture",
          id: "selectedLayer.opacity",
          kind: "control",
          target: "selectedLayer.opacity",
          userAction: "Drag the Opacity slider.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        'Layer / opacity (selectedLayer.opacity) targets selectedLayer.* and must have acceptance layerCoverage "selected-layer-controls" proving the control edits the currently selected layer output.',
      ]),
    );
  });

  it("requires each acceptance entry to point at an automated app test", () => {
    const testSources = readSiblingAppTestSources();

    for (const entry of appAcceptance) {
      if (!entry.automated) {
        continue;
      }

      expect(
        testSources,
        `${entry.id} must be backed by an app test named "${entry.automatedTestName}".`,
      ).toContain(entry.automatedTestName);
    }
  });

  it("requires each browser acceptance entry to point at a Playwright test", () => {
    const browserTestSources = readBrowserTestSources();

    for (const entry of appAcceptance) {
      if (!entry.browser) {
        continue;
      }

      expect(
        browserTestSources,
        `${entry.id} must be backed by a Playwright test named "${entry.browserTestName}".`,
      ).toContain(entry.browserTestName);

      if (entry.timelineCoverage === "playback" && acceptanceCoversTimelineDurationEdit(entry)) {
        expect(
          browserTestSources,
          `${entry.id} duration coverage must click the real timeline duration editor.`,
        ).toContain("Edit timeline duration");
        expect(
          browserTestSources,
          `${entry.id} duration coverage must edit the contenteditable timeline duration textbox.`,
        ).toContain('name: "timeline duration"');
        expect(
          browserTestSources,
          `${entry.id} duration coverage must prove the playback range changes after editing duration.`,
        ).toMatch(/aria-valuemax|durationSeconds/);
      }
    }
  });

  it("requires canvas handles to declare runtime, browser, and export-clean coverage", () => {
    expect(
      validateCreativeAppsKitAcceptanceCoverage(appSchema, [
        ...appAcceptance,
        {
          automated: true,
          automatedTestName: "gradient focus handle changes rendered output",
          browser: true,
          browserTestName: "browser: gradient focus handle drags on canvas",
          componentType: "canvas-handle",
          evidence: "product-output",
          expectedObservable: "Dragging the focus handle moves the gradient hotspot.",
          fixture: "radial gradient fixture",
          id: "shader.focus.handle",
          kind: "canvas-handle",
          userAction: "Drag the focus handle on the canvas.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "shader.focus.handle canvas handle is missing canvasHandle metadata.",
      ]),
    );
  });

  it("requires canvas handle write targets to exist in schema or editor commands", () => {
    expect(
      validateCreativeAppsKitAcceptanceCoverage(appSchema, [
        ...appAcceptance,
        {
          automated: true,
          automatedTestName: "gradient focus handle changes rendered output",
          browser: true,
          browserTestName: "browser: gradient focus handle drags on canvas",
          canvasHandle: {
            exportCleanTestName: "export excludes gradient focus handle",
            outputObservable: "The gradient hotspot moves after dragging the handle.",
            testId: "gradient-focus-handle",
            writesTarget: "missing.target",
          },
          componentType: "canvas-handle",
          evidence: "product-output",
          expectedObservable: "Dragging the focus handle moves the gradient hotspot.",
          fixture: "radial gradient fixture",
          id: "shader.focus.handle",
          kind: "canvas-handle",
          userAction: "Drag the focus handle on the canvas.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "shader.focus.handle canvas handle writesTarget missing.target does not match a schema target or supported editor command.",
      ]),
    );
  });

  it("accepts stepped continuous sliders without forcing the discrete visual variant", () => {
    const schemaWithAmbiguousSlider = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                grain: {
                  defaultValue: 0.08,
                  label: "Grain",
                  max: 0.35,
                  min: 0,
                  step: 0.01,
                  target: "shader.grain",
                  type: "slider",
                  variant: "continuous",
                },
              },
              title: "Volume",
            },
          ],
          title: "Shader",
        },
        timeline: undefined,
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(
        schemaWithAmbiguousSlider,
        [
          {
            automated: true,
            automatedTestName: "grain changes rendered output",
            browser: true,
            browserTestName: "browser: grain slider changes rendered output",
            componentType: "slider",
            evidence: "rendered-pixels",
            expectedObservable: "Changing Grain changes pixel variance.",
            fixture: "grain fixture",
            id: "shader.grain",
            kind: "control",
            target: "shader.grain",
            userAction: "Drag the Grain slider.",
          },
        ],
        staticFixtureTransferMode,
      ),
    ).toEqual([]);
  });

  it("requires small semantic integer sliders to use the visual discrete variant", () => {
    const schemaWithMissingDiscreteSliders = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                maskGap: {
                  defaultValue: 5,
                  label: "Mask gap",
                  max: 12,
                  min: 0,
                  orderRole: "detail",
                  step: 1,
                  target: "ascii.maskGap",
                  type: "slider",
                  unit: "cols",
                },
                verticalJitter: {
                  defaultValue: 1,
                  label: "Vertical jitter",
                  max: 4,
                  min: 0,
                  orderRole: "detail",
                  step: 1,
                  target: "ascii.verticalJitter",
                  type: "slider",
                  unit: "rows",
                },
              },
              title: "Mask",
            },
          ],
          title: "ASCII",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithMissingDiscreteSliders, [
        {
          automated: true,
          automatedTestName: "mask gap changes rendered output",
          browser: true,
          browserTestName: "browser: mask gap slider changes rendered output",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Mask gap changes row reveal boundaries.",
          fixture: "ASCII fixture",
          id: "ascii.maskGap",
          kind: "control",
          target: "ascii.maskGap",
          userAction: "Drag the Mask gap slider.",
        },
        {
          automated: true,
          automatedTestName: "vertical jitter changes rendered output",
          browser: true,
          browserTestName: "browser: vertical jitter slider changes rendered output",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Vertical jitter changes row displacement.",
          fixture: "ASCII fixture",
          id: "ascii.verticalJitter",
          kind: "control",
          target: "ascii.verticalJitter",
          userAction: "Drag the Vertical jitter slider.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        'Mask / maskGap (ascii.maskGap) has 13 semantic integer positions and must use variant "discrete" so Creative Apps Kit renders tick markers.',
        'Mask / verticalJitter (ascii.verticalJitter) has 5 semantic integer positions and must use variant "discrete" so Creative Apps Kit renders tick markers.',
      ]),
    );
  });

  it("requires flip-depth integer sliders to use the visual discrete variant", () => {
    const schemaWithFlipDepthSlider = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                speed: {
                  defaultValue: 1.1,
                  label: "Speed",
                  max: 2.5,
                  min: 0.5,
                  step: 0.1,
                  target: "animation.speed",
                  type: "slider",
                  unit: "x",
                  variant: "continuous",
                },
                depth: {
                  defaultValue: 12,
                  label: "Flip depth",
                  max: 28,
                  min: 4,
                  step: 1,
                  target: "animation.depth",
                  type: "slider",
                  variant: "continuous",
                },
              },
              title: "Motion",
            },
          ],
          title: "Board",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithFlipDepthSlider, [
        {
          automated: true,
          automatedTestName: "speed changes animation timing",
          browser: true,
          browserTestName: "browser: speed slider changes animation timing",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Speed changes the animation cadence.",
          fixture: "board speed fixture",
          id: "animation.speed",
          kind: "control",
          target: "animation.speed",
          userAction: "Drag the Speed slider.",
        },
        {
          automated: true,
          automatedTestName: "flip depth changes intermediate characters",
          browser: true,
          browserTestName: "browser: flip depth slider changes intermediate characters",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable:
            "Changing Flip depth changes the number of intermediate character steps.",
          fixture: "board flip depth fixture",
          id: "animation.depth",
          kind: "control",
          target: "animation.depth",
          userAction: "Drag the Flip depth slider.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        'Motion / depth (animation.depth) has 25 semantic integer positions and must use variant "discrete" so Creative Apps Kit renders tick markers.',
      ]),
    );
  });

  it("accepts large or precision stepped sliders as visually continuous", () => {
    const schemaWithContinuousSteppedSliders = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                revealSpeed: {
                  defaultValue: 118,
                  label: "Reveal speed",
                  max: 150,
                  min: 0,
                  orderRole: "primary",
                  step: 1,
                  target: "ascii.speed",
                  type: "slider",
                  unit: "cols/s",
                },
                flipDuration: {
                  defaultValue: 0.6,
                  label: "Flip duration",
                  max: 5,
                  min: 0,
                  orderRole: "strength",
                  step: 0.1,
                  target: "ascii.flipDurationSec",
                  type: "slider",
                  unit: "s",
                },
              },
              title: "Timing",
            },
          ],
          title: "ASCII",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(
        schemaWithContinuousSteppedSliders,
        [
          {
            automated: true,
            automatedTestName: "reveal speed changes rendered output",
            browser: true,
            browserTestName: "browser: reveal speed slider changes rendered output",
            componentType: "slider",
            evidence: "rendered-pixels",
            expectedObservable: "Changing Reveal speed changes reveal density.",
            fixture: "ASCII fixture",
            id: "ascii.speed",
            kind: "control",
            target: "ascii.speed",
            userAction: "Drag the Reveal speed slider.",
          },
          {
            automated: true,
            automatedTestName: "flip duration changes rendered output",
            browser: true,
            browserTestName: "browser: flip duration slider changes rendered output",
            componentType: "slider",
            evidence: "rendered-pixels",
            expectedObservable: "Changing Flip duration changes animation timing.",
            fixture: "ASCII fixture",
            id: "ascii.flipDurationSec",
            kind: "control",
            target: "ascii.flipDurationSec",
            userAction: "Drag the Flip duration slider.",
          },
        ],
        staticFixtureTransferMode,
      ),
    ).toEqual([]);
  });

  it("requires discrete slider markerCount to match the step count", () => {
    const schemaWithDiscreteSlider = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                grain: {
                  defaultValue: 0.08,
                  label: "Grain",
                  markerCount: 6,
                  max: 1,
                  min: 0,
                  step: 0.1,
                  target: "shader.grain",
                  type: "slider",
                  variant: "discrete",
                },
              },
              title: "Volume",
            },
          ],
          title: "Shader",
        },
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithDiscreteSlider, [
        {
          automated: true,
          automatedTestName: "grain changes rendered output",
          browser: true,
          browserTestName: "browser: grain slider changes rendered output",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Grain changes pixel variance.",
          fixture: "grain fixture",
          id: "shader.grain",
          kind: "control",
          target: "shader.grain",
          userAction: "Drag the Grain slider.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "Volume / grain (shader.grain) discrete slider must render one marker per step; expected markerCount 11, received 6.",
      ]),
    );
  });

  it("rejects visual discrete sliders with too many positions", () => {
    const schemaWithDenseDiscreteSlider = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                revealSpeed: {
                  defaultValue: 118,
                  label: "Reveal speed",
                  max: 150,
                  min: 0,
                  orderRole: "primary",
                  step: 1,
                  target: "ascii.speed",
                  type: "slider",
                  unit: "cols/s",
                  variant: "discrete",
                },
              },
              title: "Timing",
            },
          ],
          title: "ASCII",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithDenseDiscreteSlider, [
        {
          automated: true,
          automatedTestName: "reveal speed changes rendered output",
          browser: true,
          browserTestName: "browser: reveal speed slider changes rendered output",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Reveal speed changes reveal density.",
          fixture: "ASCII fixture",
          id: "ascii.speed",
          kind: "control",
          target: "ascii.speed",
          userAction: "Drag the Reveal speed slider.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        'Timing / revealSpeed (ascii.speed) declares variant "discrete" with 151 positions, which would overload tick markers. Keep it stepped continuous or use a different control.',
      ]),
    );
  });

  it("accepts continuous stepped sliders without visual markers", () => {
    const schemaWithNormalizedSlider = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                grain: {
                  defaultValue: 0.08,
                  label: "Grain",
                  max: 1,
                  min: 0,
                  step: 0.1,
                  target: "shader.grain",
                  type: "slider",
                },
              },
              title: "Volume",
            },
          ],
          title: "Shader",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(
        schemaWithNormalizedSlider,
        [
          {
            automated: true,
            automatedTestName: "grain changes rendered output",
            browser: true,
            browserTestName: "browser: grain slider changes rendered output",
            componentType: "slider",
            evidence: "rendered-pixels",
            expectedObservable: "Changing Grain changes pixel variance.",
            fixture: "grain fixture",
            id: "shader.grain",
            kind: "control",
            target: "shader.grain",
            userAction: "Drag the Grain slider.",
          },
        ],
        staticFixtureTransferMode,
      ),
    ).toEqual([]);
  });

  it("rejects generic and control-type section titles", () => {
    const schemaWithWeakSectionTitles = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                amount: {
                  defaultValue: 0.5,
                  label: "Amount",
                  max: 1,
                  min: 0,
                  orderRole: "strength",
                  target: "shader.amount",
                  type: "slider",
                  variant: "continuous",
                },
              },
              title: "Settings",
            },
            {
              controls: {
                grain: {
                  defaultValue: 0.1,
                  label: "Grain",
                  max: 1,
                  min: 0,
                  orderRole: "detail",
                  target: "shader.grain",
                  type: "slider",
                  variant: "continuous",
                },
              },
              title: "Sliders",
            },
          ],
          title: "Shader",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithWeakSectionTitles, [
        makeControlAcceptance("shader.amount", "slider"),
        makeControlAcceptance("shader.grain", "slider"),
      ]),
    ).toEqual(
      expect.arrayContaining([
        "Settings is too generic for a controls section. Name the product entity, workflow stage, or behavior it edits instead of using a bucket title.",
        "Sliders names a UI control type instead of the product entity. Group controls by product meaning, not by Slider, Color, Input, Button, or similar component type.",
      ]),
    );
  });

  it("rejects splitting one product entity into an object section and a color section", () => {
    const schemaWithSplitEntityColor = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                connections: {
                  defaultValue: "10",
                  label: "Connections",
                  orderRole: "primary",
                  target: "squares.right.connections",
                  type: "text",
                },
                hoverRadius: {
                  defaultValue: 200,
                  label: "Hover radius",
                  max: 400,
                  min: 0,
                  orderRole: "detail",
                  target: "squares.right.hoverRadius",
                  type: "slider",
                  unit: "px",
                  variant: "continuous",
                },
              },
              title: "Square 1 (Right)",
            },
            {
              controls: {
                color: {
                  defaultValue: { hex: "#DEF135" },
                  label: "Color",
                  orderRole: "color",
                  target: "squares.right.color",
                  type: "color",
                },
              },
              title: "Color",
            },
          ],
          title: "Pattern",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithSplitEntityColor, [
        makeControlAcceptance("squares.right.connections", "text"),
        makeControlAcceptance("squares.right.hoverRadius", "slider"),
        makeControlAcceptance("squares.right.color", "color"),
      ]),
    ).toEqual(
      expect.arrayContaining([
        'Controls for product entity "squares.right" are split across sections: Square 1 (Right), untitled section 2. Keep controls for the same product entity in one semantic section unless the spec names a real workflow split.',
      ]),
    );
  });

  it("accepts color grouped inside the same semantic product entity section", () => {
    const schemaWithGroupedEntityColor = defineCreativeAppsKit({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                connections: {
                  defaultValue: "10",
                  label: "Connections",
                  orderRole: "primary",
                  target: "squares.right.connections",
                  type: "text",
                },
                color: {
                  defaultValue: { hex: "#DEF135" },
                  label: "Color",
                  orderRole: "color",
                  target: "squares.right.color",
                  type: "color",
                },
                hoverRadius: {
                  defaultValue: 200,
                  label: "Hover radius",
                  max: 400,
                  min: 0,
                  orderRole: "detail",
                  target: "squares.right.hoverRadius",
                  type: "slider",
                  unit: "px",
                  variant: "continuous",
                },
              },
              title: "Square 1 (Right)",
            },
          ],
          title: "Pattern",
        },
      },
    });

    expect(
      validateCreativeAppsKitAcceptanceCoverage(
        schemaWithGroupedEntityColor,
        [
          makeControlAcceptance("squares.right.connections", "text"),
          makeControlAcceptance("squares.right.color", "color"),
          makeControlAcceptance("squares.right.hoverRadius", "slider"),
        ],
        staticFixtureTransferMode,
      ),
    ).toEqual([]);
  });

  it("requires mode selectors to appear before dependent controls", () => {
    const schemaWithLateModeSelector = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                depth: {
                  defaultValue: 0.64,
                  label: "Depth",
                  max: 1,
                  min: 0,
                  target: "shader.depth",
                  type: "slider",
                  variant: "continuous",
                },
                blend: {
                  defaultValue: "liquid",
                  label: "Blend",
                  options: [
                    { label: "Silk", value: "silk" },
                    { label: "Liquid", value: "liquid" },
                    { label: "Crystal", value: "crystal" },
                  ],
                  target: "shader.blend",
                  type: "segmented",
                },
              },
              title: "Volume",
            },
          ],
          title: "Shader",
        },
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithLateModeSelector, [
        {
          automated: true,
          automatedTestName: "depth changes rendered output",
          browser: true,
          browserTestName: "browser: depth slider changes rendered output",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Depth changes shader contrast.",
          fixture: "depth fixture",
          id: "shader.depth",
          kind: "control",
          target: "shader.depth",
          userAction: "Drag the Depth slider.",
        },
        {
          automated: true,
          automatedTestName: "blend changes rendered output",
          browser: true,
          browserTestName: "browser: blend selector changes rendered output",
          componentType: "segmented",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Blend switches shader pattern.",
          fixture: "blend fixture",
          id: "shader.blend",
          kind: "control",
          optionCoverage: "each-visible-item",
          target: "shader.blend",
          userAction: "Select each Blend option.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        'Volume / blend (shader.blend) has orderRole "mode" after depth (shader.depth) with orderRole "strength". Move mode/input/primary controls before dependent strength/detail/advanced controls or split them into an earlier section.',
      ]),
    );
  });

  it("accepts explicit order roles when selectors lead dependent controls", () => {
    const schemaWithOrderedControls = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                blend: {
                  defaultValue: "liquid",
                  label: "Blend",
                  options: [
                    { label: "Silk", value: "silk" },
                    { label: "Liquid", value: "liquid" },
                    { label: "Crystal", value: "crystal" },
                  ],
                  orderRole: "mode" as const,
                  target: "shader.blend",
                  type: "segmented",
                },
                depth: {
                  defaultValue: 0.64,
                  label: "Depth",
                  max: 1,
                  min: 0,
                  orderRole: "strength" as const,
                  target: "shader.depth",
                  type: "slider",
                  variant: "continuous",
                },
              },
              title: "Volume",
            },
          ],
          title: "Shader",
        },
      },
    };

    expect(getCreativeAppsKitControlOrderTargets(schemaWithOrderedControls)).toEqual([
      "shader.blend",
      "shader.depth",
    ]);
    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithOrderedControls, [
        playbackTimelineAcceptance,
        {
          automated: true,
          automatedTestName: "blend changes rendered output",
          browser: true,
          browserTestName: "browser: blend selector changes rendered output",
          componentType: "segmented",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Blend switches shader pattern.",
          fixture: "blend fixture",
          id: "shader.blend",
          kind: "control",
          optionCoverage: "each-visible-item",
          target: "shader.blend",
          userAction: "Select each Blend option.",
        },
        {
          automated: true,
          automatedTestName: "depth changes rendered output",
          browser: true,
          browserTestName: "browser: depth slider changes rendered output",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Depth changes shader contrast.",
          fixture: "depth fixture",
          id: "shader.depth",
          kind: "control",
          target: "shader.depth",
          userAction: "Drag the Depth slider.",
        },
      ]),
    ).toEqual([]);
  });

  it("requires overwide segmented controls to shorten labels or use select", () => {
    const schemaWithOverwideSegmentedControl = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                preset: {
                  defaultValue: "full-stack",
                  label: "FX Preset",
                  options: [
                    { label: "Full Stack", value: "full-stack" },
                    { label: "RGB Split", value: "rgb-split" },
                    { label: "Shade", value: "shade" },
                    { label: "Lines", value: "lines" },
                    { label: "Off", value: "off" },
                  ],
                  orderRole: "mode" as const,
                  target: "shader.fxPreset",
                  type: "segmented",
                },
              },
              title: "Effects",
            },
          ],
          title: "Shader",
        },
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithOverwideSegmentedControl, [
        {
          automated: true,
          automatedTestName: "fx preset changes rendered output",
          browser: true,
          browserTestName: "browser: fx preset selector changes rendered output",
          componentType: "segmented",
          evidence: "rendered-pixels",
          expectedObservable: "Changing FX Preset switches the shader preset.",
          fixture: "fx preset fixture",
          id: "shader.fxPreset",
          kind: "control",
          optionCoverage: "each-visible-item",
          target: "shader.fxPreset",
          userAction: "Select each FX Preset option.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "Effects / preset (shader.fxPreset) segmented controls must preserve cell padding: use at most 4 short options (max 9 characters per label and 24 total) or shorten labels first; if the compact names still exceed the budget, use a select dropdown instead.",
      ]),
    );
  });

  it("requires timeline playback coverage when a playback timeline is enabled", () => {
    const schemaWithPlaybackTimeline = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        timeline: { enabled: true, mode: "playback" as const },
      },
    };

    expect(validateCreativeAppsKitAcceptanceCoverage(schemaWithPlaybackTimeline, [])).toEqual(
      expect.arrayContaining([
        'panels.timeline mode "playback" requires a runtime acceptance entry with timelineCoverage "playback" proving pause, scrub, duration/loop, and rendered-frame behavior.',
      ]),
    );
  });

  it("requires playback timeline coverage to prove duration drives renderer progress", () => {
    const schemaWithPlaybackTimeline = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        timeline: { enabled: true, mode: "playback" as const },
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(schemaWithPlaybackTimeline, [
        {
          automated: true,
          automatedTestName: "timeline playback controls drive rendered output",
          browser: true,
          browserTestName: "browser: timeline playback controls drive rendered output",
          componentType: "timeline",
          evidence: "timeline-output",
          expectedObservable:
            "Pause, scrub, and playback update visible renderer output.",
          fixture: "timeline playback fixture",
          id: "timeline.playback",
          kind: "runtime",
          target: "timeline.playback",
          timelineCoverage: "playback",
          timelinePlaybackCoverage: ["pause-resume", "scrub", "rendered-frame"],
          userAction: "Pause, scrub, and resume timeline playback.",
        },
      ]),
    ).toContain(
      'timeline.playback timelineCoverage "playback" must declare timelinePlaybackCoverage for pause-resume, scrub, duration, loop, and rendered-frame. Duration coverage must prove renderer progress maps 0..state.timeline.durationSeconds, not a local fixed animation duration.',
    );
  });

  it("requires timeline keyframe coverage for every inferred keyframe-capable control", () => {
    const keyframesSchema = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                opacity: {
                  defaultValue: 75,
                  label: "Opacity",
                  max: 100,
                  min: 0,
                  target: "effects.opacity",
                  type: "slider",
                  variant: "continuous",
                },
                mode: {
                  defaultValue: "normal",
                  label: "Mode",
                  options: [
                    { label: "Normal", value: "normal" },
                    { label: "Screen", value: "screen" },
                  ],
                  target: "effects.mode",
                  type: "select",
                },
              },
              title: "Effects",
            },
          ],
          title: "Controls",
        },
        timeline: { enabled: true, mode: "keyframes" as const },
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(keyframesSchema, [
        {
          automated: true,
          automatedTestName: "timeline playback controls drive rendered output",
          browser: true,
          browserTestName: "browser: timeline playback controls drive rendered output",
          componentType: "timeline",
          evidence: "timeline-output",
          expectedObservable: "Playback and scrubbing affect the rendered timeline frame.",
          fixture: "timeline fixture",
          id: "timeline.playback",
          kind: "runtime",
          target: "timeline.playback",
          timelineCoverage: "playback",
          timelinePlaybackCoverage: [
            "pause-resume",
            "scrub",
            "duration",
            "loop",
            "rendered-frame",
          ],
          userAction: "Pause, scrub, and resume timeline playback.",
        },
        {
          automated: true,
          automatedTestName: "timeline keyframes evaluate rendered output",
          browser: true,
          browserTestName: "browser: timeline keyframes evaluate rendered output",
          componentType: "timeline",
          evidence: "timeline-output",
          expectedObservable: "Keyframed opacity changes output at different timeline times.",
          fixture: "keyframed opacity fixture",
          id: "timeline.keyframes",
          kind: "runtime",
          target: "timeline.keyframes",
          timelineCoverage: "keyframes",
          userAction: "Create an Opacity keyframe and scrub the timeline.",
        },
        {
          automated: true,
          automatedTestName: "opacity changes rendered output",
          browser: true,
          browserTestName: "browser: opacity slider changes rendered output",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Opacity changes rendered output.",
          fixture: "opacity fixture",
          id: "effects.opacity",
          kind: "control",
          target: "effects.opacity",
          userAction: "Drag the Opacity slider.",
        },
        {
          automated: true,
          automatedTestName: "mode changes rendered output",
          browser: true,
          browserTestName: "browser: mode select changes rendered output",
          componentType: "select",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Mode changes blend behavior.",
          fixture: "mode fixture",
          id: "effects.mode",
          kind: "control",
          optionCoverage: "each-visible-item",
          target: "effects.mode",
          userAction: "Select each Mode option.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        'Effects / opacity (effects.opacity) is keyframe-capable by Creative Apps Kit control type and must have acceptance timelineCoverage "keyframes" proving its diamond creates/updates a keyframe row and changes evaluated output.',
      ]),
    );
  });

  it("rejects opt-out keyframeable false on inferred keyframe-capable controls", () => {
    const keyframesSchema = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                blur: {
                  defaultValue: 2,
                  keyframeable: false,
                  label: "Blur",
                  max: 10,
                  min: 0,
                  target: "effects.blur",
                  type: "slider",
                  variant: "continuous",
                },
              },
              title: "Effects",
            },
          ],
          title: "Controls",
        },
        timeline: { enabled: true, mode: "keyframes" as const },
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(keyframesSchema, [
        {
          automated: true,
          automatedTestName: "timeline playback controls drive rendered output",
          browser: true,
          browserTestName: "browser: timeline playback controls drive rendered output",
          componentType: "timeline",
          evidence: "timeline-output",
          expectedObservable: "Playback and scrubbing affect the rendered timeline frame.",
          fixture: "timeline fixture",
          id: "timeline.playback",
          kind: "runtime",
          target: "timeline.playback",
          timelineCoverage: "playback",
          timelinePlaybackCoverage: [
            "pause-resume",
            "scrub",
            "duration",
            "loop",
            "rendered-frame",
          ],
          userAction: "Pause, scrub, and resume timeline playback.",
        },
        {
          automated: true,
          automatedTestName: "timeline keyframes evaluate rendered output",
          browser: true,
          browserTestName: "browser: timeline keyframes evaluate rendered output",
          componentType: "timeline",
          evidence: "timeline-output",
          expectedObservable: "Keyframed opacity changes output at different timeline times.",
          fixture: "keyframed opacity fixture",
          id: "timeline.keyframes",
          kind: "runtime",
          target: "timeline.keyframes",
          timelineCoverage: "keyframes",
          userAction: "Create a Blur keyframe and scrub the timeline.",
        },
        {
          automated: true,
          automatedTestName: "blur changes rendered output",
          browser: true,
          browserTestName: "browser: blur slider changes rendered output",
          componentType: "slider",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Blur changes edge softness.",
          fixture: "blur fixture",
          id: "effects.blur",
          kind: "control",
          target: "effects.blur",
          timelineCoverage: "keyframes",
          userAction: "Drag the Blur slider.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "Effects / blur (effects.blur) is keyframe-capable by Creative Apps Kit control type; remove keyframeable: false and provide keyframe evaluator coverage instead of hiding the diamond.",
      ]),
    );
  });

  it("rejects keyframeable true on controls that cannot create timeline keyframes", () => {
    const keyframesSchema = {
      ...appSchema,
      panels: {
        ...appSchema.panels,
        controls: {
          sections: [
            {
              controls: {
                mode: {
                  defaultValue: "normal",
                  keyframeable: true,
                  label: "Mode",
                  options: [
                    { label: "Normal", value: "normal" },
                    { label: "Screen", value: "screen" },
                  ],
                  target: "shader.mode",
                  type: "select",
                },
              },
              title: "Mode",
            },
          ],
          title: "Controls",
        },
        timeline: { enabled: true, mode: "keyframes" as const },
      },
    };

    expect(
      validateCreativeAppsKitAcceptanceCoverage(keyframesSchema, [
        {
          automated: true,
          automatedTestName: "timeline playback controls drive rendered output",
          browser: true,
          browserTestName: "browser: timeline playback controls drive rendered output",
          componentType: "timeline",
          evidence: "timeline-output",
          expectedObservable: "Playback and scrubbing affect the rendered timeline frame.",
          fixture: "timeline fixture",
          id: "timeline.playback",
          kind: "runtime",
          target: "timeline.playback",
          timelineCoverage: "playback",
          timelinePlaybackCoverage: [
            "pause-resume",
            "scrub",
            "duration",
            "loop",
            "rendered-frame",
          ],
          userAction: "Pause, scrub, and resume timeline playback.",
        },
        {
          automated: true,
          automatedTestName: "timeline keyframes evaluate rendered output",
          browser: true,
          browserTestName: "browser: timeline keyframes evaluate rendered output",
          componentType: "timeline",
          evidence: "timeline-output",
          expectedObservable: "Keyframed output changes at different timeline times.",
          fixture: "keyframe fixture",
          id: "timeline.keyframes",
          kind: "runtime",
          target: "timeline.keyframes",
          timelineCoverage: "keyframes",
          userAction: "Create a keyframe and scrub the timeline.",
        },
        {
          automated: true,
          automatedTestName: "mode changes rendered output",
          browser: true,
          browserTestName: "browser: mode select changes rendered output",
          componentType: "select",
          evidence: "rendered-pixels",
          expectedObservable: "Changing Mode changes blend behavior.",
          fixture: "mode fixture",
          id: "shader.mode",
          kind: "control",
          optionCoverage: "each-visible-item",
          target: "shader.mode",
          timelineCoverage: "keyframes",
          userAction: "Select each Mode option.",
        },
      ]),
    ).toEqual(
      expect.arrayContaining([
        "Mode / mode (shader.mode) sets keyframeable true, but this control type or runtime-owned target cannot create timeline keyframes.",
      ]),
    );
  });
});
