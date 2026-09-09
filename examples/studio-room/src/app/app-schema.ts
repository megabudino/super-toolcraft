import { defineToolcraft } from "@/toolcraft/runtime";

import { appIdentity } from "./app-identity";
import { studioRoomDefaultAssets } from "./studio-room-default-assets";
import { STUDIO_ROOM_DEFAULTS, STUDIO_ROOM_WALL_FILL_REVISION_TARGET, studioRoomTargets } from "./studio-room-values";

const responsive = {
  performanceReason:
    "The website-owned Studio Room preview must update live while this value changes.",
  performanceRole: "responsiveness" as const,
};
const workload = {
  performanceReason:
    "This value changes the amount of room geometry or media processed by the preview.",
  performanceRole: "workload" as const,
};
const whenMotion = {
  all: [{ equals: true, target: studioRoomTargets.motionEnabled }],
  mode: "conditional" as const,
} satisfies Applicability;
const whenFineGrid = {
  all: [{ equals: true, target: studioRoomTargets.fineGridEnabled }],
  mode: "conditional" as const,
} satisfies Applicability;
const whenInnerGrid = {
  all: [{ equals: true, target: studioRoomTargets.roomInnerGridEnabled }],
  mode: "conditional" as const,
} satisfies Applicability;
const whenTrail = {
  all: [
    { equals: true, target: studioRoomTargets.motionEnabled },
    { equals: true, target: studioRoomTargets.trailEnabled },
  ],
  mode: "conditional" as const,
} satisfies Applicability;

