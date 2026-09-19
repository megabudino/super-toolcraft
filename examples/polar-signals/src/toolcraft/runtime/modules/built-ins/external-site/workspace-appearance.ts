const rgb = (hex: string) => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
const luminance = (channels: number[]) => channels.reduce((sum, channel, index) => {
  const value = channel / 255;
  return sum + (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][index]!;
}, 0);

/** Low-chroma related gray; contrast here separates surfaces, not text. */
export function resolveDocumentWorkspaceAppearance(source: string | null | undefined, theme: "light" | "dark") {
  const channels = rgb(source && /^#[\da-f]{6}$/i.test(source) ? source : theme === "dark" ? "#171717" : "#FFFFFF");
  const average = (Math.max(...channels) + Math.min(...channels)) / 2;
  const light = channels.reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0) >= 128;
  const sourceLuminance = luminance(channels);
  const candidates = (light ? [212, 184, 240] : [32, 56, 12, 80]).map(gray => {
    const color = channels.map(value => Math.round(Math.max(0, Math.min(255, gray + (value - average) * 0.12))));
    const luma = luminance(color);
    return { color, luma, contrast: (Math.max(luma, sourceLuminance) + 0.05) / (Math.min(luma, sourceLuminance) + 0.05) };
  });
  const selected = candidates.find(candidate => candidate.contrast >= 1.3) ??
    candidates.reduce((best, candidate) => candidate.contrast > best.contrast ? candidate : best);
  return {
    background: `#${selected.color.map(value => value.toString(16).padStart(2, "0")).join("").toUpperCase()}`,
    dots: selected.luma < 0.3 ? "#FFFFFF" : "#000000",
  };
}

export function documentWorkspaceDotColor(background: string): string {
  return luminance(rgb(background)) < 0.3 ? "#FFFFFF" : "#000000";
}
