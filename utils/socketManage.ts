/* eslint-disable no-case-declarations */
import TcpSocket from 'react-native-tcp-socket';

import { ConnectDeviceInfo } from './connectDeviceInfo';
import eventBus from './eventBus';
import {
  ElectricEvent,
  IdEvent,
  ErrorEvent,
  StatusEvent,
  OverageEvent,
  OrbitEvent,
  NodeEvent,
  OrbitChangeEvent,
  NodeChangeEvent,
  ChangeEvent,
  RebootEvent,
  DownEvent,
  WifiEvent,
  GunErrorEvent,
} from './events';
import {
  globalGetConnect,
  parserBackBoardData,
  parserFrontBoardData,
  parserMksData,
} from './helper';
import { showNotifier } from './notifier';

import { GlobalActivityIndicatorManager } from '@/components/activity-indicator-global';
import { GlobalConst, TyingState } from '@/constants';
import { Command } from '@/constants/command';
import i18n from '@/i18n/i18n';
import useStore from '@/store';

//通过TCP Socket连接机器人，发送心跳包维持连接，并处理接收的数据
export class SocketManage {
  private static instance: SocketManage;
  private ip: string;
  private port: number;
  private socket!: TcpSocket.Socket | null;

  // 心跳相关属性
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatMessage = `${GlobalConst.forwardCmd}:${Command.Heartbeat}`;
  private heartbeatIntervalMs = 15000; // 15秒发送一次心跳
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeoutMs = 5000; // 5秒心跳超时
  private heartbeatMissedCount = 0;
  private maxHeartbeatMissed = 3; // 允许连续3次心跳未响应
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3秒后重试

  // 初始连接重试相关
  private initialConnectAttempts = 0;
  private maxInitialConnectAttempts = 3;
  private initialConnectDelay = 2000; // 2秒后重试

  // 添加一个缓冲区属性
  private dataBuffer: string = '';
  // 添加一个属性记录上次发送枪报错的时间
  private lastGunErrorTime: number = 0;
  private readonly GUN_ERROR_MIN_GAP = 3000; // 3秒内只允许发一次报错给业务层
  // 私有构造函数，确保只能通过getInstance方法获取实例
  private constructor() {
    this.ip = '';
    this.port = 8080;
  }

  // 获取全局唯一的单例实例
  public static getInstance(): SocketManage {
    if (!SocketManage.instance) {
      SocketManage.instance = new SocketManage();
    }
    return SocketManage.instance;
  }
  //设置WiFi连接的IP和端口
  setWifi(ip: string, port: number) {
    this.ip = ip;
    this.port = port;
  }
  //建立TCP Socket连接，并设置事件监听器处理连接成功、接收数据、错误和连接关闭等事件。
  // 同时实现心跳机制维持连接，并在连接丢失时尝试重连。
  async connectSocket() {
    if (!this.ip || !this.port) {
      console.error('ip or port is not set');
      return;
    }

    try {
      // 创建TCP Socket连接，而不是WebSocket
      const options = {
        host: this.ip,
        port: this.port,
      };

      // 在创建新连接前，确保移除旧的事件监听器
      if (this.socket) {
        this.socket.removeAllListeners('data');
        this.socket.removeAllListeners('error');
        this.socket.removeAllListeners('close');
      }
      // 创建新的TCP Socket连接
      const socket = TcpSocket.createConnection(options, () => {
        ConnectDeviceInfo.setWifiIp(this.ip);   // 设置连接的IP地址
        ConnectDeviceInfo.connectStatus = true; // 更新连接状态
        this.resetReconnectCount();             // 重置重连尝试计数
        // 重置初始连接尝试计数
        this.initialConnectAttempts = 0;

        // 启动心跳
        this.startHeartbeat();

        // 发送登录成功命令
        this.writeData(`${GlobalConst.forwardCmd}:${Command.loginSuccess}`);

        // 发布WiFi连接成功事件
        eventBus.publish(new WifiEvent(true).eventName, new WifiEvent(true).data);
        GlobalActivityIndicatorManager.current?.show(i18n.t('wifi.socketConnected'));
      });
      this.socket = socket;

      // 绑定事件监听器
      this.socket?.on('data', (data) => {
        try {
          // 将新数据添加到缓冲区
          this.dataBuffer += data.toString();  // 将接收到的数据转换为字符串并追加到缓冲区

          // 处理缓冲区中的完整消息
          this.processBuffer();                //拆包
        } catch (error) {
          console.error('onData error', error);
        }
      });

      // 处理连接错误
      this.socket?.on('error', (error) => {
        console.error('socket error', error);
        // 处理初始连接错误
        this.handleInitialConnectionError();
      });

      // 处理连接关闭
      this.socket?.on('close', () => {
        console.log('socket closed');
        this.onDone();
      });
    } catch (error) {
      console.error('Unable to connect:', error);
      // 处理初始连接错误
      this.handleInitialConnectionError();
    }
  }

