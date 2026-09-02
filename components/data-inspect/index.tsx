import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Card, DataTable, Icon } from 'react-native-paper';

import { HOME_LAYOUT } from '@/constants/home-layout';
import { useStore } from '@/store';

export const DataInspect = () => {
  const { data_inspect } = useStore((state) => state);
  const { t } = useTranslation();
  const [items, setItems] = useState<{ key: number; name: string; value: number; unit: string }[]>(
    []
  );

  useEffect(() => {
    setItems([
      {
        key: 1,
        name: t('common.trackLaser'),
        value: data_inspect.track_laser_num,
        unit: 'mm',
      },
      {
        key: 2,
        name: t('common.nodeLaser'),
        value: data_inspect.node_laser_num,
        unit: 'mm',
      },
      {
        key: 3,
        name: t('common.overage'),
        value: data_inspect.overage_num,
        unit: '%',
      },
    ]);
  }, [data_inspect, t]);

  return (
    <Card
      className="mr-auto"
      style={{ width: HOME_LAYOUT.left.cardWidth, flex: HOME_LAYOUT.left.dataCardFlex }}>
      <View className="w-full px-5 pb-5 pt-2">
        <View className="mb-2 mt-3 flex flex-row items-start justify-center">
          <Icon source="database-sync-outline" size={22} />
          <Text className="ml-2 text-center text-xl font-bold">{t('common.dataMonitor')}</Text>
        </View>

        <DataTable>
          {items.map((item) => (
            <DataTable.Row key={item.key}>
              <DataTable.Cell>{item.name}</DataTable.Cell>
              <DataTable.Cell numeric>{item.value}</DataTable.Cell>
              <DataTable.Cell numeric>{item.unit}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </View>
    </Card>
  );
};
