type Rgb = readonly [number, number, number];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseHex(hex: string): Rgb {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) {
    return [23, 23, 23];
  }

  const value = match[1] ?? "171717";
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

export function relativeLuminance(hex: string): number {
  const channels = parseHex(hex).map((channel) => channel / 255);
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return (linear[0] ?? 0) * 0.2126 + (linear[1] ?? 0) * 0.7152 + (linear[2] ?? 0) * 0.0722;
}

export function contrastRatio(a: string, b: string): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const section = h / 60;
  const x = chroma * (1 - Math.abs((section % 2) - 1));
  const [red, green, blue] =
    section < 1
      ? [chroma, x, 0]
      : section < 2
        ? [x, chroma, 0]
        : section < 3
          ? [0, chroma, x]
          : section < 4
            ? [0, x, chroma]
            : section < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const match = l - chroma / 2;
  return `#${[red, green, blue]
    .map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function rgbToHex(rgb: Rgb): string {
  return `#${rgb
    .map((channel) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

export function interpolateHexColor(from: string, to: string, progress: number): string {
  const start = parseHex(from);
  const end = parseHex(to);
  const amount = clamp(progress, 0, 1);
  return rgbToHex(
    start.map(
      (channel, index) => channel + ((end[index] ?? channel) - channel) * amount,
    ) as unknown as Rgb,
  );
}

function hashPalette(palette: readonly string[]): number {
  let hash = 2_166_136_261;
  for (const character of palette.join("|")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function createContrastingColor(
  hue: number,
  saturation: number,
  initialLightness: number,
  background: string,
  backgroundIsLight: boolean,
  minimumContrast = 3,
): string {
  let lightness = initialLightness;
  let color = hslToHex(hue, saturation, lightness);

  while (
    contrastRatio(color, background) < minimumContrast &&
    lightness > 0 &&
    lightness < 100
  ) {
    lightness = clamp(lightness + (backgroundIsLight ? -1 : 1), 0, 100);
    color = hslToHex(hue, saturation, lightness);
  }

  if (contrastRatio(color, background) >= minimumContrast) {
    return color;
  }

  const blackContrast = contrastRatio("#000000", background);
  const whiteContrast = contrastRatio("#FFFFFF", background);
  return blackContrast >= whiteContrast ? "#000000" : "#FFFFFF";
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0 || 0x9e3779b9;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

type BackgroundCandidate = {
  color: string;
  contrast: number;
  distance: number;
  valid: boolean;
};

function createBackgroundCandidate(
  hue: number,
  saturation: number,
  initialLightness: number,
  ink: "#000000" | "#FFFFFF",
  direction: -1 | 1,
): BackgroundCandidate {
  const boundary = direction < 0 ? 22 : 62;
  let lightness = initialLightness;
  let color = hslToHex(hue, saturation, lightness);
  let contrast = contrastRatio(color, ink);

  while (contrast < 7 && lightness !== boundary) {
    lightness = clamp(lightness + direction, 22, 62);
    color = hslToHex(hue, saturation, lightness);
    contrast = contrastRatio(color, ink);
  }

  return {
    color,
    contrast,
    distance: Math.abs(lightness - initialLightness),
    valid: contrast >= 7,
  };
}

function createVividAccessibleBackground(
  hue: number,
  saturation: number,
  initialLightness: number,
): string {
  const deep = createBackgroundCandidate(
    hue,
    saturation,
    initialLightness,
    "#FFFFFF",
    -1,
  );
  const bright = createBackgroundCandidate(
    hue,
    saturation,
    initialLightness,
    "#000000",
    1,
  );

  if (deep.valid && (!bright.valid || deep.distance <= bright.distance)) {
    return deep.color;
  }
  if (bright.valid) {
    return bright.color;
  }

  return "#000ECC";
}

export type AccessiblePosterPalette = {
  background: string;
  detail: string;
  headline: string;
  lines: readonly [string, string, string];
  rule: string;
};

export function createAccessiblePosterPalette(seed: number): AccessiblePosterPalette {
  const random = createRandom(seed);
  const backgroundHue = random() * 360;
  const background = createVividAccessibleBackground(
    backgroundHue,
    92 + random() * 8,
    36 + random() * 12,
  );
  const backgroundIsLight =
    contrastRatio(background, "#000000") >=
    contrastRatio(background, "#FFFFFF");
  const foregroundStart = backgroundIsLight ? 24 : 76;
  const headline = createContrastingColor(
    backgroundHue + (random() - 0.5) * 28,
    18 + random() * 36,
    foregroundStart,
    background,
    backgroundIsLight,
    7,
  );
  const detail = createContrastingColor(
    backgroundHue + 24 + random() * 72,
    12 + random() * 34,
    foregroundStart + (backgroundIsLight ? 2 : -2),
    background,
    backgroundIsLight,
    7,
  );
  const rule = createContrastingColor(
    backgroundHue + 150 + random() * 60,
    24 + random() * 36,
    backgroundIsLight ? 44 : 56,
    background,
    backgroundIsLight,
    3,
  );
  const schemes = [
    [0, 34, 68],
    [0, 120, 240],
    [0, 150, 210],
    [0, 52, 196],
  ] as const;
  const offsets = schemes[Math.floor(random() * schemes.length)] ?? schemes[0];
  const baseHue = (backgroundHue + 90 + random() * 180) % 360;
  const lines = offsets.map((offset, index) =>
    createContrastingColor(
      baseHue + offset,
      66 + random() * 26,
      backgroundIsLight ? 42 - index * 2 : 58 + index * 3,
      background,
      backgroundIsLight,
      3,
    ),
  ) as unknown as readonly [string, string, string];

  return { background, detail, headline, lines, rule };
}

export function createHarmoniousPalette(
  current: readonly [string, string, string],
  background: string,
): readonly [string, string, string] {
  const hash = hashPalette(current);
  const baseHue = ((hash % 360) + 137.508) % 360;
  const schemes = [
    [0, 34, 68],
    [0, 120, 240],
    [0, 150, 210],
    [0, 48, 188],
  ] as const;
  const offsets = schemes[hash % schemes.length] ?? schemes[0];
  const backgroundIsLight = relativeLuminance(background) > 0.42;
  const lightnesses = backgroundIsLight ? [17, 36, 40] : [88, 68, 73];
  const saturations = [52, 80, 74];

  return offsets.map((offset, index) =>
    createContrastingColor(
      baseHue + offset,
      saturations[index] ?? 70,
      lightnesses[index] ?? 50,
      background,
      backgroundIsLight,
    ),
  ) as unknown as readonly [string, string, string];
}
