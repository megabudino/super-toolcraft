import { expect, type Locator } from "@playwright/test";

type LocatorBox = Awaited<ReturnType<Locator["boundingBox"]>>;

export async function expectLocatorMovedBy(
  locator: Locator,
  before: LocatorBox,
  offset: Readonly<{ x: number; y: number }>,
): Promise<void> {
  const after = await locator.boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect((after?.x ?? 0) - (before?.x ?? 0)).toBeCloseTo(offset.x, 0);
  expect((after?.y ?? 0) - (before?.y ?? 0)).toBeCloseTo(offset.y, 0);
}

export async function expectHandlesMirroredAroundPoint(
  point: Locator,
  positive: Locator,
  negative: Locator,
): Promise<void> {
  const [pointBox, positiveBox, negativeBox] = await Promise.all([
    point.boundingBox(),
    positive.boundingBox(),
    negative.boundingBox(),
  ]);
  expect(pointBox).not.toBeNull();
  expect(positiveBox).not.toBeNull();
  expect(negativeBox).not.toBeNull();
  const center = (box: NonNullable<LocatorBox>) => ({
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  });
  const pointCenter = center(pointBox!);
  const positiveCenter = center(positiveBox!);
  const negativeCenter = center(negativeBox!);
  expect(positiveCenter.x + negativeCenter.x).toBeCloseTo(pointCenter.x * 2, 0);
  expect(positiveCenter.y + negativeCenter.y).toBeCloseTo(pointCenter.y * 2, 0);
}