export const appSchema = defineToolcraft({
  media: { defaultAssets: studioRoomDefaultAssets },
  persistence: {
    storage: "localStorage",
    key: "toolcraft:studio-room:state:v2",
    version: 2,
    include: [],
    additionalValueTargets: [STUDIO_ROOM_WALL_FILL_REVISION_TARGET],
  },
  canvas: {
    enabled: true,
    size: { height: 1080, unit: "px", width: 1920 },
    sizing: { mode: "editable-output" },
  },
  identity: appIdentity,
  panels: {
    controls: {
      sections: [
        {
          controls: {
            depth: {
              ...slider(
                "Depth",
                studioRoomTargets.roomDepth,
                STUDIO_ROOM_DEFAULTS.room.depth,
                0,
                1,
                0.01,
              ),
              orderRole: "primary",
            },
            vanishing: {
              ...responsive,
              applicability: { mode: "always" },
              coordinateMode: "screen",
              defaultValue: STUDIO_ROOM_DEFAULTS.room.vanishing,
              description: "Offsets the vanishing point while all room surfaces stay aligned.",
              label: "Vanishing point",
              target: studioRoomTargets.roomVanishing,
              type: "vector",
            },
            wallFill: color(
              "Wall fill",
              studioRoomTargets.roomWallFill,
              STUDIO_ROOM_DEFAULTS.room.wallFill,
            ),
            borderColor: {
              ...responsive,
              applicability: { mode: "always" },
              defaultValue: STUDIO_ROOM_DEFAULTS.room.wallBorder.colorOpacity,
              label: "Border color",
              orderRole: "color",
              target: studioRoomTargets.roomWallBorderColorOpacity,
              type: "colorOpacity",
            },
            borderWidth: {
              ...slider(
                "Border width",
                studioRoomTargets.roomWallBorderWidth,
                STUDIO_ROOM_DEFAULTS.room.wallBorder.width,
                0,
                12,
                0.5,
                "px",
              ),
              orderRole: "strength",
            },
          },
          id: "room",
          layout: "standalone",
          title: "Room",
        },
        {
          controls: {
            enabled: {
              ...switchControl(
                "Active",
                studioRoomTargets.roomInnerGridEnabled,
                STUDIO_ROOM_DEFAULTS.room.innerGrid.enabled,
              ),
              description:
                "Inherits the Main Grid color, thickness, columns, and rows inside the panel; the Fine Grid is not continued.",
              orderRole: "mode",
            },
            depth: {
              ...slider(
                "Depth",
                studioRoomTargets.roomInnerGridDepth,
                STUDIO_ROOM_DEFAULTS.room.innerGrid.depth,
                5,
                60,
                1,
                "%",
                whenInnerGrid,
              ),
              description:
                "Measures the continuation's reach inward from the panel edges as a percentage of the panel's smaller side.",
              orderRole: "strength",
            },
            falloff: {
              ...slider(
                "Falloff",
                studioRoomTargets.roomInnerGridFalloff,
                STUDIO_ROOM_DEFAULTS.room.innerGrid.falloff,
                0.5,
                4,
                0.1,
                undefined,
                whenInnerGrid,
              ),
              description:
                "Shapes how the inherited Main Grid continuation softens from all four panel edges.",
              orderRole: "strength",
            },
            opacity: {
              ...slider(
                "Opacity",
                studioRoomTargets.roomInnerGridOpacity,
                STUDIO_ROOM_DEFAULTS.room.innerGrid.opacity,
                0,
                100,
                1,
                "%",
                whenInnerGrid,
              ),
              description:
                "Dims only the inherited Main Grid continuation layer without affecting either outer grid.",
              orderRole: "strength",
            },
          },
          id: "inner-grid",
          layout: "standalone",
          title: "Inner Grid",
        },
        {
          controls: {
            firstRowScale: slider(
              "First row scale",
              studioRoomTargets.compositionFirstRowScale,
              STUDIO_ROOM_DEFAULTS.composition.firstRowScale,
              50,
              150,
              1,
              "%",
            ),
            secondRowScale: slider(
              "Second row scale",
              studioRoomTargets.compositionSecondRowScale,
              STUDIO_ROOM_DEFAULTS.composition.secondRowScale,
              50,
              150,
              1,
              "%",
            ),
            lineGap: slider(
              "Line gap",
              studioRoomTargets.compositionLineGap,
              STUDIO_ROOM_DEFAULTS.composition.lineGap,
              -40,
              80,
              1,
              "px",
            ),
            buttonGap: slider(
              "Button gap",
              studioRoomTargets.compositionButtonGap,
              STUDIO_ROOM_DEFAULTS.composition.buttonGap,
              0,
              160,
              1,
              "px",
            ),
          },
          id: "center-composition",
          title: "Center Composition",
        },
        {
          controls: {
            columns: discreteSlider("Columns", studioRoomTargets.gridColumns, 8, 4, 16, "cols"),
            rows: discreteSlider("Rows", studioRoomTargets.gridRows, 4, 2, 8, "rows"),
            depthDivisions: discreteSlider(
              "Depth divisions",
              studioRoomTargets.gridDepthDivisions,
              4,
              2,
              8,
            ),
            color: color("Color", studioRoomTargets.gridColor, STUDIO_ROOM_DEFAULTS.grid.color),
            opacity: slider("Opacity", studioRoomTargets.gridOpacity, 34, 0, 100, 1, "%"),
            thickness: slider("Thickness", studioRoomTargets.gridThickness, 1.3, 0.5, 4, 0.1, "px"),
          },
          id: "main-grid",
          title: "Main Grid",
        },
        {
          controls: {
            enabled: switchControl("Visible", studioRoomTargets.fineGridEnabled, true),
            subdivision: discreteSlider(
              "Subdivision",
              studioRoomTargets.fineGridSubdivision,
              3,
              2,
              6,
              undefined,
              whenFineGrid,
            ),
            color: color(
              "Color",
              studioRoomTargets.fineGridColor,
              STUDIO_ROOM_DEFAULTS.fineGrid.color,
              whenFineGrid,
            ),
            opacity: slider(
              "Opacity",
              studioRoomTargets.fineGridOpacity,
              12,
              0,
              100,
              1,
              "%",
              whenFineGrid,
            ),
            thickness: slider(
              "Thickness",
              studioRoomTargets.fineGridThickness,
              0.5,
              0.5,
              2,
              0.1,
              "px",
              whenFineGrid,
            ),
          },
          id: "fine-grid",
          title: "Fine Grid",
        },
        {
          controls: {
            perSurface: {
              ...discreteSlider("Per surface", studioRoomTargets.tilesPerSurface, 2, 1, 6),
              description:
                "Tiles never share edges, so high densities may place fewer when the grid is small.",
            },
            interval: slider(
              "Interval",
              studioRoomTargets.tilesInterval,
              1.4,
              0.4,
              5,
              0.1,
              "s",
              whenMotion,
            ),
            shuffleStyle: {
              ...responsive,
              applicability: whenMotion,
              defaultValue: STUDIO_ROOM_DEFAULTS.tiles.shuffleStyle,
              label: "Shuffle style",
              options: [
                { label: "Swap", value: "swap" },
                { label: "Slide", value: "slide" },
              ],
              target: studioRoomTargets.tilesShuffleStyle,
              type: "segmented",
            },
            develop: slider(
              "Develop",
              studioRoomTargets.tilesDevelop,
              0.25,
              0,
              1,
              0.01,
              undefined,
              whenMotion,
            ),
            hoverLift: slider(
              "Hover lift",
              studioRoomTargets.tilesHoverLift,
              0.25,
              0,
              1,
              0.01,
              undefined,
              whenMotion,
            ),
            fog: slider("Fog", studioRoomTargets.tilesFog, 0, 0, 1, 0.01),
          },
          id: "tiles",
          title: "Tiles",
        },
        {
          controls: {
            images: {
              ...workload,
              applicability: { mode: "always" },
              assetKind: "image",
              label: "Images",
              multiple: true,
              target: studioRoomTargets.tilesImages,
              type: "fileDrop",
            },
          },
          id: "tile-images",
          title: "Tile Images",
        },
        {
          controls: {
            enabled: switchControl("Active", studioRoomTargets.motionEnabled, true),
            parallax: slider(
              "Parallax",
              studioRoomTargets.motionParallax,
              100,
              0,
              150,
              1,
              "%",
              whenMotion,
            ),
            smoothness: slider(
              "Smoothness",
              studioRoomTargets.motionSmoothness,
              0.5,
              0,
              1,
              0.01,
              undefined,
              whenMotion,
            ),
            scrollNudge: slider(
              "Scroll nudge",
              studioRoomTargets.motionScrollNudge,
              0.35,
              0,
              1,
              0.01,
              undefined,
              whenMotion,
            ),
          },
          id: "motion",
          title: "Motion",
        },
        {
          controls: {
            enabled: switchControl("Active", studioRoomTargets.trailEnabled, true, whenMotion),
            amount: discreteSlider(
              "Amount",
              studioRoomTargets.trailAmount,
              2,
              1,
              3,
              undefined,
              whenTrail,
            ),
            strength: slider(
              "Strength",
              studioRoomTargets.trailStrength,
              40,
              0,
              100,
              1,
              "%",
              whenTrail,
            ),
            fade: slider("Fade", studioRoomTargets.trailFade, 0.7, 0.2, 2, 0.1, "s", whenTrail),
          },
          id: "depth-trail",
          title: "Depth Trail",
        },
      ],
      title: "Controls",
    },
  },
  toolbar: { history: true, radar: true, zoom: true },
});

