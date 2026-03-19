/**
 * update
 * 暂时取消变轨完成判断，避免变轨过程中无法控制 2025-10-14, 互斥逻辑由机器端控制，避免变轨过程中无法控制
 */

import { Image } from 'expo-image';
import { TouchableOpacity, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

import { Command } from '@/constants/command';
import { DIRECTION } from '@/types';
import { debounce, sendCmdDispatch, sendCmdWithRepeat } from '@/utils/helper';
//定义手动模式遥感组件
export const ControlManualControl = () => {
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
    <View className="relative mt-1.5 flex h-[180px] w-[150px] flex-row items-center justify-center gap-x-5">
      <View className="absolute left-0 top-0 h-full w-full flex-col items-center justify-center gap-y-10">
        <TouchableRipple
          onPressIn={() => switchTop(true)}
          onPressOut={() => switchTop(false)}
          centered
          style={{ top: -32 }}              
          className="rounded-full px-2 py-2"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/top-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableRipple>
        <TouchableRipple
          onPressIn={() => switchDown(true)} //
          onPressOut={() => switchDown(false)}//
          centered
          style={{ top: 32 }}
          className="rounded-full px-2 py-2"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/down-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableRipple>
      </View>
      <TouchableOpacity className="flex rounded-full">
        <Image
          source={require('@/assets/direction_tags.png')}
          style={{ width: 100, height: 100 }}
        />
      </TouchableOpacity>
      <View className="absolute left-0 top-0 h-full w-full flex-row items-center justify-center gap-x-10">
        <TouchableRipple
          onPress={() => switchLeftOrRight(DIRECTION.LEFT)}
          centered
          style={{ left: -40 }}
          className="rounded-full px-2 py-2"
          borderless
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/left-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableRipple>
        <TouchableRipple
          onPress={() => switchLeftOrRight(DIRECTION.RIGHT)}
          centered
          borderless
          style={{ left: 40 }}
          className="rounded-full px-2 py-2"
          rippleColor="rgba(0, 0, 0, .32)">
          <Image
            source={require('@/assets/icon/right-arrow.png')}
            style={{ width: 50, height: 50 }}
          />
        </TouchableRipple>
      </View>
    </View>
  );
};
