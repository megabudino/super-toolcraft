import * as React from "react";

import { useToolcraftDispatch } from "@/toolcraft/runtime/react";

import {
  HERO_SPHERE_ROW_DEFAULT,
  heroGalleryTargets,
  sphereRowsValue,
  type HeroGalleryImage,
} from "./hero-gallery-values";

const HERO_GALLERY_MAX_ROWS = 6;

export function getHeroGalleryRowActivation(
  previousOccupied: ReadonlySet<number> | null,
  occupied: ReadonlySet<number>,
  rowsLength: number,
): number | null {
  if (previousOccupied === null) return null;

  let highestNewOccupiedIndex = -1;

  for (const index of occupied) {
    if (!previousOccupied.has(index) && index >= rowsLength) {
      highestNewOccupiedIndex = Math.max(highestNewOccupiedIndex, index);
    }
  }

  if (highestNewOccupiedIndex < 0) return null;

  const activationLength = Math.min(
    HERO_GALLERY_MAX_ROWS,
    highestNewOccupiedIndex + 1,
  );

  return activationLength > rowsLength ? activationLength : null;
}

export function useHeroGalleryRowActivation({
  rowImages,
  rowsValue,
}: {
  rowImages: readonly (readonly HeroGalleryImage[])[];
  rowsValue: unknown;
}): void {
  const dispatch = useToolcraftDispatch();
  const previousOccupiedRef = React.useRef<ReadonlySet<number> | null>(null);
  const occupied = React.useMemo(() => {
    const nextOccupied = new Set<number>();

    rowImages.forEach((images, index) => {
      if (images.length > 0) nextOccupied.add(index);
    });

    return nextOccupied;
  }, [rowImages]);

  React.useEffect(() => {
    const previousOccupied = previousOccupiedRef.current;
    previousOccupiedRef.current = occupied;

    const currentRows = sphereRowsValue(rowsValue);
    const activationLength = getHeroGalleryRowActivation(
      previousOccupied,
      occupied,
      currentRows.length,
    );

    if (activationLength === null) return;

    dispatch({
      label: `Activate Row ${activationLength}`,
      target: heroGalleryTargets.sphereRows,
      type: "controls.setValue",
      value: [
        ...currentRows,
        ...Array.from(
          { length: activationLength - currentRows.length },
          () => HERO_SPHERE_ROW_DEFAULT,
        ),
      ],
    });
  }, [dispatch, occupied, rowsValue]);
}
