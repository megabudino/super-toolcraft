'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import type { CSSProperties } from 'react';

import { getFineDetailsCarouselLoop } from './fine-details-carousel-geometry';
import { getFineDetailsLoadingWaveGeometry } from './fine-details-loading-wave';
import placeholderStyles from './fine-details-image-placeholder.module.css';
import styles from './fine-details-loading-placeholders.module.css';
import type {
  FineDetailsCarouselSettings,
  FineDetailsColorOpacity,
  FineDetailsLoadingSettings,
} from './fine-details-settings';
import { useFineDetailsTypographyBand } from './fine-details-typography-band';

export const FINE_DETAILS_LOADING_CARD_COUNT = 2;

const shadowOffsetPixels = 48;

function createColor({ hex, opacity }: FineDetailsColorOpacity) {
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgb(${red} ${green} ${blue} / ${opacity}%)`;
}

type FineDetailsLoadingCssVariables = CSSProperties & {
  '--fd-loading-gap': string;
  '--fd-loading-radius': string;
  '--fd-wave-base-tone'?: string;
  '--fd-wave-cell'?: string;
  '--fd-wave-contrast'?: string;
  '--fd-wave-glare'?: string;
  '--fd-wave-shift'?: string;
  '--fd-wave-duration'?: string;
  '--fd-wave-from'?: string;
  '--fd-wave-mask'?: string;
  '--fd-wave-mask-size'?: string;
  '--fd-wave-to'?: string;
};

type FineDetailsLoadingCardCssVariables = CSSProperties & {
  '--fd-wave-delay'?: string;
  '--fd-wave-duration'?: string;
};

export function FineDetailsLoadingPlaceholders({
  loading,
  measurementKey,
  settings,
}: {
  loading: FineDetailsLoadingSettings;
  measurementKey: string;
  settings: FineDetailsCarouselSettings;
}) {
  const { layout, rootRef } = useFineDetailsTypographyBand({
    measurementKey,
    textGap: settings.textGap,
  });
  const wave = getFineDetailsLoadingWaveGeometry(loading, layout.effectiveHeight);
  const rootStyle: FineDetailsLoadingCssVariables = {
    '--fd-loading-gap': `${settings.gap}px`,
    '--fd-loading-radius': `${settings.radius}px`,
    ...(loading.enabled
      ? {
          '--fd-wave-base-tone': `${loading.baseTone}%`,
          '--fd-wave-cell': `${loading.cell * 2}px`,
          '--fd-wave-contrast': `${loading.contrast}%`,
          '--fd-wave-glare': `${loading.glare}%`,
          '--fd-wave-shift': `${wave.shift.x}px ${wave.shift.y}px`,
          '--fd-wave-duration': `${wave.duration}ms`,
          '--fd-wave-from': `${wave.from.x}px ${wave.from.y}px`,
          '--fd-wave-mask': wave.mask,
          '--fd-wave-mask-size': `${wave.tileSize}px ${wave.tileSize}px`,
          '--fd-wave-to': `${wave.to.x}px ${wave.to.y}px`,
        }
      : {}),
    ...(layout.isMeasured
      ? { height: `${layout.bandHeight}px`, top: `${layout.bandTop}px` }
      : { bottom: 0, top: 0 }),
  };
  const loadingRowWidth =
    FINE_DETAILS_LOADING_CARD_COUNT * layout.effectiveHeight +
    (FINE_DETAILS_LOADING_CARD_COUNT - 1) * settings.gap;
  const loadingLoop = getFineDetailsCarouselLoop({
    containerWidth: layout.containerWidth,
    gap: settings.gap,
    rowWidth: loadingRowWidth,
    speed: settings.speed,
  });

  return (
    <div
      aria-hidden="true"
      className={referenceClasses(`${styles.root} ${loadingLoop.animated ? styles.overflowing : ''}`)}
      data-fine-details-loading
      data-fine-details-loading-wave={loading.enabled ? 'true' : 'false'}
      ref={rootRef}
      style={rootStyle}
    >
      {layout.isMeasured && layout.isValid ? (
        <div className={referenceClasses(styles.cards)}>
          {Array.from({ length: FINE_DETAILS_LOADING_CARD_COUNT }, (_, index) => {
            const shadow = settings.shadow;
            const cardStyle: FineDetailsLoadingCardCssVariables = {
              border:
                loading.border.width > 0
                  ? `${loading.border.width}px solid ${createColor(loading.border.colorOpacity)}`
                  : 'none',
              boxShadow: shadow.enabled
                ? `${shadow.offset.x * shadowOffsetPixels}px ${shadow.offset.y * shadowOffsetPixels}px ${shadow.blur}px ${shadow.spread}px ${createColor(shadow.colorOpacity)}`
                : 'none',
              boxSizing: 'border-box',
              height: `${layout.effectiveHeight}px`,
              width: `${layout.effectiveHeight}px`,
              ...(loading.enabled
                ? {
                    '--fd-wave-delay': `${index * loading.stagger}ms`,
                    '--fd-wave-duration': `${
                      wave.duration * (1 + (index * loading.desync) / 100)
                    }ms`,
                  }
                : {}),
            };
            return (
              <div
                className={referenceClasses(`${styles.card} ${
                  loading.enabled ? styles.wave : placeholderStyles.surface
                }`)}
                data-fine-details-loading-card={index + 1}
                key={index}
                style={cardStyle}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
