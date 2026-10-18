import * as THREE from 'three';
import { relationsFor } from '../relations/lookup';
import type { Relations } from '../relations/types';
import { arcPoints, dashedSegments, solidSegments } from './arcs';

const CYAN = 0x00fff0;
const ORANGE = 0xff4d00;
const DRAW_MS = 400;

type Points = Record<string, { lat: number; lon: number }>;

const makeLines = (color: number) => {
  const l = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }));
  l.visible = false;
  l.frustumCulled = false;
  return l;
};

// Cyan solid arcs to the focus country's allies, orange dashed arcs to its active disputes; both draw in over 400 ms.
export function createArcLayer(reducedMotion: boolean) {
  const group = new THREE.Group();
  const allies = makeLines(CYAN);
  const disputes = makeLines(ORANGE);
  group.add(allies, disputes);
  let t0 = 0;
  let progress = 1;

  const fill = (line: THREE.LineSegments, positions: Float32Array) => {
    line.geometry.dispose();
    line.geometry = new THREE.BufferGeometry();
    line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    line.visible = positions.length > 0;
  };
  const cat = (parts: Float32Array[]) => {
    const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) (out.set(p, o), (o += p.length));
    return out;
  };
  const draw = () => {
    for (const l of [allies, disputes]) {
      const n = l.geometry.getAttribute('position')?.count ?? 0;
      l.geometry.setDrawRange(0, Math.floor((n / 2) * progress) * 2);
    }
  };

  return {
    object: group,
    show(id: string | null, rel: Relations | null, points: Points) {
      const here = id ? points[id] : undefined;
      if (!id || !here || !rel) {
        fill(allies, new Float32Array(0));
        fill(disputes, new Float32Array(0));
        return;
      }
      const r = relationsFor(rel, id);
      const arcs = (ids: string[]) => ids.flatMap((o) => (points[o] ? [arcPoints(here, points[o]!)] : []));
      fill(allies, cat(arcs(r.allies.map((a) => a.id)).map(solidSegments)));
      fill(disputes, cat(arcs(r.disputes.map((d) => d.id)).map((p) => dashedSegments(p))));
      progress = reducedMotion ? 1 : 0;
      t0 = performance.now();
      draw();
    },
    update(now: number) {
      if (progress >= 1) return;
      progress = Math.min(1, (now - t0) / DRAW_MS);
      draw();
    },
    dispose() {
      for (const l of [allies, disputes]) (l.geometry.dispose(), (l.material as THREE.Material).dispose());
    },
  };
}
