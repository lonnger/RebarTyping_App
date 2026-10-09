/* eslint-env node */

const path = require('path');

const sharp = require('C:/Users/1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const ARTIFACTS = path.resolve(__dirname, '../artifacts');
const INPUT = path.join(ARTIFACTS, 'rebar_forward_v5.gif');
const OUTPUT_PREFIX = path.join(ARTIFACTS, 'rebar_v5_frame_atlas_');
const FRAME_WIDTH = 720;
const FRAME_COUNT = 90;
const FRAMES_PER_ATLAS = 30;
const COLUMNS = 5;
const ROWS = 6;
const ATLAS_COUNT = Math.ceil(FRAME_COUNT / FRAMES_PER_ATLAS);

async function main() {
  const decoded = await sharp(INPUT, { animated: true, limitInputPixels: false })
    .resize({ width: FRAME_WIDTH })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sourceFrameCount = decoded.info.pages ?? 1;
  const frameHeight = decoded.info.pageHeight ?? decoded.info.height;
  const channels = decoded.info.channels;
  const atlasWidth = FRAME_WIDTH * COLUMNS;
  const atlasHeight = frameHeight * ROWS;
  const sourceStride = FRAME_WIDTH * channels;
  const atlasStride = atlasWidth * channels;

  for (let atlasIndex = 0; atlasIndex < ATLAS_COUNT; atlasIndex += 1) {
    const atlas = Buffer.alloc(atlasWidth * atlasHeight * channels);

    for (let localFrame = 0; localFrame < FRAMES_PER_ATLAS; localFrame += 1) {
      const frame = atlasIndex * FRAMES_PER_ATLAS + localFrame;
      if (frame >= FRAME_COUNT) {
        break;
      }

      const sourceFrame = Math.floor((frame * sourceFrameCount) / FRAME_COUNT);
      const column = localFrame % COLUMNS;
      const row = Math.floor(localFrame / COLUMNS);
      const sourceFrameOffset = sourceFrame * frameHeight * sourceStride;

      for (let y = 0; y < frameHeight; y += 1) {
        const sourceStart = sourceFrameOffset + y * sourceStride;
        const destinationStart =
          (row * frameHeight + y) * atlasStride + column * FRAME_WIDTH * channels;
        decoded.data.copy(atlas, destinationStart, sourceStart, sourceStart + sourceStride);
      }
    }

    const output = `${OUTPUT_PREFIX}${atlasIndex}.webp`;
    await sharp(atlas, {
      raw: {
        width: atlasWidth,
        height: atlasHeight,
        channels,
      },
      limitInputPixels: false,
    })
      .webp({ quality: 96, effort: 4 })
      .toFile(output);

    console.log(`Created ${output} (${atlasWidth}x${atlasHeight}, ${FRAMES_PER_ATLAS} frames)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
