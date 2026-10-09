/* eslint-env node */

const path = require('path');

const sharp = require('C:/Users/1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');

const ARTIFACTS = path.resolve(__dirname, '../artifacts');
const BACKGROUND = path.join(ARTIFACTS, 'topdown_rebar_background_v1.png');
const FOREGROUND = path.join(ARTIFACTS, 'topdown_machine_foreground_v1.png');
const OUTPUT_PREFIX = path.join(ARTIFACTS, 'topdown_rebar_frame_atlas_');
const IDLE_OUTPUT = path.join(ARTIFACTS, 'topdown_rebar_idle.png');

const SOURCE_WIDTH = 992;
const SOURCE_HEIGHT = 1585;
const SOURCE_VIEWPORT_TOP = Math.floor((SOURCE_HEIGHT - SOURCE_WIDTH) / 2);
const SOURCE_TILE_TOP = 314;
const SOURCE_TILE_HEIGHT = 145;
const FRAME_SIZE = 640;
const FRAME_COUNT = 60;
const FRAMES_PER_ATLAS = 30;
const COLUMNS = 5;
const ROWS = 6;
const ATLAS_COUNT = Math.ceil(FRAME_COUNT / FRAMES_PER_ATLAS);
const TILE_HEIGHT = Math.round((SOURCE_TILE_HEIGHT / SOURCE_WIDTH) * FRAME_SIZE);
const INITIAL_TILE_PHASE = Math.round(
  (((SOURCE_VIEWPORT_TOP - SOURCE_TILE_TOP) % SOURCE_TILE_HEIGHT) / SOURCE_TILE_HEIGHT) *
    TILE_HEIGHT
);

const copyFrameIntoAtlas = (frame, atlas, atlasIndex, localFrame) => {
  const channels = 3;
  const atlasWidth = FRAME_SIZE * COLUMNS;
  const atlasStride = atlasWidth * channels;
  const sourceStride = FRAME_SIZE * channels;
  const column = localFrame % COLUMNS;
  const row = Math.floor(localFrame / COLUMNS);

  for (let y = 0; y < FRAME_SIZE; y += 1) {
    const sourceStart = y * sourceStride;
    const destinationStart = (row * FRAME_SIZE + y) * atlasStride + column * FRAME_SIZE * channels;
    frame.copy(atlas, destinationStart, sourceStart, sourceStart + sourceStride);
  }
};

async function main() {
  const tile = await sharp(BACKGROUND)
    .extract({
      left: 0,
      top: SOURCE_TILE_TOP,
      width: SOURCE_WIDTH,
      height: SOURCE_TILE_HEIGHT,
    })
    .resize(FRAME_SIZE, TILE_HEIGHT, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const normalizedForeground = await sharp(FOREGROUND)
    .resize(SOURCE_WIDTH, SOURCE_HEIGHT, { fit: 'fill' })
    .png()
    .toBuffer();

  const foreground = await sharp(normalizedForeground)
    .extract({
      left: 0,
      top: SOURCE_VIEWPORT_TOP,
      width: SOURCE_WIDTH,
      height: SOURCE_WIDTH,
    })
    .resize(FRAME_SIZE, FRAME_SIZE, { fit: 'fill' })
    .png()
    .toBuffer();

  const tileStride = FRAME_SIZE * tile.info.channels;
  const frameStride = FRAME_SIZE * 3;
  const frames = [];

  for (let frameIndex = 0; frameIndex < FRAME_COUNT; frameIndex += 1) {
    const frameBackground = Buffer.alloc(FRAME_SIZE * FRAME_SIZE * 3);
    const motionOffset = Math.floor((frameIndex * TILE_HEIGHT) / FRAME_COUNT);
    const phase = INITIAL_TILE_PHASE - motionOffset;

    for (let y = 0; y < FRAME_SIZE; y += 1) {
      const tileY = (((y + phase) % TILE_HEIGHT) + TILE_HEIGHT) % TILE_HEIGHT;
      const sourceStart = tileY * tileStride;
      const destinationStart = y * frameStride;
      tile.data.copy(frameBackground, destinationStart, sourceStart, sourceStart + frameStride);
    }

    const composed = await sharp(frameBackground, {
      raw: { width: FRAME_SIZE, height: FRAME_SIZE, channels: 3 },
    })
      .composite([{ input: foreground, left: 0, top: 0 }])
      .removeAlpha()
      .raw()
      .toBuffer();

    frames.push(composed);
  }

  await sharp(frames[0], {
    raw: { width: FRAME_SIZE, height: FRAME_SIZE, channels: 3 },
  })
    .png({ compressionLevel: 9 })
    .toFile(IDLE_OUTPUT);

  for (let atlasIndex = 0; atlasIndex < ATLAS_COUNT; atlasIndex += 1) {
    const atlasWidth = FRAME_SIZE * COLUMNS;
    const atlasHeight = FRAME_SIZE * ROWS;
    const atlas = Buffer.alloc(atlasWidth * atlasHeight * 3);

    for (let localFrame = 0; localFrame < FRAMES_PER_ATLAS; localFrame += 1) {
      const frameIndex = atlasIndex * FRAMES_PER_ATLAS + localFrame;
      if (frameIndex >= FRAME_COUNT) break;
      copyFrameIntoAtlas(frames[frameIndex], atlas, atlasIndex, localFrame);
    }

    const output = `${OUTPUT_PREFIX}${atlasIndex}.webp`;
    await sharp(atlas, {
      raw: { width: atlasWidth, height: atlasHeight, channels: 3 },
      limitInputPixels: false,
    })
      .webp({ quality: 96, effort: 4 })
      .toFile(output);

    console.log(`Created ${output} (${atlasWidth}x${atlasHeight})`);
  }

  console.log(`Created ${IDLE_OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
