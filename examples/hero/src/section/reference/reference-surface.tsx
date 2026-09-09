import type { CSSProperties, PropsWithChildren } from 'react';
import styles from './reference-styles.module.css';
import frame from './reference-surface.module.css';

/** The canvas is the section's viewport. Editor zoom remains outside this boundary. */
export function ReferenceSurface({ children, width, height }: PropsWithChildren<{
  width: number;
  height: number;
}>) {
  return (
    <div className={frame.viewport} style={{ width, height, '--reference-vw': `${width / 100}px`, '--reference-vh': `${height / 100}px` } as CSSProperties} data-recraft-native-section="">
      <div className={styles.siteRoot} data-recraft-site-root>{children}</div>
    </div>
  );
}
