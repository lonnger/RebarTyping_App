const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const OUT = path.resolve(__dirname, '../artifacts');
const MACHINE = path.join(OUT, 'machine_cutout_clean_v2.png');
const W = 1280;
const H = 720;
const FPS = 30;
const FRAMES = 150;
const HORIZON = 300;
const MACHINE_OFFSET_X = 14;
const DIRECTION = process.argv[2] === 'backward' ? -1 : 1;
const DIRECTION_NAME = DIRECTION < 0 ? 'backward' : 'forward';

const n = value => Number(value).toFixed(2);
const project = (x, z) => [W / 2 + x * 340 / z, HORIZON + 620 / z];

function polygon(points) {
  return points.map(p => `${n(p[0])},${n(p[1])}`).join(' ');
}

function rebarScene(progress) {
  const crossSpacing = 0.50;
  const ribSpacing = 0.115;
  const crossPhase = crossSpacing * progress * DIRECTION;
  const ribPhase = ribSpacing * progress * DIRECTION;
  const parts = [`
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#f4f6f7"/>
          <stop offset=".68" stop-color="#d9dfe2"/>
          <stop offset="1" stop-color="#cbd2d6"/>
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#cfd6da"/>
          <stop offset=".45" stop-color="#b7c0c5"/>
          <stop offset="1" stop-color="#929da3"/>
        </linearGradient>
        <linearGradient id="crossSteel" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#15191c"/>
          <stop offset=".17" stop-color="#474e52"/>
          <stop offset=".34" stop-color="#c5cbce"/>
          <stop offset=".48" stop-color="#737c81"/>
          <stop offset=".68" stop-color="#33383c"/>
          <stop offset="1" stop-color="#0d1012"/>
        </linearGradient>
        <linearGradient id="rodSteel" x1="0" y1="0" x2="1" y2="0">
          <stop stop-color="#0d1012"/>
          <stop offset=".16" stop-color="#3b4247"/>
          <stop offset=".36" stop-color="#969fa4"/>
          <stop offset=".48" stop-color="#d4d9db"/>
          <stop offset=".60" stop-color="#737c81"/>
          <stop offset=".82" stop-color="#343a3e"/>
          <stop offset="1" stop-color="#0b0e10"/>
        </linearGradient>
        <filter id="shadow"><feGaussianBlur stdDeviation="9"/></filter>
        <radialGradient id="vignette">
          <stop offset=".52" stop-color="#fff" stop-opacity="0"/>
          <stop offset="1" stop-color="#344149" stop-opacity=".16"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#sky)"/>
      <rect y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#floor)"/>
      <path d="M0 ${HORIZON}H${W}" stroke="#b2bbc0" stroke-width="2"/>
  `];

  // Transverse rebars. Their depth phase advances by exactly one spacing per loop.
  for (let k = 0; k < 43; k++) {
    const z = 1.40 + k * crossSpacing - crossPhase;
    if (z <= 1.42 || z > 20.5) continue;
    const y = project(0, z)[1];
    const thickness = Math.max(2.0, 35 / z);
    const radius = thickness / 2;
    parts.push(`<rect x="-24" y="${n(y + thickness * .34)}" width="${W + 48}" height="${n(thickness)}" rx="${n(radius)}" fill="#080b0d" opacity=".38"/>`);
    parts.push(`<rect x="-24" y="${n(y)}" width="${W + 48}" height="${n(thickness)}" rx="${n(radius)}" fill="url(#crossSteel)" stroke="#0b0e10" stroke-width="${n(Math.max(.45, 1.7 / z))}"/>`);

    const pitch = Math.max(4.2, 16 / z);
    let dark = '';
    let light = '';
    for (let x = -30; x < W + 30; x += pitch) {
      const slant = Math.max(1.0, thickness * .24);
      dark += `M${n(x + slant + 1)} ${n(y + 1)}L${n(x + 1)} ${n(y + thickness - 1)}`;
      light += `M${n(x + slant)} ${n(y + 1)}L${n(x)} ${n(y + thickness - 1)}`;
    }
    parts.push(`<path d="${dark}" stroke="#07090a" stroke-width="${n(Math.max(.75, thickness * .16))}" opacity=".92"/>`);
    parts.push(`<path d="${light}" stroke="#bdc4c7" stroke-width="${n(Math.max(.40, thickness * .065))}" opacity=".72"/>`);
  }

  // Longitudinal rebars sit above the transverse bars, as in the supplied reference.
  for (let x = -8.80; x <= 8.81; x += 0.55) {
    const farZ = 20.5;
    const nearZ = 1.42;
    const farL = project(x - .067, farZ);
    const farR = project(x + .067, farZ);
    const nearR = project(x + .067, nearZ);
    const nearL = project(x - .067, nearZ);
    const shadowPts = [farL, farR, [nearR[0] + 3, nearR[1] + 4], [nearL[0] + 3, nearL[1] + 4]];
    parts.push(`<polygon points="${polygon(shadowPts)}" fill="#050708" opacity=".55"/>`);
    parts.push(`<polygon points="${polygon([farL, farR, nearR, nearL])}" fill="url(#rodSteel)" stroke="#090c0e" stroke-width="1"/>`);

    const hiFarL = project(x - .014, farZ);
    const hiFarR = project(x + .014, farZ);
    const hiNearR = project(x + .014, nearZ);
    const hiNearL = project(x - .014, nearZ);
    parts.push(`<polygon points="${polygon([hiFarL, hiFarR, hiNearR, hiNearL])}" fill="#d4dadd" opacity=".28"/>`);

    let darkRibs = '';
    let lightRibs = '';
    for (let k = 0; k < 180; k++) {
      const z = 1.40 + k * ribSpacing - ribPhase;
      if (z <= 1.42 || z > farZ) continue;
      const left = project(x - .079, z + .012);
      const right = project(x + .079, z - .012);
      const offset = Math.max(.35, 2.0 / z);
      darkRibs += `M${n(left[0])} ${n(left[1] + offset)}L${n(right[0])} ${n(right[1] + offset)}`;
      lightRibs += `M${n(left[0])} ${n(left[1])}L${n(right[0])} ${n(right[1])}`;
    }
    parts.push(`<path d="${darkRibs}" stroke="#101315" stroke-width="1.65" opacity=".90"/>`);
    parts.push(`<path d="${lightRibs}" stroke="#bfc6c9" stroke-width=".76" opacity=".76"/>`);
  }

  parts.push(`
      <ellipse cx="${W / 2 + MACHINE_OFFSET_X}" cy="610" rx="322" ry="29" fill="#172027" opacity=".26" filter="url(#shadow)"/>
      <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    </svg>
  `);
  return Buffer.from(parts.join(''));
}

