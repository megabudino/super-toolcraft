import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
} from "./acceptance/types";
import {
  grassScanLayerContracts,
  grassScanLayerKinds,
} from "./grass/grass-scan-contract";

const automatedTestName =
  "Megascans layers preserve deterministic counts and terrain placement";
const browserTestName =
  "Megascans field layers update visible PBR instances independently";

const layerControls = [
  ["enabled", "switch", "layer visibility"],
  ["count", "slider", "the exact visible instance count"],
  ["sizeRange", "rangeSlider", "minimum and maximum instance scale"],
  ["clumping", "slider", "uniform-to-clustered distribution"],
  ["seed", "slider", "the deterministic placement pattern"],
  ["surfaceOffset", "slider", "terrain contact height"],
] as const;

export const grassScanAcceptanceRows: readonly ToolcraftComponentAcceptance[] =
  grassScanLayerKinds.flatMap((kind) => {
    const contract = grassScanLayerContracts[kind];
    return layerControls.map(([suffix, componentType, observable]) => ({
      automated: true,
      automatedTestName,
      browser: true,
      browserTestName,
      componentType,
      ...(suffix === "sizeRange"
        ? {
            controlPartCoverage: [
              "rangeSlider.lower",
              "rangeSlider.upper",
            ] as const,
          }
        : {}),
      evidence: "product-output" as const,
      expectedObservable: `Changing ${contract.title} ${suffix} updates ${observable} without changing the other scan layers.`,
      fixture: `${contract.title} over the Uncut Grass surface with all scan families loaded.`,
      id: `grass.scan-${kind}-${suffix}`,
      kind: "control" as const,
      target: `scan.${kind}.${suffix}`,
      userAction: `Change ${suffix} in the ${contract.title} section.`,
      ...(suffix === "enabled"
        ? {}
        : { visibilityCoverage: ["hidden", "visible"] as const }),
    }));
  });

const boulderControls = [
  ["enabled", "switch", "zero-or-one hero-boulder visibility"],
  ["size", "slider", "the retained boulder silhouette and shadow scale"],
  ["seed", "slider", "the deterministic field position and yaw"],
  ["surfaceOffset", "slider", "terrain contact height"],
] as const;

export const grassBoulderAcceptanceRows: readonly ToolcraftComponentAcceptance[] =
  boulderControls.map(([suffix, componentType, observable]) => ({
    automated: true,
    automatedTestName,
    browser: true,
    browserTestName,
    componentType,
    evidence: "product-output" as const,
    expectedObservable: `Changing Tundra Boulder ${suffix} updates ${observable} without changing Small Rocks.`,
    fixture: "One Tundra Mossy Boulder over the Uncut Grass surface.",
    id: `grass.scan-boulder-${suffix}`,
    kind: "control" as const,
    target: `scan.boulder.${suffix}`,
    userAction: `Change ${suffix} in the Tundra Boulder section.`,
    ...(suffix === "enabled"
      ? {}
      : { visibilityCoverage: ["hidden", "visible"] as const }),
  }));

const scanColorLayerLabels = {
  boulder: "Tundra Boulder",
  rocks: "Small Rocks",
  tufted: "Tufted Grass",
  white: "White Flowers",
  wild: "Wild Grass",
  yellow: "Yellow Flowers",
} as const;

