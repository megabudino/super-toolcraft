/**
 * Screen-space dispersion rail renderer.
 *
 * One WebGL pass draws the full carousel strip and applies a stationary
 * viewport-anchored edge treatment: spectral dispersion, progressive
 * defocus, an additive aura halo, and an outer fade. Because the effect
 * field is a function of the *canvas* coordinate while the strip texture
 * translates underneath it with the native scroll position, cards visibly
 * travel through the aura instead of carrying a frozen distortion.
 */

import { FRAGMENT_SHADER, VERTEX_SHADER } from "./dispersion-carousel-shaders";

export type DispersionRailEffectUniforms = Readonly<{
  /** Maximum spectral offset at the outer edge, css px. */
  amount: number;
  /** Additive halo gain 0..1. */
  aura: number;
  /** Maximum defocus radius at the outer edge, css px. */
  blur: number;
  /** Falloff exponent shaping how the zone ramps in. */
  curve: number;
  /** Outer fade toward the page background 0..1. */
  fade: number;
  /** Fraction of the full viewport width covered by one edge zone, 0..0.5. */
  edgeWidth: number;
  /** Stationary boundary light band: glow gain 0..1. */
  gateGlow: number;
  /** Distance from the nearest viewport edge to the band center, 0..0.5. */
  gateOffset: number;
  /** Stationary boundary light band: refraction shift at the band, css px. */
  gateRefraction: number;
  /** Stationary boundary light band: half-width of the band, css px. */
  gateWidth: number;
  /** Base spectrum rotation in degrees. */
  hue: number;
  /** Whether the testimonial texture participates in the same optical pass. */
  includeText: boolean;
  /** Spectral tap count for the main dispersion loop. */
  samples: number;
  /** Saturation of the generated spectrum 0..1. */
  spectrum: number;
  /** Irregularity of the edge halos 0..1 (0 = smooth envelope). */
  turbulence: number;
  /** Wavelength of the halo irregularity along the vertical axis, css px. */
  turbulenceScale: number;
  /** Maximum geometric warp, css px. Zero keeps flat sampling. */
  warp: number;
  /** Prism face thickness, css px. Ignored in stretch style. */
  warpFace: number;
  /** Inward slide of the warp band as a fraction of full viewport width. */
  warpOffset: number;
  /** Prism-face kink concentration. Ignored in stretch style. */
  warpSharpness: number;
  /** Stretch grows toward the rim; prism kinks at the inner zone face. */
  warpStyle: "prism" | "stretch";
  /** Vertical sine-ripple amplitude through the warp band, css px. */
  warpWave: number;
  /** Extra defocus and pattern softening inside the wave band, css px. */
  warpWaveBlur: number;
  /** Glass refracts through a height field; ripple is the earlier sine shift. */
  warpWaveKind: "glass" | "ripple";
  /** Height of one ripple, css px. */
  warpWaveLength: number;
}>;

export type DispersionRailLayout = Readonly<{
  /** Strip size in css px (track width × card height). */
  stripHeight: number;
  stripWidth: number;
  /** Vertical padding above the cards inside the canvas, css px. */
  padY: number;
}>;

export type DispersionRailRenderer = Readonly<{
  dispose(): void;
  isContextLost(): boolean;
  render(scrollLeft: number, velocityPx: number): void;
  setSize(cssWidth: number, cssHeight: number, pixelRatio: number): void;
  setUniforms(uniforms: DispersionRailEffectUniforms): void;
  snapshot(scrollLeft: number, pixelRatio: number): Promise<ImageBitmap>;
}>;

const MAX_BACKING_DIMENSION = 16384;
const MAX_BACKING_PIXELS = 48_000_000;

