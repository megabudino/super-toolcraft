import type { HeroDispersionSettings } from './hero-scene-settings';
import {
  clampHeroBacking,
  compileHeroShader,
  createHeroRollerMesh,
  HERO_DISPERSION_GLSL_COMMON,
} from './hero-dispersion-shader';

export type HeroCardEdgeSide = 'left' | 'right';

export interface HeroCardRollLayout {
  canvasViewportX: number;
  cornerRadius: number;
  pathLength: number;
  pathOffset: number;
  perspective: number;
  roll: number;
  viewportWidth: number;
}

export interface HeroCardDispersionRenderer {
  dispose(): void;
  render(velocityPx: number): void;
  setLayout(layout: HeroCardRollLayout): void;
  setSize(
    cardWidth: number,
    cardHeight: number,
    horizontalBleed: number,
    verticalBleed: number,
    pixelRatio: number,
  ): void;
  setUniforms(settings: HeroDispersionSettings): void;
}

const VERTEX_SHADER = `
attribute vec2 aPosition;
uniform vec2 uViewSize;
uniform vec2 uCardOrigin;
uniform vec2 uCardSize;
uniform float uSide;
uniform float uPathLength;
uniform float uPathOffset;
uniform float uPerspective;
uniform float uRoll;
varying vec2 vPoint;

void main() {
  vec2 point = aPosition * uViewSize;
  float localX = (point.x - uCardOrigin.x) / max(uCardSize.x, 1.0);
  float outward = uSide < 0.0 ? 1.0 - localX : localX;
  float authoredPathDistance = max(uPathOffset + outward * uCardSize.x, 0.0);
  float surfacePathDistance = min(authoredPathDistance, uPathLength);
  float rollRadians = max(radians(uRoll), 0.0);
  float theta = surfacePathDistance / max(uPathLength, 1.0) * rollRadians;
  float projectedPathDistance = surfacePathDistance;
  float depth = 0.0;

  if (rollRadians > 0.0001) {
    float radius = uPathLength / rollRadians;
    projectedPathDistance = sin(theta) * radius;
    depth = (1.0 - cos(theta)) * radius;
  }

  float perspectiveScale = clamp(
    uPerspective / max(uPerspective - depth * 2.4, uPerspective * 0.42),
    1.0,
    2.4
  );
  float outerBleed = max(authoredPathDistance - uPathLength, 0.0);
  float projectedDistance =
    (projectedPathDistance + outerBleed) * perspectiveScale;
  float pathDelta = projectedDistance - authoredPathDistance;
  float midY = uCardOrigin.y + uCardSize.y * 0.5;
  vec2 rolledPoint = vec2(
    point.x + uSide * pathDelta,
    midY + (point.y - midY) * perspectiveScale
  );

  vec2 clip = vec2(
    rolledPoint.x / max(uViewSize.x, 1.0) * 2.0 - 1.0,
    1.0 - rolledPoint.y / max(uViewSize.y, 1.0) * 2.0
  );
  vPoint = point;
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;

export const HERO_DISPERSION_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uImage;
uniform vec2 uViewSize;
uniform vec2 uScreenSize;
uniform vec2 uBackingSize;
uniform vec2 uTextureSize;
uniform vec2 uCardOrigin;
uniform vec2 uCardSize;
uniform float uCornerRadius;
uniform float uCanvasViewportX;
uniform float uViewportWidth;
uniform float uSide;
uniform float uEdgeWidth;
uniform float uCurve;
uniform float uAmount;
uniform float uBlur;
uniform float uSpectrum;
uniform float uHue;
uniform float uAura;
uniform float uFade;
uniform float uVelocity;
uniform float uGateGlow;
uniform float uGateOffset;
uniform float uGateRefraction;
uniform float uGateWidth;
uniform float uTurbulence;
uniform float uTurbulenceFreq;
uniform float uWarp;
uniform float uWarpFace;
uniform float uWarpOffset;
uniform float uWarpSharpness;
uniform float uWarpStyle;
uniform float uWarpWave;
uniform float uWarpWaveBlur;
uniform float uWarpWaveKind;
uniform float uWarpWaveLength;
uniform int uSamples;

varying vec2 vPoint;

const int MAX_SAMPLES = 48;
const int AURA_SAMPLES = 12;

float roundedCardMask(vec2 local) {
  float radius = clamp(uCornerRadius, 0.0, min(uCardSize.x, uCardSize.y) * 0.5);
  vec2 halfSize = uCardSize * 0.5;
  vec2 q = abs(local - halfSize) - (halfSize - vec2(radius));
  float distance = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  return 1.0 - smoothstep(0.0, 1.0, distance);
}

vec4 sampleCard(vec2 point) {
  vec2 local = point - uCardOrigin;
  vec2 uv = local / uCardSize;
  vec2 texel = 1.0 / max(uTextureSize, vec2(1.0));
  vec2 lower = smoothstep(-texel, texel, uv);
  vec2 upper = 1.0 - smoothstep(vec2(1.0) - texel, vec2(1.0) + texel, uv);
  float coverage = lower.x * lower.y * upper.x * upper.y;
  if (coverage <= 0.0001) return vec4(0.0);
  vec2 sampleUv = clamp(uv, texel * 0.5, vec2(1.0) - texel * 0.5);
  vec4 texelColor = texture2D(uImage, sampleUv);
  float roundedCoverage = coverage * roundedCardMask(local);
  return vec4(texelColor.rgb * texelColor.a, texelColor.a) * roundedCoverage;
}
${HERO_DISPERSION_GLSL_COMMON}
void main() {
  vec2 point = vPoint;
  vec2 authoredPoint = point;
  float canvasX = gl_FragCoord.x / max(uBackingSize.x, 1.0) * uScreenSize.x;
  float viewportX = uCanvasViewportX + canvasX;
  float edgeDistance = uSide < 0.0 ? viewportX : uViewportWidth - viewportX;
  float zonePixels = max(uViewportWidth * uEdgeWidth, 1.0);
  float distance = clamp(1.0 - edgeDistance / zonePixels, 0.0, 1.0);
  float edge = distance;
  edge = pow(edge, uCurve);
  float motionVelocity = uVelocity * edge;

  float zoneWidth = 1.0;
  float inset = clamp(uWarpOffset, 0.0, 0.85);
  float outer = 1.0 - inset;
  float inner = max(outer - zoneWidth, 0.0);
  float warpT = clamp((distance - inner) / max(outer - inner, 1e-4), 0.0, 1.0);
  float rimHold = smoothstep(0.78, 1.0, warpT);
  float warpEdge = pow(warpT, uCurve) * (1.0 - rimHold);
  float warpWindow = smoothstep(0.0, 0.2, warpT) * (1.0 - rimHold);
  float midY = uCardOrigin.y + uCardSize.y * 0.5;

  if (uWarp > 0.5 || uWarpWave > 0.5) {
    if (uWarp > 0.5) {
      if (uWarpStyle < 0.5) {
        if (warpEdge > 0.0005) {
          float warp = min(uWarp * pow(warpEdge, 1.2), uCardSize.x * 0.24);
          point.x -= uSide * warp;
          point.y += (point.y - midY) * warp / max(uCardSize.y, 1.0);
        }
      } else {
        float faceCenter = mix(inner, outer, 0.92);
        float faceHalf = max(uWarpFace, 4.0) / zonePixels;
        float s = (distance - faceCenter) / max(faceHalf, 1e-4);
        float plate = smoothstep(-1.0, 1.0, s);
        float kink = exp(-s * s * max(uWarpSharpness, 0.35));
        float shift = min(uWarp * (plate * 0.88 + kink * 0.55), uCardSize.x * 0.28);
        shift *= 1.0 - rimHold;
        point.x -= uSide * shift;
        point.y += (point.y - midY) * kink * (uWarp / max(uCardSize.y, 1.0));
      }
    }

    if (uWarpWave > 0.5 && warpWindow > 0.001) {
      float waveLen = max(uWarpWaveLength, 8.0);
      float blurNorm = clamp(uWarpWaveBlur / 28.0, 0.0, 1.0);
      if (uWarpWaveKind < 0.5) {
        float phase = (point.y - midY) * 6.283185 / waveLen;
        float rippleSharp = sin(phase) + 0.28 * sin(phase * 2.0 + 0.4);
        float ripple = mix(rippleSharp, sin(phase), blurNorm);
        float wave = uWarpWave * ripple * warpWindow;
        point.x -= uSide * wave;
        point.y += cos(phase) * wave * 0.18;
      } else {
        float thickness = uWarpWave * warpWindow;
        float eps = mix(2.0, 10.0, blurNorm);
        float hRich = waveHeight(point, midY, waveLen);
        float hSoft = sin((point.y - midY) * 6.283185 / waveLen);
        float h = mix(hRich, hSoft, blurNorm);
        float hx = mix(
          waveHeight(point + vec2(eps, 0.0), midY, waveLen),
          hSoft,
          blurNorm
        );
        float hy = mix(
          waveHeight(point + vec2(0.0, eps), midY, waveLen),
          sin((point.y + eps - midY) * 6.283185 / waveLen),
          blurNorm
        );
        vec2 grad = vec2(hx - h, hy - h) / max(eps, 1e-4);
        float iorBend = 1.0 - 1.0 / 1.28;
        point -= grad * thickness * (14.0 * iorBend + 6.5);
        point -= grad * h * thickness * 0.22;
        point.y += h * thickness * 0.12;
      }
    }
  }

  float authoredCoverage = sampleCard(point).a;
  float dispersionExtent = uAmount * edge;
  float blurExtent = uBlur * edge + uWarpWaveBlur * warpWindow;
  float span = dispersionExtent + blurExtent;
  float verticalExtent = blurExtent * 0.5;
  float haloSwing = 1.0;
  float haloWave = 0.0;

  if (uTurbulence > 0.002 && edge > 0.0005) {
    float rowCoord = point.y * uTurbulenceFreq;
    float drift = motionVelocity * uTurbulenceFreq * 0.3;
    float sideSeed = uSide > 0.0 ? 13.7 : 3.1;
    float envelope = fbm(vec2(rowCoord, sideSeed + drift));
    float ragged = fbm(vec2(rowCoord * 0.55 + 31.0, sideSeed * 1.7 - drift * 0.6));
    span *= mix(1.0, 0.55 + 1.05 * envelope, uTurbulence);
    haloSwing = mix(1.0, 0.25 + 1.95 * ragged, uTurbulence);
    haloWave = (envelope - 0.5) * uTurbulence;
  }

  float extent = span + abs(motionVelocity);
  float gateCenter = 1.0 - clamp(uGateOffset, 0.0, 0.5);
  float gateHalf = max(uGateWidth, 1.0) / zonePixels;
  float gateS = (distance - gateCenter) / max(gateHalf, 1e-4);
  float band = exp(-gateS * gateS * 1.1);
  if (uGateRefraction > 0.01) {
    float ridge = min(uGateRefraction, uGateWidth * 0.6);
    point.x += uSide * exp(-gateS * gateS) * ridge;
  }

  vec4 color = vec4(0.0);
  if (extent < 0.5) {
    color = sampleCard(point);
  } else {
    vec3 accumulated = vec3(0.0);
    vec3 weightSum = vec3(0.0);
    float alpha = 0.0;
    float alphaWeight = 0.0;
    for (int i = 0; i < MAX_SAMPLES; i++) {
      if (i >= uSamples) break;
      float index = float(i);
      float jitterX = ditherPhase(gl_FragCoord.xy + index * vec2(0.754, 0.569));
      float jitterY = fract(jitterX * 61.803398 + index * 0.381966);
      float t = (index + jitterX) / float(uSamples);
      float spread = t - 0.5;
      vec3 weight = spectralWeight(t);
      vec2 offset = vec2(
        uSide * span * spread + motionVelocity * spread * 2.0,
        (jitterY * 2.0 - 1.0) * verticalExtent
      );
      vec4 texel = sampleCard(point + offset);
      accumulated += texel.rgb * weight;
      weightSum += weight;
      float luminanceWeight = (weight.r + weight.g + weight.b) / 3.0;
      alpha += texel.a * luminanceWeight;
      alphaWeight += luminanceWeight;
    }
    color = vec4(
      accumulated / max(weightSum, vec3(1e-5)),
      alpha / max(alphaWeight, 1e-5)
    );

    float auraGain = uAura * edge * min(haloSwing, 1.6);
    if (auraGain > 0.002) {
      vec3 auraColor = vec3(0.0);
      vec3 auraWeightSum = vec3(0.0);
      float auraAlpha = 0.0;
      float auraAlphaWeight = 0.0;
      for (int j = 0; j < AURA_SAMPLES; j++) {
        float index = float(j);
        float jitterX = ditherPhase(gl_FragCoord.xy + index * vec2(0.591, 0.812));
        float jitterY = fract(jitterX * 61.803398 + index * 0.618034);
        float t = (index + jitterX) / float(AURA_SAMPLES);
        float spread = t - 0.5;
        vec3 weight = spectralWeight(t);
        vec2 offset = vec2(
          uSide * (span * 2.6 + 24.0) * haloSwing * spread +
            motionVelocity * spread * 3.0,
          (jitterY * 2.0 - 1.0) * (verticalExtent * 2.5 + 12.0) +
            haloWave * 34.0
        );
        vec4 texel = sampleCard(point + offset);
        auraColor += texel.rgb * weight;
        auraWeightSum += weight;
        float luminanceWeight = (weight.r + weight.g + weight.b) / 3.0;
        auraAlpha += texel.a * luminanceWeight;
        auraAlphaWeight += luminanceWeight;
      }
      vec3 halo = auraColor / max(auraWeightSum, vec3(1e-5));
      float haloAlpha = auraAlpha / max(auraAlphaWeight, 1e-5);
      color.rgb += halo * auraGain * (1.0 - color.rgb);
      color.a += haloAlpha * auraGain * 0.9 * (1.0 - color.a);
    }
  }

  float gateGain = uGateGlow * band;
  if (gateGain > 0.004) {
    vec4 lightSample =
      sampleCard(point) * 0.34 +
      sampleCard(point + vec2(7.0, 0.0)) * 0.22 +
      sampleCard(point - vec2(7.0, 0.0)) * 0.22 +
      sampleCard(point + vec2(0.0, 9.0)) * 0.11 +
      sampleCard(point - vec2(0.0, 9.0)) * 0.11;
    vec3 ramp = spectralWeight(clamp(0.5 + gateS * 0.5, 0.0, 1.0));
    ramp /= max(ramp.r + ramp.g + ramp.b, 1e-4);
    vec3 tint = mix(vec3(1.0 / 3.0), ramp, clamp(abs(gateS), 0.0, 1.0));
    float motionKick = 1.0 + min(abs(motionVelocity) / 48.0, 1.0) * 0.7;
    float flare = gateGain * motionKick;
    float lightCoverage = clamp(lightSample.a, 0.0, 1.0);
    vec3 add = lightSample.rgb * flare * 1.15 + tint * flare * lightCoverage * 0.55;
    float addAlpha = flare * lightCoverage * 0.78;
    color.rgb = color.rgb + add * (1.0 - color.rgb);
    color.a = color.a + addAlpha * (1.0 - color.a);
  }

  float outsideAuthoredContent = 1.0 - smoothstep(0.001, 0.08, authoredCoverage);
  float neutral = min(color.r, min(color.g, color.b));
  vec3 spectralFringe = max(color.rgb - vec3(neutral), vec3(0.0));
  float spectralAlpha = max(spectralFringe.r, max(spectralFringe.g, spectralFringe.b));
  color = mix(color, vec4(spectralFringe, spectralAlpha), outsideAuthoredContent);

  float fadeAmount = uFade * pow(edge, 2.0);
  gl_FragColor = color * (1.0 - fadeAmount);
}
`;

