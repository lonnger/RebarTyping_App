import { createRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Portal, IconButton } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

export type NotifierType = 'success' | 'error' | 'warning' | 'info';

export type NotifierConfig = {
  title: string;
  message?: string;
  type?: NotifierType;
  duration?: number; // 0 表示不自动消失
  onPress?: () => void;
};

export const GlobalNotifierManager: React.RefObject<{
  show: (config: NotifierConfig) => void;
  hide: () => void;
} | null> = createRef();

const getNotifierStyles = (type: NotifierType) => {
  switch (type) {
    case 'success':
      return {
        backgroundColor: '#10B981',
        icon: 'check-circle-outline',
        textColor: '#FFFFFF',
      };
    case 'error':
      return {
        backgroundColor: '#EF4444',
        icon: 'alert-circle-outline',
        textColor: '#FFFFFF',
      };
    case 'warning':
      return {
        backgroundColor: '#F59E0B',
        icon: 'alert-outline',
        textColor: '#FFFFFF',
      };
    case 'info':
    default:
      return {
        backgroundColor: '#3B82F6',
        icon: 'information-outline',
        textColor: '#FFFFFF',
      };
  }
};

const GlobalNotifier = forwardRef((_: any, ref: any) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<NotifierConfig>({
    title: '',
    type: 'info',
    duration: 3000,
  });

  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const { width } = Dimensions.get('window');

  const showNotifier = (newConfig: NotifierConfig) => {
    setConfig({
      type: 'info',
      duration: 3000,
      ...newConfig,
    });
    setVisible(true);
  };

  const hideNotifier = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setVisible)(false);
    });
  };

  useEffect(() => {
    if (visible) {
      // 显示动画
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 300 });

      // 自动隐藏
      if (config.duration && config.duration > 0) {
        const timer = setTimeout(() => {
          hideNotifier();
        }, config.duration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, config.duration]);

  useImperativeHandle(
    ref,
    () => ({
      show: showNotifier,
      hide: hideNotifier,
    }),
    []
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  if (!visible) {
    return null;
  }

  const styles = getNotifierStyles(config.type || 'info');

  return (
    <Portal>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 50,
            left: 20,
            right: 20,
            zIndex: 1000,
            maxWidth: width - 40,
          },
          animatedStyle,
        ]}>
        <View
          style={{
            backgroundColor: styles.backgroundColor,
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
          <IconButton
            icon={styles.icon}
            iconColor={styles.textColor}
            size={24}
            style={{ margin: 0, marginRight: 8 }}
          />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: styles.textColor,
                fontSize: 16,
                fontWeight: '600',
                marginBottom: config.message ? 4 : 0,
              }}>
              {config.title}
            </Text>
            {config.message && (
              <Text
                style={{
                  color: styles.textColor,
                  fontSize: 14,
                  opacity: 0.9,
                }}>
                {config.message}
              </Text>
            )}
          </View>

          <IconButton
            icon="close"
            iconColor={styles.textColor}
            size={20}
            style={{ margin: 0, opacity: 0.8 }}
            onPress={hideNotifier}
          />
        </View>
      </Animated.View>
    </Portal>
  );
});

const GlobalNotifierComponent = () => <GlobalNotifier ref={GlobalNotifierManager} />;

export default GlobalNotifierComponent;
