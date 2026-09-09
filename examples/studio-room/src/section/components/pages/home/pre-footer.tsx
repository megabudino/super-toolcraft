import { referenceClasses } from '@/section/reference/reference-classes';
import NextLink from '@/section/reference/reference-link';
import type { CSSProperties } from 'react';
import { lazy, Suspense } from 'react';

import { appliedStudioRoomSettings, type StudioRoomSettings } from './studio-room-settings';
import styles from './pre-footer.module.css';

const AnimatedPreFooterRoom = lazy(
  () => import('./pre-footer-room').then((module) => ({ default: module.PreFooterRoom })),
);

interface PreFooterProps {
  settings?: StudioRoomSettings;
}

type PreFooterStyle = CSSProperties & {
  '--studio-room-desktop-height': string;
};

type CenterCompositionStyle = CSSProperties & {
  '--button-gap': string;
  '--first-row-gap': string;
  '--first-row-size': string;
  '--line-gap': string;
  '--second-row-size': string;
};

export default function PreFooter({ settings = appliedStudioRoomSettings }: PreFooterProps) {
  const firstRowScale = settings.composition.firstRowScale / 100;
  const secondRowScale = settings.composition.secondRowScale / 100;
  const compositionStyle = {
    '--button-gap': `${settings.composition.buttonGap}px`,
    '--first-row-gap': `${17.102 * firstRowScale}px`,
    '--first-row-size': `${96 * firstRowScale}px`,
    '--line-gap': `${settings.composition.lineGap}px`,
    '--second-row-size': `${128 * secondRowScale}px`,
  } as CenterCompositionStyle;

  return (
    <section
      id="pre-footer-room"
      aria-labelledby="pre-footer-title"
      className={referenceClasses(`${styles.section} overflow-hidden bg-[#f1f6de]`)}
      style={{ '--studio-room-desktop-height': `${settings.height}px` } as PreFooterStyle}
    >
      <Suspense fallback={null}>
        <AnimatedPreFooterRoom settings={settings}>
          <div className={referenceClasses(styles.centerComposition)} style={compositionStyle}>
            <h2 id="pre-footer-title" className={referenceClasses(styles.compositionTitle)}>
              <span className={referenceClasses(styles.desktopTitle)}>
                <span className={referenceClasses(styles.firstRow)}>
                  <span className={referenceClasses(styles.firstRowAccent)}>Try</span>
                  <span className={referenceClasses(styles.firstRowAccent)}>In</span>
                  <span
                    className={referenceClasses(`${styles.firstRowBrand} font-display-condensed-upright font-black`)}
                  >
                    Recraft
                  </span>
                </span>
                <span className={referenceClasses(`${styles.secondRow} font-display-expanded-italic font-black`)}>
                  Studio
                </span>
              </span>
            </h2>
            <NextLink
              className={styles.compositionButton}
              href="https://www.recraft.ai/auth/login?callbackUrl=%2F"
            >
              Try it for Free
            </NextLink>
          </div>
        </AnimatedPreFooterRoom>
      </Suspense>
    </section>
  );
}
