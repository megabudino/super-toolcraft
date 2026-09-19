// Reference HSL conversion and shortest-hue interpolation.

export const hexToHSL = (hex: string): { h: number; s: number; l: number } => {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  let r = 0, g = 0, b = 0;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

export const interpolateHSL = (
  hsl1: { h: number; s: number; l: number },
  hsl2: { h: number; s: number; l: number },
  factor: number
): { h: number; s: number; l: number } => {
  let h1 = hsl1.h;
  let h2 = hsl2.h;
  
  if (h1 > h2 && h1 - h2 > 180) h2 += 360;
  else if (h2 > h1 && h2 - h1 > 180) h1 += 360;
  
  const h = (h1 + (h2 - h1) * factor) % 360;
  // Ensure saturation and lightness stay within 0-100 bounds
  const s = Math.max(0, Math.min(100, hsl1.s + (hsl2.s - hsl1.s) * factor));
  const l = Math.max(0, Math.min(100, hsl1.l + (hsl2.l - hsl1.l) * factor));
  
  return { h, s, l };
};

export const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};
