const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const OUT = path.resolve(__dirname, '../artifacts');
const SOURCE = path.join(OUT, 'machine_cutout_clean_v2.png');
const W = 1280;
const H = 720;
const FPS = 24;
const FRAMES = 120;
const HORIZON = 286;

const n = value => Number(value).toFixed(2);
const project = (x, z) => [W / 2 + x * 330 / z, HORIZON + 610 / z];

function sceneSvg(progress) {
  const ribSpacing = 0.62;
  const ribPhase = ribSpacing * progress;
  const crossSpacing = 0.54;
  const crossPhase = crossSpacing * progress;
  const parts = [`
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#f8fafb"/>
          <stop offset="1" stop-color="#e2e8ec"/>
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#dbe1e5"/>
          <stop offset=".22" stop-color="#c8d0d5"/>
          <stop offset="1" stop-color="#8e9aa1"/>
        </linearGradient>
        <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#171b1e"/>
          <stop offset=".27" stop-color="#768087"/>
          <stop offset=".45" stop-color="#e1e6e8"/>
          <stop offset=".58" stop-color="#606a70"/>
          <stop offset="1" stop-color="#15191c"/>
        </linearGradient>
        <linearGradient id="steelCross" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#22272a"/>
          <stop offset=".32" stop-color="#d9dee0"/>
          <stop offset=".48" stop-color="#788187"/>
          <stop offset="1" stop-color="#171b1e"/>
        </linearGradient>
        <radialGradient id="vignette">
          <stop offset=".48" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="1" stop-color="#53616a" stop-opacity=".18"/>
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="10"/></filter>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#floor)"/>
      <path d="M0 ${HORIZON}H${W}" stroke="#aeb8be" stroke-width="2"/>
  `];

  // Longitudinal rebars converge at the center of the horizon.
  for (let x = -8.8; x <= 8.81; x += 0.55) {
    const farL = project(x - 0.055, 20);
    const farR = project(x + 0.055, 20);
    const nearR = project(x + 0.055, 1.42);
    const nearL = project(x - 0.055, 1.42);
    parts.push(`<path d="M${n(farL[0])} ${n(farL[1])}L${n(farR[0])} ${n(farR[1])}L${n(nearR[0])} ${n(nearR[1])}L${n(nearL[0])} ${n(nearL[1])}Z" fill="url(#steel)" stroke="#0d1113" stroke-opacity=".65"/>`);

    // Moving ribs make the travel direction readable even on the long bars.
    for (let k = 0; k < 39; k++) {
      const z = 1.42 + k * ribSpacing - ribPhase;
      if (z < 1.44 || z > 20) continue;
      const a = project(x - 0.072, z);
      const b = project(x + 0.072, z);
      const sw = Math.max(0.4, 2.8 / z);
      parts.push(`<path d="M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}" stroke="#eef1f2" stroke-width="${n(sw)}"/>`);
      parts.push(`<path d="M${n(a[0])} ${n(a[1] + sw)}L${n(b[0])} ${n(b[1] + sw)}" stroke="#15191b" stroke-width="${n(sw * .8)}"/>`);
    }
  }

  // Crossbars advance toward the camera and grow with perspective.
  for (let k = 0; k < 40; k++) {
    const z = 1.40 + k * crossSpacing - crossPhase;
    if (z < 1.44 || z > 20) continue;
    const y = project(0, z)[1];
    const thickness = Math.max(1.4, 24 / z);
    parts.push(`<rect x="-20" y="${n(y)}" width="${W + 40}" height="${n(thickness)}" rx="${n(thickness / 2)}" fill="url(#steelCross)" stroke="#111518" stroke-width="${n(Math.max(.5, 1.5 / z))}"/>`);
    // A few rib highlights across each horizontal rebar.
    const step = Math.max(10, 70 / z);
    for (let x = -20; x < W + 20; x += step) {
      parts.push(`<path d="M${n(x)} ${n(y + 1)}l${n(thickness * .28)} ${n(thickness - 2)}" stroke="#e1e5e7" stroke-opacity=".58" stroke-width="${n(Math.max(.35, 1.4 / z))}"/>`);
    }
  }

  parts.push(`
      <ellipse cx="640" cy="611" rx="318" ry="31" fill="#263139" opacity=".27" filter="url(#blur)"/>
      <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    </svg>
  `);
  return Buffer.from(parts.join(''));
}

function lampGlowSvg(alpha) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="100">
      <defs><filter id="g"><feGaussianBlur stdDeviation="8"/></filter></defs>
      <ellipse cx="75" cy="50" rx="30" ry="19" fill="#2dff43" opacity="${alpha}" filter="url(#g)"/>
    </svg>
  `);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const machine = await sharp(SOURCE)
    .trim({ threshold: 20 })
    .resize({ width: 800 })
    .png()
    .toBuffer({ resolveWithObject: true });

  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const progress = i / FRAMES;
    const bob = Math.round(2.2 * Math.sin(progress * Math.PI * 20));
    const sway = Math.round(1.1 * Math.sin(progress * Math.PI * 6));
    const left = Math.round((W - machine.info.width) / 2 + sway);
    const top = 618 - machine.info.height + bob;
    const glow = 0.12 + 0.22 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 10));

    const frame = await sharp(sceneSvg(progress))
      .composite([
        { input: machine.data, left, top },
        { input: lampGlowSvg(glow), left: W / 2 - 75 + sway, top: top + 15 }
      ])
      .removeAlpha()
      .raw()
      .toBuffer();
    frames.push(frame);

    if (i === 24) {
      await sharp(frame, { raw: { width: W, height: H, channels: 3 } })
        .png()
        .toFile(path.join(OUT, 'rebar_forward_v2_preview.png'));
    }
    if (i % 24 === 0) console.log(`Rendered ${i}/${FRAMES}`);
  }

  const raw = Buffer.concat(frames);
  const input = { raw: { width: W, height: H * FRAMES, channels: 3, pageHeight: H }, limitInputPixels: false };
  const delays = Array(FRAMES).fill(Math.round(1000 / FPS));

  await sharp(raw, input)
    .webp({ quality: 88, effort: 4, loop: 0, delay: delays })
    .toFile(path.join(OUT, 'rebar_forward_v2.webp'));

  await sharp(raw, input)
    .gif({ effort: 3, loop: 0, delay: delays, colours: 192, dither: 0.55 })
    .toFile(path.join(OUT, 'rebar_forward_v2.gif'));

  console.log('Done:', path.join(OUT, 'rebar_forward_v2.webp'));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
