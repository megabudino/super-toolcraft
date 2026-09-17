import type { ResolvedToolcraftAppSchema } from "@/toolcraft/runtime";

import { getToolcraftSectionLabel } from "./sections";

const runtimeSetupControlTargets = new Set([
  "runtime.settingsTransfer",
  "canvas.infinity",
  "canvas.aspectRatio",
  "canvas.renderScale",
  "canvas.rotationLocked",
  "canvas.size.width",
  "canvas.size.height",
  "panels.timeline.extended",
]);

export function isRuntimeSetupControlTarget(target: string): boolean {
  return runtimeSetupControlTargets.has(target);
}

export function getToolcraftRuntimeSetupSectionErrors(
  schema: ResolvedToolcraftAppSchema,
): string[] {
  const errors: string[] = [];
  const controlsPanel = schema.panels.controls;

  if (!controlsPanel) {
    return [
      "Generated Toolcraft apps must define a controls panel so the mandatory runtime Setup section is visible.",
    ];
  }

  const sections = schema.panels.controls?.sections ?? [];

  if (sections.length === 0) {
    return [
      'Runtime Setup must be the first visible controls-panel section titled "Setup". Do not ship an empty controls panel.',
    ];
  }

  const setupSection = sections[0];
  const setupTitle = setupSection?.title?.trim();
  const setupControls = Object.values(setupSection?.controls ?? {});
  const setupTargets = new Set(setupControls.map((control) => control.target));
  const hasSetupTarget = (target: string) => setupTargets.has(target);

  if (setupTitle !== "Setup") {
    errors.push(
      'Runtime Setup must be the first visible controls-panel section titled "Setup". Do not move Save as Defaults, canvas sizing, Resolution scale, or Timeline into app-authored sections.',
    );
  }

  if (
    !setupControls.some(
      (control) =>
        control.type === "settingsTransfer" &&
        control.target === "runtime.settingsTransfer",
    )
  ) {
    errors.push(
      'Runtime Setup must include settingsTransfer at target "runtime.settingsTransfer" as the runtime-owned local defaults authoring slot; settings file actions are absent.',
    );
  }

  if (
    schema.canvas.enabled &&
    schema.canvas.sizing.mode === "editable-output"
  ) {
    const missingCanvasTargets = [
      "canvas.infinity",
      "canvas.aspectRatio",
      "canvas.size.width",
      "canvas.size.height",
    ].filter((target) => !hasSetupTarget(target));

    if (missingCanvasTargets.length > 0) {
      errors.push(
        `Runtime Setup for editable-output canvas must include Infinity canvas, Aspect ratio, Canvas width, and Canvas height. Missing targets: ${missingCanvasTargets.join(", ")}.`,
      );
    }
  }

  if (
    schema.canvas.renderScale.enabled &&
    !hasSetupTarget("canvas.renderScale")
  ) {
    errors.push(
      'Runtime Setup must include Resolution scale at target "canvas.renderScale" whenever canvas.renderScale is enabled.',
    );
  }

  if (schema.panels.timeline?.enabled) {
    if (!hasSetupTarget("panels.timeline.extended")) {
      errors.push(
        'Runtime Setup must include the Timeline switch at target "panels.timeline.extended" whenever panels.timeline is enabled.',
      );
    }
  } else if (
    sections.some((section) =>
      Object.values(section.controls).some(
        (control) => control.target === "panels.timeline.extended",
      ),
    )
  ) {
    errors.push(
      "Runtime Setup must not include the Timeline switch unless panels.timeline is enabled.",
    );
  }

  const hasOrientationGizmo = sections.some((section) =>
    Object.values(section.controls).some(
      (control) => control.type === "orientationGizmo",
    ),
  );
  if (hasSetupTarget("canvas.rotationLocked") !== hasOrientationGizmo) {
    errors.push(
      "Runtime Setup must include Lock rotation exactly when the app declares an orientationGizmo.",
    );
  }
  const finalRowTargets = [
    ...(schema.panels.timeline?.enabled ? ["panels.timeline.extended"] : []),
    ...(hasOrientationGizmo ? ["canvas.rotationLocked"] : []),
  ];
  if (finalRowTargets.length > 0) {
    const actualFinalTargets = setupControls
      .slice(-finalRowTargets.length)
      .map((control) => control.target);
    if (actualFinalTargets.join("|") !== finalRowTargets.join("|")) {
      errors.push(
        "Runtime Setup must place Timeline and Lock rotation, when present, in that order in its final row.",
      );
    }
    if (
      finalRowTargets.length === 2 &&
      !setupSection?.layoutGroups?.some(
        (group) =>
          group.layout === "inline" &&
          group.columns === 2 &&
          group.controls.length === 2 &&
          group.controls.every(
            (id, index) =>
              setupSection.controls[id]?.target === finalRowTargets[index],
          ),
      )
    ) {
      errors.push(
        "Runtime Setup must render Timeline left of Lock rotation in one two-column inline layoutGroup.",
      );
    }
  }

  for (const [sectionIndex, section] of sections.entries()) {
    const isRuntimeSetupSection =
      sectionIndex === 0 && section.title?.trim() === "Setup";

    for (const [controlId, control] of Object.entries(section.controls)) {
      if (
        !isRuntimeSetupControlTarget(control.target) ||
        isRuntimeSetupSection
      ) {
        continue;
      }

      const sectionLabel = getToolcraftSectionLabel(
        section.title,
        sectionIndex,
      );

      errors.push(
        `${sectionLabel} / ${controlId} uses runtime Setup target "${control.target}". Runtime Setup owns Save as Defaults, Infinity canvas, Aspect ratio, Canvas width, Canvas height, Resolution scale, Timeline, and Lock rotation; do not declare these controls in app-authored sections.`,
      );
    }
  }

  return errors;
}
