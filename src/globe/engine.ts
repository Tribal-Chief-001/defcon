import * as THREE from 'three';
import type { Topology } from 'topojson-specification';
import { latLonToVec3, vec3ToLatLon } from '../lib/geo';
import { buildBorderPositions, buildCountryPositions } from './borderGeometry';
import { createPicker } from './pick';

// Stub until Task 9 (Sonar Boot) replaces it with the real control.
export type BootControl = { skip(): void; readonly done: boolean };

export type GlobeHandle = {
  setHighDetail(topo: Topology): void;
  setHighlight(id: string | null): void;
  onPick(cb: (id: string | null, lat: number, lon: number) => void): () => void;
  boot: BootControl;
  dispose(): void;
};

export type GlobeOptions = {
  canvas: HTMLCanvasElement;
  low: Topology;
  high?: Topology;
  reducedMotion: boolean;
  onContextLost?: () => void;
};

const INK = 0xede9e9; // text bone, #EDEDE9 family
const LIME = 0xd6ff57;
const START = { lat: 22, lon: 78 }; // opens facing India
const MIN_DIST = 1.45;
const MAX_DIST = 6;
const IDLE_BEFORE_SPIN_MS = 2500;
const MAX_SPIN = 4; // rad/s after a flick

const rimMaterial = () =>
  new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0);
        gl_FragColor = vec4(vec3(0.93, 0.93, 0.91) * f * 0.35, 1.0);
      }`,
    polygonOffset: true, // keeps the black sphere just behind the border lines
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });

function graticule(stepDeg: number, radius: number): Float32Array {
  const out: number[] = [];
  const seg = (a: [number, number, number], b: [number, number, number]) => out.push(...a, ...b);
  for (let lon = -180; lon < 180; lon += stepDeg)
    for (let lat = -90; lat < 90; lat += 3) seg(latLonToVec3(lat, lon, radius), latLonToVec3(lat + 3, lon, radius));
  for (let lat = -90 + stepDeg; lat < 90; lat += stepDeg)
    for (let lon = -180; lon < 180; lon += 3) seg(latLonToVec3(lat, lon, radius), latLonToVec3(lat, lon + 3, radius));
  return Float32Array.from(out);
}

const lines = (positions: Float32Array, color: number, opacity: number) => {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
};

export function createGlobe(opts: GlobeOptions): GlobeHandle {
  const { canvas, reducedMotion } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const globe = new THREE.Group();
  scene.add(globe);

  globe.add(new THREE.Mesh(new THREE.SphereGeometry(0.998, 64, 48), rimMaterial()));
  globe.add(lines(graticule(30, 1.0), INK, 0.1));
  let borders = lines(buildBorderPositions(opts.low, 1.0), INK, 0.7);
  globe.add(borders);
  const hover = lines(new Float32Array(0), LIME, 0.5);
  const selected = lines(new Float32Array(0), LIME, 1);
  hover.visible = selected.visible = false;
  globe.add(hover, selected);

  let topo: Topology = opts.low;
  let pick = createPicker(opts.low);
  let disposed = false;
  const timers: number[] = [];
  const later = (fn: () => void, ms = 0) => void timers.push(window.setTimeout(() => !disposed && fn(), ms));

  // ---- view state: yaw/pitch of the globe, camera distance
  let yaw = -(START.lon * Math.PI) / 180;
  let pitch = (START.lat * Math.PI) / 180;
  let vYaw = 0;
  let vPitch = 0;
  let distance = 3.6;
  let lastInput = performance.now();
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const setOutline = (line: THREE.LineSegments, id: string | null) => {
    line.geometry.dispose();
    const pos = id ? buildCountryPositions(topo, id, 1.003) : new Float32Array(0);
    line.geometry = new THREE.BufferGeometry();
    line.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    line.visible = pos.length > 0;
  };

  const raycaster = new THREE.Raycaster();
  const sphere = new THREE.Sphere(new THREE.Vector3(), 1);
  const hit = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  const latLonAt = (clientX: number, clientY: number): { lat: number; lon: number } | null => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectSphere(sphere, hit)) return null;
    globe.updateMatrixWorld();
    const p = globe.worldToLocal(hit);
    return vec3ToLatLon(p.x, p.y, p.z);
  };

  const listeners = new Set<(id: string | null, lat: number, lon: number) => void>();
  let hoverId: string | null = null;
  let hoverQueued = false;

  const onDown = (e: PointerEvent) => {
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = e.timeStamp;
    vYaw = vPitch = 0;
    lastInput = performance.now();
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  };
  const onMove = (e: PointerEvent) => {
    lastInput = performance.now();
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      const k = (0.004 * (distance - 1)) / 2.6;
      const dtS = Math.max((e.timeStamp - lastT) / 1000, 0.008); // velocity from real event spacing, clamped so a flick cannot spin for minutes
      lastT = e.timeStamp;
      vYaw = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, (dx * k) / dtS));
      vPitch = Math.max(-MAX_SPIN, Math.min(MAX_SPIN, (dy * k) / dtS));
      yaw += dx * k;
      pitch = Math.max(-1.45, Math.min(1.45, pitch + dy * k));
      return;
    }
    if (hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      if (disposed) return;
      const ll = latLonAt(e.clientX, e.clientY);
      const id = ll ? pick(ll.lat, ll.lon) : null;
      if (id !== hoverId) {
        hoverId = id;
        setOutline(hover, id);
      }
      canvas.style.cursor = id ? 'pointer' : 'grab';
    });
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    canvas.style.cursor = 'grab';
    if (moved < 5) {
      const ll = latLonAt(e.clientX, e.clientY);
      const id = ll ? pick(ll.lat, ll.lon) : null;
      setOutline(selected, id);
      if (ll) listeners.forEach((cb) => cb(id, ll.lat, ll.lon));
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    lastInput = performance.now();
    distance = Math.max(MIN_DIST, Math.min(MAX_DIST, distance * Math.exp(e.deltaY * 0.001)));
  };
  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  // ---- render loop (paused while the tab is hidden)
  let prev = performance.now();
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (!dragging) {
      const idle = now - lastInput > IDLE_BEFORE_SPIN_MS;
      yaw += (vYaw + (!reducedMotion && idle ? 0.06 : 0)) * dt;
      pitch = Math.max(-1.45, Math.min(1.45, pitch + vPitch * dt));
      const decay = Math.exp(-dt * 4);
      vYaw *= decay;
      vPitch *= decay;
    }
    globe.rotation.set(pitch, yaw, 0, 'XYZ');
    camera.position.z = distance * (camera.aspect < 1 ? 1 / camera.aspect : 1);
    renderer.render(scene, camera);
  };
  const start = () => {
    prev = performance.now();
    renderer.setAnimationLoop(frame);
  };
  const onVisibility = () => (document.hidden ? renderer.setAnimationLoop(null) : start());
  document.addEventListener('visibilitychange', onVisibility);
  start();

  return {
    setHighDetail(t) {
      later(() => {
        topo = t;
        const next = lines(buildBorderPositions(t, 1.0), INK, 0.7);
        globe.remove(borders);
        borders.geometry.dispose();
        (borders.material as THREE.Material).dispose();
        borders = next;
        globe.add(borders);
        later(() => (pick = createPicker(t)));
      });
    },
    setHighlight(id) {
      setOutline(selected, id);
    },
    onPick(cb) {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
    boot: { skip() {}, get done() { return true; } },
    dispose() {
      disposed = true;
      timers.forEach((t) => window.clearTimeout(t));
      renderer.setAnimationLoop(null);
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', onLost);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose();
      });
      renderer.dispose();
    },
  };
}
