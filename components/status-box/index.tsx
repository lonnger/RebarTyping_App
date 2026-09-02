import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useWindowDimensions, View } from 'react-native';
import { Button } from 'react-native-paper';

import { ParamsSettingModal } from '../params-setting-modal';

import { HOME_LAYOUT } from '@/constants/home-layout';
import { scaleHomeValue, useHomeLayoutScale } from '@/hooks/useHomeLayoutScale';

export const StatusBox = () => {
  const { width, height } = useWindowDimensions();
  const { scale } = useHomeLayoutScale();
  const { center } = HOME_LAYOUT;
  const scaled = (value: number) => scaleHomeValue(value, scale);
  const imageSize = useMemo(
    () =>
      Math.floor(
        Math.max(
          scaled(center.image.minSize),
          Math.min(
            width / center.image.widthDivisor,
            (height - scaled(center.image.reservedHeight)) / center.image.heightDivisor,
            scaled(center.image.maxSize)
          )
        )
      ),
    [center.image, height, scale, width]
  );
  const [visible, setVisible] = useState(false);

  const openSettingModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const { t } = useTranslation();
  return (
    <View className="h-full w-full flex-col items-center justify-center">
      <ParamsSettingModal visible={visible} onDismiss={hideModal} />

      <View>
        <Image
          placeholder={{ blurhash: 'L3C00000' }}
          contentFit="contain"
          style={{ width: imageSize, height: imageSize }}
          transition={1000}
          source={require('@/assets/images/p1.png')}
        />
        <Image
          placeholder={{ blurhash: 'L3C00000' }}
          contentFit="cover"
          style={{
            width: imageSize,
            height: imageSize,
            marginBottom: scaled(center.image.bottomSpacing),
          }}
          transition={1000}
          source={require('@/assets/images/p2.png')}
        />
      </View>

      <Button
        icon="cog"
        mode="contained"
        style={{ width: center.buttonWidth }}
        onPress={openSettingModal}>
        <Text>{t('common.paramsSetting')}</Text>
      </Button>
    </View>
  );
};
