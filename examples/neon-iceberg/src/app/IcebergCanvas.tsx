import { useEffect, useRef, useState } from 'react';
import { useToolcraftModelOrbitInteraction, useToolcraftPipeline, useToolcraftProductSceneFrame, useToolcraftSelector, useToolcraftViewportInteractionActive } from '@/toolcraft/runtime/react';
import { readAnimatedIcebergSettings, type IcebergAnimationTimeline } from './iceberg-animation';
import { orientationDefault } from './iceberg-controls';
import { icebergPipeline, icebergRenderTargets } from './iceberg-pipeline';
import type { IcebergEngine, IcebergPose } from './iceberg-render-types';
import { useIcebergEngine } from './useIcebergEngine';
import styles from './IcebergCanvas.module.css';

const previewTargets = [...icebergRenderTargets, 'canvas.renderScale'];
export function IcebergCanvas() {
  const [canvas,setCanvas]=useState<HTMLCanvasElement|null>(null);
  const frame=useToolcraftProductSceneFrame();
  const pipeline=useToolcraftPipeline();
  const values=useToolcraftSelector(s=>s.values,(a,b)=>previewTargets.every(target=>a[target]===b[target]));
  const timeline=useToolcraftSelector<IcebergAnimationTimeline>(s=>({
    currentTimeSeconds:s.timeline.currentTimeSeconds,
    durationSeconds:s.timeline.durationSeconds,
    isLooping:s.timeline.isLooping,
  }),(a,b)=>a.currentTimeSeconds===b.currentTimeSeconds&&a.durationSeconds===b.durationSeconds&&a.isLooping===b.isLooping);
  const zoom=useToolcraftSelector(s=>s.canvas.zoom);
  const viewportInteractionActive=useToolcraftViewportInteractionActive();
  const [orbitInteractionActive,setOrbitInteractionActive]=useState(false);
  const frozenTimelineRef=useRef(timeline);
  const interactionActive=viewportInteractionActive||orbitInteractionActive;
  if(!interactionActive) frozenTimelineRef.current=timeline;
  const renderedTimeline=interactionActive?frozenTimelineRef.current:timeline;
  const [dpr,setDpr]=useState(()=>window.devicePixelRatio||1);
  const engineRef=useRef<IcebergEngine|null>(null);
  const engine=useIcebergEngine(canvas);
  engineRef.current=engine;
  const interaction=useToolcraftModelOrbitInteraction<HTMLCanvasElement>({ target:'view.orbit', hitTest:(x,y)=>engineRef.current?.hitTest(x,y)??false });
  useEffect(()=> {
    const update=()=>setDpr(window.devicePixelRatio||1);
    window.addEventListener('resize',update); return ()=>window.removeEventListener('resize',update);
  },[]);
  useEffect(()=> {
    if(!engine||!pipeline||frame.kind!=='ready') return;
    const scale=Number(values['canvas.renderScale']??2)*(zoom/100)*dpr;
    void pipeline.runPass(icebergPipeline.getPass('preview'),undefined,()=> {
      engine.draw(readAnimatedIcebergSettings(values,renderedTimeline),(values['view.orbit']??orientationDefault) as IcebergPose,Math.max(1,Math.round(frame.rect.width*scale)),Math.max(1,Math.round(frame.rect.height*scale)));
    });
  },[engine,pipeline,values,renderedTimeline,zoom,dpr,frame.kind,frame.kind==='ready'?frame.rect.width:0,frame.kind==='ready'?frame.rect.height:0]);
  return <canvas ref={setCanvas} className={styles.canvas} data-iceberg-canvas="" data-canvas-model-layer="iceberg" data-toolcraft-model-orbit-surface="true" data-toolcraft-product-output="" aria-label="3D iceberg"
    onPointerDown={event=>{interaction.onPointerDown(event);if(event.currentTarget.hasPointerCapture(event.pointerId)) setOrbitInteractionActive(true);}}
    onPointerMove={interaction.onPointerMove}
    onPointerUp={event=>{interaction.onPointerUp(event);setOrbitInteractionActive(false);}}
    onPointerCancel={event=>{interaction.onPointerCancel(event);setOrbitInteractionActive(false);}}
    onLostPointerCapture={event=>{interaction.onLostPointerCapture(event);setOrbitInteractionActive(false);}}
  />;
}
