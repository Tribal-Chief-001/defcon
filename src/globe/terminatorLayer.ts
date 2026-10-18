import * as THREE from 'three';
import { latLonToVec3 } from '../lib/geo';
import { subsolarPoint, terminatorPoints } from './sun';

// The day/night edge as a thin bone line just above the surface.
export function createTerminatorLayer(n = 180) {
  const positions = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const line = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: 0xede9e9, transparent: true, opacity: 0.5 }));
  line.frustumCulled = false;
  line.visible = false;
  return {
    object: line,
    update(unixS: number) {
      const pts = terminatorPoints(subsolarPoint(unixS), n);
      pts.forEach(([lat, lon], i) => positions.set(latLonToVec3(lat, lon, 1.002), i * 3));
      geo.getAttribute('position').needsUpdate = true;
      line.visible = true;
    },
    dispose() {
      geo.dispose();
      (line.material as THREE.Material).dispose();
    },
  };
}
