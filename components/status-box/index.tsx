import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useWindowDimensions, View } from 'react-native';
import { Button } from 'react-native-paper';

import { ParamsSettingModal } from '../params-setting-modal';

import { HOME_LAYOUT } from '@/constants/home-layout';
import { scaleHomeValue, useHomeLayoutScale } from '@/hooks/useHomeLayoutScale';
import useStore from '@/store';

const movementFrameAtlases = [
  require('../../artifacts/rebar_v5_frame_atlas_0.webp'),
  require('../../artifacts/rebar_v5_frame_atlas_1.webp'),
  require('../../artifacts/rebar_v5_frame_atlas_2.webp'),
] as const;
const movementIdleImage = require('../../artifacts/rebar_v5_idle.png');
const topDownMovementFrameAtlases = [
  require('../../artifacts/topdown_rebar_frame_atlas_0.webp'),
  require('../../artifacts/topdown_rebar_frame_atlas_1.webp'),
] as const;
const topDownMovementIdleImage = require('../../artifacts/topdown_rebar_idle.png');
const MOVEMENT_FRAME_COUNT = 90;
const TOP_DOWN_MOVEMENT_FRAME_COUNT = 60;
const MOVEMENT_FRAMES_PER_ATLAS = 30;
const MOVEMENT_FRAME_COLUMNS = 5;
const MOVEMENT_FRAME_ROWS = 6;
const MOVEMENT_FRAME_DURATION_MS = 1000 / 60;
const MOVEMENT_TICK_COUNT = 180;

type MovementDirection = 'idle' | 'forward' | 'backward';

type MovementImageProps = {
  width: number;
  height: number;
  frameIndex: number;
  movementDirection: MovementDirection;
};

const useMovementTick = (movementDirection: MovementDirection) => {
  const [movementTick, setMovementTick] = useState(0);
  useEffect(() => {
    if (movementDirection === 'idle') {
      return;
    }

    const directionStep = movementDirection === 'forward' ? 1 : -1;
    let animationFrameId = 0;
    let previousTimestamp: number | null = null;
    let elapsedMs = 0;

    const advanceFrame = (timestamp: number) => {
      if (previousTimestamp !== null) {
        elapsedMs += Math.min(timestamp - previousTimestamp, MOVEMENT_FRAME_DURATION_MS * 3);
        const framesToAdvance = Math.floor(elapsedMs / MOVEMENT_FRAME_DURATION_MS);

        if (framesToAdvance > 0) {
          elapsedMs -= framesToAdvance * MOVEMENT_FRAME_DURATION_MS;
          setMovementTick((currentTick) => {
            const nextTick = (currentTick + directionStep * framesToAdvance) % MOVEMENT_TICK_COUNT;
            return nextTick < 0 ? nextTick + MOVEMENT_TICK_COUNT : nextTick;
          });
        }
      }

      previousTimestamp = timestamp;
      animationFrameId = requestAnimationFrame(advanceFrame);
    };

    animationFrameId = requestAnimationFrame(advanceFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [movementDirection]);

  return movementTick;
};

const MovementImage = ({ width, height, frameIndex, movementDirection }: MovementImageProps) => {
  const activeAtlasIndex = Math.floor(frameIndex / MOVEMENT_FRAMES_PER_ATLAS);
  const localFrameIndex = frameIndex % MOVEMENT_FRAMES_PER_ATLAS;
  const frameColumn = localFrameIndex % MOVEMENT_FRAME_COLUMNS;
  const frameRow = Math.floor(localFrameIndex / MOVEMENT_FRAME_COLUMNS);

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Image
        accessibilityLabel={
          movementDirection === 'forward'
            ? '机器人前进动画'
            : movementDirection === 'backward'
              ? '机器人后退动画'
              : '机器人静止画面'
        }
        contentFit="contain"
        style={{ width, height }}
        source={movementIdleImage}
      />
      {movementFrameAtlases.map((source, atlasIndex) => (
        <Image
          key={atlasIndex}
          accessible={false}
          cachePolicy="memory-disk"
          contentFit="fill"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: width * MOVEMENT_FRAME_COLUMNS,
            height: height * MOVEMENT_FRAME_ROWS,
            opacity: atlasIndex === activeAtlasIndex ? 1 : 0,
            transform: [{ translateX: -frameColumn * width }, { translateY: -frameRow * height }],
          }}
          source={source}
        />
      ))}
    </View>
  );
};

