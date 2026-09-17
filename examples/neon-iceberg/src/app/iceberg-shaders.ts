import { icebergSidePatternsGLSL } from './iceberg-side-patterns';
import { icebergPlanePatternGLSL } from './iceberg-plane-pattern';
import { icebergEngravingGLSL } from './iceberg-engraving';
import { ICEBERG_SEGMENTS } from './iceberg-topology-settings';
import { ICEBERG_PLATE_COUNT } from './iceberg-plates';

export const icebergFieldGLSL = /* glsl */`
uniform float uHeight, uWidth, uSharpness, uAsymmetry, uShoulder, uSeed;
uniform float uRidges, uFrequency, uErosion, uDetail;
uniform float uDepth, uSeamLevel, uSeamVariation, uSeamFrequency, uCliff;
uniform float uSeamValley, uSeamPhase, uSeamWarp, uSeamTerraces;
float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise2(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p) { return noise2(p)*0.53+noise2(p*2.07+8.1)*0.27+noise2(p*4.13+19.3)*0.13+noise2(p*8.17+2.4)*0.07; }
float angularNoise(vec2 p) {
  vec2 i=floor(p), f=fract(p);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}
float polarAngle(vec2 p) {
  // Keep axis vertices (including the origin) out of atan's undefined input.
  return p.x==0.0 ? sign(p.y)*1.57079632679 : atan(p.y,p.x);
}
float seam(vec2 p) {
  vec2 s=vec2(uSeed*1.13,uSeed*0.71);
  // Warp the coordinates, so nested cuts have unequal shoulders and widths.
  vec2 warp=vec2(noise2(p*1.65+s),noise2(p*2.1+s+vec2(8.4,3.7)))-0.5;
  vec2 q=p+warp*uSeamWarp*0.58;
  float angle=polarAngle(p);
  float bentAngle=angle+uSeamWarp*(warp.x*1.6+sin(angle*3.0+uSeed)*0.18);
  float bay=pow(smoothstep(-0.65,0.96,cos(bentAngle-radians(uSeamPhase))),1.55);
  // The angular excavation has no direction at the center of the height field.
  bay*=smoothstep(0.0,0.15,length(p));
  // Unequally spaced shelves sit inside the broad excavation.
  float shelves=0.24*smoothstep(0.12,0.21,bay)
               +0.33*smoothstep(0.38,0.49,bay)
               +0.43*smoothstep(0.73,0.88,bay);
  float excavation=mix(bay,shelves,uSeamTerraces*0.8);
  vec2 cutCoords=q*uSeamFrequency*0.48+s;
  float cuts=noise2(cutCoords);
  float cutSteps=0.55*smoothstep(0.26,0.36,cuts)+0.45*smoothstep(0.62,0.76,cuts);
  cuts=mix(cuts,cutSteps,uSeamTerraces);
  vec2 nestedCoords=cutCoords*2.37+vec2(cuts*2.1,warp.y*3.0);
  float nested=mix(noise2(nestedCoords),angularNoise(nestedCoords),uSeamWarp);
  float chips=angularNoise(cutCoords*5.13+vec2(nested*1.7,0.0));
  float fracture=(cuts*0.58+nested*0.28+chips*0.14)*2.0-1.0;
  // Limit the large excavation first, preserving the small cuts in deep bays.
  float clearance=max(0.12,uSeamLevel+uDepth-0.12);
  float floorLevel=uSeamLevel-clearance;
  float height=uSeamLevel-clearance*(1.0-exp(-uSeamValley*excavation/clearance))+uSeamVariation*fracture;
  float cushion=min(0.16,clearance*0.25);
  return height<floorLevel+cushion
    ? floorLevel+cushion*exp((height-floorLevel-cushion)/cushion)
    : height;
}
float terrain(vec2 p,float boundary) {
  vec2 peak=vec2(uAsymmetry*0.42,-uAsymmetry*0.18);
  vec2 q=p-peak;
  vec2 extent=vec2(q.x>0.0?1.0-peak.x:1.0+peak.x,q.y>0.0?1.0-peak.y:1.0+peak.y);
  float d=clamp(max(abs(q.x)/extent.x,abs(q.y)/extent.y),0.0,1.0);
  float radius=length(q);
  float angle=polarAngle(q);
  vec2 ns=vec2(uSeed*0.83,uSeed*1.29);
  float warp=fbm(p*3.0+ns);
  // Each integer harmonic closes around the mountain. Blend their heights
  // for fractional frequencies; multiplying the angle by a fractional count
  // creates a height jump at -PI / PI and a thin vertical fin in the mesh.
  float frequency=floor(uFrequency), phase=warp*2.8+radius*1.1;
  float lowerFolds=pow(abs(sin(angle*frequency*0.5+phase)),1.4);
  float upperFolds=pow(abs(sin(angle*(frequency+1.0)*0.5+phase)),1.4);
  float folds=mix(lowerFolds,upperFolds,fract(uFrequency));
  float ridgeShape=1.0-uRidges*folds*smoothstep(0.025,0.28,radius);
  float mainPeak=pow(max(0.0,1.0-d),uSharpness)*uHeight*ridgeShape;
  float sideDistance=length((p-vec2(-0.46,0.08))*vec2(1.0,1.2));
  float sidePeak=pow(max(0.0,1.0-sideDistance/0.65),1.35)*uHeight*uShoulder;
  // The shoulder's support reaches beyond the square. Taper only its outer
  // strip so the cap meets the wall at the exact same seam height.
  sidePeak*=smoothstep(0.0,0.12,1.0-d);
  float mountain=max(mainPeak,sidePeak);
  float envelope=sin(min(d,1.0-d)*3.14159265);
  mountain+=uCliff*pow(max(0.0,envelope),0.35)*(0.55+0.45*warp);
  mountain+=(fbm(p*15.0+ns)*2.0-1.0)*uErosion*envelope;
  mountain+=(noise2(p*52.0+ns)-0.5)*uDetail*0.12*envelope;
  return uSeamLevel+(boundary-uSeamLevel)*pow(d,2.5)+max(0.0,mountain);
}
`;
export const icebergVertexShader = /* glsl */`
${icebergFieldGLSL}
attribute float region;
attribute float slice;
uniform float uPlateGap, uPlateThickness;
varying float vSlice;
varying float vPrintY;
varying vec3 vWorld;
varying float vRegion;
varying float vSeamDistance;
varying vec3 vBoundaryNormal;
varying vec3 vIceNormal;
vec3 boundaryNormal(vec2 edge) {
  // Sample the same inner rock slope for cap and wall vertices. This carries
  // the relief's lighting through a material cut without displacing geometry.
  float e=1.0/${ICEBERG_SEGMENTS}.0;
  vec2 c=edge*(1.0-e);
  vec2 dx=vec2(e,0.0), dz=vec2(0.0,e);
  float hx=terrain(c+dx,seam(c+dx))-terrain(c-dx,seam(c-dx));
  float hz=terrain(c+dz,seam(c+dz))-terrain(c-dz,seam(c-dz));
  return normalize(vec3(-hx,e*uWidth,-hz));
}
void main() {
  vec3 p=position;
  vec2 ground=p.xz;
  float radius=max(abs(ground.x),abs(ground.y));
  vec2 edge=ground/max(0.0001,radius);
  float boundary=seam(ground);
  float bottom=uPlateGap>0.0?-uDepth+${ICEBERG_PLATE_COUNT}.0*uPlateThickness:-uDepth;
  if(slice<${ICEBERG_PLATE_COUNT}.0) p.y=-uDepth+(slice+position.y)*uPlateThickness;
  else if(region<0.5) p.y=terrain(ground,boundary);
  else if(region<1.5) p.y=mix(bottom,boundary,position.y);
  else p.y=bottom;
  vSeamDistance=p.y-boundary;
  if(region<0.5) {
    // Distance to the physical perimeter, not an interior height-field contour.
    vSeamDistance=length(vec3((ground-edge)*uWidth*0.5,p.y-seam(edge)));
  }
  vBoundaryNormal=boundaryNormal(edge);
  vIceNormal=abs(edge.x)>=abs(edge.y)?vec3(sign(edge.x),0,0):vec3(0,0,sign(edge.y));
  p.xz*=uWidth*0.5;
  vWorld=p; vRegion=region; vSlice=slice;
  // Print and grain stay in the unsplit material coordinates. Only geometry
  // translates, so the grid travels with each rigid plate.
  p.y+=(slice-${ICEBERG_PLATE_COUNT}.0)*uPlateGap;
  vec4 viewPosition=modelViewMatrix*vec4(p,1.0);
  gl_Position=projectionMatrix*viewPosition;
  // Printing scale/phase stays fixed when the render frame grows around it.
  vPrintY=viewPosition.y/7.0+0.5;
}
`;
export const icebergFragmentShader = /* glsl */`
${icebergFieldGLSL}
uniform vec3 uRockColor, uIceColor;
uniform float uPlateGap, uPlateThickness;
varying float vSlice;
uniform float uContrast, uGrain, uLight, uLightDrama, uSeamJagged, uSeamScale;
varying vec3 vWorld;
varying float vRegion;
varying float vSeamDistance;
varying vec3 vBoundaryNormal;
varying vec3 vIceNormal;
float grain3(vec3 p) { return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
${icebergSidePatternsGLSL}
${icebergPlanePatternGLSL}
${icebergEngravingGLSL}
float edgeRockMask() {
  float original=vRegion<0.5?1.0:0.0;
  // This setting changes only the material contour, never vertex heights.
  float band=uSeamJagged*uSeamScale*0.10;
  float aa=clamp(fwidth(vSeamDistance)*0.4,0.0001,0.008);
  if(band<=0.0||abs(vSeamDistance)>=band||vRegion>1.5||vSlice<${ICEBERG_PLATE_COUNT}.0) return original;
  // A two-dimensional, world-anchored cut pattern creates lateral notches too.
  vec2 q=vec2(vWorld.x*19.0+vWorld.z*23.0,vWorld.y*27.0)/uSeamScale+uSeed;
  vec2 warp=vec2(noise2(q*0.81+7.1),noise2(q*0.91+19.4))-0.5;
  float cuts=(angularNoise(q+warp*2.0)-0.5)*1.2;
  cuts+=(angularNoise(q*2.7+warp)-0.5)*0.42;
  float distance=vSeamDistance+band*cuts;
  return smoothstep(-aa,aa,distance);
}
void main() {
  // At zero keep the original unsplit topology's output, including its bottom.
  if(uPlateGap<=0.0&&vSlice<${ICEBERG_PLATE_COUNT}.0) discard;
  vec3 n=normalize(cross(dFdx(vWorld),dFdy(vWorld)));
  if(!gl_FrontFacing) n=-n;
  float a=radians(uLight);
  // Lower the key light and remove fill together, so drama reveals facet
  // direction instead of merely darkening the whole image. Zero is the
  // original lighting, including its azimuth and ambient contribution.
  vec3 softLight=vec3(cos(a)*1.5,2.6,-sin(a)*0.65);
  vec3 sideLight=vec3(cos(a)*1.5,0.7,-sin(a)*0.65);
  vec3 light=normalize(mix(softLight,sideLight,uLightDrama));
  float band=uSeamJagged*uSeamScale*0.10;
  float join=band>0.0&&abs(vSeamDistance)<band&&vRegion<1.5
    ? (1.0-smoothstep(0.0,band,max(0.0,vSeamDistance)))*smoothstep(0.0,0.15,uSeamJagged)
    : 0.0;
  vec3 rockNormal=join>0.0?normalize(mix(n,normalize(vBoundaryNormal),join)):n;
  vec3 iceNormal=join>0.0&&vRegion<0.5?normalize(mix(n,normalize(vIceNormal),join)):n;
  float diffuse=max(0.0,dot(rockNormal,light));
  vec2 veins=vWorld.xz*7.5+vec2(vWorld.y*0.42,uSeed);
  float striation=fbm(veins+vec2(fbm(vWorld.xz*4.0+uSeed),0.0)*3.0);
  float micro=(noise2(vWorld.xz*90.0+vWorld.y*vec2(4,2))-0.5)*uDetail;
  float rockShade=mix(0.25,0.045,uLightDrama)
                 +pow(diffuse,mix(1.0,1.2,uLightDrama))*mix(0.95,1.65,uLightDrama);
  rockShade*=mix(0.55,1.2,smoothstep(0.25,0.72,striation+micro*0.3));
  rockShade=mix(rockShade,smoothstep(0.16,0.8,rockShade),uContrast);
  rockShade=engraveRock(rockShade);
  float iceShade=mix(0.57,0.38,uLightDrama)
                +max(0.0,dot(iceNormal,light))*mix(0.46,0.66,uLightDrama);
  float rockMask=edgeRockMask();
  iceShade*=1.0-0.93*cubePatternInk(vWorld,vRegion,rockMask,vSlice,uPlateGap,uPlateThickness);
  float planeInk=platePlaneLineInk(vWorld,vRegion,vSlice);
  vec3 tint=mix(uIceColor,uRockColor,rockMask);
  float shade=mix(iceShade,rockShade,rockMask);
  float grain=(grain3(floor(vWorld*1050.0))-0.5)*uGrain;
  shade=clamp(shade+grain*mix(0.65,1.1,rockMask),0.025,1.0);
  shade=platePlanePrintShade(shade,planeInk,grain,vRegion,vSlice);
  vec3 c=pow(tint,vec3(1.0/2.2))*shade;
  gl_FragColor=vec4(c,1.0);
}
`;
