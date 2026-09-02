import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Card, Icon } from 'react-native-paper';

import { ControlAutoSelectDirection } from '../control-auto-select-direction';
import { ControlExtraModule } from '../control-extra-module';
import { ControlManualControl } from '../control-manual-control';
import { ControlSegmented } from '../control-segmented';

import { Command } from '@/constants/command';
import { HOME_LAYOUT } from '@/constants/home-layout';
import { scaleHomeValue, useHomeLayoutScale } from '@/hooks/useHomeLayoutScale';
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
  const { scale } = useHomeLayoutScale();
  const scaled = (value: number) => scaleHomeValue(value, scale);

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
      console.log('发送开始自动模式指令');
    } else {
      //sendCmdDispatch(Command.manualModel);
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
    <Card className="relative" style={{ flex: 1 }}>
      <View
        className="flex h-full w-full flex-col"
        style={{
          paddingHorizontal: scaled(HOME_LAYOUT.right.contentPaddingHorizontal),
          paddingTop: scaled(HOME_LAYOUT.right.contentPaddingTop),
          paddingBottom: scaled(HOME_LAYOUT.right.contentPaddingBottom),
        }}>
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            paddingBottom: scaled(HOME_LAYOUT.right.operationContentBottomSpacing),
          }}>
          <View className="mb-2 mt-3 flex flex-row items-center justify-center">
            <Icon source="robot-happy-outline" size={22} />
            <Text className="ml-2 text-center text-xl font-bold">{t('common.robotOperation')}</Text>
          </View>
          <ControlSegmented />
          <View style={{ minHeight: scaled(HOME_LAYOUT.right.controlAreaMinHeight) }}>
            {renderControl()}
          </View>
        </View>
        {robotStatus.currentMode !== ROBOT_CURRENT_MODE.LOCKED ? (
          <View
            style={{
              position: 'absolute',
              left: scaled(HOME_LAYOUT.right.contentPaddingHorizontal),
              right: scaled(HOME_LAYOUT.right.contentPaddingHorizontal),
              bottom: HOME_LAYOUT.right.extraButtonsBottomSpacing,
            }}>
            <ControlExtraModule />
          </View>
        ) : null}
      </View>
    </Card>
  );
};
