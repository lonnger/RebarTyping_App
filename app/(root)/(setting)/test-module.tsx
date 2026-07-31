import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { View, ScrollView, FlatList, Text } from 'react-native';
import { Button, Card, Dialog, Icon, Portal } from 'react-native-paper';

import OldTestModal from './old-test-modal';

import { DataMonitor } from '@/components/data-monitor';
import { Header } from '@/components/header';
import { LogItem } from '@/components/logs';
import { GlobalConst } from '@/constants';
import { Command } from '@/constants/command';
import useStore from '@/store';
import { sendCmdDispatch } from '@/utils/helper';
import {
  getSavedIpCountryPayload,
  getSavedIpLocationInfo,
  IpCountryPayload,
  IpLocationInfo,
} from '@/utils/ipCountry';
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
  const [ipLocationInfo, setIpLocationInfo] = useState<IpLocationInfo | null>(null);
  const [ipCountryPayload, setIpCountryPayload] = useState<IpCountryPayload | null>(null);
  const [ipLocationInfoLoaded, setIpLocationInfoLoaded] = useState(false);
  const setDebugLog = useStore((state) => state.setDebugLog);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setIpLocationInfoLoaded(false);

      Promise.all([getSavedIpLocationInfo(), getSavedIpCountryPayload()])
        .then(([savedIpLocationInfo, savedIpCountryPayload]) => {
          if (!isActive) {
            return;
          }
          setIpLocationInfo(savedIpLocationInfo);
          setIpCountryPayload(savedIpCountryPayload);
        })
        .catch((error) => {
          console.warn('getSavedIpLocationInfo error', error);
        })
        .finally(() => {
          if (isActive) {
            setIpLocationInfoLoaded(true);
          }
        });

      return () => {
        isActive = false;
      };
    }, [])
  );

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
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="flex w-full"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <Header />
      <OldTestModal
        visible={isShowOldTestModal}
        onDismiss={() => setIsShowOldTestModal(false)}
        onConfirm={onOldTestConfirm}
      />
      <View className="flex min-h-[72%] w-full flex-row flex-wrap px-3">
        <Card className="mb-5 mr-3 w-full">
          <View className="flex flex-row items-center px-4 py-3">
            <Icon source="ip-network" size={20} />
            <Text className="ml-2 text-lg font-bold">登录 IP 信息</Text>
          </View>
          <Card.Content>
            {!ipLocationInfoLoaded ? (
              <Text>正在读取……</Text>
            ) : ipLocationInfo ? (
              <View className="flex flex-row flex-wrap">
                <Text className="mb-2 w-1/3" selectable>
                  公网 IP：{ipLocationInfo.ip}
                </Text>
                <Text className="mb-2 w-1/3" selectable>
                  国家/地区：{ipLocationInfo.country || '-'} ({ipLocationInfo.countryCode || '-'})
                </Text>
                <Text className="mb-2 w-1/3" selectable>
                  数据来源：{ipLocationInfo.source}
                </Text>
                <Text className="mb-2 w-1/3" selectable>
                  区域判定：{ipCountryPayload || '-'}
                </Text>
                <Text className="w-1/3" selectable>
                  纬度：{ipLocationInfo.latitude}
                </Text>
                <Text className="w-1/3" selectable>
                  经度：{ipLocationInfo.longitude}
                </Text>
                <Text className="w-1/3" selectable>
                  获取时间：{new Date(ipLocationInfo.fetchedAt).toLocaleString()}
                </Text>
              </View>
            ) : (
              <Text>暂无登录 IP 信息，请先在登录页联网登录一次。</Text>
            )}
          </Card.Content>
        </Card>

        <Card className=" mb-5 mr-3 w-[40%]" style={{ display: isShowlog ? 'none' : 'flex' }}>
          <Button
            mode="contained"
            icon="debug-step-out"
            className="mx-5 my-3"
            onPress={openDebugMode}>
            <Text>打开测试模式(WIFICONTROLTEST)</Text>
          </Button>

          <Card.Content>
            <View className=" flex flex-row flex-wrap">
              <Button
                mode="text"
                className="mx-1 mb-4 py-1 text-sm"
                onPress={() => openDebugCommand(Command.sliderLeftTest)}>
                <Text>横移 左(SliderLeftTest)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.sliderRightTest)}>
                <Text>横移 右(SliderRightTest)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.holdDownTest)}>
                <Text>支撑杆 下 (HoldDownTest)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.holdUpTest)}>
                <Text>支撑杆 上 (HoldUpTest)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.legsDownTest)}>
                <Text>辅助腿下 (LegsDownTest)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.legsUpTest)}>
                <Text>辅助腿上 (LegsUpTest)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.gunDownTest)}>
                <Text>枪 下 (GunDownTest)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.gunUpTest)}>
                <Text>枪 上 (GunUpTest)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.lunForward)}>
                <Text>轮子前进 (LunForward)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4  text-sm"
                onPress={() => openDebugCommand(Command.lunBackward)}>
                <Text>轮子后退 (LunBackward)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.lunStop)}>
                <Text>轮子停止 (LunStop)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.GunTrigger)}>
                <Text>枪绑扎 (GunTrigger)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.GunReboot)}>
                <Text>枪重启 (GunReboot)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.OldTest)}>
                <Text>老化测试 (OldTest)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => sendCmdDispatch(Command.OldTest)}>
                <Text>老化测试 (纯命令)</Text>
              </Button>

              <Button
                mode="text"
                className="mx-1 mb-4 text-sm"
                onPress={() => openDebugCommand(Command.stopOldTest)}>
                <Text>停止老化测试 (StopOldTest)</Text>
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
                      <Text>暂停</Text>
                    </Button>
                  ) : (
                    <Button
                      mode="outlined"
                      icon="play"
                      className="px-3"
                      onPress={() => setLogStatus('start')}>
                      <Text>继续</Text>
                    </Button>
                  )}
                  <Button
                    mode="outlined"
                    icon="close"
                    className="px-3"
                    onPress={() => {
                      clearDebugLog();
                    }}>
                    <Text>清空</Text>
                  </Button>
                  <Button
                    mode="outlined"
                    icon={isShowlog ? 'fullscreen-exit' : 'fullscreen'}
                    className="px-3"
                    onPress={toggleFullscreen}>
                    <Text>{isShowlog ? '退出日志' : '全屏'}</Text>
                  </Button>
                </View>
              </View>
            </Dialog.Content>
          </Dialog>
        </Portal>
      </View>

      <View className="flex w-full flex-row justify-center gap-4">
        <Button mode="outlined" className="mx-5 my-2" onPress={toggleFullscreen}>
          <Text>{isShowlog ? '退出日志' : '进入日志'}</Text>
        </Button>

        <Button mode="outlined" className="mx-5 my-2" onPress={goback}>
          <Text>返回</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
