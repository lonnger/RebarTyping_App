import { View, Text } from 'react-native';

// 自定义日志渲染组件
export const LogItem = ({ item }: { item: { time: string; msg: string } }) => {
  const { msg, time } = item;

  // 检查是否是特定格式的数据（包含 "-----start-----" 和 "end"）
  const isFormattedData = msg.includes('-----start-----') && msg.includes('-----end-----');

  if (isFormattedData) {
    // 解析格式化数据
    const lines = msg.split('\n').filter((line) => line.trim());
    const title = lines[0]?.split(':')[0] || '数据';
    const dataLines = lines.slice(1, -1); // 去掉第一行和最后一行

    return (
      <View className="mb-3">
        <Text style={{ color: 'white', fontSize: 16, marginBottom: 3 }}>
          {new Date(time).toLocaleString()}: {title}
        </Text>
        <View className="rounded-lg border border-gray-500 bg-gray-900 p-3">
          {dataLines.map((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.includes(':')) {
              const [key, value] = trimmedLine.split(':').map((s) => s.trim());
              return (
                <View key={index} className="mb-1 flex-row items-center">
                  <Text style={{ color: '#87CEEB', fontSize: 14, flex: 1 }}>{key}:</Text>
                  <Text
                    style={{ color: '#98FB98', fontSize: 14, width: 60 }}
                    className="rounded-md border-[0.5px] border-gray-500 px-2 py-1 text-center text-xs">
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
  }

  // 普通日志显示
  return (
    <Text style={{ color: 'white', fontSize: 16, marginBottom: 3 }}>
      {new Date(time).toLocaleString()}: {msg}
    </Text>
  );
};
