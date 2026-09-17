import { expect, type Page } from '@playwright/test';
import { icebergSidePatternsGLSL } from '../src/app/iceberg-side-patterns';

export async function verifyGridFacing(page: Page) {
  // Render the actual ink shader on narrow cap/wall patches at each physical
  // cube edge. Far cap patches must stay plain even when visible from above.
  const samples = await page.evaluate(source => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const gl = canvas.getContext('webgl2')!;
    if (!gl) throw new Error('Grid facing regression requires WebGL2.');
    const shader = (type: number, body: string) => {
      const result = gl.createShader(type)!;
      gl.shaderSource(result, body); gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result)!);
      return result;
    };
    const vertex = shader(gl.VERTEX_SHADER, `#version 300 es
      void main() {
        vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
        gl_Position=vec4(p*2.0-1.0,0.0,1.0);
      }`);
    const fragment = shader(gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float;
      uniform float uWidth, uDepth, face, region;
      out vec4 color;
      ${source}
      void main() {
        vec2 uv=gl_FragCoord.xy/64.0;
        float across=(uv.x*2.0-1.0)*uWidth*0.4;
        float edge=uWidth*0.5*(region<0.5?0.98:1.0);
        float y=uv.y*0.4-0.2;
        vec3 world=face<0.5?vec3(across,y,edge)
          :face<1.5?vec3(edge,y,across)
          :face<2.5?vec3(across,y,-edge):vec3(-edge,y,across);
        float ink=cubePatternInk(world,region,0.0,4.0,0.0,1.0);
        color=vec4(vec3(ink),1.0);
      }`);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)!);
    gl.useProgram(program);
    const set = (name: string, value: number) => gl.uniform1f(gl.getUniformLocation(program, name), value);
    for (const [name, value] of Object.entries({ uWidth: 2.35, uDepth: 1.2, uFrontColumns: 7, uRightColumns: 18, uBackColumns: 11, uLeftColumns: 23, uGridThickness: 10, uGridStrength: 1 })) set(name, value);
    const pixels = new Uint8Array(64*64*4);
    const results: { view: number[]; face: number; region: number; facing: number; inkPixels: number }[] = [];
    const normals = [[0,0,1], [1,0,0], [0,0,-1], [-1,0,0]];
    try {
      for (const view of [[4,2.6,6], [-4,2.6,6], [-4,2.6,-6], [4,2.6,-6], [0,2,6], [6,2,0], [0,2,-6], [-6,2,0], [0,6,0]]) {
        const length = Math.hypot(...view);
        gl.uniform3f(gl.getUniformLocation(program, 'uViewDirection'), view[0]/length, view[1]/length, view[2]/length);
        for (const region of [0, 1]) for (let face = 0; face < 4; face++) {
          set('face', face); set('region', region);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          let inkPixels = 0;
          for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 10) inkPixels++;
          results.push({ view, face, region, facing: normals[face].reduce((sum, n, axis) => sum+n*view[axis], 0), inkPixels });
        }
      }
    } finally {
      gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    return results;
  }, icebergSidePatternsGLSL);
  console.log('Grid facing samples:', {
    samples: samples.length,
    hiddenInkPixels: Math.max(...samples.filter(sample => sample.facing <= 0).map(sample => sample.inkPixels)),
    minimumVisibleInkPixels: Math.min(...samples.filter(sample => sample.facing > 0).map(sample => sample.inkPixels)),
  });
  for (const sample of samples) {
    const message = `Face ${sample.face}, region ${sample.region}, view ${sample.view}`;
    if (sample.facing <= 0) expect(sample.inkPixels, `${message}: hidden boundary must not project grid ink`).toBe(0);
    else expect(sample.inkPixels, `${message}: visible boundary keeps its grid`).toBeGreaterThan(100);
  }
}

export async function verifyGridEdgeThickness(page: Page) {
  const samples = await page.evaluate(source => {
    const width = 32, height = 257;
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const gl = canvas.getContext('webgl2')!;
    if (!gl) throw new Error('Grid edge thickness regression requires WebGL2.');
    const shader = (type: number, body: string) => {
      const result = gl.createShader(type)!;
      gl.shaderSource(result, body); gl.compileShader(result);
      if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result)!);
      return result;
    };
    const vertex = shader(gl.VERTEX_SHADER, `#version 300 es
      void main() {
        vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
        gl_Position=vec4(p*2.0-1.0,0.0,1.0);
      }`);
    const fragment = shader(gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float;
      uniform float uWidth, uDepth, uPlateThickness, uPlateGap;
      uniform float face, slice;
      out vec4 color;
      ${source}
      void main() {
        float frequency=(face<0.5?uFrontColumns:face<1.5?uRightColumns:face<2.5?uBackColumns:uLeftColumns)/uWidth;
        float across=-uWidth*0.5+0.5/frequency;
        float edgeY=-uDepth+(slice+1.0)*uPlateThickness;
        float span=4.0/frequency;
        float normalizedY=(gl_FragCoord.y-0.5)/${height - 1}.0;
        float y=edgeY+(normalizedY-0.5)*span;
        float edge=uWidth*0.5;
        vec3 world=face<0.5?vec3(across,y,edge)
          :face<1.5?vec3(edge,y,across)
          :face<2.5?vec3(across,y,-edge):vec3(-edge,y,across);
        float ink=cubePatternInk(world,1.0,0.0,slice,uPlateGap,uPlateThickness);
        color=vec4(vec3(ink),1.0);
      }`);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)!);
    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const set = (name: string, value: number) => gl.uniform1f(uniform(name), value);
    for (const [name, value] of Object.entries({
      uWidth: 2.18, uDepth: 1.36, uPlateThickness: 1.36/5, uPlateGap: 0.25,
      uFrontColumns: 32, uRightColumns: 16, uBackColumns: 14, uLeftColumns: 10,
      uGridThickness: 5, uGridStrength: 1,
    })) set(name, value);
    const pixels = new Uint8Array(width*height*4);
    const observations: { edgeWidth: number; face: number; interiorMedian: number; slice: number }[] = [];
    const normals = [[0,0,1], [1,0,0], [0,0,-1], [-1,0,0]];
    try {
      for (let face = 0; face < 4; face++) for (let slice = 0; slice < 4; slice++) {
        set('face', face); set('slice', slice);
        const normal = normals[face]; gl.uniform3f(uniform('uViewDirection'), normal[0], 0.2, normal[2]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        const on = (y: number) => pixels[(y*width+Math.floor(width/2))*4] > 128;
        let start = Math.floor(height/2), end = start;
        while (start > 0 && on(start-1)) start--;
        while (end < height-1 && on(end+1)) end++;
        const edgeWidth = end-start+1;
        const runs: number[] = [];
        for (let y = 1, run = 0; y < height-1; y++) {
          if (on(y)) run++;
          else if (run) {
            const runEnd=y-1, runStart=y-run;
            if (runEnd < start-2 || runStart > end+2) runs.push(run);
            run=0;
          }
        }
        runs.sort((a,b)=>a-b);
        observations.push({ edgeWidth, face, interiorMedian: runs[Math.floor(runs.length/2)] ?? 0, slice });
      }
    } finally {
      gl.deleteProgram(program); gl.deleteShader(vertex); gl.deleteShader(fragment);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    return observations;
  }, icebergSidePatternsGLSL);
  for (const sample of samples) {
    const message = `Face ${sample.face + 1}, plate ${sample.slice + 1}`;
    expect(sample.edgeWidth, `${message}: separated boundary remains visible`).toBeGreaterThan(0);
    expect(sample.edgeWidth, `${message}: boundary stays lighter than the interior grid`).toBeLessThanOrEqual(sample.interiorMedian);
  }
}
