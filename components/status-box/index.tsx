import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { ParamsSettingModal } from '../params-setting-modal';

export const StatusBox = () => {
  const { width } = Dimensions.get('screen');
  const imageSize = useMemo(() => Math.floor(width / 4.6), [width]);
  const [visible, setVisible] = useState(false);

  const openSettingModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const { t } = useTranslation();
  return (
    <View className="w-[100%] flex-col items-center justify-center">
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
          style={{ width: imageSize, height: imageSize, marginBottom: 20 }}
          transition={1000}
          source={require('@/assets/images/p2.png')}
        />
      </View>

      <Button icon="cog" mode="contained" style={{ width: '80%' }} onPress={openSettingModal}>
        <Text>{t('common.paramsSetting')}</Text>
      </Button>
    </View>
  );
};
