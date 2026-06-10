import { ScrollView,KeyboardAvoidingView,Platform, Dimensions, View } from 'react-native';

import { ControlBar } from '@/components/control-bar';
import { DangerousStatus } from '@/components/dangerous-status';
import { DataInspect } from '@/components/data-inspect';
import { ErrorData } from '@/components/error-data';
import { Header } from '@/components/header';
import { LockedStatus } from '@/components/locked-status';
import { StatusBox } from '@/components/status-box';
import useStore from '@/store';

const Home = () => {
  const { robotStatus } = useStore((state) => state);
  //获取设备窗口高度
  const { height } = Dimensions.get('window');
  const headerHeight = 100;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}>
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
    <ScrollView horizontal={true} contentContainerStyle={{ flexGrow: 1 }}>
    <View className="flex w-full">
      <Header />
      {robotStatus.robotDangerStatus ? <DangerousStatus /> : null}
      {robotStatus.robotLockedStatus ? <LockedStatus /> : null}
      <View
        className="flex w-full flex-row justify-center px-6 py-5">
        <View className="w-[37%]">
          <View className="relative mx-auto flex w-[95%] flex-col justify-center gap-y-4">
            <ErrorData />
            <DataInspect />
          </View>
        </View>
        <View className="flex h-[88%] w-[26%]">
          <StatusBox />
        </View>
        <View className="flex w-[37%] flex-row">
          <View className="relative mx-auto flex w-[95%] flex-col justify-between gap-y-5">
            <ControlBar />
          </View>
        </View>
      </View>
    </View>
    </ScrollView>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Home;
