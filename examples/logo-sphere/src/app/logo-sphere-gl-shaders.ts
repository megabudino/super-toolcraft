export const logoSphereVertexShader = `#version 300 es
layout(location=0) in vec2 a_position;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec4 a_card;
layout(location=3) in vec2 a_kind;
uniform vec2 u_resolution;
out vec2 v_uv;
flat out vec4 v_card;
flat out vec2 v_kind;
void main() {
  vec2 clip = a_position / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, a_card.z * 2.0 - 1.0, 1.0);
  v_uv = a_uv;
  v_card = a_card;
  v_kind = a_kind;
}`;

export const logoSphereFragmentShader = `#version 300 es
precision highp float;
uniform sampler2D u_atlas;
uniform sampler2D u_shadow;
uniform vec4 u_atlasLayout;
uniform vec2 u_atlasSize;
uniform float u_strokeWidth;
uniform vec4 u_strokeColor;
uniform int u_pass;
in vec2 v_uv;
flat in vec4 v_card;
flat in vec2 v_kind;
out vec4 outputColor;
void main() {
  if (v_kind.y < 0.5) {
    outputColor = texture(u_shadow, v_uv) * v_card.y;
    return;
  }
  float radius = v_card.w;
  vec2 q = abs(v_uv - 0.5) - (vec2(0.5) - radius);
  float distanceToEdge = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float pixelWidth = max(length(vec2(dFdx(distanceToEdge), dFdy(distanceToEdge))), 0.000001);
  float coverage = 1.0 - smoothstep(-pixelWidth, 0.0, distanceToEdge);
  if (coverage <= 0.0) discard;
  if (u_pass == 0 && coverage < 0.999) discard;
  if (u_pass == 1 && v_card.y >= 0.995 && coverage >= 0.999) discard;
  vec2 face = vec2(v_kind.x > 0.5 ? 1.0 - v_uv.x : v_uv.x, v_uv.y);
  vec2 tile = vec2(mod(v_card.x, u_atlasLayout.x), floor(v_card.x / u_atlasLayout.x));
  vec2 uv = (tile * u_atlasLayout.z + vec2(4.0) + clamp(face, 0.0, 1.0) * u_atlasLayout.w) / u_atlasSize;
  vec4 color = texture(u_atlas, uv);
  float stroke = u_strokeWidth > 0.0 ? 1.0 - smoothstep(-u_strokeWidth * pixelWidth - pixelWidth,
    -u_strokeWidth * pixelWidth, distanceToEdge) : 1.0;
  vec4 outline = vec4(u_strokeColor.rgb * u_strokeColor.a, u_strokeColor.a);
  color = mix(outline + color * (1.0 - outline.a), color, stroke);
  outputColor = color * (v_card.y * coverage);
}`;

// Apply the fade once to the composed scene. Per-card fading incorrectly lets
// hundreds of translucent overlaps fill the intended silhouette fade back in.
export const logoSphereCompositeVertexShader = `#version 300 es
out vec2 v_uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const logoSphereCompositeFragmentShader = `#version 300 es
precision highp float;
uniform sampler2D u_scene;
uniform vec2 u_resolution;
uniform vec2 u_maskCenter;
uniform vec2 u_maskRadii;
uniform vec4 u_background;
in vec2 v_uv;
out vec4 outputColor;
void main() {
  vec2 position = vec2(v_uv.x, 1.0 - v_uv.y) * u_resolution;
  float fade = clamp((u_maskRadii.y - distance(position, u_maskCenter)) /
    max(0.001, u_maskRadii.y - u_maskRadii.x), 0.0, 1.0);
  vec4 color = texture(u_scene, v_uv) * fade;
  outputColor = color + u_background * (1.0 - color.a);
}`;
