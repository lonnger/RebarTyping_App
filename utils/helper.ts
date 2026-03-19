import { NetworkInfo } from 'react-native-network-info';
import WifiManager from 'react-native-wifi-reborn';

import { ConnectDeviceInfo } from './connectDeviceInfo';
import eventBus from './eventBus';
import { showNotifier } from './notifier';
import { SocketManage } from './socketManage';

import { GlobalConst } from '@/constants';
import { Command } from '@/constants/command';
import { eventBusKey } from '@/constants/event';
import i18n from '@/i18n/i18n';
export const delayed = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const globalGetConnect = async () => {
  try {
    const connectedWifiSSID = await WifiManager.getCurrentWifiSSID();
    if (connectedWifiSSID !== '') {
      const getGatewayIp = await NetworkInfo.getGatewayIPAddress();
      if (
        connectedWifiSSID !== '' &&
        getGatewayIp !== null &&
        connectedWifiSSID.indexOf(GlobalConst.wifiName) > -1
      ) {
        ConnectDeviceInfo.setWifiIp(getGatewayIp);
        const socket = SocketManage.getInstance();
        const ip = getGatewayIp;
        const port = ConnectDeviceInfo.wifiPort;

        if (ip !== '' && port !== 0) {
          // 设置WiFi IP 和 port
          socket.setWifi(ip, port);
          // 连接socket
          socket.connectSocket();
        } else {
          showNotifier({
            title: i18n.t('wifi.missingIpOrPort'),
            message: '',
            type: 'error',
            duration: 3000,
            onPress: () => {},
          });
        }
      }
    } else {
      showNotifier({
        title: i18n.t('wifi.noWifiConnected'),
        message: '',
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    }
  } catch (error) {
    showNotifier({
      title: i18n.t('wifi.networkStatusFailed'),
      message: '',
      type: 'error',
      duration: 3000,
      onPress: () => {},
    });
  }
};

export const sendCmdDispatch = (cmd: Command) => {
  eventBus.publish(eventBusKey.SendCmdEvent, cmd);
};
export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

// 后板log数据解析 rebarLaser:0,motorTault:0,ultrasonValue:0,motorState:0,right:0,left:0,edge:0
export const parserBackBoardData = (data: string) => {
  const listStr = data.split(',');
  const rebarLaser = String(listStr?.[0]);
  const motorTault = String(listStr?.[1]);
  const ultrasonValue = String(listStr?.[2]);
  const motorState = String(listStr?.[3]);
  const right = String(listStr?.[4]);
  const left = String(listStr?.[5]);
  const edge = String(listStr?.[6]);
  const returnData = {
    rebarLaser: {
      type: rebarLaser.split(':')?.[0],
      value: rebarLaser.split(':')?.[1],
    },
    motorTault: {
      type: motorTault.split(':')?.[0],
      value: motorTault.split(':')?.[1],
    },
    ultrasonValue: {
      type: ultrasonValue.split(':')?.[0],
      value: ultrasonValue.split(':')?.[1],
    },
    motorState: {
      type: motorState.split(':')?.[0],
      value: motorState.split(':')?.[1],
    },
    right: {
      type: right.split(':')?.[0],
      value: right.split(':')?.[1],
    },
    left: {
      type: left.split(':')?.[0],
      value: left.split(':')?.[1],
    },
    edge: {
      type: edge.split(':')?.[0],
      value: edge.split(':')?.[1],
    },
  };
  const logStr = `后板数据:-----start----- \n
      rebarLaser: ${returnData.rebarLaser.value}, \n
      motorTault: ${returnData.motorTault.value}, \n
      ultrasonValue: ${returnData.ultrasonValue.value}, \n
      motorState: ${returnData.motorState.value}, \n
      right: ${returnData.right.value}, \n
      left: ${returnData.left.value}, \n
      edge: ${returnData.edge.value} \n
      ------------------------end------------------------------------ \n`;
  return logStr;
};

// MKS log数据解析  bC:0,bT:0,fC:0,fT:0,wC:0,wT:0,lC:0,lT:0,gC:0,gT:0
export const parserMksData = (data: string) => {
  const listStr = data.split(',');
  const backChangeLaser = String(listStr?.[0]);
  const backMotorTault = String(listStr?.[1]);
  const frontChangeLaser = String(listStr?.[2]);
  const frontMotorTault = String(listStr?.[3]);
  const wheelChangeLaser = String(listStr?.[4]);
  const wheelMotorTault = String(listStr?.[5]);
  const leftChangeLaser = String(listStr?.[6]);
  const leftMotorTault = String(listStr?.[7]);
  const gc = String(listStr?.[8]);
  const gt = String(listStr?.[9]);
  const mksData = {
    backChangeLaser: {
      type: backChangeLaser.split(':')?.[0],
      value: backChangeLaser.split(':')?.[1],
    },
    backMotorTault: { 
      type: backMotorTault.split(':')?.[0],
      value: backMotorTault.split(':')?.[1],
    },
    frontChangeLaser: {
      type: frontChangeLaser.split(':')?.[0],
      value: frontChangeLaser.split(':')?.[1],
    },
    frontMotorTault: {
      type: frontMotorTault.split(':')?.[0],
      value: frontMotorTault.split(':')?.[1],
    },
    wheelChangeLaser: {
      type: wheelChangeLaser.split(':')?.[0],
      value: wheelChangeLaser.split(':')?.[1],
    },
    wheelMotorTault: {
      type: wheelMotorTault.split(':')?.[0],
      value: wheelMotorTault.split(':')?.[1],
    },
    leftChangeLaser: {
      type: leftChangeLaser.split(':')?.[0],
      value: leftChangeLaser.split(':')?.[1],
    },
    leftMotorTault: {
      type: leftMotorTault.split(':')?.[0],
      value: leftMotorTault.split(':')?.[1],
    },
    gc: {
      type: gc.split(':')?.[0],
      value: gc.split(':')?.[1],
    },
    gt: {
      type: gt.split(':')?.[0],
      value: gt.split(':')?.[1],
    },
  };

  const logStr = `后板数据: -----start----- \n 
        bC:${mksData.backChangeLaser.value}, \n
        bT:${mksData.backMotorTault.value}, \n
        fC:${mksData.frontChangeLaser.value}, \n
        fT:${mksData.frontMotorTault.value}, \n
        wC:${mksData.wheelChangeLaser.value}, \n
        wT:${mksData.wheelMotorTault.value}, \n
        lC:${mksData.leftChangeLaser.value}, \n
        lT:${mksData.leftMotorTault.value}, \n
        gc:${mksData.gc.value}, \n
        gt:${mksData.gt.value} \n
        ------------------------end---------------------- \n`;
  return logStr;
};

// 前板log数据解析 // changeLaser:0,motorTault:0,ultrasonValue:0,motorState:0,right:0,left:0,edge:0
export const parserFrontBoardData = (data: string) => {
  const listStr = data.split(',');
  const changeLaser = String(listStr?.[0]);
  const motorTault = String(listStr?.[1]);
  const ultrasonValue = String(listStr?.[2]);
  const motorState = String(listStr?.[3]);
  const right = String(listStr?.[4]);
  const left = String(listStr?.[5]);
  const edge = String(listStr?.[6]);
  const returnData = {
    changeLaser: {
      type: changeLaser.split(':')?.[0],
      value: changeLaser.split(':')?.[1],
    },
    motorTault: {
      type: motorTault.split(':')?.[0],
      value: motorTault.split(':')?.[1],
    },
    ultrasonValue: {
      type: ultrasonValue.split(':')?.[0],
      value: ultrasonValue.split(':')?.[1],
    },
    motorState: {
      type: motorState.split(':')?.[0],
      value: motorState.split(':')?.[1],
    },
    right: {
      type: right.split(':')?.[0],
      value: right.split(':')?.[1],
    },
    left: {
      type: left.split(':')?.[0],
      value: left.split(':')?.[1],
    },
    edge: {
      type: edge.split(':')?.[0],
      value: edge.split(':')?.[1],
    },
  };

  const logStr = `前板数据: -----start----- \n
      changeLaser: ${returnData.changeLaser.value}, \n
      motorTault: ${returnData.motorTault.value}, \n
      ultrasonValue: ${returnData.ultrasonValue.value}, \n
      motorState: ${returnData.motorState.value}, \n
      right: ${returnData.right.value}, \n
      left: ${returnData.left.value}, \n
      edge: ${returnData.edge.value} \n
      ------------------------end---------------------\n
    `;
  return logStr;
};


export const sendCmdWithRepeat = (
  sendCmdVoid: () => void,
  repeatCount: number = 3,
  intervalMs: number = 100
): void => {
  let i = repeatCount;
  const sendNext = () => {
    if (i-- > 0) {
      console.log('sendCmdWithRepeat', i);
      sendCmdVoid();

      if (i > 0) {
        setTimeout(sendNext, intervalMs);
      }
    }
  };

  sendNext();
};
