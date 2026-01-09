// Attractor-based particle vertex shader
uniform float uTime;
uniform vec3 uAttractor1;
uniform vec3 uAttractor2;
uniform vec3 uAttractor3;
uniform float uAttractorStrength;
uniform vec2 uResolution;

attribute float aSize;
attribute vec3 aVelocity;
attribute float aPhase;

varying vec3 vColor;
varying float vAlpha;

// Simplex noise for organic movement
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vec3 pos = position;

  // Calculate distances to attractors
  float dist1 = distance(pos, uAttractor1);
  float dist2 = distance(pos, uAttractor2);
  float dist3 = distance(pos, uAttractor3);

  // Attraction forces (inverse square law with epsilon to prevent division by zero)
  float epsilon = 0.5;
  vec3 force1 = normalize(uAttractor1 - pos) / max(dist1 * dist1, epsilon);
  vec3 force2 = normalize(uAttractor2 - pos) / max(dist2 * dist2, epsilon);
  vec3 force3 = normalize(uAttractor3 - pos) / max(dist3 * dist3, epsilon);

  // Apply combined force
  vec3 totalForce = (force1 + force2 + force3) * uAttractorStrength * 0.02;
  pos += totalForce;

  // Add organic noise movement
  float noiseX = snoise(vec3(pos.x * 0.2 + uTime * 0.1, pos.y * 0.2, aPhase));
  float noiseY = snoise(vec3(pos.y * 0.2 + uTime * 0.1, pos.z * 0.2, aPhase + 1.0));
  float noiseZ = snoise(vec3(pos.z * 0.2 + uTime * 0.1, pos.x * 0.2, aPhase + 2.0));

  pos += vec3(noiseX, noiseY, noiseZ) * 0.15;

  // Boundary wrapping (torus topology)
  float boundary = 15.0;
  if (abs(pos.x) > boundary) pos.x = -sign(pos.x) * boundary;
  if (abs(pos.y) > boundary) pos.y = -sign(pos.y) * boundary;
  if (abs(pos.z) > boundary) pos.z = -sign(pos.z) * boundary;

  // Color based on distance to nearest attractor
  float minDist = min(dist1, min(dist2, dist3));
  float colorMix = smoothstep(0.0, 5.0, minDist);

  if (dist1 == minDist) {
    vColor = mix(vec3(1.0, 0.5, 0.2), vec3(1.0, 0.7, 0.3), colorMix);  // Orange
  } else if (dist2 == minDist) {
    vColor = mix(vec3(0.2, 0.8, 1.0), vec3(0.4, 0.9, 1.0), colorMix);  // Cyan
  } else {
    vColor = mix(vec3(0.2, 1.0, 0.6), vec3(0.4, 1.0, 0.7), colorMix);  // Green
  }

  // Fade based on distance
  vAlpha = smoothstep(10.0, 2.0, minDist);

  // Project to screen
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
