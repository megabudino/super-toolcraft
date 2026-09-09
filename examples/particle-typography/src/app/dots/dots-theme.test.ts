import { describe, expect, test } from "vitest";

import type { ToolcraftCommand, ToolcraftState } from "@/toolcraft/runtime";

import { dotColorAt } from "./dots-color";
import {
  applyDotColorTheme,
  createDotColorThemePaletteValue,
  DOT_COLOR_THEME_SPECTRUM,
  DOT_COLOR_THEMES,
  getDotColorThemeByActionValue,
  isDotColorThemeActionValue,
} from "./dots-theme";

const hexPattern = /^#[0-9A-F]{6}$/u;

function themeState(values: Record<string, unknown>): ToolcraftState {
  return { values } as unknown as ToolcraftState;
}

describe("Dot Formation color themes", () => {
  test("publishes six coordinated themes with the current look first", () => {
    expect(DOT_COLOR_THEMES).toHaveLength(6);
    expect(new Set(DOT_COLOR_THEMES.map((theme) => theme.id)).size).toBe(6);
    expect(new Set(DOT_COLOR_THEMES.map((theme) => theme.label)).size).toBe(6);
    expect(
      new Set(DOT_COLOR_THEMES.map((theme) => theme.background)).size,
    ).toBe(6);
    expect(DOT_COLOR_THEMES[0]).toBe(DOT_COLOR_THEME_SPECTRUM);
    expect(DOT_COLOR_THEME_SPECTRUM.background).toBe("#CFBCB0");
    expect(createDotColorThemePaletteValue(DOT_COLOR_THEME_SPECTRUM)).toEqual({
      angle: 12,
      gradientType: "angular",
      stops: [
        { color: "#FF4F22", position: "0%" },
        { color: "#FF8A1E", position: "10%" },
        { color: "#F1F20D", position: "20%" },
        { color: "#5C771A", position: "30%" },
        { color: "#0B5A86", position: "40%" },
        { color: "#8DB5C8", position: "50%" },
        { color: "#887CE8", position: "60%" },
        { color: "#F3A0C3", position: "70%" },
        { color: "#B28F73", position: "80%" },
        { color: "#D7D9D3", position: "90%" },
        { color: "#FF4F22", position: "100%" },
      ],
    });
  });

  test("keeps every theme palette seam-closed with valid discrete stops", () => {
    for (const theme of DOT_COLOR_THEMES) {
      const palette = createDotColorThemePaletteValue(theme);

      expect(isDotColorThemeActionValue(theme.actionValue)).toBe(true);
      expect(getDotColorThemeByActionValue(theme.actionValue)).toBe(theme);
      expect(hexPattern.test(theme.background)).toBe(true);
      expect(palette.stops).toHaveLength(11);
      expect(palette.stops[0]?.color).toBe(palette.stops.at(-1)?.color);
      expect(palette.stops.map((stop) => stop.position)).toEqual(
        Array.from({ length: 11 }, (_, index) => `${index * 10}%`),
      );
      expect(
        new Set(palette.stops.slice(0, 10).map((stop) => stop.color)).size,
      ).toBe(10);
      for (const stop of palette.stops) {
        expect(hexPattern.test(stop.color)).toBe(true);
      }
    }
  });

  test("assigns only the selected theme's colors to seeded particles", () => {
    for (const theme of DOT_COLOR_THEMES) {
      const palette = createDotColorThemePaletteValue(theme);
      const gradient = {
        angle: palette.angle,
        gradientType: palette.gradientType,
        stops: palette.stops.map((stop, index) => ({
          color: stop.color,
          opacity: 1,
          position: index / 10,
        })),
      };
      const allowed = new Set(
        theme.stopColors.map((color) => {
          const r = Number.parseInt(color.slice(1, 3), 16);
          const g = Number.parseInt(color.slice(3, 5), 16);
          const b = Number.parseInt(color.slice(5, 7), 16);
          return `rgb(${r} ${g} ${b})`;
        }),
      );
      const assigned = Array.from({ length: 120 }, (_, index) =>
        dotColorAt(gradient, 0.48, 0.52, "#FFFFFF", index * 13.71).css,
      );

      expect(assigned.every((color) => allowed.has(color))).toBe(true);
      expect(new Set(assigned).size).toBeGreaterThanOrEqual(7);
    }
  });

  test("applies palette and background through runtime commands exactly once", () => {
    const commands: ToolcraftCommand[] = [];
    const neon = DOT_COLOR_THEMES[1]!;

    applyDotColorTheme({
      action: { value: neon.actionValue },
      dispatch: (command) => commands.push(command),
      state: themeState({}),
    });

    expect(commands).toEqual([
      {
        label: `${neon.label} theme palette`,
        target: "appearance.palette",
        type: "controls.setValue",
        value: createDotColorThemePaletteValue(neon),
      },
      {
        label: `${neon.label} theme background`,
        target: "appearance.background",
        type: "controls.setValue",
        value: neon.background,
      },
    ]);
  });

  test("skips redundant commands when the theme is already applied", () => {
    const commands: ToolcraftCommand[] = [];
    const ocean = DOT_COLOR_THEMES[3]!;

    applyDotColorTheme({
      action: { value: ocean.actionValue },
      dispatch: (command) => commands.push(command),
      state: themeState({
        "appearance.background": { hex: ocean.background.toLowerCase() },
        "appearance.palette": createDotColorThemePaletteValue(ocean),
      }),
    });
    applyDotColorTheme({
      action: { value: "theme.unknown" },
      dispatch: (command) => commands.push(command),
      state: themeState({}),
    });
    applyDotColorTheme({
      action: { value: "export.png" },
      dispatch: (command) => commands.push(command),
      state: themeState({}),
    });

    expect(commands).toEqual([]);
  });
});
