import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as IntentLauncher from 'expo-intent-launcher';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  AppState,
} from 'react-native';
import { Button, Checkbox, Dialog, Icon, Modal, Portal } from 'react-native-paper';
import WifiManager, { WifiEntry } from 'react-native-wifi-reborn';

import { Header } from '@/components/header';
import { GlobalConst, storage_config } from '@/constants';
import useStore from '@/store';
import { isVpnActive, releaseEspWifiFromSystem } from '@/utils/espWifiSystemPicker';
import {
  getCountryPayloadFromIpInfo,
  getSavedIpCountryPayload,
  saveIpCountryPayload,
  saveIpLocationInfo,
} from '@/utils/ipCountry';
import { saveOnlineLoginAt } from '@/utils/loginSession';
import { showNotifier } from '@/utils/notifier';

const WIFI_PASSWORDS_STORAGE_KEY = 'wifi_passwords';
const IP_LOCATION_REQUEST_TIMEOUT_MS = 10_000;
const IP_LOCATION_ENDPOINTS = [
  {
    name: 'ipwho.is',
    url: 'https://ipwho.is/?fields=success,message,ip,country,country_code,latitude,longitude',
    normalize: (data: Record<string, any>) => ({
      success: data.success === true,
      message: data.message,
      ip: data.ip,
      country: data.country,
      countryCode: data.country_code,
      latitude: data.latitude,
      longitude: data.longitude,
    }),
  },
  {
    name: 'api.ip.sb',
    url: 'https://api.ip.sb/geoip',
    normalize: (data: Record<string, any>) => ({
      success: true,
      message: data.message,
      ip: data.ip,
      country: data.country,
      countryCode: data.country_code,
      latitude: data.latitude,
      longitude: data.longitude,
    }),
  },
];

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasReadGuide, setHasReadGuide] = useState(false);
  const [rememberpsw, setRememberpsw] = useState(true);
  const [showGuideDialog, setShowGuideDialog] = useState(false);
  const [internetWifiVisible, setInternetWifiVisible] = useState(false);
  const [internetWifiList, setInternetWifiList] = useState<WifiEntry[]>([]);
  const [wifiScanning, setWifiScanning] = useState(false);
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiPasswordDialogVisible, setWifiPasswordDialogVisible] = useState(false);
  const [savedPasswordDialogVisible, setSavedPasswordDialogVisible] = useState(false);
  const [savedWifiPasswords, setSavedWifiPasswords] = useState<{ [ssid: string]: string }>({});
  const [currentInternetWifiSSID, setCurrentInternetWifiSSID] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  const { width, height } = Dimensions.get('screen');
  const { canLoginInfo } = useStore((state) => state);
  const userInfo = useAsyncStorage(storage_config.LOCAL_STORAGE_USER_INFO);
  const wifiPasswordsStorage = useAsyncStorage(WIFI_PASSWORDS_STORAGE_KEY);
  const currentSelectedWifi = useRef('');
  const ipLocationRequestInFlightRef = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadSavedWifiPasswords();
    void releaseEspWifiFromSystem()
      .catch((error) => {
        console.warn('releaseEspWifiFromSystem error', error);
      })
      .finally(async () => {
        const hasPermission = await requestWifiPermission();
        if (hasPermission) {
          await fetchCurrentInternetWifiSSID();
        } else {
          showNotifier({
            title: t('wifi.ssidPermissionRequired'),
            type: 'warning',
            duration: 6000,
            onPress: () => {},
          });
        }
      });
  }, []);

  useEffect(() => {
    const appStateListener = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState !== 'active') {
        return;
      }

      const hasPermission = await checkWifiPermission();
      if (!hasPermission) {
        clearInternetWifiList();
        return;
      }

      await fetchCurrentInternetWifiSSID();

      if (internetWifiVisible) {
        refreshInternetWifiList(false);
      }
    });

    return () => appStateListener.remove();
  }, [internetWifiVisible]);

  const login = async () => {
    if (loadingLocation || ipLocationRequestInFlightRef.current) {
      return;
    }

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

    try {
      if (await isVpnActive()) {
        showNotifier({
          title: t('errors.vpnDetected'),
          type: 'error',
          duration: 6000,
          onPress: () => {},
        });
        return;
      }
    } catch (error) {
      console.error('VPN detection failed', error);
      showNotifier({
        title: t('errors.vpnCheckFailed'),
        type: 'error',
        duration: 5000,
        onPress: () => {},
      });
      return;
    }

    const ipLocationSaved = await handleGetIPLocation();
    if (!ipLocationSaved) {
      showNotifier({
        title: t('errors.networkLoginRequired'),
        type: 'error',
        duration: 5000,
        onPress: () => {},
      });
      return;
    }

    let savedIpCountry = null;
    try {
      savedIpCountry = await getSavedIpCountryPayload();
    } catch (error) {
      console.error('getSavedIpCountryPayload error', error);
    }
    if (!savedIpCountry) {
      showNotifier({
        title: t('errors.networkLoginRequired'),
        type: 'error',
        duration: 5000,
        onPress: () => {},
      });
      return;
    }

    try {
      await saveOnlineLoginAt();
    } catch (error) {
      console.error('saveOnlineLoginAt error', error);
      showNotifier({
        title: t('errors.networkLoginRequired'),
        type: 'error',
        duration: 5000,
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

  const loadSavedWifiPasswords = async () => {
    try {
      const savedPasswords = await wifiPasswordsStorage.getItem();
      if (savedPasswords) {
        setSavedWifiPasswords(JSON.parse(savedPasswords));
      }
    } catch (error) {
      console.error('loadSavedWifiPasswords error', error);
    }
  };

  const saveWifiPassword = async (ssid: string, passwordValue: string) => {
    try {
      const newPasswords = { ...savedWifiPasswords, [ssid]: passwordValue };
      await wifiPasswordsStorage.setItem(JSON.stringify(newPasswords));
      setSavedWifiPasswords(newPasswords);
    } catch (error) {
      console.error('saveWifiPassword error', error);
    }
  };

  const clearInternetWifiList = () => {
    setInternetWifiList([]);
    setCurrentInternetWifiSSID('');
  };

  const checkWifiPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const hasFineLocationPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (Number(Platform.Version) < 33) {
      return hasFineLocationPermission;
    }

    const hasNearbyWifiPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES
    );

    return hasFineLocationPermission && hasNearbyWifiPermission;
  };

  const requestWifiPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const hasPermission = await checkWifiPermission();
    if (hasPermission) {
      return true;
    }

    const requiredPermissions = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
    if (Number(Platform.Version) >= 33) {
      requiredPermissions.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
    }

    const permissionResults = await PermissionsAndroid.requestMultiple(requiredPermissions);

    return requiredPermissions.every(
      (permission) => permissionResults[permission] === PermissionsAndroid.RESULTS.GRANTED
    );
  };

  const fetchCurrentInternetWifiSSID = async () => {
    try {
      const connectedWifiSSID = await WifiManager.getCurrentWifiSSID();
      setCurrentInternetWifiSSID(connectedWifiSSID || '');
    } catch (error) {
      console.error('fetchCurrentInternetWifiSSID error', error);
    }
  };

  const openInternetWifiWindow = async () => {
    if (Platform.OS === 'android') {
      const hasPermission = await requestWifiPermission();
      if (!hasPermission) {
        clearInternetWifiList();
        showNotifier({
          title: t('wifi.ssidPermissionRequired'),
          type: 'warning',
          duration: 6000,
          onPress: () => {},
        });
      }

      try {
        await IntentLauncher.startActivityAsync('android.settings.panel.action.WIFI');
      } catch (error) {
        console.warn('Unable to open WiFi panel, falling back to WiFi settings', error);
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.WIFI_SETTINGS);
      }

      if (hasPermission) {
        await fetchCurrentInternetWifiSSID();
      }
      return;
    }

    await fetchCurrentInternetWifiSSID();

    const hasPermission = await requestWifiPermission();
    if (!hasPermission) {
      clearInternetWifiList();
      showNotifier({
        title: t('wifi.needWifiPermission'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }

    setInternetWifiVisible(true);
    refreshInternetWifiList(false);
  };

  const refreshInternetWifiList = async (showPermissionTips = true) => {
    setWifiScanning(true);

    try {
      const hasPermission = await checkWifiPermission();
      if (!hasPermission) {
        clearInternetWifiList();
        if (showPermissionTips) {
          showNotifier({
            title: t('wifi.needWifiPermission'),
            type: 'error',
            duration: 3000,
            onPress: () => {},
          });
        }
        return;
      }

      let loadedWifiList: WifiEntry[] = [];

      try {
        loadedWifiList = await WifiManager.reScanAndLoadWifiList();
      } catch (error) {
        console.log('reScanAndLoadWifiList failed, fallback to loadWifiList', error);
        loadedWifiList = await WifiManager.loadWifiList();
      }

      const normalizedWifiList = Array.isArray(loadedWifiList) ? loadedWifiList : [];
      if (!Array.isArray(loadedWifiList)) {
        console.warn('Internet WiFi list response is not an array:', loadedWifiList);
      }

      const uniqueSSIDs = new Map<string, WifiEntry>();
      normalizedWifiList.forEach((wifi) => {
        const ssid = wifi.SSID?.trim();
        if (!ssid || ssid === '(hidden SSID)' || ssid.startsWith(GlobalConst.wifiName)) {
          return;
        }

        const existing = uniqueSSIDs.get(ssid);
        if (!existing || wifi.level > existing.level) {
          uniqueSSIDs.set(ssid, wifi);
        }
      });

      setInternetWifiList(
        Array.from(uniqueSSIDs.values())
          .sort((a, b) => b.level - a.level)
          .slice(0, 12)
      );
    } catch (error) {
      console.error('refreshInternetWifiList error', error);
      showNotifier({
        title: t('wifi.wifiGetFailed'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    } finally {
      setWifiScanning(false);
    }
  };

  const handleInternetWifiSelect = (ssid: string) => {
    if (Platform.OS === 'android') {
      return;
    }

    currentSelectedWifi.current = ssid;

    if (savedWifiPasswords[ssid]) {
      setSavedPasswordDialogVisible(true);
    } else {
      setWifiPasswordDialogVisible(true);
    }
  };

  const connectWithSavedPassword = async () => {
    setSavedPasswordDialogVisible(false);
    const savedPassword = savedWifiPasswords[currentSelectedWifi.current];
    await connectToInternetWifi(savedPassword, false);
  };

  const connectWithNewPassword = async () => {
    if (!currentSelectedWifi.current || !wifiPassword) {
      showNotifier({
        title: t('wifi.passwordEmptyOrWifiNotSelected'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }

    await connectToInternetWifi(wifiPassword, true);
  };

  const connectToInternetWifi = async (passwordValue: string, shouldSavePassword: boolean) => {
    if (Platform.OS === 'android') {
      return;
    }

    try {
      setInternetWifiVisible(false);
      setWifiPasswordDialogVisible(false);

      await WifiManager.connectToProtectedSSID(
        currentSelectedWifi.current,
        passwordValue,
        true,
        false
      );

      if (shouldSavePassword) {
        await saveWifiPassword(currentSelectedWifi.current, passwordValue);
      }

      setCurrentInternetWifiSSID(currentSelectedWifi.current);
      setWifiPassword('');

      showNotifier({
        title: `${t('wifi.connectSuccess')}: ${currentSelectedWifi.current}`,
        type: 'success',
        duration: 3000,
        onPress: () => {},
      });
    } catch (error) {
      console.error('connectToInternetWifi error', error);
      showNotifier({
        title: t('wifi.connectFailed'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    }
  };

  const handleGetIPLocation = async (): Promise<boolean> => {
    if (ipLocationRequestInFlightRef.current) {
      return false;
    }

    ipLocationRequestInFlightRef.current = true;
    setLoadingLocation(true);

    try {
      let lastError: unknown = null;

      for (const endpoint of IP_LOCATION_ENDPOINTS) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), IP_LOCATION_REQUEST_TIMEOUT_MS);

        try {
          const separator = endpoint.url.includes('?') ? '&' : '?';
          const requestUrl = `${endpoint.url}${separator}_=${Date.now()}`;
          const response = await fetch(requestUrl, {
            signal: controller.signal,
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store',
              Pragma: 'no-cache',
            },
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = endpoint.normalize(await response.json());
          const latitude = Number(data.latitude);
          const longitude = Number(data.longitude);

          if (
            !data.success ||
            !data.ip ||
            (!data.country && !data.countryCode) ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
          ) {
            throw new Error(data.message || 'IP location response is invalid');
          }

          const countryPayload = getCountryPayloadFromIpInfo(data.country, data.countryCode);
          await Promise.all([
            saveIpCountryPayload(countryPayload),
            saveIpLocationInfo({
              ip: data.ip,
              country: data.country || '',
              countryCode: data.countryCode || '',
              latitude,
              longitude,
              source: endpoint.name,
              fetchedAt: Date.now(),
            }),
          ]);
          return true;
        } catch (error) {
          lastError = error;
          console.warn(`[IP_LOCATION_ENDPOINT_FAILED] ${endpoint.name}`, error);
        } finally {
          clearTimeout(timeoutId);
        }
      }

      console.error('获取 IP 定位失败，所有接口均不可用:', lastError);
      return false;
    } finally {
      ipLocationRequestInFlightRef.current = false;
      setLoadingLocation(false);
    }
  };

  const internetWifiButtonLabel = currentInternetWifiSSID || '连接上网 WiFi';

  const headerHeight = 100;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View className="w-full flex-1">
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

              <Modal
                visible={Platform.OS !== 'android' && internetWifiVisible}
                onDismiss={() => setInternetWifiVisible(false)}
                contentContainerStyle={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 20,
                  marginHorizontal: 'auto',
                  width: width / 2.6,
                  maxHeight: height * 0.78,
                }}>
                <View className="w-full">
                  <View className="mb-5 flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center">
                      <Icon source="wifi" size={22} />
                      <Text className="ml-2 text-2xl font-bold">连接上网 WiFi</Text>
                    </View>

                    <Button
                      compact
                      mode="text"
                      icon="refresh"
                      loading={wifiScanning}
                      disabled={wifiScanning}
                      onPress={() => refreshInternetWifiList()}>
                      刷新
                    </Button>
                  </View>

                  <FlatList
                    data={internetWifiList}
                    keyExtractor={(item) => item.BSSID || item.SSID}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        className="my-1 flex flex-row items-center justify-between rounded-lg bg-gray-100 px-5 py-3.5"
                        onPress={() => handleInternetWifiSelect(item.SSID)}>
                        <View className="flex flex-row items-center">
                          <Icon source="wifi" size={20} />
                          <Text className="ml-2 text-base text-gray-800">{item.SSID}</Text>
                          <Text className="ml-2 text-sm text-gray-600">({item.level}dBm)</Text>
                          {savedWifiPasswords[item.SSID] ? (
                            <View className="ml-2">
                              <Icon source="content-save" size={16} color="#16A34A" />
                            </View>
                          ) : null}
                        </View>
                        <Text className="text-sm text-gray-700">
                          {currentInternetWifiSSID === item.SSID
                            ? t('common.connected')
                            : t('common.connect')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={() => (
                      <View className="items-center justify-center gap-2 p-6">
                        <Icon source="wifi-off" size={24} />
                        <Text className="text-base font-bold text-gray-800">
                          {wifiScanning ? '正在搜索 WiFi...' : '未找到可上网 WiFi'}
                        </Text>
                        <Text className="text-center text-sm text-gray-500">
                          此处会隐藏 ESP 开头的机器 WiFi
                        </Text>
                      </View>
                    )}
                  />
                </View>
              </Modal>

              <Dialog
                visible={Platform.OS !== 'android' && savedPasswordDialogVisible}
                style={{ width: '80%', left: '0%', right: '0%', marginHorizontal: 'auto' }}
                onDismiss={() => setSavedPasswordDialogVisible(false)}>
                <Dialog.Title>使用已保存密码?</Dialog.Title>
                <Dialog.Content>
                  <Text>是否使用已保存密码连接 {currentSelectedWifi.current}?</Text>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button
                    onPress={() => {
                      setSavedPasswordDialogVisible(false);
                      setWifiPasswordDialogVisible(true);
                    }}>
                    输入新密码
                  </Button>
                  <Button onPress={connectWithSavedPassword}>
                    <Text>使用保存密码</Text>
                  </Button>
                </Dialog.Actions>
              </Dialog>

              <Dialog
                visible={Platform.OS !== 'android' && wifiPasswordDialogVisible}
                style={{ width: '80%', left: '0%', right: '0%', marginHorizontal: 'auto' }}
                onDismiss={() => setWifiPasswordDialogVisible(false)}>
                <Dialog.Title>输入 WiFi 密码 {currentSelectedWifi.current}</Dialog.Title>
                <Dialog.Content>
                  <TextInput
                    className="rounded-lg border-[0.5px] border-gray-400 px-4 py-3"
                    placeholder="输入 WiFi 密码"
                    value={wifiPassword}
                    secureTextEntry
                    onChangeText={setWifiPassword}
                  />
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setWifiPasswordDialogVisible(false)}>
                    <Text>{t('common.cancel')}</Text>
                  </Button>
                  <Button onPress={connectWithNewPassword}>
                    <Text>{t('common.connect')}</Text>
                  </Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
            <View className="mt-20 flex flex-row px-32">
              <View className="relative flex w-5/12 items-center">
                <View className="w-full">
                  <View className="">
                    <View className="relative">
                      <View className="absolute left-2 top-0 h-full w-10 items-center justify-center">
                        <Icon source="account-circle-outline" size={22} />
                      </View>

                      <TextInput
                        className="rounded-tl-2xl rounded-tr-2xl border-[0.5px] border-gray-500 py-5 pl-[50px]"
                        placeholder={t('common.pleaseInputUsername')}
                        value={username}
                        onChangeText={(text) => setUsername(text)}
                        returnKeyType="next"
                        blurOnSubmit={false}
                      />
                    </View>
                    <View className="relative mt-2">
                      <View className="absolute left-2 top-0 h-full w-10 items-center justify-center">
                        <Icon source="lock-outline" size={22} />
                      </View>
                      <TextInput
                        className="rounded-bl-2xl rounded-br-2xl border-[0.5px] border-gray-500 py-5 pl-[50px]"
                        placeholder={t('common.pleaseInputPassword')}
                        secureTextEntry
                        value={password}
                        onChangeText={(text) => setPassword(text)}
                        returnKeyType="done"
                        onSubmitEditing={login}
                      />
                    </View>
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
                      <Button
                        mode="contained"
                        icon="login"
                        className="w-full px-3"
                        loading={loadingLocation}
                        disabled={loadingLocation}
                        onPress={login}>
                        <Text className="text-lg font-bold">{t('common.login')}</Text>
                      </Button>
                    </View>

                    <View className="mt-5 flex flex-row items-center justify-between">
                      <Button
                        mode="outlined"
                        icon="wifi"
                        className="w-full"
                        onPress={openInternetWifiWindow}>
                        <Text numberOfLines={1}>{internetWifiButtonLabel}</Text>
                      </Button>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
