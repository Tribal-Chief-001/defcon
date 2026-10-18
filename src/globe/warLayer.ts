import * as THREE from 'three';
import { latLonToVec3 } from '../lib/geo';
import { circlePoints, haloRadiusPx, type WarConflict, type WarPin, type WarState } from './warGeometry';

const BONE = new THREE.Color(0xede9e9);
const MUTED = new THREE.Color(0xa3a39e);
const LIME = new THREE.Color(0xd6ff57);
const ORANGE = new THREE.Color(0xff4d00);
const R_HALO = 1.004;
const R_ZONE = 1.0035;

const HALO_VERT = `
attribute float aSize; attribute vec3 aColor; attribute float aPhase; attribute float aSel;
uniform float uPx; uniform float uTime; uniform float uFade; uniform float uStatic; uniform float uSelMode;
varying vec3 vColor; varying float vPh1; varying float vPh2; varying float vA;
void main() {
  float t = uTime / 3.2;
  vPh1 = uStatic > 0.5 ? 0.55 : fract(t + aPhase);
  vPh2 = uStatic > 0.5 ? 0.95 : fract(t + aPhase + 0.5);
  vColor = aColor;
  vA = uFade * mix(1.0, mix(0.4, 1.0, aSel), uSelMode);
  gl_PointSize = aSize * 2.0 * uPx * (1.0 + 0.3 * aSel);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const HALO_FRAG = `
