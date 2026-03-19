import { TyingState } from '@/constants';

export class ConnectDeviceInfo {
  private static _wifiIp: string = ''; // wifi的IP地址
  static connectStatus: boolean = false; // wifi是否连接成功
  static wifiPort: number = 8080; // wifi服务端的端口
  static electric: number = 100; // 电量
  static id: string = '1111111'; // 机器id
  static workStatus: TyingState.work; //机器当前的工作状态
  static isStop: boolean = false; // 机器是否处于急停状态
  static errorInfo: string[] = [
    '电量低于10%',
    '电量低于20%',
    '机身倾斜过大',
    '超声波检测故障',
    '条形激光检测故障',
    '前接近开关无信号',
    '后接近开关无信号',
    '前、后横移电机过负载',
    '前、后轮毂电机过负载',
    'MKS电机过负载',
    '绑扎抢故障',
    '丝盘余量不足',
    '变轨失败',
  ];

  static disConnect(): void {
    this.connectStatus = false;
    this._wifiIp = '';
    this.electric = 0;
    this.id = '000001';
  }

  static setWifiIp(fIp: string): void {
    this._wifiIp = fIp;
  }

  static getWifiIp(): string {
    return this._wifiIp;
  }

  static getErrorInfo(errorId: number): string {
    return this.errorInfo[errorId];
  }
}
