import { useEffect, useState } from 'react';
import { useToolcraftPipeline } from '@/toolcraft/runtime/react';
import { createIcebergEngine } from './iceberg-engine';
import { icebergPipeline } from './iceberg-pipeline';
import type { IcebergEngine } from './iceberg-render-types';

export function useIcebergEngine(canvas: HTMLCanvasElement | null) {
  const pipeline = useToolcraftPipeline();
  const [engine, setEngine] = useState<IcebergEngine | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (!canvas || !pipeline) return;
    let active = true;
    const pass = icebergPipeline.getPass('resources');
    const acquire = () => pipeline.runPass(pass, { surface: 'iceberg' }, context =>
      context.getOrCreateResource(['iceberg'], () => createIcebergEngine(canvas), value => value.dispose()));
    void (async () => {
      let result = await acquire();
      if (result.canvas !== canvas) {
        await pipeline.invalidatePass(pass).cleanup;
        result = await acquire();
      }
      if (active) setEngine(result);
    })().catch(cause => {
      if (active) setError(new Error('Unable to create the 3D scene. This app requires WebGL.', { cause }));
    });
    return () => { active = false; };
  }, [canvas, pipeline]);
  if (error) throw error;
  return engine?.canvas === canvas ? engine : null;
}
