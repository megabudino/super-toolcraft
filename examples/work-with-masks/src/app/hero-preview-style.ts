import type { CSSProperties } from 'react';
import type { HeroPreviewSettings, HeroPreviewTypography } from './hero-preview-settings';

const letterSpacingValues = {
  tight: -0.025,
  tighter: -0.05,
  normal: 0,
  wide: 0.025,
  wider: 0.05,
  widest: 0.1,
} as const;

const lineHeightValues = {
  loose: 2,
  none: 1,
  normal: 1.5,
  relaxed: 1.625,
  snug: 1.375,
  tight: 1.25,
} as const;

const textTransformValues = {
  capitalize: 'capitalize',
  lowercase: 'lowercase',
  original: 'none',
  titleCase: 'capitalize',
  uppercase: 'uppercase',
} as const;

type HeroPreviewStyle = CSSProperties & {
  [key: `--toolcraft-hero-${string}`]: number | string;
};

function getFontFamily(typography: HeroPreviewTypography): string {
  if (typography.fontId === 'figtree') return 'var(--font-heading)';
  if (typography.fontId === 'inter') return 'var(--font-sans)';
  return `"${typography.family}", sans-serif`;
}

function setTypographyStyle(
  style: HeroPreviewStyle,
  prefix: `--toolcraft-hero-${string}`,
  typography: HeroPreviewTypography,
) {
  style[`${prefix}-color`] = typography.color;
  style[`${prefix}-font-family`] = getFontFamily(typography);
  style[`${prefix}-font-size`] = `${typography.fontSize}px`;
  style[`${prefix}-font-weight`] = typography.fontWeight;
  style[`${prefix}-letter-spacing`] = `${letterSpacingValues[typography.letterSpacing]}em`;
  style[`${prefix}-line-height`] = String(lineHeightValues[typography.lineHeight]);
  style[`${prefix}-opacity`] = typography.opacity / 100;
  style[`${prefix}-text-transform`] = textTransformValues[typography.textCase];
}

export function getHeroPreviewStyle(settings: HeroPreviewSettings): HeroPreviewStyle {
  const style: HeroPreviewStyle = {
    '--toolcraft-hero-copy-to-logos': `${settings.layout.copyToLogos}px`,
    '--toolcraft-hero-logos-to-media': `${settings.layout.logosToMedia}px`,
    '--toolcraft-hero-right-offset-y': `${settings.right.offsetY}px`,
    '--toolcraft-hero-right-paragraph-gap': `${settings.right.paragraphGap}px`,
    '--toolcraft-hero-top-inset': `${settings.layout.topInset}px`,
  };

  setTypographyStyle(style, '--toolcraft-hero-heading', settings.headingTypography);
  setTypographyStyle(style, '--toolcraft-hero-right-lead', settings.right.leadTypography);
  setTypographyStyle(style, '--toolcraft-hero-right-body', settings.right.bodyTypography);

  return style;
}
