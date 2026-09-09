export const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uStrip;
uniform sampler2D uText;
uniform vec2 uTextRowRange;
uniform vec2 uViewSize;
uniform vec2 uStripSize;
uniform float uPadY;
uniform float uScroll;
uniform float uEdgeStart;
uniform float uCurve;
uniform float uAmount;
uniform float uBlur;
uniform float uSpectrum;
uniform float uHue;
uniform float uIncludeText;
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

varying vec2 vUv;

const int MAX_SAMPLES = 48;
const int AURA_SAMPLES = 12;
const float GOLDEN_ANGLE = 2.399963;

vec4 sampleStrip(vec2 point) {
  float wrappedX = mod(mod(point.x + uScroll, uStripSize.x) + uStripSize.x, uStripSize.x);
  vec2 strip = vec2(wrappedX, point.y - uPadY);
  vec2 uv = strip / uStripSize;
  if (uv.y < 0.0 || uv.y > 1.0) {
    return vec4(0.0);
  }
  vec4 imageTexel = texture2D(uStrip, uv);
  vec3 premultiplied = imageTexel.rgb * imageTexel.a;
  float alpha = imageTexel.a;
  if (uIncludeText > 0.5 && uv.y >= uTextRowRange.x && uv.y <= uTextRowRange.y) {
    vec4 textTexel = texture2D(uText, uv);
    premultiplied =
      textTexel.rgb * textTexel.a + premultiplied * (1.0 - textTexel.a);
    alpha = textTexel.a + alpha * (1.0 - textTexel.a);
  }
  return vec4(premultiplied, alpha);
}

vec3 spectralWeight(float t) {
  float h = uHue + t * 4.188790;
  vec3 rainbow = 0.5 + 0.5 * cos(h + vec3(0.0, -2.094395, -4.188790));
  rainbow = pow(rainbow, vec3(1.25)) * 1.8;
  return max(mix(vec3(1.0), rainbow, uSpectrum), 0.0);
}

float ditherPhase(vec2 seed) {
  return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}

float valueHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(valueHash(cell), valueHash(cell + vec2(1.0, 0.0)), u.x),
    mix(
      valueHash(cell + vec2(0.0, 1.0)),
      valueHash(cell + vec2(1.0, 1.0)),
      u.x
    ),
    u.y
  );
}

float fbm(vec2 p) {
  return valueNoise(p) * 0.65 + valueNoise(p * 2.13 + 7.7) * 0.35;
}

// Optical-path height of a wavy refractive slab. Several incommensurate
// sines plus a low fbm keep the surface from reading as a straight flag.
float waveHeight(vec2 p, float midY, float waveLen) {
  float q = (p.y - midY) / max(waveLen, 8.0);
  float px = p.x / max(uViewSize.x, 1.0);
  float p1 = q * 6.283185 + px * 2.6;
  float p2 = q * 13.63 + px * -3.4 + 1.27;
  float p3 = q * 22.05 + px * 1.8 + 2.41;
  float organic = fbm(vec2(px * 3.4, q * 1.85)) * 2.0 - 1.0;
  return 0.50 * sin(p1) + 0.26 * sin(p2) + 0.12 * sin(p3) + 0.22 * organic;
}

