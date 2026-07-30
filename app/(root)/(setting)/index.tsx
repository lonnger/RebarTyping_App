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
import { releaseEspWifiFromSystem } from '@/utils/espWifiSystemPicker';
import { clearOnlineLoginAt } from '@/utils/loginSession';
import { SocketManage } from '@/utils/socketManage';

export default function () {
  const { canLoginInfo } = useStore((state) => state);
  const [language, setLanguage] = useState<'cn' | 'en' | 'hk'>('en');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const userInfo = useAsyncStorage(storage_config.LOCAL_STORAGE_USER_INFO);
  const languageInfo = useAsyncStorage(storage_config.LOCAL_STORAGE_LANGUAGE);
  const { t } = useTranslation();

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
    SocketManage.getInstance().disconnectSocket();
    try {
      await releaseEspWifiFromSystem();
    } catch (error) {
      console.warn('releaseEspWifiFromSystem error', error);
    }
    await Promise.all([userInfo.removeItem(), clearOnlineLoginAt()]);
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