varying vec3 vColor; varying float vPh1; varying float vPh2; varying float vA;
void main() {
  float r = length(gl_PointCoord * 2.0 - 1.0);
  if (r > 1.0) discard;
  float ring1 = (1.0 - smoothstep(0.0, 0.07, abs(r - vPh1))) * (1.0 - vPh1);
  float ring2 = (1.0 - smoothstep(0.0, 0.07, abs(r - vPh2))) * (1.0 - vPh2);
  float core = 1.0 - smoothstep(0.10, 0.17, r);
  float edge = (1.0 - smoothstep(0.0, 0.035, abs(r - 0.93))) * 0.3;
  float a = max(max(ring1, ring2) * 0.9, max(core, edge)) * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}`;
const HOT_VERT = `
attribute float aSize; attribute float aPhase;
uniform float uPx; uniform float uTime; uniform float uFade; uniform float uStatic;
varying float vA;
void main() {
  float shimmer = uStatic > 0.5 ? 1.0 : 0.8 + 0.2 * sin(uTime * 1.7 + aPhase * 6.2831);
  vA = uFade * shimmer;
  gl_PointSize = aSize * uPx;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const HOT_FRAG = `
uniform vec3 uColor; varying float vA;
void main() {
  float r = length(gl_PointCoord * 2.0 - 1.0);
  if (r > 1.0) discard;
  float a = pow(max(0.0, 1.0 - r), 1.3) * vA * 1.15;
  gl_FragColor = vec4(uColor, a);
}`;
const PIN_VERT = `
attribute vec3 aColor; attribute float aHover;
uniform float uPx; uniform float uFade; uniform float uTime; uniform float uStatic;
varying vec3 vColor; varying float vHover; varying float vA; varying float vPh;
void main() {
  vColor = aColor; vHover = aHover; vA = uFade;
  vPh = uStatic > 0.5 ? 0.5 : fract(uTime / 1.4);
  gl_PointSize = (18.0 + 10.0 * aHover) * uPx;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const PIN_FRAG = `
varying vec3 vColor; varying float vHover; varying float vA; varying float vPh;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = abs(c.x) + abs(c.y);                                       // a diamond
  float edge = (1.0 - smoothstep(0.05, 0.17, abs(d - 0.66)));
  float fill = (1.0 - smoothstep(0.36, 0.44, d)) * (0.6 + 0.4 * vHover);
  float pulse = vHover * (1.0 - smoothstep(0.0, 0.08, abs(length(c) - vPh))) * (1.0 - vPh);
  float a = max(max(edge, fill), pulse) * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor, a);
}`;

const attr = (a: Float32Array | number[], n: number) => new THREE.BufferAttribute(a instanceof Float32Array ? a : new Float32Array(a), n);
const trendColor = (c: WarConflict) => (c.trend === 'rising' ? ORANGE : BONE);
const pinColor = (p: WarPin) => (p.status === 'disputed' ? ORANGE : p.status === 'reported' ? MUTED : BONE);

// The war layer of the globe: a double sonar ring at every conflict with deaths in the last 90 days (orange when rising, bone otherwise,
// size from log deaths), and for the selected conflict a hairline zone ring, its death hotspots (the shape of the front) and diamond pins
// for its timeline events. Everything fades in when the War room opens and out when it closes.
export function createWarLayer(reducedMotion: boolean) {
  const group = new THREE.Group();
  group.visible = false;
  const staticMode = reducedMotion ? 1 : 0;
  const shared = { uPx: { value: 1 }, uTime: { value: 0 }, uFade: { value: 0 }, uStatic: { value: staticMode } };

  const haloMat = new THREE.ShaderMaterial({ vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, depthWrite: false, uniforms: { ...shared, uSelMode: { value: 0 } } });
  const halos = new THREE.Points(new THREE.BufferGeometry(), haloMat);
  halos.frustumCulled = false;
  const hotMat = new THREE.ShaderMaterial({ vertexShader: HOT_VERT, fragmentShader: HOT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...shared, uColor: { value: LIME } } });
  const hot = new THREE.Points(new THREE.BufferGeometry(), hotMat);
  hot.frustumCulled = false;
  const pinMat = new THREE.ShaderMaterial({ vertexShader: PIN_VERT, fragmentShader: PIN_FRAG, transparent: true, depthWrite: false, uniforms: { ...shared } });
  const pins = new THREE.Points(new THREE.BufferGeometry(), pinMat);
  pins.frustumCulled = false;
  const zoneInner = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.9 }));
  const zoneOuter = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.25 }));
  for (const z of [zoneInner, zoneOuter]) (z.frustumCulled = false, (z.visible = false));
  group.add(halos, hot, pins, zoneInner, zoneOuter);

  let current: WarState = { active: false, conflicts: [], selected: null, pins: [], hoverPin: null };
  let lowTier = false;
  let activeT = 0;
  let lastNow = performance.now();
  const t0 = performance.now();

  const ring = (pts: [number, number][], r: number) => {
    const a = new Float32Array(pts.length * 3);
    pts.forEach(([la, lo], i) => a.set(latLonToVec3(la, lo, r), i * 3));
    return a;
  };
  const buildHalos = () => {
    halos.geometry.dispose();
    const g = new THREE.BufferGeometry();
    const n = current.conflicts.length;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const col = new Float32Array(n * 3);
    const phase = new Float32Array(n);
    const sel = new Float32Array(n);
    current.conflicts.forEach((c, i) => {
      pos.set(latLonToVec3(c.lat, c.lon, R_HALO), i * 3);
      size[i] = haloRadiusPx(c.deaths365);
      const k = c.id === current.selected ? LIME : trendColor(c);
      col.set([k.r, k.g, k.b], i * 3);
      phase[i] = (i * 0.37) % 1;
      sel[i] = c.id === current.selected ? 1 : 0;
    });
    g.setAttribute('position', attr(pos, 3));
    g.setAttribute('aSize', attr(size, 1));
    g.setAttribute('aColor', attr(col, 3));
    g.setAttribute('aPhase', attr(phase, 1));
    g.setAttribute('aSel', attr(sel, 1));
    halos.geometry = g;
    halos.visible = n > 0;
    haloMat.uniforms.uSelMode!.value = current.selected ? 1 : 0;
  };
  const buildSelection = () => {
    const c = current.conflicts.find((x) => x.id === current.selected);
    const show = !!c && !lowTier;
    for (const z of [zoneInner, zoneOuter]) z.visible = show;
    hot.visible = show;
    if (!c || lowTier) return;
    zoneInner.geometry.dispose();
    zoneOuter.geometry.dispose();
    const mk = (km: number) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', attr(ring(circlePoints(c.lat, c.lon, km, 96), R_ZONE), 3));
      return g;
    };
    zoneInner.geometry = mk(Math.max(40, c.spreadKm));
    zoneOuter.geometry = mk(Math.max(70, c.spreadKm * 1.7));
    hot.geometry.dispose();
    const cells = c.cells;
    const max = Math.max(1, ...cells.map((x) => x[2]));
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(cells.length * 3);
    const size = new Float32Array(cells.length);
    const phase = new Float32Array(cells.length);
    cells.forEach(([la, lo, d], i) => {
      pos.set(latLonToVec3(la, lo, R_ZONE + 0.0005), i * 3);
      size[i] = 6 + 26 * Math.sqrt(d / max);
      phase[i] = (i * 0.61) % 1;
    });
    g.setAttribute('position', attr(pos, 3));
    g.setAttribute('aSize', attr(size, 1));
    g.setAttribute('aPhase', attr(phase, 1));
    hot.geometry = g;
  };
  const buildPins = () => {
    pins.geometry.dispose();
    const g = new THREE.BufferGeometry();
    const n = current.pins.length;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const hover = new Float32Array(n);
    current.pins.forEach((p, i) => {
      pos.set(latLonToVec3(p.lat, p.lon, 1.006), i * 3);
      const k = i === current.hoverPin ? LIME : pinColor(p);
      col.set([k.r, k.g, k.b], i * 3);
      hover[i] = i === current.hoverPin ? 1 : 0;
    });
    g.setAttribute('position', attr(pos, 3));
    g.setAttribute('aColor', attr(col, 3));
    g.setAttribute('aHover', attr(hover, 1));
    pins.geometry = g;
    pins.visible = n > 0 && !lowTier;
  };

  return {
    object: group,
    set(next: WarState) {
      const prev = current;
      current = next;
      if (next.conflicts !== prev.conflicts || next.selected !== prev.selected) buildHalos();
      if (next.conflicts !== prev.conflicts || next.selected !== prev.selected) buildSelection();
      if (next.pins !== prev.pins || next.hoverPin !== prev.hoverPin) buildPins();
    },
    // the lowest quality tier draws halos only
    setLowTier(low: boolean) {
      if (low === lowTier) return;
      lowTier = low;
      buildSelection();
      buildPins();
    },
    update(nowMs: number, pixelRatio: number, fade: number) {
      const dt = Math.min(0.1, (nowMs - lastNow) / 1000);
      lastNow = nowMs;
      activeT += ((current.active ? 1 : 0) - activeT) * (reducedMotion ? 1 : Math.min(1, dt * 4));
      group.visible = activeT > 0.01;
      shared.uTime.value = (nowMs - t0) / 1000;
      shared.uPx.value = pixelRatio;
      shared.uFade.value = fade * activeT;
      (zoneInner.material as THREE.LineBasicMaterial).opacity = 0.9 * activeT;
      (zoneOuter.material as THREE.LineBasicMaterial).opacity = 0.25 * activeT;
    },
    dispose() {
      for (const o of [halos, hot, pins, zoneInner, zoneOuter]) (o.geometry.dispose(), (o.material as THREE.Material).dispose());
    },
  };
}
