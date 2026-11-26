// Canvas 3D-ish renderer: chase + cockpit cameras over a projected heightfield island.
// Camera looks along the aircraft heading; world points are projected with a simple pinhole model.
import { COLORS, WORLD } from './config.js';
import { terrainHeight, FIELDS, HOUSES, TREES, RINGS, DELIVERY } from './world.js';
import { clamp } from './random.js';

const CLOUDS = [
  { x: -900, y: 420, z: -600, s: 260 }, { x: 500, y: 460, z: -1100, s: 320 },
  { x: 1100, y: 400, z: 300, s: 240 }, { x: -400, y: 480, z: 800, s: 300 },
  { x: 0, y: 440, z: -200, s: 220 }, { x: -1400, y: 430, z: 200, s: 280 },
];

export function makeCamera() { return { x: 0, y: 160, z: 1400, heading: 0, pitch: 0, mode: 'chase' }; }

function project(cam, W, H, x, y, z) {
  const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
  const sh = Math.sin(cam.heading), ch = Math.cos(cam.heading);
  // Forward = (sin h, -cos h) in XZ; right = (cos h, sin h).
  const fwd = dx * sh - dz * ch;
  const right = dx * ch + dz * sh;
  if (fwd < 4) return null;
  const f = H * 0.95;
  const sx = W / 2 + (right / fwd) * f;
  const sy = H * 0.52 - ((dy - Math.sin(cam.pitch) * fwd * 0.35) / fwd) * f;
  return { x: sx, y: sy, d: fwd, s: f / fwd };
}
function poly(ctx, pts, fill) {
  if (pts.some((p) => !p)) return;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function shade(base, f) {
  const n = parseInt(base.slice(1), 16);
  const r = clamp(((n >> 16) & 255) * f, 0, 255) | 0, g = clamp(((n >> 8) & 255) * f, 0, 255) | 0, b = clamp((n & 255) * f, 0, 255) | 0;
  return `rgb(${r},${g},${b})`;
}
function groundColor(h, x, z) {
  if (h <= 0.5) return COLORS.sea;
  if (h < 3.5) return COLORS.sand;
  if (h > 62) return COLORS.rock;
  if (h > 34) return COLORS.hill;
  return ((x + z) % 400 + 400) % 400 < 200 ? COLORS.grass : '#67b95e';
}

export function render(ctx, W, H, cam, plane, mission, target) {
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, COLORS.skyTop); sky.addColorStop(1, COLORS.skyBot);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // Sun + clouds.
  const sun = project(cam, W, H, cam.x + Math.sin(cam.heading) * 3000 + 1400, 1100, cam.z - Math.cos(cam.heading) * 3000);
  if (sun) { ctx.fillStyle = '#fff7c2'; ctx.beginPath(); ctx.arc(sun.x, Math.min(sun.y, H * 0.22), 20, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  for (const c of CLOUDS) { const p = project(cam, W, H, c.x, c.y, c.z); if (p) { ctx.beginPath(); ctx.ellipse(p.x, p.y, c.s * p.s * 0.4, c.s * p.s * 0.12, 0, 0, 7); ctx.fill(); } }
  // Sea base.
  ctx.fillStyle = COLORS.seaDeep; ctx.fillRect(0, H * 0.52, W, H * 0.48);
  // Terrain grid (coarse near camera).
  const STEP = 150, RANGE = 2600;
  const cells = [];
  const gx0 = Math.floor((cam.x - RANGE) / STEP), gx1 = Math.floor((cam.x + RANGE) / STEP);
  const gz0 = Math.floor((cam.z - RANGE) / STEP), gz1 = Math.floor((cam.z + RANGE) / STEP);
  for (let gz = gz0; gz < gz1; gz++) for (let gx = gx0; gx < gx1; gx++) {
    const x0 = gx * STEP, z0 = gz * STEP;
    const cx = x0 + STEP / 2, cz = z0 + STEP / 2;
    const d = Math.hypot(cx - cam.x, cz - cam.z);
    if (d > RANGE) continue;
    cells.push({ x0, z0, d, h: terrainHeight(cx, cz) });
  }
  cells.sort((a, b) => b.d - a.d);
  for (const c of cells) {
    const pts = [
      project(cam, W, H, c.x0, Math.max(terrainHeight(c.x0, c.z0), 0), c.z0),
      project(cam, W, H, c.x0 + STEP, Math.max(terrainHeight(c.x0 + STEP, c.z0), 0), c.z0),
      project(cam, W, H, c.x0 + STEP, Math.max(terrainHeight(c.x0 + STEP, c.z0 + STEP), 0), c.z0 + STEP),
      project(cam, W, H, c.x0, Math.max(terrainHeight(c.x0, c.z0 + STEP), 0), c.z0 + STEP),
    ];
    const fog = clamp(1 - c.d / 3200, 0.55, 1);
    poly(ctx, pts, shade(groundColor(c.h, c.x0, c.z0), fog));
  }
  // Fields.
  for (const f of FIELDS) {
    const y = terrainHeight(f.x, f.z) + 0.6;
    poly(ctx, [project(cam, W, H, f.x - f.w / 2, y, f.z - f.d / 2), project(cam, W, H, f.x + f.w / 2, y, f.z - f.d / 2), project(cam, W, H, f.x + f.w / 2, y, f.z + f.d / 2), project(cam, W, H, f.x - f.w / 2, y, f.z + f.d / 2)], f.hue > 0.5 ? COLORS.fieldA : COLORS.fieldB);
  }
  // Runway with centreline + threshold marks.
  const rw = WORLD.runway, ry = 14.6;
  poly(ctx, [project(cam, W, H, rw.x - rw.width / 2, ry, rw.z - rw.length / 2), project(cam, W, H, rw.x + rw.width / 2, ry, rw.z - rw.length / 2), project(cam, W, H, rw.x + rw.width / 2, ry, rw.z + rw.length / 2), project(cam, W, H, rw.x - rw.width / 2, ry, rw.z + rw.length / 2)], COLORS.runway);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
  for (let i = -4; i <= 4; i++) {
    const a = project(cam, W, H, rw.x, ry + 0.3, rw.z + i * 52), b = project(cam, W, H, rw.x, ry + 0.3, rw.z + i * 52 + 26);
    if (a && b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  }
  // Delivery field marker.
  const dp = project(cam, W, H, DELIVERY.x, terrainHeight(DELIVERY.x, DELIVERY.z) + 2, DELIVERY.z);
  if (dp) { ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.ellipse(dp.x, dp.y, DELIVERY.r * dp.s, DELIVERY.r * dp.s * 0.32, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.max(14, 26 * dp.s)}px system-ui`; ctx.textAlign = 'center'; ctx.fillText('DROP', dp.x, dp.y); }
  // Houses (sorted far→near).
  const houses = [...HOUSES].sort((a, b) => Math.hypot(b.x - cam.x, b.z - cam.z) - Math.hypot(a.x - cam.x, a.z - cam.z));
  for (const h of houses) {
    const base = terrainHeight(h.x, h.z);
    const c = project(cam, W, H, h.x, base, h.z); if (!c || c.d > 2200) continue;
    const wpx = h.w * c.s, hpx = h.h * c.s;
    ctx.fillStyle = COLORS.townWall; ctx.fillRect(c.x - wpx / 2, c.y - hpx, wpx, hpx);
    ctx.fillStyle = COLORS.townRoof; ctx.beginPath(); ctx.moveTo(c.x - wpx / 2 - 2, c.y - hpx); ctx.lineTo(c.x, c.y - hpx - hpx * 0.55); ctx.lineTo(c.x + wpx / 2 + 2, c.y - hpx); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd98a'; ctx.fillRect(c.x - wpx * 0.18, c.y - hpx * 0.62, Math.max(2, wpx * 0.16), Math.max(2, hpx * 0.2));
  }
  // Trees.
  for (const t of TREES) {
    const p = project(cam, W, H, t.x, terrainHeight(t.x, t.z), t.z); if (!p || p.d > 1800) continue;
    const s = t.h * p.s;
    ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = Math.max(1, s * 0.12); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - s * 0.4); ctx.stroke();
    ctx.fillStyle = COLORS.tree; ctx.beginPath(); ctx.arc(p.x, p.y - s * 0.75, Math.max(1.5, s * 0.5), 0, 7); ctx.fill();
  }
  // Rings: current one pulses gold; passed ones green.
  RINGS.forEach((r, i) => {
    const p = project(cam, W, H, r.x, r.y, r.z); if (!p) return;
    const done = mission.kind === 'rings' && i < mission.ringIndex;
    const current = mission.kind === 'rings' && i === mission.ringIndex;
    ctx.strokeStyle = done ? COLORS.ringDone : COLORS.ring;
    ctx.lineWidth = current ? 10 : 6;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, r.r * p.s, r.r * p.s, 0, 0, 7); ctx.stroke();
    if (current) { ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.max(16, 30 * p.s)}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(`${i + 1}`, p.x, p.y + 8); }
  });
  // Target arrow (screen-space guide).
  const tp = project(cam, W, H, target.x, target.y, target.z);
  ctx.fillStyle = '#ffd700'; ctx.strokeStyle = '#7a5b00'; ctx.lineWidth = 2;
  const ax = tp ? clamp(tp.x, 60, W - 60) : W / 2, ay = tp ? clamp(tp.y, 120, H - 140) : 140;
  ctx.beginPath(); ctx.moveTo(ax, ay - 18); ctx.lineTo(ax + 14, ay + 10); ctx.lineTo(ax - 14, ay + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  const tDist = Math.round(Math.hypot(plane.x - target.x, plane.z - target.z));
  ctx.font = '900 20px system-ui'; ctx.textAlign = 'center';
  ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(6,24,40,.9)'; ctx.strokeText(`${tDist} m`, ax, ay + 36);
  ctx.fillStyle = '#fff'; ctx.fillText(`${tDist} m`, ax, ay + 36);
  // Aircraft (chase view) + dust.
  if (cam.mode === 'chase') drawPlane(ctx, W, H, plane);
  else drawCockpit(ctx, W, H, plane);
  if (plane.dust > 0) {
    ctx.fillStyle = `rgba(210,190,150,${0.45 * plane.dust})`;
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(W / 2 + (i - 3) * 26, H * 0.66 - i * 4, 16 + i * 5, 0, 7); ctx.fill(); }
  }
  // Artificial horizon pip.
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2 - 46, H * 0.5); ctx.lineTo(W / 2 - 12, H * 0.5); ctx.moveTo(W / 2 + 12, H * 0.5); ctx.lineTo(W / 2 + 46, H * 0.5); ctx.stroke();
}
function drawPlane(ctx, W, H, p) {
  const cx = W / 2, cy = H * 0.62 + p.bounce * -14;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(p.roll * 0.7);
  // Wings, fuselage, tail, canopy — chunky silhouette readable in a thumbnail.
  ctx.fillStyle = '#e33f2e'; ctx.fillRect(-150, -8, 300, 16);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-150, -8, 26, 16); ctx.fillRect(124, -8, 26, 16);
  ctx.fillStyle = '#2b6cb0'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 58, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#9fdcff'; ctx.beginPath(); ctx.ellipse(0, -18, 15, 22, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e33f2e'; ctx.fillRect(-44, 44, 88, 10); ctx.fillRect(-4, 30, 8, 24);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0, -56, 7, 0, 7); ctx.fill();
  ctx.restore();
}
function drawCockpit(ctx, W, H, p) {
  // Nose + instrument coaming with lit dials.
  ctx.fillStyle = '#1b2a3a'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.78); ctx.quadraticCurveTo(W / 2, H * 0.66, W, H * 0.78); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2b6cb0'; ctx.beginPath(); ctx.moveTo(W / 2 - 90, H * 0.86); ctx.lineTo(W / 2, H * 0.70); ctx.lineTo(W / 2 + 90, H * 0.86); ctx.closePath(); ctx.fill();
  const dials = [[W * 0.30, H * 0.88, 'ALT'], [W * 0.42, H * 0.90, 'SPD'], [W * 0.58, H * 0.90, 'HDG'], [W * 0.70, H * 0.88, 'FUEL']];
  for (const [x, y, label] of dials) {
    ctx.fillStyle = '#0a1622'; ctx.beginPath(); ctx.arc(x, y, 42, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#5ef08a'; ctx.font = '900 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText(label, x, y + 5);
    ctx.strokeStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 24, y - 16); ctx.stroke();
  }
  ctx.save(); ctx.translate(W / 2, H * 0.52); ctx.rotate(p.roll * 0.35); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-220, 0); ctx.lineTo(-40, 0); ctx.moveTo(40, 0); ctx.lineTo(220, 0); ctx.stroke(); ctx.restore();
}
