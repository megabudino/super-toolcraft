import { getSectionRect, getSectionPoint } from '@/section/reference/reference-geometry';
'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { FINE_DETAILS_DESKTOP_MIN_WIDTH } from './fine-details-responsive';

export const FINE_DETAILS_MAX_IMAGE_HEIGHT = 800;

export interface FineDetailsTypographyBandLayout {
  bandHeight: number;
  bandTop: number;
  containerWidth: number;
  effectiveHeight: number;
  isMeasured: boolean;
  isValid: boolean;
}

interface FineDetailsTypographyBandGeometry {
  lowerTypographyTop: number;
  maximumHeight?: number;
  sectionTop: number;
  sectionWidth: number;
  textGap: number;
  upperTypographyBottom: number;
}

const initialFineDetailsTypographyBandLayout: FineDetailsTypographyBandLayout = {
  bandHeight: 0,
  bandTop: 0,
  containerWidth: 0,
  effectiveHeight: 0,
  isMeasured: false,
  isValid: false,
};

const invalidFineDetailsTypographyBandLayout: FineDetailsTypographyBandLayout = {
  ...initialFineDetailsTypographyBandLayout,
  isMeasured: true,
};

export function getFineDetailsTypographyBandLayout({
  lowerTypographyTop,
  maximumHeight,
  sectionTop,
  sectionWidth,
  textGap,
  upperTypographyBottom,
}: FineDetailsTypographyBandGeometry): FineDetailsTypographyBandLayout {
  const bandTop = upperTypographyBottom - sectionTop;
  const bandBottom = lowerTypographyTop - sectionTop;
  const bandHeight = bandBottom - bandTop;
  const usableHeight = bandHeight - textGap * 2;
  const effectiveHeight = Math.min(FINE_DETAILS_MAX_IMAGE_HEIGHT, usableHeight);
  const boundedEffectiveHeight = Math.min(
    effectiveHeight,
    maximumHeight ?? FINE_DETAILS_MAX_IMAGE_HEIGHT,
  );
  const isValid =
    Number.isFinite(bandTop) &&
    Number.isFinite(bandHeight) &&
    Number.isFinite(usableHeight) &&
    Number.isFinite(effectiveHeight) &&
    Number.isFinite(boundedEffectiveHeight) &&
    Number.isFinite(sectionWidth) &&
    effectiveHeight > 0 &&
    boundedEffectiveHeight > 0 &&
    sectionWidth > 0;

  return isValid
    ? {
        bandHeight,
        bandTop,
        containerWidth: sectionWidth,
        effectiveHeight: boundedEffectiveHeight,
        isMeasured: true,
        isValid: true,
      }
    : invalidFineDetailsTypographyBandLayout;
}

export function useFineDetailsTypographyBand({
  measurementKey,
  textGap,
}: {
  measurementKey: string;
  textGap: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(initialFineDetailsTypographyBandLayout);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const section = root?.closest<HTMLElement>('[data-fine-details-section]');
    const upperTypography = section?.querySelector<HTMLElement>(
      '[data-fine-details-upper-left-typography]',
    );
    const lowerTypography = section?.querySelector<HTMLElement>(
      '[data-fine-details-lower-right-typography]',
    );
    const prompt = section?.querySelector<HTMLElement>('[data-fine-details-prompt]');

    if (!section || !upperTypography || !lowerTypography || !prompt) {
      setLayout(invalidFineDetailsTypographyBandLayout);
      return;
    }

    const sectionRect = getSectionRect(section);
    const upperRect = getSectionRect(upperTypography);
    const lowerRect = getSectionRect(lowerTypography);
    const promptRect = getSectionRect(prompt);
    const isMobileComposition = sectionRect.width < FINE_DETAILS_DESKTOP_MIN_WIDTH;
    setLayout(
      getFineDetailsTypographyBandLayout({
        lowerTypographyTop: isMobileComposition ? sectionRect.bottom - 32 : lowerRect.top,
        maximumHeight: isMobileComposition
          ? sectionRect.width * 0.72
          : FINE_DETAILS_MAX_IMAGE_HEIGHT,
        sectionTop: sectionRect.top,
        sectionWidth: sectionRect.width,
        textGap,
        upperTypographyBottom: isMobileComposition ? promptRect.bottom + 24 : upperRect.bottom,
      }),
    );
  }, [measurementKey, textGap]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const section = root?.closest<HTMLElement>('[data-fine-details-section]');
    const upperTypography = section?.querySelector<HTMLElement>(
      '[data-fine-details-upper-left-typography]',
    );
    const lowerTypography = section?.querySelector<HTMLElement>(
      '[data-fine-details-lower-right-typography]',
    );
    const prompt = section?.querySelector<HTMLElement>('[data-fine-details-prompt]');

    measure();
    window.addEventListener('resize', measure);

    const observer = new ResizeObserver(measure);
    if (section) observer.observe(section);
    if (upperTypography) observer.observe(upperTypography);
    if (lowerTypography) observer.observe(lowerTypography);
    if (prompt) observer.observe(prompt);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  return { layout, rootRef };
}
