import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useToolcraftProductSceneFrame, useToolcraftSelector } from '@/toolcraft/runtime/react';
import Header from '@/section/components/header';
import { HeroSection } from '@/section/components/pages/home/hero-section';
import { HeroSurface } from '@/section/reference/surface';
import { createHeroPreviewSettings } from './hero-preview-settings';
import { getHeroPreviewStyle } from './hero-preview-style';
import { HeroCanvas } from './renderer/hero-canvas';
import styles from './hero-website-preview.module.css';

export function HeroWebsitePreviewFrame({ width = 2400, height = 1200, values = {}, waveLayer, animationSuspended = false }: {
  width?: number;
  height?: number;
  values?: Readonly<Record<string, unknown>>;
  waveLayer?: ReactNode;
  animationSuspended?: boolean;
}) {
  const settings = useMemo(() => createHeroPreviewSettings(values), [values]);
  const style = useMemo(() => getHeroPreviewStyle(settings), [settings]);
  const stylesheetHrefs = [...new Set([settings.headingTypography, settings.right.leadTypography,
    settings.right.bodyTypography].flatMap(font => font.stylesheetHref ? [font.stylesheetHref] : []))];
  return (
    <div className={styles.preview} data-toolcraft-product-output="percents-hero-preview">
      {stylesheetHrefs.map(href => <link href={href} key={href} rel="stylesheet" />)}
      <div className={styles.baseLayer} data-testid="hero-base-layer" />
      {waveLayer && <div className={styles.waveLayer} data-testid="hero-wave-layer">{waveLayer}</div>}
      <div className={styles.foreground} data-testid="hero-native-foreground">
        <HeroSurface width={width} height={height} style={style} animationSuspended={animationSuspended}>
          <Header />
          <main><HeroSection isToolcraftPreview /></main>
        </HeroSurface>
      </div>
    </div>
  );
}

export function HeroWebsitePreview() {
  const frame = useToolcraftProductSceneFrame();
  const values = useToolcraftSelector(state => state.values, Object.is);
  const view = useToolcraftSelector(state => `${state.canvas.zoom}:${state.canvas.offset.x}:${state.canvas.offset.y}`, Object.is);
  const [animationSuspended, setAnimationSuspended] = useState(false);
  useEffect(() => {
    setAnimationSuspended(true);
    const timer = window.setTimeout(() => setAnimationSuspended(false), 140);
    return () => window.clearTimeout(timer);
  }, [view]);
  if (!frame.rect) return null;
  return <HeroWebsitePreviewFrame width={frame.rect.width} height={frame.rect.height}
    values={values} waveLayer={<HeroCanvas />} animationSuspended={animationSuspended} />;
}
