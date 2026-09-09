import { describe, expect, it } from "vitest";

import {
  createFineDetailsLoadingFromValues,
  FINE_DETAILS_LOADING_DEFAULTS,
  fineDetailsLoadingTargets,
} from "./fine-details-loading-values";

describe("Fine Details loading values", () => {
  it("returns exact defaults for missing or invalid values", () => {
    expect(createFineDetailsLoadingFromValues({})).toEqual(
      FINE_DETAILS_LOADING_DEFAULTS,
    );
    expect(
      createFineDetailsLoadingFromValues({
        [fineDetailsLoadingTargets.angle]: null,
        [fineDetailsLoadingTargets.cell]: Number.NaN,
        [fineDetailsLoadingTargets.enabled]: "yes",
        [fineDetailsLoadingTargets.passTime]: "1600",
      }),
    ).toEqual(FINE_DETAILS_LOADING_DEFAULTS);
  });

  it("clamps every numeric target to its schema domain and rounds the cell", () => {
    expect(
      createFineDetailsLoadingFromValues({
        [fineDetailsLoadingTargets.angle]: 700,
        [fineDetailsLoadingTargets.baseTone]: 130,
        [fineDetailsLoadingTargets.borderColorOpacity]: { hex: "bad", opacity: 400 },
        [fineDetailsLoadingTargets.borderWidth]: 99,
        [fineDetailsLoadingTargets.cell]: 4.4,
        [fineDetailsLoadingTargets.contrast]: -5,
        [fineDetailsLoadingTargets.desync]: 300,
        [fineDetailsLoadingTargets.distort]: 99,
        [fineDetailsLoadingTargets.enabled]: false,
        [fineDetailsLoadingTargets.glare]: -20,
        [fineDetailsLoadingTargets.passTime]: 100,
        [fineDetailsLoadingTargets.pause]: 9000,
        [fineDetailsLoadingTargets.softness]: 140,
        [fineDetailsLoadingTargets.stagger]: -20,
        [fineDetailsLoadingTargets.waveWidth]: 3,
      }),
    ).toEqual({
      angle: 360,
      baseTone: 100,
      border: { colorOpacity: { hex: "#000000", opacity: 100 }, width: 8 },
      cell: 8,
      contrast: 0,
      desync: 50,
      distort: 24,
      enabled: false,
      glare: 0,
      passTime: 600,
      pause: 2000,
      softness: 100,
      stagger: 0,
      waveWidth: 10,
    });
    expect(
      createFineDetailsLoadingFromValues({
        [fineDetailsLoadingTargets.cell]: 21.6,
      }).cell,
    ).toBe(22);
  });
});
