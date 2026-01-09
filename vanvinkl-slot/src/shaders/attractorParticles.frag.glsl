// Attractor-based particle fragment shader
varying vec3 vColor;
varying float vAlpha;

void main() {
  // Circular particle shape
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Smooth circle with glow
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  alpha *= vAlpha;

  // Add inner glow
  float glow = exp(-dist * 8.0) * 0.5;

  gl_FragColor = vec4(vColor + glow, alpha);
}
