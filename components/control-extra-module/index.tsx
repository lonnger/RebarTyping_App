import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button } from 'react-native-paper';

import { DownState, RebootState } from '@/constants';
import { Command } from '@/constants/command';
import { HOME_LAYOUT } from '@/constants/home-layout';
import { scaleHomeValue, useHomeLayoutScale } from '@/hooks/useHomeLayoutScale';
import useStore, { initWorkParams } from '@/store';
import { ROBOT_CURRENT_MODE } from '@/types';
import { globalGetConnect, sendCmdDispatch, sendCmdWithRepeat } from '@/utils/helper';
import { showNotifier } from '@/utils/notifier';
import { SocketManage } from '@/utils/socketManage';

export const ControlExtraModule = () => {
  const { robotStatus, workParams, setWorkParams, setDataInspect } = useStore((state) => state);
  const { t, i18n } = useTranslation();
  const { scale } = useHomeLayoutScale();
  const extraButtonsGap = scaleHomeValue(HOME_LAYOUT.right.extraButtonsGap, scale);
  const extraButtonsFontSize = Math.max(
    10,
    scaleHomeValue(HOME_LAYOUT.right.extraButtonsFontSize, scale)
  );
  const extraButtonContentPaddingHorizontal = scaleHomeValue(
    HOME_LAYOUT.right.extraButtonContentPaddingHorizontal,
    scale
  );
  const usesWideManualLayout =
    ['en', 'es', 'ar'].some((language) => i18n.language.startsWith(language)) &&
    robotStatus.currentMode === ROBOT_CURRENT_MODE.MANUAL;
  const isAutoMode = robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO;
  const manualButtonFontSize = usesWideManualLayout
    ? Math.max(10, scaleHomeValue(HOME_LAYOUT.right.manualEnglishButtonFontSize, scale))
    : extraButtonsFontSize;
  const usesLargeAutoButtonFont = ['cn', 'hk'].some((language) =>
    i18n.language.startsWith(language)
  );
  const usesArabicAutoButtonLayout = i18n.language.startsWith('ar');
  const autoButtonFontSize = Math.max(
    usesArabicAutoButtonLayout ? HOME_LAYOUT.right.autoArabicButtonMinFontSize : 10,
    scaleHomeValue(
      usesLargeAutoButtonFont
        ? HOME_LAYOUT.right.autoChineseButtonFontSize
        : HOME_LAYOUT.right.autoButtonFontSize,
      scale
    )
  );
  const autoButtonLabelStyle = {
    fontSize: autoButtonFontSize,
    flexShrink: 1,
    ...(usesArabicAutoButtonLayout
      ? { marginHorizontal: HOME_LAYOUT.right.autoArabicButtonLabelMarginHorizontal }
      : {}),
  };
  const isInLockedMode = () => {
    if (robotStatus.currentMode === ROBOT_CURRENT_MODE.LOCKED) {
      showNotifier({
        title: t('errors.lockModeTips'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return true;
    }
    return false;
  };

  const robotReset = () => {
    if (isInLockedMode()) {
      return;
    }

    if (workParams.auto_find_point) {
      showNotifier({
        title: t('errors.autoFindPointTips3'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }

    if (robotStatus.downState === DownState.finish) {
      sendCmdDispatch(Command.machineReboot);
      setWorkParams({
        ...initWorkParams,
      });
      SocketManage.getInstance().disconnectSocket();
      setTimeout(() => {
        globalGetConnect();
        // 10s后重新连接
      }, 10000);
    }
  };

  const robotDown = () => {
    if (workParams.auto_find_point) {
      showNotifier({
        title: t('errors.autoFindPointTips2'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }

    sendCmdDispatch(Command.machineDescent);
    console.log('machineDescent');
    sendCmdWithRepeat(
      () => {
        sendCmdDispatch(Command.manualModel);
      },
      3,
      30
    );
  };

  const robotReboot = () => {
    if (isInLockedMode()) {
      return;
    }

    if (workParams.auto_find_point) {
      showNotifier({
        title: t('errors.autoFindPointTips'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }
    if (robotStatus.rebootState === RebootState.finish) {
      sendCmdWithRepeat(
        () => {
          sendCmdDispatch(Command.manualModel);
        },
        2,
        30
      );
      sendCmdWithRepeat(
        () => {
          sendCmdDispatch(Command.lashedReboot);
        },
        3,
        30
      );
    }
  };

  const cutWire = () => {
    if (isInLockedMode()) {
      return;
    }

    sendCmdWithRepeat(
      () => {
        sendCmdDispatch(Command.lashedReboot);
      },
      3,
      30
    );
  };

  const triggerTrack = () => {
    sendCmdDispatch(Command.triggerTrack);
  };

  const clearLashedCount = () => {
    sendCmdDispatch(Command.clearLashedCount);
    setDataInspect({ lashed_count: 0 });
  };

  return (
    <View className="relative flex w-full flex-row items-end justify-center">
      <View
        className="flex flex-row"
        style={{
          width: usesWideManualLayout
            ? HOME_LAYOUT.right.manualEnglishButtonsRowWidth
            : isAutoMode
              ? HOME_LAYOUT.right.autoButtonsRowWidth
              : HOME_LAYOUT.right.extraButtonsRowWidth,
          rowGap: extraButtonsGap,
          columnGap: extraButtonsGap,
          flexWrap: 'nowrap',
          justifyContent: 'center',
        }}>
        {robotStatus.currentMode === ROBOT_CURRENT_MODE.MANUAL ? (
          <Button
            compact
            icon="reload"
            mode="elevated"
            style={{ flex: 1 }}
            contentStyle={{ paddingHorizontal: extraButtonContentPaddingHorizontal }}
            labelStyle={{ fontSize: manualButtonFontSize }}
            onPress={robotReboot}>
            {t('common.cutWire')}
          </Button>
        ) : null}
        {robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO ? (
          <Button
            compact
            icon={usesArabicAutoButtonLayout ? undefined : 'content-cut'}
            mode="elevated"
            style={{ flex: 1 }}
            contentStyle={{ paddingHorizontal: extraButtonContentPaddingHorizontal }}
            labelStyle={autoButtonLabelStyle}
            onPress={cutWire}>
            {t('common.cutWire')}
          </Button>
        ) : null}
        {robotStatus.currentMode === ROBOT_CURRENT_MODE.AUTO ? (
          <Button
            compact
            icon={usesArabicAutoButtonLayout ? undefined : 'restart'}
            mode="elevated"
            style={{ flex: 1 }}
            contentStyle={{ paddingHorizontal: extraButtonContentPaddingHorizontal }}
            labelStyle={autoButtonLabelStyle}
            onPress={triggerTrack}>
            {t('common.triggertrack')}
          </Button>
        ) : null}
        {isAutoMode ? (
          <Button
            compact
            icon={usesArabicAutoButtonLayout ? undefined : 'delete-outline'}
            mode="elevated"
            style={{ flex: 1 }}
            contentStyle={{ paddingHorizontal: extraButtonContentPaddingHorizontal }}
            labelStyle={autoButtonLabelStyle}
            onPress={clearLashedCount}>
            {t('common.clearLashedCount')}
          </Button>
        ) : null}
        {robotStatus.currentMode === ROBOT_CURRENT_MODE.MANUAL ? (
          <Button
            compact
            icon="elevator-down"
            mode="elevated"
            style={{ flex: 1 }}
            contentStyle={{ paddingHorizontal: extraButtonContentPaddingHorizontal }}
            labelStyle={{ fontSize: manualButtonFontSize }}
            onPress={robotDown}>
            {t('common.machineDown')}
          </Button>
        ) : null}
      </View>
    </View>
  );
};
