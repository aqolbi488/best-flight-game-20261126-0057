// Game loop: input → flight model → mission → camera → render → HUD. Missions alternate on restart.
import { makePlane, stepPlane } from './plane.js';
import { initInput, readInput } from './input.js';
import { makeMission, stepMission, targetOf } from './missions.js';
import { makeCamera, render } from './render.js';
import { updateHud } from './hud.js';
import { shotScene } from './shots.js';
import { clamp } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
initInput();

let sortie = 0;
let plane = makePlane();
let mission = makeMission('rings');
let cam = makeCamera();
const shot = shotScene();

function applyShot(s) {
  Object.assign(plane, s.plane);
  plane.vy = 0; plane.stalled = false; plane.crashed = false; plane.landed = false;
  plane.dust = s.plane.dust || 0; plane.bounce = 0;
  mission = makeMission(s.mission.kind);
  Object.assign(mission, s.mission);
  cam.mode = s.cam;
}
if (shot) applyShot(shot);

function reset() {
  sortie++;
  plane = makePlane();
  mission = makeMission(sortie % 2 === 0 ? 'rings' : 'delivery');
}
function placeCamera(dt) {
  if (cam.mode === 'chase') {
    const back = 46, up = 15;
    const tx = plane.x - Math.sin(plane.heading) * back;
    const tz = plane.z + Math.cos(plane.heading) * back;
    const ty = plane.y + up;
    const k = shot ? 1 : clamp(dt * 4.5, 0, 1);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.z += (tz - cam.z) * k;
    cam.heading = plane.heading; cam.pitch = plane.pitch * 0.6;
  } else {
    cam.x = plane.x; cam.y = plane.y + 1.6; cam.z = plane.z;
    cam.heading = plane.heading; cam.pitch = plane.pitch;
  }
}
let last = performance.now();
function frame(now) {
  const dt = clamp((now - last) / 1000, 0, 0.05); last = now;
  const input = readInput();
  if (input.camera) cam.mode = cam.mode === 'chase' ? 'cockpit' : 'chase';
  if (input.restart && !shot) reset();
  if (plane.landed && input.throttleUp && input.pitchUp) { plane.landed = false; plane.y += 4; plane.speed = Math.max(plane.speed, 24); }
  if (!shot) { stepPlane(plane, input, dt); stepMission(mission, plane); }
  placeCamera(dt);
  render(ctx, canvas.width, canvas.height, cam, plane, mission, targetOf(mission));
  updateHud(plane, mission, cam.mode);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