  // 连接断开时的处理逻辑，包括停止心跳、更新连接状态、发布WiFi断开事件，并尝试重新连接。
  onDone() {
    // 停止心跳
    this.stopHeartbeat();
    ConnectDeviceInfo.disConnect();
    eventBus.publish(new WifiEvent(false).eventName, new WifiEvent(false).eventName);
    showNotifier({
      title: i18n.t('wifi.reconnecting'),
      message: '',
      type: 'info',
      duration: 3000,
      onPress: () => {},
    });
    setTimeout(() => {
      globalGetConnect();
    }, 2000);
  }
  // 处理接收到的数据，根据不同的命令类型解析数据并发布相应的事件，同时使用store记录调试日志。
  onData(event: string) {
    try {
      const eventData = event;
      //console.log(`>>> [SOCKET_RAW] 收到原始数据: ${eventData}`);
      // 如果消息包含 'up'，表示机器人还活着，处理心跳响应
      if (eventData.includes('up')) {
        this.handleHeartbeatResponse();
      }

      // 解析消息：格式通常为 "前缀:指令名:数据"
      const listStr = eventData.split(':');
      const commandPrefix = listStr[0];
      const commandName = listStr[1];

      // 只处理来自机器人的上行消息 (forwardUp)
      if (commandPrefix === GlobalConst.forwardUp) {
        // 正确使用store更新调试日志和数据状态
        const { setDebugLog, setBackBoardData, setMksData, setFrontBoardData } =
          useStore.getState();
        // 记录调试日志
          setDebugLog({
          time: new Date().toISOString(),
          msg: `收到命令: ${eventData}`,
        });
        // 根据指令名，分发到不同的处理逻辑
        switch (commandName) {
          case GlobalConst.id:
            ConnectDeviceInfo.id = listStr?.[2]; // 更新连接设备信息中的ID
            eventBus.publish(new IdEvent(listStr?.[2]).eventName, new IdEvent(listStr?.[2]).data);
            break;
          case GlobalConst.gunErrorEvent:            // 枪口报错事件
            const now = Date.now();
            if (now - this.lastGunErrorTime < this.GUN_ERROR_MIN_GAP) {
              console.warn('Gun error event ignored due to minimum gap');
              break;
            }
            this.lastGunErrorTime = now;
            eventBus.publish(new GunErrorEvent(1).eventName, new GunErrorEvent(1).data);
            break;
          case GlobalConst.electric:               // 电量数据事件
            const temp = parseFloat(listStr?.[2]);
            ConnectDeviceInfo.electric = temp;
            eventBus.publish(new ElectricEvent(temp).eventName, new ElectricEvent(temp).data);
            break;
          case GlobalConst.status:                // 工作状态事件
            let temp2;
            if (listStr[2] === `2,${GlobalConst.error}`) {
              temp2 = TyingState.error;
              const faultId = parseInt(listStr?.[3], 10);
              eventBus.publish(new ErrorEvent(faultId).eventName, new ErrorEvent(faultId).data);
            } else {
              temp2 = parseInt(listStr[2], 10);
            }
            ConnectDeviceInfo.workStatus = temp2;
            eventBus.publish(new StatusEvent(temp2).eventName, new StatusEvent(temp2).data);
            break;
          case GlobalConst.overage:
            const temp3 = parseFloat(listStr?.[2]);
            eventBus.publish(new OverageEvent(temp3).eventName, new OverageEvent(temp3).data);
            break;
          case GlobalConst.orbitLaser:
            const temp4 = parseFloat(listStr?.[2]);
            eventBus.publish(new OrbitEvent(temp4).eventName, new OrbitEvent(temp4).data);
            break;
          case GlobalConst.nodeLaser:
            const temp5 = parseFloat(listStr?.[2]);
            eventBus.publish(new NodeEvent(temp5).eventName, new NodeEvent(temp5).data);
            break;
          case GlobalConst.orbitChangeLaser:
            const temp6 = parseFloat(listStr?.[2]);
            eventBus.publish(
              new OrbitChangeEvent(temp6).eventName,
              new OrbitChangeEvent(temp6).data
            );
            break;
          case GlobalConst.nodeChangeLaser:
            const temp7 = parseFloat(listStr?.[2]);
            eventBus.publish(new NodeChangeEvent(temp7).eventName, new NodeChangeEvent(temp7).data);
            break;
          case GlobalConst.changeStatus:
            const temp8 = parseInt(listStr?.[2], 10);
            eventBus.publish(new ChangeEvent(temp8).eventName, new ChangeEvent(temp8).data);
            break;
          case GlobalConst.rebootStatus:
            const temp9 = parseInt(listStr?.[2], 10);
            eventBus.publish(new RebootEvent(temp9).eventName, new RebootEvent(temp9).data);
            break;
          case GlobalConst.downStatus:
            const temp10 = parseInt(listStr?.[2], 10);
            eventBus.publish(new DownEvent(temp10).eventName, new DownEvent(temp10).data);
            break;
          case GlobalConst.backBoard:
            const pstr = listStr?.slice(2).join(':');
            const parserData = parserBackBoardData(pstr);
            setDebugLog({
              time: new Date().toISOString(),
              msg: `收到后板数据: ${parserData}`,
            });
            setBackBoardData(parserData);
            break;
          case GlobalConst.frontBoard:
            const pstr1 = listStr?.slice(2).join(':');
            const parserData1 = parserFrontBoardData(pstr1);
            setDebugLog({
              time: new Date().toISOString(),
              msg: `收到前板数据: ${parserData1}`,
            });
            setFrontBoardData(parserData1);
            break;
          case GlobalConst.mks:
            const pstr2 = listStr?.slice(2).join(':');
            const parserData2 = parserMksData(pstr2);
            setDebugLog({
              time: new Date().toISOString(),
              msg: `收到MKS数据: ${parserData2}`,
            });
            setMksData(parserData2);
            break;
          default:
        }
      }
    } catch (error) {
      console.error('onData error', error);
    }
  }
  //发送数据的方法，首先检查连接状态，如果已连接则通过socket发送数据，否则显示错误通知提示用户检查网络连接。
  writeData(fd: string) {
    try {
      if (ConnectDeviceInfo.connectStatus && this.socket) {
        this.socket.write(fd);
      } else {
        showNotifier({
          title: i18n.t('wifi.socketNotConnected'),
          message: i18n.t('wifi.checkNetworkConnection'),
          type: 'error',
          duration: 3000,
          onPress: () => {},
        });
      }
    } catch (error) {
      showNotifier({
        title: `writeData error ${error}`,
        message: i18n.t('wifi.checkNetworkConnection'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    }
  }
  //检查当前是否连接
  isConnected() {
    if (!this.socket) {
      return false;
    }

    // 如果socket已被销毁，则表示未连接
    if (this.socket.destroyed) {
      return false;
    }

    // 对于react-native-tcp-socket，可以检查这些属性
    // connecting为true表示正在连接
    // 只有当!destroyed && !connecting && !closing时才是真正已连接状态
    return !this.socket.connecting;
  }

  // 启动心跳定时器
  private startHeartbeat() {
    // 清除可能存在的旧心跳
    this.stopHeartbeat();

    // 设置新的心跳
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        try {
          // 发送心跳包
          this.writeData(this.heartbeatMessage);

          // 设置心跳超时
          this.setHeartbeatTimeout();
        } catch (error) {
          console.error('发送心跳包失败:', error);
          // 不立即处理连接丢失，而是增加心跳未响应计数
          this.handleHeartbeatMissed();
        }
      } else {
        console.warn('心跳跳过，连接状态为false');
      }
    }, this.heartbeatIntervalMs);
  }

