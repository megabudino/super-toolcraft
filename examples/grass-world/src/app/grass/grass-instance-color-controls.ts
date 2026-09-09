import type { ToolcraftControlSectionSchema } from "@/toolcraft/runtime";

import { grassResponsive, grassSlider } from "./grass-control-builders";
import { grassDefaults } from "./grass-defaults";

type InstanceColorOwner = "appearance" | "lawn";

function createInstanceColorSection(
  owner: InstanceColorOwner,
  title: string,
  visibleWhen: Readonly<{ equals: true; target: "grass.enabled" | "lawn.enabled" }>,
): ToolcraftControlSectionSchema {
  const noun = owner === "appearance" ? "Tall Grass" : "Lawn Cover";
  const controls = Object.fromEntries(
    [1, 2, 3].flatMap((index) => {
      const colorTarget = `${owner}.instanceColor${index}` as keyof typeof grassDefaults;
      const weightTarget = `${owner}.instanceColorWeight${index}` as keyof typeof grassDefaults;
      return [
        [
          `color${index}`,
          {
            defaultValue: grassDefaults[colorTarget],
            label: false,
            orderRole: "color",
            ...grassResponsive(
              `Updates one retained ${noun} instance-palette uniform.`,
            ),
            target: colorTarget,
            type: "color",
          },
        ],
        [
          `weight${index}`,
          grassSlider({
            defaultValue: grassDefaults[weightTarget] as number,
            description: `Sets the relative share of ${noun} instances assigned to Color ${index}; zero excludes it.`,
            label: `Color ${index} presence`,
            max: 100,
            min: 0,
            performanceReason:
              "Updates one fixed-size categorical distribution uniform without rebuilding instances.",
            step: 1,
            target: weightTarget,
            unit: "%",
          }),
        ],
      ];
    }),
  );
  return {
    controls,
    title,
    visibleWhen,
  } as ToolcraftControlSectionSchema;
}

export const grassTallInstanceColorSection = createInstanceColorSection(
  "appearance",
  "Tall Grass Instance Colors",
  { equals: true, target: "grass.enabled" },
);

export const grassLawnInstanceColorSection = createInstanceColorSection(
  "lawn",
  "Lawn Instance Colors",
  { equals: true, target: "lawn.enabled" },
);
