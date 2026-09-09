import { createContext, useContext, type CSSProperties, type PropsWithChildren } from 'react';
import styles from './reference-styles.module.css';
import frame from './reference-surface.module.css';

const SectionViewport = createContext({ width: 1920, height: 1080 });
export const useSectionViewport = () => useContext(SectionViewport);

/** The canvas is the section's viewport. Editor zoom remains outside this boundary. */
export function ReferenceSurface({ children, width, height }: PropsWithChildren<{
  width: number;
  height: number;
}>) {
  return (
    <SectionViewport.Provider value={{ width, height }}>
      <div className={frame.viewport} style={{ width, height,
        '--reference-vw': `${width / 100}px`, '--reference-vh': `${height / 100}px`,
      } as CSSProperties} data-recraft-native-section="">
        <div className={styles.siteRoot} data-recraft-site-root="" onPointerDown={event => {
          // Section drag/input owns the primary pointer; editor pan remains on the backdrop.
          if (event.button === 0) event.stopPropagation();
        }}>{children}</div>
      </div>
    </SectionViewport.Provider>
  );
}
