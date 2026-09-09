import { HERO_DISPERSION_GLSL_COMMON, HERO_MAX_MOTION_OFFSET_PX } from './hero-dispersion-shader';
import { HERO_LENS_NEAR } from './hero-sphere-layout';

const PI = Math.PI;
const TWO_PI = Math.PI * 2;

export const HERO_SPHERE_SCENE_VERTEX_SHADER = `
attribute vec2 aPosition;
uniform vec2 uViewSize;
uniform vec2 uCardOrigin;
uniform vec2 uCardSize;
uniform float uThetaCenter;
uniform float uPhiCenter;
uniform float uBendX;
uniform float uBendY;
uniform float uRx;
uniform float uRy;
uniform float uRz;
uniform float uFocal;
uniform vec2 uPrincipal;
uniform vec2 uRenderOrigin;
uniform vec2 uRenderSize;
varying vec2 vPoint;

void main() {
  const float NEAR = ${HERO_LENS_NEAR.toFixed(1)};
  vec2 point = aPosition * uViewSize;
  float arc = point.x - uCardOrigin.x - uCardSize.x * 0.5;
  float theta = uThetaCenter + arc / max(uRx, 1.0);
  float phi = uPhiCenter - (point.y - uCardOrigin.y - uCardSize.y * 0.5) / max(uRy, 1.0);
  vec3 local = vec3(
    uRx * sin(theta),
    uRy * sin(phi),
    uRz * (uBendX * (1.0 - cos(theta)) + uBendY * (1.0 - cos(phi)))
  );
  float w = uFocal - local.z;
  vec2 principal = vec2(
    uPrincipal.x + uRenderOrigin.x,
    uRenderSize.y - (uPrincipal.y + uRenderOrigin.y)
  );
  vec2 ndcPrincipal = vec2(
    principal.x / max(uRenderSize.x, 1.0) * 2.0 - 1.0,
    principal.y / max(uRenderSize.y, 1.0) * 2.0 - 1.0
  );
  vec2 ndcOffset = local.xy * 2.0 / max(uRenderSize, vec2(1.0));
  vPoint = point;
  gl_Position = vec4(ndcPrincipal * w + ndcOffset * uFocal, w - 2.0 * NEAR, w);
}
`;

export const HERO_SCENE_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uImage;
uniform vec2 uTextureSize;
uniform vec2 uCardOrigin;
uniform vec2 uCardSize;
uniform float uCornerRadius;
varying vec2 vPoint;

float roundedCardMask(vec2 local) {
  float radius = clamp(uCornerRadius, 0.0, min(uCardSize.x, uCardSize.y) * 0.5);
  vec2 halfSize = uCardSize * 0.5;
  vec2 q = abs(local - halfSize) - (halfSize - vec2(radius));
  float distance = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  return 1.0 - smoothstep(0.0, 1.0, distance);
}

