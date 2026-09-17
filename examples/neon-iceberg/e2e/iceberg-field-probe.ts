import type { Page } from '@playwright/test';
import { icebergFieldGLSL } from '../src/app/iceberg-shaders';
import { icebergDefaults } from '../src/app/iceberg-controls';

// Evaluate the production GLSL on the GPU, including its float precision and
// transcendental edge cases, without duplicating the terrain formula in JS.
export async function probeIcebergField(page: Page, points: number[], settings = icebergDefaults) {
  return (await probeIcebergFields(page, points, [settings]))[0];
}

export async function probeIcebergFields(page: Page, points: number[], settingsList: typeof icebergDefaults[]) {
  return page.evaluate(({ field, points, settingsList }) => {
    const gl = document.createElement('canvas').getContext('webgl2')!;
    const compile = (kind: number, source: string) => {
      const shader = gl.createShader(kind)!;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader)!);
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, `#version 300 es
      precision highp float;
      ${field}
      in vec2 point;
      out vec2 heights;
      void main() { float b=seam(point); heights=vec2(terrain(point,b),b); gl_Position=vec4(0,0,0,1); }
    `);
    const fragment = compile(gl.FRAGMENT_SHADER, `#version 300 es
      precision highp float; out vec4 color; void main() { color=vec4(1); }
    `);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment);
    gl.transformFeedbackVaryings(program, ['heights'], gl.INTERLEAVED_ATTRIBS);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)!);
    gl.useProgram(program);
    const input = gl.createBuffer()!, output = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, input);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, 'point');
    gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, output);
    gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER, points.length * 4, gl.STREAM_READ);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, output);
    gl.enable(gl.RASTERIZER_DISCARD);
    const results = settingsList.map(settings => {
      for (const [key, value] of Object.entries(settings)) {
        gl.uniform1f(gl.getUniformLocation(program, `u${key[0].toUpperCase()}${key.slice(1)}`), value);
      }
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, points.length / 2); gl.endTransformFeedback();
      const values = new Float32Array(points.length);
      gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER, 0, values);
      return Array.from(values);
    });
    gl.deleteBuffer(input); gl.deleteBuffer(output); gl.deleteProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return results;
  }, { field: icebergFieldGLSL, points, settingsList });
}
