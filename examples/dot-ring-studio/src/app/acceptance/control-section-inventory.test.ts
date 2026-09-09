import { defineToolcraft } from "@/toolcraft/runtime";
import { describe, expect, it } from "vitest";

import { getToolcraftControlSectionInventoryErrors } from "./control-section-inventory";
import type { ToolcraftControlSectionInventoryEntry } from "./types";

const opacityControl = {
  defaultValue: 75,
  max: 100,
  min: 0,
  target: "appearance.opacity",
  type: "slider",
} as const;

function createSchema({
  id = "appearance",
  title = "Appearance",
}: {
  id?: string;
  title?: string;
} = {}) {
  return defineToolcraft({
    canvas: { enabled: true },
    panels: {
      controls: {
        sections: [
          {
            controls: {
              opacity: opacityControl,
            },
            id,
            title,
          },
        ],
        title: "Controls",
      },
    },
  });
}

const inventoryEntry = {
  entity: "Appearance",
  groupingReason: "These controls define the visible appearance of the output.",
  id: "appearance",
  targets: ["appearance.opacity"],
  title: "Original title",
} as const;

describe("Toolcraft Control Section Inventory identity", () => {
  it("matches inventory by id when a section title is renamed", () => {
    expect(
      getToolcraftControlSectionInventoryErrors(
        createSchema({ title: "Renamed appearance" }),
        [inventoryEntry],
      ),
    ).toEqual([]);
  });

  it("rejects an inventory id that does not match the schema section", () => {
    const errors = getToolcraftControlSectionInventoryErrors(createSchema(), [
      { ...inventoryEntry, id: "different-section" },
    ]);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/different-section.*no rendered product controls section/iu),
        expect.stringMatching(/missing product section.*appearance/iu),
      ]),
    );
  });

  it("rejects duplicate inventory ids", () => {
    const errors = getToolcraftControlSectionInventoryErrors(createSchema(), [
      inventoryEntry,
      { ...inventoryEntry, title: "Duplicate title" },
    ]);

    expect(errors).toContain(
      'Control Section Inventory repeats id "appearance" 2 times. Section inventory IDs must be unique.',
    );
  });

  it.each([
    ["missing", undefined],
    ["non-string", 42],
  ])(
    "reports a clear diagnostic for a %s inventory id",
    (_label, id) => {
      const malformedInventory = [
        { ...inventoryEntry, id },
      ] as unknown as readonly ToolcraftControlSectionInventoryEntry[];

      expect(() =>
        getToolcraftControlSectionInventoryErrors(
          createSchema(),
          malformedInventory,
        ),
      ).not.toThrow();
      expect(
        getToolcraftControlSectionInventoryErrors(
          createSchema(),
          malformedInventory,
        ),
      ).toContain(
        "Control Section Inventory contains an entry without a non-empty string stable section id.",
      );
    },
  );

  it("rejects legacy-derived schema ids for generated product readiness", () => {
    const legacySchema = defineToolcraft({
      canvas: { enabled: true },
      panels: {
        controls: {
          sections: [
            {
              controls: {
                opacity: opacityControl,
              },
              title: "Appearance",
            },
          ],
          title: "Controls",
        },
      },
    });

    expect(
      getToolcraftControlSectionInventoryErrors(legacySchema, [inventoryEntry]),
    ).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/must declare an explicit stable id/iu),
      ]),
    );
  });
});