function glowSvg(alpha) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="150" height="100">
      <defs><filter id="g"><feGaussianBlur stdDeviation="8"/></filter></defs>
      <ellipse cx="75" cy="50" rx="30" ry="19" fill="#2dff43" opacity="${alpha}" filter="url(#g)"/>
    </svg>
  `);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const machine = await sharp(MACHINE)
    .trim({ threshold: 20 })
    .resize({ width: 800 })
    .png()
    .toBuffer({ resolveWithObject: true });

  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const progress = i / FRAMES;
    const bob = Math.round(2.0 * Math.sin(progress * Math.PI * 20));
    const sway = Math.round(1.0 * Math.sin(progress * Math.PI * 6));
    const left = Math.round((W - machine.info.width) / 2 + MACHINE_OFFSET_X + sway);
    const top = 618 - machine.info.height + bob;
    const glow = 0.12 + 0.22 * (0.5 + 0.5 * Math.sin(progress * Math.PI * 10));

    const frame = await sharp(rebarScene(progress))
      .composite([
        { input: machine.data, left, top },
        { input: glowSvg(glow), left: W / 2 - 75 + MACHINE_OFFSET_X + sway, top: top + 15 }
      ])
      .removeAlpha()
      .raw()
      .toBuffer();
    frames.push(frame);

    if (i === 30) {
      await sharp(frame, { raw: { width: W, height: H, channels: 3 } })
        .png()
        .toFile(path.join(OUT, `rebar_${DIRECTION_NAME}_v4_preview.png`));
    }
    if (i % 30 === 0) console.log(`Rendered ${i}/${FRAMES}`);
  }

  const raw = Buffer.concat(frames);
  const input = { raw: { width: W, height: H * FRAMES, channels: 3, pageHeight: H }, limitInputPixels: false };
  const delays = Array(FRAMES).fill(Math.round(1000 / FPS));
  const webpPath = path.join(OUT, `rebar_${DIRECTION_NAME}_v4.webp`);

  await sharp(raw, input)
    .webp({ quality: 90, effort: 4, loop: 0, delay: delays })
    .toFile(webpPath);

  await sharp(webpPath, { animated: true, limitInputPixels: false })
    .resize({ width: 720 })
    .gif({ effort: 3, loop: 0, colours: 192, dither: 0.55 })
    .toFile(path.join(OUT, `rebar_${DIRECTION_NAME}_v4.gif`));

  console.log('Done:', webpPath);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
