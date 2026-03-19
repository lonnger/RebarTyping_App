import { View, Text } from 'react-native';

// 自定义日志渲染组件
export const DataMonitor = ({ msg }: { msg: string }) => {
  // 解析格式化数据
  const lines = msg.split('\n').filter((line) => line.trim());
  const dataLines = lines.slice(1, -1); // 去掉第一行和最后一行

  return (
    <View className="mb-3 px-1">
      <View className="rounded-lg border-gray-500 p-3">
        {dataLines.map((line, index) => {
          const trimmedLine = line.trim();
          if (trimmedLine.includes(':')) {
            const [key, value] = trimmedLine.split(':').map((s) => s.trim());
            return (
              <View key={index} className="mb-2 flex-row items-center  pb-2">
                <Text className="flex-1 text-lg text-gray-500">{key}:</Text>
                <Text
                  style={{ color: '#000000FF', fontSize: 14, width: 60 }}
                  className="rounded-md border-[0.5px] border-gray-500 px-2 py-1 text-center text-sm">
                  {value.replace(',', '')}
                </Text>
              </View>
            );
          }
          return (
            <Text key={index} style={{ color: 'white', fontSize: 14, marginBottom: 1 }}>
              {trimmedLine}
            </Text>
          );
        })}
      </View>
    </View>
  );
};
