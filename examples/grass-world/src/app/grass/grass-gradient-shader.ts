export const grassGradientFragmentModel = /* glsl */ `
  uniform float uGradientAngle;
  uniform float uGradientMode;
  uniform float uMiddleOpacity;
  uniform float uMiddlePosition;
  uniform float uRootOpacity;
  uniform float uRootPosition;
  uniform float uTipOpacity;
  uniform float uTipPosition;

  varying float vGrassHeight;
  varying float vGrassAcross;
  varying float vGrassColorValue;
  varying float vGrassColorWarmth;
  varying float vGrassVisibility;

  vec2 grassGradientSample() {
    float angle = uGradientAngle - 1.57079632679;
    float coordinate = clamp(
      vGrassHeight * cos(angle) +
        (vGrassAcross * 0.5 + 0.5) * sin(angle),
      0.0,
      1.0
    );
    if (uGradientMode > 0.5 && uGradientMode < 1.5) {
      coordinate = clamp(
        length(vec2(vGrassAcross * 0.52, vGrassHeight - 0.5)) * 1.55,
        0.0,
        1.0
      );
    } else if (uGradientMode > 1.5 && uGradientMode < 2.5) {
      coordinate = fract(
        atan(vGrassHeight - 0.5, vGrassAcross * 0.5) / 6.28318530718 +
          uGradientAngle / 6.28318530718
      );
    } else if (uGradientMode >= 2.5) {
      coordinate = clamp(
        abs(vGrassAcross * 0.5) + abs(vGrassHeight - 0.5),
        0.0,
        1.0
      );
    }
    float middlePosition = clamp(
      uMiddlePosition,
      uRootPosition + 0.001,
      0.999
    );
    float tipPosition = clamp(
      uTipPosition,
      middlePosition + 0.001,
      1.0
    );
    float firstMix = smoothstep(
      uRootPosition,
      middlePosition,
      coordinate
    );
    float secondMix = smoothstep(
      middlePosition,
      tipPosition,
      coordinate
    );
    float opacity = coordinate < middlePosition
      ? mix(uRootOpacity, uMiddleOpacity, firstMix)
      : mix(uMiddleOpacity, uTipOpacity, secondMix);
    return vec2(coordinate, opacity);
  }
`;
