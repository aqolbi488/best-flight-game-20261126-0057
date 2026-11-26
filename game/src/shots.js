// Deterministic screenshot scenes: ?shot=cover|cockpit|rings|landing&seed=1
// Each scene freezes the aircraft, camera, mission and HUD in a well-composed frame.
export function shotScene() {
  const q = new URLSearchParams(location.search);
  const name = q.get('shot');
  if (!name) return null;
  const scenes = {
    cover: { // chase view north over the runway toward ring 1, coast + fields in frame
      plane: { x: 60, y: 155, z: 1020, heading: 0.08, pitch: 0.04, roll: -0.12, speed: 48, throttle: 0.7, fuel: 88, hull: 100 },
      cam: 'chase', mission: { kind: 'rings', ringIndex: 0, ringsDone: 0, score: 0 },
    },
    cockpit: { // instrument view on short final, runway dead ahead
      plane: { x: 0, y: 62, z: 1420, heading: 0, pitch: -0.06, roll: 0.02, speed: 30, throttle: 0.35, fuel: 54, hull: 96 },
      cam: 'cockpit', mission: { kind: 'rings', ringIndex: 6, ringsDone: 6, score: 1500 },
    },
    rings: { // banking toward ring 2 over the patchwork fields
      plane: { x: -360, y: 172, z: 240, heading: -0.55, pitch: 0.03, roll: 0.55, speed: 52, throttle: 0.75, fuel: 76, hull: 100 },
      cam: 'chase', mission: { kind: 'rings', ringIndex: 1, ringsDone: 1, score: 250 },
    },
    landing: { // over the threshold at touchdown height, dust kicked up
      plane: { x: 0, y: 19, z: 1120, heading: 0, pitch: 0.02, roll: 0, speed: 26, throttle: 0.2, fuel: 41, hull: 92, dust: 0.8 },
      cam: 'chase', mission: { kind: 'rings', ringIndex: 6, ringsDone: 6, score: 1500 },
    },
  };
  return scenes[name] ? { name, ...scenes[name] } : null;
}
