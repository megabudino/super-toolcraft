import { getLogoSphereShadowSprite } from "./logo-sphere-card-raster";
import { createLogoSphereGLAtlas, uploadLogoSphereTexture } from "./logo-sphere-gl-atlas";
import { createLogoSphereGLGeometry, getLogoSphereBaseCardSize, LOGO_SPHERE_GL_VERTEX_FLOATS } from "./logo-sphere-gl-geometry";
import { logoSphereVertexShader, logoSphereFragmentShader, logoSphereCompositeVertexShader,
  logoSphereCompositeFragmentShader } from "./logo-sphere-gl-shaders";
import { getLogoSphereMaskGeometry, type LogoSphereProjectionInput } from "./logo-sphere-model";
import type { LogoSphereCardStyle, LogoSphereImageSource } from "./logo-sphere-renderer-types";

export type LogoSphereSurfaceFrame = Readonly<{
  images: readonly LogoSphereImageSource[];
  projection: LogoSphereProjectionInput;
  cardStyle: LogoSphereCardStyle;
  backgroundColor?: string | null;
}>;

function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to allocate sphere shader program.");
  try {
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to allocate sphere shader.");
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "Sphere shader failed.");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Sphere program failed.");
    return program;
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  } finally {
    shaders.forEach(shader => gl.deleteShader(shader));
  }
}

function createResources(gl: WebGL2RenderingContext) {
  const program = createProgram(gl, logoSphereVertexShader, logoSphereFragmentShader);
  const composite = createProgram(gl, logoSphereCompositeVertexShader, logoSphereCompositeFragmentShader);
  const vertices = gl.createBuffer();
  const indices = gl.createBuffer();
  const vao = gl.createVertexArray();
  const shadow = gl.createTexture();
  const scene = gl.createTexture();
  const depth = gl.createRenderbuffer();
  const framebuffer = gl.createFramebuffer();
  if (!vertices || !indices || !vao || !shadow || !scene || !depth || !framebuffer) {
    throw new Error("Unable to allocate full-quality sphere resources.");
  }
  const atlas = createLogoSphereGLAtlas(gl);
  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const finalUniform = (name: string) => gl.getUniformLocation(composite, name);
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  const stride = LOGO_SPHERE_GL_VERTEX_FLOATS * 4;
  for (const [location, size, offset] of [[0, 2, 0], [1, 2, 2], [2, 4, 4], [3, 2, 8]]) {
    gl.enableVertexAttribArray(location!);
    gl.vertexAttribPointer(location!, size!, gl.FLOAT, false, stride, offset! * 4);
  }
  gl.bindVertexArray(null);
  return {
    program, composite, vertices, indices, vao, shadow, scene, depth, framebuffer, atlas,
    uniforms: { resolution: uniform("u_resolution"), atlas: uniform("u_atlas"), shadow: uniform("u_shadow"),
      atlasLayout: uniform("u_atlasLayout"), atlasSize: uniform("u_atlasSize"), strokeWidth: uniform("u_strokeWidth"),
      strokeColor: uniform("u_strokeColor"), pass: uniform("u_pass") },
    finalUniforms: { resolution: finalUniform("u_resolution"), scene: finalUniform("u_scene"),
      maskCenter: finalUniform("u_maskCenter"), maskRadii: finalUniform("u_maskRadii"), background: finalUniform("u_background") },
    dispose() {
      atlas.dispose();
      gl.deleteTexture(shadow); gl.deleteTexture(scene);
      gl.deleteRenderbuffer(depth); gl.deleteFramebuffer(framebuffer);
      gl.deleteBuffer(vertices); gl.deleteBuffer(indices); gl.deleteVertexArray(vao);
      gl.deleteProgram(program); gl.deleteProgram(composite);
    },
  };
}

