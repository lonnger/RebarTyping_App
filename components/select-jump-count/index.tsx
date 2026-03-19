import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { RadioButton } from 'react-native-paper';

import useStore from '@/store';
import { SocketManage } from '@/utils/socketManage';
import { GlobalConst } from '@/constants';
import { showNotifier } from '@/utils/notifier';
import { sendCmdWithRepeat } from '@/utils/helper';
const jumpCountList = [
  {
    value: '1',
    label: '1',
  },
  {
    value: '2',
    label: '2',
  },
  {
    value: '3',
    label: '3',
  },
  {
    value: '4',
    label: '4',
  },
  {
    value: '5',
    label: '5',
  },
];

export const SelectJumpCount = () => {
  const [checked, setChecked] = useState('1');
  const { robotStatus } = useStore((state) => state);
  const { setRobotStatus } = useStore((state) => state);
  const { t } = useTranslation();
  const handleChange = (value: string) => {
    setChecked(value);
    setRobotStatus({
      skip_binding_count: parseInt(value, 10),
    });
    sendData(GlobalConst.jumpNo, Number(value));
  };

  const sendData = (fClass: string, fData: number) => {
    if (robotStatus.robotDangerStatus) {
      showNotifier({
        title: t('errors.robotDangerStatusTips'),
        message: t('errors.pleaseCheckTheRobotStatusIfItIsInSoftEmergencyStopStatus'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }
    const socket = SocketManage.getInstance();

    if (socket.isConnected()) {
      sendCmdWithRepeat(() => {
        socket.writeData(`${GlobalConst.forwardData}:${fClass}=${fData}`);
      }, 2);
    } else {
      showNotifier({
        title: t('errors.robotUnconnectedTips'),
        message: t('errors.robotNotConnected'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    }
  };

  return (
    <View className="flex flex-col items-start justify-center">
      <Text className="text-center text-lg font-bold">{t('common.currentSkipBindingCount')}</Text>
      <View className="flex flex-row items-center gap-x-5">
        {jumpCountList.map((item) => (
          <View key={item.value} className="flex flex-row items-center">
            <RadioButton.Android
              value={item.value}
              onPress={() => handleChange(item.value)}
              status={checked === item.value ? 'checked' : 'unchecked'}
            />
            <Text className="text-lg">{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
