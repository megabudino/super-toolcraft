import type {
  ToolcraftComponentAcceptance,
  ToolcraftControlSectionInventoryEntry,
} from "./acceptance/types";

const automatedTestName =
  "Wind editor modes map to ambient gust and interactive simulation";
const browserTestName =
  "grass wind modes blend ambient sway gusts and smooth pointer simulation";

type WindAcceptanceControl = Readonly<{
  id: string;
  observable: string;
  target: string;
  visibleMode: "simulation" | "sway" | "wind";
}>;

const windControls: readonly WindAcceptanceControl[] = [
  {
    id: "grass.wind-direction",
    observable: "the authored fallback direction",
    target: "wind.directionAngle",
    visibleMode: "wind",
  },
  {
    id: "grass.sway-strength",
    observable: "idle bend amplitude",
    target: "wind.swayStrength",
    visibleMode: "sway",
  },
  {
    id: "grass.sway-cycles",
    observable: "idle waves per seamless loop",
    target: "wind.swayCycles",
    visibleMode: "sway",
  },
  {
    id: "grass.sway-variation",
    observable: "idle spatial phase variation",
    target: "wind.swayVariation",
    visibleMode: "sway",
  },
  {
    id: "grass.wind-strength",
    observable: "peak gust load",
    target: "wind.strength",
    visibleMode: "wind",
  },
  {
    id: "grass.wind-flow",
    observable: "sustained downwind pressure",
    target: "wind.flow",
    visibleMode: "wind",
  },
  {
    id: "grass.gust-cycles",
    observable: "travelling pressure fronts per loop",
    target: "wind.gustCycles",
    visibleMode: "wind",
  },
  {
    id: "grass.gust-width",
    observable: "gust pulse width",
    target: "wind.gustWidth",
    visibleMode: "wind",
  },
  {
    id: "grass.noise-strength",
    observable: "front and rebound variation",
    target: "wind.noiseStrength",
    visibleMode: "wind",
  },
  {
    id: "grass.noise-scale",
    observable: "spatial gust wavelength",
    target: "wind.noiseScale",
    visibleMode: "wind",
  },
  {
    id: "grass.noise-detail",
    observable: "crosswind eddies and tip flutter",
    target: "wind.noiseDetail",
    visibleMode: "wind",
  },
  {
    id: "grass.wind-seed",
    observable: "the deterministic pressure pattern",
    target: "wind.seed",
    visibleMode: "wind",
  },
  {
    id: "grass.wind-ramp-up",
    observable: "terrain-hover attack time",
    target: "wind.rampUp",
    visibleMode: "simulation",
  },
  {
    id: "grass.wind-release",
    observable: "terrain-leave release time",
    target: "wind.release",
    visibleMode: "simulation",
  },
  {
    id: "grass.wind-direction-response",
    observable: "shortest-arc pointer direction smoothing",
    target: "wind.directionResponse",
    visibleMode: "simulation",
  },
];

const surfaceTiltControls = [
  {
    id: "grass.surface-tilt-left",
    observable: "the maximum left-travel lean",
    target: "wind.surfaceTiltLeft",
  },
  {
    id: "grass.surface-tilt-right",
    observable: "the maximum right-travel lean",
    target: "wind.surfaceTiltRight",
  },
  {
    id: "grass.surface-tilt-up",
    observable: "the maximum upward-travel lean",
    target: "wind.surfaceTiltUp",
  },
  {
    id: "grass.surface-tilt-down",
    observable: "the maximum downward-travel lean",
    target: "wind.surfaceTiltDown",
  },
  {
    id: "grass.surface-tilt-smoothing",
    observable: "the complete surface follow and neutral-return response",
    target: "wind.surfaceTiltSmoothing",
  },
] as const;

