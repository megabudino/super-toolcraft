import { composeToolcraftApp } from '@/toolcraft/runtime/react';
import { appSchema } from './app-schema';
import { IcebergCanvas } from './IcebergCanvas';
import { readAnimatedIcebergSettings } from './iceberg-animation';
import { getIcebergSceneRect } from './iceberg-camera';
import { icebergPipeline } from './iceberg-pipeline';
import { orientationDefault, readIcebergSettings } from './iceberg-controls';
import { handleIcebergPanelAction } from './iceberg-settings-export';
import type { IcebergPose } from './iceberg-render-types';
export const appComposition=composeToolcraftApp(appSchema,{
  actions:{onPanelAction:handleIcebergPanelAction},
  renderer:{pipelineRegistration:icebergPipeline},
  scene:{
    canvasContent:<IcebergCanvas/>, renderDefaultCanvasMedia:false,
    sceneBoundsProvider:({state})=>[getIcebergSceneRect(readIcebergSettings(state.values),(state.values['view.orbit']??orientationDefault) as IcebergPose)],
    rasterFrameRenderer:{baseFileName:'iceberg',renderFrame:async request=>{
      if(!request.rendererPipeline) throw new Error('Iceberg renderer is unavailable.');
      const resource=request.rendererPipeline.getSnapshot();
      if(!resource.passes.resources?.activeResources) throw new Error('Wait for the iceberg preview to finish loading.');
      // The retained scene owns the WebGL context; export allocates only a GPU target.
      const engine=await request.rendererPipeline.runPass(icebergPipeline.getPass('resources'),{surface:'iceberg'},context=>context.getOrCreateResource(['iceberg'],()=>{throw new Error('Iceberg preview is not ready.');},value=>value.dispose()));
      await request.rendererPipeline.runPass(icebergPipeline.getPass('export'),undefined,()=>engine.exportFrame(readAnimatedIcebergSettings(request.state.values,request.state.timeline),(request.state.values['view.orbit']??orientationDefault) as IcebergPose,request));
    }},
  },
});
