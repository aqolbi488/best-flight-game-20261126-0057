// Keyboard input. Returns a fresh state object each frame; also tracks one-shot presses.
const held = new Set();
const pressed = new Set();
export function initInput() {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (!held.has(k)) pressed.add(k);
    held.add(k);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => held.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => held.clear());
}
export function readInput() {
  const has = (...ks) => ks.some((k) => held.has(k));
  const input = {
    throttleUp: has('w'), throttleDown: has('s'),
    pitchUp: has('arrowup'), pitchDown: has('arrowdown'),
    rollLeft: has('arrowleft', 'a'), rollRight: has('arrowright', 'd'),
    camera: pressed.has('c'), restart: pressed.has('r'),
  };
  pressed.clear();
  return input;
}
