import { create } from 'zustand';

import { ChangeState, DownState, RebootState, workParamsRange } from '@/constants';
import { DIRECTION, ROBOT_CURRENT_MODE, ROBOT_WORK_MODE } from '@/types';

interface State {
  authenticationStatus: 'checking' | 'authenticated' | 'unauthenticated';
  setAuthenticationStatus: (status: State['authenticationStatus']) => void;
  canLoginInfo: {
    company: string;
    id: number;
    name: string;
    number: string;
    password: string;
    position: string;
  };
  setCanLoginInfo: (newInfo: { [key: string]: any }) => void;
  robotStatus: {
    robotDangerStatus: boolean;
    robotLockedStatus: boolean;
    movementDirection: 'idle' | 'forward' | 'backward';
    direction: Map<DIRECTION, boolean>;
    currentMode: ROBOT_CURRENT_MODE;
    currentBindingMode: ROBOT_WORK_MODE | '';
    isWorking: boolean;
    skip_binding_count: number;
    downState: DownState;
    rebootState: RebootState;
    changeState: ChangeState;
    electric: number;
    wifiConnectStatus: boolean;
    currentConnectWifiSSID: string;
    currentConnectWifiPassword: string;
  };
  setRobotStatus: (newInfo: Partial<State['robotStatus']>) => void;
  userInfo: {
    username: string;
    password: string;
  };
  setUserInfo: (newInfo: { [key: string]: any }) => void;
  workParams: {
    track_laser_range: string;
    node_laser_range: string;
    upper_layer_diameter: string;
    lower_layer_diameter: string;
    lower_steel_bar_length: string;
    binding_timeout: string;
    ultrasonic_waves: boolean;
    prevent_falling_laser: boolean;
    auto_find_point: boolean;
    inputOrbitMax: number;
    inputNodeMax: number;
  };
  data_inspect: {
    identified_node_count: number;
    lashed_count: number;
    overage_num: number;
    node_laser_num: number;
    track_laser_num: number;
  };
  setWorkParams: (newInfo: Partial<State['workParams']>) => void;
  errorGroup: {
    errorId: number;
  }[];
  errorHistory: {
    errorId: number;
  }[];
  setDataInspect: (newInfo: Partial<State['data_inspect']>) => void;
  setErrorGroup: (newInfo: { errorId: number }) => void;
  removeErrorGroup: (errorId: number) => void;
  clearErrorHistory: () => void;
  debugLog: {
    time: string;
    msg: string;
  }[];
  setDebugLog: (newInfo: { time: string; msg: string }) => void;
  clearDebugLog: () => void;
  logStatus: 'stop' | 'start';
  setLogStatus: (newInfo: 'stop' | 'start') => void;
  mksData: string;
  setMksData: (str: string) => void;
  backBoardData: string;
  setBackBoardData: (str: string) => void;
  frontBoardData: string;
  setFrontBoardData: (str: string) => void;
}

export const initWorkParams = {
  track_laser_range: '104.5', // 变轨激光初始值
  node_laser_range: '74.5', // 节点激光初始值
  upper_layer_diameter: '20', // 上层钢筋直径初始值
  lower_layer_diameter: '22', // 下层钢筋直径初始值
  lower_steel_bar_length: '22', // 下层钢筋长度初始值
  binding_timeout: '20', // 绑扎超时时间初始值
  ultrasonic_waves: true, // 超声波初始值
  prevent_falling_laser: false, // 防坠落激光默认关闭
  auto_find_point: false, // 自动寻点开关初始值
  inputOrbitMax: workParamsRange.orbitMax, // 变轨激光最大值
  inputNodeMax: workParamsRange.nodeMax, // 节点激光最大值
};

