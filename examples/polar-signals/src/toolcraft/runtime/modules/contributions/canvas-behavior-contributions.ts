import type { ToolcraftCanvasBehaviorModuleContribution } from "../contract/contribution";

type CanvasBehaviorByName<Behavior extends ToolcraftCanvasBehaviorModuleContribution["behavior"]> =
  Extract<ToolcraftCanvasBehaviorModuleContribution, Readonly<{ behavior: Behavior }>>;

export type ResolvedToolcraftCanvasBehavior =
  | Readonly<Pick<CanvasBehaviorByName<"external-document">, "behavior" | "operations">>
  | Readonly<Pick<CanvasBehaviorByName<"editing">, "behavior" | "operations">>
  | Readonly<Pick<CanvasBehaviorByName<"spatial-view">, "behavior" | "operations">>;

function materializeCanvasBehavior(
  contribution: ToolcraftCanvasBehaviorModuleContribution,
): ResolvedToolcraftCanvasBehavior {
  switch (contribution.behavior) {
    case "external-document":
      return Object.freeze({
        behavior: contribution.behavior,
        operations: contribution.operations,
      });
    case "editing":
      return Object.freeze({
        behavior: contribution.behavior,
        operations: contribution.operations,
      });
    case "spatial-view":
      return Object.freeze({
        behavior: contribution.behavior,
        operations: contribution.operations,
      });
  }
}

export function resolveToolcraftCanvasBehaviorContributions(
  contributions: readonly ToolcraftCanvasBehaviorModuleContribution[],
): readonly ResolvedToolcraftCanvasBehavior[] {
  return Object.freeze(
    [...contributions]
      .sort((left, right) => left.behavior.localeCompare(right.behavior))
      .map(materializeCanvasBehavior),
  );
}
