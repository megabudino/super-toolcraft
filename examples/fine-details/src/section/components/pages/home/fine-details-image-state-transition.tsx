'use client';

import { referenceClasses } from '@/section/reference/reference-classes';
import { AnimatePresence, domAnimation, LazyMotion, m, useReducedMotion } from 'motion/react';

import type { FineDetailsCarouselAsset } from './fine-details-carousel-assets';
import { FineDetailsImageRenderer } from './fine-details-image-renderer';
import type { FineDetailsSettings } from './fine-details-settings';

interface FineDetailsImageStateTransitionProps {
  carouselAssets?: readonly FineDetailsCarouselAsset[];
  carouselMeasurementKey: string;
  settings: FineDetailsSettings;
}

export function FineDetailsImageStateTransition({
  carouselAssets,
  carouselMeasurementKey,
  settings,
}: FineDetailsImageStateTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const duration = shouldReduceMotion ? 0 : settings.imagesMode === 'carousel' ? 0.35 : 0.25;

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false} mode="sync" presenceAffectsLayout={false}>
        <m.div
          animate={{ opacity: 1 }}
          className={referenceClasses("pointer-events-none absolute inset-0 z-[5]")}
          data-fine-details-image-state={settings.imagesMode}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key={settings.imagesMode}
          transition={{ duration, ease: 'easeOut' }}
        >
          <FineDetailsImageRenderer
            carouselAssets={carouselAssets}
            carouselMeasurementKey={carouselMeasurementKey}
            settings={settings}
          />
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}
