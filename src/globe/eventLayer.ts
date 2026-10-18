import * as THREE from 'three';
import { latLonToVec3 } from '../lib/geo';
import type { EventAttrs } from '../events/attributes';

const VERT = `
attribute vec3 aColor; attribute float aSize; attribute float aAge; attribute float aHollow; attribute float aPhase;
uniform float uElapsed; uniform float uPx; uniform float uFade; uniform float uBack;
varying vec3 vColor; varying float vHollow; varying float vAlpha; varying float vBase; varying float vRip;
void main() {
  float age = aAge + uElapsed - uBack;                                // age at the time-travel playhead
  float vis = step(0.0, age);                                         // events after the playhead do not exist yet
  float young = 1.0 - smoothstep(5.0 * 3600.0, 6.0 * 3600.0, age);   // ripple only while under 6 h old
  float ph = fract(uElapsed / 2.4 + aPhase);                          // 2.4 s period
  float grow = 1.0 + young * 2.2 * ph;
  vBase = 1.0 / grow;                                                 // base disc radius as a fraction of the sprite
  vRip = young * (1.0 - ph);
  float fade = mix(1.0, 0.35, clamp(age / (30.0 * 86400.0), 0.0, 1.0));
  vAlpha = fade * mix(1.0, 0.6, aHollow) * uFade * vis;
  vColor = aColor; vHollow = aHollow;
  gl_PointSize = aSize * uPx * grow;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG = `
varying vec3 vColor; varying float vHollow; varying float vAlpha; varying float vBase; varying float vRip;
void main() {
  float r = length(gl_PointCoord * 2.0 - 1.0);
  float disc = 1.0 - smoothstep(vBase - 0.14, vBase, r);
  float hole = smoothstep(vBase * 0.5 - 0.12, vBase * 0.5, r);
  float base = vHollow > 0.5 ? disc * hole : disc;
  float rip = vRip * smoothstep(0.80, 0.90, r) * (1.0 - smoothstep(0.95, 1.0, r));
  float a = max(base, rip * 0.9) * vAlpha;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}`;
const MARKER_FRAG = `
uniform vec3 uColor;
void main() {
  float r = length(gl_PointCoord * 2.0 - 1.0);
  float ring = smoothstep(0.62, 0.72, r) * (1.0 - smoothstep(0.86, 0.96, r));
  if (ring < 0.01) discard;
  gl_FragColor = vec4(uColor, ring);
}`;
const MARKER_VERT = `
uniform float uPx;
void main() {
  gl_PointSize = 26.0 * uPx;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const attr = (a: Float32Array, n: number) => new THREE.BufferAttribute(a, n);
const cat = (parts: Float32Array[]) => {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) (out.set(p, o), (o += p.length));
  return out;
};

// One THREE.Points for all events (one draw call) plus a lime ring for the selected one.
export function createEventLayer() {
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: { uElapsed: { value: 0 }, uPx: { value: 1 }, uFade: { value: 0 }, uBack: { value: 0 } },
  });
  const points = new THREE.Points(new THREE.BufferGeometry(), material);
  points.frustumCulled = false;
  points.visible = false;

  const markerMat = new THREE.ShaderMaterial({
    vertexShader: MARKER_VERT,
    fragmentShader: MARKER_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: { uPx: { value: 1 }, uColor: { value: new THREE.Color(0xd6ff57) } },
  });
  const markerGeo = new THREE.BufferGeometry();
  markerGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
  const marker = new THREE.Points(markerGeo, markerMat);
  marker.frustumCulled = false;
  marker.visible = false;

  let builtAt = performance.now();
  return {
    points,
    marker,
    setData(list: EventAttrs[]) {
      points.geometry.dispose();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', attr(cat(list.map((a) => a.position)), 3));
      g.setAttribute('aColor', attr(cat(list.map((a) => a.color)), 3));
      g.setAttribute('aSize', attr(cat(list.map((a) => a.size)), 1));
      g.setAttribute('aAge', attr(cat(list.map((a) => a.age)), 1));
      g.setAttribute('aHollow', attr(cat(list.map((a) => a.hollow)), 1));
      g.setAttribute('aPhase', attr(cat(list.map((a) => a.phase)), 1));
      points.geometry = g;
      points.visible = list.some((a) => a.count > 0);
      builtAt = performance.now();
    },
    setBack(backS: number) {
      material.uniforms.uBack!.value = Number.isFinite(backS) ? Math.max(0, backS) : 0;
    },
    setMarker(lat: number | null, lon?: number) {
      if (lat === null || lon === undefined || !Number.isFinite(lat) || !Number.isFinite(lon)) {
        marker.visible = false;
        return;
      }
      const [x, y, z] = latLonToVec3(lat, lon, 1.006);
      markerGeo.getAttribute('position').array.set([x, y, z]);
      markerGeo.getAttribute('position').needsUpdate = true;
      marker.visible = true;
    },
    update(fade: number, pixelRatio: number) {
      material.uniforms.uElapsed!.value = (performance.now() - builtAt) / 1000;
      material.uniforms.uFade!.value = fade;
      material.uniforms.uPx!.value = pixelRatio;
      markerMat.uniforms.uPx!.value = pixelRatio;
    },
    dispose() {
      points.geometry.dispose();
      markerGeo.dispose();
      material.dispose();
      markerMat.dispose();
    },
  };
}
