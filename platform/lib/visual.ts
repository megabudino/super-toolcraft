// Deterministic colors for avatars and app covers, derived from a slug/email.
function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function hueFor(value: string): number {
  return hash(value) % 360;
}

export function initials(value: string): string {
  const words = value
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

/** A soft two-tone gradient in the Toolcraft palette range (blue/violet/teal/orange accents). */
export function coverStyle(seed: string): { background: string } {
  const value = hash(seed);
  const hueA = value % 360;
  const hueB = (hueA + 40 + ((value >> 8) % 80)) % 360;
  const x = 20 + ((value >> 4) % 60);
  const y = 10 + ((value >> 12) % 50);
  return {
    background: [
      `radial-gradient(120% 90% at ${x}% ${y}%, oklch(0.6 0.14 ${hueA} / 0.85), transparent 62%)`,
      `radial-gradient(90% 80% at ${100 - x}% ${100 - y / 2}%, oklch(0.48 0.12 ${hueB} / 0.8), transparent 66%)`,
      "oklch(0.19 0 0)",
    ].join(", "),
  };
}
