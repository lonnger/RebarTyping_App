const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const OUT = path.resolve(__dirname, '../artifacts');
const MACHINE = path.join(OUT, 'machine_cutout_clean_v2.png');
const FLOOR = path.join(OUT, 'rebar_floor_texture_v3.png');
const W = 1280;
const H = 720;
const FPS = 30;
const FRAMES = 150;
const HORIZON = 300;
const MACHINE_OFFSET_X = 14;
const TRAVEL_SCALE = 0.16;

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
      <ellipse cx="360" cy="44" rx="305" ry="25" fill="#11181c" opacity=".30" filter="url(#s)"/>
    </svg>
  `);
}

async function zoomFromHorizon(base, scale) {
  const scaledW = Math.ceil(W * scale);
  const scaledH = Math.ceil(H * scale);
  const left = Math.max(0, Math.round((scaledW - W) / 2));
  const top = Math.max(0, Math.min(scaledH - H, Math.round(HORIZON * scale - HORIZON)));
  return sharp(base)
    .resize({ width: scaledW, height: scaledH })
    .extract({ left, top, width: W, height: H })
    .ensureAlpha()
    .raw()
    .toBuffer();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const floorBase = await sharp(FLOOR)
    .resize(W, H, { fit: 'cover' })
    .modulate({ saturation: 0.90, brightness: 1.02 })
    .sharpen({ sigma: 0.6 })
    .png()
    .toBuffer();

  const machine = await sharp(MACHINE)
    .trim({ threshold: 20 })
    .resize({ width: 800 })
    .png()
    .toBuffer({ resolveWithObject: true });

  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const progress = i / FRAMES;
    // Two half-cycle-offset zoom layers trade places while their reset is invisible.
    // This keeps the floor moving forward continuously and makes the loop seamless.
    const phaseA = progress;
    const phaseB = (progress + 0.5) % 1;
    const floorA = await zoomFromHorizon(floorBase, 1 + TRAVEL_SCALE * phaseA);
    const floorB = await zoomFromHorizon(floorBase, 1 + TRAVEL_SCALE * phaseB);
    const opacityA = Math.sin(Math.PI * progress) ** 2;
    const floorAWithAlpha = await sharp(floorA, { raw: { width: W, height: H, channels: 4 } })
      .removeAlpha()
      .ensureAlpha(opacityA)
      .raw()
      .toBuffer();
    const floor = await sharp(floorB, { raw: { width: W, height: H, channels: 4 } })
      .composite([{ input: floorAWithAlpha, raw: { width: W, height: H, channels: 4 }, blend: 'over' }])
      .raw()
      .toBuffer();

    const bob = Math.round(2.2 * Math.sin(progress * Math.PI * 20));
    const sway = Math.round(1.1 * Math.sin(progress * Math.PI * 6));
    const left = Math.round((W - machine.info.width) / 2 + MACHINE_OFFSET_X + sway);
    const top = 618 - machine.info.height + bob;
    const glow = 0.12 + 0.22 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 10));

    const frame = await sharp(floor, { raw: { width: W, height: H, channels: 4 } })
      .composite([
        { input: shadowSvg(), left: 280 + MACHINE_OFFSET_X, top: 570 },
        { input: machine.data, left, top },
        { input: glowSvg(glow), left: W / 2 - 75 + MACHINE_OFFSET_X + sway, top: top + 15 }
      ])
      .removeAlpha()
      .raw()
      .toBuffer();

    frames.push(frame);
    if (i === 24) {
      await sharp(frame, { raw: { width: W, height: H, channels: 3 } })
        .png()
        .toFile(path.join(OUT, 'rebar_forward_v3_preview.png'));
    }
    if (i % 24 === 0) console.log(`Rendered ${i}/${FRAMES}`);
  }

  const raw = Buffer.concat(frames);
  const input = { raw: { width: W, height: H * FRAMES, channels: 3, pageHeight: H }, limitInputPixels: false };
  const delays = Array(FRAMES).fill(Math.round(1000 / FPS));

  await sharp(raw, input)
    .webp({ quality: 90, effort: 4, loop: 0, delay: delays })
    .toFile(path.join(OUT, 'rebar_forward_v3.webp'));

  await sharp(path.join(OUT, 'rebar_forward_v3.webp'), { animated: true, limitInputPixels: false })
    .resize({ width: 720 })
    .gif({ effort: 3, loop: 0, colours: 192, dither: 0.55 })
    .toFile(path.join(OUT, 'rebar_forward_v3.gif'));

  console.log('Done:', path.join(OUT, 'rebar_forward_v3.webp'));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
