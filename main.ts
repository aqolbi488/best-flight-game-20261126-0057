// Kestrel Coast — entrypoint for the make.fun flight-game bounty (Node 22, stdlib only).
// The playable game is the static site in ./game (open game/index.html in a browser; no build
// step, no network). This program hands it in: it mirrors game/ and screenshots/ into the
// output directory (/output in the grader, MAKEFUN_OUTPUT_DIR elsewhere) and writes
// dossier.json via the vendored buildDossier helper. Output is byte-for-byte deterministic:
// no clocks, no randomness, files copied as-is.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Caps mirror the bounty's scorer gate: text budget for the dossier, at most 4 screenshots
// of at most 256 KiB each, and the game-tree file/byte/path limits.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
