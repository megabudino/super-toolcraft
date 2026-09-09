import { useMemo, useRef, type CSSProperties, type PropsWithChildren } from 'react';
import { HeroViewportContext } from './viewport-context';
import theme from './site-styles.module.css';
import styles from './surface.module.css';

export function HeroSurface({ children, width, height, style, animationSuspended = false }: PropsWithChildren<{
  width: number;
  height: number;
  style?: CSSProperties;
  animationSuspended?: boolean;
}>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewport = useMemo(() => ({ width, height, scrollRef, animationSuspended }), [width, height, animationSuspended]);
  return (
    <HeroViewportContext.Provider value={viewport}>
      <div className={styles.viewport} ref={scrollRef} data-percents-native-section=""
        style={{ width, height, '--hero-vw': `${width / 100}px`, '--hero-vh': `${height / 100}px` } as CSSProperties}>
        <div className={theme.siteRoot} data-toolcraft-hero-preview="" style={style}>
          {children}
        </div>
      </div>
    </HeroViewportContext.Provider>
  );
}