export const useStore = create<State>((set) => ({
  authenticationStatus: 'checking',
  setAuthenticationStatus: (authenticationStatus) => set({ authenticationStatus }),
  robotStatus: {
    electric: 100, // 电量
    robotDangerStatus: false, // 软急停状态
    robotLockedStatus: false, // 锁止状态
    movementDirection: 'idle', // 操作界面运动动画状态
    direction: new Map([
      // 前进方向
      [DIRECTION.UP, false],
      [DIRECTION.DOWN, false],
      [DIRECTION.LEFT, false],
      [DIRECTION.RIGHT, false],
    ]),
    currentMode: ROBOT_CURRENT_MODE.LOCKED, // 当前模式
    currentBindingMode: '', // 当前绑扎模式
    isWorking: false, // 机器人是否在工作
    skip_binding_count: 1, // 默认跳扎数
    downState: DownState.finish, // 机器人下降状态
    rebootState: RebootState.finish, // 机器复位状态
    changeState: ChangeState.finish, // 机器变轨状态
    wifiConnectStatus: false, // WiFi连接状态
    currentConnectWifiSSID: '', // WiFi连接SSID
    currentConnectWifiPassword: '', // WiFi连接密码
  },
  data_inspect: {
    identified_node_count: 0, // 已识别节点数量
    lashed_count: 0, // 已完成绑扎数量
    overage_num: 0, // 卷丝余量
    node_laser_num: 0, // 节点激光初始值
    track_laser_num: 0, // 变轨激光初始值
  },
  setDataInspect: (newInfo: { [key: string]: any }) =>
    set((state) => ({ data_inspect: { ...state.data_inspect, ...newInfo } })),
  // 一个写死的登录信息
  canLoginInfo: {
    company: 'Castor Construction Robotics Limited',
    id: 0,
    name: 'Castor',
    number: '(852) 63688570  (86) 17602928471',
    password: 'hlzz',
    position:
      'Room 202, Building L, Phase 2, North Zone, Qianhaimenggongchang, Nanshan District, Shenzhen',
  },
  setCanLoginInfo: (newInfo: { [key: string]: any }) =>
    set((state) => ({ canLoginInfo: { ...state.canLoginInfo, ...newInfo } })),
  setRobotStatus: (newInfo: { [key: string]: any }) =>
    set((state) => ({
      robotStatus: {
        ...state.robotStatus,
        ...newInfo,
      },
    })),
  userInfo: {
    username: '',
    password: '',
  },
  setUserInfo: (newInfo: { [key: string]: any }) =>
    set((state) => ({ userInfo: { ...state.userInfo, ...newInfo } })),
  workParams: {
    track_laser_range: '104.5', // 变轨激光初始值
    node_laser_range: '74.5', // 节点激光初始值
    upper_layer_diameter: '20', // 上层钢筋直径初始值
    lower_layer_diameter: '22', // 下层钢筋直径初始值
    lower_steel_bar_length: '22', // 下层钢筋长度初始值
    binding_timeout: '20', // 绑扎超时时间初始值
    ultrasonic_waves: true, // 超声波初始值
    prevent_falling_laser: false, // 防坠落激光默认关闭
    auto_find_point: false, // 自动寻点开关初始值
    inputOrbitMax: workParamsRange.orbitMax, // 变轨激光最大值
    inputNodeMax: workParamsRange.nodeMax, // 节点激光最大值
  },
  setWorkParams: (newInfo: { [key: string]: any }) =>
    set((state) => ({
      workParams: {
        ...state.workParams,
        ...newInfo,
      },
    })),
  errorGroup: [],
  errorHistory: [],
  setErrorGroup: (newInfo: { errorId: number }) =>
    set((state) => {
      if (state.errorGroup.some((item) => item.errorId === newInfo.errorId)) {
        return state;
      }

      return {
        errorGroup: [newInfo, ...state.errorGroup],
        errorHistory: [newInfo, ...state.errorHistory],
      };
    }),
  removeErrorGroup: (errorId: number) =>
    set((state) => ({
      errorGroup: state.errorGroup.filter((item) => item.errorId !== errorId),
    })),
  clearErrorHistory: () => set({ errorHistory: [] }),
  debugLog: [],
  setDebugLog: (newInfo: { time: string; msg: string }) =>
    set((state) => {
      if (state.logStatus === 'start') {
        return {
          debugLog: [newInfo, ...state.debugLog].slice(0, 200), // 只保留最新的200条记录
        };
      }
      return {};
    }),
  logStatus: 'start',
  setLogStatus: (newInfo: 'stop' | 'start') => set((state) => ({ logStatus: newInfo })),
  clearDebugLog: () => set((state) => ({ debugLog: [] })),
  mksData: '',
  setMksData: (str: string) => {
    set((state) => ({
      mksData: str,
    }));
  },
  backBoardData: '',
  setBackBoardData: (str: string) => {
    set((state) => ({
      backBoardData: str,
    }));
  },
  frontBoardData: '',
  setFrontBoardData: (str: string) => {
    set((state) => ({
      frontBoardData: str,
    }));
  },
}));

export default useStore;
