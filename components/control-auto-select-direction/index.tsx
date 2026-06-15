import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { Button, TouchableRipple } from 'react-native-paper';

import { SelectJumpCount } from '../select-jump-count';

import { Command } from '@/constants/command';
import useStore from '@/store';
import { DIRECTION, ROBOT_CURRENT_MODE, ROBOT_WORK_MODE } from '@/types';
import { sendCmdDispatch, sendCmdWithRepeat } from '@/utils/helper';

interface ControlAutoSelectDirectionProps {
  onStart: () => void;
  onStop: () => void;
}

export const ControlAutoSelectDirection = ({
  onStart,
  onStop,
}: ControlAutoSelectDirectionProps) => {
  const { robotStatus } = useStore((state) => state);
  const [isLeftOrRight, setIsLeftOrRight] = useState<DIRECTION | undefined>(undefined);
  const [isForwardOrBackward, setIsForwardOrBackward] = useState<DIRECTION | undefined>(undefined);
  const { t } = useTranslation();

  const switchLeftOrRight = (direction: DIRECTION) => {
    if (direction === DIRECTION.LEFT) {
      sendCmdWithRepeat(() => {
        sendCmdDispatch(Command.LeftChange);
      }, 2);
      setIsLeftOrRight(DIRECTION.LEFT);
    } else if (direction === DIRECTION.RIGHT) {
      sendCmdWithRepeat(() => {
        sendCmdDispatch(Command.RightChange);
      }, 2);
      setIsLeftOrRight(DIRECTION.RIGHT);
    }
  };

  const switchTopOrDown = (direction: DIRECTION) => {
    if (direction === DIRECTION.UP) {
      sendCmdWithRepeat(() => {
        sendCmdDispatch(Command.goForwardInAutoMode);
      }, 2);
      setIsForwardOrBackward(DIRECTION.UP);
    } else if (direction === DIRECTION.DOWN) {
      sendCmdWithRepeat(() => {
        sendCmdDispatch(Command.goBackInAutoMode);
      }, 2);
      setIsForwardOrBackward(DIRECTION.DOWN);
    }
  };

  return (
    <>
      <View className="relative mt-16 flex flex-row items-center justify-center gap-x-5 ">
        <View className="absolute left-0 top-0 h-full w-full flex-row items-center justify-center gap-x-10">
          <Button
            mode="contained-tonal"
            buttonColor="#012641"
            textColor="#ffffff"
            style={{ top: -90, left: -40 }}
            labelStyle={{ fontSize: 12 }}
            onPress={() => {
              onStart();
            }}>
            {t('common.start')}
          </Button>

          <Button
            mode="contained-tonal"
            buttonColor="#FD1D1DD5"
            textColor="#ffffff"
            style={{ top: -90, right: -40 }}
            labelStyle={{ fontSize: 12 }}
            onPress={() => {
              onStop();
            }}>
            {t('common.stop')}
          </Button>
        </View>

        <View className="absolute left-0 top-0 h-full w-full flex-col items-center justify-center gap-y-10">
          <TouchableRipple
            onPress={() => switchTopOrDown(DIRECTION.UP)}
            centered
            style={{ top: -30, opacity: isForwardOrBackward === DIRECTION.UP ? 1 : 0.5 }}
            className="rounded-full px-2 py-2"
            borderless
            rippleColor="rgba(0, 0, 0, .32)">
            <Image
              source={require('@/assets/icon/top-arrow.png')}
              style={{ width: 45, height: 45 }}
              tintColor={isForwardOrBackward === DIRECTION.UP ? '#0C5176FF' : '#BABABAFF'}
            />
          </TouchableRipple>
          <TouchableRipple
            onPress={() => switchTopOrDown(DIRECTION.DOWN)}
            centered
            style={{ top: 30, opacity: isForwardOrBackward === DIRECTION.DOWN ? 1 : 0.5 }}
            className="rounded-full px-2 py-2"
            borderless
            rippleColor="rgba(0, 0, 0, .32)">
            <Image
              source={require('@/assets/icon/down-arrow.png')}
              style={{ width: 45, height: 45 }}
              tintColor={isForwardOrBackward === DIRECTION.DOWN ? '#0C5176FF' : '#BABABAFF'}
            />
          </TouchableRipple>
        </View>
        <View className="relative flex w-full flex-row items-center justify-center opacity-0">
          <View className="flex">
            {robotStatus.isWorking ? (
              <View className="flex h-[80px] w-[80px] flex-row items-center justify-center rounded-full bg-[#012641]">
                {/* <Icon source="pause" color="#ffffff" size={22} /> */}
                <Text className="ml-1 text-center text-xl font-normal text-white">
                  {t('common.pause')}
                </Text>
              </View>
            ) : (
              <View className="flex h-[80px] w-[80px] flex-row items-center justify-center rounded-full bg-[#012641]">
                {/* <Icon source="play" color="#ffffff" size={22} /> */}
                <Text className="ml-1 text-center text-xl font-normal text-white">
                  {t('common.start')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity className="absolute -bottom-2 flex rounded-full">
          <Image
            source={require('@/assets/direction_tags.png')}
            style={{ width: 90, height: 90 }}
          />
        </TouchableOpacity>

        <View className="absolute left-0 top-0 h-full w-full flex-row items-center justify-center gap-x-10">
          <TouchableRipple
            onPress={() => switchLeftOrRight(DIRECTION.LEFT)}
            centered
            style={{ left: -30, opacity: isLeftOrRight === DIRECTION.LEFT ? 1 : 0.5 }}
            className="rounded-full px-2 py-2"
            borderless
            rippleColor="rgba(0, 0, 0, .32)">
            <Image
              source={require('@/assets/icon/left-arrow.png')}
              style={{ width: 45, height: 45 }}
              tintColor={isLeftOrRight === DIRECTION.LEFT ? '#0C5176FF' : '#BABABAFF'}
            />
          </TouchableRipple>
          <TouchableRipple
            onPress={() => switchLeftOrRight(DIRECTION.RIGHT)}
            centered
            style={{ left: 30, opacity: isLeftOrRight === DIRECTION.RIGHT ? 1 : 0.5 }}
            className="rounded-full px-2 py-2"
            borderless
            rippleColor="rgba(0, 0, 0, .32)">
            <Image
              source={require('@/assets/icon/right-arrow.png')}
              style={{ width: 45, height: 45 }}
              tintColor={isLeftOrRight === DIRECTION.RIGHT ? '#0C5176FF' : '#BABABAFF'}
            />
          </TouchableRipple>
        </View>
      </View>
      {robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO &&
      robotStatus.currentBindingMode === ROBOT_WORK_MODE.SKIP_BINDING ? (
        <View className="mt-20 flex w-full justify-start">
          <SelectJumpCount />
        </View>
      ) : null}
    </>
  );
};