type UniformLocations = Readonly<{
  amount: WebGLUniformLocation | null;
  aura: WebGLUniformLocation | null;
  blur: WebGLUniformLocation | null;
  curve: WebGLUniformLocation | null;
  edgeStart: WebGLUniformLocation | null;
  fade: WebGLUniformLocation | null;
  gateGlow: WebGLUniformLocation | null;
  gateOffset: WebGLUniformLocation | null;
  gateRefraction: WebGLUniformLocation | null;
  gateWidth: WebGLUniformLocation | null;
  hue: WebGLUniformLocation | null;
  includeText: WebGLUniformLocation | null;
  padY: WebGLUniformLocation | null;
  samples: WebGLUniformLocation | null;
  scroll: WebGLUniformLocation | null;
  spectrum: WebGLUniformLocation | null;
  strip: WebGLUniformLocation | null;
  text: WebGLUniformLocation | null;
  textRowRange: WebGLUniformLocation | null;
  stripSize: WebGLUniformLocation | null;
  turbulence: WebGLUniformLocation | null;
  turbulenceFreq: WebGLUniformLocation | null;
  velocity: WebGLUniformLocation | null;
  viewSize: WebGLUniformLocation | null;
  warp: WebGLUniformLocation | null;
  warpFace: WebGLUniformLocation | null;
  warpOffset: WebGLUniformLocation | null;
  warpSharpness: WebGLUniformLocation | null;
  warpStyle: WebGLUniformLocation | null;
  warpWave: WebGLUniformLocation | null;
  warpWaveBlur: WebGLUniformLocation | null;
  warpWaveKind: WebGLUniformLocation | null;
  warpWaveLength: WebGLUniformLocation | null;
}>;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("The dispersion rail could not allocate a shader.");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "unknown error";
    gl.deleteShader(shader);
    throw new Error(`The dispersion rail shader failed to compile: ${info}`);
  }
  return shader;
}

function clampBacking(
  cssWidth: number,
  cssHeight: number,
  pixelRatio: number,
): { height: number; width: number } {
  let ratio = Math.max(0.5, pixelRatio);
  const limitByDimension =
    MAX_BACKING_DIMENSION / Math.max(1, Math.max(cssWidth, cssHeight));
  ratio = Math.min(ratio, limitByDimension);
  const pixels = cssWidth * cssHeight * ratio * ratio;
  if (pixels > MAX_BACKING_PIXELS) {
    ratio *= Math.sqrt(MAX_BACKING_PIXELS / pixels);
  }
  return {
    height: Math.max(1, Math.round(cssHeight * ratio)),
    width: Math.max(1, Math.round(cssWidth * ratio)),
  };
}

