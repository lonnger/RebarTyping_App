import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';
import { Button, Icon, Portal, TouchableRipple } from 'react-native-paper';

import useStore from '@/store';

export const LockedStatus = () => {
  const { setRobotStatus } = useStore((state) => state);
  const { t } = useTranslation();

  const handleUnlockScreen = () => {
    setRobotStatus({
      robotLockedStatus: false,
    });
  };

  return (
    <Portal>
      <View className="absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-gray-500/70">
        <Button
          mode="outlined"
          className="my-5 w-[350px] rounded-2xl"
          contentStyle={{ backgroundColor: '#088CFFFF', padding: 30 }}
          onLongPress={handleUnlockScreen}>
          <View className="flex flex-row items-center justify-center">
            <Icon source="hand-okay" size={24} color="#ffffff" />
            <TouchableRipple rippleColor="rgba(0, 0, 0, .32)">
              <View className="flex flex-col items-center">
                <Text className="ml-2 text-2xl text-white">
                  {t('common.longPressUnlockScreenTips')}
                </Text>
              </View>
            </TouchableRipple>
          </View>
        </Button>
      </View>
    </Portal>
  );
};
