/**
 * update
 * 暂时取消变轨完成判断，避免变轨过程中无法控制 2025-10-14, 互斥逻辑由机器端控制，避免变轨过程中无法控制
 */

import { Image } from 'expo-image';
import { TouchableOpacity, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { Command } from '@/constants/command';
import { HOME_LAYOUT } from '@/constants/home-layout';
import { scaleHomeValue, useHomeLayoutScale } from '@/hooks/useHomeLayoutScale';
import { DIRECTION } from '@/types';
import { debounce, sendCmdDispatch, sendCmdWithRepeat } from '@/utils/helper';
//定义手动模式遥感组件
export const ControlManualControl = () => {
  const { manualDirection } = HOME_LAYOUT.right;
  const { scale } = useHomeLayoutScale();
  const scaled = (value: number) => scaleHomeValue(value, scale);
  const switchLeftOrRight = debounce((direction: DIRECTION) => {
    if (direction === DIRECTION.LEFT) {
      sendCmdDispatch(Command.goLeft);
    } else if (direction === DIRECTION.RIGHT) {
      sendCmdDispatch(Command.goRight);
    }
  }, 400);
  const switchTop = (isPressed: boolean) => {
    if (isPressed) {
      sendCmdDispatch(Command.goForward);
    } else {
      sendCmdWithRepeat(() => {
        sendCmdDispatch(Command.release);
      }, 2);
    }
  };
  const switchDown = (isPressed: boolean) => {
    if (isPressed) {
      sendCmdDispatch(Command.goBack);
    } else {
      sendCmdWithRepeat(() => {
        sendCmdDispatch(Command.release);
      }, 2);
    }
  };

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
          onPressIn={() => switchTop(true)}
          onPressOut={() => switchTop(false)}
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
          onPressIn={() => switchDown(true)} //
          onPressOut={() => switchDown(false)} //
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