const TopDownMovementImage = ({
  width,
  height,
  frameIndex,
  movementDirection,
}: MovementImageProps) => {
  const activeAtlasIndex = Math.floor(frameIndex / MOVEMENT_FRAMES_PER_ATLAS);
  const localFrameIndex = frameIndex % MOVEMENT_FRAMES_PER_ATLAS;
  const frameColumn = localFrameIndex % MOVEMENT_FRAME_COLUMNS;
  const frameRow = Math.floor(localFrameIndex / MOVEMENT_FRAME_COLUMNS);

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Image
        accessibilityLabel={
          movementDirection === 'forward'
            ? '机器人俯视前进动画'
            : movementDirection === 'backward'
              ? '机器人俯视后退动画'
              : '机器人俯视静止画面'
        }
        contentFit="fill"
        style={{ width, height }}
        source={topDownMovementIdleImage}
      />
      {topDownMovementFrameAtlases.map((source, atlasIndex) => (
        <Image
          key={atlasIndex}
          accessible={false}
          cachePolicy="memory-disk"
          contentFit="fill"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: width * MOVEMENT_FRAME_COLUMNS,
            height: height * MOVEMENT_FRAME_ROWS,
            opacity: atlasIndex === activeAtlasIndex ? 1 : 0,
            transform: [{ translateX: -frameColumn * width }, { translateY: -frameRow * height }],
          }}
          source={source}
        />
      ))}
    </View>
  );
};

export const StatusBox = () => {
  const { width, height } = useWindowDimensions();
  const { scale } = useHomeLayoutScale();
  const { center } = HOME_LAYOUT;
  const scaled = (value: number) => scaleHomeValue(value, scale);
  const imageSize = useMemo(
    () =>
      Math.floor(
        Math.max(
          scaled(center.image.minSize),
          Math.min(
            width / center.image.widthDivisor,
            (height - scaled(center.image.reservedHeight)) / center.image.heightDivisor,
            scaled(center.image.maxSize)
          )
        )
      ),
    [center.image, height, scale, width]
  );
  const movementImageWidth = Math.round(imageSize * center.image.movementWidthMultiplier);
  const movementImageHeight = Math.round(movementImageWidth / center.image.movementAspectRatio);
  const movementDirection = useStore((state) => state.robotStatus.movementDirection);
  const movementTick = useMovementTick(movementDirection);
  const [visible, setVisible] = useState(false);

  const openSettingModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const { t } = useTranslation();
  return (
    <View className="h-full w-full flex-col items-center justify-center">
      <ParamsSettingModal visible={visible} onDismiss={hideModal} />

      <View style={{ alignItems: 'center' }}>
        <MovementImage
          width={movementImageWidth}
          height={movementImageHeight}
          frameIndex={movementTick % MOVEMENT_FRAME_COUNT}
          movementDirection={movementDirection}
        />
        <View style={{ height: scaled(center.image.betweenImagesSpacing) }} />
        <TopDownMovementImage
          width={imageSize}
          height={imageSize}
          frameIndex={movementTick % TOP_DOWN_MOVEMENT_FRAME_COUNT}
          movementDirection={movementDirection}
        />
        <View style={{ height: scaled(center.image.bottomSpacing) }} />
      </View>

      <Button
        icon="cog"
        mode="contained"
        style={{ width: center.buttonWidth }}
        accessibilityHint={t('common.longPressParameterSettingsTips')}
        delayLongPress={800}
        onLongPress={openSettingModal}>
        <Text>{t('common.paramsSetting')}</Text>
      </Button>
    </View>
  );
};
