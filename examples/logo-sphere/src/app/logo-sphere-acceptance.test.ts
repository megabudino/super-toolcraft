import { expect, test } from "vitest";

import type { ToolcraftState } from "@/toolcraft/runtime";

import { appAcceptance } from "./app-acceptance-data";
import { appComposition } from "./app-composition";
import { appSchema } from "./app-schema";
import {
  logoSphereDefaultAssets,
  logoSphereDefaultLogoCount,
} from "./logo-sphere-assets";
import {
  createSpherePoints,
  getLogoSphereMaskGeometry,
  projectLogoSphere,
  rotateLogoSphereOrientation,
  type LogoSphereProjectionInput,
} from "./logo-sphere-model";
import {
  defaultLogoSphereCardStyle,
  getLogoSphereCardGeometry,
} from "./logo-sphere-renderer";
import {
  getLogoSphereCardStyle,
  getLogoSphereSceneRect,
} from "./logo-sphere-state";

const baseInput: LogoSphereProjectionInput = {
  baseLogoSize: 112,
  depth: 1,
  distribution: "fibonacci",
  feather: 0.22,
  frame: { height: 1080, width: 1920, x: 0, y: 0 },
  loopProgress: 0,
  maskSize: 1.02,
  orientation: { position: [0, 0, 5], up: [0, 1, 0] },
  perspective: 2.3,
  rearOpacity: 0.08,
  radius: 370,
  spinAmount: 1,
  spinAxis: "diagonal",
  visibleCount: 30,
};

type LooseControl = Readonly<{
  actions?: readonly Readonly<Record<string, unknown>>[];
  defaultValue?: unknown;
  max?: number;
  min?: number;
  options?: readonly Readonly<Record<string, unknown>>[];
  target?: string;
  type?: string;
}>;

function findControl(target: string): LooseControl {
  const sections = appSchema.panels.controls?.sections ?? [];
  for (const section of sections) {
    for (const control of Object.values(section.controls ?? {})) {
      const candidate = control as LooseControl;
      if (candidate.target === target) {
        return candidate;
      }
    }
  }
  throw new Error(`Missing schema control ${target}.`);
}

function radius(input: LogoSphereProjectionInput): number {
  const projected = projectLogoSphere(input);
  return Math.max(
    ...projected.map(({ x, y }) =>
      Math.hypot(x - input.frame.width / 2, y - input.frame.height / 2),
    ),
  );
}

function sizeContrast(input: LogoSphereProjectionInput): number {
  const sizes = projectLogoSphere(input).map(({ size }) => size);
  return Math.max(...sizes) / Math.min(...sizes);
}

function fakeState(mode: "finite" | "infinite" = "finite"): ToolcraftState {
  return {
    canvas: { mode },
    defaults: { "view.orbit": baseInput.orientation },
    mediaAssets: logoSphereDefaultAssets,
    timeline: { currentTimeSeconds: 0, durationSeconds: 12 },
    values: {
      "appearance.background": "#F5F4F1",
      "card.cornerRadius": 12,
      "card.shadowBlur": 16,
      "card.shadowColor": "#171717",
      "card.shadowOffset": 8,
      "card.shadowOpacity": 28,
      "card.strokeColor": "#D7D6D2",
      "card.strokeWidth": 1.5,
      "fade.feather": 22,
      "fade.maskSize": 102,
      "fade.rearOpacity": 8,
      "motion.inertia": 72,
      "motion.spinAmount": 1,
      "motion.spinAxis": "diagonal",
      "sphere.depth": 100,
      "sphere.distribution": "fibonacci",
      "sphere.fisheye": 0,
      "sphere.logoSize": 112,
      "sphere.perspective": 2.3,
      "sphere.radius": 370,
      "sphere.visibleCount": 30,
      "view.orbit": baseInput.orientation,
    },
  } as unknown as ToolcraftState;
}