void main() {
  vec2 point = vUv * uViewSize;
  float centered = vUv.x * 2.0 - 1.0;
  float distance = abs(centered);
  float direction = centered >= 0.0 ? 1.0 : -1.0;
  float edge = clamp(
    (distance - uEdgeStart) / max(1.0 - uEdgeStart, 1e-4),
    0.0,
    1.0
  );
  edge = pow(edge, uCurve);

  // Relocatable warp band. Offset 0 pins the outer bound to the true
  // viewport rim. Displacement returns to zero AT that rim so cards
  // still press against the edge instead of leaving a vacated margin.
  float zoneWidth = max(1.0 - uEdgeStart, 0.04);
  float inset = clamp(uWarpOffset, 0.0, 0.85);
  float outer = 1.0 - inset;
  float inner = max(outer - zoneWidth, 0.0);
  float warpT = clamp((distance - inner) / max(outer - inner, 1e-4), 0.0, 1.0);
  float rimHold = smoothstep(0.78, 1.0, warpT);
  float warpEdge = pow(warpT, uCurve) * (1.0 - rimHold);
  float warpWindow = smoothstep(0.0, 0.2, warpT) * (1.0 - rimHold);

  if (uWarp > 0.5 || uWarpWave > 0.5) {
    float midY = uPadY + uStripSize.y * 0.5;
    if (uWarp > 0.5) {
      if (uWarpStyle < 0.5) {
        if (warpEdge > 0.0005) {
          float warp = min(uWarp * pow(warpEdge, 1.2), uViewSize.x * 0.12);
          point.x -= direction * warp;
          point.y += (point.y - midY) * warp / max(uStripSize.y, 1.0);
        }
      } else {
        float faceCenter = mix(inner, outer, 0.92);
        float faceHalf = max(uWarpFace, 4.0) / max(uViewSize.x * 0.5, 1.0);
        float s = (distance - faceCenter) / max(faceHalf, 1e-4);
        float plate = smoothstep(-1.0, 1.0, s);
        float kink = exp(-s * s * max(uWarpSharpness, 0.35));
        float shift = min(uWarp * (plate * 0.88 + kink * 0.55), uViewSize.x * 0.14);
        shift *= (1.0 - rimHold);
        point.x -= direction * shift;
        point.y += (point.y - midY) * kink * (uWarp / max(uStripSize.y, 1.0));
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
        point.x -= direction * wave;
        point.y += cos(phase) * wave * 0.18;
      } else {
        float thickness = uWarpWave * warpWindow;
        float eps = mix(2.0, 10.0, blurNorm);
        float hRich = waveHeight(point, midY, waveLen);
        float hSoft = sin((point.y - midY) * 6.283185 / waveLen);
        float h = mix(hRich, hSoft, blurNorm);
        float hx = mix(
          waveHeight(point + vec2(eps, 0.0), midY, waveLen),
          sin((point.y - midY) * 6.283185 / waveLen),
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

  // Coverage of the authored rail after geometric warp, before spectral
  // displacement. Outside the card silhouettes the renderer may keep
  // spectral fringes, but must not turn a dark sampled pixel into a
  // neutral grey veil on the white canvas.
  float authoredCoverage = sampleStrip(point).a;

  float dispersionExtent = uAmount * edge;
  float blurExtent = uBlur * edge + uWarpWaveBlur * warpWindow;
  float velocity = uVelocity;
  float span = dispersionExtent + blurExtent;
  float verticalExtent = blurExtent * 0.5;

  // Irregular halo envelope: a static screen-space noise field modulates how
  // far the smear and the halo reach at every row, so the edge dissolves into
  // a ragged organic contour instead of a straight wash. The field morphs
  // slowly with scroll, staying deterministic for any given position.
  float haloSwing = 1.0;
  float haloWave = 0.0;
  if (uTurbulence > 0.002 && edge > 0.0005) {
    float rowCoord = point.y * uTurbulenceFreq;
    float drift = uScroll * uTurbulenceFreq * 0.3;
    float sideSeed = direction > 0.0 ? 13.7 : 3.1;
    float envelope = fbm(vec2(rowCoord, sideSeed + drift));
    float ragged = fbm(vec2(rowCoord * 0.55 + 31.0, sideSeed * 1.7 - drift * 0.6));
    span *= mix(1.0, 0.55 + 1.05 * envelope, uTurbulence);
    haloSwing = mix(1.0, 0.25 + 1.95 * ragged, uTurbulence);
    haloWave = (envelope - 0.5) * uTurbulence;
  }
  float extent = span + abs(velocity);

  // Every sample is transparent beyond this conservative vertical reach.
  // Account for defocus, aura jitter/drift, and the gate's +/-9px taps.
  float verticalReach = max(
    9.0,
    verticalExtent * 2.5 + 12.0 + abs(haloWave * 34.0)
  );
  if (point.y < uPadY - verticalReach ||
      point.y > uPadY + uStripSize.y + verticalReach) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Stationary boundary light band ("aura gate"): two vertical curtains whose
  // centers are positioned independently from the nearest viewport edge.
  float gateCenter = 1.0 - clamp(uGateOffset, 0.0, 0.5) * 2.0;
  float gateHalf = max(uGateWidth, 1.0) / (uViewSize.x * 0.5);
  float gateS = (distance - gateCenter) / max(gateHalf, 1e-4);
  float band = exp(-gateS * gateS * 1.1);
  if (uGateRefraction > 0.01) {
    // Glass-ridge displacement: a smooth monotonic push at the curtain, so
    // crossing content visibly refracts without double exposure.
    float ridge = min(uGateRefraction, uGateWidth * 0.6);
    point.x += direction * exp(-gateS * gateS) * ridge;
  }
  vec4 color = vec4(0.0);
  if (extent < 0.5) {
    color = sampleStrip(point);
  } else {
    vec3 accumulated = vec3(0.0);
    vec3 weightSum = vec3(0.0);
    float alpha = 0.0;
    float alphaWeight = 0.0;
    for (int i = 0; i < MAX_SAMPLES; i++) {
      if (i >= uSamples) {
        break;
      }
      float index = float(i);
      float jitterX = ditherPhase(gl_FragCoord.xy + index * vec2(0.754, 0.569));
      float jitterY = fract(jitterX * 61.803398 + index * 0.381966);
      float t = (index + jitterX) / float(uSamples);
      float spread = t - 0.5;
      vec3 weight = spectralWeight(t);
      vec2 offset = vec2(
        direction * span * spread + velocity * spread * 2.0,
        (jitterY * 2.0 - 1.0) * verticalExtent
      );
      vec4 texel = sampleStrip(point + offset);
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
          direction * (span * 2.6 + 24.0) * haloSwing * spread +
            velocity * spread * 3.0,
          (jitterY * 2.0 - 1.0) * (verticalExtent * 2.5 + 12.0) +
            haloWave * 34.0
        );
        vec4 texel = sampleStrip(point + offset);
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
    // Light source: a small local blur of the (refracted) content feeding the
    // curtain, so crossing cards flare while empty background stays faint.
    vec4 lightSample =
      sampleStrip(point) * 0.34 +
      sampleStrip(point + vec2(7.0, 0.0)) * 0.22 +
      sampleStrip(point - vec2(7.0, 0.0)) * 0.22 +
      sampleStrip(point + vec2(0.0, 9.0)) * 0.11 +
      sampleStrip(point - vec2(0.0, 9.0)) * 0.11;
    // Neutral light at the band core, prism colors along its rims.
    vec3 ramp = spectralWeight(clamp(0.5 + gateS * 0.5, 0.0, 1.0));
    ramp /= max(ramp.r + ramp.g + ramp.b, 1e-4);
    vec3 tint = mix(vec3(1.0 / 3.0), ramp, clamp(abs(gateS), 0.0, 1.0));
    float motionKick = 1.0 + min(abs(uVelocity) / 48.0, 1.0) * 0.7;
    float flare = gateGain * motionKick;
    float lightCoverage = clamp(lightSample.a, 0.0, 1.0);
    vec3 add =
      lightSample.rgb * flare * 1.15 +
      tint * flare * lightCoverage * 0.55;
    float addAlpha = flare * lightCoverage * 0.78;
    color.rgb = color.rgb + add * (1.0 - color.rgb);
    color.a = color.a + addAlpha * (1.0 - color.a);
  }

  // A premultiplied neutral halo composites as a grey band on white. Remove
  // only that neutral component outside the original card silhouette; the
  // channel differences remain as the intended red/green/blue dispersion.
  float outsideAuthoredContent =
    1.0 - smoothstep(0.001, 0.08, authoredCoverage);
  float neutral = min(color.r, min(color.g, color.b));
  vec3 spectralFringe = max(color.rgb - vec3(neutral), vec3(0.0));
  float spectralAlpha = max(
    spectralFringe.r,
    max(spectralFringe.g, spectralFringe.b)
  );
  color = mix(
    color,
    vec4(spectralFringe, spectralAlpha),
    outsideAuthoredContent
  );

  float fadeAmount = uFade * pow(edge, 2.0);
  gl_FragColor = color * (1.0 - fadeAmount);
}
`;
