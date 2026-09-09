export const editorialPatternFirstLaunchDefaults = {
  canvas: {
    height: 1080,
    unit: "px",
    width: 1440,
  },
  values: {
    "appearance.background": "#0C925F",
    "appearance.detail": "#FFFFFF",
    "appearance.headline": "#FFFFFF",
    "appearance.rule": "#FFFFFF",
    "composition.preserveColors": true,
    "editorial.body":
      "A modular grid turns many decisions into one repeatable logic. Columns hold alignment; intervals create rhythm; variation arrives without losing the whole.",
    "editorial.customCopy": false,
    "editorial.eyebrow": "SYSTEMS JOURNAL / 01",
    "editorial.footer": "NOTES ON STRUCTURE — EDITION 01",
    "editorial.headline": "ORDER\nCREATES\nFREEDOM",
    "editorial.template": "negative-space",
    "export.image.format": "png",
    "export.image.resolution": "4k",
    "export.includeBackground": true,
    "pattern.colorA": "#E6D0F0",
    "pattern.colorB": "#EF6CB1",
    "pattern.colorC": "#9BED87",
    "pattern.colorSpread": 88,
    "pattern.coupling": 43,
    "pattern.detail": 6400,
    "pattern.phase": 106,
    "pattern.position": { x: -0.18, y: -0.04 },
    "pattern.preset": "harmonic-halo",
    "pattern.resonance": 9,
    "pattern.scale": 92,
    "pattern.segmentRandomness": 60,
    "pattern.segmentSize": 0.5,
    "pattern.stroke": 1.15,
    "pattern.symmetry": 15,
    "pattern.warp": 44,
  },
} as const;

export const editorialPatternDefaultValues =
  editorialPatternFirstLaunchDefaults.values;
