// Shared constants for Kestrel Coast. World units are metres; heading 0 = north (-Z), 90 = east (+X).
export const WORLD = {
  size: 3600,          // island extent, centred on 0,0
  seaLevel: 0,
  seed: 20261126,
  runway: { x: 0, z: 900, length: 520, width: 44, heading: 0 }, // strip runs north-south
  town: { x: 620, z: -420 },
};
export const PLANE = {
  start: { x: 0, y: 140, z: 1250, heading: 0 }, // south of runway, flying north (heading 0 = -Z)
  stallSpeed: 18,
  cruiseSpeed: 46,
  maxSpeed: 92,
  maxThrottle: 1,
  turnRate: 0.85,      // rad/s at full bank, scaled by speed below
  pitchRate: 0.9,
  fuelBurn: 0.55,      // % per second at full throttle
};
export const COLORS = {
  skyTop: '#4aa8e8', skyBot: '#bfe9ff', sea: '#1f7fc4', seaDeep: '#1466a6',
  sand: '#e8d39a', grass: '#5fae5a', fieldA: '#8fc25e', fieldB: '#d9b45c',
  hill: '#4c8a52', rock: '#8a8f94', townWall: '#f2e6cf', townRoof: '#c85a3a',
  tree: '#2e7d46', runway: '#3a3f46', ring: '#ffd700', ringDone: '#5ef08a',
};
