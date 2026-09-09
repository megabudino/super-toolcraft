import { createToolcraftState } from "@/toolcraft/runtime";
import { describe, expect, it, vi } from "vitest";

import { appSchema } from "./app-schema";
import { getDefaultDotRingAudioProfile } from "./dot-ring-audio";
import {
  drawDotRingFrame,
  getDotRingFrameGeometry,
  getDotRingSettingsFromState,
  getDotRingSpatialFrameGeometry,
} from "./dot-ring-drawing";

describe("Dot Ring Studio drawing", () => {
  it("draws flat beads without configuring Canvas shadow state", () => {
    const state = createToolcraftState(appSchema);
    const arc = vi.fn();
    const propertyWrites = new Set<PropertyKey>();
    const context = new Proxy(
      {
        arc,
        beginPath: vi.fn(),
        clearRect: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        moveTo: vi.fn(),
      },
      {
        set(target, property, value) {
          propertyWrites.add(property);
          return Reflect.set(target, property, value);
        },
      },
    ) as unknown as CanvasRenderingContext2D;

    drawDotRingFrame({
      audioProfile: getDefaultDotRingAudioProfile(),
      context,
      drawBackground: false,
      durationSeconds: state.timeline.durationSeconds,
      height: state.canvas.size.height,
      settings: getDotRingSettingsFromState(state),
      timeSeconds: state.timeline.currentTimeSeconds,
      width: state.canvas.size.width,
    });

    expect(arc).toHaveBeenCalled();
    expect(propertyWrites).not.toContain("shadowBlur");
    expect(propertyWrites).not.toContain("shadowColor");
  });

  it("keeps spatial geometry stable when only palette settings change", () => {
    const state = createToolcraftState(appSchema);
    const audioProfile = getDefaultDotRingAudioProfile();
    const settings = getDotRingSettingsFromState(state);
    const recoloredSettings = {
      ...settings,
      background: "#112233",
      colorSpread: 100,
      palette: settings.palette.map((stop, index) => ({
        ...stop,
        color: index === 0 ? "#FF0000" : "#00FF00",
      })),
    };
    const frameOptions = {
      audioProfile,
      durationSeconds: state.timeline.durationSeconds,
      height: state.canvas.size.height,
      timeSeconds: state.timeline.currentTimeSeconds,
      width: state.canvas.size.width,
    };

    expect(
      getDotRingSpatialFrameGeometry({
        ...frameOptions,
        settings: recoloredSettings,
      }),
    ).toEqual(
      getDotRingSpatialFrameGeometry({
        ...frameOptions,
        settings,
      }),
    );
    expect(
      getDotRingFrameGeometry({
        ...frameOptions,
        settings: recoloredSettings,
      }).beads.map((bead) => bead.fillStyle),
    ).not.toEqual(
      getDotRingFrameGeometry({
        ...frameOptions,
        settings,
      }).beads.map((bead) => bead.fillStyle),
    );
  });

  it("keeps every animated ring row closed across all wave formulas", () => {
    const state = createToolcraftState(appSchema);
    const audioProfile = getDefaultDotRingAudioProfile();
    const settings = getDotRingSettingsFromState(state);
    const formulas = [
      "audio",
      "complex",
      "organic",
      "pulse",
      "turbulent",
    ] as const;

    for (const formula of formulas) {
      for (let sample = 0; sample < 24; sample += 1) {
        const geometry = getDotRingSpatialFrameGeometry({
          audioProfile,
          durationSeconds: state.timeline.durationSeconds,
          height: state.canvas.size.height,
          settings: {
            ...settings,
            density: 280,
            formula,
            rows: 12,
          },
          timeSeconds: (state.timeline.durationSeconds * sample) / 24,
          width: state.canvas.size.width,
        });
        const beadsByRow = new Map<
          number,
          (typeof geometry.beads)[number][]
        >();

        for (const bead of geometry.beads) {
          const beads = beadsByRow.get(bead.row);

          if (beads) {
            beads.push(bead);
          } else {
            beadsByRow.set(bead.row, [bead]);
          }
        }

        for (const beads of beadsByRow.values()) {
          const interiorDistances = beads.slice(1).map((bead, index) =>
            Math.hypot(
              bead.x - beads[index]!.x,
              bead.y - beads[index]!.y,
            ),
          );
          const seamDistance = Math.hypot(
            beads[0]!.x - beads.at(-1)!.x,
            beads[0]!.y - beads.at(-1)!.y,
          );
          const maximumInteriorDistance = Math.max(...interiorDistances);

          expect(seamDistance).toBeLessThanOrEqual(
            maximumInteriorDistance * 1.25,
          );
        }
      }
    }
  });
});