  // 恢复心跳（用于从后台恢复）
  public resumeHeartbeat() {
    this.heartbeatMissedCount = 0;
    if (!this.heartbeatInterval) {
      this.startHeartbeat();
    }
  }

  // 设置心跳超时
  private setHeartbeatTimeout() {
    // 清除可能存在的旧超时
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    // 设置新的超时
    this.heartbeatTimeout = setTimeout(() => {
      this.handleHeartbeatMissed();
    }, this.heartbeatTimeoutMs);
  }

  // 处理心跳未响应
  private handleHeartbeatMissed() {
    this.heartbeatMissedCount++;
    console.log(`心跳未响应次数: ${this.heartbeatMissedCount}/${this.maxHeartbeatMissed}`);

    // 只有当连续多次心跳未响应时，才考虑重连
    if (this.heartbeatMissedCount >= this.maxHeartbeatMissed) {
      // 暂时不处理，机器人端没办法升级，只能等机器人端升级了
      console.log('心跳连续多次未响应，尝试重连');
      // this.handleConnectionLost();
    }
  }

  // 处理心跳响应
  private handleHeartbeatResponse() {
    // 重置心跳未响应计数
    this.heartbeatMissedCount = 0;

    // 清除心跳超时
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    // 重置心跳未响应计数
    this.heartbeatMissedCount = 0;
  }

