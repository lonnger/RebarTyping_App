import { createRef, forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text } from 'react-native';
import { ActivityIndicator, MD2Colors, Portal } from 'react-native-paper';

export const GlobalActivityIndicatorManager: React.RefObject<{
  show: (text: string, duration?: number) => void;
  hide: () => void;
} | null> = createRef();

const GlobalActivityIndicator = forwardRef((_: any, ref: any) => {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');

  const showSnackbar = () => {
    setVisible(true);
  };

  const hideSnackbar = () => setVisible(false);

  useImperativeHandle(
    ref,
    () => ({
      show: (text: string, duration: number = 1000) => {
        setText(text);
        showSnackbar();

        if (duration !== 0) {
          setTimeout(() => {
            hideSnackbar();
          }, duration);
        }
      },
      hide: hideSnackbar,
    }),
    [showSnackbar, hideSnackbar]
  );

  if (!visible) {
    return null;
  }

  return (
    <Portal>
      <View className="absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black/20">
        <ActivityIndicator animating color={MD2Colors.blue600} size={45} />
        <Text className="mt-4 text-2xl text-[#1e88e5]">{text}</Text>
      </View>
    </Portal>
  );
});

const GlobalActivityIndicatorComponent = () => (
  <GlobalActivityIndicator ref={GlobalActivityIndicatorManager} />
);

export default GlobalActivityIndicatorComponent;
