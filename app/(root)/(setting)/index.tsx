import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { Button, List, SegmentedButtons, TextInput, TouchableRipple } from 'react-native-paper';

import { Header } from '@/components/header';
import { storage_config } from '@/constants';
import i18n from '@/i18n/i18n';
import useStore from '@/store';

export default function Setting() {
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
          <View className="mt-5 flex flex-row items-center justify-center gap-10">
            <Button mode="contained" icon="logout" className="px-3" onPress={logout}>
              {t('common.logout')}
            </Button>

            <Button mode="outlined" icon="arrow-left" className="px-3" onPress={goback}>
              {t('common.back')}
            </Button>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