function getTexImageSourceSize(image: TexImageSource) {
  const dimensions = image as TexImageSource & {
    displayHeight?: number;
    displayWidth?: number;
    height?: number;
    naturalHeight?: number;
    naturalWidth?: number;
    videoHeight?: number;
    videoWidth?: number;
    width?: number;
  };
  const width =
    dimensions.naturalWidth ??
    dimensions.videoWidth ??
    dimensions.displayWidth ??
    dimensions.width ??
    1;
  const height =
    dimensions.naturalHeight ??
    dimensions.videoHeight ??
    dimensions.displayHeight ??
    dimensions.height ??
    1;
  return {
    height: Number.isFinite(height) ? Math.max(1, height) : 1,
    width: Number.isFinite(width) ? Math.max(1, width) : 1,
  };
}

export function createHeroCardDispersionRenderer(
  canvas: HTMLCanvasElement,
  image: TexImageSource,
  side: HeroCardEdgeSide,
): HeroCardDispersionRenderer {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    stencil: false,
  });
  if (!gl) throw new Error('The hero dispersion effect requires WebGL support.');

  const vertex = compileHeroShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileHeroShader(gl, gl.FRAGMENT_SHADER, HERO_DISPERSION_FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to allocate the hero dispersion program.');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'unknown error';
    gl.deleteProgram(program);
    throw new Error(`Hero dispersion program linking failed: ${info}`);
  }

  gl.useProgram(program);
  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) throw new Error('Unable to allocate the hero roller mesh.');
  const rollerMesh = createHeroRollerMesh();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, rollerMesh, gl.STATIC_DRAW);
  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  if (!texture) throw new Error('Unable to allocate the hero card texture.');
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const textureSize = getTexImageSourceSize(image);

  const location = (name: string) => gl.getUniformLocation(program, name);
  const locations = {
    amount: location('uAmount'),
    aura: location('uAura'),
    backingSize: location('uBackingSize'),
    blur: location('uBlur'),
    canvasViewportX: location('uCanvasViewportX'),
    cardOrigin: location('uCardOrigin'),
    cardSize: location('uCardSize'),
    cornerRadius: location('uCornerRadius'),
    curve: location('uCurve'),
    edgeWidth: location('uEdgeWidth'),
    fade: location('uFade'),
    gateGlow: location('uGateGlow'),
    gateOffset: location('uGateOffset'),
    gateRefraction: location('uGateRefraction'),
    gateWidth: location('uGateWidth'),
    hue: location('uHue'),
    image: location('uImage'),
    pathLength: location('uPathLength'),
    pathOffset: location('uPathOffset'),
    perspective: location('uPerspective'),
    roll: location('uRoll'),
    samples: location('uSamples'),
    screenSize: location('uScreenSize'),
    side: location('uSide'),
    spectrum: location('uSpectrum'),
    turbulence: location('uTurbulence'),
    turbulenceFreq: location('uTurbulenceFreq'),
    textureSize: location('uTextureSize'),
    velocity: location('uVelocity'),
    viewSize: location('uViewSize'),
    viewportWidth: location('uViewportWidth'),
    warp: location('uWarp'),
    warpFace: location('uWarpFace'),
    warpOffset: location('uWarpOffset'),
    warpSharpness: location('uWarpSharpness'),
    warpStyle: location('uWarpStyle'),
    warpWave: location('uWarpWave'),
    warpWaveBlur: location('uWarpWaveBlur'),
    warpWaveKind: location('uWarpWaveKind'),
    warpWaveLength: location('uWarpWaveLength'),
  };

  let disposed = false;
  let contextLost = false;
  let cssWidth = 1;
  let cssHeight = 1;
  let cardWidth = 1;
  let cardHeight = 1;
  let horizontalBleed = 0;
  let verticalBleed = 0;
  let lastVelocity = 0;
  let settings: HeroDispersionSettings | null = null;
  let layout: HeroCardRollLayout = {
    canvasViewportX: 0,
    cornerRadius: 0,
    pathLength: 1,
    pathOffset: 0,
    perspective: 1400,
    roll: 0,
    viewportWidth: 1,
  };

  gl.uniform1i(locations.image, 0);
  gl.uniform1f(locations.side, side === 'left' ? -1 : 1);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  const draw = (velocityPx: number) => {
    if (disposed || contextLost || !settings) return;
    lastVelocity = velocityPx;
    gl.useProgram(program);
    gl.uniform2f(locations.viewSize, cssWidth, cssHeight);
    gl.uniform2f(locations.screenSize, cssWidth, cssHeight);
    gl.uniform2f(locations.backingSize, canvas.width, canvas.height);
    gl.uniform2f(locations.textureSize, textureSize.width, textureSize.height);
    gl.uniform2f(locations.cardOrigin, side === 'left' ? horizontalBleed : 0, verticalBleed);
    gl.uniform2f(locations.cardSize, cardWidth, cardHeight);
    gl.uniform1f(locations.cornerRadius, layout.cornerRadius);
    gl.uniform1f(locations.canvasViewportX, layout.canvasViewportX);
    gl.uniform1f(locations.viewportWidth, Math.max(1, layout.viewportWidth));
    gl.uniform1f(locations.pathLength, layout.pathLength);
    gl.uniform1f(locations.pathOffset, layout.pathOffset);
    gl.uniform1f(locations.perspective, layout.perspective);
    gl.uniform1f(locations.roll, layout.roll);
    gl.uniform1f(locations.amount, settings.amount);
    gl.uniform1f(locations.aura, settings.aura);
    gl.uniform1f(locations.blur, settings.blur);
    gl.uniform1f(locations.curve, settings.curve);
    gl.uniform1f(locations.edgeWidth, Math.min(0.5, Math.max(0, settings.edgeWidth / 100)));
    gl.uniform1f(locations.fade, settings.edgeFade);
    gl.uniform1f(locations.gateGlow, settings.gateGlow);
    gl.uniform1f(locations.gateOffset, settings.gateOffset / 100);
    gl.uniform1f(locations.gateRefraction, settings.gateRefraction);
    gl.uniform1f(locations.gateWidth, settings.gateWidth);
    gl.uniform1f(locations.hue, (settings.hue * Math.PI) / 180);
    gl.uniform1i(locations.samples, Math.max(2, Math.min(48, Math.round(settings.count))));
    gl.uniform1f(locations.spectrum, settings.spectrum);
    gl.uniform1f(locations.turbulence, settings.turbulence);
    gl.uniform1f(locations.turbulenceFreq, 1 / Math.max(8, settings.turbulenceScale));
    gl.uniform1f(locations.velocity, velocityPx);
    gl.uniform1f(locations.warp, settings.warp);
    gl.uniform1f(locations.warpFace, settings.warpFace);
    gl.uniform1f(locations.warpOffset, settings.warpOffset / 100);
    gl.uniform1f(locations.warpSharpness, settings.warpSharpness);
    gl.uniform1f(locations.warpStyle, settings.warpStyle === 'prism' ? 1 : 0);
    gl.uniform1f(locations.warpWave, settings.warpWaveEnabled ? settings.warpWave : 0);
    gl.uniform1f(locations.warpWaveBlur, settings.warpWaveEnabled ? settings.warpWaveBlur : 0);
    gl.uniform1f(locations.warpWaveKind, settings.warpWaveKind === 'glass' ? 1 : 0);
    gl.uniform1f(locations.warpWaveLength, settings.warpWaveLength);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, rollerMesh.length / 2);
  };

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
  };
  const handleContextRestored = () => {
    contextLost = false;
    draw(lastVelocity);
  };
  canvas.addEventListener('webglcontextlost', handleContextLost, false);
  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

  return {
    dispose() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      gl.deleteTexture(texture);
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      gl.deleteProgram(program);
    },
    render(velocityPx) {
      draw(velocityPx);
    },
    setLayout(nextLayout) {
      layout = {
        canvasViewportX: Number.isFinite(nextLayout.canvasViewportX)
          ? nextLayout.canvasViewportX
          : 0,
        cornerRadius: Math.max(0, Math.min(160, nextLayout.cornerRadius)),
        pathLength: Math.max(1, nextLayout.pathLength),
        pathOffset: Math.max(0, nextLayout.pathOffset),
        perspective: Math.max(1, nextLayout.perspective),
        roll: Math.max(0, Math.min(85, nextLayout.roll)),
        viewportWidth: Math.max(1, nextLayout.viewportWidth),
      };
      draw(lastVelocity);
    },
    setSize(nextCardWidth, nextCardHeight, nextHorizontalBleed, nextVerticalBleed, pixelRatio) {
      cardWidth = Math.max(1, nextCardWidth);
      cardHeight = Math.max(1, nextCardHeight);
      horizontalBleed = Math.max(0, nextHorizontalBleed);
      verticalBleed = Math.max(0, nextVerticalBleed);
      cssWidth = cardWidth + horizontalBleed;
      cssHeight = cardHeight + verticalBleed * 2;
      const backing = clampHeroBacking(cssWidth, cssHeight, pixelRatio);
      if (canvas.width !== backing.width || canvas.height !== backing.height) {
        canvas.width = backing.width;
        canvas.height = backing.height;
      }
      gl.viewport(0, 0, backing.width, backing.height);
      draw(lastVelocity);
    },
    setUniforms(nextSettings) {
      settings = nextSettings;
      draw(lastVelocity);
    },
  };
}
