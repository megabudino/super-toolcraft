import { describe, expect, it } from "vitest";

import {
  getCreativeAppsKitControlOrderTargets,
  appAcceptance,
} from "./app-acceptance";
import { appPerformance } from "./app-performance";
import { appSchema } from "./app-schema";
import {
  createVestaboardDefaultPersistencePayload,
  vestaboardDefaultCanvasSize,
  vestaboardDefaultPersistenceVersion,
  vestaboardDefaultSettingsValues,
  vestaboardDefaultTimelineState,
} from "./vestaboard-defaults";
import {
  buildVestaboardModel,
  getVestaboardAnimationProgress,
  getVestaboardAnimatedPhrase,
  getVestaboardDrumDistance,
  getVestaboardTrailAlpha,
  resolveVestaboardSettings,
  VESTABOARD_CELL_COUNT,
  VESTABOARD_COLUMNS,
  VESTABOARD_DRUM_CHARS,
} from "./vestaboard-model";

const expectedAcceptanceAutomatedNames = [
  "settings transfer exports and imports board settings",
  "canvas width changes vestaboard output bounds",
  "canvas height changes vestaboard output bounds",
  "tile width changes vestaboard cell geometry",
  "tile height changes vestaboard cell geometry",
  "tile gap changes vestaboard spacing",
  "cell radius changes vestaboard cell rounding",
  "cell fill color changes vestaboard cells",
  "cell fill opacity range changes vestaboard cell backgrounds",
  "cell fill seed changes deterministic cell background alpha",
  "bottom opacity range changes cell lower-edge highlights",
  "bottom fill canvas changes highlighted border coverage",
  "bottom seed changes deterministic lower-edge highlight alpha",
  "cell border color opacity changes vestaboard cells",
  "message textarea centers permanent phrase",
  "message textarea can stay empty",
  "target message drives phrase transform animation",
  "final hold settles phrase before background ends",
  "uppercase remaps message text before layout",
  "duration spread changes outgoing letter animation overlap",
  "letter speed changes outgoing letter launch density",
  "outgoing opacity range changes removing phrase characters",
  "flash color count toggles main text fill flashes",
  "flash frequency changes main text fill flash coverage",
  "flash palette colors change main text fill colors",
  "flash palette color 2 changes main text fill colors",
  "flash palette color 3 changes main text fill colors",
  "flash palette color 4 changes main text fill colors",
  "flip mode switches drum and random engines",
  "wear inserts sticky pauses into drum spins",
  "trail ghosts previous characters on flipping cells",
  "vibration shakes the board during flips",
  "sound toggle arms flap click synthesis",
  "sound volume changes flap click gain",
  "main font changes permanent phrase typography",
  "background font changes random field typography",
  "text color changes vestaboard characters",
  "start fill changes random field first-frame occupancy",
  "end fill changes random field final-frame occupancy",
  "field duration range changes background cell flicker timing",
  "field speed changes background cell flicker rate",
  "opacity range changes random field alpha",
  "seed slider changes deterministic random field",
  "video format chooses supported export container",
  "video quality changes export scale target",
  "background color changes vestaboard preview and export",
  "include background controls png alpha only",
  "export actions download video and png vestaboard output",
  "timeline playback controls phrase transform animation",
  "vestaboard renderer exposes product output only",
  "toolbar viewport keeps vestaboard centered",
  "perf: vestaboard preview render stays under budget",
  "perf: settings transfer export stays responsive",
  "perf: canvas width change stays responsive",
  "perf: canvas height change stays responsive",
  "perf: tile width drag stays responsive",
  "perf: tile height drag stays responsive",
  "perf: tile gap drag stays responsive",
  "perf: cell radius drag stays responsive",
  "perf: cell fill color change stays responsive",
  "perf: cell fill opacity range drag stays responsive",
  "perf: cell fill seed drag stays responsive",
  "perf: bottom opacity range drag stays responsive",
  "perf: bottom fill canvas drag stays responsive",
  "perf: bottom seed drag stays responsive",
  "perf: cell border color opacity change stays responsive",
  "perf: large message change stays responsive",
  "perf: large target message change stays responsive",
  "perf: final hold drag stays responsive",
  "perf: duration spread drag stays responsive",
  "perf: letter speed drag stays responsive",
  "perf: outgoing opacity range drag stays responsive",
  "perf: flash color count drag stays responsive",
  "perf: flash frequency drag stays responsive",
  "perf: flash palette color change stays responsive",
  "perf: flash palette color 2 change stays responsive",
  "perf: flash palette color 3 change stays responsive",
  "perf: flash palette color 4 change stays responsive",
  "perf: main font picker change stays responsive",
  "perf: background font picker change stays responsive",
  "perf: start fill drag stays responsive",
  "perf: end fill drag stays responsive",
  "perf: field duration range drag stays responsive",
  "perf: field speed drag stays responsive",
  "perf: flip mode change stays responsive",
  "perf: wear drag stays responsive",
  "perf: trail drag stays responsive",
  "perf: vibration drag stays responsive",
  "perf: sound toggle stays responsive",
  "perf: sound volume drag stays responsive",
  "perf: uppercase toggle stays responsive",
  "perf: text color change stays responsive",
  "perf: opacity range drag stays responsive",
  "perf: seed drag stays responsive",
  "perf: background color change stays responsive",
  "perf: video format change stays responsive",
  "perf: video quality change stays responsive",
  "perf: include background toggle stays responsive",
  "perf: export actions stay under budget",
  "perf: phrase animation frames stay under budget",
  "perf: phrase animation viewport drag stays responsive",
  "perf: vestaboard viewport stays stable",
  "perf: vestaboard viewport zoom stress stays responsive",
];

