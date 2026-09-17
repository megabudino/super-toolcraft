import { BufferGeometry, Float32BufferAttribute } from 'three';
import { ICEBERG_SEGMENTS } from './iceberg-topology-settings';
import { ICEBERG_PLATE_COUNT } from './iceberg-plates';
export { ICEBERG_SEGMENTS } from './iceberg-topology-settings';
export function createIcebergTopology(): BufferGeometry {
  const vertices: number[] = [], regions: number[] = [], indices: number[] = [];
  const n=ICEBERG_SEGMENTS;
  for(let z=0;z<=n;z++) for(let x=0;x<=n;x++) {
    vertices.push(x/n*2-1,0,z/n*2-1); regions.push(0);
  }
  for(let z=0;z<n;z++) for(let x=0;x<n;x++) {
    const a=z*(n+1)+x,b=a+1,c=a+n+1,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const edge=(face:number,t:number):[number,number]=> face===0?[t,1]:face===1?[1,-t]:face===2?[-t,-1]:[-1,t];
  for(let face=0;face<4;face++) {
    const start=vertices.length/3;
    for(let i=0;i<=n;i++) {
      const [x,z]=edge(face,i/n*2-1);
      vertices.push(x,0,z,x,1,z); regions.push(1,1);
    }
    for(let i=0;i<n;i++) { const a=start+i*2; indices.push(a,a+2,a+1,a+1,a+2,a+3); }
  }
  const start=vertices.length/3;
  vertices.push(-1,0,-1,1,0,-1,1,0,1,-1,0,1); regions.push(2,2,2,2);
  indices.push(start,start+1,start+2,start,start+2,start+3);
  const slices = new Array(regions.length).fill(ICEBERG_PLATE_COUNT);
  const faces = [
    [-1,0,1, 1,0,1, 1,1,1, -1,1,1],
    [1,0,1, 1,0,-1, 1,1,-1, 1,1,1],
    [1,0,-1, -1,0,-1, -1,1,-1, 1,1,-1],
    [-1,0,-1, -1,0,1, -1,1,1, -1,1,-1],
    [-1,0,-1, 1,0,-1, 1,0,1, -1,0,1],
    [-1,1,1, 1,1,1, 1,1,-1, -1,1,-1],
  ];
  for (let slice=0; slice<ICEBERG_PLATE_COUNT; slice++) {
    for (const [face, corners] of faces.entries()) {
      const offset=vertices.length/3;
      vertices.push(...corners);
      regions.push(...new Array(4).fill(face<4?1:face===4?2:3));
      slices.push(slice,slice,slice,slice);
      indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3);
    }
  }
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));
  geometry.setAttribute('region',new Float32BufferAttribute(regions,1));
  geometry.setAttribute('slice',new Float32BufferAttribute(slices,1));
  geometry.setIndex(indices);
  return geometry;
}
