import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { GlobalActivityIndicatorManager } from '../activity-indicator-global';
import { GlobalDialogManager } from '../global-dialog';

import { ChangeState, DownState, RebootState, TyingState } from '@/constants';
import { eventBusKey } from '@/constants/event';
import useStore from '@/store';
import { ROBOT_CURRENT_MODE } from '@/types';
import { ConnectDeviceInfo } from '@/utils/connectDeviceInfo';
import eventBus from '@/utils/eventBus';

export const EventHandler = () => {
  const { setRobotStatus, setWorkParams, setErrorGroup, removeErrorGroup, setDataInspect } =
    useStore((state) => state);
  const { t } = useTranslation();
  useEffect(() => {
    eventBus.subscribe(eventBusKey.StopEvent, ({ eStop }: { eStop: boolean }) => {
      setRobotStatus({
        robotDangerStatus: eStop,
      });
    });

    eventBus.subscribe(eventBusKey.StatusEvent, ({ eStatus }: { eStatus: number }) => {
      if (eStatus === TyingState.work) {
        setRobotStatus({
          isWorking: true,
        });
      } else {
        setRobotStatus({
          isWorking: false,
        });
      }
    });

    eventBus.subscribe(eventBusKey.ElectricEvent, ({ eElectric }: { eElectric: number }) => {
      setRobotStatus({
        electric: eElectric,
      });
    });

    eventBus.subscribe(eventBusKey.OverageEvent, ({ eRage }: { eRage: number }) => {
      setDataInspect({
        overage_num: eRage,
      });
    });

    eventBus.subscribe(eventBusKey.OrbitEvent, ({ eLaser }: { eLaser: number }) => {
      setDataInspect({
        track_laser_num: eLaser,
      });
    });

    eventBus.subscribe(eventBusKey.NodeEvent, ({ eLaser }: { eLaser: number }) => {
      setDataInspect({
        node_laser_num: eLaser,
      });
    });

    eventBus.subscribe(
      eventBusKey.OrbitChangeEvent,
      ({ eChangeLaser }: { eChangeLaser: number }) => {
        setWorkParams({
          inputOrbitMax: eChangeLaser,
        });
      }
    );

    eventBus.subscribe(
      eventBusKey.NodeChangeEvent,
      ({ eChangeLaser }: { eChangeLaser: number }) => {
        setWorkParams({
          inputNodeMax: eChangeLaser,
        });
      }
    );

    eventBus.subscribe(eventBusKey.ChangeEvent, ({ eState }: { eState: ChangeState }) => {
      if (eState === ChangeState.move) {
        setRobotStatus({
          changeState: ChangeState.move,
        });
      } else {
        setRobotStatus({
          changeState: ChangeState.finish,
        });
      }
    });

    eventBus.subscribe(eventBusKey.RebootEvent, ({ eState }: { eState: RebootState }) => {
      if (eState === RebootState.rebooting) {
        GlobalActivityIndicatorManager.current?.show(t('robot.rebooting'), 0);
      } else {
        GlobalActivityIndicatorManager.current?.hide();
      }
    });

    eventBus.subscribe(eventBusKey.DownEvent, ({ eState }: { eState: DownState }) => {
      if (eState === DownState.downing) {
        GlobalActivityIndicatorManager.current?.show(t('robot.downing'), 0);
      } else {
        GlobalActivityIndicatorManager.current?.hide();
      }
    });

    eventBus.subscribe(eventBusKey.ErrorEvent, ({ eError }: { eError: number }) => {
      setErrorGroup({ errorId: eError - 1 });
    });

    eventBus.subscribe(eventBusKey.GunErrorEvent, ({ isActive }: { isActive: boolean }) => {
      if (isActive) {
        setErrorGroup({ errorId: ConnectDeviceInfo.gunErrorId });
      } else {
        removeErrorGroup(ConnectDeviceInfo.gunErrorId);
      }
    });

    eventBus.subscribe(eventBusKey.AntiFallEvent, ({ isActive }: { isActive: boolean }) => {
      const { robotStatus } = useStore.getState();
      if (!isActive || robotStatus.currentMode !== ROBOT_CURRENT_MODE.AUTO) {
        return;
      }

      setRobotStatus({
        currentMode: ROBOT_CURRENT_MODE.MANUAL,
        currentBindingMode: '',
        isWorking: false,
        movementDirection: 'idle',
      });
      GlobalDialogManager.current?.show({
        title: t('robot.antiFallEmergencyTitle'),
        content: t('robot.antiFallEmergencyTips'),
        showCancel: false,
        confirmText: t('common.iKnow'),
        callback: () => {},
      });
    });

    return () => {
      eventBus.clear();
    };
  }, []);
  return null;
};