function colorComponents(color: string | null | undefined): [number, number, number, number] {
  if (!color) return [0, 0, 0, 0];
  const hex = color.replace(/^#/, "");
  if (/^[0-9a-f]{3,8}$/i.test(hex)) {
    const expanded = hex.length <= 4 ? [...hex].map(char => char + char).join("") : hex;
    return [parseInt(expanded.slice(0, 2), 16) / 255, parseInt(expanded.slice(2, 4), 16) / 255,
      parseInt(expanded.slice(4, 6), 16) / 255, expanded.length === 8 ? parseInt(expanded.slice(6), 16) / 255 : 1];
  }
  // Color controls normally supply hex; the browser resolves supported CSS
  // color forms once per style change, never with a per-frame canvas readback.
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return [0, 0, 0, 1];
  context.fillStyle = color;
  const resolved = context.fillStyle;
  if (resolved.startsWith("#")) return colorComponents(resolved);
  const parts = resolved.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return [parts[0]! / 255, parts[1]! / 255, parts[2]! / 255, parts[3] ?? 1];
}

export function createLogoSphereGLRenderer(canvas: HTMLCanvasElement,
  events: Readonly<{ invalidate?: () => void; unavailable?: () => void }> = {}) {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, depth: true,
    premultipliedAlpha: true, preserveDrawingBuffer: true, desynchronized: false, stencil: false });
  if (!gl) return null;
  let resources: ReturnType<typeof createResources>;
  try { resources = createResources(gl); } catch (error) {
    console.warn("Logo sphere WebGL initialization failed; using full Canvas fallback.", error);
    return null;
  }
  let disposed = false;
  let lost = false;
  let lossTimer = 0;
  let allocatedWidth = 0;
  let allocatedHeight = 0;
  let shadowCanvas: CanvasImageSource | undefined;
  let styleKey = "";
  let strokeColor: [number, number, number, number] = [0, 0, 0, 1];
  let backgroundKey: string | null | undefined;
  let background: [number, number, number, number] = [0, 0, 0, 0];
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    lossTimer = window.setTimeout(() => events.unavailable?.(), 1500);
  };
  const contextRestored = () => {
    window.clearTimeout(lossTimer);
    if (disposed) return;
    try {
      resources.dispose();
      resources = createResources(gl);
      allocatedWidth = allocatedHeight = 0;
      shadowCanvas = undefined;
      lost = false;
      events.invalidate?.();
    } catch { events.unavailable?.(); }
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);

  const resize = (width: number, height: number) => {
    const max = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
    if (width > max || height > max) throw new Error(`Sphere backing ${width}×${height} exceeds WebGL ${max}px limit.`);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    // Chromium can silently reduce a retained drawing buffer under its pixel
    // budget even below MAX_TEXTURE_SIZE. The DOM dimensions still report the
    // request; using them as viewport authority would crop and stretch export.
    if (gl.drawingBufferWidth !== width || gl.drawingBufferHeight !== height) {
      throw new Error(`WebGL supplied ${gl.drawingBufferWidth}×${gl.drawingBufferHeight} instead of the required ${width}×${height} backing.`);
    }
    if (allocatedWidth === width && allocatedHeight === height) return;
    gl.bindTexture(gl.TEXTURE_2D, resources.scene);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindRenderbuffer(gl.RENDERBUFFER, resources.depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, resources.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, resources.scene, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, resources.depth);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Full-resolution sphere framebuffer is unavailable.");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    allocatedWidth = width;
    allocatedHeight = height;
  };

  return {
    isLost: () => lost || gl.isContextLost(),
    resize,
    render({ projection, images, cardStyle, backgroundColor }: LogoSphereSurfaceFrame): boolean {
      if (disposed || lost || gl.isContextLost()) return false;
      const { width, height } = canvas;
      resize(width, height);
      const r = resources;
      const scale = width / projection.frame.width;
      const layout = r.atlas.ensure(images);
      const sprite = cardStyle.shadowOpacity > 0 ? getLogoSphereShadowSprite(cardStyle,
        getLogoSphereBaseCardSize(projection), scale) : null;
      gl.activeTexture(gl.TEXTURE1);
      if (sprite && sprite.canvas !== shadowCanvas) {
        uploadLogoSphereTexture(gl, r.shadow, sprite.canvas as TexImageSource);
        shadowCanvas = sprite.canvas;
      } else if (!shadowCanvas) {
        gl.bindTexture(gl.TEXTURE_2D, r.shadow);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      const geometry = createLogoSphereGLGeometry({ projection, style: cardStyle,
        imageCount: images.length, width, height, shadow: sprite });
      gl.bindFramebuffer(gl.FRAMEBUFFER, r.framebuffer);
      gl.viewport(0, 0, width, height);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(r.program);
      gl.bindVertexArray(r.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, r.vertices);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, r.indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.DYNAMIC_DRAW);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.atlas.texture);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, r.shadow);
      gl.uniform1i(r.uniforms.atlas, 0); gl.uniform1i(r.uniforms.shadow, 1);
      gl.uniform2f(r.uniforms.resolution, width, height);
      gl.uniform4f(r.uniforms.atlasLayout, layout.columns, layout.rows, layout.stride, layout.tileSize);
      gl.uniform2f(r.uniforms.atlasSize, layout.width, layout.height);
      gl.uniform1f(r.uniforms.strokeWidth, cardStyle.strokeWidth * scale);
      if (styleKey !== cardStyle.strokeColor) {
        styleKey = cardStyle.strokeColor;
        strokeColor = colorComponents(styleKey);
      }
      gl.uniform4fv(r.uniforms.strokeColor, strokeColor);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.uniform1i(r.uniforms.pass, 0);
      gl.drawElements(gl.TRIANGLES, geometry.opaqueIndexCount, gl.UNSIGNED_SHORT, 0);
      gl.depthMask(false);
      gl.uniform1i(r.uniforms.pass, 1);
      gl.drawElements(gl.TRIANGLES, geometry.indices.length - geometry.opaqueIndexCount,
        gl.UNSIGNED_SHORT, geometry.opaqueIndexCount * 2);

      gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.useProgram(r.composite);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.scene);
      gl.uniform1i(r.finalUniforms.scene, 0);
      gl.uniform2f(r.finalUniforms.resolution, width, height);
      const mask = getLogoSphereMaskGeometry(projection);
      gl.uniform2f(r.finalUniforms.maskCenter, (mask.centerX - projection.frame.x) * scale,
        (mask.centerY - projection.frame.y) * height / projection.frame.height);
      gl.uniform2f(r.finalUniforms.maskRadii, mask.innerRadius * scale, mask.outerRadius * scale);
      if (backgroundKey !== backgroundColor) {
        backgroundKey = backgroundColor;
        background = colorComponents(backgroundColor);
      }
      gl.uniform4f(r.finalUniforms.background, background[0] * background[3],
        background[1] * background[3], background[2] * background[3], background[3]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      window.clearTimeout(lossTimer);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      resources.dispose();
    },
  };
}
