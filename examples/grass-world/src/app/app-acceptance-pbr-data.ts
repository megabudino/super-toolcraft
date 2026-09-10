import type { ToolcraftComponentAcceptance } from "./acceptance/types";

function controlAcceptance(
  entry: Omit<ToolcraftComponentAcceptance, "automated" | "browser" | "kind">,
): ToolcraftComponentAcceptance {
  return { ...entry, automated: true, browser: true, kind: "control" };
}

export const grassPbrAcceptanceRows = [
  controlAcceptance({
    automatedTestName:
      "grass PBR parameters map to the physical blade material",
    browserTestName: "scene-wide HDRI and always-PBR materials render lighting",
    componentType: "slider",
    evidence: "rendered-pixels",
    expectedObservable:
      "Changing this control updates highlight softness in the environment-lit grass.",
    fixture:
      "Live PBR grass compared at separated appearance.pbrRoughness values.",
    id: "grass.pbr-roughness",
    target: "appearance.pbrRoughness",
    userAction: "Drag appearance.pbrRoughness in the always-PBR live preview.",
  }),
  controlAcceptance({
    automatedTestName:
      "grass HDRI presets map every environment to retained lighting",
    browserTestName: "scene-wide HDRI and always-PBR materials render lighting",
    componentType: "imagePicker",
    evidence: "rendered-pixels",
    expectedObservable:
      "All eight bundled environments produce distinct scene lighting and background pixels across procedural grass, terrain, and scan materials.",
    fixture: "The same field sampled under every bundled environment.",
    id: "grass.hdri-preset",
    optionCoverage: [
      "meadow",
      "alps",
      "sunrise",
      "hardSun",
      "overcast",
      "forest",
      "golden",
      "blendSunset",
    ],
    target: "environment.preset",
    userAction: "Select every Scene HDRI tile in the live PBR preview.",
  }),
  controlAcceptance({
    automatedTestName:
      "grass custom HDRI source overrides and restores the preset",
    browserTestName: "grass custom HDRI upload clear reset and persistence",
    componentType: "fileDrop",
    evidence: "media-lifecycle",
    expectedObservable:
      "Uploading a valid Radiance HDR replaces preset lighting in preview and export; remove and Reset restore the selected preset, and the custom file can persist through reload.",
    fixture: "A compact Radiance HDR attached over the Meadow preset.",
    id: "grass.hdri-file",
    mediaLifecycleCoverage: ["upload", "remove", "reset"],
    target: "environment.hdriFile",
    userAction:
      "Upload a custom HDRI, remove it, upload again, reset, and reload.",
  }),
  ...(
    [
      [
        "grass.hdri-intensity",
        "environment.intensity",
        "environment light intensity",
        "slider",
      ],
      [
        "grass.hdri-rotation-x",
        "environment.rotationX",
        "environment X tilt",
        "slider",
      ],
      [
        "grass.hdri-rotation",
        "environment.rotation",
        "environment Y direction",
        "slider",
      ],
      [
        "grass.hdri-rotation-z",
        "environment.rotationZ",
        "environment Z roll",
        "slider",
      ],
      [
        "grass.hdri-background",
        "environment.visible",
        "visible HDRI",
        "switch",
      ],
      [
        "grass.hdri-blur",
        "environment.backgroundBlur",
        "backdrop blur",
        "slider",
      ],
    ] as const
  ).map(([id, target, observable, componentType]) =>
    controlAcceptance({
      automatedTestName: "grass HDRI settings map to the entire scene output",
      browserTestName:
        "scene-wide HDRI and always-PBR materials render lighting",
      componentType,
      evidence: "rendered-pixels",
      expectedObservable: `Changing this control updates ${observable} while the retained HDRI continues to light the field.`,
      fixture: `The complete scene with Include enabled and separated ${target} values.`,
      id,
      target,
      userAction: `Change ${target} and compare every visible scene material.`,
      ...(target === "environment.backgroundBlur"
        ? { visibilityCoverage: ["hidden", "visible"] as const }
        : {}),
    }),
  ),
  ...(
    [
      ["grass.key-color", "environment.keyColor", "warm sun color", "color"],
      [
        "grass.key-strength",
        "environment.keyStrength",
        "direct sun energy",
        "slider",
      ],
      [
        "grass.fill-strength",
        "environment.fillStrength",
        "shadow readability",
        "slider",
      ],
      [
        "grass.fill-color",
        "environment.fillColor",
        "cool shadow-fill color",
        "color",
      ],
      ["grass.rim-color", "environment.rimColor", "edge-light color", "color"],
      [
        "grass.rim-strength",
        "environment.rimStrength",
        "silhouette separation",
        "slider",
      ],
      [
        "grass.scene-exposure",
        "environment.exposure",
        "final ACES exposure",
        "slider",
      ],
    ] as const
  ).map(([id, target, observable, componentType]) =>
    controlAcceptance({
      automatedTestName: "grass HDRI settings map to the entire scene output",
      browserTestName:
        id === "grass.scene-exposure"
          ? "grass Exposure changes the paused field lighting"
          : "scene-wide HDRI and always-PBR materials render lighting",
      componentType,
      evidence: "rendered-pixels",
      expectedObservable: `Changing this control updates ${observable} across the retained scene and export renderer.`,
      fixture:
        "The complete paused reference field under the retained Meadow environment.",
      id,
      target,
      userAction: `Change ${target} and compare lit, shaded, and rim-facing materials.`,
    }),
  ),
  ...(
    [
      [
        "grass.scene-contrast",
        "environment.sceneContrast",
        "post-light S-curve contrast",
      ],
      [
        "grass.scene-saturation",
        "environment.sceneSaturation",
        "final scene saturation",
      ],
      [
        "grass.highlight-warmth",
        "environment.highlightWarmth",
        "warm highlight separation",
      ],
      [
        "grass.shadow-coolness",
        "environment.shadowCoolness",
        "cool shadow separation",
      ],
    ] as const
  ).map(([id, target, observable]) =>
    controlAcceptance({
      automatedTestName: "grass final color grade maps to the lit scene output",
      browserTestName:
        "scene-wide HDRI and always-PBR materials render lighting",
      componentType: "slider",
      evidence: "rendered-pixels",
      expectedObservable: `Changing this control updates ${observable} after lighting across every retained field material and export frame.`,
      fixture:
        "The complete paused reference field with unchanged counts, seeds, and placement.",
      id,
      target,
      userAction: `Change ${target} and compare the same lit and shaded regions.`,
    }),
  ),
  controlAcceptance({
    automatedTestName:
      "grass sun patches map controls to world-space light mask",
    browserTestName: "sun patches move broad light and shadow across the field",
    componentType: "switch",
    evidence: "rendered-pixels",
    expectedObservable:
      "Include switches the shared world-space sun and shade pattern across ground, grass, moss, rocks, and scanned plants.",
    fixture: "The complete paused field under the Meadow environment.",
    id: "grass.sun-patches-enabled",
    target: "environment.sunPatchEnabled",
    userAction: "Toggle Sun Patches Include.",
  }),
  ...(
    [
      [
        "grass.sun-patch-scale",
        "environment.sunPatchScale",
        "world-space region size",
      ],
      [
        "grass.sun-patch-coverage",
        "environment.sunPatchCoverage",
        "sun-to-shade field balance",
      ],
      [
        "grass.sun-patch-softness",
        "environment.sunPatchSoftness",
        "sun and shade transition width",
      ],
      [
        "grass.sun-patch-strength",
        "environment.sunPatchStrength",
        "direct and indirect light-to-shadow contrast up to the dramatic 200% range",
      ],
      [
        "grass.sun-patch-seed",
        "environment.sunPatchSeed",
        "deterministic patch arrangement",
      ],
    ] as const
  ).map(([id, target, observable]) =>
    controlAcceptance({
      automatedTestName:
        "grass sun patches map controls to world-space light mask",
      browserTestName:
        "sun patches move broad light and shadow across the field",
      componentType: "slider",
      evidence: "rendered-pixels",
      expectedObservable: `Changing this control updates ${observable} on every visible field material.`,
      fixture: `The complete paused field compared at separated ${target} values.`,
      id,
      target,
      userAction: `Enable Sun Patches and drag ${target}.`,
      visibilityCoverage: ["hidden", "visible"],
    }),
  ),
  controlAcceptance({
    automatedTestName:
      "grass sun patches map controls to world-space light mask",
    browserTestName: "sun patches move broad light and shadow across the field",
    componentType: "vector",
    controlPartCoverage: ["vector.x", "vector.y"],
    evidence: "rendered-pixels",
    expectedObservable:
      "Moving either Offset axis translates the same stable sun and shade pattern across world X/Z and therefore across all field materials.",
    fixture:
      "The complete paused field with a fixed Scale, Coverage, and Seed.",
    id: "grass.sun-patch-offset",
    target: "environment.sunPatchOffset",
    userAction: "Drag the Offset pad independently along X and Y.",
    visibilityCoverage: ["hidden", "visible"],
  }),
] satisfies readonly ToolcraftComponentAcceptance[];
