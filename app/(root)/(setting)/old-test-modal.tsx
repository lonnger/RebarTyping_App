import { useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Portal, Modal, TextInput, Button } from 'react-native-paper';

export default function OldTestModal({
  visible,
  onDismiss,
  onConfirm,
}: {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (length: string, widthValue: string) => void;
}) {
  const { width } = Dimensions.get('screen');
  const [length, setLength] = useState('');
  const [widthValue, setWidthValue] = useState('');

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: 'white',
          borderRadius: 15,
          paddingHorizontal: 20,
          paddingVertical: 20,
          marginHorizontal: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: width / 3,
        }}>
        <View className="w-full">
          <Text className="mb-4 text-center text-2xl font-bold">参数设置</Text>
          <TextInput
            className="h-5 w-full"
            placeholder="长"
            defaultValue="0"
            onChangeText={setLength}
          />
          <TextInput
            className="h-5 w-full"
            placeholder="宽"
            value={widthValue}
            defaultValue="0"
            onChangeText={setWidthValue}
          />
          <View className="h-4" />
          <Button mode="contained" className="w-full" onPress={() => onConfirm(length, widthValue)}>
            设置
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}
