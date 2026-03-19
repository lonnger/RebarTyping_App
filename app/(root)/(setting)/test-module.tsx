import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { Button, Card, Dialog, Icon, Portal } from 'react-native-paper';

import OldTestModal from './old-test-modal';

import { DataMonitor } from '@/components/data-monitor';
import { Header } from '@/components/header';
import { LogItem } from '@/components/logs';
import { GlobalConst } from '@/constants';
import { Command } from '@/constants/command';
import useStore from '@/store';
import { sendCmdDispatch } from '@/utils/helper';
import { showNotifier } from '@/utils/notifier';
import { SocketManage } from '@/utils/socketManage';

export default function TestModule() {
  const router = useRouter();
  const {
    debugLog,
    clearDebugLog,
    logStatus,
    setLogStatus,

    backBoardData,
    mksData,
    frontBoardData,
  } = useStore((state) => state);
  const [isShowlog, setIsShowLog] = useState(false);
  const [isShowOldTestModal, setIsShowOldTestModal] = useState(false);
  const setDebugLog = useStore((state) => state.setDebugLog);

  const goback = () => {
    router.back();
  };

  const toggleFullscreen = () => {
    setIsShowLog(!isShowlog);
  };

  const openDebugMode = () => {
    sendCmdDispatch(Command.wifiTest);
  };

  const openDebugCommand = (command: Command) => {
    switch (command) {
      case Command.sliderLeftTest:
        sendCmdDispatch(Command.sliderLeftTest);
        break;
      case Command.sliderRightTest:
        sendCmdDispatch(Command.sliderRightTest);
        break;
      case Command.holdDownTest:
        sendCmdDispatch(Command.holdDownTest);
        break;
      case Command.holdUpTest:
        sendCmdDispatch(Command.holdUpTest);
        break;
      case Command.legsDownTest:
        sendCmdDispatch(Command.legsDownTest);
        break;
      case Command.legsUpTest:
        sendCmdDispatch(Command.legsUpTest);
        break;
      case Command.gunDownTest:
        sendCmdDispatch(Command.gunDownTest);
        break;
      case Command.gunUpTest:
        sendCmdDispatch(Command.gunUpTest);
        break;
      case Command.lunForward:
        sendCmdDispatch(Command.lunForward);
        break;
      case Command.lunBackward:
        sendCmdDispatch(Command.lunBackward);
        break;
      case Command.lunStop:
        sendCmdDispatch(Command.lunStop);
        break;
      case Command.GunTrigger:
        sendCmdDispatch(Command.GunTrigger);
        break;
      case Command.GunReboot:
        sendCmdDispatch(Command.GunReboot);
        break;
      case Command.OldTest:
        setIsShowOldTestModal(true);
        break;
      case Command.stopOldTest:
        sendCmdDispatch(Command.stopOldTest);
        break;
      default:
        break;
    }
  };

  const sendDataSpecial = (fClass: string, fData: number) => {
    const socket = SocketManage.getInstance();
    if (socket.isConnected()) {
      socket.writeData(`${GlobalConst.forwardData}:${fClass}=${fData}`);
    } else {
      showNotifier({
        title: '机器人未连接',
        message: '机器人未连接',
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    }
  };

  const onOldTestConfirm = (length: string = '0', widthValue: string = '0') => {
    setIsShowOldTestModal(false);
    sendDataSpecial(GlobalConst.oldTestLong, parseInt(length, 10)); //发送到机器
    setTimeout(() => {
      sendDataSpecial(GlobalConst.oldTestWidth, parseInt(widthValue, 10)); //发送到机器
    }, 32);
    setTimeout(() => {
      sendCmdDispatch(Command.OldTest);
    }, 100);
  };

  return (
    <View className="flex w-full">
      <Header />
      <OldTestModal
        visible={isShowOldTestModal}
        onDismiss={() => setIsShowOldTestModal(false)}
        onConfirm={onOldTestConfirm}
      />
      <View className="flex min-h-[72%] w-full flex-row px-3">
        <Card className=" mb-5 mr-3 w-[40%]" style={{ display: isShowlog ? 'none' : 'flex' }}>
          <Button
            mode="contained"
            icon="debug-step-out"
            className="mx-5 my-3"
            onPress={openDebugMode}>
            打开测试模式(WIFICONTROLTEST)
          </Button>

          <Card.Content>
            <View className=" flex flex-row flex-wrap">
              <Button
                mode="text"
                className="mx-1 mb-4 py-1 text-sm"
                onPress={() => openDebugCommand(Command.sliderLeftTest)}>
                横移 左(SliderLeftTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.sliderRightTest)}>
                横移 右(SliderRightTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.holdDownTest)}>
                支撑杆 下 (HoldDownTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.holdUpTest)}>
                支撑杆 上下 (HoldUpTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.legsDownTest)}>
                辅助腿下 (LegsDownTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.legsUpTest)}>
                辅助腿上 (LegsUpTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.gunDownTest)}>
                枪 下 (GunDownTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.gunUpTest)}>
                枪 上 (GunUpTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.lunForward)}>
                轮子前进 (LunForward)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.lunBackward)}>
                轮子后退 (LunBackward)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.lunStop)}>
                轮子停止 (LunStop)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.GunTrigger)}>
                枪绑扎 (GunTrigger)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.GunReboot)}>
                枪重启 (GunReboot)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.OldTest)}>
                老化测试 (OldTest)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => sendCmdDispatch(Command.OldTest)}>
                老化测试 (纯命令)
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.stopOldTest)}>
                停止老化测试 (StopOldTest)
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card className="mb-5 mr-3 flex-1">
          <View className="flex flex-row px-3 py-3">
            <Icon source="database" size={20} />
            <Text className="mb-2 ml-2 text-lg font-bold">后板数据</Text>
          </View>
          {backBoardData ? (
            <DataMonitor msg={backBoardData} />
          ) : (
            <Text className="text-center">暂无数据</Text>
          )}
        </Card>

        <Card className="mb-5 mr-3 flex-1 ">
          <View className="flex flex-row px-3 py-3">
            <Icon source="database" size={20} />
            <Text className="mb-2 ml-2 text-lg font-bold">MKS数据</Text>
          </View>
          {mksData ? <DataMonitor msg={mksData} /> : <Text className="text-center">暂无数据</Text>}
        </Card>

        <Card className="mb-5 mr-3 flex-1">
          <View className="flex flex-row px-3 py-3">
            <Icon source="database" size={20} />
            <Text className="mb-2 ml-2 text-lg font-bold">前板数据</Text>
          </View>
          {frontBoardData ? (
            <DataMonitor msg={frontBoardData} />
          ) : (
            <Text className="text-center">暂无数据</Text>
          )}
        </Card>

        <Portal>
          <Dialog
            style={{
              width: '80%',
              left: '0%',
              right: '0%',
              marginHorizontal: 'auto',
              minHeight: 450,
            }}
            visible={isShowlog}
            onDismiss={() => setIsShowLog(false)}>
            <Dialog.Title>日志</Dialog.Title>
            <Dialog.Content>
              <View>
                <FlatList
                  data={debugLog}
                  className="m-2 mb-3 flex-1 rounded-lg bg-black p-2"
                  style={{ minHeight: 300 }}
                  renderItem={({ item }) => <LogItem item={item} />}
                  ItemSeparatorComponent={() => <View className="h-2" />}
                  keyExtractor={(item, index) => `${item.time}-${index}`}
                />
                <View className="flex w-full flex-row justify-center gap-4">
                  {logStatus === 'start' ? (
                    <Button
                      mode="outlined"
                      icon="pause"
                      className="px-3"
                      onPress={() => setLogStatus('stop')}>
                      暂停
                    </Button>
                  ) : (
                    <Button
                      mode="outlined"
                      icon="play"
                      className="px-3"
                      onPress={() => setLogStatus('start')}>
                      继续
                    </Button>
                  )}
                  <Button
                    mode="outlined"
                    icon="close"
                    className="px-3"
                    onPress={() => {
                      clearDebugLog();
                    }}>
                    清空
                  </Button>
                  <Button
                    mode="outlined"
                    icon={isShowlog ? 'fullscreen-exit' : 'fullscreen'}
                    className="px-3"
                    onPress={toggleFullscreen}>
                    {isShowlog ? '退出日志' : '全屏'}
                  </Button>
                </View>
              </View>
            </Dialog.Content>
          </Dialog>
        </Portal>
      </View>

      <View className="flex w-full flex-row justify-center gap-4">
        <Button mode="outlined" className="mx-5 my-2" onPress={toggleFullscreen}>
          {isShowlog ? '退出日志' : '进入日志'}
        </Button>

        <Button mode="outlined" className="mx-5 my-2" onPress={goback}>
          返回
        </Button>
      </View>
    </View>
  );
}