export function createDispersionRailRenderer(
  canvas: HTMLCanvasElement,
  stripTextures: Readonly<{
    image: TexImageSource;
    text: TexImageSource;
    textRowRange?: readonly [number, number];
  }>,
  layout: DispersionRailLayout,
): DispersionRailRenderer {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    stencil: false,
  });
  if (!gl) {
    throw new Error("The dispersion rail requires WebGL support.");
  }

  let disposed = false;
  let contextLost = false;
  let cssWidth = 1;
  let cssHeight = 1;
  let pixelRatio = 1;
  let uniforms: DispersionRailEffectUniforms = {
    amount: 0,
    aura: 0,
    blur: 0,
    curve: 1,
    edgeWidth: 0,
    fade: 0,
    gateGlow: 0,
    gateOffset: 0.3,
    gateRefraction: 0,
    gateWidth: 1,
    hue: 0,
    includeText: true,
    samples: 8,
    spectrum: 0,
    turbulence: 0,
    turbulenceScale: 130,
    warp: 0,
    warpFace: 56,
    warpOffset: 0,
    warpSharpness: 2,
    warpStyle: "stretch",
    warpWave: 0,
    warpWaveBlur: 0,
    warpWaveKind: "glass",
    warpWaveLength: 140,
  };
  let lastScroll = 0;
  let lastVelocity = 0;
  let uniformsDirty = true;
  let frameDirty = true;

  let program: WebGLProgram | null = null;
  let vertexBuffer: WebGLBuffer | null = null;
  let imageTexture: WebGLTexture | null = null;
  let textTexture: WebGLTexture | null = null;
  let locations: UniformLocations | null = null;

  const initialize = (): void => {
    uniformsDirty = true;
    frameDirty = true;
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const nextProgram = gl.createProgram();
    if (!nextProgram) {
      throw new Error("The dispersion rail could not allocate a program.");
    }
    gl.attachShader(nextProgram, vertex);
    gl.attachShader(nextProgram, fragment);
    gl.linkProgram(nextProgram);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(nextProgram, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(nextProgram) ?? "unknown error";
      gl.deleteProgram(nextProgram);
      throw new Error(`The dispersion rail program failed to link: ${info}`);
    }
    program = nextProgram;
    gl.useProgram(program);

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const createTexture = (
      unit: number,
      source: TexImageSource,
    ): WebGLTexture => {
      const nextTexture = gl.createTexture();
      if (!nextTexture) {
        throw new Error("The dispersion rail could not allocate a texture.");
      }
      gl.activeTexture(unit);
      gl.bindTexture(gl.TEXTURE_2D, nextTexture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        source,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return nextTexture;
    };
    imageTexture = createTexture(gl.TEXTURE0, stripTextures.image);
    textTexture = createTexture(gl.TEXTURE1, stripTextures.text);

    locations = {
      amount: gl.getUniformLocation(program, "uAmount"),
      aura: gl.getUniformLocation(program, "uAura"),
      blur: gl.getUniformLocation(program, "uBlur"),
      curve: gl.getUniformLocation(program, "uCurve"),
      edgeStart: gl.getUniformLocation(program, "uEdgeStart"),
      fade: gl.getUniformLocation(program, "uFade"),
      gateGlow: gl.getUniformLocation(program, "uGateGlow"),
      gateOffset: gl.getUniformLocation(program, "uGateOffset"),
      gateRefraction: gl.getUniformLocation(program, "uGateRefraction"),
      gateWidth: gl.getUniformLocation(program, "uGateWidth"),
      hue: gl.getUniformLocation(program, "uHue"),
      includeText: gl.getUniformLocation(program, "uIncludeText"),
      padY: gl.getUniformLocation(program, "uPadY"),
      samples: gl.getUniformLocation(program, "uSamples"),
      scroll: gl.getUniformLocation(program, "uScroll"),
      spectrum: gl.getUniformLocation(program, "uSpectrum"),
      strip: gl.getUniformLocation(program, "uStrip"),
      text: gl.getUniformLocation(program, "uText"),
      textRowRange: gl.getUniformLocation(program, "uTextRowRange"),
      stripSize: gl.getUniformLocation(program, "uStripSize"),
      turbulence: gl.getUniformLocation(program, "uTurbulence"),
      turbulenceFreq: gl.getUniformLocation(program, "uTurbulenceFreq"),
      velocity: gl.getUniformLocation(program, "uVelocity"),
      viewSize: gl.getUniformLocation(program, "uViewSize"),
      warp: gl.getUniformLocation(program, "uWarp"),
      warpFace: gl.getUniformLocation(program, "uWarpFace"),
      warpOffset: gl.getUniformLocation(program, "uWarpOffset"),
      warpSharpness: gl.getUniformLocation(program, "uWarpSharpness"),
      warpStyle: gl.getUniformLocation(program, "uWarpStyle"),
      warpWave: gl.getUniformLocation(program, "uWarpWave"),
      warpWaveBlur: gl.getUniformLocation(program, "uWarpWaveBlur"),
      warpWaveKind: gl.getUniformLocation(program, "uWarpWaveKind"),
      warpWaveLength: gl.getUniformLocation(program, "uWarpWaveLength"),
    };
    gl.uniform1i(locations.strip, 0);
    gl.uniform1i(locations.text, 1);
    const textRowRange = stripTextures.textRowRange ?? [0, 1];
    gl.uniform2f(locations.textRowRange, textRowRange[0], textRowRange[1]);
    gl.uniform2f(locations.stripSize, layout.stripWidth, layout.stripHeight);
    gl.uniform1f(locations.padY, layout.padY);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
  };

  const applyBackingSize = (ratio: number): void => {
    const backing = clampBacking(cssWidth, cssHeight, ratio);
    if (canvas.width !== backing.width || canvas.height !== backing.height) {
      canvas.width = backing.width;
      canvas.height = backing.height;
      frameDirty = true;
    }
    gl.viewport(0, 0, backing.width, backing.height);
  };

  const drawFrame = (scrollLeft: number, velocityPx: number): void => {
    if (disposed || contextLost || !program || !locations) {
      return;
    }
    if (!frameDirty && scrollLeft === lastScroll && velocityPx === lastVelocity) {
      return;
    }
    lastScroll = scrollLeft;
    lastVelocity = velocityPx;
    gl.useProgram(program);
    gl.uniform1f(locations.scroll, scrollLeft);
    gl.uniform1f(locations.velocity, velocityPx);
    if (uniformsDirty) {
      gl.uniform2f(locations.viewSize, cssWidth, cssHeight);
      gl.uniform1f(locations.amount, uniforms.amount);
      gl.uniform1f(locations.aura, uniforms.aura);
      gl.uniform1f(locations.blur, uniforms.blur);
      gl.uniform1f(locations.curve, uniforms.curve);
      gl.uniform1f(
        locations.edgeStart,
        Math.min(0.999, Math.max(0, 1 - uniforms.edgeWidth * 2)),
      );
      gl.uniform1f(locations.fade, uniforms.fade);
      gl.uniform1f(locations.gateGlow, Math.max(0, Math.min(1, uniforms.gateGlow)));
      gl.uniform1f(
        locations.gateOffset,
        Math.max(0, Math.min(0.5, uniforms.gateOffset)),
      );
      gl.uniform1f(locations.gateRefraction, Math.max(0, uniforms.gateRefraction));
      gl.uniform1f(locations.gateWidth, Math.max(1, uniforms.gateWidth));
      gl.uniform1f(locations.hue, (uniforms.hue * Math.PI) / 180);
      gl.uniform1f(locations.includeText, uniforms.includeText ? 1 : 0);
      gl.uniform1i(
        locations.samples,
        Math.max(2, Math.min(48, Math.round(uniforms.samples))),
      );
      gl.uniform1f(locations.spectrum, uniforms.spectrum);
      gl.uniform1f(
        locations.turbulence,
        Math.max(0, Math.min(1, uniforms.turbulence)),
      );
      gl.uniform1f(
        locations.turbulenceFreq,
        1 / Math.max(8, uniforms.turbulenceScale),
      );
      gl.uniform1f(locations.warp, Math.max(0, uniforms.warp));
      gl.uniform1f(locations.warpFace, Math.max(4, uniforms.warpFace));
      gl.uniform1f(
        locations.warpOffset,
        Math.max(0, Math.min(0.9, uniforms.warpOffset * 2)),
      );
      gl.uniform1f(locations.warpSharpness, Math.max(0.35, uniforms.warpSharpness));
      gl.uniform1f(locations.warpStyle, uniforms.warpStyle === "prism" ? 1 : 0);
      gl.uniform1f(locations.warpWave, Math.max(0, uniforms.warpWave));
      gl.uniform1f(locations.warpWaveBlur, Math.max(0, uniforms.warpWaveBlur));
      gl.uniform1f(locations.warpWaveKind, uniforms.warpWaveKind === "glass" ? 1 : 0);
      gl.uniform1f(locations.warpWaveLength, Math.max(8, uniforms.warpWaveLength));
      uniformsDirty = false;
    }
    // The full-screen triangle writes every pixel with blending disabled.
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frameDirty = false;
  };

  const handleContextLost = (event: Event): void => {
    event.preventDefault();
    contextLost = true;
  };
  const handleContextRestored = (): void => {
    contextLost = false;
    initialize();
    applyBackingSize(pixelRatio);
    drawFrame(lastScroll, lastVelocity);
  };
  canvas.addEventListener("webglcontextlost", handleContextLost, false);
  canvas.addEventListener("webglcontextrestored", handleContextRestored, false);

  initialize();

  return {
    dispose() {
      disposed = true;
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );
      if (imageTexture) gl.deleteTexture(imageTexture);
      if (textTexture) gl.deleteTexture(textTexture);
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      if (program) gl.deleteProgram(program);
      imageTexture = null;
      textTexture = null;
      vertexBuffer = null;
      program = null;
    },
    isContextLost() {
      return contextLost;
    },
    render(scrollLeft, velocityPx) {
      drawFrame(scrollLeft, velocityPx);
    },
    setSize(nextCssWidth, nextCssHeight, nextPixelRatio) {
      if (cssWidth !== Math.max(1, nextCssWidth) || cssHeight !== Math.max(1, nextCssHeight)) {
        uniformsDirty = true;
        frameDirty = true;
      }
      cssWidth = Math.max(1, nextCssWidth);
      cssHeight = Math.max(1, nextCssHeight);
      pixelRatio = nextPixelRatio;
      applyBackingSize(pixelRatio);
      drawFrame(lastScroll, lastVelocity);
    },
    setUniforms(nextUniforms) {
      const keys = Object.keys(nextUniforms) as (keyof DispersionRailEffectUniforms)[];
      if (keys.every((key) => nextUniforms[key] === uniforms[key])) return;
      uniforms = nextUniforms;
      uniformsDirty = true;
      frameDirty = true;
      drawFrame(lastScroll, lastVelocity);
    },
    async snapshot(scrollLeft, snapshotRatio) {
      if (disposed || contextLost) {
        throw new Error("The dispersion rail renderer is unavailable.");
      }
      const previewScroll = lastScroll;
      const previewVelocity = lastVelocity;
      applyBackingSize(snapshotRatio);
      drawFrame(scrollLeft, 0);
      try {
        return await createImageBitmap(canvas);
      } finally {
        applyBackingSize(pixelRatio);
        drawFrame(previewScroll, previewVelocity);
      }
    },
  };
}
