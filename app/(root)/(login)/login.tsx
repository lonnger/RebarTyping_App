import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Checkbox, Icon, Modal, Portal } from 'react-native-paper';

import { Header } from '@/components/header';
import { storage_config } from '@/constants';
import useStore from '@/store';
import { showNotifier } from '@/utils/notifier';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasReadGuide, setHasReadGuide] = useState(false);
  const [rememberpsw, setRememberpsw] = useState(true);
  const [showGuideDialog, setShowGuideDialog] = useState(false);

  const { width, height } = Dimensions.get('screen');
  const { canLoginInfo } = useStore((state) => state);
  const userInfo = useAsyncStorage(storage_config.LOCAL_STORAGE_USER_INFO);
  const { t } = useTranslation();
  const login = async () => {
    if (username === '' || password === '') {
      showNotifier({
        title: t('errors.emptyCredentials'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }

    if (username !== canLoginInfo.name || password !== canLoginInfo.password) {
      showNotifier({
        title: t('errors.usernameOrPasswordError'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }

    if (!hasReadGuide) {
      showNotifier({
        title: t('errors.readManual'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }

    if (rememberpsw) {
      try {
        // save user info to localstorage
        await userInfo.setItem(
          JSON.stringify({
            id: canLoginInfo.id,
            username,
            password,
          })
        );
      } catch (e) {
        console.error(e);
      }
    }

    showNotifier({
      title: t('common.loginSuccess'),
      type: 'success',
      duration: 3000,
      onPress: () => {},
    });
    router.replace('/(home)');
  };

  const openGuideDialog = () => {
    setShowGuideDialog(true);
  };

  const closeGuideDialog = () => {
    setShowGuideDialog(false);
  };

  return (
    <View className="flex h-full w-full">
      <View className="relative w-full">
        <Image
          source={require('@/assets/images/bg.jpg')}
          style={{
            width: width / 2.5,
            height,
            position: 'absolute',
            right: 0,
            top: 0,
          }}
          contentFit="cover"
        />
        <Header />
        <Portal>
          <Modal
            visible={showGuideDialog}
            onDismiss={closeGuideDialog}
            contentContainerStyle={{
              backgroundColor: 'white',
              borderRadius: 15,
              paddingHorizontal: 20,
              height: '80%',
              marginHorizontal: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: width / 3,
            }}>
            <View className="h-[85%] w-full">
              <View className="mb-2 flex flex-row items-center justify-center">
                <Icon source="book-open-outline" size={22} />
                <Text className="-top-[1px] ml-2 py-8 text-center text-2xl font-bold">
                  {t('common.guide_book')}
                </Text>
              </View>
              <Text className="text-center text-lg">Coming soon...</Text>
            </View>
            <View className="bottom-4 flex h-1/5 items-center justify-center">
              <Button
                mode="contained"
                icon="check"
                className="w-full px-3"
                onPress={closeGuideDialog}>
                <Text className="text-lg font-bold">{t('common.iKnow')}</Text>
              </Button>
            </View>
          </Modal>
        </Portal>
        <View className="mt-20 flex flex-row px-32">
          <View className="relative flex w-5/12 items-center">
            <View className="w-full">
              <View className="">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                  <View className="relative">
                    <View className="absolute left-2 top-0 h-full w-10 items-center justify-center">
                      <Icon source="account-circle-outline" size={22} />
                    </View>

                    <TextInput
                      className="rounded-tl-2xl rounded-tr-2xl border-[0.5px] border-gray-500 py-5 pl-[50px]"
                      placeholder={t('common.pleaseInputUsername')}
                      value={username}
                      onChangeText={(text) => setUsername(text)}
                    />
                  </View>
                </KeyboardAvoidingView>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                  <View className="relative">
                    <View className="absolute left-2 top-0 h-full w-10 items-center justify-center">
                      <Icon source="lock-outline" size={22} />
                    </View>
                    <TextInput
                      className="rounded-bl-2xl rounded-br-2xl border-[0.5px] border-gray-500 py-5 pl-[50px]"
                      placeholder={t('common.pleaseInputPassword')}
                      secureTextEntry
                      value={password}
                      onChangeText={(text) => setPassword(text)}
                    />
                  </View>
                </KeyboardAvoidingView>
                <View className="mt-5 flex flex-col items-start justify-center ">
                  <View className="flex flex-row items-center justify-start">
                    <Checkbox.Android
                      status={rememberpsw ? 'checked' : 'unchecked'}
                      onPress={() => {
                        setRememberpsw(!rememberpsw);
                      }}
                    />
                    <Text className="text-md -mt-0.5">{t('common.autoLogin')}</Text>
                  </View>

                  <View className="flex flex-row items-center justify-start">
                    <Checkbox.Android
                      status={hasReadGuide ? 'checked' : 'unchecked'}
                      onPress={() => {
                        setHasReadGuide(!hasReadGuide);
                      }}
                    />
                    <View className="flex flex-row items-center justify-start">
                      <Text>{t('common.promise')}</Text>
                      <TouchableOpacity onPress={openGuideDialog}>
                        <Text className=" text-blue-500">{t('common.guide_book')}</Text>
                      </TouchableOpacity>
                      <Text className="text-md -mt-0.5">{t('common.promiseContent')}</Text>
                    </View>
                  </View>
                </View>

                <View className="mt-5 flex flex-row items-center justify-center gap-10">
                  <Button mode="contained" icon="login" className="w-full px-3" onPress={login}>
                    <Text className="text-lg font-bold">{t('common.login')}</Text>
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
