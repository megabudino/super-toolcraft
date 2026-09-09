import type { ToolcraftCommand, ToolcraftState } from "@/toolcraft/runtime";

export type DotColorThemePaletteStop = {
  color: string;
  position: string;
};

export type DotColorThemePalette = {
  angle: number;
  gradientType: "angular";
  stops: DotColorThemePaletteStop[];
};

export type DotColorTheme = Readonly<{
  actionValue: string;
  background: string;
  id: string;
  label: string;
  stopColors: readonly string[];
}>;

export const DOT_COLOR_THEME_ACTION_PREFIX = "theme.";

function theme(
  id: string,
  label: string,
  background: string,
  stopColors: readonly string[],
): DotColorTheme {
  return {
    actionValue: `${DOT_COLOR_THEME_ACTION_PREFIX}${id}`,
    background,
    id,
    label,
    stopColors,
  };
}

export const DOT_COLOR_THEME_SPECTRUM = theme("spectrum", "Spectrum", "#CFBCB0", [
  "#FF4F22",
  "#FF8A1E",
  "#F1F20D",
  "#5C771A",
  "#0B5A86",
  "#8DB5C8",
  "#887CE8",
  "#F3A0C3",
  "#B28F73",
  "#D7D9D3",
]);

export const DOT_COLOR_THEMES: readonly DotColorTheme[] = [
  DOT_COLOR_THEME_SPECTRUM,
  theme("neon", "Neon", "#0B0B12", [
    "#00F0FF",
    "#2BFF88",
    "#C8FF1E",
    "#FFE81E",
    "#FF9E00",
    "#FF4D6D",
    "#FF2EC4",
    "#B14CFF",
    "#4C6FFF",
    "#00C2FF",
  ]),
  theme("ember", "Ember", "#1A0D08", [
    "#FFF3B0",
    "#FFD166",
    "#FFBA08",
    "#FF9F1C",
    "#FF6A00",
    "#E85D04",
    "#F94144",
    "#D7263D",
    "#A4133C",
    "#800F2F",
  ]),
  theme("ocean", "Ocean", "#07293B", [
    "#D9F7FA",
    "#A6E9F5",
    "#6FD8F0",
    "#3EC5E8",
    "#17AFD9",
    "#0E96C4",
    "#27C2A5",
    "#6FE3C1",
    "#B7F0DF",
    "#F2FBF9",
  ]),
  theme("pastel", "Pastel", "#F6F0E8", [
    "#FF9FB2",
    "#FFC98B",
    "#F9E784",
    "#A9E5A5",
    "#8CD9E9",
    "#93B5F5",
    "#B9A7F2",
    "#EDA9E4",
    "#F2C6B4",
    "#C9CBE8",
  ]),
  theme("mono", "Mono", "#111111", [
    "#FFFFFF",
    "#EDEDED",
    "#D9D9D9",
    "#C2C2C2",
    "#ABABAB",
    "#8F8F8F",
    "#737373",
    "#E4E4E4",
    "#BDBDBD",
    "#9E9E9E",
  ]),
];

export function getDotColorThemeByActionValue(
  actionValue: string,
): DotColorTheme | undefined {
  return DOT_COLOR_THEMES.find((entry) => entry.actionValue === actionValue);
}

export function isDotColorThemeActionValue(actionValue: string): boolean {
  return actionValue.startsWith(DOT_COLOR_THEME_ACTION_PREFIX);
}

export function createDotColorThemePaletteValue(
  selectedTheme: DotColorTheme,
): DotColorThemePalette {
  const seamColors = [...selectedTheme.stopColors, selectedTheme.stopColors[0] ?? "#FFFFFF"];
  const lastIndex = seamColors.length - 1;
  return {
    angle: 12,
    gradientType: "angular",
    stops: seamColors.map((color, index) => ({
      color,
      position: `${Math.round((index / Math.max(1, lastIndex)) * 100)}%`,
    })),
  };
}

function normalizedBackground(value: unknown): string {
  if (typeof value === "string") return value.trim().toUpperCase();
  if (typeof value === "object" && value !== null && "hex" in value) {
    const hex = (value as { hex?: unknown }).hex;
    if (typeof hex === "string") return hex.trim().toUpperCase();
  }
  return "";
}

export function applyDotColorTheme(context: {
  action: { value: string };
  dispatch: (command: ToolcraftCommand) => void;
  state: ToolcraftState;
}): void {
  const selectedTheme = getDotColorThemeByActionValue(context.action.value);
  if (!selectedTheme) return;

  const paletteValue = createDotColorThemePaletteValue(selectedTheme);
  const currentPalette = context.state.values["appearance.palette"];
  if (JSON.stringify(currentPalette) !== JSON.stringify(paletteValue)) {
    context.dispatch({
      label: `${selectedTheme.label} theme palette`,
      target: "appearance.palette",
      type: "controls.setValue",
      value: paletteValue,
    });
  }

  const currentBackground = context.state.values["appearance.background"];
  if (
    normalizedBackground(currentBackground) !==
    selectedTheme.background.toUpperCase()
  ) {
    context.dispatch({
      label: `${selectedTheme.label} theme background`,
      target: "appearance.background",
      type: "controls.setValue",
      value: selectedTheme.background,
    });
  }
}
