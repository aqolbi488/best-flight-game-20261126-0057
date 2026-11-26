// Flight model: throttle, pitch, banked turns, lift, stall, fuel and hull damage.
import { PLANE } from './config.js';
import { clamp, wrapAngle } from './random.js';
import { terrainHeight, runwayY, onRunway } from './world.js';

export function makePlane() {
  return {
    x: PLANE.start.x, y: PLANE.start.y, z: PLANE.start.z,
    heading: PLANE.start.heading, pitch: 0, roll: 0,
    speed: PLANE.cruiseSpeed, throttle: 0.65, vy: 0,
    fuel: 100, hull: 100, stalled: false, crashed: false, landed: false,
    dust: 0, bounce: 0,
  };
}
export function stepPlane(p, input, dt) {
  if (p.crashed || p.landed) { p.dust = Math.max(0, p.dust - dt); return; }
  // Throttle.
  if (input.throttleUp) p.throttle = clamp(p.throttle + dt * 0.7, 0, PLANE.maxThrottle);
  if (input.throttleDown) p.throttle = clamp(p.throttle - dt * 0.7, 0, PLANE.maxThrottle);
  if (p.fuel <= 0) p.throttle = 0;
  p.fuel = clamp(p.fuel - PLANE.fuelBurn * p.throttle * dt, 0, 100);
  // Pitch / roll inputs (smooth).
  const pitchT = (input.pitchUp ? 0.42 : 0) + (input.pitchDown ? -0.42 : 0);
  const rollT = (input.rollLeft ? -0.85 : 0) + (input.rollRight ? 0.85 : 0);
  p.pitch += (pitchT - p.pitch) * clamp(dt * 3.2, 0, 1);
  p.roll += (rollT - p.roll) * clamp(dt * 3.0, 0, 1);
  // Speed: thrust vs drag vs gravity along pitch.
  const thrust = p.throttle * 26;
  const drag = 0.006 * p.speed * p.speed + 1.2;
  const grav = Math.sin(p.pitch) * 14;
  p.speed = clamp(p.speed + (thrust - drag - grav) * dt, 0, PLANE.maxSpeed);
  // Stall: below stall speed lift collapses and the nose drops.
  p.stalled = p.speed < PLANE.stallSpeed;
  const lift = p.stalled ? 0.25 : clamp((p.speed - PLANE.stallSpeed) / 26, 0, 1);
  // Turn: bank turns the aircraft; wide at speed, sluggish when slow.
  const turnAuthority = clamp(p.speed / PLANE.cruiseSpeed, 0.25, 1.6);
  p.heading = wrapAngle(p.heading + Math.sin(p.roll) * PLANE.turnRate * turnAuthority * dt);
  // Vertical: pitch climbs only with lift; stall sinks.
  p.vy = Math.sin(p.pitch) * p.speed * 0.55 * lift - (p.stalled ? 9 : 0) - (1 - lift) * 3;
  const fwd = Math.cos(p.pitch) * p.speed;
  p.x += Math.sin(p.heading) * fwd * dt;
  p.z += -Math.cos(p.heading) * fwd * dt;
  p.y += p.vy * dt;
  p.y = clamp(p.y, 2, 900);
  p.bounce = Math.max(0, p.bounce - dt * 3);
  // Ground contact.
  const ground = Math.max(terrainHeight(p.x, p.z), onRunway(p.x, p.z) ? runwayY() : -99);
  const floorY = ground + 2.2;
  if (p.y <= floorY) {
    const hard = -p.vy;
    if (onRunway(p.x, p.z) && p.speed < 34 && hard < 7 && Math.abs(p.roll) < 0.4) {
      p.y = floorY; p.landed = true; p.dust = 1; // clean touchdown
    } else if (hard > 10 || p.speed > 55) {
      p.hull = clamp(p.hull - (hard * 3 + p.speed * 0.4), 0, 100);
      p.y = floorY; p.crashed = p.hull <= 0 || hard > 16; p.dust = 1; p.bounce = 1;
      if (!p.crashed) { p.vy = 3; p.y = floorY + 1.5; p.speed *= 0.6; } // bounce off
    } else {
      p.hull = clamp(p.hull - 6, 0, 100);
      p.y = floorY + 1.2; p.bounce = 0.7; p.dust = 0.7; p.speed *= 0.75;
      if (p.hull <= 0) p.crashed = true;
    }
  }
}
export function headingDeg(p) { return ((Math.round((p.heading * 180 / Math.PI + 360) % 360)) % 360); }
export function speedKt(p) { return Math.round(p.speed * 1.94); }
