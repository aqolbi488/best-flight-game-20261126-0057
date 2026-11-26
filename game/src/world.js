// Island heightfield, coastline, fields, town, trees, runway and rings — all from the fixed seed.
import { WORLD } from './config.js';
import { mulberry32, clamp } from './random.js';

const rng = mulberry32(WORLD.seed);

// Smooth value-noise height: island dome + hills, flattened near the runway and town.
function noise2(x, z) {
  const s = Math.sin(x * 0.0016 + 1.7) * Math.cos(z * 0.0014 - 0.6);
  const t = Math.sin(x * 0.006 + z * 0.004) * 0.5 + Math.cos(z * 0.009 - x * 0.003) * 0.3;
  return s + t;
}
export function terrainHeight(x, z) {
  const r = Math.hypot(x, z) / (WORLD.size * 0.52);
  let h = (1 - r * r) * 95 + noise2(x, z) * 22 - 14;
  // Flatten runway plateau.
  const rw = WORLD.runway;
  const dRun = Math.max(Math.abs(x - rw.x) - 70, Math.abs(z - rw.z) - 330, 0);
  const kRun = clamp(dRun / 220, 0, 1);
  h = 14 * (1 - kRun) + h * kRun;
  // Flatten town bench.
  const dTown = Math.max(Math.hypot(x - WORLD.town.x, z - WORLD.town.z) - 180, 0);
  const kTown = clamp(dTown / 200, 0, 1);
  h = 16 * (1 - kTown) + h * kTown;
  return h;
}
export function isWater(x, z) { return terrainHeight(x, z) <= WORLD.seaLevel + 0.4; }

// Patchwork fields: deterministic rectangles on the flatter south-west.
export const FIELDS = [];
for (let i = 0; i < 26; i++) {
  const fx = -1250 + rng() * 1500, fz = 150 + rng() * 1100;
  if (terrainHeight(fx, fz) < 4) continue;
  FIELDS.push({ x: fx, z: fz, w: 150 + rng() * 220, d: 110 + rng() * 180, hue: rng() });
}
// Town houses.
export const HOUSES = [];
for (let i = 0; i < 34; i++) {
  const hx = WORLD.town.x + (rng() - 0.5) * 340, hz = WORLD.town.z + (rng() - 0.5) * 300;
  HOUSES.push({ x: hx, z: hz, w: 18 + rng() * 22, d: 16 + rng() * 20, h: 9 + rng() * 12, rot: rng() * Math.PI });
}
// Trees scattered on land, avoiding runway/town.
export const TREES = [];
let guard = 0;
while (TREES.length < 240 && guard++ < 4000) {
  const tx = (rng() - 0.5) * WORLD.size * 0.9, tz = (rng() - 0.5) * WORLD.size * 0.9;
  const h = terrainHeight(tx, tz);
  if (h < 3 || h > 70) continue;
  if (Math.abs(tx - WORLD.runway.x) < 90 && Math.abs(tz - WORLD.runway.z) < 340) continue;
  if (Math.hypot(tx - WORLD.town.x, tz - WORLD.town.z) < 190) continue;
  TREES.push({ x: tx, z: tz, h: 7 + rng() * 8 });
}
// Gold ring course: a loop around the island ending near the runway.
export const RINGS = [
  { x: 0, y: 150, z: 500, r: 34 },
  { x: -480, y: 170, z: 60, r: 34 },
  { x: -720, y: 150, z: -520, r: 34 },
  { x: -180, y: 190, z: -980, r: 34 },
  { x: 520, y: 165, z: -760, r: 34 },
  { x: 700, y: 150, z: -80, r: 34 },
];
// Delivery field (second mission type): marked grass strip east of town.
export const DELIVERY = { x: 980, z: 420, r: 120 };
export function onRunway(x, z) {
  const rw = WORLD.runway;
  return Math.abs(x - rw.x) <= rw.width / 2 + 6 && Math.abs(z - rw.z) <= rw.length / 2;
}
export function runwayY() { return 14; }
