import { ICEBERG_PLATE_COUNT } from './iceberg-plates';

export const icebergSidePatternsGLSL = /* glsl */`
uniform float uFrontColumns, uRightColumns, uBackColumns, uLeftColumns;
uniform float uGridThickness, uGridStrength;
uniform vec3 uViewDirection;

float cubePatternInk(
  vec3 world,
  float region,
  float rockMask,
  float slice,
  float plateGap,
  float plateThickness
) {
  // Ice cutouts also occupy the sloped cap. Evaluate their ink on the virtual
  // cube plane along the orthographic sight ray, so lines continue straight
  // through the join instead of wrapping around the mountain's triangles.
  if(max(abs(uViewDirection.x),abs(uViewDirection.z))<0.00001) return 0.0;
  vec2 travel=vec2(1000000.0);
  if(abs(uViewDirection.x)>0.00001)
    travel.x=(sign(uViewDirection.x)*uWidth*0.5-world.x)/uViewDirection.x;
  if(abs(uViewDirection.z)>0.00001)
    travel.y=(sign(uViewDirection.z)*uWidth*0.5-world.z)/uViewDirection.z;
  vec3 plane=world+uViewDirection*max(0.0,min(travel.x,travel.y));
  // The same planar derivatives keep line weight continuous at the join.
  float footprint=max(length(dFdx(plane)),length(dFdy(plane)));
  if(region>1.5||rockMask>=1.0) return 0.0;
  // A visible cap cutout can belong to a far cube edge. Its nearest physical
  // boundary must face the camera before projecting ink onto the near plane;
  // otherwise the far side's pattern appears painted over the upper slope.
  vec2 boundaryNormal=abs(world.x)>=abs(world.z)
    ?vec2(sign(world.x),0.0):vec2(0.0,sign(world.z));
  if(dot(boundaryNormal,uViewDirection.xz)<=0.00001) return 0.0;
  bool zFace=travel.y<=travel.x;
  float columns=zFace
    ? (uViewDirection.z>=0.0?uFrontColumns:uBackColumns)
    : (uViewDirection.x>=0.0?uRightColumns:uLeftColumns);
  // Numeric entry/import may contain fractions. Tile subdivision is discrete
  // even during a smooth pointer drag, so never render a partial last column.
  columns=clamp(floor(columns+0.5),1.0,32.0);
  float across=zFace?plane.x:plane.z;
  // Both vertical edges land on integer grid lines. The same world spacing
  // vertically keeps tiles square, independently of block width and depth.
  float frequency=columns/uWidth;
  vec2 q=vec2(across+uWidth*0.5,plane.y+uDepth)*frequency;
  vec2 distance=abs(fract(q+0.5)-0.5);
  // Each separated solid keeps a continuous ink line along its straight top
  // and bottom edges, even when those heights fall between the square grid's
  // regular rows. Draw it on the side wall so the horizontal top surfaces
  // remain clean while their perimeter stays legible.
  float blockEdgeDistance=1000000.0;
  if(plateGap>0.0&&region>0.5&&region<1.5) {
    if(slice<${ICEBERG_PLATE_COUNT}.0) {
      float plateBottom=-uDepth+slice*plateThickness;
      float plateTop=plateBottom+plateThickness;
      blockEdgeDistance=min(abs(plane.y-plateBottom),abs(plane.y-plateTop))*frequency;
    } else {
      float upperBottom=-uDepth+${ICEBERG_PLATE_COUNT}.0*plateThickness;
      blockEdgeDistance=abs(plane.y-upperBottom)*frequency;
    }
  }
  float halfStroke=uGridThickness*0.005;
  float aa=max(0.0001,footprint*frequency*0.6);
  // Replace the nearest regular horizontal row around a separated boundary.
  // Keeping both rows lets two almost-coincident strokes merge into a heavy
  // band. The perimeter remains visible, but uses a lighter stroke because it
  // is already reinforced visually by the dark printed plane beside it.
  float horizontalDistance=blockEdgeDistance<0.5?1000000.0:distance.y;
  float regularDistance=min(distance.x,horizontalDistance);
  float regularLines=1.0-smoothstep(halfStroke-aa,halfStroke+aa,regularDistance);
  float edgeHalfStroke=halfStroke*0.5;
  float edgeLines=1.0-smoothstep(edgeHalfStroke-aa,edgeHalfStroke+aa,blockEdgeDistance);
  float lines=max(regularLines,edgeLines);
  float average=1.0-pow(1.0-2.0*halfStroke,2.0);
  return mix(lines,average,smoothstep(0.35,1.0,aa))*uGridStrength;
}
`;