  // 处理连接丢失
  private handleConnectionLost() {
    console.log('检测到连接丢失，尝试重连');
    this.stopHeartbeat();

    // 更新连接状态
    ConnectDeviceInfo.disConnect();

    // 如果重连次数未超过最大尝试次数，则尝试重连
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      // 通知用户正在重连
      showNotifier({
        title: `${i18n.t('wifi.networkDisconnected')} (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
        message: '',
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });

      // 延迟重连，避免立即重连可能导致的问题
      setTimeout(() => {
        this.connectSocket();
      }, this.reconnectDelay);
    } else {
      console.error('重连失败，已达到最大尝试次数');
      // 通知用户连接已断开
      showNotifier({
        title: i18n.t('wifi.wifiDisconnected'),
        message: i18n.t('wifi.wifiDisconnected'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });

      // 发布WiFi断开事件
      eventBus.publish(new WifiEvent(false).eventName, new WifiEvent(false).data);
    }
  }

  private resetReconnectCount() {
    this.reconnectAttempts = 0;
  }

  // 处理初始连接错误
  private handleInitialConnectionError() {
    // 如果已经连接成功过，则不进行初始连接重试
    if (ConnectDeviceInfo.connectStatus) {
      return;
    }

    this.initialConnectAttempts++;
    console.log(
      `初始连接失败，尝试重试 (${this.initialConnectAttempts}/${this.maxInitialConnectAttempts})`
    );

    if (this.initialConnectAttempts < this.maxInitialConnectAttempts) {
      // 显示重试提示
      showNotifier({
        title: i18n.t('wifi.connectionFailed'),
        message: `${i18n.t('wifi.retrying')} (${this.initialConnectAttempts}/${this.maxInitialConnectAttempts})`,
        type: 'warning',
        duration: 2000,
        onPress: () => {},
      });

      // 延迟后重试
      setTimeout(() => {
        this.connectSocket();
      }, this.initialConnectDelay);
    } else {
      // 3次都失败，显示最终失败提示
      console.error('初始连接失败，已达到最大尝试次数');
      GlobalActivityIndicatorManager.current?.show(i18n.t('wifi.wificonnectfailed'));
      showNotifier({
        title: i18n.t('wifi.connectionFailedTitle'),
        message: i18n.t('wifi.connectionFailedMessage'),
        type: 'error',
        duration: 5000,
        onPress: () => {},
      });
      ConnectDeviceInfo.disConnect();
      // 重置计数，以便下次连接可以重新尝试
      this.initialConnectAttempts = 0;
    }
  }

  // 断开连接方法
  disconnectSocket() {
    // 停止心跳
    this.stopHeartbeat();

    if (this.socket) {
      this.socket.destroy();
    }
  }

  // 添加处理缓冲区的方法
  private processBuffer() {
    // 假设消息以换行符结束，根据实际情况调整
    const messages = this.dataBuffer.split('\n');

    // 保留最后一个可能不完整的消息
    this.dataBuffer = messages.pop() || '';

    // 处理完整的消息
    for (const message of messages) {
      if (message.trim()) {
        this.onData(message);
      }
    }
  }
}
