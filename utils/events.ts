import { eventBusKey } from '@/constants/event';

// 语言提示通知
export class LanguageEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eLanguage: number) {
    this.eventName = eventBusKey.LanguageEvent;
    this.data = {
      eLanguage,
    };
  }
}

// wifi连接通知
export class WifiEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eConnect: boolean) {
    this.eventName = eventBusKey.WifiEvent;
    this.data = {
      eConnect,
    };
  }
}

// 软急停通知,true表示触发软急停,false表示解除软急停
export class StopEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eStop: boolean) {
    this.eventName = eventBusKey.StopEvent;
    this.data = {
      eStop,
    };
  }
}

// 电量通知
export class ElectricEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eElectric: number) {
    this.eventName = eventBusKey.ElectricEvent;
    this.data = {
      eElectric,
    };
  }
}
// 机器状态通知
export class StatusEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eStatus: number) {
    this.eventName = eventBusKey.StatusEvent;
    this.data = {
      eStatus,
    };
  }
}
// 机器ID通知
export class IdEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eId: string) {
    this.eventName = eventBusKey.IdEvent;
    this.data = {
      eId,
    };
  }
}

// 变轨激光
export class OrbitEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eLaser: number) {
    this.eventName = eventBusKey.OrbitEvent;
    this.data = {
      eLaser,
    };
  }
}

// 变轨激光范围
export class OrbitChangeEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eChangeLaser: number) {
    this.eventName = eventBusKey.OrbitChangeEvent;
    this.data = {
      eChangeLaser,
    };
  }
}
// 节点激光
export class NodeEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eLaser: number) {
    this.eventName = eventBusKey.NodeEvent;
    this.data = {
      eLaser,
    };
  }
}

// 枪械错误
export class GunErrorEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eError: number) {
    this.eventName = eventBusKey.GunErrorEvent;
    this.data = {
      eError,
    };
  }
}

// 节点激光范围
export class NodeChangeEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eChangeLaser: number) {
    this.eventName = eventBusKey.NodeChangeEvent;
    this.data = {
      eChangeLaser,
    };
  }
}

// 卷丝余量
export class OverageEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eRage: number) {
    this.eventName = eventBusKey.OverageEvent;
    this.data = {
      eRage,
    };
  }
}

// 变轨状态
export class ChangeEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eState: number) {
    this.eventName = eventBusKey.ChangeEvent;
    this.data = {
      eState,
    };
  }
}
// 复位状态
export class RebootEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eState: number) {
    this.eventName = eventBusKey.RebootEvent;
    this.data = {
      eState,
    };
  }
}
// 下降状态
export class DownEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eState: number) {
    this.eventName = eventBusKey.DownEvent;
    this.data = {
      eState,
    };
  }
}

// 错误信息
export class ErrorEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eError: number) {
    this.eventName = eventBusKey.ErrorEvent;
    this.data = {
      eError,
    };
  }
}

export class MksEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eMks: string) {
    this.eventName = eventBusKey.MksEvent;
    this.data = {
      eMks,
    };
  }
}

export class BackBoardEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eBackBoard: string) {
    this.eventName = eventBusKey.BackBoardEvent;
    this.data = {
      eBackBoard,
    };
  }
}

export class FrontBoardEvent {
  public eventName: eventBusKey;
  public data;
  constructor(eFrontBoard: string) {
    this.eventName = eventBusKey.FrontBoardEvent;
    this.data = {
      eFrontBoard,
    };
  }
}
