import type { ResolvedToolcraftAppSchema } from "@/toolcraft/runtime";

import {
  isLegacyToolcraftControlSectionId,
  isToolcraftProductSectionControl,
} from "./controls";
import { getToolcraftSectionLabel } from "./sections";
import type { ToolcraftControlSectionInventoryEntry } from "./types";

function getToolcraftControlSectionInventoryEntryId(
  entry: ToolcraftControlSectionInventoryEntry,
): string | null {
  const id = (entry as { id?: unknown }).id;

  if (typeof id !== "string") {
    return null;
  }

  const trimmedId = id.trim();
  return trimmedId || null;
}

export function getToolcraftSectionInventoryById(
  sectionInventory: readonly ToolcraftControlSectionInventoryEntry[],
): Map<string, ToolcraftControlSectionInventoryEntry> {
  const entries: [string, ToolcraftControlSectionInventoryEntry][] = [];

  for (const entry of sectionInventory) {
    const id = getToolcraftControlSectionInventoryEntryId(entry);

    if (id) {
      entries.push([id, entry]);
    }
  }

  return new Map(entries);
}

export function hasToolcraftInventorySplitEvidence({
  sectionInventoryById,
  sections,
}: {
  sectionInventoryById: ReadonlyMap<string, ToolcraftControlSectionInventoryEntry>;
  sections: ReadonlySet<string>;
}): boolean {
  const entries = [...sections].map((sectionId) =>
    sectionInventoryById.get(sectionId),
  );

  return (
    entries.length === sections.size &&
    entries.every(
      (entry) =>
        entry &&
        (entry.workflowStage?.trim().length ?? 0) > 0 &&
        (entry.splitReason?.trim().length ?? 0) >= 12,
    )
  );
}

export function getToolcraftControlSectionInventoryErrors(
  schema: ResolvedToolcraftAppSchema,
  sectionInventory: readonly ToolcraftControlSectionInventoryEntry[],
): string[] {
  const errors: string[] = [];

  if (sectionInventory.length === 0) {
    return errors;
  }

  const schemaSections = (schema.panels.controls?.sections ?? []).flatMap(
    (section, sectionIndex) => {
      if (section.id === "runtime.setup") {
        return [];
      }

      const targets = Object.values(section.controls)
        .filter(isToolcraftProductSectionControl)
        .map((control) => control.target);

      if (targets.length === 0) {
        return [];
      }

      return [
        {
          id: section.id,
          label: getToolcraftSectionLabel(section.title, sectionIndex),
          targets,
        },
      ];
    },
  );
  const schemaSectionIds = new Set(schemaSections.map((section) => section.id));
  const schemaTargetToSection = new Map<string, string>();

  for (const section of schemaSections) {
    for (const target of section.targets) {
      schemaTargetToSection.set(target, section.id);
    }
  }

  const inventoryIdCounts = new Map<string, number>();
  const inventoryTargetToSection = new Map<string, string>();

  for (const entry of sectionInventory) {
    const id = getToolcraftControlSectionInventoryEntryId(entry);
    const title = entry.title.trim();
    const entity = entry.entity?.trim() ?? "";
    const workflowStage = entry.workflowStage?.trim() ?? "";
    const groupingReason = entry.groupingReason.trim();
    const splitReason = entry.splitReason?.trim() ?? "";

    if (!id) {
      errors.push(
        "Control Section Inventory contains an entry without a non-empty string stable section id.",
      );
      continue;
    }

    if (!title) {
      errors.push(
        "Control Section Inventory contains an entry without a section title.",
      );
      continue;
    }

    inventoryIdCounts.set(id, (inventoryIdCounts.get(id) ?? 0) + 1);

    if (!schemaSectionIds.has(id)) {
      errors.push(
        `Control Section Inventory id "${id}" (${title}) has no rendered product controls section.`,
      );
    }

    if (!entity && !workflowStage) {
      errors.push(
        `Control Section Inventory entry "${title}" must declare entity or workflowStage so grouping is based on product meaning, not UI layout.`,
      );
    }

    if (groupingReason.length < 12) {
      errors.push(
        `Control Section Inventory entry "${title}" must include a concrete groupingReason explaining why these controls belong together.`,
      );
    }

    if (splitReason && splitReason.length < 12) {
      errors.push(
        `Control Section Inventory entry "${title}" splitReason is too vague. Explain the product workflow split or omit splitReason.`,
      );
    }

    if (entry.targets.length === 0) {
      errors.push(
        `Control Section Inventory entry "${title}" must list the product control targets rendered in that section.`,
      );
    }

    for (const target of entry.targets) {
      const schemaSection = schemaTargetToSection.get(target);

      if (!schemaSection) {
        errors.push(
          `Control Section Inventory entry "${title}" lists target "${target}", but that target is not rendered by any product controls section.`,
        );
        continue;
      }

      if (schemaSection !== id) {
        errors.push(
          `Control Section Inventory entry "${title}" (${id}) lists target "${target}", but the schema renders it in section id "${schemaSection}". Update the schema grouping or the inventory.`,
        );
      }

      const existingSection = inventoryTargetToSection.get(target);

      if (existingSection && existingSection !== id) {
        errors.push(
          `Control Section Inventory lists target "${target}" in both section ids "${existingSection}" and "${id}". Each product control target belongs to exactly one section inventory entry.`,
        );
      }

      inventoryTargetToSection.set(target, id);
    }
  }

  for (const [id, count] of inventoryIdCounts) {
    if (count > 1) {
      errors.push(
        `Control Section Inventory repeats id "${id}" ${count} times. Section inventory IDs must be unique.`,
      );
    }
  }

  for (const section of schemaSections) {
    if (isLegacyToolcraftControlSectionId(section.id)) {
      errors.push(
        `Product controls section "${section.label}" must declare an explicit stable id shared with appControlSectionInventory; compatibility id "${section.id}" is runtime-only.`,
      );
    }

    const entry = sectionInventory.find(
      (inventoryEntry) =>
        getToolcraftControlSectionInventoryEntryId(inventoryEntry) ===
        section.id,
    );

    if (!entry) {
      errors.push(
        `Control Section Inventory is missing product section id "${section.id}" (${section.label}). Add the same explicit id, entity/workflow stage, targets, and groupingReason.`,
      );
      continue;
    }

    const inventoryTargets = new Set(entry.targets);

    for (const target of section.targets) {
      if (!inventoryTargets.has(target)) {
        errors.push(
          `Control Section Inventory entry "${section.label}" is missing rendered target "${target}". The inventory must cover every product control in the section.`,
        );
      }
    }
  }

  return errors;
}
