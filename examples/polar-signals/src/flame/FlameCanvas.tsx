import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useToolcraftPipelinePass, useToolcraftProductSceneFrame, useToolcraftSelector, useToolcraftValue } from '@/toolcraft/runtime/react';
import { readFlameSettings } from './flame-defaults';
import { FlameRasterClient } from './flame-raster-client';
import { rasterPass } from './flame-pipeline';
import { FlameGuides } from './FlameGuides';
import styles from './flame.module.css';

export function FlameCanvas() {
  const frame = useToolcraftProductSceneFrame();
  const values = useToolcraftSelector(state => state.values);
  const zoom = useToolcraftSelector(state => state.canvas.zoom);
  const renderScale = Number(useToolcraftValue('canvas.renderScale') ?? 2);
  const [dpr, setDpr] = useState(() => window.devicePixelRatio || 1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = useMemo(() => readFlameSettings(values), [values]);
  const rect = frame.kind === 'ready' ? frame.rect : null;
  const backingWidth = Math.max(1, Math.round((rect?.width ?? 1) * zoom / 100 * dpr * renderScale));
  const backingHeight = Math.max(1, Math.round((rect?.height ?? 1) * zoom / 100 * dpr * renderScale));
  const request = JSON.stringify({ settings, width: rect?.width, height: rect?.height, backingWidth, backingHeight });
  const currentRequest = useRef(request);
  useLayoutEffect(() => { currentRequest.current = request; }, [request]);
  const pixels = useToolcraftPipelinePass(rasterPass, { request }, async execution => {
    if (!rect) return null;
    const worker = await execution.getOrCreateResource(['flame'], () => new FlameRasterClient(), client => client.dispose());
    const bitmap = await worker.render({ settings, width: rect.width, height: rect.height, backingWidth, backingHeight });
    if (!bitmap) return null;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    try {
      if (!canvas || !context || currentRequest.current !== request) return null;
      // Resizing clears canvas pixels. Commit size and pixels together only
      // after the worker finishes, keeping the previous frame visible meanwhile.
      if (canvas.width !== backingWidth) canvas.width = backingWidth;
      if (canvas.height !== backingHeight) canvas.height = backingHeight;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, backingWidth, backingHeight);
      context.drawImage(bitmap, 0, 0);
      return request;
    } finally { bitmap.close(); }
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => setDpr(window.devicePixelRatio || 1));
    observer.observe(canvas, { box: 'device-pixel-content-box' });
    return () => observer.disconnect();
  }, [Boolean(rect)]);
  if (!rect) return null;
  return <div className={styles.scene}>
    <canvas ref={canvasRef}
      className={styles.output} data-testid="flame-output" data-toolcraft-product-output=""
      data-frame-ready={pixels.status === 'success' && pixels.result === request ? 'true' : 'false'}
      data-render-status={pixels.status} aria-label="Flame graph artwork" />
    <FlameGuides settings={settings} width={rect.width} height={rect.height} zoom={zoom} />
  </div>;
}
