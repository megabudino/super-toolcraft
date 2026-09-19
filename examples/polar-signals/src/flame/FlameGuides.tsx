import { useRef, type PointerEvent } from 'react';
import { useToolcraftDispatch, useToolcraftPipelinePass } from '@/toolcraft/runtime/react';
import { moveEnvelope } from './flame-geometry';
import { handlesPass } from './flame-pipeline';
import type { EnvelopeLine, FlameSettings } from './flame-defaults';
import styles from './flame.module.css';

type Drag = { line: EnvelopeLine; index: number; pointerId: number; historyGroup: string };
export function FlameGuides({ settings, width, height, zoom }: { settings: FlameSettings; width: number; height: number; zoom: number }) {
  const dispatch = useToolcraftDispatch();
  const drag = useRef<Drag | null>(null);
  const sequence = useRef(0);
  const svg = useRef<SVGSVGElement>(null);
  useToolcraftPipelinePass(handlesPass, { envelopes: JSON.stringify(settings.envelopes), layout: settings.layout }, () => JSON.stringify(settings.envelopes));
  const lines: EnvelopeLine[] = settings.layout === 'center' ? ['top', 'mid', 'bottom'] : ['bottom'];
  function start(event: PointerEvent<SVGCircleElement>, line: EnvelopeLine, index: number) {
    if (event.button !== 0 || event.altKey || event.metaKey || event.ctrlKey) return;
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { line, index, pointerId: event.pointerId, historyGroup: `flame-guide-${++sequence.current}` };
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    const matrix = svg.current?.getScreenCTM();
    if (!active || !matrix || event.pointerId !== active.pointerId) return;
    event.preventDefault(); event.stopPropagation();
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    dispatch({ type: 'controls.setValue', target: 'flame.envelopes', value: moveEnvelope(settings, active.line, active.index, point.y / height), history: 'merge', historyGroup: active.historyGroup, label: 'Move flame envelope' });
  }
  function end(event: PointerEvent<SVGCircleElement>) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <svg data-toolcraft-canvas-handle="" ref={svg} className={styles.guides} viewBox={`0 0 ${width} ${height}`} data-testid="flame-guides" onPointerMove={move}>
    {lines.map(line => <g key={line} data-flame-line={line}>
      <path className={styles.guidePath} opacity={0.6} d={`M ${settings.envelopes[line].map((y, i) => `${i / 6 * width},${y * height}`).join(' L ')}`} strokeDasharray={line === 'mid' ? undefined : '4 4'} />
      {settings.envelopes[line].map((y, index) => <circle key={index}
        className={styles.handle} fill="var(--primary)" stroke="var(--background)" data-toolcraft-canvas-handle="" data-testid={`flame-${line}-${index}`} aria-label={`${line} envelope point ${index + 1}`}
        cx={index / 6 * width} cy={y * height} r={6 * 100 / zoom}
        onPointerDown={event => start(event, line, index)} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={() => { drag.current = null; }} />)}
    </g>)}
  </svg>;
}
