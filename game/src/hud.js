// DOM HUD: big altitude / speed / heading readouts plus fuel, hull, mission and score.
import { headingDeg, speedKt } from './plane.js';
import { missionText } from './missions.js';
import { RINGS } from './world.js';

const el = (id) => document.getElementById(id);
export function updateHud(p, m, cameraMode) {
  el('alt').textContent = `${Math.max(0, Math.round(p.y))} m`;
  el('spd').textContent = `${speedKt(p)} kt`;
  el('hdg').textContent = `${String(headingDeg(p)).padStart(3, '0')}°`;
  el('fuelBar').style.width = `${p.fuel}%`;
  el('fuelTxt').textContent = `${Math.round(p.fuel)}%`;
  el('hullBar').style.width = `${p.hull}%`;
  el('hullBar').style.background = p.hull > 50 ? '#5ef08a' : p.hull > 25 ? '#ffd166' : '#ff6b6b';
  el('hullTxt').textContent = `${Math.round(p.hull)}%`;
  el('missionText').textContent = missionText(m);
  const progress = m.kind === 'rings' ? `Rings ${m.ringsDone}/${RINGS.length}` : (m.delivered ? 'Delivered ✓' : 'Crate aboard');
  el('scoreLine').textContent = `Score ${m.score} · ${progress} · Camera: ${cameraMode} · Throttle ${Math.round(p.throttle * 100)}%`;
  el('stall').textContent = p.stalled ? '⚠ STALL — add throttle / nose down' : (p.fuel <= 0 ? '⚠ OUT OF FUEL — glide to the runway' : '');
  const msg = el('msg');
  if (m.done) msg.innerHTML = `<h1>✓ Landed!</h1><p>Score ${m.score} · Fuel left ${Math.round(p.fuel)}% · Hull ${Math.round(p.hull)}%</p><p>Press <kbd>R</kbd> to fly again (missions alternate).</p>`;
  else if (m.failed || p.crashed) msg.innerHTML = `<h1>💥 Crashed</h1><p>Hull ${Math.round(p.hull)}% — ${p.crashed ? 'the aircraft is wrecked.' : ''}</p><p>Press <kbd>R</kbd> to restart.</p>`;
  else if (p.landed) msg.innerHTML = `<h1>On the ground</h1><p>Not the full mission yet — press <kbd>R</kbd> to restart, or take off again with throttle + pitch up.</p>`;
  else msg.innerHTML = '';
  msg.style.display = msg.innerHTML ? 'block' : 'none';
}
