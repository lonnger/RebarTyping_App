import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Button, Card, DataTable, Icon } from 'react-native-paper';

import { useStore } from '@/store';
import { ConnectDeviceInfo } from '@/utils/connectDeviceInfo';

export const ErrorData = () => {
  const { t } = useTranslation();
  const { errorGroup } = useStore((state) => state);

  const [items, setItems] = useState<{ key: number; index: string; time: string; name: string }[]>(
    []
  );

  useEffect(() => {
    const temp = errorGroup.map((item, index) => {
      return {
        key: index,
        index: item.errorId.toString(),
        time: item.time,
        name: ConnectDeviceInfo.getErrorInfo(item.errorId),
      };
    });
    setItems(temp || []);
  }, [errorGroup]);

  const openErrorDetailPage = () => {
    router.push('/(error_info)');
  };

  return (
    <Card className="min-h-[47%]">
      <View className="w-full px-5">
        <View className="mb-2 mt-3  flex flex-row items-center justify-center">
          <Icon source="alert-circle-outline" size={22} />
          <Text className="ml-2 text-center text-2xl font-bold">{t('malfunction.title')}</Text>
        </View>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>{t('malfunction.index')}</DataTable.Title>
            <DataTable.Title>{t('malfunction.time')}</DataTable.Title>
            <DataTable.Title numeric>{t('malfunction.name')}</DataTable.Title>
          </DataTable.Header>

          {items.length > 0 ? (
            items.slice(0, 3).map((item) => (
              <DataTable.Row key={item.key}>
                <DataTable.Cell textStyle={{ textAlign: 'center', fontSize: 12 }}>
                  {item.index}
                </DataTable.Cell>
                <DataTable.Cell textStyle={{ textAlign: 'center', fontSize: 12 }}>
                  {item.time}
                </DataTable.Cell>
                <DataTable.Cell textStyle={{ textAlign: 'center', fontSize: 12 }} numeric>
                  {item.name}
                </DataTable.Cell>
              </DataTable.Row>
            ))
          ) : (
            <DataTable.Row>
              <DataTable.Cell textStyle={{ textAlign: 'center', fontSize: 12 }}>
                {t('malfunction.noData')}
              </DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>

        <View className="flex w-full items-end">
          <Button
            icon="eye"
            style={{ right: -10, marginTop: 10 }}
            mode="text"
            onPress={() => openErrorDetailPage()}>
            {t('malfunction.viewDetails')}
          </Button>
        </View>
      </View>
    </Card>
  );
};
