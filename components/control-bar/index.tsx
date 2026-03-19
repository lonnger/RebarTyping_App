import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Card, Icon } from 'react-native-paper';

import { ControlAutoSelectDirection } from '../control-auto-select-direction';
import { ControlExtraModule } from '../control-extra-module';
import { ControlManualControl } from '../control-manual-control';
import { ControlSegmented } from '../control-segmented';

import { Command } from '@/constants/command';
import useStore from '@/store';
import { ROBOT_CURRENT_MODE } from '@/types';
import { sendCmdDispatch } from '@/utils/helper';
import { showNotifier } from '@/utils/notifier';

export const LockMode = () => {
  const { t } = useTranslation();
  return (
    <View className="flex h-[180px] w-[150px] flex-row items-center justify-center gap-x-2">
      <Icon source="lock" size={22} />
      <Text className="text-center text-xl font-normal text-black">{t('common.lockMode')}</Text>
    </View>
  );
};

export const ControlBar = () => {
  const { robotStatus, workParams, setRobotStatus } = useStore((state) => state);
  const { t } = useTranslation();

  // 点击开始
  const startTyping = () => {
    if (workParams.auto_find_point) {
      showNotifier({
        title: t('robot.autoFindPointTips'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }

    if (!robotStatus.isWorking) {
      sendCmdDispatch(Command.BeginAutoMode);
    } else {
      sendCmdDispatch(Command.manualModel);
      setRobotStatus({
        isWorking: false,
      });
    }
  };

  const stopTyping = () => {
    sendCmdDispatch(Command.EndAutoMode);
  };

  const renderControl = () => {
    if (robotStatus.currentMode === ROBOT_CURRENT_MODE.LOCKED) {
      return <LockMode />;
    } else if (robotStatus.currentMode === ROBOT_CURRENT_MODE.MANUAL) {
      return <ControlManualControl />;
    } else {
      return <ControlAutoSelectDirection onStart={startTyping} onStop={stopTyping} />;
    }
  };

  return (
    <Card className="relative">
      <View className="flex  w-full flex-col justify-between px-8 pb-5 pt-2">
        <View className="flex flex-col items-center">
          <View className="mb-2 mt-3 flex flex-row items-center justify-center">
            <Icon source="robot-happy-outline" size={22} />
            <Text className="ml-2 text-center text-2xl font-bold">
              {t('common.robotOperation')}
            </Text>
          </View>
          <ControlSegmented/>
          <View className="min-h-[250px]">{renderControl()}</View>
        </View>
        {robotStatus.currentMode !== ROBOT_CURRENT_MODE.LOCKED ? <ControlExtraModule /> : null}
      </View>
    </Card>
  );
};