export const grassWindAcceptanceRows: readonly ToolcraftComponentAcceptance[] =
  [
    {
      automated: true,
      automatedTestName,
      browser: true,
      browserTestName,
      componentType: "segmented",
      evidence: "product-output",
      expectedObservable:
        "Static freezes every flexible layer; Sway shows only gentle ambient movement; Wind exposes the full travelling gust; Simulation keeps ambient movement outside the terrain and smoothly ramps pointer-directed wind in and out over terrain hits.",
      fixture:
        "The same complete Tall Grass, Lawn, scanned grass, and flower field rendered through Static, Sway, Wind, and Simulation with pointer enter, travel, direction reversal, and leave.",
      id: "grass.wind-mode",
      kind: "control",
      optionCoverage: ["static", "sway", "wind", "simulation"],
      target: "wind.mode",
      userAction:
        "Choose all four modes, play and pause the timeline, then move the pointer across and outside the terrain.",
    },
    {
      automated: true,
      automatedTestName: "Touch input owns one terrain gesture until release",
      browser: true,
      browserTestName: "mobile touch drag drives terrain wind and surface tilt",
      componentType: "touch-gesture",
      evidence: "product-output",
      expectedObservable:
        "A primary touch that starts on visible Terrain owns the gesture, drives the same projected wind direction and complete-surface tilt as mouse movement, keeps receiving drag events through pointer capture, and clears into the existing smooth release on touch end or cancel; a touch starting outside Terrain remains available to canvas navigation.",
      fixture:
        "A paused touch-enabled Simulation preview with a deterministic Terrain press, horizontal drag, release, and an unchanged authored view orientation.",
      id: "grass.touch-terrain-interaction",
      kind: "runtime",
      userAction:
        "Choose Simulate, press visible Terrain with one finger, drag across it, and release.",
    },
    {
      automated: true,
      automatedTestName: "Hover wind audio follows Simulation terrain presence",
      browser: true,
      browserTestName: "simulation terrain hover plays and fades wind audio",
      componentType: "audio",
      evidence: "command-side-effect",
      expectedObservable:
        "A Terrain hit in Simulation starts the supplied looping wind recording, while Terrain leave or another wind mode fades and pauses it without restarting its playback position.",
      fixture:
        "A terrain-only Simulation preview with deterministic browser media playback and hover/leave points.",
      id: "grass.wind-audio",
      kind: "runtime",
      userAction:
        "Choose Simulate, move the pointer onto Terrain, leave Terrain, then repeat the hover in Wind mode.",
    },
    {
      automated: true,
      automatedTestName:
        "Wind audio volume maps persisted percent to retained gain",
      browser: true,
      browserTestName: "simulation terrain hover plays and fades wind audio",
      componentType: "slider",
      evidence: "persistence-state",
      expectedObservable:
        "The authored Volume percentage survives a real browser reload and remains available only in Simulation.",
      fixture:
        "A Simulation session that changes Volume through the real slider and reloads the app.",
      id: "grass.wind-audio-volume",
      kind: "control",
      persistenceCoverage: "reload",
      target: "wind.audioVolume",
      userAction:
        "Choose Simulate, change Volume through the real slider, and reload the app.",
      visibilityCoverage: ["hidden", "visible"],
    },
    {
      automated: true,
      automatedTestName:
        "Wind audio volume maps persisted percent to retained gain",
      browser: true,
      browserTestName: "simulation terrain hover plays and fades wind audio",
      componentType: "audio",
      evidence: "command-side-effect",
      expectedObservable:
        "Changing Volume updates the retained hover-audio gain without restarting the recording or invalidating WebGL; 0% pauses it and raising it during the same hover resumes it.",
      fixture:
        "An active Simulation Terrain hover compared at 60%, 0%, and 25% wind-audio volume.",
      id: "grass.wind-audio-volume-effect",
      kind: "runtime",
      userAction:
        "Keep the pointer over Terrain and change Volume through the focused slider.",
    },
    ...surfaceTiltControls.map(({ id, observable, target }) => ({
      automated: true,
      automatedTestName:
        "Surface tilt maps screen travel through four amplitudes and one global smoothing",
      browser: true,
      browserTestName:
        "simulation pointer movement tilts and settles the complete surface",
      componentType: "slider" as const,
      evidence: "product-output" as const,
      expectedObservable: `Changing this control updates ${observable} through 20° on the retained surface-root transform without changing authored view orientation.`,
      fixture:
        "A paused terrain-only Simulation preview with deterministic horizontal and vertical screen-pointer travel.",
      id,
      kind: "control" as const,
      target,
      userAction: `Choose Simulate, change ${target}, and move the pointer across Terrain.`,
      visibilityCoverage: ["hidden", "visible"] as const,
    })),
    {
      automated: true,
      automatedTestName:
        "Surface tilt maps screen travel through four amplitudes and one global smoothing",
      browser: true,
      browserTestName:
        "simulation pointer movement tilts and settles the complete surface",
      componentType: "scene-transform",
      evidence: "command-side-effect",
      expectedObservable:
        "Screen-pointer travel over Terrain produces axis-isolated direction-matched X/Z rotation of the complete surface, then global tilt smoothing returns it exactly to neutral without changing authored view orientation.",
      fixture:
        "A paused terrain-only Simulation preview with deterministic horizontal and depth pointer travel, stop, leave, and mode exit.",
      id: "grass.surface-tilt",
      kind: "runtime",
      userAction:
        "Move across Terrain in Simulate, stop, leave Terrain, and switch to another wind mode.",
    },
    ...windControls.map(({ id, observable, target, visibleMode }) => ({
      automated: true,
      automatedTestName,
      browser: true,
      browserTestName,
      componentType: "slider" as const,
      evidence: "product-output" as const,
      expectedObservable: `Changing this control updates ${observable} across every flexible vegetation layer without changing geometry density or material quality.`,
      fixture: `The ${visibleMode} mode compared at separated ${target} values, with the control hidden in an inactive mode.`,
      id,
      kind: "control" as const,
      target,
      userAction: `Choose ${visibleMode} and change ${target} through the real slider.`,
      visibilityCoverage: ["hidden", "visible"] as const,
    })),
  ];

