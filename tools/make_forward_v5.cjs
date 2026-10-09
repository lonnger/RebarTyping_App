const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const OUT = path.resolve(__dirname, '../artifacts');
const FLOOR = path.join(OUT, 'rebar_floor_texture_v3.png');
const MACHINE = path.join(OUT, 'machine_cutout_clean_v2.png');
const W = 1280;
const H = 720;
const FPS = 30;
const GIF_FRAME_DELAY_MS = 20;
const FRAMES = 150;
const FLOOR_START = 298;
const VANISH_Y = 186.7;
const DEPTH_STEP = 0.000316;
const DEPTH_ORIGIN = 0.001919;
const MACHINE_OFFSET_X = 14;
const DIRECTION = process.argv[2] === 'backward' ? -1 : 1;
const DIRECTION_NAME = DIRECTION < 0 ? 'backward' : 'forward';

function smoothstep(value) {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
}

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function warpFloor(base, progress) {
  const output = Buffer.allocUnsafe(base.length);
  const stride = W * 3;
  base.copy(output, 0, 0, FLOOR_START * stride);
  const phase = DEPTH_STEP * progress * DIRECTION;
  const center = W / 2;

  for (let y = FLOOR_START; y < H; y++) {
    const distance = y - VANISH_Y;
    const depth = 1 / distance;
    const cellStart = DEPTH_ORIGIN + Math.floor((depth - DEPTH_ORIGIN) / DEPTH_STEP) * DEPTH_STEP;
    const cellOffset = depth - cellStart;
    let sourceDepth = cellStart + modulo(cellOffset + phase, DEPTH_STEP);
    const minimumDepth = 1 / (H - 1 - VANISH_Y);
    if (sourceDepth < minimumDepth) sourceDepth += DEPTH_STEP;
    const sourceDistance = 1 / sourceDepth;
    const sourceY = Math.max(0, Math.min(H - 1.001, VANISH_Y + sourceDistance));
    const y0 = Math.floor(sourceY);
    const fy = sourceY - y0;
    const ratio = sourceDistance / distance;
    const startX = center * (1 - ratio);
    const blend = smoothstep((y - FLOOR_START) / 42);
    const outRow = y * stride;
    const srcRow0 = y0 * stride;
    const srcRow1 = (y0 + 1) * stride;

    let sourceX = startX;
    for (let x = 0; x < W; x++, sourceX += ratio) {
      const clampedSourceX = Math.max(0, Math.min(W - 1.001, sourceX));
      const x0 = Math.floor(clampedSourceX);
      const fx = clampedSourceX - x0;
      const invX = 1 - fx;
      const invY = 1 - fy;
      const outIndex = outRow + x * 3;
      const top = srcRow0 + x0 * 3;
      const bottom = srcRow1 + x0 * 3;

      for (let channel = 0; channel < 3; channel++) {
        const upper = base[top + channel] * invX + base[top + channel + 3] * fx;
        const lower = base[bottom + channel] * invX + base[bottom + channel + 3] * fx;
        const warped = upper * invY + lower * fy;
        output[outIndex + channel] = base[outIndex + channel] * (1 - blend) + warped * blend;
      }
    }
  }
  return output;
}

function glowSvg(alpha) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="100">
      <defs><filter id="g"><feGaussianBlur stdDeviation="8"/></filter></defs>
      <ellipse cx="75" cy="50" rx="30" ry="19" fill="#2dff43" opacity="${alpha}" filter="url(#g)"/>
    </svg>
  `);
}

function shadowSvg() {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="90">
      <defs><filter id="s"><feGaussianBlur stdDeviation="12"/></filter></defs>
      <ellipse cx="360" cy="44" rx="305" ry="25" fill="#11181c" opacity=".28" filter="url(#s)"/>
    </svg>
  `);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const floor = await sharp(FLOOR)
    .resize(W, H, { fit: 'cover' })
    .modulate({ saturation: 0.94, brightness: 1.015 })
    .raw()
    .toBuffer();

  const machine = await sharp(MACHINE)
    .trim({ threshold: 20 })
    .resize({ width: 800 })
    .png()
    .toBuffer({ resolveWithObject: true });

  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const progress = i / FRAMES;
    const warpedFloor = warpFloor(floor, progress);
    const bob = Math.round(2.0 * Math.sin(progress * Math.PI * 20));
    const sway = Math.round(1.0 * Math.sin(progress * Math.PI * 6));
    const left = Math.round((W - machine.info.width) / 2 + MACHINE_OFFSET_X + sway);
    const top = 618 - machine.info.height + bob;
    const glow = 0.12 + 0.22 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 10));

    const frame = await sharp(warpedFloor, { raw: { width: W, height: H, channels: 3 } })
      .composite([
        { input: shadowSvg(), left: 280 + MACHINE_OFFSET_X, top: 570 },
        { input: machine.data, left, top },
        { input: glowSvg(glow), left: W / 2 - 75 + MACHINE_OFFSET_X + sway, top: top + 15 },
      ])
      .removeAlpha()
      .raw()
      .toBuffer();
    frames.push(frame);

    if (i === 30) {
      await sharp(frame, { raw: { width: W, height: H, channels: 3 } })
        .png()
        .toFile(path.join(OUT, `rebar_${DIRECTION_NAME}_v5_preview.png`));
    }
    if (i % 30 === 0) console.log(`Rendered ${i}/${FRAMES}`);
  }

  const raw = Buffer.concat(frames);
  const input = {
    raw: { width: W, height: H * FRAMES, channels: 3, pageHeight: H },
    limitInputPixels: false,
  };
  const delays = Array(FRAMES).fill(Math.round(1000 / FPS));
  const webpPath = path.join(OUT, `rebar_${DIRECTION_NAME}_v5.webp`);

  await sharp(raw, input).webp({ quality: 90, effort: 4, loop: 0, delay: delays }).toFile(webpPath);

  await sharp(webpPath, { animated: true, limitInputPixels: false })
    .resize({ width: 720 })
    .gif({
      effort: 3,
      loop: 0,
      delay: Array(FRAMES).fill(GIF_FRAME_DELAY_MS),
      colours: 192,
      dither: 0.55,
    })
    .toFile(path.join(OUT, `rebar_${DIRECTION_NAME}_v5.gif`));

  console.log('Done:', webpPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