type Applicability =
  | Readonly<{ mode: "always" }>
  | Readonly<{ all: readonly Readonly<{ equals: true; target: string }>[]; mode: "conditional" }>;

function slider(
  label: string,
  target: string,
  defaultValue: number,
  min: number,
  max: number,
  step: number,
  unit?: string,
  applicability: Applicability = { mode: "always" },
) {
  return {
    ...responsive,
    applicability,
    defaultValue,
    label,
    max,
    min,
    sliderValueKind: "continuous" as const,
    step,
    target,
    type: "slider" as const,
    ...(unit ? { unit } : {}),
    variant: "continuous" as const,
  };
}

function discreteSlider(
  label: string,
  target: string,
  defaultValue: number,
  min: number,
  max: number,
  unit?: string,
  applicability: Applicability = { mode: "always" },
) {
  return {
    ...workload,
    applicability,
    defaultValue,
    label,
    max,
    min,
    sliderValueKind: "discrete" as const,
    step: 1,
    target,
    type: "slider" as const,
    ...(unit ? { unit } : {}),
    variant: "discrete" as const,
  };
}

function color(
  label: string,
  target: string,
  defaultValue: string,
  applicability: Applicability = { mode: "always" },
) {
  return { ...responsive, applicability, defaultValue, label, target, type: "color" as const };
}

function switchControl(
  label: string,
  target: string,
  defaultValue: boolean,
  applicability: Applicability = { mode: "always" },
) {
  return { ...responsive, applicability, defaultValue, label, target, type: "switch" as const };
}
