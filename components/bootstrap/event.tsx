import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { GlobalActivityIndicatorManager } from '../activity-indicator-global';

import { ChangeState, DownState, RebootState, TyingState } from '@/constants';
import { eventBusKey } from '@/constants/event';
import useStore from '@/store';
import eventBus from '@/utils/eventBus';

export const EventHandler = () => {
  const { setRobotStatus, setWorkParams, setErrorGroup, errorGroup, setDataInspect } = useStore(
    (state) => state
  );
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
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes();
      const seconds = now.getSeconds() < 10 ? `0${now.getSeconds()}` : now.getSeconds();
      const copyErrorGroup = [...errorGroup];
      let nowIndex = 0; //错误存在的下标
      let isExist = false;
      for (let i = 0; i < copyErrorGroup.length; i++) {
        if (eError - 1 === copyErrorGroup[i].errorId) {
          isExist = true;
          nowIndex = i;
          break;
        }
      }
      if (isExist) {
        copyErrorGroup[nowIndex].time = `${hours}:${minutes}:${seconds}`;
      } else {
        const temp = {
          time: `${hours}:${minutes}:${seconds}`,
          errorId: eError - 1,
        };
        setErrorGroup(temp);
      }
    });

    return () => {
      eventBus.clear();
    };
  }, []);
  return null;
};
