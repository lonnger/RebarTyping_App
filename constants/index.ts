export const storage_config = {
  LOCAL_STORAGE_USER_INFO: 'userInfo',
  LOCAL_STORAGE_LANGUAGE: 'language',
};

export enum GlobalConst {
  forwardUp = 'up', //上传消息前缀
  id = 'id',
  electric = 'electric',
  status = 'tyingState', //机器运行状态
  error = 'faultId', //故障id
  overage = 'overage', // 卷丝余量
  orbitLaser = 'orbitLaser', // 变轨激光
  nodeLaser = 'nodeLaser', // 节点激光
  orbitChangeLaser = 'orbitChangeLaser', //变轨激光范围
  nodeChangeLaser = 'nodeChangeLaser', //节点激光范围
  changeStatus = 'changed', //变轨状态
  rebootStatus = 'reboot', //复位状态
  downStatus = 'down', //机器下降状态
  wifiName = 'ESP', //需要的wifi中应该存在的字符串
  forwardCmd = 'cmd:', //指令命令前缀
  forwardData = 'param:', //参数命令前缀
  delay = 'delayed', //延时
  upDiam = 'upperLevelDiameter', //上层钢筋直径
  lowerDiam = 'lowerLevelDiameter', //下层钢筋直径
  lowerBar = 'lowerLevelSteelBars', //下层钢筋
  ultrasound = 'ultrasonic', //超声波,0关1开,下同
  strip = 'antiFallLaser', //防坠激光
  prevention = 'autoFindPoint', //自动寻点
  gunErrorEvent = 'gunError',
  backBoard = 'BackBoard', // 后板
  frontBoard = 'FrontBoard', // 前板
  mks = 'mks', // MKS
  oldTestLong = 'oldTestLong', // 老化测试长
  oldTestWidth = 'oldTestWidth', // 老化测试宽
  jumpNo = 'jumpNo', // 跳过扎数
}

///语言类型
///hans:简体中文
///hant:繁体中文
///en:英文
export enum LanguageType {
  hans = 0,
  hant = 1,
  en = 2,
}

///机器状态
///work:作业
///standby:待机
///error:故障
export enum TyingState {
  work = 0,
  standby = 1,
  error = 2,
}

///机器变轨状态
///move:正在变轨
///finish:变轨完成
export enum ChangeState {
  move = 0,
  finish = 1,
}

///机器复位状态
///rebooting:正在复位
///finish:复位完成
export enum RebootState {
  rebooting = 0,
  finish = 1,
}

///机器下降状态
///downing:正在下降
///finish:下降完成
export enum DownState {
  downing = 0,
  finish = 1,
}

///机器绑扎状态
///noTie:不扎状态
///jumpTie:满扎状态
///tie:跳扎状态
export enum TieState {
  noTie = 0,
  jumpTie = 1,
  tie = 2,
}

///输入参数设置
///orbitScopeMin:变轨激光最小值
///orbitScopeMax:变轨激光最大值
///nodeScopeMin:节点激光最小值
///nodeScopeMax:节点激光最大值
///topDiameter:上层钢筋直径
///downDiameter:下层钢筋直径
///bottomDiameter:下层钢筋'
///bottomTime:绑扎延时
export enum InputPara {
  orbitScopeMin = 0,
  orbitScopeMax = 1,
  nodeScopeMin = 2,
  nodeScopeMax = 3,
  topDiameter = 4,
  downDiameter = 5,
  bottomDiameter = 6,
  bottomTime = 7,
}

export const workParamsRange = {
  orbitInputMin: 100.0, // 变轨激光最小值
  orbitMax: 107.0, // 变轨激光最大值
  nodeMin: 68.0, // 节点激光最小值
  nodeMax: 75.0, // 节点激光最大值
  inputMin: 6, // 钢筋直径最小值
  inputMax: 25, // 钢筋直径最大值
};