describe("appSchema", () => {
  it("publishes the Vestaboard Creative Apps Kit product contract", () => {
    expect(appSchema.canvas.enabled).toBe(true);
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(appSchema.canvas.upload).toBe(false);
    expect(appSchema.canvas.size).toEqual(vestaboardDefaultCanvasSize);
    expect(appSchema.export.png.background).toBe("include");
    expect(appSchema.toolbar).toEqual({
      history: true,
      radar: true,
      theme: true,
      zoom: true,
    });
    expect(appSchema.assembly.components).toEqual(
      expect.arrayContaining(["canvas", "controlsPanel", "toolbar", "timelinePanel"]),
    );
    expect(appSchema.assembly.capabilities).toEqual(
      expect.arrayContaining([
        "canvas.draggable",
        "canvas.editableSize",
        "controls.defaults",
        "controls.panel",
        "timeline.duration",
        "timeline.panel",
        "timeline.playback",
        "toolbar.history",
        "toolbar.radar",
        "toolbar.theme",
        "toolbar.zoom",
      ]),
    );
    expect(appSchema.assembly.capabilities).not.toContain("canvas.upload");
    expect(appSchema.assembly.capabilities).not.toContain("timeline.keyframes");
  });

  it("uses the exported settings file values as schema defaults", () => {
    const controlsByTarget = new Map(
      appSchema.panels.controls?.sections.flatMap((section) =>
        Object.values(section.controls)
          .filter((control) => control.type !== "panelActions")
          .map((control) => [control.target, control.defaultValue] as const),
      ),
    );

    for (const [target, defaultValue] of Object.entries(vestaboardDefaultSettingsValues)) {
      expect(controlsByTarget.get(target), target).toEqual(defaultValue);
    }
  });

  it("seeds fresh sessions with the exported canvas and timeline defaults", () => {
    if (appSchema.persistence.storage !== "localStorage") {
      throw new Error("Vestaboard defaults require localStorage persistence.");
    }

    const payload = createVestaboardDefaultPersistencePayload(appSchema.persistence.version);

    expect(appSchema.persistence.version).toBe(vestaboardDefaultPersistenceVersion);
    expect(vestaboardDefaultTimelineState.isPlaying).toBe(true);
    expect(payload).toEqual({
      state: {
        canvas: { size: vestaboardDefaultCanvasSize },
        timeline: vestaboardDefaultTimelineState,
        values: vestaboardDefaultSettingsValues,
      },
      version: vestaboardDefaultPersistenceVersion,
    });
  });

  it("keeps schema-backed controls in product decision order", () => {
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

  it("does not place Board Surface controls in inline rows", () => {
    const boardSurfaceSection = appSchema.panels.controls?.sections.find(
      (section) => section.title === "Board Surface",
    );

    expect(boardSurfaceSection?.layoutGroups ?? []).toEqual([]);
  });

  it("enables runtime Settings Transfer for import and export", () => {
    expect(appSchema.settingsTransfer.mode).toBe(true);
    expect(appSchema.settingsTransfer.enabled).toBe(true);
    expect(appSchema.settingsTransfer.appId).toBe("vesta-split-flap");
    expect(appSchema.settingsTransfer.fileName).toBe("vesta-split-flap-settings.json");
    expect(
      appSchema.panels.controls?.sections.some((section) => section.title === "Settings"),
    ).toBe(true);
  });

  it("declares product acceptance and performance coverage names", () => {
    const automatedNames = new Set([
      ...appAcceptance.map((entry) => entry.automatedTestName),
      ...appPerformance.scenarios.map((scenario) => scenario.automatedTestName),
    ]);

    for (const name of expectedAcceptanceAutomatedNames) {
      expect(automatedNames.has(name), name).toBe(true);
    }
  });

  it("declares renderer technique and workload scenarios", () => {
    expect(appPerformance.usesCustomRenderer).toBe(true);
    expect(appPerformance.rendererStrategy).toBe("dom");
    expect(appPerformance.rendererWorkload).toBe("text-output");
    expect(appPerformance.rendererTechnique?.exportRenderer).toBe("canvas-2d");
    expect(appPerformance.workloadTargets).toEqual(
      expect.arrayContaining([
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
        "board.text.letterDurationRange",
        "board.text.letterSpeed",
        "board.text.outgoingOpacityRange",
        "board.text.flashColorCount",
        "board.text.flashFrequency",
        "board.text.messageTypography",
        "field.typography",
        "field.fillStart",
        "field.fillEnd",
        "field.durationRange",
        "field.speed",
        "export.video.quality",
      ]),
    );
  });
});

describe("Vestaboard model", () => {
  function buildModel(values: Record<string, unknown>) {
    const settings = resolveVestaboardSettings(values, {
      height: 720,
      unit: "px",
      width: 1200,
    });
    return buildVestaboardModel(settings);
  }

  it("message textarea centers permanent phrase", () => {
    const model = buildModel({
      "board.text.message": "HI\nVESTA",
      "field.fill": 0,
    });
    const phraseCells = model.cells.filter((cell) => cell.isPhrase);

    expect(phraseCells.map((cell) => `${cell.row}:${cell.col}:${cell.char}`)).toEqual([
      "3:9:H",
      "3:10:I",
      "4:8:V",
      "4:9:E",
      "4:10:S",
      "4:11:T",
      "4:12:A",
    ]);
  });

  it("message textarea wraps long lines on board columns", () => {
    const model = buildModel({
      "board.text.message": "ABCDEFGHIJKLMNOPQRSTUVW",
      "field.fill": 0,
    });
    const phraseRows = model.cells
      .filter((cell) => cell.isPhrase)
      .reduce<Record<number, string[]>>((rows, cell) => {
        rows[cell.row] ??= [];
        rows[cell.row]![cell.col] = cell.char;
        return rows;
      }, {});

    expect(Object.values(phraseRows).map((row) => row.filter(Boolean).join(""))).toEqual([
      "ABCDEFGHIJKLMNOPQRSTU",
      "VW",
    ]);
    expect(Object.values(phraseRows)[0]?.length).toBeLessThanOrEqual(VESTABOARD_COLUMNS);
  });

  it("message textarea can stay empty", () => {
    const model = buildModel({
      "board.text.message": "",
      "field.fill": 0,
    });

    expect(model.settings.message).toBe("");
    expect(model.cells.some((cell) => cell.isPhrase)).toBe(false);
    expect(model.cells.every((cell) => cell.char === "")).toBe(true);
  });

  it("target message animates by removing source characters and normalizing final spaces", () => {
    expect(
      getVestaboardAnimatedPhrase({
        progress: 0,
        seed: 137,
        source: "HELLO   BEAUTIFUL WORLD",
        target: "HELLO  WORLD",
      }),
    ).toBe("HELLO   BEAUTIFUL WORLD");

    expect(
      getVestaboardAnimatedPhrase({
        progress: 1,
        seed: 137,
        source: "HELLO   BEAUTIFUL WORLD",
        target: " HELLO   WORLD ",
      }),
    ).toBe("HELLO WORLD");

    expect(
      getVestaboardAnimatedPhrase({
        progress: 1,
        seed: 137,
        source: "HELLO\nWORLD",
        target: "HELLO WORLD",
      }),
    ).toBe("HELLO WORLD");

    expect(
      getVestaboardAnimatedPhrase({
        progress: 1,
        seed: 137,
        source: "HELLO WORLD",
        target: "HELLO\nWORLD",
      }),
    ).toBe("HELLO\nWORLD");
  });

  it("target message animation never reveals characters that are not in the source", () => {
    const frames = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
      getVestaboardAnimatedPhrase({
        progress,
        seed: 137,
        source: "ABCD",
        target: "AXBCDZ",
      }),
    );

    expect(frames[0]).toBe("ABCD");
    expect(frames[frames.length - 1]).toBe("ABCD");

    for (let index = 1; index < frames.length; index += 1) {
      expect(Array.from(frames[index] ?? "").length).toBeLessThanOrEqual(
        Array.from(frames[index - 1] ?? "").length,
      );
    }
  });

  it("target message animation narrows on the same row after removals", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.message": "ABCD",
        "board.text.targetMessage": "AD",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const start = buildVestaboardModel(settings, { phraseProgress: 0 });
    const nearlyDone = buildVestaboardModel(settings, { phraseProgress: 0.95 });

    const findPhraseCell = (model: ReturnType<typeof buildVestaboardModel>, char: string) => {
      const cell = model.cells.find((candidate) => candidate.isPhrase && candidate.char === char);

      expect(cell, `${char} should stay visible`).toBeDefined();

      return cell;
    };
    const startA = findPhraseCell(start, "A");
    const startD = findPhraseCell(start, "D");
    const narrowedA = findPhraseCell(nearlyDone, "A");
    const narrowedD = findPhraseCell(nearlyDone, "D");

    expect(narrowedA?.row).toBe(startA?.row);
    expect(narrowedD?.row).toBe(startD?.row);
    expect(narrowedA?.col).toBeGreaterThan(startA?.col ?? 0);
    expect(narrowedD?.col).toBeLessThan(startD?.col ?? Number.POSITIVE_INFINITY);

    expect(nearlyDone.cells.filter((cell) => cell.isPhrase && cell.char.trim())).toHaveLength(2);
  });

  it("final hold settles phrase before background ends", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;
    const settings = resolveVestaboardSettings(
      {
        "board.text.finalHoldSeconds": 2,
        "board.text.message": "HELLO WORLD",
        "board.text.targetMessage": "HELLO",
        "field.durationRange": [95, 95],
        "field.fillEnd": 0,
        "field.fillStart": 100,
      },
      canvas,
    );
    const progress = getVestaboardAnimationProgress({
      durationSeconds: 8,
      finalHoldSeconds: settings.finalHoldSeconds,
      hasTargetMessage: settings.targetMessage.trim().length > 0,
      timeSeconds: 6,
    });
    const holdModel = buildVestaboardModel(settings, {
      durationSeconds: 8,
      fieldProgress: progress.fieldProgress,
      phraseProgress: progress.phraseProgress,
    });
    const finalModel = buildVestaboardModel(settings, {
      durationSeconds: 8,
      fieldProgress: 1,
      phraseProgress: 1,
    });
    const phraseSignature = (model: ReturnType<typeof buildVestaboardModel>) =>
      model.cells
        .filter((cell) => cell.isPhrase)
        .map((cell) => `${cell.row}:${cell.col}:${cell.char}`)
        .join("|");
    const backgroundCharacters = (model: ReturnType<typeof buildVestaboardModel>) =>
      model.cells.filter((cell) => !cell.isPhrase && cell.char.trim()).length;

    expect(settings.finalHoldSeconds).toBe(2);
    expect(progress.phraseProgress).toBe(1);
    expect(progress.fieldProgress).toBeCloseTo(0.75, 5);
    expect(progress.effectiveFinalHoldSeconds).toBe(2);
    expect(progress.phraseEndTimeSeconds).toBe(6);
    expect(phraseSignature(holdModel)).toBe(phraseSignature(finalModel));
    expect(backgroundCharacters(holdModel)).toBeGreaterThan(backgroundCharacters(finalModel));
  });

  it("final hold background-only flips do not shake settled phrase", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.flip.shake": 100,
        "board.text.finalHoldSeconds": 2,
        "board.text.message": "SMART",
        "board.text.targetMessage": "R",
        "field.durationRange": [95, 95],
        "field.fillEnd": 0,
        "field.fillStart": 100,
      },
      { height: 720, unit: "px", width: 1200 },
    );
    const progress = getVestaboardAnimationProgress({
      durationSeconds: 8,
      finalHoldSeconds: settings.finalHoldSeconds,
      hasTargetMessage: true,
      timeSeconds: 6,
    });
    const model = buildVestaboardModel(settings, {
      durationSeconds: 8,
      fieldProgress: progress.fieldProgress,
      phraseProgress: progress.phraseProgress,
    });

    expect(model.cells.some((cell) => !cell.isPhrase && cell.isFlipping)).toBe(true);
    expect(model.cells.every((cell) => !cell.isPhrase || !cell.isFlipping)).toBe(true);
    expect(model.shakeX).toBe(0);
    expect(model.shakeY).toBe(0);
  });

  it("final hold is clamped and keeps a minimum phrase transform window", () => {
    const settings = resolveVestaboardSettings(
      { "board.text.finalHoldSeconds": 20 },
      { height: 720, unit: "px", width: 1200 },
    );
    const progress = getVestaboardAnimationProgress({
      durationSeconds: 1,
      finalHoldSeconds: settings.finalHoldSeconds,
      hasTargetMessage: true,
      timeSeconds: 0.1,
    });

    expect(settings.finalHoldSeconds).toBe(8);
    expect(progress.effectiveFinalHoldSeconds).toBeCloseTo(0.9, 5);
    expect(progress.phraseEndTimeSeconds).toBeCloseTo(0.1, 5);
    expect(progress.phraseProgress).toBe(1);
  });

  it("target message animation removes cells in all rows on the same timeline", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [5, 5],
        "board.text.message": "ABCD\nWXYZ",
        "board.text.targetMessage": "AD\nWZ",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const start = buildVestaboardModel(settings, { phraseProgress: 0 });
    const nearlyDone = buildVestaboardModel(settings, { phraseProgress: 0.95 });
    const getRows = (model: ReturnType<typeof buildVestaboardModel>) =>
      Array.from(
        model.cells
          .filter((cell) => cell.isPhrase)
          .reduce<Map<number, { char: string; col: number }[]>>((rows, cell) => {
            rows.set(cell.row, [...(rows.get(cell.row) ?? []), { char: cell.char, col: cell.col }]);
            return rows;
          }, new Map())
          .entries(),
      ).map(([row, cells]) => ({
        row,
        text: cells
          .sort((first, second) => first.col - second.col)
          .map((cell) => cell.char)
          .join("")
          .trim(),
      }));

    expect(getRows(start).map(({ text }) => text)).toEqual(["ABCD", "WXYZ"]);
    expect(getRows(nearlyDone)).toEqual([
      { row: getRows(start)[0]?.row, text: "AD" },
      { row: getRows(start)[1]?.row, text: "WZ" },
    ]);
  });

  it("target message final frame can use characters from wrapped source rows", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [5, 5],
        "board.text.message": "ABCDEFGHIJKLMNOPQRSTUVW",
        "board.text.targetMessage": "VW",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const finalModel = buildVestaboardModel(settings, { phraseProgress: 1 });
    const finalText = finalModel.cells
      .filter((cell) => cell.isPhrase)
      .sort((first, second) => first.row - second.row || first.col - second.col)
      .map((cell) => cell.char)
      .join("")
      .trim();

    expect(finalText).toBe("VW");
  });

  it("target message final frame preserves target line integrity", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [5, 5],
        "board.text.message":
          "OPTIMIZE HOW YOUR PRODUCT SENDS\nDATA TO AN LLM, GIVING IT ONLY\nTHE RIGHT CONTEXT BY AUTOMATICALLY\nREMOVING NOISY INPUT THAT CREATES\nUNNECESSARY BLOAT.",
        "board.text.targetMessage": "OPTIMIZE LLM CONTEXT\nBY REMOVING INPUT BLOAT",
        "board.tile.width": 32,
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const finalModel = buildVestaboardModel(settings, { phraseProgress: 1 });
    const finalRows = Array.from(
      finalModel.cells
        .filter((cell) => cell.isPhrase)
        .reduce<Map<number, { char: string; col: number }[]>>((rows, cell) => {
          rows.set(cell.row, [...(rows.get(cell.row) ?? []), { char: cell.char, col: cell.col }]);
          return rows;
        }, new Map())
        .entries(),
    ).map(([, cells]) =>
      cells
        .sort((first, second) => first.col - second.col)
        .map((cell) => cell.char)
        .join("")
        .trim(),
    );

    expect(finalRows).toEqual(["OPTIMIZE LLM CONTEXT", "BY REMOVING INPUT BLOAT"]);
  });

  it("target message near-final frame already uses target line layout", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [5, 5],
        "board.text.message":
          "OPTIMIZE HOW YOUR PRODUCT SENDS\nDATA TO AN LLM, GIVING IT ONLY\nTHE RIGHT CONTEXT BY AUTOMATICALLY\nREMOVING NOISY INPUT THAT CREATES\nUNNECESSARY BLOAT.",
        "board.text.targetMessage": "OPTIMIZE LLM CONTEXT\nBY REMOVING INPUT BLOAT",
        "board.tile.width": 32,
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const nearlyFinalModel = buildVestaboardModel(settings, { phraseProgress: 0.98 });
    const nearlyFinalRows = Array.from(
      nearlyFinalModel.cells
        .filter((cell) => cell.isPhrase)
        .reduce<Map<number, { char: string; col: number }[]>>((rows, cell) => {
          rows.set(cell.row, [...(rows.get(cell.row) ?? []), { char: cell.char, col: cell.col }]);
          return rows;
        }, new Map())
        .entries(),
    ).map(([, cells]) =>
      cells
        .sort((first, second) => first.col - second.col)
        .map((cell) => cell.char)
        .join("")
        .trim(),
    );

    expect(nearlyFinalRows).toEqual(["OPTIMIZE LLM CONTEXT", "BY REMOVING INPUT BLOAT"]);
  });

  it("target message moves kept letters through discrete cells before removal finishes", () => {
    const source = "ABCD\nEFGH\nIJKL\nMNOP\nQRST";
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [5, 5],
        "board.text.letterSpeed": 100,
        "board.text.message": source,
        "board.text.targetMessage": "AT",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const startModel = buildVestaboardModel(settings, { phraseProgress: 0 });
    const midModel = buildVestaboardModel(settings, { phraseProgress: 0.6 });
    const finalModel = buildVestaboardModel(settings, { phraseProgress: 1 });
    const sourceAIndex = source.indexOf("A");
    const sourceTIndex = source.indexOf("T");
    const findPhraseCellBySourceIndex = (
      model: ReturnType<typeof buildVestaboardModel>,
      sourceIndex: number,
    ) => {
      const cell = model.cells.find(
        (candidate) => candidate.isPhrase && candidate.sourceIndex === sourceIndex,
      );

      expect(cell, `source index ${sourceIndex} should stay visible`).toBeDefined();

      return cell;
    };
    const findPhraseCellByChar = (
      model: ReturnType<typeof buildVestaboardModel>,
      char: string,
    ) => {
      const cell = model.cells.find(
        (candidate) => candidate.isPhrase && candidate.char === char,
      );

      expect(cell, `${char} should stay visible`).toBeDefined();

      return cell;
    };
    const startA = findPhraseCellByChar(startModel, "A");
    const midA = findPhraseCellBySourceIndex(midModel, sourceAIndex);
    const finalA = findPhraseCellByChar(finalModel, "A");
    const startT = findPhraseCellByChar(startModel, "T");
    const midT = findPhraseCellBySourceIndex(midModel, sourceTIndex);
    const finalT = findPhraseCellByChar(finalModel, "T");

    expect(Number.isInteger(midA?.row)).toBe(true);
    expect(Number.isInteger(midT?.row)).toBe(true);
    expect(midA?.row).toBeGreaterThan(startA?.row ?? 0);
    expect(midA?.row).toBeLessThanOrEqual(finalA?.row ?? Number.POSITIVE_INFINITY);
    expect(midT?.row).toBeLessThan(startT?.row ?? Number.POSITIVE_INFINITY);
    expect(midT?.row).toBeGreaterThanOrEqual(finalT?.row ?? 0);
    expect([midA?.char, midT?.char].some((char) => char !== "A" && char !== "T")).toBe(true);
  });

  it("duration spread and letter speed derive simultaneous outgoing letter count", () => {
    const getActiveOutgoingCount = ({
      letterDurationRange,
      letterSpeed,
    }: {
      letterDurationRange: readonly [number, number];
      letterSpeed: number;
    }) => {
      const settings = resolveVestaboardSettings(
        {
          "board.text.letterDurationRange": letterDurationRange,
          "board.text.letterSpeed": letterSpeed,
          "board.text.message": "ABCDEFGHIJKL",
          "board.text.outgoingOpacityRange": [12, 12],
          "board.text.targetMessage": "AL",
          "field.fill": 0,
        },
        {
          height: 720,
          unit: "px",
          width: 1200,
        },
      );

      return buildVestaboardModel(settings, { phraseProgress: 0.22 }).cells.filter(
        (cell) => cell.isPhrase && cell.opacity === 12,
      ).length;
    };

    expect(
      getActiveOutgoingCount({
        letterDurationRange: [45, 45],
        letterSpeed: 95,
      }),
    ).toBeGreaterThan(
      getActiveOutgoingCount({
        letterDurationRange: [45, 45],
        letterSpeed: 10,
      }),
    );
    expect(
      getActiveOutgoingCount({
        letterDurationRange: [45, 45],
        letterSpeed: 80,
      }),
    ).toBeGreaterThan(
      getActiveOutgoingCount({
        letterDurationRange: [5, 5],
        letterSpeed: 80,
      }),
    );
  });

  it("outgoing opacity range changes active removing phrase character alpha", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [95, 95],
        "board.text.message": "ABCD",
        "board.text.outgoingOpacityRange": [12, 12],
        "board.text.targetMessage": "AD",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const model = buildVestaboardModel(settings, { phraseProgress: 0.1 });

    expect(model.cells.some((cell) => cell.isPhrase && cell.opacity === 12)).toBe(true);
    expect(model.cells.some((cell) => cell.isPhrase && cell.char === "A" && cell.opacity === 100)).toBe(true);
  });

  it("target message transform is deterministic and empty target keeps source phrase", () => {
    const first = getVestaboardAnimatedPhrase({
      progress: 0.45,
      seed: 137,
      source: "VESTA",
      target: "TOKEN VESTA",
    });
    const second = getVestaboardAnimatedPhrase({
      progress: 0.45,
      seed: 137,
      source: "VESTA",
      target: "TOKEN VESTA",
    });

    expect(first).toBe(second);
    expect(first).not.toBe("VESTA");
    expect(
      getVestaboardAnimatedPhrase({
        progress: 0.8,
        seed: 137,
        source: "KEEP ME",
        target: "",
      }),
    ).toBe("KEEP ME");
  });

  it("start and end fill animate random field occupancy", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.message": "OK",
        "field.fillEnd": 100,
        "field.fillStart": 0,
        "field.seed": 5,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const startModel = buildVestaboardModel(settings, { fieldProgress: 0 });
    const endModel = buildVestaboardModel(settings, { fieldProgress: 1 });

    expect(startModel.cells.filter((cell) => !cell.isPhrase && cell.char).length).toBe(0);
    expect(endModel.cells.filter((cell) => !cell.isPhrase && cell.char).length).toBe(
      VESTABOARD_CELL_COUNT - 2,
    );
  });

  it("field duration range creates mid-frame background flicker", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.message": "",
        "field.durationRange": [95, 95],
        "field.fillEnd": 100,
        "field.fillStart": 0,
        "field.seed": 137,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const midModel = buildVestaboardModel(settings, { fieldProgress: 0.5 });
    const endModel = buildVestaboardModel(settings, { fieldProgress: 1 });
    const midChars = midModel.cells.map((cell) => cell.char).join("");
    const endChars = endModel.cells.map((cell) => cell.char).join("");

    expect(midModel.cells.filter((cell) => cell.char).length).toBe(VESTABOARD_CELL_COUNT);
    expect(midChars).not.toBe(endChars);
  });

  it("random field tail avoids linear column cadence", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.message": "",
        "board.tile.gap": 6,
        "board.tile.height": 66,
        "board.tile.width": 39,
        "field.durationRange": [39, 74],
        "field.fillEnd": 0,
        "field.fillStart": 100,
        "field.seed": 137,
      },
      {
        height: 1080,
        unit: "px",
        width: 1920,
      },
    );
    const tailModel = buildVestaboardModel(settings, { fieldProgress: 0.7 });
    const columnCounts = Array.from({ length: tailModel.columns }, () => 0);

    for (const cell of tailModel.cells) {
      if (!cell.isPhrase && cell.char.trim()) {
        columnCounts[cell.col] = (columnCounts[cell.col] ?? 0) + 1;
      }
    }

    const lag = 5;
    const exactMatches = columnCounts
      .slice(0, -lag)
      .filter((count, index) => count === columnCounts[index + lag]).length;
    const cadenceRatio = exactMatches / (columnCounts.length - lag);
    const visibleTailCells = columnCounts.reduce((sum, count) => sum + count, 0);

    expect(visibleTailCells).toBeGreaterThan(40);
    expect(cadenceRatio).toBeLessThan(0.4);
  });

  it("background field animation starts immediately on the first non-zero frame", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.message": "",
        "field.durationRange": [95, 95],
        "field.fillEnd": 100,
        "field.fillStart": 0,
        "field.seed": 137,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const firstAnimatedModel = buildVestaboardModel(settings, { fieldProgress: 0.01 });
    const finalModel = buildVestaboardModel(settings, { fieldProgress: 1 });
    const firstAnimatedChars = firstAnimatedModel.cells.map((cell) => cell.char).join("");
    const finalChars = finalModel.cells.map((cell) => cell.char).join("");

    expect(firstAnimatedModel.cells.filter((cell) => cell.char).length).toBe(
      VESTABOARD_CELL_COUNT,
    );
    expect(firstAnimatedChars).not.toBe(finalChars);
  });

  it("field speed changes active background flicker rate", () => {
    const buildSignature = (fieldSpeed: number) =>
      buildVestaboardModel(
        resolveVestaboardSettings(
          {
            "board.text.message": "",
            "field.durationRange": [95, 95],
            "field.fillEnd": 100,
            "field.fillStart": 0,
            "field.seed": 137,
            "field.speed": fieldSpeed,
          },
          {
            height: 720,
            unit: "px",
            width: 1200,
          },
        ),
        { fieldProgress: 0.5 },
      ).cells.map((cell) => cell.char).join("");

    expect(buildSignature(100)).not.toBe(buildSignature(1));
  });

  it("flash color count zero disables main text fill flashes", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.flashColorCount": 0,
        "board.text.flashFrequency": 100,
        "board.text.message": "FLASH",
        "board.text.targetMessage": "FH",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const model = buildVestaboardModel(settings, { fieldProgress: 0.1, phraseProgress: 0.1 });

    expect(model.cells.filter((cell) => cell.isPhrase).every((cell) => !cell.messageFlashColor)).toBe(
      true,
    );
  });

  it("flash frequency creates fill for disappearing and kept target main text letters", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.flashColor1": { hex: "#00AAFF" },
        "board.text.flashColorCount": 1,
        "board.text.flashFrequency": 100,
        "board.text.message": "FLASH",
        "board.text.targetMessage": "FH",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const model = buildVestaboardModel(settings, { fieldProgress: 0.1, phraseProgress: 0.1 });
    const flashCells = model.cells.filter((cell) => cell.isPhrase && cell.messageFlashColor);
    const keptCells = model.cells.filter((cell) => cell.sourceIndex === 0 || cell.sourceIndex === 4);

    expect(flashCells.map((cell) => cell.sourceIndex)).toEqual([0, 1, 4]);
    expect(flashCells.every((cell) => cell.messageFlashColor === "#00AAFF")).toBe(true);
    expect(keptCells.every((cell) => cell.messageFlashColor === "#00AAFF")).toBe(true);
  });

  it("flash frequency does not fill main text when no letters are disappearing", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.flashColor1": { hex: "#00AAFF" },
        "board.text.flashColorCount": 1,
        "board.text.flashFrequency": 100,
        "board.text.message": "FLASH",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const flashColors = buildVestaboardModel(settings, { fieldProgress: 0.5, phraseProgress: 0.5 }).cells
      .filter((cell) => cell.isPhrase)
      .map((cell) => cell.messageFlashColor);

    expect(flashColors.every((color) => !color)).toBe(true);
  });

  it("flash palette colors can fill active disappearing cells from active slots", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [95, 95],
        "board.text.letterSpeed": 100,
        "board.text.flashColor1": { hex: "#00AAFF" },
        "board.text.flashColor2": { hex: "#FF3300" },
        "board.text.flashColorCount": 2,
        "board.text.flashFrequency": 100,
        "board.text.message":
          "OPTIMIZE HOW YOUR PRODUCT SENDS\nDATA TO AN LLM, GIVING IT ONLY\nTHE RIGHT CONTEXT BY AUTOMATICALLY\nREMOVING NOISY INPUT THAT CREATES\nUNNECESSARY BLOAT.",
        "board.text.targetMessage": "OPTIMIZE LLM CONTEXT\nBY REMOVING INPUT BLOAT",
        "board.tile.width": 32,
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const model = buildVestaboardModel(settings, { fieldProgress: 0.5, phraseProgress: 0.5 });
    const flashColors = new Set(
      model.cells
        .filter((cell) => cell.messageFlashColor)
        .map((cell) => cell.messageFlashColor),
    );

    expect(flashColors.size).toBeGreaterThanOrEqual(1);
    expect([...flashColors].every((color) => color === "#00AAFF" || color === "#FF3300")).toBe(
      true,
    );
  });

  it("two active flash colors animate across one disappearing letter lifetime", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [95, 95],
        "board.text.letterSpeed": 1,
        "board.text.flashColor1": { hex: "#00AAFF" },
        "board.text.flashColor2": { hex: "#FF3300" },
        "board.text.flashColorCount": 2,
        "board.text.flashFrequency": 100,
        "board.text.message": "FLASH",
        "board.text.targetMessage": "FH",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const getFirstRemovingLetterColor = (phraseProgress: number) =>
      buildVestaboardModel(settings, { fieldProgress: phraseProgress, phraseProgress }).cells.find(
        (cell) => cell.sourceIndex === 1,
      )?.messageFlashColor;
    const colors = new Set([
      getFirstRemovingLetterColor(0.1),
      getFirstRemovingLetterColor(0.4),
    ]);

    expect(colors).toEqual(new Set(["#00AAFF", "#FF3300"]));
  });

  it("flash palette clears before text animation completes", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.flashColor1": { hex: "#00AAFF" },
        "board.text.flashColor2": { hex: "#FF3300" },
        "board.text.flashColorCount": 2,
        "board.text.flashFrequency": 100,
        "board.text.message":
          "OPTIMIZE HOW YOUR PRODUCT SENDS\nDATA TO AN LLM, GIVING IT ONLY\nTHE RIGHT CONTEXT BY AUTOMATICALLY\nREMOVING NOISY INPUT THAT CREATES\nUNNECESSARY BLOAT.",
        "board.text.targetMessage": "OPTIMIZE LLM CONTEXT\nBY REMOVING INPUT BLOAT",
        "board.tile.width": 32,
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const lateModel = buildVestaboardModel(settings, {
      fieldProgress: 0.68,
      phraseProgress: 0.68,
    });
    const lateFlashColors = new Set(
      lateModel.cells
        .filter((cell) => cell.isPhrase && cell.messageFlashColor)
        .map((cell) => cell.messageFlashColor),
    );
    const endingModel = buildVestaboardModel(settings, {
      fieldProgress: 0.76,
      phraseProgress: 0.76,
    });
    const finalModel = buildVestaboardModel(settings, {
      fieldProgress: 1,
      phraseProgress: 1,
    });
    const endingPhraseSignature = endingModel.cells
      .filter((cell) => cell.isPhrase)
      .map((cell) => `${cell.row}:${cell.col}:${cell.char}`)
      .join("|");
    const finalPhraseSignature = finalModel.cells
      .filter((cell) => cell.isPhrase)
      .map((cell) => `${cell.row}:${cell.col}:${cell.char}`)
      .join("|");

    expect(lateFlashColors.size).toBeGreaterThan(0);
    expect([...lateFlashColors].every((color) => color === "#00AAFF" || color === "#FF3300")).toBe(
      true,
    );
    expect(endingPhraseSignature).not.toBe(finalPhraseSignature);
    expect(endingModel.cells.filter((cell) => cell.isPhrase).every((cell) => !cell.messageFlashColor)).toBe(
      true,
    );
    expect(finalModel.cells.filter((cell) => cell.isPhrase).every((cell) => !cell.messageFlashColor)).toBe(
      true,
    );
  });

  it("flash palette color 2 changes main text fill colors", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [95, 95],
        "board.text.letterSpeed": 100,
        "board.text.flashColor2": { hex: "#FF3300" },
        "board.text.flashColorCount": 2,
        "board.text.flashFrequency": 100,
        "board.text.message": "FLASHING MAIN TEXT CELLS",
        "board.text.targetMessage": "F",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const colors = new Set(
      buildVestaboardModel(settings, { fieldProgress: 0.5, phraseProgress: 0.5 }).cells
        .filter((cell) => cell.messageFlashColor)
        .map((cell) => cell.messageFlashColor),
    );

    expect(colors.has("#FF3300")).toBe(true);
  });

  it("flash palette color 3 changes main text fill colors", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [95, 95],
        "board.text.letterSpeed": 100,
        "board.text.flashColor3": { hex: "#33FF66" },
        "board.text.flashColorCount": 3,
        "board.text.flashFrequency": 100,
        "board.text.message": "FLASHING MAIN TEXT CELLS",
        "board.text.targetMessage": "F",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const colors = new Set(
      buildVestaboardModel(settings, { fieldProgress: 0.5, phraseProgress: 0.5 }).cells
        .filter((cell) => cell.messageFlashColor)
        .map((cell) => cell.messageFlashColor),
    );

    expect(colors.has("#33FF66")).toBe(true);
  });

  it("flash palette color 4 changes main text fill colors", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.letterDurationRange": [95, 95],
        "board.text.letterSpeed": 100,
        "board.text.flashColor4": { hex: "#AA55FF" },
        "board.text.flashColorCount": 4,
        "board.text.flashFrequency": 100,
        "board.text.message": "FLASHING MAIN TEXT CELLS",
        "board.text.targetMessage": "F",
        "field.fill": 0,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const colors = new Set(
      buildVestaboardModel(settings, { fieldProgress: 0.5, phraseProgress: 0.5 }).cells
        .filter((cell) => cell.messageFlashColor)
        .map((cell) => cell.messageFlashColor),
    );

    expect(colors.has("#AA55FF")).toBe(true);
  });

  it("legacy field fill keeps imported random field settings static", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.message": "OK",
        "field.fill": 42,
        "field.seed": 5,
      },
      {
        height: 720,
        unit: "px",
        width: 1200,
      },
    );
    const startSignature = buildVestaboardModel(settings, { fieldProgress: 0 }).cells
      .map((cell) => cell.char)
      .join("");
    const endSignature = buildVestaboardModel(settings, { fieldProgress: 1 }).cells
      .map((cell) => cell.char)
      .join("");

    expect(settings.fillStart).toBe(42);
    expect(settings.fillEnd).toBe(42);
    expect(endSignature).toBe(startSignature);
  });

  it("opacity range changes random field alpha", () => {
    const model = buildModel({
      "board.text.message": "OK",
      "field.fill": 100,
      "field.opacityRange": [20, 25],
      "field.seed": 42,
    });
    const fillerOpacity = model.cells
      .filter((cell) => !cell.isPhrase && cell.char)
      .map((cell) => cell.opacity);

    expect(Math.min(...fillerOpacity)).toBeGreaterThanOrEqual(20);
    expect(Math.max(...fillerOpacity)).toBeLessThanOrEqual(25);
    expect(model.cells.filter((cell) => cell.isPhrase).every((cell) => cell.opacity === 100)).toBe(
      true,
    );
  });

  it("seed slider changes deterministic random field", () => {
    const first = buildModel({
      "board.text.message": "OK",
      "field.fill": 100,
      "field.seed": 99,
    }).cells.map((cell) => cell.char);
    const second = buildModel({
      "board.text.message": "OK",
      "field.fill": 100,
      "field.seed": 99,
    }).cells.map((cell) => cell.char);
    const third = buildModel({
      "board.text.message": "OK",
      "field.fill": 100,
      "field.seed": 100,
    }).cells.map((cell) => cell.char);

    expect(second).toEqual(first);
    expect(third).not.toEqual(first);
  });

  it("tile width changes vestaboard cell geometry", () => {
    const model = buildModel({
      "board.tile.width": 80,
      "field.fill": 0,
    });

    expect(model.columns).toBe(13);
    expect(model.cellWidth).toBeCloseTo((1200 - 12 * 8) / 13);
    expect(model.cells[1]?.x).toBeCloseTo(model.cellWidth + 8);
    expect(model.boardWidth).toBe(1200);
  });

  it("tile height changes vestaboard cell geometry", () => {
    const model = buildModel({
      "board.tile.height": 100,
      "field.fill": 0,
    });

    expect(model.rows).toBe(6);
    expect(model.cellHeight).toBeCloseTo((720 - 5 * 8) / 6);
    expect(model.cells[model.columns]?.y).toBeCloseTo(model.cellHeight + 8);
    expect(model.boardHeight).toBe(720);
  });

  it("tile gap changes vestaboard spacing", () => {
    const model = buildModel({
      "board.tile.gap": 18,
      "field.fill": 0,
    });

    expect(model.cells[1]?.x).toBeCloseTo(model.cellWidth + 18);
    expect(model.cells[model.columns]?.y).toBeCloseTo(model.cellHeight + 18);
  });

  it("tile gap supports a negative one pixel overlap", () => {
    const model = buildModel({
      "board.tile.gap": -1,
      "field.fill": 0,
    });

    expect(model.settings.tileGap).toBe(-1);
    expect(model.cells[1]?.x).toBeCloseTo(model.cellWidth - 1);
  });

  it("canvas width changes vestaboard output bounds and columns", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.tile.width": 120,
        "board.tile.height": 150,
        "board.tile.gap": 30,
      },
      { height: 720, unit: "px", width: 640 },
    );
    const model = buildVestaboardModel(settings);

    expect(model.columns).toBe(4);
    expect(model.boardWidth).toBe(640);
    expect(model.cellWidth).toBeCloseTo((640 - 3 * 30) / 4);
  });

  it("canvas height changes vestaboard output bounds and rows", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.tile.width": 120,
        "board.tile.height": 150,
        "board.tile.gap": 30,
      },
      { height: 420, unit: "px", width: 1200 },
    );
    const model = buildVestaboardModel(settings);

    expect(model.rows).toBe(2);
    expect(model.boardHeight).toBe(420);
    expect(model.cellHeight).toBeCloseTo((420 - 30) / 2);
  });

  it("cell radius changes vestaboard cell rounding", () => {
    const model = buildModel({
      "board.cell.radius": 32,
      "field.fill": 0,
    });

    expect(model.cellRadius).toBeLessThan(32);
    expect(model.cellRadius).toBeCloseTo(model.cellWidth / 2);
  });

  it("cell fill color changes vestaboard cells", () => {
    const settings = resolveVestaboardSettings(
      { "board.cell.fill": { hex: "#00AAFF" } },
      { height: 720, unit: "px", width: 1200 },
    );

    expect(settings.cellFill).toBe("#00AAFF");
  });

  it("cell fill opacity range changes vestaboard cell backgrounds", () => {
    const model = buildModel({
      "board.cell.fillOpacityRange": [25, 30],
      "board.cell.fillSeed": 22,
      "field.fill": 0,
    });
    const fillOpacity = model.cells.map((cell) => cell.fillOpacity);

    expect(Math.min(...fillOpacity)).toBeGreaterThanOrEqual(25);
    expect(Math.max(...fillOpacity)).toBeLessThanOrEqual(30);
  });

  it("cell fill seed changes deterministic cell background alpha", () => {
    const first = buildModel({
      "board.cell.fillOpacityRange": [0, 100],
      "board.cell.fillSeed": 10,
    }).cells.map((cell) => cell.fillOpacity);
    const second = buildModel({
      "board.cell.fillOpacityRange": [0, 100],
      "board.cell.fillSeed": 10,
    }).cells.map((cell) => cell.fillOpacity);
    const third = buildModel({
      "board.cell.fillOpacityRange": [0, 100],
      "board.cell.fillSeed": 11,
    }).cells.map((cell) => cell.fillOpacity);

    expect(second).toEqual(first);
    expect(third).not.toEqual(first);
  });

  it("bottom opacity range changes cell lower-edge highlights", () => {
    const model = buildModel({
      "board.cell.bottomHighlightOpacityRange": [35, 45],
      "board.cell.bottomHighlightSeed": 44,
      "field.fill": 0,
    });
    const bottomHighlightOpacity = model.cells.map((cell) => cell.bottomHighlightOpacity);

    expect(Math.min(...bottomHighlightOpacity)).toBeGreaterThanOrEqual(35);
    expect(Math.max(...bottomHighlightOpacity)).toBeLessThanOrEqual(45);
  });

  it("bottom seed changes deterministic lower-edge highlight alpha", () => {
    const first = buildModel({
      "board.cell.bottomHighlightOpacityRange": [0, 100],
      "board.cell.bottomHighlightSeed": 101,
    }).cells.map((cell) => cell.bottomHighlightOpacity);
    const second = buildModel({
      "board.cell.bottomHighlightOpacityRange": [0, 100],
      "board.cell.bottomHighlightSeed": 101,
    }).cells.map((cell) => cell.bottomHighlightOpacity);
    const third = buildModel({
      "board.cell.bottomHighlightOpacityRange": [0, 100],
      "board.cell.bottomHighlightSeed": 102,
    }).cells.map((cell) => cell.bottomHighlightOpacity);

    expect(second).toEqual(first);
    expect(third).not.toEqual(first);
  });

  it("bottom fill canvas defaults to full highlighted coverage", () => {
    const model = buildModel({});

    expect(model.settings.cellBottomHighlightFillCanvas).toBe(100);
  });

  it("bottom fill canvas controls highlighted cell coverage", () => {
    const emptyModel = buildModel({
      "board.cell.bottomHighlightFillCanvas": 0,
      "board.cell.bottomHighlightOpacityRange": [50, 50],
    });
    const partialModel = buildModel({
      "board.cell.bottomHighlightFillCanvas": 45,
      "board.cell.bottomHighlightOpacityRange": [50, 50],
      "board.cell.bottomHighlightSeed": 77,
    });
    const partialCount = partialModel.cells.filter(
      (cell) => cell.bottomHighlightOpacity > 0,
    ).length;

    expect(emptyModel.cells.every((cell) => cell.bottomHighlightOpacity === 0)).toBe(true);
    expect(partialCount).toBeGreaterThan(0);
    expect(partialCount).toBeLessThan(partialModel.cellCount);
  });

  it("removed edge mode setting is not part of model settings", () => {
    const model = buildModel({});

    expect("cellEdgeMode" in model.settings).toBe(false);
  });

  it("removed edge mode import is ignored", () => {
    const model = buildModel({
      "board.cell.edgeMode": "bottom-left",
    });

    expect("cellEdgeMode" in model.settings).toBe(false);
  });

  it("cell border color opacity changes vestaboard cells", () => {
    const settings = resolveVestaboardSettings(
      { "board.cell.border": { hex: "#FF8800", opacity: 65 } },
      { height: 720, unit: "px", width: 1200 },
    );

    expect(settings.cellBorder).toEqual({ hex: "#FF8800", opacity: 65 });
  });

  it("resolves main and background typography independently", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.messageTypography": {
          fontId: "space-grotesk",
          fontSize: 44,
          fontWeight: "700",
          letterSpacing: "wide",
          lineHeight: "tight",
        },
        "field.typography": {
          fontId: "playfair-display",
          fontSize: 26,
          fontWeight: "400",
          letterSpacing: "tight",
          lineHeight: "normal",
        },
      },
      { height: 720, unit: "px", width: 1200 },
    );

    expect(settings.messageTypography).toMatchObject({
      fontFamily: "Space Grotesk",
      fontId: "space-grotesk",
      fontSize: 44,
      fontWeight: "700",
      letterSpacing: "wide",
      lineHeight: "tight",
    });
    expect(settings.fieldTypography).toMatchObject({
      fontFamily: "Playfair Display",
      fontId: "playfair-display",
      fontSize: 26,
      fontWeight: "400",
      letterSpacing: "tight",
      lineHeight: "normal",
    });
  });

  it("uses legacy typography as fallback for split font controls", () => {
    const settings = resolveVestaboardSettings(
      {
        "board.text.typography": {
          fontId: "space-grotesk",
          fontSize: 44,
          fontWeight: "700",
          letterSpacing: "wide",
          lineHeight: "tight",
        },
      },
      { height: 720, unit: "px", width: 1200 },
    );

    expect(settings.messageTypography).toMatchObject({
      fontFamily: "Space Grotesk",
      fontId: "space-grotesk",
      fontSize: 44,
      fontWeight: "700",
      letterSpacing: "wide",
      lineHeight: "tight",
    });
    expect(settings.fieldTypography).toMatchObject({
      fontFamily: "Space Grotesk",
      fontId: "space-grotesk",
      fontSize: 44,
      fontWeight: "700",
      letterSpacing: "wide",
      lineHeight: "tight",
    });
  });

  it("text color changes vestaboard characters", () => {
    const settings = resolveVestaboardSettings(
      { "board.text.color": { hex: "#FFCC00" } },
      { height: 720, unit: "px", width: 1200 },
    );

    expect(settings.textColor).toBe("#FFCC00");
  });

  it("background color changes vestaboard preview and export", () => {
    const settings = resolveVestaboardSettings(
      { "appearance.background": { hex: "#123456" } },
      { height: 720, unit: "px", width: 1200 },
    );

    expect(settings.background).toBe("#123456");
  });

  it("include background controls png alpha only", () => {
    const toggleControl = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.target === "export.includeBackground");

    expect(toggleControl?.defaultValue).toBe(true);
  });

  it("export actions download video and png vestaboard output", () => {
    const exportScenario = appPerformance.scenarios.find(
      (scenario) => scenario.id === "export-actions",
    );

    expect(exportScenario?.interaction).toBe("export-copy");
    expect(appSchema.export.png.background).toBe("include");
  });

  it("vestaboard renderer exposes product output only", () => {
    expect(appPerformance.rendererTechnique?.layers?.map((layer) => layer.id)).toEqual([
      "backgroundLayer",
      "productForegroundLayer",
      "edgeOverlayLayer",
      "exportComposite",
    ]);
  });

  it("toolbar viewport keeps vestaboard centered", () => {
    expect(appSchema.toolbar.zoom).toBe(true);
    expect(appSchema.toolbar.radar).toBe(true);
  });

  it("removed grid preset setting keeps tile-derived layout editable", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;
    const importedPresetModel = buildVestaboardModel(
      resolveVestaboardSettings({ "board.grid.preset": "vestaboard" }, canvas),
    );
    const defaultModel = buildVestaboardModel(resolveVestaboardSettings({}, canvas));

    expect("gridPreset" in importedPresetModel.settings).toBe(false);
    expect(importedPresetModel.columns).toBe(defaultModel.columns);
    expect(importedPresetModel.rows).toBe(defaultModel.rows);
    expect(defaultModel.columns).toBe(VESTABOARD_COLUMNS);

    const tileWidthControl = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.target === "board.tile.width");
    const tileHeightControl = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.target === "board.tile.height");

    expect(tileWidthControl?.disabledWhen).toBeUndefined();
    expect(tileHeightControl?.disabledWhen).toBeUndefined();
  });

  it("uppercase remaps message text before layout", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;
    const uppercaseSettings = resolveVestaboardSettings(
      {
        "board.text.message": "hello board",
        "board.text.targetMessage": "hold",
        "board.text.uppercase": true,
      },
      canvas,
    );
    const defaultSettings = resolveVestaboardSettings(
      { "board.text.message": "hello board" },
      canvas,
    );

    expect(uppercaseSettings.message).toBe("HELLO BOARD");
    expect(uppercaseSettings.targetMessage).toBe("HOLD");
    expect(uppercaseSettings.uppercase).toBe(true);
    expect(defaultSettings.message).toBe("hello board");
    expect(defaultSettings.uppercase).toBe(false);
  });

  it("flip mode switches drum and random engines", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;
    const values = {
      "board.text.message": "ABCDEFG",
      "board.text.targetMessage": "AG",
    };
    const drumSettings = resolveVestaboardSettings(
      { ...values, "board.flip.mode": "drum", "board.flip.wear": 0 },
      canvas,
    );
    const randomSettings = resolveVestaboardSettings(values, canvas);

    expect(resolveVestaboardSettings({}, canvas).flipMode).toBe("random");
    expect(drumSettings.flipMode).toBe("drum");
    expect(getVestaboardDrumDistance("A", "C")).toBe(2);
    expect(getVestaboardDrumDistance("A", " ")).toBe(VESTABOARD_DRUM_CHARS.length - 1);
    expect(getVestaboardDrumDistance("K", "K")).toBe(0);

    const lastCharBySource = new Map<number, string>();
    let sawSpinningChar = false;

    for (let step = 0; step <= 200; step += 1) {
      const progress = step / 200;
      const model = buildVestaboardModel(drumSettings, {
        durationSeconds: 8,
        fieldProgress: progress,
        phraseProgress: progress,
      });

      for (const cell of model.cells) {
        if (!cell.isPhrase || cell.sourceIndex === undefined) {
          continue;
        }

        const previousChar = lastCharBySource.get(cell.sourceIndex);

        if (
          previousChar !== undefined &&
          previousChar !== cell.char &&
          previousChar !== "" &&
          cell.char !== ""
        ) {
          const previousIndex = VESTABOARD_DRUM_CHARS.indexOf(previousChar);
          const currentIndex = VESTABOARD_DRUM_CHARS.indexOf(cell.char);

          if (previousIndex >= 0 && currentIndex >= 0) {
            const forward =
              (currentIndex - previousIndex + VESTABOARD_DRUM_CHARS.length) %
              VESTABOARD_DRUM_CHARS.length;

            sawSpinningChar = true;
            expect(forward).toBeGreaterThan(0);
          }
        }

        lastCharBySource.set(cell.sourceIndex, cell.char);
      }
    }

    expect(sawSpinningChar).toBe(true);

    const drumFinal = buildVestaboardModel(drumSettings, {
      durationSeconds: 8,
      fieldProgress: 1,
      phraseProgress: 1,
    });
    const randomFinal = buildVestaboardModel(randomSettings, {
      durationSeconds: 8,
      fieldProgress: 1,
      phraseProgress: 1,
    });
    const phraseText = (model: ReturnType<typeof buildVestaboardModel>): string =>
      model.cells
        .filter((cell) => cell.isPhrase)
        .map((cell) => cell.char)
        .join("")
        .trim();

    expect(phraseText(drumFinal)).toBe("AG");
    expect(phraseText(drumFinal)).toBe(phraseText(randomFinal));

    const drumMid = buildVestaboardModel(drumSettings, {
      durationSeconds: 8,
      fieldProgress: 0.3,
      phraseProgress: 0.3,
    });
    const randomMid = buildVestaboardModel(randomSettings, {
      durationSeconds: 8,
      fieldProgress: 0.3,
      phraseProgress: 0.3,
    });

    expect(
      drumMid.cells.map((cell) => cell.char).join(""),
    ).not.toBe(randomMid.cells.map((cell) => cell.char).join(""));
  });

  it("wear inserts sticky pauses into drum spins", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;
    const values = {
      "board.flip.mode": "drum",
      "board.text.message": "XBZ",
      "board.text.targetMessage": "X",
    };
    const wearOff = resolveVestaboardSettings({ ...values, "board.flip.wear": 0 }, canvas);
    const wearOn = resolveVestaboardSettings({ ...values, "board.flip.wear": 100 }, canvas);
    const phraseFrame = (
      settings: ReturnType<typeof resolveVestaboardSettings>,
      progress: number,
    ): string =>
      buildVestaboardModel(settings, {
        durationSeconds: 3,
        fieldProgress: progress,
        phraseProgress: progress,
      })
        .cells.filter((cell) => cell.isPhrase)
        .map((cell) => cell.char)
        .join("");

    let framesDiffer = false;

    for (let step = 1; step < 40; step += 1) {
      if (phraseFrame(wearOff, step / 40) !== phraseFrame(wearOn, step / 40)) {
        framesDiffer = true;
        break;
      }
    }

    expect(framesDiffer).toBe(true);
    expect(phraseFrame(wearOn, 1).trim()).toBe("X");
  });

  it("trail ghosts previous characters on flipping cells", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;
    const values = {
      "board.flip.mode": "random",
      "board.text.letterDurationRange": [95, 95],
      "board.text.message": "ABCD",
      "board.text.outgoingOpacityRange": [12, 12],
      "board.text.targetMessage": "AD",
      "field.fillStart": 0,
      "field.fillEnd": 40,
    };
    const settings = resolveVestaboardSettings(values, canvas);
    const midModel = buildVestaboardModel(settings, {
      durationSeconds: 6,
      fieldProgress: 0.35,
      phraseProgress: 0.35,
    });
    const restModel = buildVestaboardModel(settings, {
      durationSeconds: 6,
      fieldProgress: 1,
      phraseProgress: 1,
    });
    const trailCell = midModel.cells.find((cell) => cell.trailChar);

    expect(trailCell).toBeDefined();
    expect(restModel.cells.every((cell) => !cell.trailChar)).toBe(true);

    if (trailCell) {
      expect(getVestaboardTrailAlpha(settings, trailCell)).toBeGreaterThan(0);
      const zeroTrailSettings = resolveVestaboardSettings(
        { ...values, "board.flip.trailOpacity": 0 },
        canvas,
      );

      expect(getVestaboardTrailAlpha(zeroTrailSettings, trailCell)).toBe(0);
    }
  });

  it("vibration shakes the board during flips", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;
    const values = {
      "board.flip.mode": "drum",
      "board.flip.wear": 0,
      "board.text.message": "SHAKE",
      "board.text.targetMessage": "S",
      "field.fillStart": 0,
      "field.fillEnd": 0,
    };
    const settings = resolveVestaboardSettings(values, canvas);
    const midProgress = Array.from({ length: 100 }, (_item, index) => (index + 1) / 100).find(
      (progress) =>
        buildVestaboardModel(settings, {
          durationSeconds: 6,
          fieldProgress: progress,
          phraseProgress: progress,
        }).cells.some((cell) => cell.isPhrase && cell.isFlipping),
    );

    expect(midProgress).toBeDefined();
    const midModel = buildVestaboardModel(settings, {
      durationSeconds: 6,
      fieldProgress: midProgress,
      phraseProgress: midProgress,
    });
    const repeatModel = buildVestaboardModel(settings, {
      durationSeconds: 6,
      fieldProgress: midProgress,
      phraseProgress: midProgress,
    });
    const restModel = buildVestaboardModel(settings, {
      durationSeconds: 6,
      fieldProgress: 1,
      phraseProgress: 1,
    });
    const zeroShakeModel = buildVestaboardModel(
      resolveVestaboardSettings({ ...values, "board.flip.shake": 0 }, canvas),
      { durationSeconds: 6, fieldProgress: midProgress, phraseProgress: midProgress },
    );

    expect(midModel.flippingCellCount).toBeGreaterThan(0);
    expect(midModel.cells.some((cell) => cell.isPhrase && cell.isFlipping)).toBe(true);
    expect(Math.abs(midModel.shakeX) + Math.abs(midModel.shakeY)).toBeGreaterThan(0);
    expect(Math.abs(midModel.shakeX)).toBeLessThanOrEqual(1.1);
    expect(Math.abs(midModel.shakeY)).toBeLessThanOrEqual(1.1);
    expect(midModel.shakeX).toBe(repeatModel.shakeX);
    expect(midModel.shakeY).toBe(repeatModel.shakeY);
    expect(restModel.shakeX).toBe(0);
    expect(restModel.shakeY).toBe(0);
    expect(zeroShakeModel.shakeX).toBe(0);
    expect(zeroShakeModel.shakeY).toBe(0);
  });

  it("sound toggle arms flap click synthesis", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;

    expect(resolveVestaboardSettings({}, canvas).soundEnabled).toBe(false);
    expect(
      resolveVestaboardSettings({ "board.sound.enabled": true }, canvas).soundEnabled,
    ).toBe(true);

    const soundControl = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.target === "board.sound.enabled");

    expect(soundControl?.type).toBe("switch");
    expect(soundControl?.defaultValue).toBe(true);
  });

  it("sound volume changes flap click gain", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;

    expect(resolveVestaboardSettings({}, canvas).soundVolume).toBe(60);
    expect(
      resolveVestaboardSettings({ "board.sound.volume": 85 }, canvas).soundVolume,
    ).toBe(85);

    const volumeControl = appSchema.panels.controls?.sections
      .flatMap((section) => Object.values(section.controls))
      .find((control) => control.target === "board.sound.volume");

    expect(volumeControl?.disabledWhen).toEqual({
      equals: false,
      target: "board.sound.enabled",
    });
  });

  it("drum chips reuse the flash palette as drum color positions", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;
    const chipSettings = resolveVestaboardSettings(
      {
        "board.flip.mode": "drum",
        "board.text.flashColorCount": 4,
        "board.text.flashFrequency": 100,
        "board.text.message": "ABCDEFGHIJ",
        "board.text.targetMessage": "A",
      },
      canvas,
    );
    let chipSeen = false;

    for (let step = 0; step <= 120; step += 1) {
      const progress = step / 120;
      const model = buildVestaboardModel(chipSettings, {
        durationSeconds: 8,
        fieldProgress: progress,
        phraseProgress: progress,
      });

      for (const cell of model.cells) {
        if (cell.isPhrase && cell.messageFlashColor) {
          chipSeen = true;
          expect(cell.char).toBe("");
        }
      }
    }

    expect(chipSeen).toBe(true);

    const noChipSettings = resolveVestaboardSettings(
      {
        "board.flip.mode": "drum",
        "board.text.flashColorCount": 4,
        "board.text.flashFrequency": 0,
        "board.text.message": "ABCDEFGHIJ",
        "board.text.targetMessage": "A",
      },
      canvas,
    );

    for (let step = 0; step <= 40; step += 1) {
      const progress = step / 40;
      const model = buildVestaboardModel(noChipSettings, {
        durationSeconds: 8,
        fieldProgress: progress,
        phraseProgress: progress,
      });

      expect(model.cells.some((cell) => cell.messageFlashColor)).toBe(false);
    }
  });

  it("drum field cells settle to the same end state as random mode", () => {
    const canvas = { height: 720, unit: "px", width: 1200 } as const;
    const fieldValues = { "field.fillStart": 0, "field.fillEnd": 40 };
    const drumEnd = buildVestaboardModel(
      resolveVestaboardSettings({ ...fieldValues, "board.flip.mode": "drum" }, canvas),
      { durationSeconds: 6, fieldProgress: 1, phraseProgress: 1 },
    );
    const randomEnd = buildVestaboardModel(
      resolveVestaboardSettings(fieldValues, canvas),
      { durationSeconds: 6, fieldProgress: 1, phraseProgress: 1 },
    );
    const drumStart = buildVestaboardModel(
      resolveVestaboardSettings({ ...fieldValues, "board.flip.mode": "drum" }, canvas),
      { durationSeconds: 6, fieldProgress: 0, phraseProgress: 0 },
    );

    expect(drumEnd.cells.map((cell) => cell.char)).toEqual(
      randomEnd.cells.map((cell) => cell.char),
    );
    expect(drumStart.cells.every((cell) => cell.char === "")).toBe(true);
  });
});
