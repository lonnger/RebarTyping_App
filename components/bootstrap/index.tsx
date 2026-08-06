import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, AppStateStatus } from 'react-native';
import WifiManager from 'react-native-wifi-reborn';

import { GlobalActivityIndicatorManager } from '../activity-indicator-global';
import { EventHandler } from './event';
import { GlobalDialogManager } from '../global-dialog';

import { DownState, GlobalConst, RebootState, storage_config } from '@/constants';
import { Command } from '@/constants/command';
import { eventBusKey } from '@/constants/event';
import database from '@/model/manager';
import useStore from '@/store';
import { DIRECTION, ROBOT_CURRENT_MODE, ROBOT_WORK_MODE } from '@/types';
import { ConnectDeviceInfo } from '@/utils/connectDeviceInfo';
import {
  isEspWifiConnectionInProgress,
  releaseEspWifiFromSystem,
} from '@/utils/espWifiSystemPicker';
import eventBus from '@/utils/eventBus';
import { delayed, globalGetConnect, sendCmdDispatch } from '@/utils/helper';
import {
  clearOnlineLoginAt,
  getOnlineLoginSessionStatus,
  ONLINE_LOGIN_VALIDITY_DAYS,
} from '@/utils/loginSession';
import { showNotifier } from '@/utils/notifier';
import { SocketManage } from '@/utils/socketManage';
import { printTerminalLogo } from '@/utils/terminalLog';
// 这个组件主要做一些初始化功能
export const Bootstrap = () => {
  //新增一个状态来控制枪口错误提示的频率，避免短时间内多次触发
  const GUN_ERROR_THROTTLE_MS = 5000;
  const gunAlarmStateRef = useRef({
    isActive: false,
    lastShownAt: 0,
  });
  const sessionRedirectingRef = useRef(false);
  //读取本地存储中的用户信息
  const userInfo = useAsyncStorage(storage_config.LOCAL_STORAGE_USER_INFO);
  const { setCanLoginInfo, canLoginInfo, robotStatus, setRobotStatus, setDebugLog } = useStore(
    (state) => state
  );
  const { t } = useTranslation();

  //挂载即执行
  useEffect(() => {
    printTerminalLogo();
    databaseInit();  //初始化本地数据库并拉取用户信息
    checkLogin();    //检查是否登录，未登录则跳转到登录页
    setTimeout(async () => {
      try {
        const connectedWifiSSID = (await WifiManager.getCurrentWifiSSID()) || '';
        if (connectedWifiSSID.indexOf(GlobalConst.wifiName) > -1) {
          await globalGetConnect();
        }
      } catch (error) {
        console.warn('Initial robot WiFi check skipped', error);
      }
    }, 50);
  }, []);

  //事件总线订阅
  useEffect(() => {
    eventBus.subscribe(eventBusKey.SendCmdEvent, (cmd: Command) => {
      sendCmd(cmd);  //当收到发送命令事件时，调用sendCmd
    });
    //订阅Wifi事件，实时更新全局状态里的 WiFi 连接状态
    eventBus.subscribe(eventBusKey.WifiEvent, (data: { eConnect: boolean }) => {
      setRobotStatus({
        wifiConnectStatus: data.eConnect,
      });
    });

    //清理订阅
    return () => {
      eventBus.unsubscribe(eventBusKey.SendCmdEvent, (cmd: Command) => {
        sendCmd(cmd);
      });

      eventBus.unsubscribe(eventBusKey.WifiEvent, (data: { eConnect: boolean }) => {
        setRobotStatus({
          wifiConnectStatus: data.eConnect,
        });
      });
    };
  }, []);

  //应用前后台切换，监听 App 是在后台运行还是在前台，调用 handleAppStateChange
  useEffect(() => {
    const screenListener = AppState.addEventListener('change', handleAppStateChange);

    return () => screenListener.remove();
  }, []);

  // Keep enforcing expiry even when the app remains active for several days.
  useEffect(() => {
    const sessionCheckInterval = setInterval(() => {
      if (AppState.currentState === 'active') {
        checkOnlineLoginValidity();
      }
    }, 60_000);

    return () => clearInterval(sessionCheckInterval);
  }, []);

  //专门监听 GunErrorEvent（枪口异常）。一旦触发，会立即发送 lockUp（锁定）命令并弹出红色报错
  // 方案：使用依赖数组确保拿到最新的 rebootState
  useEffect(() => {

    const onGunError = () => {
      // 模式切换
      //sendCmdDispatch(Command.lockUp);
      console.log('进入onGunError');
      //console.log('机器人当前状态 (robotStatus):', useStore.getState().robotStatus);

      // 弹窗提示
      showNotifier({
        title: t('robot.gunError'),
        message: t('robot.gunErrorTips'),
        type: 'error',
        duration: 3000,
        onPress: () => { },
      });
    };

    // 只有不在重启状态时，才建立订阅
    eventBus.subscribe(eventBusKey.GunErrorEvent, onGunError);

    return () => {
      // 状态切换时，自动销毁旧的订阅，清理现场
      eventBus.unsubscribe(eventBusKey.GunErrorEvent, onGunError);
    };
  }, []);

  //handleAppStateChange 处理应用状态变化时的逻辑
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    switch (nextAppState) {
      // active 相当于 Flutter 中的 resumed - 应用在前台可见且活跃
      case 'active':
        console.log('应用回到前台，恢复心跳和连接');
        if (await checkOnlineLoginValidity()) {
          await restartConnect();
        }
        break;

      // background 相当于 Flutter 中的 paused - 应用在后台运行
      case 'background':
        console.log('应用进入后台，心跳在后台可能被暂停');
        await checkOnlineLoginValidity();
        // 注意：React Native 在后台时 setTimeout/setInterval 可能被暂停
        // 但 TCP socket 连接本身会保持
        break;

      // inactive 应用正在切换状态时(如接电话、切换应用时)
      case 'inactive':
        console.log('应用不活跃状态');
        break;

      default:
        break;
    }
  };

  const restartConnect = async () => {
    if (isEspWifiConnectionInProgress()) {
      console.log('[ROBOT_RECONNECT_SKIPPED]', {
        reason: 'dedicated ESP WiFi connection is in progress',
      });
      return;
    }

    if (!ConnectDeviceInfo.connectStatus || !SocketManage.getInstance().isConnected()) {
      let currentSSID = '';
      try {
        currentSSID = (await WifiManager.getCurrentWifiSSID()) || '';
      } catch (error) {
        console.warn('[ROBOT_RECONNECT_SKIPPED] unable to read current WiFi', error);
        return;
      }

      if (currentSSID.indexOf(GlobalConst.wifiName) === -1) {
        console.log('[ROBOT_RECONNECT_SKIPPED]', {
          reason: 'current WiFi is not robot WiFi',
          ssid: currentSSID,
        });
        return;
      }

      GlobalActivityIndicatorManager.current?.show(t('robot.waitingForReconnection'), 0);

      await delayed(2000);

      await globalGetConnect();

      GlobalActivityIndicatorManager.current?.hide();

      GlobalDialogManager.current?.show({
        title: t('wifi.connectDialogTips'),
        content: t('wifi.connectDialogTitle'),
        callback: () => { },
      });
    }
  };

  const sendCmd = (cmd: Command) => {
    if (robotStatus.robotDangerStatus) {
      showNotifier({
        title: t('errors.robotDangerStatusTips'),
        type: 'error',
        duration: 3000,
        onPress: () => { },
      });
      setDebugLog({
        time: new Date().toISOString(),
        msg: `发送命令失败，机器人处于软急停状态，无法发送命令: ${cmd} `,
      });
      return;
    }
    const socket = SocketManage.getInstance();
    if (socket.isConnected()) {
      socket.writeData(`${GlobalConst.forwardCmd}${cmd}`);
      setDebugLog({
        time: new Date().toISOString(),
        msg: `成功发送命令: ${cmd}`,
      });
    } else {
      console.warn('[ROBOT_COMMAND_BLOCKED]', {
        cmd,
        connectStatus: ConnectDeviceInfo.connectStatus,
        socketConnected: socket.isConnected(),
        wifiIp: ConnectDeviceInfo.getWifiIp(),
      });
      showNotifier({
        title: t('errors.robotUnconnectedTips'),
        type: 'error',
        duration: 1500,
        onPress: () => { },
      });
      setDebugLog({
        time: new Date().toISOString(),
        msg: `发送命令失败，机器人未连接，无法发送命令: ${cmd} `,
      });
    }
  };

  const checkLogin = async (): Promise<boolean> => {
    try {
      const getUserInfoFromStorage = await userInfo.getItem();
      if (!getUserInfoFromStorage || getUserInfoFromStorage === null) {
        router.replace('/(login)');
        return false;
      }

      const sessionStatus = await getOnlineLoginSessionStatus();
      if (sessionStatus.expired) {
        console.log('[ONLINE_LOGIN_SESSION_EXPIRED]', sessionStatus);
        await redirectToLoginAfterSessionExpired();
        return false;
      }

      if (getUserInfoFromStorage && getUserInfoFromStorage !== '') {
        const parseJson = await JSON.parse(getUserInfoFromStorage || '{}');
        if (
          parseJson.id &&
          parseJson.username === canLoginInfo.name &&
          parseJson.password === canLoginInfo.password
        ) {
          console.log('登录成功');
        }
      }
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const checkOnlineLoginValidity = async (): Promise<boolean> => {
    try {
      const sessionStatus = await getOnlineLoginSessionStatus();

      if (sessionStatus.reason === 'missing') {
        return false;
      }

      if (sessionStatus.expired) {
        console.log('[ONLINE_LOGIN_SESSION_EXPIRED]', sessionStatus);
        await redirectToLoginAfterSessionExpired();
        return false;
      }

      return true;
    } catch (error) {
      console.log('checkOnlineLoginValidity error', error);
      return false;
    }
  };

  const redirectToLoginAfterSessionExpired = async () => {
    if (sessionRedirectingRef.current) {
      return;
    }

    sessionRedirectingRef.current = true;
    try {
      SocketManage.getInstance().disconnectSocket();

      try {
        await releaseEspWifiFromSystem();
      } catch (error) {
        console.warn('releaseEspWifiFromSystem error', error);
      }

      await Promise.all([userInfo.removeItem(), clearOnlineLoginAt()]);
      router.replace('/(root)/(login)');
      showNotifier({
        title: t('errors.sessionExpired', {
          days: ONLINE_LOGIN_VALIDITY_DAYS,
        }),
        type: 'info',
        duration: 5000,
        onPress: () => {},
      });
    } finally {
      sessionRedirectingRef.current = false;
    }
  };

  const databaseInit = async () => {
    await database.init();
    await database.initDatabase();
    const userList = await database.getUser();
    if (userList.length > 0) {
      setCanLoginInfo(userList[0]);
    }
  };

  return <EventHandler />;
};
