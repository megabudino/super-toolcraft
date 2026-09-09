export type PromptRect = Readonly<{ height: number; width: number; x: number; y: number }>;
export type PromptGhostSnapshot = PromptRect & Readonly<{ opacity: number }>;

export function getTypographyCornerOffset(prompt: PromptRect, upperLeftTypography: PromptRect, lowerRightTypography: PromptRect) {
  return {
    x: prompt.x - upperLeftTypography.x,
    y: prompt.y + prompt.height - (lowerRightTypography.y + lowerRightTypography.height),
  };
}

export function orderGhostSnapshotsAlongPath<Snapshot extends PromptGhostSnapshot>(
  snapshots: readonly Snapshot[], takeoff: PromptRect, landing: PromptRect,
): Snapshot[] {
  const takeoffCenter = { x: takeoff.x + takeoff.width / 2, y: takeoff.y + takeoff.height / 2 };
  const delta = { x: landing.x + landing.width / 2 - takeoffCenter.x, y: landing.y + landing.height / 2 - takeoffCenter.y };
  return [...snapshots].sort((first, second) => {
    const project = (snapshot: PromptRect) =>
      (snapshot.x + snapshot.width / 2 - takeoffCenter.x) * delta.x +
      (snapshot.y + snapshot.height / 2 - takeoffCenter.y) * delta.y;
    return project(first) - project(second);
  });
}
