/**
 * update
 * 暂时取消变轨完成判断，避免变轨过程中无法控制 2025-10-14, 互斥逻辑由机器端控制，避免变轨过程中无法控制
 */

import { Image } from 'expo-image';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, TouchableOpacity, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { Command } from '@/constants/command';
import { HOME_LAYOUT } from '@/constants/home-layout';
import { scaleHomeValue, useHomeLayoutScale } from '@/hooks/useHomeLayoutScale';
import { DIRECTION } from '@/types';
import { debounce, sendCmdDispatch, sendCmdWithRepeat } from '@/utils/helper';

type ManualMovementDirection = 'forward' | 'backward';

const MAX_CONTINUOUS_MOVEMENT_MS = 10_000;
const RELEASE_REPEAT_COUNT = 3;
const RELEASE_REPEAT_INTERVAL_MS = 50;

//定义手动模式遥感组件
export const ControlManualControl = () => {
  const { manualDirection } = HOME_LAYOUT.right;
  const { scale } = useHomeLayoutScale();
  const activeMovementRef = useRef<ManualMovementDirection | null>(null);
  const movementSafetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scaled = (value: number) => scaleHomeValue(value, scale);
  const switchLeftOrRight = debounce((direction: DIRECTION) => {
    if (direction === DIRECTION.LEFT) {
      sendCmdDispatch(Command.goLeft);
    } else if (direction === DIRECTION.RIGHT) {
      sendCmdDispatch(Command.goRight);
    }
  }, 400);
  const clearMovementSafetyTimeout = useCallback(() => {
    if (movementSafetyTimeoutRef.current) {
      clearTimeout(movementSafetyTimeoutRef.current);
      movementSafetyTimeoutRef.current = null;
    }
  }, []);

  const stopMovement = useCallback(() => {
    if (!activeMovementRef.current) {
      return;
    }

    activeMovementRef.current = null;
    clearMovementSafetyTimeout();
    sendCmdWithRepeat(
      () => {
        // If another direction has already been pressed, do not let a delayed
        // release from the previous gesture stop the new movement.
        if (!activeMovementRef.current) {
          sendCmdDispatch(Command.release);
        }
      },
      RELEASE_REPEAT_COUNT,
      RELEASE_REPEAT_INTERVAL_MS
    );
  }, [clearMovementSafetyTimeout]);

  const startMovement = useCallback(
    (direction: ManualMovementDirection) => {
      if (activeMovementRef.current === direction) {
        return;
      }

      if (activeMovementRef.current) {
        stopMovement();
      }

      activeMovementRef.current = direction;
      sendCmdDispatch(direction === 'forward' ? Command.goForward : Command.goBack);
      clearMovementSafetyTimeout();
      movementSafetyTimeoutRef.current = setTimeout(() => {
        console.warn('[MANUAL_MOVEMENT_HOLD_TIMEOUT]', {
          direction,
          timeoutMs: MAX_CONTINUOUS_MOVEMENT_MS,
        });
        stopMovement();
      }, MAX_CONTINUOUS_MOVEMENT_MS);
    },
    [clearMovementSafetyTimeout, stopMovement]
  );

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        stopMovement();
      }
    });

    return () => {
      appStateSubscription.remove();
      stopMovement();
      clearMovementSafetyTimeout();
    };
  }, [clearMovementSafetyTimeout, stopMovement]);

  return (
    <View
      className="relative flex flex-row items-center justify-center"
      style={{
        width: scaled(manualDirection.containerWidth),
        height: scaled(manualDirection.containerHeight),
        marginTop: scaled(manualDirection.containerMarginTop),
      }}>
      <View
        className="absolute left-0 top-0 h-full w-full flex-col items-center justify-center"
        style={{ gap: scaled(manualDirection.verticalGap) }}>
        <TouchableRipple
          onPressIn={() => startMovement('forward')}
          onPressOut={stopMovement}
          pressRetentionOffset={{ top: 80, right: 80, bottom: 80, left: 80 }}
          centered
          style={{
            top: -scaled(manualDirection.verticalArrowOffset),
            padding: scaled(manualDirection.arrowTouchPadding),
          }}
          className="rounded-full"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/top-arrow.png')}
            style={{
              width: scaled(manualDirection.arrowSize),
              height: scaled(manualDirection.arrowSize),
            }}
          />
        </TouchableRipple>
        <TouchableRipple
          onPressIn={() => startMovement('backward')}
          onPressOut={stopMovement}
          pressRetentionOffset={{ top: 80, right: 80, bottom: 80, left: 80 }}
          centered
          style={{
            top: scaled(manualDirection.verticalArrowOffset),
            padding: scaled(manualDirection.arrowTouchPadding),
          }}
          className="rounded-full"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/down-arrow.png')}
            style={{
              width: scaled(manualDirection.arrowSize),
              height: scaled(manualDirection.arrowSize),
            }}
          />
        </TouchableRipple>
      </View>
      <TouchableOpacity className="flex rounded-full">
        <Image
          source={require('@/assets/direction_tags.png')}
          style={{
            width: scaled(manualDirection.centerImageSize),
            height: scaled(manualDirection.centerImageSize),
          }}
        />
      </TouchableOpacity>
      <View
        className="absolute left-0 top-0 h-full w-full flex-row items-center justify-center"
        style={{ gap: scaled(manualDirection.horizontalGap) }}>
        <TouchableRipple
          onPress={() => switchLeftOrRight(DIRECTION.LEFT)}
          centered
          style={{
            left: -scaled(manualDirection.horizontalArrowOffset),
            padding: scaled(manualDirection.arrowTouchPadding),
          }}
          className="rounded-full"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/left-arrow.png')}
            style={{
              width: scaled(manualDirection.arrowSize),
              height: scaled(manualDirection.arrowSize),
            }}
          />
        </TouchableRipple>
        <TouchableRipple
          onPress={() => switchLeftOrRight(DIRECTION.RIGHT)}
          centered
          borderless
          style={{
            left: scaled(manualDirection.horizontalArrowOffset),
            padding: scaled(manualDirection.arrowTouchPadding),
          }}
          className="rounded-full"
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/right-arrow.png')}
            style={{
              width: scaled(manualDirection.arrowSize),
              height: scaled(manualDirection.arrowSize),
            }}
          />
        </TouchableRipple>
      </View>
    </View>
  );
};
