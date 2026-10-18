import * as THREE from 'three';

const VERT = `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG = `
uniform sampler2D uDensity; uniform float uSeed; uniform float uStrength;
varying vec3 vPos;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
void main() {
  vec3 n = normalize(vPos);
  vec2 uv = vec2(atan(n.x, n.z) / 6.2831853 + 0.5, asin(clamp(n.y, -1.0, 1.0)) / 3.1415927 + 0.5);
  float d = texture2D(uDensity, uv).r;
  if (d < 0.004) discard;
  float g = hash(gl_FragCoord.xy + uSeed);
  float speck = step(1.0 - 0.6 * d, g);                     // hotter places get denser grain
  vec3 col = mix(vec3(0.93, 0.93, 0.91), vec3(1.0, 0.30, 0.0), smoothstep(0.35, 1.0, d)); // bone -> orange as it heats up
  float a = speck * (0.10 + 0.14 * d) * uStrength;
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
}`;

// Film grain over the globe whose density and warmth follow event density: a thin shader sphere sampling a heat texture. Not a DOM overlay.
export function createGrainLayer(w = 180, h = 90) {
  const tex = new THREE.DataTexture(new Uint8Array(w * h), w, h, THREE.RedFormat, THREE.UnsignedByteType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false; // no mipmaps: the lon/lat lookup has a seam, and derivatives there would draw a line
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: { uDensity: { value: tex }, uSeed: { value: 0 }, uStrength: { value: 0 } },
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.0015, 64, 48), material);
  mesh.renderOrder = -1; // under the border lines, ripples and markers
  return {
    object: mesh,
    setDensity(d: Uint8Array) {
      (tex.image.data as Uint8Array).set(d.subarray(0, w * h));
      tex.needsUpdate = true;
    },
    // Reseeded about 12 times a second; with reduced motion the grain is a still image.
    update(elapsedS: number, strength: number, reduced: boolean) {
      material.uniforms.uSeed!.value = reduced ? 0 : Math.floor(elapsedS * 12) * 7.13;
      material.uniforms.uStrength!.value = strength;
    },
    dispose() {
      tex.dispose();
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