export const grassScannedColorAcceptanceRows: readonly ToolcraftComponentAcceptance[] =
  [
    {
      controls: [
        ["colorContrast", "color-contrast", "contrast", "slider"],
        ["colorSaturation", "color-saturation", "saturation", "slider"],
      ] as const,
      id: "surface",
      label: "Uncut Grass ground",
      target: "surface",
    },
    ...([...grassScanLayerKinds, "boulder"] as const).map((kind) => {
      return {
        controls: [
          ["pbrTint", "pbr-tint", "tint", "color"],
          ["pbrBrightness", "pbr-brightness", "brightness", "slider"],
          ["colorContrast", "color-contrast", "contrast", "slider"],
          ["colorSaturation", "color-saturation", "saturation", "slider"],
          ["pbrRoughness", "pbr-roughness", "roughness", "slider"],
          ["pbrNormalStrength", "pbr-normal", "normal strength", "slider"],
        ] as const,
        id: `scan-${kind}`,
        label: scanColorLayerLabels[kind],
        target: `scan.${kind}`,
      };
    }),
  ].flatMap(({ controls, id, label, target }) =>
    controls.map(([suffix, idSuffix, observable, componentType]) => ({
      automated: true,
      automatedTestName,
      browser: true,
      browserTestName,
      componentType,
      evidence: "rendered-pixels" as const,
      expectedObservable: `Changing ${label} ${observable} changes only that material's retained PBR response.`,
      fixture: `${label} lit by the retained scene HDRI over the generated terrain.`,
      id: `grass.${id}-${idSuffix}`,
      kind: "control" as const,
      target: `${target}.${suffix}`,
      userAction: `Change ${label} ${observable} from its reset value.`,
      visibilityCoverage: ["hidden", "visible"] as const,
    })),
  );

export const grassRockShadowColorAcceptanceRows: readonly ToolcraftComponentAcceptance[] =
  (["rocks", "boulder"] as const).map((kind) => {
    const label = scanColorLayerLabels[kind];
    return {
      automated: true,
      automatedTestName:
        "Rock shadow colors remain independent and use received shadow masks",
      browser: true,
      browserTestName: "Rock shadow colors tint only received rock shadows",
      componentType: "color",
      evidence: "rendered-pixels" as const,
      expectedObservable: `Changing ${label} received-shadow color tints only shadowed pixels of that rock layer.`,
      fixture: `${label} receiving cast shadows from the retained PBR field.`,
      id: `grass.scan-${kind}-shadow-color`,
      kind: "control" as const,
      target: `scan.${kind}.shadowColor`,
      userAction: `Choose a different Shadow color in the ${label} section.`,
      visibilityCoverage: ["hidden", "visible"] as const,
    };
  });

export const grassScanControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] =
  [
    ...grassScanLayerKinds.map((kind) => {
      const contract = grassScanLayerContracts[kind];
      return {
        entity: `${contract.title} Megascans layer`,
        groupingReason: `Visibility, exact count, placement, and complete authored PBR response describe one independently scattered and shaded ${contract.noun} family.`,
        targets: [
          `scan.${kind}.enabled`,
          `scan.${kind}.count`,
          `scan.${kind}.sizeRange`,
          `scan.${kind}.clumping`,
          `scan.${kind}.seed`,
          `scan.${kind}.surfaceOffset`,
          `scan.${kind}.pbrTint`,
          ...(kind === "rocks" ? ["scan.rocks.shadowColor"] : []),
          `scan.${kind}.pbrBrightness`,
          `scan.${kind}.colorContrast`,
          `scan.${kind}.colorSaturation`,
          `scan.${kind}.pbrRoughness`,
          `scan.${kind}.pbrNormalStrength`,
        ],
        title: contract.title,
        workflowStage: "Distribute",
      };
    }),
    {
      entity: "Tundra Mossy Boulder hero prop",
      groupingReason:
        "Visibility, placement, and complete authored PBR response fully describe one independently controlled large boulder.",
      targets: [
        "scan.boulder.enabled",
        "scan.boulder.size",
        "scan.boulder.seed",
        "scan.boulder.surfaceOffset",
        "scan.boulder.pbrTint",
        "scan.boulder.shadowColor",
        "scan.boulder.pbrBrightness",
        "scan.boulder.colorContrast",
        "scan.boulder.colorSaturation",
        "scan.boulder.pbrRoughness",
        "scan.boulder.pbrNormalStrength",
      ],
      title: "Tundra Boulder",
      workflowStage: "Distribute",
    },
  ];
