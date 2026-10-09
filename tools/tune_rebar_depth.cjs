const sharp = require('C:/Users/1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const path = require('path');

const source = path.resolve(__dirname, '../artifacts/rebar_floor_texture_v3.png');
const W = 640;
const H = 360;
const vanish = 186.7 / 2;
const floorStart = 298 / 2;

async function main() {
  const base = await sharp(source).resize(W, H, { fit: 'cover' }).greyscale().raw().toBuffer();
  const results = [];
  for (let fullStep = 0.00020; fullStep <= 0.00046; fullStep += 0.000002) {
    const step = fullStep * 2;
    let error = 0;
    let count = 0;
    for (let y = floorStart + 10; y < H; y += 2) {
      const distance = y - vanish;
      const sourceDistance = 1 / (1 / distance + step);
      const sourceY = Math.max(0, Math.min(H - 1, Math.round(vanish + sourceDistance)));
      const ratio = sourceDistance / distance;
      const startX = W / 2 * (1 - ratio);
      for (let x = 0; x < W; x += 2) {
        const sourceX = Math.max(0, Math.min(W - 1, Math.round(startX + x * ratio)));
        error += Math.abs(base[y * W + x] - base[sourceY * W + sourceX]);
        count++;
      }
    }
    results.push({ step: fullStep, error: error / count });
  }
  const local = results.filter((item, index) => index > 0 && index < results.length - 1 && item.error < results[index - 1].error && item.error < results[index + 1].error);
  console.log('Local minima:', local.sort((a, b) => a.error - b.error).slice(0, 12));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
