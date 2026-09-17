export const icebergEngravingGLSL = /* glsl */`
uniform bool uEngravingEnabled;
uniform float uEngravingStrength, uEngravingScale, uEngravingThickness;
varying float vPrintY;

float engravedStripeIntegral(float phase, float coverage) {
  return floor(phase)*coverage+min(fract(phase),coverage);
}
float engraveRock(float shade) {
  if(!uEngravingEnabled) return shade;
  // A printing-screen coordinate, rather than surface height: every stroke
  // stays horizontal while lighting and relief keep describing the 3D rock.
  float coverage=clamp((1.0-clamp(shade,0.0,1.0))*uEngravingThickness/50.0,0.015,0.965);
  float phase=vPrintY*280.0/max(0.5,uEngravingScale)+coverage*0.5;
  float footprint=max(fwidth(vPrintY)*280.0/max(0.5,uEngravingScale),0.0001);
  // Integrate the periodic ink stroke over a pixel. Fine lines retain their
  // average tone when zoomed out, using the same pattern for preview/export.
  float ink=(engravedStripeIntegral(phase+footprint*0.5,coverage)
            -engravedStripeIntegral(phase-footprint*0.5,coverage))/footprint;
  float engraving=mix(0.98,0.045,clamp(ink,0.0,1.0));
  return mix(shade,engraving,uEngravingStrength);
}
`;
