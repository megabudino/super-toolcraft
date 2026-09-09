import { createContext, useContext, useRef, type CSSProperties, type PropsWithChildren, type RefObject } from 'react';
import styles from './reference-styles.module.css';
import frame from './reference-surface.module.css';

const SectionViewport = createContext<{
  width: number;
  height: number;
  viewportRef?: RefObject<HTMLDivElement | null>;
}>({ width: 1920, height: 1080 });
export const useSectionViewport = () => useContext(SectionViewport);

/** The canvas is the section's viewport. Editor zoom remains outside this boundary. */
export function ReferenceSurface({ children, width, height }: PropsWithChildren<{
  width: number;
  height: number;
}>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  return (
    <SectionViewport.Provider value={{ width, height, viewportRef }}>
      <div ref={viewportRef} className={frame.viewport} style={{ width, height,
        '--reference-vw': `${width / 100}px`, '--reference-vh': `${height / 100}px`,
      } as CSSProperties} data-recraft-native-section="">
        <div className={styles.siteRoot} data-recraft-site-root="" onPointerDown={event => {
          // Links keep their click behavior; the room background belongs to canvas pan.
          if (event.button === 0 && event.target instanceof Element &&
            event.target.closest('a, button, input, select, textarea')) event.stopPropagation();
        }}>{children}</div>
      </div>
    </SectionViewport.Provider>
  );
}
