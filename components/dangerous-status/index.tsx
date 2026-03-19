import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';
import { Button, Icon, Portal, TouchableRipple } from 'react-native-paper';

import { Command } from '@/constants/command';
import useStore from '@/store';
import { ROBOT_CURRENT_MODE } from '@/types';
import { sendCmdDispatch } from '@/utils/helper';

export const DangerousStatus = () => {
  const { setRobotStatus } = useStore((state) => state);
  const { t } = useTranslation();

  const releaseDangerStatus = () => {
    // 切换为手动
    sendCmdDispatch(Command.manualModel);
    setRobotStatus({
      robotDangerStatus: false,
      currentMode: ROBOT_CURRENT_MODE.MANUAL,
    });
  };

  return (
    <Portal>
      <View className="absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-red-500/70">
        <Button
          mode="outlined"
          className="my-5 w-[350px] rounded-2xl"
          contentStyle={{ backgroundColor: '#088CFFFF', padding: 30 }}
          onLongPress={releaseDangerStatus}>
          <View className="flex flex-row items-center justify-center">
            <Icon source="hand-okay" size={24} color="#ffffff" />
            <TouchableRipple rippleColor="rgba(0, 0, 0, .32)">
              <View className="flex flex-col items-center">
                <Text className="ml-2 text-2xl text-white">
                  {t('common.releaseDangerStatusTips')}
                </Text>
                <Text className="ml-2 text-sm text-white">
                  {t('common.longPressReleaseDangerStatusTips')}
                </Text>
              </View>
            </TouchableRipple>
          </View>
        </Button>
      </View>
    </Portal>
  );
};
