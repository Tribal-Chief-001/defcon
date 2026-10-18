import * as THREE from 'three';
import type { Topology } from 'topojson-specification';
import { latLonToVec3, vec3ToLatLon } from '../lib/geo';
import type { EventAttrs } from '../events/attributes';
import { createBootControl, type BootControl, type BootState } from './boot';
import { createEventLayer } from './eventLayer';
import { buildBorderPositions, buildCountryPositions } from './borderGeometry';
import type { Relations } from '../relations/types';
import { createArcLayer } from './arcLayer';
import { easeDive } from './dive';
import { createClickClassifier } from './gesture';
import { selectCapitals, type Capital } from './labels';
import { createPicker } from './pick';

export type GlobeHandle = {
  setHighDetail(topo: Topology): void;
  setHighlight(id: string | null): void;
  onPick(cb: (id: string | null, lat: number, lon: number, kmPerPx: number) => void): () => void;
  setEvents(list: EventAttrs[]): void;
  setEventMarker(lat: number | null, lon?: number): void;
  dive(id: string | null, target?: { lat: number; lon: number; distance: number }): void;
  setFraming(x: number, y: number): void;
  setTimeBack(backS: number): void;
  setCapitals(caps: Capital[]): void;
  setRelations(rel: Relations | null, points: Record<string, { lat: number; lon: number }>): void;
  onLabels(cb: (labels: { id: string; name: string; x: number; y: number }[]) => void): () => void;
  boot: BootControl;
  dispose(): void;
};

export type GlobeOptions = {
  canvas: HTMLCanvasElement;
  low: Topology;
  high?: Topology;
  reducedMotion: boolean;
  onContextLost?: () => void;
  onFrame?: (nowMs: number) => void; // dev frame stats
};

const INK = 0xede9e9; // text bone, #EDEDE9 family
const LIME = 0xd6ff57;
const START = { lat: 22, lon: 78 }; // opens facing India
const MIN_DIST = 1.45;
const MAX_DIST = 6;
const IDLE_BEFORE_SPIN_MS = 2500;
const MAX_SPIN = 4; // rad/s after a flick
const HOME_DISTANCE = 3.6;
const DIVE_MS = 1200;
const MARKER_HIT_PX = 14;
const D2R = Math.PI / 180;
const wrapPi = (a: number) => ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;

const rimMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: { uRim: { value: 0 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uRim;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0);
        gl_FragColor = vec4(vec3(0.93, 0.93, 0.91) * f * 0.35 * uRim, 1.0);
      }`,
    polygonOffset: true, // keeps the black sphere just behind the border lines
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });

// Meridians, the equator and the other parallels are separate objects so the boot can draw them in turn.
function graticuleParts(stepDeg: number, radius: number) {
  const meridians: number[] = [];
  const equator: number[] = [];
  const parallels: number[] = [];
  const seg = (out: number[], a: [number, number, number], b: [number, number, number]) => out.push(...a, ...b);
  for (let lon = -180; lon < 180; lon += stepDeg)
    for (let lat = -90; lat < 90; lat += 3) seg(meridians, latLonToVec3(lat, lon, radius), latLonToVec3(lat + 3, lon, radius));
  for (let lat = -90 + stepDeg; lat < 90; lat += stepDeg)
    for (let lon = -180; lon < 180; lon += 3)
      seg(lat === 0 ? equator : parallels, latLonToVec3(lat, lon, radius), latLonToVec3(lat, lon + 3, radius));
  return { meridians: Float32Array.from(meridians), equator: Float32Array.from(equator), parallels: Float32Array.from(parallels) };
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

  const rim = rimMaterial();
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(0.998, 64, 48), rim));
  const grat = graticuleParts(30, 1.0);
  const equator = lines(grat.equator, INK, 0.3);
  const meridians = lines(grat.meridians, INK, 0.1);
  const parallels = lines(grat.parallels, INK, 0.1);
  globe.add(equator, meridians, parallels);
  let borders = lines(buildBorderPositions(opts.low, 1.0), INK, 0.7);
  globe.add(borders);

  // ---- Sonar Boot: a lime point and a ring in front of the globe, then the lines draw in
  const boot = createBootControl({
    reducedMotion,
    now: () => performance.now(),
    storage: (() => {
      try {
        return window.sessionStorage;
      } catch {
        return undefined;
      }
    })(),
  });
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 1.02]), 3));
  const dot = new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: LIME, size: 7, sizeAttenuation: false, transparent: true, opacity: 0 }));
  const ringGeo = new THREE.BufferGeometry();
  const ringPts: number[] = [];
  for (let i = 0; i < 128; i++) ringPts.push(Math.cos((i / 128) * Math.PI * 2), Math.sin((i / 128) * Math.PI * 2), 1.02);
  ringGeo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(ringPts), 3));
  const ring = new THREE.LineLoop(ringGeo, new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0 }));
  scene.add(dot, ring);

  const reveal = (obj: THREE.LineSegments, p: number) => {
    const n = obj.geometry.getAttribute('position').count;
    obj.geometry.setDrawRange(0, Math.floor((n / 2) * p) * 2);
  };
  let bordersReveal = 1;
  let bootApplied = false;
  const applyBoot = (b: BootState) => {
    if (bootApplied) return;
    dot.visible = !b.done;
    ring.visible = !b.done;
    (dot.material as THREE.PointsMaterial).opacity = (1 - b.ring) * b.dot;
    ring.scale.setScalar(0.02 + 1.6 * b.ring);
    (ring.material as THREE.LineBasicMaterial).opacity = b.ring > 0 ? (1 - b.ring) * 0.9 : 0;
    rim.uniforms.uRim!.value = b.equator;
    reveal(equator, b.equator);
    reveal(meridians, b.meridians);
    reveal(parallels, b.meridians);
    bordersReveal = b.borders;
    reveal(borders, b.borders);
    if (b.done) bootApplied = true;
  };
  applyBoot(boot.state());
  const skipBoot = () => boot.skip();
  window.addEventListener('keydown', skipBoot);
  const eventLayer = createEventLayer();
  globe.add(eventLayer.points, eventLayer.marker);
  const arcs = createArcLayer(reducedMotion);
  globe.add(arcs.object);
  let relations: Relations | null = null;
  let relPoints: Record<string, { lat: number; lon: number }> = {};
  let arcFocus: string | null | undefined;
  // arcs follow the hovered country, else the dived one; rebuilt only when that changes
  const refreshArcs = (force = false) => {
    const focus = hoverId ?? diveId;
    if (!force && focus === arcFocus) return;
    arcFocus = focus;
    arcs.show(focus, relations, relPoints);
  };
  const hover = lines(new Float32Array(0), LIME, 0.5);
  const selected = lines(new Float32Array(0), LIME, 1);
  hover.visible = selected.visible = false;
  globe.add(hover, selected);

  // ---- capital markers: one Points object (thin cyan crosshair), re-selected at most 15 times a second as the view changes
  const MAX_MARKERS = 40;
  const crosshair = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    if (g) {
      g.strokeStyle = '#00FFF0';
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(16, 3);
      g.lineTo(16, 12);
      g.moveTo(16, 20);
      g.lineTo(16, 29);
      g.moveTo(3, 16);
      g.lineTo(12, 16);
      g.moveTo(20, 16);
      g.lineTo(29, 16);
      g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.flipY = false; // the crosshair is symmetric; leaving FLIP_Y on made the browser warn about later 3D texture uploads
    return tex;
  })();
  const capGeo = new THREE.BufferGeometry();
  const capPos = new Float32Array(MAX_MARKERS * 3);
  capGeo.setAttribute('position', new THREE.BufferAttribute(capPos, 3));
  capGeo.setDrawRange(0, 0);
  const capPoints = new THREE.Points(
    capGeo,
    new THREE.PointsMaterial({ map: crosshair, size: 16, sizeAttenuation: false, transparent: true, alphaTest: 0.05, depthWrite: false }),
  );
  capPoints.frustumCulled = false; // the points move with the globe; the bounding sphere of an empty geometry would cull them
  globe.add(capPoints);
  let allCaps: Capital[] = [];
  let shown: { c: Capital; x: number; y: number }[] = [];
  let capSig = '';
  let capLastT = 0;
  let labelKey = '';
  const labelListeners = new Set<(l: { id: string; name: string; x: number; y: number }[]) => void>();

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
  const click = createClickClassifier();
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;

  // framing: shifts the whole picture (fractions of the canvas) so a side panel does not cover the globe; eased each frame
  let frame = { x: 0, y: 0 };
  let frameTarget = { x: 0, y: 0 };
  const applyFraming = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    camera.setViewOffset(w, h, -frame.x * w, frame.y * h, w, h);
    camera.updateProjectionMatrix();
  };
  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    applyFraming();
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

  // ---- Country Dive: the camera flies to a country, its outline draws in, the other borders dim
  type View = { yaw: number; pitch: number; distance: number };
  let diveId: string | null = null;
  let anim: { t0: number; from: View; to: View } | null = null;
  let pendingDive: { id: string | null; target?: { lat: number; lon: number; distance: number } } | null = null;
  let dimT = 0;
  let outlineT = 1;
  const flyTo = (to: View) => {
    if (reducedMotion) {
      ({ yaw, pitch, distance } = to);
      anim = null;
    } else anim = { t0: performance.now(), from: { yaw, pitch, distance }, to };
    vYaw = vPitch = 0;
  };
  const doDive = (id: string | null, target?: { lat: number; lon: number; distance: number }) => {
    diveId = id;
    refreshArcs();
    setOutline(selected, id);
    if (id === null) return flyTo({ yaw, pitch, distance: HOME_DISTANCE });
    outlineT = reducedMotion ? 1 : 0;
    reveal(selected, outlineT);
    const t = target ?? { lat: pitch / D2R, lon: -yaw / D2R, distance: 2.2 };
    flyTo({ yaw: yaw + wrapPi(-t.lon * D2R - yaw), pitch: Math.max(-1.45, Math.min(1.45, t.lat * D2R)), distance: Math.max(MIN_DIST, Math.min(MAX_DIST, t.distance)) });
  };

  const listeners = new Set<(id: string | null, lat: number, lon: number, kmPerPx: number) => void>();
  let hoverId: string | null = null;
  let hoverQueued = false;

  const onDown = (e: PointerEvent) => {
    boot.skip();
    anim = null; // the user takes over from a running fly-to
    dragging = true;
    click.down();
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
      click.move(dx, dy);
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
        refreshArcs();
      }
      canvas.style.cursor = id ? 'pointer' : 'grab';
    });
  };
  const onCancel = () => {
    dragging = false;
    canvas.style.cursor = 'grab';
    click.cancel();
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    canvas.style.cursor = 'grab';
    if (click.up()) {
      // ground distance one screen pixel covers at the front of the globe (6,371 km radius), used to size the event pick radius
      const kmPerPx = ((2 * Math.max(0.05, camera.position.z - 1) * Math.tan((camera.fov * Math.PI) / 360)) / Math.max(1, canvas.clientHeight)) * 6371;
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      let near: (typeof shown)[number] | undefined;
      let best = MARKER_HIT_PX;
      for (const m of shown) {
        const d = Math.hypot(m.x - mx, m.y - my);
        if (d <= best) [best, near] = [d, m];
      }
      if (near) {
        // a marker wins over the country underneath: this is also the only way to reach micro-states with no polygon
        if (!diveId) setOutline(selected, near.c.country);
        listeners.forEach((cb) => cb(near.c.country, near.c.lat, near.c.lon, kmPerPx));
        return;
      }
      const ll = latLonAt(e.clientX, e.clientY);
      const id = ll ? pick(ll.lat, ll.lon) : null;
      if (!diveId) setOutline(selected, id); // during a dive the outline belongs to the dived country
      if (ll) listeners.forEach((cb) => cb(id, ll.lat, ll.lon, kmPerPx));
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    anim = null;
    lastInput = performance.now();
    distance = Math.max(MIN_DIST, Math.min(MAX_DIST, distance * Math.exp(e.deltaY * 0.001)));
  };
  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const v3 = new THREE.Vector3();
  // Called after the frame is rendered so the matrices are current. Selection is throttled; screen positions follow the view.
  const updateCapitals = (now: number) => {
    if (!allCaps.length) return;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const sig = [pitch, yaw, distance, frame.x, frame.y, w, h, diveId].join('|');
    if (sig === capSig || now - capLastT < 66) return;
    capSig = sig;
    capLastT = now;
    const chosen = selectCapitals(allCaps, { lat: pitch / D2R, lon: -yaw / D2R, distance }, diveId, MAX_MARKERS);
    shown = chosen.map((c) => {
      v3.set(...latLonToVec3(c.lat, c.lon, 1.004)).applyMatrix4(globe.matrixWorld).project(camera);
      return { c, x: (v3.x * 0.5 + 0.5) * w, y: (-v3.y * 0.5 + 0.5) * h };
    });
    chosen.forEach((c, i) => capPos.set(latLonToVec3(c.lat, c.lon, 1.004), i * 3));
    capGeo.setDrawRange(0, chosen.length);
    capGeo.getAttribute('position').needsUpdate = true;
    // greedy by rank: a label that would overlap one already placed is dropped (its marker stays and stays clickable)
    const boxes: [number, number, number, number][] = [];
    const out: { id: string; name: string; x: number; y: number }[] = [];
    for (const { c, x, y } of shown) {
      const box: [number, number, number, number] = [x + 7, y - 8, x + 13 + c.name.length * 7.6, y + 10];
      if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
      boxes.push(box);
      out.push({ id: `${c.country}:${c.name}`, name: c.name, x, y });
    }
    const key = out.map((l) => `${l.id}@${Math.round(l.x)},${Math.round(l.y)}`).join('|');
    if (key === labelKey) return; // nothing visible moved: no callback, so nothing re-renders
    labelKey = key;
    labelListeners.forEach((cb) => cb(out));
  };

  // ---- render loop (paused while the tab is hidden)
  let prev = performance.now();
  let fade = 0;
  const render = (now: number) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    applyBoot(boot.state());
    const dx = frameTarget.x - frame.x;
    const dy = frameTarget.y - frame.y;
    if (Math.abs(dx) + Math.abs(dy) > 1e-4) {
      const k = reducedMotion ? 1 : Math.min(1, dt * 5);
      frame = { x: frame.x + dx * k, y: frame.y + dy * k };
      applyFraming();
    }
    if (pendingDive && boot.done) {
      const p = pendingDive;
      pendingDive = null;
      doDive(p.id, p.target);
    }
    if (anim) {
      const t = (now - anim.t0) / DIVE_MS;
      const e = easeDive(t);
      yaw = anim.from.yaw + (anim.to.yaw - anim.from.yaw) * e;
      pitch = anim.from.pitch + (anim.to.pitch - anim.from.pitch) * e;
      distance = anim.from.distance + (anim.to.distance - anim.from.distance) * e;
      if (t >= 1) anim = null;
    }
    if (diveId && outlineT < 1) {
      outlineT = Math.min(1, outlineT + (dt * 1000) / DIVE_MS);
      reveal(selected, easeDive(outlineT));
    }
    dimT += ((diveId ? 1 : 0) - dimT) * Math.min(1, dt * 4);
    (borders.material as THREE.LineBasicMaterial).opacity = 0.7 - 0.45 * dimT;
    if (!dragging) {
      const idle = boot.done && !diveId && !anim && now - lastInput > IDLE_BEFORE_SPIN_MS;
      yaw += (vYaw + (!reducedMotion && idle ? 0.06 : 0)) * dt;
      pitch = Math.max(-1.45, Math.min(1.45, pitch + vPitch * dt));
      const decay = Math.exp(-dt * 4);
      vYaw *= decay;
      vPitch *= decay;
    }
    globe.rotation.set(pitch, yaw, 0, 'XYZ');
    camera.position.z = distance * (camera.aspect < 1 ? 1 / camera.aspect : 1);
    if (boot.done) fade = Math.min(1, fade + dt / 1.5); // events fade in over 1.5 s once the boot is done
    eventLayer.update(fade, renderer.getPixelRatio());
    arcs.update(now);
    renderer.render(scene, camera);
    updateCapitals(now);
    opts.onFrame?.(now);
  };
  const start = () => {
    prev = performance.now();
    renderer.setAnimationLoop(render);
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
        reveal(borders, bordersReveal);
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
    setEvents(list) {
      eventLayer.setData(list);
    },
    setEventMarker(lat, lon) {
      eventLayer.setMarker(lat, lon);
    },
    setFraming(x, y) {
      frameTarget = { x, y };
    },
    setTimeBack(backS) {
      eventLayer.setBack(backS);
    },
    setRelations(rel, points) {
      relations = rel;
      relPoints = points;
      refreshArcs(true);
    },
    setCapitals(caps) {
      allCaps = caps;
      capSig = '';
    },
    onLabels(cb) {
      labelListeners.add(cb);
      return () => void labelListeners.delete(cb);
    },
    dive(id, target) {
      pendingDive = { id, target }; // applied in the frame loop once the Sonar Boot is done
    },
    boot,
    dispose() {
      disposed = true;
      timers.forEach((t) => window.clearTimeout(t));
      renderer.setAnimationLoop(null);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('keydown', skipBoot);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', onLost);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose();
      });
      crosshair.dispose();
      eventLayer.dispose();
      renderer.dispose();
    },
  };
}
