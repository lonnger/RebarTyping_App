import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import {
  Button,
  Dialog,
  List,
  Portal,
  SegmentedButtons,
  TextInput,
  TouchableRipple,
} from 'react-native-paper';

import releaseNotes from './release-notes';

import { Header } from '@/components/header';
import { storage_config } from '@/constants';
import i18n from '@/i18n/i18n';
import useStore from '@/store';

type IpLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export default function () {
  const { canLoginInfo } = useStore((state) => state);
  const [language, setLanguage] = useState<'cn' | 'en' | 'hk'>('en');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const userInfo = useAsyncStorage(storage_config.LOCAL_STORAGE_USER_INFO);
  const languageInfo = useAsyncStorage(storage_config.LOCAL_STORAGE_LANGUAGE);
  const { t } = useTranslation();

  const [ipLocation, setIpLocation] = useState<IpLocation | null>(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleGetIPLocation = async () => {
    setLoadingLocation(true);
    setLocationError(null);
    setIpAddress(null);

    try {
      const res = await fetch(
        'http://ip-api.com/json/?lang=zh-CN&fields=status,message,country,regionName,city,district,lat,lon'
      );
      const data = await res.json();

      if (data.status !== 'success' || !data.lat || !data.lon) {
        throw new Error(data.message || 'ip-api.com 返回失败');
      }

      setIpLocation({
        latitude: Number(data.lat),
        longitude: Number(data.lon),
        accuracy: 5000,
        timestamp: Date.now(),
      });

      const addressParts = [data.country, data.regionName, data.city, data.district].filter(Boolean);
      setIpAddress(addressParts.length >= 2 ? `${addressParts.join('')}` : null);
    } catch (err: any) {
      console.error('获取 IP 定位失败:', err);
      setLocationError(`获取 IP 定位失败: ${err?.message || '未知错误'}。请确认设备已连接可上网的 Wi-Fi。`);
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    languageInfo.getItem().then((value) => {
      if (value) {
        setLanguage(value as 'cn' | 'en' | 'hk');
      } else {
        saveLanguage('en');
      }
    });
  }, []);

  const saveLanguage = (value: 'cn' | 'en' | 'hk') => {
    setLanguage(value);
    languageInfo.setItem(value);
    i18n.changeLanguage(value);
  };

  const goback = () => {
    router.back();
  };

  const appVersion =
    releaseNotes.version ||
    (Constants.expoConfig && (Constants.expoConfig.version as string)) ||
    ((Constants.manifest as { version?: string } | null)?.version as string | undefined) ||
    '0.0.0';
  const [isVersionDialogVisible, setIsVersionDialogVisible] = useState(false);

  const logout = async () => {
    await userInfo.removeItem();
    router.dismissAll();
    router.replace('/(root)/(login)');
  };

  const openTestModule = () => {
    router.push('/(root)/(setting)/test-module');
  };

  return (
    <View className="flex w-full">
      <Header />

      <View className="flex w-full flex-row items-center justify-between px-20 py-10">
        <View className="w-[45%] items-center justify-center">
          <Image
            source={require('@/assets/images/p3.png')}
            contentFit="contain"
            style={{
              width: 300,
              height: 300,
            }}
          />
          <TouchableRipple
            onLongPress={openTestModule}
            style={{
              width: 300,
              height: 300,
            }}
            className="absolute bottom-0 left-0 right-0 top-0 z-10 opacity-0">
            <Text>测试模块</Text>
          </TouchableRipple>
        </View>

        <ScrollView className="w-[50%] overflow-scroll">
          <View className="overflow-hidden rounded-xl ">
            <List.AccordionGroup
              expandedId={expandedId ?? undefined}
              onAccordionPress={(v) => {
                if (expandedId === v) {
                  setExpandedId(null);
                } else {
                  setExpandedId(v as string);
                }
              }}>
              <List.Accordion title={t('setting.userInfo')} id="1">
                <ScrollView className="h-48 lg:h-64">
                  <View className="gap-5 bg-white px-5 py-6">
                    <TextInput
                      label={t('setting.username')}
                      value={canLoginInfo.name}
                      disabled
                      style={{ backgroundColor: '#01264142' }}
                      keyboardType="numeric"
                    />

                    <TextInput
                      label={t('setting.companyAddress')}
                      value={canLoginInfo.position}
                      disabled
                      style={{ backgroundColor: '#01264142' }}
                    />

                    <TextInput
                      label={t('setting.companyName')}
                      value={canLoginInfo.company}
                      disabled
                      style={{ backgroundColor: '#01264142' }}
                    />

                    <TextInput
                      label={t('setting.phoneNumber')}
                      value={canLoginInfo.number}
                      disabled
                      style={{ backgroundColor: '#01264142' }}
                    />
                  </View>
                </ScrollView>
              </List.Accordion>
            </List.AccordionGroup>
          </View>

          <View className="h-5" />
          <View className="overflow-hidden rounded-xl ">
            <List.AccordionGroup
              expandedId={expandedId ?? undefined}
              onAccordionPress={(v) => {
                if (expandedId === v) {
                  setExpandedId(null);
                } else {
                  setExpandedId(v as string);
                }
              }}>
              <List.Accordion title={t('setting.language')} id="2">
                <SegmentedButtons
                  value={language}
                  style={{ backgroundColor: '#fff', padding: 10 }}
                  onValueChange={(value) => saveLanguage(value as 'cn' | 'en' | 'hk')}
                  buttons={[
                    {
                      value: 'cn',
                      label: '简体中文',
                    },
                    {
                      value: 'en',
                      label: 'English',
                    },
                    {
                      value: 'hk',
                      label: '繁體中文',
                    },
                  ]}
                />
              </List.Accordion>
            </List.AccordionGroup>
          </View>

          <View className="h-5" />
          <View className="overflow-hidden rounded-xl ">
            <List.AccordionGroup
              expandedId={expandedId ?? undefined}
              onAccordionPress={(v) => {
                if (expandedId === v) {
                  setExpandedId(null);
                } else {
                  setExpandedId(v as string);
                }
              }}>
              <List.Accordion title="IP 定位测试" id="3">
                <View className="items-center justify-center gap-3 bg-white p-5">
                  <Button
                    mode="contained"
                    onPress={handleGetIPLocation}
                    loading={loadingLocation}
                    disabled={loadingLocation}
                    style={{ width: '100%' }}>
                    {loadingLocation ? '正在通过 IP 获取...' : '点击获取当前 IP 定位'}
                  </Button>
                  {ipLocation && (
                    <View className="mt-4 w-full rounded-lg bg-gray-100 p-4">
                      {ipAddress ? (
                        <Text className="mb-2 border-b border-gray-300 pb-1.5 text-base font-bold leading-6 text-gray-900">
                          地址: {ipAddress}
                        </Text>
                      ) : null}
                      <Text className="text-sm leading-6 text-gray-800">
                        纬度 (Latitude): {ipLocation.latitude.toFixed(6)}
                      </Text>
                      <Text className="text-sm leading-6 text-gray-800">
                        经度 (Longitude): {ipLocation.longitude.toFixed(6)}
                      </Text>
                      <Text className="text-sm leading-6 text-gray-800">
                        精度 (Accuracy): 约 {ipLocation.accuracy.toFixed(0)} 米
                      </Text>
                      <Text className="text-sm leading-6 text-gray-800">
                        时间 (Timestamp): {new Date(ipLocation.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  )}
                  {locationError && (
                    <Text className="mt-2 text-center text-sm font-bold text-red-500">
                      {locationError}
                    </Text>
                  )}
                </View>
              </List.Accordion>
            </List.AccordionGroup>
          </View>

          <View className="mt-5 flex flex-row items-center justify-center gap-10">
            <Button mode="contained" icon="logout" className="px-3" onPress={logout}>
              <Text>{t('common.logout')}</Text>
            </Button>

            <Button mode="outlined" icon="arrow-left" className="px-3" onPress={goback}>
              <Text>{t('common.back')}</Text>
            </Button>
          </View>
          <View className="mt-4 items-center justify-center">
            <TouchableRipple
              onLongPress={() => setIsVersionDialogVisible(true)}
              rippleColor="rgba(0,0,0,0.08)"
              className="rounded-md px-2 py-1">
              <Text className="text-sm text-gray-500">v. {appVersion}</Text>
            </TouchableRipple>
          </View>

          <Portal>
            <Dialog
              visible={isVersionDialogVisible}
              onDismiss={() => setIsVersionDialogVisible(false)}>
              <Dialog.Title>版本更新</Dialog.Title>
              <Dialog.Content>
                <Text className="mb-3 text-base font-medium">当前版本：{appVersion}</Text>
                {releaseNotes.notes.map((note, idx) => (
                  <Text key={idx} className="text-sm leading-6 text-gray-700">
                    {`${idx + 1}. ${note}`}
                  </Text>
                ))}
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setIsVersionDialogVisible(false)}>
                  <Text>关闭</Text>
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </ScrollView>
      </View>
    </View>
  );
}
