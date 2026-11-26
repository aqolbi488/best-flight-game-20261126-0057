// Two mission types: (1) ring circuit then land; (2) supply drop at the marked field, then land.
// Score rewards rings, a clean drop, remaining fuel and hull.
import { RINGS, DELIVERY, onRunway } from './world.js';
import { clamp } from './random.js';

export function makeMission(kind) {
  return { kind, ringIndex: 0, ringsDone: 0, delivered: false, score: 0, done: false, failed: false, message: '' };
}
export function missionText(m) {
  if (m.done) return 'Mission complete — nice flying!';
  if (m.failed) return 'Mission failed. Press R to try again.';
  if (m.kind === 'rings') {
    if (m.ringIndex < RINGS.length) return `Fly through gold ring ${m.ringIndex + 1} of ${RINGS.length} — follow the arrow.`;
    return 'All rings clear! Land gently on the runway (slow, level, on the strip).';
  }
  if (!m.delivered) return 'Supply run: fly low over the orange-marked field east of town to drop the crate.';
  return 'Crate away! Return and land on the runway.';
}
export function stepMission(m, p) {
  if (m.done || m.failed) return;
  if (p.crashed) { m.failed = true; m.message = 'Crashed. Press R to restart.'; return; }
  if (m.kind === 'rings' && m.ringIndex < RINGS.length) {
    const r = RINGS[m.ringIndex];
    const d = Math.hypot(p.x - r.x, p.y - r.y, p.z - r.z);
    if (d < r.r) { m.ringIndex++; m.ringsDone++; m.score += 250; }
  }
  if (m.kind === 'delivery' && !m.delivered) {
    const d = Math.hypot(p.x - DELIVERY.x, p.z - DELIVERY.z);
    if (d < DELIVERY.r && p.y < 90) { m.delivered = true; m.score += 600; }
  }
  const ready = m.kind === 'rings' ? m.ringIndex >= RINGS.length : m.delivered;
  if (ready && p.landed && onRunway(p.x, p.z)) {
    m.done = true;
    m.score += 500 + Math.round(clamp(p.fuel, 0, 100) * 4) + Math.round(clamp(p.hull, 0, 100) * 3);
    m.message = 'Landed! Press R for another sortie.';
  }
}
export function targetOf(m) {
  if (m.kind === 'rings' && m.ringIndex < RINGS.length) return RINGS[m.ringIndex];
  if (m.kind === 'delivery' && !m.delivered) return { x: DELIVERY.x, y: 60, z: DELIVERY.z };
  return { x: 0, y: 16, z: 900 };
}