export const grassWindControlSectionInventory = [
  {
    entity: "Wind editor state and authored fallback direction",
    groupingReason:
      "The four-state selector chooses the current wind workflow while Direction supplies the stable non-pointer and export heading.",
    targets: ["wind.mode", "wind.directionAngle"],
    title: "Wind Mode",
    workflowStage: "Animate",
  },
  {
    entity: "Ambient vegetation sway",
    groupingReason:
      "Strength, tempo, and spatial variation define the gentle motion used by Sway and the no-hover part of Simulation.",
    targets: ["wind.swayStrength", "wind.swayCycles", "wind.swayVariation"],
    title: "Ambient Sway",
    workflowStage: "Animate",
  },
  {
    entity: "Travelling gust pressure and heterogeneity",
    groupingReason:
      "Pressure, pulse shape, spatial turbulence, and seed define one coherent full-field gust shared by all flexible vegetation.",
    targets: [
      "wind.strength",
      "wind.flow",
      "wind.gustCycles",
      "wind.gustWidth",
      "wind.noiseStrength",
      "wind.noiseScale",
      "wind.noiseDetail",
      "wind.seed",
    ],
    title: "Gust Dynamics",
    workflowStage: "Animate",
  },
  {
    entity: "Interactive wind and audio transition",
    groupingReason:
      "Attack, release, terrain-direction response, and audio loudness define how transient terrain hover blends the authored ambient, gust, and sound states.",
    targets: [
      "wind.rampUp",
      "wind.release",
      "wind.directionResponse",
      "wind.audioVolume",
    ],
    title: "Simulation",
    workflowStage: "Animate",
  },
  {
    entity: "Pointer-driven complete-surface lean",
    groupingReason:
      "Four asymmetric screen-travel limits and one shared smoothing duration define the transient retained surface-root response.",
    targets: [
      "wind.surfaceTiltLeft",
      "wind.surfaceTiltRight",
      "wind.surfaceTiltUp",
      "wind.surfaceTiltDown",
      "wind.surfaceTiltSmoothing",
    ],
    title: "Surface Tilt",
    workflowStage: "Animate",
  },
] as const satisfies readonly ToolcraftControlSectionInventoryEntry[];
