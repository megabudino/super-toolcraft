import { ICEBERG_PLATE_COUNT } from './iceberg-plates';

export const icebergPlanePatternGLSL = /* glsl */`
uniform float uPlaneLineThickness, uPlaneLineDensity, uPlaneLineDirection;

float platePlaneLineInk(vec3 world, float region, float slice) {
  // Region 3 is the upward-facing face of each lower plate. Keep the mountain,
  // upper block and vertical grid on their existing materials.
  if(region<2.5||slice>=${ICEBERG_PLATE_COUNT}.0) return 0.0;

  // Rotate a world-space line basis, then bend its cross-axis coordinate with
  // low-frequency noise. This keeps a readable common direction while avoiding
  // mechanically straight stripes. Slice phase varies the four exposed prints.
  float angle=radians(uPlaneLineDirection);
  vec2 direction=vec2(cos(angle),sin(angle));
  vec2 acrossAxis=vec2(-direction.y,direction.x);
  vec2 q=world.xz/max(0.0001,uWidth);
  vec2 local=vec2(dot(q,direction),dot(q,acrossAxis));
  float slicePhase=uSeed*0.071+slice*8.41;
  vec2 warp=vec2(
    noise2(local*vec2(1.45,1.10)+vec2(slicePhase,11.3)),
    noise2(local*vec2(1.15,1.70)+vec2(19.7,slicePhase))
  )-0.5;
  float broad=noise2((local+warp*0.34)*vec2(2.35,1.75)+vec2(slicePhase,7.1))-0.5;
  float detail=noise2((local+warp*0.16)*vec2(6.2,3.8)+vec2(23.4,slicePhase))-0.5;
  float displacement=broad*0.24+detail*0.065;
  float density=clamp(uPlaneLineDensity,4.0,96.0);
  float phase=(local.y+displacement)*density+slice*0.37;
  float lineDistance=abs(fract(phase)-0.5);
  float halfWidth=clamp(uPlaneLineThickness,5.0,90.0)*0.005;
  float aa=clamp(fwidth(phase)*0.55,0.001,0.24);
  return 1.0-smoothstep(halfWidth-aa,halfWidth+aa,lineDistance);
}

float platePlanePrintShade(
  float litShade,
  float ink,
  float grain,
  float region,
  float slice
) {
  // The exposed plate planes read as a graphic printed material rather than
  // another lit grid face. Keep almost-white paper and almost-black ink stable
  // under the scene light, with only a small amount of the shared film grain.
  float planeMask=step(2.5,region)*(1.0-step(${ICEBERG_PLATE_COUNT - 0.5},slice));
  float printShade=clamp(mix(0.985,0.025,ink)+grain*0.08,0.025,1.0);
  return mix(litShade,printShade,planeMask);
}
`;