const checks: Readonly<Record<string, () => void>> = {
  "logos.default-set": () => {
    expect(logoSphereDefaultAssets).toHaveLength(1);
    expect(logoSphereDefaultLogoCount).toBe(30);
    expect(logoSphereDefaultAssets[0]).toMatchObject({
      fileName: "supplied-svg-logo-set.svg",
      mimeType: "image/svg+xml",
    });
    expect(logoSphereDefaultAssets[0]?.dataUrl).toMatch(
      /^data:image\/svg\+xml/,
    );
    expect(
      logoSphereDefaultAssets.every(
        ({ sourceTarget }) => sourceTarget === "logos.defaults",
      ),
    ).toBe(true);
    expect(findControl("logos.defaults")).toMatchObject({
      target: "logos.defaults",
      type: "fileDrop",
    });
  },
  "logos.media": () => {
    expect(findControl("logos.sources")).toMatchObject({
      target: "logos.sources",
      type: "fileDrop",
    });
  },
  "sphere.visible-count": () => {
    expect(projectLogoSphere({ ...baseInput, visibleCount: 6 })).toHaveLength(6);
    expect(projectLogoSphere({ ...baseInput, visibleCount: 500 })).toHaveLength(
      500,
    );
    expect(findControl("sphere.visibleCount")).toMatchObject({
      max: 500,
      min: 6,
    });
  },
  "sphere.distribution": () => {
    expect(createSpherePoints({ count: 30, distribution: "fibonacci" })).not.toEqual(
      createSpherePoints({ count: 30, distribution: "rings" }),
    );
    expect(createSpherePoints({ count: 30, distribution: "grid" })).not.toEqual(
      createSpherePoints({ count: 30, distribution: "fibonacci" }),
    );
    expect(
      findControl("sphere.distribution").options?.map(({ value }) => value),
    ).toEqual(["fibonacci", "rings", "grid"]);
  },
  "sphere.radius": () => {
    expect(radius({ ...baseInput, radius: 1600 })).toBeGreaterThan(
      radius({ ...baseInput, radius: 370 }) * 3,
    );
    expect(findControl("sphere.radius")).toMatchObject({ max: 1600, min: 140 });
  },
  "sphere.logo-size": () => {
    const small = projectLogoSphere({ ...baseInput, baseLogoSize: 56 });
    const large = projectLogoSphere({ ...baseInput, baseLogoSize: 220 });
    expect(large[0]?.size).toBeGreaterThan((small[0]?.size ?? 0) * 3.8);
  },
  "sphere.depth": () => {
    const flat = projectLogoSphere({ ...baseInput, depth: 0.25 });
    const deep = projectLogoSphere({ ...baseInput, depth: 1.2 });
    expect(sizeContrast({ ...baseInput, depth: 1.2 })).toBeGreaterThan(
      sizeContrast({ ...baseInput, depth: 0.25 }),
    );
    expect((deep.at(-1)?.opacity ?? 0) - (deep[0]?.opacity ?? 1)).toBeGreaterThan(
      (flat.at(-1)?.opacity ?? 0) - (flat[0]?.opacity ?? 1),
    );
  },
  "sphere.perspective": () => {
    expect(sizeContrast({ ...baseInput, perspective: 1.6 })).toBeGreaterThan(
      sizeContrast({ ...baseInput, perspective: 5 }),
    );
  },
  "sphere.fisheye": () => {
    const standard = projectLogoSphere({ ...baseInput, fisheye: 0 });
    const bulged = projectLogoSphere({ ...baseInput, fisheye: 1 });
    expect(bulged.at(-1)?.size ?? 0).toBeGreaterThan(
      (standard.at(-1)?.size ?? 0) * 1.4,
    );
    expect(bulged[0]?.size ?? 0).toBeLessThan(standard[0]?.size ?? 0);
    expect(findControl("sphere.fisheye")).toMatchObject({
      defaultValue: 0,
      max: 100,
      min: 0,
    });
  },
  "sphere.orbit": () => {
    expect(rotateLogoSphereOrientation(baseInput.orientation, 40, -24)).not.toEqual(
      baseInput.orientation,
    );
  },
  "fade.mask-size": () => {
    expect(
      getLogoSphereMaskGeometry({ ...baseInput, maskSize: 1.25 }).outerRadius,
    ).toBeGreaterThan(
      getLogoSphereMaskGeometry({ ...baseInput, maskSize: 0.55 }).outerRadius,
    );
  },
  "fade.feather": () => {
    const narrow = getLogoSphereMaskGeometry({ ...baseInput, feather: 0.02 });
    const wide = getLogoSphereMaskGeometry({ ...baseInput, feather: 0.6 });
    expect(wide.outerRadius - wide.innerRadius).toBeGreaterThan(
      narrow.outerRadius - narrow.innerRadius,
    );
  },
  "fade.rear-opacity": () => {
    const hiddenRear = projectLogoSphere({ ...baseInput, rearOpacity: 0 });
    const visibleRear = projectLogoSphere({ ...baseInput, rearOpacity: 1 });
    expect(visibleRear[0]?.opacity).toBeGreaterThan(hiddenRear[0]?.opacity ?? 1);
  },
  "card.stroke-width": () => {
    const far = getLogoSphereCardGeometry(
      { size: 56 },
      112,
      defaultLogoSphereCardStyle,
    );
    const near = getLogoSphereCardGeometry(
      { size: 224 },
      112,
      defaultLogoSphereCardStyle,
    );
    expect(far.strokeWidth).toBe(near.strokeWidth);
    expect(findControl("card.strokeWidth")).toMatchObject({ min: 0, max: 8 });
  },
  "card.stroke-color": () => {
    const state = fakeState();
    state.values["card.strokeColor"] = { hex: "#E02067" };
    expect(getLogoSphereCardStyle(state).strokeColor).toBe("#E02067");
    expect(findControl("card.strokeColor").type).toBe("color");
  },
  "card.corner-radius": () => {
    const far = getLogoSphereCardGeometry(
      { size: 56 },
      112,
      defaultLogoSphereCardStyle,
    );
    const near = getLogoSphereCardGeometry(
      { size: 224 },
      112,
      defaultLogoSphereCardStyle,
    );
    expect(near.cornerRadius).toBe(far.cornerRadius * 4);
  },
  "card.shadow-color": () => {
    const state = fakeState();
    state.values["card.shadowColor"] = { hex: "#0055FF" };
    expect(getLogoSphereCardStyle(state).shadowColor).toBe("#0055FF");
    expect(findControl("card.shadowColor").type).toBe("color");
  },
  "card.shadow-opacity": () => {
    expect(getLogoSphereCardStyle(fakeState()).shadowOpacity).toBeCloseTo(0.28);
    expect(findControl("card.shadowOpacity")).toMatchObject({ min: 0, max: 60 });
  },
  "card.shadow-blur": () => {
    const far = getLogoSphereCardGeometry(
      { size: 56 },
      112,
      defaultLogoSphereCardStyle,
    );
    const near = getLogoSphereCardGeometry(
      { size: 224 },
      112,
      defaultLogoSphereCardStyle,
    );
    expect(near.shadowBlur).toBe(far.shadowBlur * 4);
  },
  "card.shadow-offset": () => {
    const far = getLogoSphereCardGeometry(
      { size: 56 },
      112,
      defaultLogoSphereCardStyle,
    );
    const near = getLogoSphereCardGeometry(
      { size: 224 },
      112,
      defaultLogoSphereCardStyle,
    );
    expect(near.shadowOffset).toBe(far.shadowOffset * 4);
  },
  "motion.spin-axis": () => {
    const vertical = projectLogoSphere({
      ...baseInput,
      loopProgress: 0.23,
      spinAxis: "vertical",
    });
    const horizontal = projectLogoSphere({
      ...baseInput,
      loopProgress: 0.23,
      spinAxis: "horizontal",
    });
    expect(vertical).not.toEqual(horizontal);
  },
  "motion.spin-turns": () => {
    expect(
      projectLogoSphere({ ...baseInput, loopProgress: 0.23, spinAmount: 1 }),
    ).not.toEqual(
      projectLogoSphere({ ...baseInput, loopProgress: 0.23, spinAmount: 2 }),
    );
  },
  "motion.inertia": () => {
    expect(findControl("motion.inertia")).toMatchObject({ max: 96, min: 0 });
    expect(rotateLogoSphereOrientation(baseInput.orientation, 12, 8)).not.toEqual(
      baseInput.orientation,
    );
  },
  "background.output": () => {
    expect(findControl("export.includeBackground")).toMatchObject({
      defaultValue: true,
      type: "switch",
    });
    expect(findControl("appearance.background")).toMatchObject({
      defaultValue: "#F5F4F1",
      type: "color",
    });
  },
  "background.color": () => {
    expect(findControl("appearance.background").defaultValue).toBe("#F5F4F1");
  },
  "export.image-format": () => {
    expect(findControl("export.image.format").options).toEqual([
      { label: "PNG", value: "png" },
      { label: "JPG", value: "jpg" },
    ]);
  },
  "export.image-resolution": () => {
    expect(findControl("export.image.resolution").options?.map(({ value }) => value)).toEqual([
      "2k",
      "4k",
      "8k",
    ]);
  },
  "export.image": () => {
    expect(appComposition.exportRenderer?.renderFrame).toBeTypeOf("function");
    expect(findControl("actions.output").actions).toContainEqual(
      expect.objectContaining({ role: "export-image", value: "export.png" }),
    );
  },
  "timeline.playback": () => {
    expect(projectLogoSphere({ ...baseInput, loopProgress: 0 })).toEqual(
      projectLogoSphere({ ...baseInput, loopProgress: 1 }),
    );
    expect(appSchema.panels.timeline).toMatchObject({
      defaultDurationSeconds: 12,
      mode: "playback",
    });
  },
  "canvas.infinity.mode": () => {
    expect(appSchema.canvas.sizing).toEqual({ mode: "editable-output" });
    expect(getLogoSphereSceneRect(fakeState("infinite"))).not.toBeNull();
  },
  "canvas.infinity.export": () => {
    const compact = getLogoSphereSceneRect(fakeState("infinite"));
    const wideState = fakeState("infinite");
    wideState.values["sphere.radius"] = 900;
    const wide = getLogoSphereSceneRect(wideState);
    expect(wide?.width).toBeGreaterThan(compact?.width ?? 0);
  },
  "canvas.render-scale": () => {
    expect(appSchema.canvas.renderScale).toMatchObject({
      defaultValue: 2,
      enabled: true,
      max: 2,
      min: 1,
    });
  },
  "persistence.reload": () => {
    expect(appSchema.persistence).toMatchObject({
      include: ["canvas", "media", "panels", "timeline", "values"],
      storage: "localStorage",
    });
  },
};

for (const entry of appAcceptance) {
  test(entry.automatedTestName, () => {
    const check = checks[entry.id];
    expect(check, `Missing product check for ${entry.id}.`).toBeTypeOf("function");
    check?.();
  });
}