vec4 sampleCard(vec2 point) {
  vec2 local = point - uCardOrigin;
  vec2 uv = local / max(uCardSize, vec2(1.0));
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

void main() {
  gl_FragColor = sampleCard(vPoint);
}
`;

export const HERO_FIELD_VERTEX_SHADER = `
attribute vec2 aAngles;
uniform float uBendX;
uniform float uBendY;
uniform float uRx;
uniform float uRy;
uniform float uRz;
uniform float uFocal;
uniform vec2 uPrincipal;
uniform vec2 uScreenSize;
varying vec2 vAngles;

void main() {
  const float NEAR = ${HERO_LENS_NEAR.toFixed(1)};
  float theta = aAngles.x;
  float phi = aAngles.y;
  vec3 local = vec3(
    uRx * sin(theta),
    uRy * sin(phi),
    uRz * (uBendX * (1.0 - cos(theta)) + uBendY * (1.0 - cos(phi)))
  );
  float w = uFocal - local.z;
  vec2 principalBottom = vec2(uPrincipal.x, uScreenSize.y - uPrincipal.y);
  vec2 ndcPrincipal = principalBottom / max(uScreenSize, vec2(1.0)) * 2.0 - 1.0;
  vec2 ndcOffset = local.xy * 2.0 / max(uScreenSize, vec2(1.0));
  vAngles = aAngles;
  gl_Position = vec4(ndcPrincipal * w + ndcOffset * uFocal, w - 2.0 * NEAR, w);
}
`;

export const HERO_FIELD_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vAngles;

vec2 encodeAngle(float code) {
  float highByte = floor(code / 256.0);
  return vec2(highByte, code - highByte * 256.0) / 255.0;
}

void main() {
  float thetaNormalized = clamp((vAngles.x + 3.14159265) / 6.28318531, 0.0, 0.9999847);
  float phiNormalized = clamp((vAngles.y + 1.57079633) / 3.14159265, 0.0, 1.0);
  float thetaCode = floor(thetaNormalized * 65534.0 + 0.5) + 1.0;
  float phiCode = floor(phiNormalized * 65535.0 + 0.5);
  gl_FragColor = vec4(encodeAngle(thetaCode), encodeAngle(phiCode));
}
`;

export const HERO_FULLSCREEN_VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const HERO_DISPERSION_POST_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uField;
uniform vec2 uScreenSize;
uniform vec2 uBackingSize;
uniform vec2 uSceneSize;
uniform vec2 uSceneMargin;
uniform vec4 uPanelBounds;
uniform vec2 uPanRate;
uniform float uFrameDt;
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
uniform float uCardHeight;
uniform float uPitch;
uniform float uRowCount;
uniform float uRowRates[6];
uniform float uRx;
uniform float uRy;
uniform float uPhi0;
uniform int uSamples;
uniform float uGrain;
uniform float uGrainSize;
uniform float uCrt;
uniform float uCrtScanlines;
uniform float uCrtPitch;
uniform float uCrtChroma;
uniform float uCrtFlicker;
uniform float uEffectTime;

const int MAX_SAMPLES = 48;
const int AURA_SAMPLES = 12;
const float MOTION_SAMPLE_DENSITY = 1.6;
const float MOTION_SAMPLE_FLOOR = 8.0;
// Roll back to a 16.0 floor for half savings, or set activeSamples = uSamples for full parity.
const float MOTION_CHROMA_BAND = 0.12;
// Width (in staticEdge units) of the smooth spectral-order blend at the zone edge.
// 0.001 ~= the old hard flip (rollback); larger = wider, softer transition.
const float EFFECT_EPSILON = 0.0001;
const float EFFECT_FRAME_SECONDS = 4.0;
const float EFFECT_FRAME_COUNT = 240.0;
const vec2 EFFECT_HASH_CELL_PERIOD_A = vec2(251.0, 241.0);
const vec2 EFFECT_HASH_CELL_PERIOD_B = vec2(239.0, 233.0);
const float GRAIN_FPS = 60.0;
const float GRAIN_STRENGTH = 0.40;
const float GRAIN_MIDTONE_FLOOR = 0.25;
const float SPARK_DENSITY = 0.06;
const float SPARK_STRENGTH = 0.55;
const float SPARK_CONDITIONAL_MEAN = 0.15;
const float LINE_SHARE = 0.25;
const float GRAIN_FILMIC_SHARE = 0.35;
const vec2 GRAIN_BASE_HASH_SALT = vec2(3.0, 11.0);
const vec2 GRAIN_SPARK_MASK_HASH_SALT = vec2(17.0, 29.0);
const vec2 GRAIN_SPARK_VALUE_HASH_SALT = vec2(37.0, 43.0);
const vec2 GRAIN_LINE_HASH_SALT = vec2(8.0, 24.0);
const float CRT_MASK_SHARE = 0.5;
const float CRT_SCANLINE_DEPTH = 0.32;
const float CRT_ROLL_HZ = 0.8;
const float CRT_ROLL_PERIOD_SECONDS = 5.0;
const float CRT_BAR_HZ = 0.16;
const float CRT_BAR_PERIOD_SECONDS = 6.25;
const float CRT_BAR_SHARE = 0.5;
const float JITTER_PX = 1.5;
const float CRT_FLICKER_DEPTH = 0.12;
const float CRT_FLICKER_HZ_A = 11.0;
const float CRT_FLICKER_HZ_B = 7.3;
const float CRT_FLICKER_PERIOD_A_SECONDS = 1.0;
const float CRT_FLICKER_PERIOD_B_SECONDS = 10.0;
const float CRT_FLICKER_PHASE_JITTER = 0.08;
const vec2 CRT_JITTER_HASH_SALT = vec2(71.0, 79.0);
const vec2 CRT_FLICKER_HASH_SALT = vec2(89.0, 97.0);
const float TWO_PI = 6.28318530718;
#define uViewSize vec2(4.0 * uCardHeight, 1.0)
${HERO_DISPERSION_GLSL_COMMON}
#undef uViewSize

float decode16(vec2 bytes) {
  vec2 values = floor(bytes * 255.0 + 0.5);
  return values.x * 256.0 + values.y;
}

vec3 decodeField(vec4 packedValue) {
  float thetaCode = decode16(packedValue.rg);
  if (thetaCode < 0.5) return vec3(0.0);
  float phiCode = decode16(packedValue.ba);
  float theta = ((thetaCode - 1.0) / 65534.0) * 6.28318531 - 3.14159265;
  float phi = (phiCode / 65535.0) * 3.14159265 - 1.57079633;
  return vec3(theta, phi, 1.0);
}

float thetaDelta(float to, float from) {
  float delta = to - from;
  return atan(sin(delta), cos(delta));
}

vec3 fieldAt(vec2 pixel) {
  if (
    any(lessThan(pixel, vec2(0.0))) ||
    any(greaterThan(pixel, uScreenSize))
  ) return vec3(0.0);
  vec2 uv = clamp(pixel / max(uScreenSize, vec2(1.0)), vec2(0.0), vec2(1.0));
  return decodeField(texture2D(uField, uv));
}

vec2 gradientFor(vec3 center, vec3 negative, vec3 positive, float step, float component) {
  float c = component < 0.5 ? center.x : center.y;
  float n = component < 0.5 ? negative.x : negative.y;
  float p = component < 0.5 ? positive.x : positive.y;
  if (negative.z > 0.5 && positive.z > 0.5) {
    float delta = component < 0.5 ? thetaDelta(p, n) : p - n;
    return vec2(delta / (2.0 * step), 2.0);
  }
  if (positive.z > 0.5) {
    float delta = component < 0.5 ? thetaDelta(p, c) : p - c;
    return vec2(delta / step, 1.0);
  }
  if (negative.z > 0.5) {
    float delta = component < 0.5 ? thetaDelta(c, n) : c - n;
    return vec2(delta / step, 1.0);
  }
  return vec2(0.0);
}

vec4 fieldGradients(vec2 pixel, vec3 center) {
  vec2 cssStep = uScreenSize / max(uBackingSize, vec2(1.0));
  vec3 left = fieldAt(pixel - vec2(cssStep.x, 0.0));
  vec3 right = fieldAt(pixel + vec2(cssStep.x, 0.0));
  vec3 bottom = fieldAt(pixel - vec2(0.0, cssStep.y));
  vec3 top = fieldAt(pixel + vec2(0.0, cssStep.y));
  float thetaX = gradientFor(center, left, right, cssStep.x, 0.0).x;
  float thetaY = gradientFor(center, bottom, top, cssStep.y, 0.0).x;
  float phiX = gradientFor(center, left, right, cssStep.x, 1.0).x;
  float phiY = gradientFor(center, bottom, top, cssStep.y, 1.0).x;
  return vec4(thetaX, thetaY, phiX, phiY);
}

vec2 boundedMotion(vec2 value) {
  float magnitude = length(value);
  if (magnitude <= ${HERO_MAX_MOTION_OFFSET_PX.toFixed(1)}) return value;
  return value * (${HERO_MAX_MOTION_OFFSET_PX.toFixed(1)} / max(magnitude, 0.0001));
}

vec2 projectFallback(float delta, vec2 gradient) {
  float lengthSquared = dot(gradient, gradient);
  return lengthSquared > 1e-8 ? gradient * (delta / lengthSquared) : vec2(0.0);
}

vec2 screenMotion(vec4 gradients, vec2 angularDelta) {
  vec2 thetaGradient = gradients.xy;
  vec2 phiGradient = gradients.zw;
  float determinant = thetaGradient.x * phiGradient.y - thetaGradient.y * phiGradient.x;
  if (abs(determinant) > 1e-8) {
    return boundedMotion(vec2(
      (angularDelta.x * phiGradient.y - thetaGradient.y * angularDelta.y) / determinant,
      (thetaGradient.x * angularDelta.y - angularDelta.x * phiGradient.x) / determinant
    ));
  }
  return boundedMotion(
    projectFallback(angularDelta.x, thetaGradient) +
    projectFallback(angularDelta.y, phiGradient)
  );
}

float rowRate(float index) {
  if (index < 0.5) return uRowRates[0];
  if (index < 1.5) return uRowRates[1];
  if (index < 2.5) return uRowRates[2];
  if (index < 3.5) return uRowRates[3];
  if (index < 4.5) return uRowRates[4];
  return uRowRates[5];
}

vec4 sampleScene(vec2 point) {
  vec2 uv = (point + uSceneMargin) / max(uSceneSize, vec2(1.0));
  vec2 sceneTexel = 1.0 / max(uSceneSize, vec2(1.0));
  vec2 sceneInside = smoothstep(vec2(0.0), sceneTexel, uv) *
    (1.0 - smoothstep(vec2(1.0) - sceneTexel, vec2(1.0), uv));
  return texture2D(uScene, clamp(uv, vec2(0.0), vec2(1.0))) *
    sceneInside.x * sceneInside.y;
}

float wrappedEffectFrame() {
  return floor(mod(uEffectTime, EFFECT_FRAME_SECONDS) * GRAIN_FPS);
}

float effectHash(vec2 cell, float frame, vec2 salt) {
  vec2 cellFloor = floor(cell);
  vec2 cellDomainA = mod(
    cellFloor + salt,
    EFFECT_HASH_CELL_PERIOD_A
  );
  vec2 cellDomainB = mod(
    cellFloor.yx + salt.yx,
    EFFECT_HASH_CELL_PERIOD_B
  );
  float frameDomain = mod(frame, EFFECT_FRAME_COUNT);
  vec2 frameSeed = fract(
    (vec2(frameDomain) + salt.yx) * vec2(0.06711056, 0.073133)
  );
  vec2 frameMix = fract(
    frameSeed *
      (frameSeed.yx + vec2(0.31, 0.47)) *
      vec2(3.17, 4.13)
  );
  vec3 p3 = fract(vec3(
    cellDomainA.x * 0.1031 + cellDomainB.y * 0.0713 + frameMix.x,
    cellDomainA.y * 0.0973 + cellDomainB.x * 0.0671 + frameMix.y,
    (cellDomainA.x + cellDomainA.y) * 0.0317 +
      (cellDomainB.x + cellDomainB.y) * 0.0371 +
      frameMix.x + frameMix.y
  ));
  float folded = fract(dot(p3, p3.yzx + 1.19));
  p3 = fract(p3 + folded);
  return fract((p3.x + p3.y) * (p3.z + 0.47) * 1.73);
}

float straightChannel(float premultiplied, float alpha) {
  return alpha > EFFECT_EPSILON
    ? clamp(premultiplied / alpha, 0.0, 1.0)
    : 0.0;
}

vec4 reconstructCrtChroma(vec4 redTexel, vec4 centerTexel, vec4 blueTexel) {
  float reconstructedAlpha = centerTexel.a;
  vec3 straightColor = vec3(
    straightChannel(redTexel.r, redTexel.a),
    straightChannel(centerTexel.g, centerTexel.a),
    straightChannel(blueTexel.b, blueTexel.a)
  );
  return vec4(straightColor * reconstructedAlpha, reconstructedAlpha);
}

vec4 sampleCrtScene(vec2 point) {
  if (uCrtChroma > EFFECT_EPSILON) {
    vec2 chromaOffset = vec2(uCrtChroma, 0.0);
    vec4 redTexel = sampleScene(point + chromaOffset);
    vec4 centerTexel = sampleScene(point);
    vec4 blueTexel = sampleScene(point - chromaOffset);
    return reconstructCrtChroma(redTexel, centerTexel, blueTexel);
  }
  return sampleScene(point);
}

float crtBackingScale() {
  return max(
    1.0,
    0.5 * (uBackingSize.x / max(uScreenSize.x, 1.0) +
      uBackingSize.y / max(uScreenSize.y, 1.0))
  );
}

float crtLinePitch() {
  return max(uCrtPitch * crtBackingScale(), 1.0);
}

float rollingBand(float phase) {
  float distanceFromCenter = abs(fract(phase) - 0.5);
  return 1.0 - smoothstep(0.12, 0.5, distanceFromCenter);
}

vec4 applyMotionSurfaceEffects(vec4 sourceColor) {
  vec4 result = sourceColor;
  if (uCrt > EFFECT_EPSILON) {
    float pitch = crtLinePitch();
    float crtRollTime = mod(uEffectTime, CRT_ROLL_PERIOD_SECONDS);
    // Negative scan time moves lines up; the positive bar phase deliberately counter-rolls down.
    float scanPhase = fract(gl_FragCoord.y / pitch - crtRollTime * CRT_ROLL_HZ);
    float scanProfile = pow(0.5 + 0.5 * cos(scanPhase * TWO_PI), 3.0);
    result.rgb *= 1.0 - uCrtScanlines * CRT_SCANLINE_DEPTH * scanProfile;

    float triad = mod(floor(gl_FragCoord.x / max(pitch / 3.0, 1.0)), 3.0);
    vec3 aperture = triad < 0.5
      ? vec3(1.03, 0.96, 0.96)
      : triad < 1.5
        ? vec3(0.96, 1.03, 0.96)
        : vec3(0.96, 0.96, 1.03);
    result.rgb *= mix(vec3(1.0), aperture, clamp(uCrtScanlines * CRT_MASK_SHARE, 0.0, 1.0));

    float crtBarTime = mod(uEffectTime, CRT_BAR_PERIOD_SECONDS);
    float barPhase = fract(
      gl_FragCoord.y / max(uBackingSize.y, 1.0) + crtBarTime * CRT_BAR_HZ
    );
    float barGain = rollingBand(barPhase) * uCrtFlicker * uCrt * CRT_BAR_SHARE;
    result.rgb *= 1.0 + barGain;

    float flickerFrame = wrappedEffectFrame();
    float flickerPhaseJitter =
      (effectHash(vec2(0.0), flickerFrame, CRT_FLICKER_HASH_SALT) - 0.5) *
      CRT_FLICKER_PHASE_JITTER;
    float crtFlickerTimeA = mod(uEffectTime, CRT_FLICKER_PERIOD_A_SECONDS);
    float crtFlickerTimeB = mod(uEffectTime, CRT_FLICKER_PERIOD_B_SECONDS);
    float flicker = clamp(
      0.5 +
        0.25 * sin((crtFlickerTimeA * CRT_FLICKER_HZ_A + flickerPhaseJitter) * TWO_PI) +
        0.25 * sin((crtFlickerTimeB * CRT_FLICKER_HZ_B - flickerPhaseJitter) * TWO_PI),
      0.0,
      1.0
    );
    result.rgb *= 1.0 - uCrtFlicker * CRT_FLICKER_DEPTH * flicker;
    result.rgb = clamp(result.rgb, vec3(0.0), vec3(1.0));
  }

  if (uGrain > EFFECT_EPSILON) {
    vec2 backingScale = uBackingSize / max(uScreenSize, vec2(1.0));
    float cellSize = max(uGrainSize * 0.5 * (backingScale.x + backingScale.y), 1.0);
    float grainFrame = wrappedEffectFrame();
    vec2 grainCell = floor(gl_FragCoord.xy / cellSize);
    float baseNoise = effectHash(grainCell, grainFrame, GRAIN_BASE_HASH_SALT) - 0.5;
    float sparkMaskHash = effectHash(
      grainCell,
      grainFrame,
      GRAIN_SPARK_MASK_HASH_SALT
    );
    float sparkValueHash = effectHash(
      grainCell,
      grainFrame,
      GRAIN_SPARK_VALUE_HASH_SALT
    );
    float sparkMask = step(1.0 - SPARK_DENSITY * uGrain, sparkMaskHash);
    float spark = sparkMask * (sparkValueHash - 0.35);
    float neutralSpark = spark - sparkMask * SPARK_CONDITIONAL_MEAN;
    float rowCell = floor(gl_FragCoord.y / cellSize);
    float lineNoise = (
      effectHash(vec2(rowCell, 0.0), grainFrame, GRAIN_LINE_HASH_SALT) - 0.5
    ) * LINE_SHARE;
    float luma = dot(result.rgb, vec3(0.2126, 0.7152, 0.0722));
    float filmic = mix(
      GRAIN_MIDTONE_FLOOR,
      1.0,
      1.0 - abs(clamp(luma, 0.0, 1.0) * 2.0 - 1.0)
    );
    float midtone = mix(1.0, filmic, GRAIN_FILMIC_SHARE);
    vec3 snow = vec3(
      baseNoise * GRAIN_STRENGTH + neutralSpark * SPARK_STRENGTH + lineNoise
    );
    result.rgb = clamp(result.rgb + snow * uGrain * midtone, vec3(0.0), vec3(1.0));
  }
  return result;
}

#ifdef HERO_COMPACT_POST
void main() {
  vec2 point = gl_FragCoord.xy / max(uBackingSize, vec2(1.0)) * uScreenSize;
  vec3 field = fieldAt(point);
  if (field.z < 0.5) {
    gl_FragColor = sampleScene(point);
    return;
  }

  vec4 gradients = fieldGradients(point, field);
  float v = (uPhi0 - field.y) * uRy;
  float safePitch = max(uPitch, 1.0);
  float safeRowCount = max(uRowCount, 1.0);
  float rowOrdinal = floor(v / safePitch + safeRowCount * 0.5);
  float rowIndex = mod(rowOrdinal, safeRowCount);
  vec2 angularRate = vec2(rowRate(rowIndex) + uPanRate.x, uPanRate.y);
  vec2 motionVelocity = screenMotion(gradients, angularRate * min(uFrameDt, 0.05));
  motionVelocity = boundedMotion(motionVelocity * uVelocity * 1.6);
  vec2 motionSmear = motionVelocity;
  float authoredCoverage = sampleScene(point).a;

  vec2 crtTrackingOffset = vec2(0.0);
  if (uCrt > EFFECT_EPSILON) {
    float lineIndex = floor(gl_FragCoord.y / crtLinePitch());
    float trackingFrame = wrappedEffectFrame();
    float rowJitter = (
      effectHash(vec2(lineIndex, 0.0), trackingFrame, CRT_JITTER_HASH_SALT) - 0.5
    ) * JITTER_PX * uCrt;
    crtTrackingOffset = vec2(rowJitter, 0.0);
  }

  float motionKernel = 2.0 * length(motionVelocity);
  int activeSamples = int(
    clamp(ceil(motionKernel * MOTION_SAMPLE_DENSITY), MOTION_SAMPLE_FLOOR, float(uSamples))
  );
  vec4 color = vec4(0.0);
  if (length(motionVelocity) < 1.5) {
    color = applyMotionSurfaceEffects(sampleCrtScene(point + crtTrackingOffset));
  } else {
    vec3 accumulated = vec3(0.0);
    vec3 weightSum = vec3(0.0);
    float alpha = 0.0;
    float alphaWeight = 0.0;
    for (int i = 0; i < MAX_SAMPLES; i++) {
      if (i >= activeSamples) break;
      float index = float(i);
      float jitterX = ditherPhase(gl_FragCoord.xy + index * vec2(0.754, 0.569));
      float t = (index + jitterX) / float(activeSamples);
      float spread = t - 0.5;
      vec3 weight = spectralWeight(t);
      vec2 offset = motionSmear * spread * 2.0;
      vec4 texel = sampleCrtScene(point + offset + crtTrackingOffset);
      accumulated += texel.rgb * weight;
      weightSum += weight;
      float luminanceWeight = (weight.r + weight.g + weight.b) / 3.0;
      alpha += texel.a * luminanceWeight;
      alphaWeight += luminanceWeight;
    }
    color = applyMotionSurfaceEffects(
      vec4(accumulated / max(weightSum, vec3(1e-5)), alpha / max(alphaWeight, 1e-5))
    );
  }

  float outsideAuthoredContent = 1.0 - smoothstep(0.001, 0.08, authoredCoverage);
  float neutral = min(color.r, min(color.g, color.b));
  vec3 spectralFringe = max(color.rgb - vec3(neutral), vec3(0.0));
  float spectralAlpha = max(spectralFringe.r, max(spectralFringe.g, spectralFringe.b));
  gl_FragColor = mix(color, vec4(spectralFringe, spectralAlpha), outsideAuthoredContent);
}
#else
void main() {
  vec2 point = gl_FragCoord.xy / max(uBackingSize, vec2(1.0)) * uScreenSize;
  vec3 field = fieldAt(point);
  if (field.z < 0.5) {
    gl_FragColor = sampleScene(point);
    return;
  }

  vec4 gradients = fieldGradients(point, field);
  vec2 dirTheta = normalize(gradients.xy + vec2(1e-8, 0.0));
  float thetaWidth = max((uPanelBounds.y - uPanelBounds.x) * uEdgeWidth, 1e-5);
  float sideDistance = uEdgeWidth <= 0.0 ? 0.0 : field.x < 0.0
    ? clamp(1.0 - (field.x - uPanelBounds.x) / thetaWidth, 0.0, 1.0)
    : clamp(1.0 - (uPanelBounds.y - field.x) / thetaWidth, 0.0, 1.0);
  vec2 sideDirection = (field.x < 0.0 ? -1.0 : 1.0) * dirTheta;
  float distance = sideDistance;
  vec2 direction = sideDirection;
  vec2 perpendicular = vec2(-direction.y, direction.x);
  float panelAngularWidth = (uPanelBounds.y - uPanelBounds.x) * uEdgeWidth;
  float panelRadiansPerPixel = length(gradients.xy);
  float activeZonePixels = panelAngularWidth / max(panelRadiansPerPixel, 1e-5);
  activeZonePixels = clamp(activeZonePixels, 1.0, max(uScreenSize.x, uScreenSize.y));
  float staticEdge = pow(distance, uCurve);
  float v = (uPhi0 - field.y) * uRy;
  float safePitch = max(uPitch, 1.0);
  float safeRowCount = max(uRowCount, 1.0);
  float rowOrdinal = floor(v / safePitch + safeRowCount * 0.5);
  float rowIndex = mod(rowOrdinal, safeRowCount);
  float rowCenter = (rowOrdinal - (safeRowCount - 1.0) * 0.5) * safePitch;
  float dv = v - rowCenter;
  vec2 angularRate = vec2(rowRate(rowIndex) + uPanRate.x, uPanRate.y);
  vec2 motionVelocity = screenMotion(gradients, angularRate * min(uFrameDt, 0.05));
  motionVelocity = boundedMotion(motionVelocity * uVelocity * 1.6);
  float motionAlignment = dot(direction, motionVelocity);
  float motionSign = (staticEdge > 0.0005 &&
    motionAlignment < -0.2 * length(motionVelocity)) ? -1.0 : 1.0;
  vec2 motionSmear = motionVelocity * motionSign;
  float chromaFlip = motionSign < 0.0 ? 1.0 - smoothstep(0.0, MOTION_CHROMA_BAND, staticEdge) : 0.0;
  float panelToScreenPerp = 1.0 / max(length(gradients.zw) * uRy, 1e-4);

  float inset = clamp(uWarpOffset, 0.0, 0.85);
  float outer = 1.0 - inset;
  float inner = max(outer - 1.0, 0.0);
  float warpT = clamp((distance - inner) / max(outer - inner, 1e-4), 0.0, 1.0);
  float rimHold = smoothstep(0.78, 1.0, warpT);
  float warpEdge = pow(warpT, uCurve) * (1.0 - rimHold);
  float warpWindow = smoothstep(0.0, 0.2, warpT) * (1.0 - rimHold);

  if (staticEdge > 0.0005 && (uWarp > 0.5 || uWarpWave > 0.5)) {
    if (uWarp > 0.5) {
      if (uWarpStyle < 0.5) {
        float warp = min(uWarp * pow(warpEdge, 1.2), uCardHeight * 0.24);
        point -= direction * warp;
        point += perpendicular * dv * warp / max(uCardHeight, 1.0) * panelToScreenPerp;
      } else {
        float faceCenter = mix(inner, outer, 0.92);
        float faceHalf = max(uWarpFace, 4.0) / activeZonePixels;
        float s = (distance - faceCenter) / max(faceHalf, 1e-4);
        float plate = smoothstep(-1.0, 1.0, s);
        float kink = exp(-s * s * max(uWarpSharpness, 0.35));
        float shift = min(uWarp * (plate * 0.88 + kink * 0.55), uCardHeight * 0.28);
        shift *= 1.0 - rimHold;
        point -= direction * shift;
        point += perpendicular * dv * kink * uWarp / max(uCardHeight, 1.0) * panelToScreenPerp;
      }
    }
    if (uWarpWave > 0.5 && warpWindow > 0.001) {
      float waveLen = max(uWarpWaveLength, 8.0);
      float blurNorm = clamp(uWarpWaveBlur / 28.0, 0.0, 1.0);
      float phase = dv * 6.283185 / waveLen;
      if (uWarpWaveKind < 0.5) {
        float ripple = mix(sin(phase) + 0.28 * sin(phase * 2.0 + 0.4), sin(phase), blurNorm);
        float wave = uWarpWave * ripple * warpWindow;
        point -= direction * wave;
        point += perpendicular * cos(phase) * wave * 0.18;
      } else {
        float thickness = uWarpWave * warpWindow;
        float eps = mix(2.0, 10.0, blurNorm);
        vec2 authoredPoint = vec2(field.x * uRx, v);
        float hRich = waveHeight(authoredPoint, rowCenter, waveLen);
        float hSoft = sin(dv * 6.283185 / waveLen);
        float h = mix(hRich, hSoft, blurNorm);
        float hx = mix(
          waveHeight(authoredPoint + vec2(eps, 0.0), rowCenter, waveLen),
          hSoft,
          blurNorm
        );
        float hy = mix(
          waveHeight(authoredPoint + vec2(0.0, eps), rowCenter, waveLen),
          sin((dv + eps) * 6.283185 / waveLen),
          blurNorm
        );
        vec2 authoredGradient = vec2(hx - h, hy - h) / max(eps, 1e-4);
        vec2 screenGradient = screenMotion(
          gradients,
          vec2(authoredGradient.x / max(uRx, 1.0), -authoredGradient.y / max(uRy, 1.0))
        );
        float iorBend = 1.0 - 1.0 / 1.28;
        point -= screenGradient * thickness * (14.0 * iorBend + 6.5);
        point -= screenGradient * h * thickness * 0.22;
        point += screenMotion(
          gradients,
          vec2(0.0, -(h * thickness * 0.12) / max(uRy, 1.0))
        );
      }
    }
  }

  float authoredCoverage = sampleScene(point).a;
  float dispersionExtent = uAmount * staticEdge;
  float blurExtent = uBlur * staticEdge + uWarpWaveBlur * warpWindow;
  float span = dispersionExtent + blurExtent;
  float verticalExtent = blurExtent * 0.5;
  float haloSwing = 1.0;
  float haloWave = 0.0;
  if (uTurbulence > 0.002 && staticEdge > 0.0005) {
    float rowCoord = v * uTurbulenceFreq;
    float drift = clamp(
      dot(motionVelocity, direction) * uTurbulenceFreq * 0.3,
      -0.05,
      0.05
    );
    float sideSeed = field.x > 0.0 ? 13.7 : 3.1;
    float envelope = fbm(vec2(rowCoord, sideSeed + drift));
    float ragged = fbm(vec2(rowCoord * 0.55 + 31.0, sideSeed * 1.7 - drift * 0.6));
    float modulation = mix(1.0, 0.55 + 1.05 * envelope, uTurbulence);
    span *= modulation;
    haloSwing = mix(1.0, 0.25 + 1.95 * ragged, uTurbulence);
    haloWave = (envelope - 0.5) * uTurbulence;
  }

  float gateCenter = 1.0 - clamp(uGateOffset, 0.0, 0.5);
  float gateHalf = max(uGateWidth, 1.0) / activeZonePixels;
  float gateS = (distance - gateCenter) / max(gateHalf, 1e-4);
  float band = exp(-gateS * gateS * 1.1) * step(0.0005, staticEdge);
  float gateRefractionRadius = exp(-gateS * gateS) * min(uGateRefraction, uGateWidth * 0.6);
  if (uGateRefraction > 0.01 && staticEdge > 0.0005) {
    point += direction * gateRefractionRadius;
  }

  vec2 crtTrackingOffset = vec2(0.0);
  if (uCrt > EFFECT_EPSILON) {
    float lineIndex = floor(gl_FragCoord.y / crtLinePitch());
    float trackingFrame = wrappedEffectFrame();
    float rowJitter = (
      effectHash(vec2(lineIndex, 0.0), trackingFrame, CRT_JITTER_HASH_SALT) - 0.5
    ) * JITTER_PX * uCrt;
    crtTrackingOffset = vec2(rowJitter, 0.0);
  }

  float motionKernel = 2.0 * length(motionVelocity);
  int activeSamples = span < 0.5
    ? int(clamp(ceil(motionKernel * MOTION_SAMPLE_DENSITY), MOTION_SAMPLE_FLOOR, float(uSamples)))
    : uSamples;
  vec4 color = vec4(0.0);
  if (span < 0.5 && length(motionVelocity) < 1.5) {
    color = applyMotionSurfaceEffects(sampleCrtScene(point + crtTrackingOffset));
  } else {
    vec3 accumulated = vec3(0.0);
    vec3 weightSum = vec3(0.0);
    float alpha = 0.0;
    float alphaWeight = 0.0;
    for (int i = 0; i < MAX_SAMPLES; i++) {
      if (i >= activeSamples) break;
      float index = float(i);
      float jitterX = ditherPhase(gl_FragCoord.xy + index * vec2(0.754, 0.569));
      float jitterY = fract(jitterX * 61.803398 + index * 0.381966);
      float t = (index + jitterX) / float(activeSamples);
      float spread = t - 0.5;
      vec3 weight = chromaFlip > 0.0
        ? mix(spectralWeight(t), spectralWeight(1.0 - t), chromaFlip)
        : spectralWeight(t);
      vec2 offset = direction * span * spread + motionSmear * spread * 2.0 +
        perpendicular * ((jitterY * 2.0 - 1.0) * verticalExtent);
      vec4 texel = sampleCrtScene(point + offset + crtTrackingOffset);
      accumulated += texel.rgb * weight;
      weightSum += weight;
      float luminanceWeight = (weight.r + weight.g + weight.b) / 3.0;
      alpha += texel.a * luminanceWeight;
      alphaWeight += luminanceWeight;
    }
    color = applyMotionSurfaceEffects(
      vec4(accumulated / max(weightSum, vec3(1e-5)), alpha / max(alphaWeight, 1e-5))
    );

    float auraGain = uAura * staticEdge * min(haloSwing, 1.6);
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
        vec3 weight = chromaFlip > 0.0
          ? mix(spectralWeight(t), spectralWeight(1.0 - t), chromaFlip)
          : spectralWeight(t);
        vec2 auraOffset = direction * (span * 2.6 + 24.0) * haloSwing * spread +
          motionSmear * spread * 3.0 + perpendicular *
          ((jitterY * 2.0 - 1.0) * (verticalExtent * 2.5 + 12.0) + haloWave * 34.0);
        vec4 texel = sampleScene(point + auraOffset);
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
    vec4 lightSample = sampleScene(point) * 0.34 +
      sampleScene(point + direction * 7.0) * 0.22 +
      sampleScene(point - direction * 7.0) * 0.22 +
      sampleScene(point + perpendicular * 9.0) * 0.11 +
      sampleScene(point - perpendicular * 9.0) * 0.11;
    vec3 ramp = spectralWeight(clamp(0.5 + gateS * 0.5, 0.0, 1.0));
    ramp /= max(ramp.r + ramp.g + ramp.b, 1e-4);
    vec3 tint = mix(vec3(1.0 / 3.0), ramp, clamp(abs(gateS), 0.0, 1.0));
    float motionKick = 1.0 + min(length(motionVelocity) / 48.0, 1.0) * 0.7;
    float flare = gateGain * motionKick;
    float lightCoverage = clamp(lightSample.a, 0.0, 1.0);
    vec3 add = lightSample.rgb * flare * 1.15 + tint * flare * lightCoverage * 0.55;
    float addAlpha = flare * lightCoverage * 0.78;
    color.rgb += add * (1.0 - color.rgb);
    color.a += addAlpha * (1.0 - color.a);
  }

  float outsideAuthoredContent = 1.0 - smoothstep(0.001, 0.08, authoredCoverage);
  float neutral = min(color.r, min(color.g, color.b));
  vec3 spectralFringe = max(color.rgb - vec3(neutral), vec3(0.0));
  float spectralAlpha = max(spectralFringe.r, max(spectralFringe.g, spectralFringe.b));
  color = mix(color, vec4(spectralFringe, spectralAlpha), outsideAuthoredContent);
  gl_FragColor = color * (1.0 - uFade * pow(staticEdge, 2.0));
}
#endif
`;

export const HERO_COMPACT_POST_FRAGMENT_SHADER = HERO_DISPERSION_POST_FRAGMENT_SHADER.replace(
  'precision highp float;',
  'precision highp float;\n#define HERO_COMPACT_POST 1',
);

function clampCode(value: number) {
  return Math.max(0, Math.min(65_535, Math.round(value)));
}

function encodeCode(value: number): readonly [number, number] {
  const code = clampCode(value);
  return [Math.floor(code / 256), code % 256];
}

export function encodeHeroFieldAngles(
  theta: number,
  phi: number,
): readonly [number, number, number, number] {
  const thetaNormalized = Math.max(0, Math.min(1 - 1 / 65_535, (theta + PI) / TWO_PI));
  const phiNormalized = Math.max(0, Math.min(1, (phi + PI / 2) / PI));
  const thetaBytes = encodeCode(Math.round(thetaNormalized * 65_534) + 1);
  const phiBytes = encodeCode(Math.round(phiNormalized * 65_535));
  return [thetaBytes[0], thetaBytes[1], phiBytes[0], phiBytes[1]];
}

export function decodeHeroFieldAngles(bytes: readonly [number, number, number, number]): {
  phi: number;
  theta: number;
  valid: boolean;
} {
  const thetaCode = clampCode(bytes[0]) * 256 + clampCode(bytes[1]);
  if (thetaCode === 0) return { phi: 0, theta: 0, valid: false };
  const phiCode = clampCode(bytes[2]) * 256 + clampCode(bytes[3]);
  return {
    phi: (phiCode / 65_535) * PI - PI / 2,
    theta: ((thetaCode - 1) / 65_534) * TWO_PI - PI,
    valid: true,
  };
}
