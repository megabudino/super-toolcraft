import { Color, DoubleSide, Mesh, NoToneMapping, OrthographicCamera, RGBAFormat, Scene, ShaderMaterial, type IUniform, UnsignedByteType, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import type { ToolcraftProductExportFrameContext } from '@/toolcraft/runtime';
import { icebergParameters, type IcebergSettings } from './iceberg-controls';
import type { IcebergEngine, IcebergPose } from './iceberg-render-types';
import { icebergFragmentShader, icebergVertexShader } from './iceberg-shaders';
import { createIcebergTopology } from './iceberg-topology';
import { configureIcebergCamera } from './iceberg-camera';
import { getIcebergPlateThickness } from './iceberg-plates';

export function createIcebergEngine(canvas: HTMLCanvasElement): IcebergEngine {
  const renderer=new WebGLRenderer({ canvas, alpha:true, antialias:true, preserveDrawingBuffer:true });
  renderer.setClearColor(0,0); renderer.toneMapping=NoToneMapping;
  const scene=new Scene();
  const camera=new OrthographicCamera(-2.5,2.5,3.5,-3.5,0.01,100);
  const uniforms: Record<string, IUniform> =Object.fromEntries(icebergParameters.map(p=>[`u${p.key[0].toUpperCase()}${p.key.slice(1)}`,{value:p.value}]));
  uniforms.uRockColor={value:new Color('#D9DDE0')};
  uniforms.uIceColor={value:new Color('#F0F1F2')};
  uniforms.uViewDirection={value:new Vector3()};
  uniforms.uEngravingEnabled={value:false};
  uniforms.uPlateThickness={value:0};
  const material=new ShaderMaterial({ vertexShader:icebergVertexShader, fragmentShader:icebergFragmentShader, uniforms, side:DoubleSide });
  const geometry=createIcebergTopology();
  const mesh=new Mesh(geometry,material); mesh.frustumCulled=false; scene.add(mesh);
  let lastSettings:IcebergSettings|null=null, lastPose:IcebergPose|null=null;
  function configure(settings:IcebergSettings,pose:IcebergPose) {
    for(const p of icebergParameters) uniforms[`u${p.key[0].toUpperCase()}${p.key.slice(1)}`].value=settings[p.key];
    (uniforms.uRockColor.value as Color).set(settings.rockColor);
    (uniforms.uIceColor.value as Color).set(settings.iceColor);
    uniforms.uEngravingEnabled.value=settings.engravingEnabled;
    uniforms.uPlateThickness.value=getIcebergPlateThickness(settings);
    (uniforms.uViewDirection.value as Vector3).set(pose.position[0],pose.position[1],pose.position[2]).normalize();
    configureIcebergCamera(camera,settings,pose);
  }
  function draw(settings:IcebergSettings,pose:IcebergPose,width:number,height:number) {
    lastSettings=settings; lastPose=pose;
    configure(settings,pose);
    if(canvas.width!==width||canvas.height!==height) renderer.setSize(width,height,false);
    renderer.setRenderTarget(null); renderer.render(scene,camera);
  }
  function hitTest(clientX:number,clientY:number):boolean {
    const rect=canvas.getBoundingClientRect();
    const x=Math.floor((clientX-rect.left)/rect.width*canvas.width);
    const y=Math.floor((rect.bottom-clientY)/rect.height*canvas.height);
    if(x<0||y<0||x>=canvas.width||y>=canvas.height) return false;
    const gl=renderer.getContext(), pixel=new Uint8Array(4);
    gl.readPixels(x,y,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
    return pixel[3]>127;
  }
  async function exportFrame(settings:IcebergSettings,pose:IcebergPose,request:ToolcraftProductExportFrameContext) {
    request.signal.throwIfAborted();
    const width=Math.max(1,Math.round(request.frame.width*request.pixelRatio));
    const height=Math.max(1,Math.round(request.frame.height*request.pixelRatio));
    const target=new WebGLRenderTarget(width,height,{format:RGBAFormat,type:UnsignedByteType,depthBuffer:true});
    try {
      configure(settings,pose); renderer.setRenderTarget(target); renderer.render(scene,camera);
      const pixels=new Uint8Array(width*height*4); renderer.readRenderTargetPixels(target,0,0,width,height,pixels);
      const flipped=new Uint8ClampedArray(pixels.length);
      for(let row=0;row<height;row++) flipped.set(pixels.subarray((height-row-1)*width*4,(height-row)*width*4),row*width*4);
      const bitmap=await createImageBitmap(new ImageData(flipped,width,height));
      try { request.signal.throwIfAborted(); request.context.drawImage(bitmap,request.frame.x,request.frame.y,request.frame.width,request.frame.height); }
      finally { bitmap.close(); }
    } finally {
      renderer.setRenderTarget(null); target.dispose();
      if(lastSettings&&lastPose) { configure(lastSettings,lastPose); renderer.render(scene,camera); }
    }
  }
  return {canvas,draw,hitTest,exportFrame,dispose:()=>{ geometry.dispose(); material.dispose(); renderer.dispose(); renderer.forceContextLoss(); }};
}
