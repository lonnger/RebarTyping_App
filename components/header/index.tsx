import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router, useSegments } from 'expo-router';
import {
  BatteryEmpty,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Gear,
  WifiHigh,
} from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PermissionsAndroid,
  TouchableOpacity,
  View,
  Text,
  FlatList,
  AppState,
  Dimensions,
} from 'react-native';
import { Button, Dialog, Icon, Modal, Portal, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WifiManager, { WifiEntry } from 'react-native-wifi-reborn';

import { GlobalActivityIndicatorManager } from '../activity-indicator-global';
import { GlobalSnackbarManager } from '../snackbar-global';

import { GlobalConst } from '@/constants';
import { Command } from '@/constants/command';
import { eventBusKey } from '@/constants/event';
import useStore from '@/store';
import { ROBOT_CURRENT_MODE } from '@/types';
import eventBus from '@/utils/eventBus';
import { delayed, globalGetConnect, sendCmdDispatch } from '@/utils/helper';
import { showNotifier } from '@/utils/notifier';

// Wi-Fi 密码存储键
const WIFI_PASSWORDS_STORAGE_KEY = 'wifi_passwords';

export const Header = () => {
  const { top } = useSafeAreaInsets();
  const { setRobotStatus, robotStatus } = useStore((state) => state);
  const [wifiChooseListVisible, setWifiChooseListVisible] = useState(false);
  const [wifiPermission, setWifiPermission] = useState(false);
  const [wifiList, setWifiList] = useState<WifiEntry[]>([]);
  const [wifiPassword, setWifiPassword] = useState('');
  const segments = useSegments();
  const isLoginPage = segments.includes('(login)');
  const isSettingPage = segments.includes('(setting)');
  const { t } = useTranslation();
  // 连接WiFi密码对话框是否可见
  const [wifiPasswordDialogVisible, setWifiPasswordDialogVisible] = useState(false);
  const hideWifiPasswordDialog = () => setWifiPasswordDialogVisible(false);
  // 使用已保存密码对话框是否可见
  const [savedPasswordDialogVisible, setSavedPasswordDialogVisible] = useState(false);
  // 保存的Wi-Fi密码
  const [savedWifiPasswords, setSavedWifiPasswords] = useState<{ [ssid: string]: string }>({});
  const wifiPasswordsStorage = useAsyncStorage(WIFI_PASSWORDS_STORAGE_KEY);

  const { width } = Dimensions.get('screen');
  // 当前选择的WiFi SSID, 用于连接WiFi中间临时存储
  const currentSelectedWifi = useRef<string>('');

  // WiFi缓存管理系统
  const [wifiCache, setWifiCache] = useState<{
    data: WifiEntry[];
    timestamp: number;
    source: 'system' | 'force' | 'background';
  } | null>(null);

  // 缓存配置 - 可自定义
  const CACHE_CONFIG = {
    SYSTEM_CACHE_DURATION: 30000, // 系统缓存30秒
    FORCE_CACHE_DURATION: 60000, // 强制扫描缓存1分钟
    BACKGROUND_CACHE_DURATION: 45000, // 后台缓存45秒
    MAX_CACHE_AGE: 120000, // 最大缓存时间2分钟
  };

  // 检查缓存是否有效
  const isCacheValid = (cacheTimestamp: number, maxAge: number): boolean => {
    return Date.now() - cacheTimestamp < maxAge;
  };

  // 获取缓存的WiFi数据
  const getCachedWifiData = (): WifiEntry[] | null => {
    if (!wifiCache) return null;

    const { data, timestamp, source } = wifiCache;
    let maxAge = CACHE_CONFIG.SYSTEM_CACHE_DURATION;

    // 根据数据源设置不同的缓存时间
    switch (source) {
      case 'force':
        maxAge = CACHE_CONFIG.FORCE_CACHE_DURATION;
        break;
      case 'background':
        maxAge = CACHE_CONFIG.BACKGROUND_CACHE_DURATION;
        break;
      case 'system':
      default:
        maxAge = CACHE_CONFIG.SYSTEM_CACHE_DURATION;
        break;
    }

    if (isCacheValid(timestamp, maxAge)) {
      return data;
    }
    return null;
  };

  // 更新WiFi缓存
  const updateWifiCache = (data: WifiEntry[], source: 'system' | 'force' | 'background') => {
    const newCache = {
      data,
      timestamp: Date.now(),
      source,
    };
    setWifiCache(newCache);
  };

  // 清除过期缓存
  const clearExpiredCache = () => {
    if (wifiCache && !isCacheValid(wifiCache.timestamp, CACHE_CONFIG.MAX_CACHE_AGE)) {
      setWifiCache(null);
    }
  };

  // 定期清理过期缓存
  useEffect(() => {
    const cleanupInterval = setInterval(clearExpiredCache, 30000); // 每30秒检查一次
    return () => clearInterval(cleanupInterval);
  }, [wifiCache]);

  // 获取当前连接的WiFi SSID 并监听App状态 当App状态变为active时 获取当前连接的WiFi SSID
  useEffect(() => {
    fetchCurrentConnectWifiSSID();
    loadSavedWifiPasswords();
    getWifiPermission();
    const screenListener = AppState.addEventListener('change', fetchCurrentConnectWifiSSID);

    return () => screenListener.remove();
  }, []);

  // 加载保存的Wi-Fi密码
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

  // 保存Wi-Fi密码
  const saveWifiPassword = async (ssid: string, password: string) => {
    try {
      const newPasswords = { ...savedWifiPasswords, [ssid]: password };
      await wifiPasswordsStorage.setItem(JSON.stringify(newPasswords));
      setSavedWifiPasswords(newPasswords);
    } catch (error) {
      console.error('saveWifiPassword error', error);
    }
  };

  // 监听WiFi连接状态, 当WiFi连接状态为false时, 设置当前连接的WiFi SSID为空 ,提示重新连接
  useEffect(() => {
    // 监听来自机器人的WiFi事件
    const handleWifiEvent = (data: { eConnect: boolean }) => {
      if (!data.eConnect) {
        setRobotStatus({
          currentConnectWifiSSID: '',
        });
      }
    };

    eventBus.subscribe(eventBusKey.WifiEvent, handleWifiEvent);

    return () => {
      eventBus.unsubscribe(eventBusKey.WifiEvent, handleWifiEvent);
    };
  }, []);

  // 定期检查WiFi连接状态
  useEffect(() => {
    let wifiCheckInterval: NodeJS.Timeout;

    const checkWifiStatus = async () => {
      try {
        const currentSSID = await WifiManager.getCurrentWifiSSID();
        const previousSSID = robotStatus.currentConnectWifiSSID;

        // 如果之前有连接的WiFi，但现在获取不到SSID，说明断联了
        if (previousSSID && (!currentSSID || currentSSID === '')) {
          handleWifiDisconnected(`WiFi "${previousSSID}" ${t('common.disconnected')}`);
        }
        // 如果检测到WiFi变化（切换到其他WiFi）
        else if (currentSSID && previousSSID && currentSSID !== previousSSID) {
          setRobotStatus({
            currentConnectWifiSSID: currentSSID,
          });

          // 如果切换到的不是机器人WiFi，提示用户
          if (currentSSID.indexOf(GlobalConst.wifiName) === -1) {
            showNotifier({
              title: `${t('wifi.switchWifi')} ${currentSSID}`,
              message: t('wifi.notRobotWifi'),
              type: 'info',
              duration: 3000,
              onPress: () => {},
            });
          }
        }
        // 如果之前没有连接，现在检测到有连接
        else if (!previousSSID && currentSSID) {
          setRobotStatus({
            currentConnectWifiSSID: currentSSID,
          });
        }
      } catch (error) {
        console.error('checkWifiStatus error', error);
      }
    };

    // 只在非登录页面启动定期检查
    if (!isLoginPage) {
      // 立即检查一次
      checkWifiStatus();

      // 每5秒检查一次WiFi状态
      wifiCheckInterval = setInterval(checkWifiStatus, 5000);
    }

    return () => {
      if (wifiCheckInterval) {
        clearInterval(wifiCheckInterval);
      }
    };
  }, [isLoginPage, robotStatus.currentConnectWifiSSID]);

  // 处理WiFi断联的统一逻辑
  const handleWifiDisconnected = (reason: string) => {
    const previousSSID = robotStatus.currentConnectWifiSSID;

    // 更新连接状态
    setRobotStatus({
      currentConnectWifiSSID: '',
    });

    // 清空WiFi列表，强制用户重新搜索
    setWifiList([]);

    // 显示断联提示
    showNotifier({
      title: `${reason}`,
      message: t('wifi.reconnectWifi'),
      type: 'error',
      duration: 3000,
      onPress: () => {},
    });

    // 如果有之前连接的WiFi，记录日志
    if (previousSSID) {
      console.log(`WiFi断联处理: ${previousSSID} -> 断开连接 (原因: ${reason})`);
    }

    // 可选：自动尝试重连到之前的WiFi（如果有保存的密码）
    if (previousSSID && savedWifiPasswords[previousSSID]) {
      setTimeout(() => {
        GlobalSnackbarManager.current?.show({
          content: `${t('wifi.detected')} ${previousSSID} ${t('wifi.savedPassword')}，${t('wifi.autoConnect')}？`,
          action: t('common.reconnect'),
          actionCallback: () => autoReconnectWifi(previousSSID),
        });
      }, 2000);
    }
  };

  // 自动重连WiFi
  const autoReconnectWifi = async (ssid: string) => {
    try {
      const savedPassword = savedWifiPasswords[ssid];
      if (!savedPassword) {
        showNotifier({
          title: t('wifi.noSavedPassword'),
        });
        return;
      }

      GlobalActivityIndicatorManager.current?.show(`${t('wifi.autoReconnect')} ${ssid}...`, 0);

      await WifiManager.connectToProtectedSSID(ssid, savedPassword, true, false);

      setRobotStatus({
        currentConnectWifiSSID: ssid,
        currentConnectWifiPassword: savedPassword,
      });

      GlobalActivityIndicatorManager.current?.hide();
      showNotifier({
        title: `${t('wifi.autoReconnect')} ${ssid} ${t('common.success')}`,
        type: 'success',
        duration: 3000,
        onPress: () => {},
      });

      // 重新连接socket
      setTimeout(() => {
        handleConnectToSocketAgain();
      }, 200);
    } catch (error) {
      console.error('autoReconnectWifi error', error);
      GlobalActivityIndicatorManager.current?.hide();
      showNotifier({
        title: `${t('wifi.autoReconnect')} ${ssid} ${t('common.failed')}`,
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    }
  };

  const gotoSetting = () => {
    if (!isSettingPage) {
      router.push('/(setting)');
    }
  };

  // 获取WiFi权限
  const getWifiPermission = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: t('wifi.wifiPermissionTitle'),
        message: t('wifi.needLocationPermission'),
        buttonNegative: t('common.reject'),
        buttonPositive: t('common.allow'),
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      setWifiPermission(true);
    } else {
      setWifiPermission(false);
    }
  };

  // 打开WiFi设置
  const openWifiSetting = async () => {
    try {
      // 检查WiFi权限
      await getWifiPermission();
      if (!wifiPermission) {
        showNotifier({
          title: t('wifi.needWifiPermission'),
          type: 'error',
          duration: 3000,
          onPress: () => {},
        });
        return;
      }

      setWifiChooseListVisible(true);

      // 使用缓存系统进行初始加载
      await handleRefreshWifiList('auto');
    } catch (error: any) {
      console.error('打开WiFi设置失败:', error?.message || 'Unknown error');
      showNotifier({
        title: t('wifi.openWifiSettingFailed'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    }
  };

  // 获取当前连接的WiFi SSID
  const fetchCurrentConnectWifiSSID = async () => {
    const connectedWifiSSID = await WifiManager.getCurrentWifiSSID();
    setRobotStatus({
      currentConnectWifiSSID: connectedWifiSSID,
    });
  };

  const handleConnectToSocketAgain = async () => {
    GlobalActivityIndicatorManager.current?.show(t('wifi.reconnecting'), 0);

    await delayed(2000);

    globalGetConnect();

    GlobalActivityIndicatorManager.current?.hide();
  };

  const renderBatteryIcon = () => {
    if (robotStatus.electric > 80) {
      return <BatteryFull size={32} weight="bold" />;
    } else if (robotStatus.electric > 50) {
      return <BatteryMedium size={32} weight="bold" />;
    } else if (robotStatus.electric > 20) {
      return <BatteryLow size={32} weight="bold" />;
    } else {
      return <BatteryEmpty size={32} weight="bold" />;
    }
  };

  // 智能WiFi扫描策略 - 使用可配置缓存
  const handleRefreshWifiList = async (type: 'auto' | 'manual' = 'auto') => {
    if (type === 'manual') {
      GlobalActivityIndicatorManager.current?.show(t('wifi.refreshingWifiList'), 1000);
    }

    let loadWifiList: WifiEntry[] = [];

    try {
      if (type === 'auto') {
        // 自动模式：优先使用缓存
        const cachedData = getCachedWifiData();
        if (cachedData && cachedData.length > 0) {
          loadWifiList = cachedData;
        } else {
          // 缓存无效，获取系统缓存
          loadWifiList = await WifiManager.loadWifiList();
          updateWifiCache(loadWifiList, 'system');
        }
      } else {
        // 手动模式：尝试强制扫描，失败则使用最佳缓存
        try {
          loadWifiList = await WifiManager.reScanAndLoadWifiList();
          updateWifiCache(loadWifiList, 'force');
        } catch (error) {
          console.log('强制扫描失败，使用缓存数据:', error);

          // 强制扫描失败，使用最佳可用缓存
          const cachedData = getCachedWifiData();
          if (cachedData && cachedData.length > 0) {
            loadWifiList = cachedData;
          } else {
            // 没有有效缓存，尝试系统缓存
            loadWifiList = await WifiManager.loadWifiList();
            updateWifiCache(loadWifiList, 'system');
          }
        }
      }

      // 处理和过滤WiFi数据
      const uniqueSSIDs = new Map();
      loadWifiList.forEach((wifi) => {
        if (
          wifi.SSID &&
          wifi.SSID !== '(hidden SSID)' &&
          wifi.SSID.indexOf(GlobalConst.wifiName) > -1
        ) {
          const existing = uniqueSSIDs.get(wifi.SSID);
          if (!existing || wifi.level > existing.level) {
            uniqueSSIDs.set(wifi.SSID, wifi);
          }
        }
      });

      const filteredWifiList = Array.from(uniqueSSIDs.values())
        .sort((a, b) => b.level - a.level)
        .slice(0, 5);

      if (filteredWifiList.length > 0) {
        setWifiList(filteredWifiList);
      } else {
        setWifiList([]);
        if (type === 'manual') {
          showNotifier({
            title: t('wifi.noWifiList'),
            type: 'error',
            duration: 3000,
            onPress: () => {},
          });
        }
      }
    } catch (error) {
      console.error(t('wifi.wifiGetFailed'), error);
      setWifiList([]);

      if (type === 'manual') {
        showNotifier({
          title: t('wifi.wifiGetFailed'),
          type: 'error',
          duration: 3000,
          onPress: () => {},
        });
      }
    }
  };

  // 强制暂停
  const handleForcePause = () => {
    sendCmdDispatch(Command.softStop);
    setRobotStatus({
      robotDangerStatus: true,
      currentMode: ROBOT_CURRENT_MODE.LOCKED,
      currentBindingMode: '',
    });
  };

  // 处理Wi-Fi选择
  const handleWifiSelect = (ssid: string) => {
    currentSelectedWifi.current = ssid;

    // 检查是否有保存的密码
    if (savedWifiPasswords[ssid]) {
      setSavedPasswordDialogVisible(true);
    } else {
      setWifiPasswordDialogVisible(true);
    }
  };

  // 使用保存的密码连接
  const connectWithSavedPassword = async () => {
    setSavedPasswordDialogVisible(false);
    const savedPassword = savedWifiPasswords[currentSelectedWifi.current];

    await connectToWifi(savedPassword);
  };

  // 使用新密码连接
  const connectWithNewPassword = async () => {
    if (currentSelectedWifi.current === '' || wifiPassword.length === 0) {
      showNotifier({
        title: t('wifi.passwordEmptyOrWifiNotSelected'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
      return;
    }

    await connectToWifi(wifiPassword);

    // 保存密码到存储
    saveWifiPassword(currentSelectedWifi.current, wifiPassword);

    // 清空密码输入框
    setWifiPassword('');
    setWifiPasswordDialogVisible(false);
  };

  const handleLockScreen = () => {
    setRobotStatus({
      robotLockedStatus: true,
    });
  };

  // 连接到WiFi的核心逻辑
  const connectToWifi = async (password: string) => {
    try {
      setWifiChooseListVisible(false);
      GlobalActivityIndicatorManager.current?.show(
        `${t('common.connecting')} ${currentSelectedWifi.current}...`,
        0
      );

      await WifiManager.connectToProtectedSSID(currentSelectedWifi.current, password, true, false);

      showNotifier({
        title: t('wifi.connectSuccess'),
        type: 'success',
        duration: 3000,
        onPress: () => {},
      });

      setRobotStatus({
        currentConnectWifiSSID: currentSelectedWifi.current,
        currentConnectWifiPassword: password,
      });

      setTimeout(() => {
        // 重新连接socket
        handleConnectToSocketAgain();
      }, 200);
    } catch (error) {
      console.error('connectToWifi error', error);
      GlobalActivityIndicatorManager.current?.hide();
      showNotifier({
        title: t('wifi.connectFailed'),
        type: 'error',
        duration: 3000,
        onPress: () => {},
      });
    }
  };

  return (
    <View
      className="flex w-full flex-col items-end justify-between px-6 pt-5"
      style={{ paddingTop: top + 20 }}>
      <View className="mb-5 flex w-full flex-row items-center justify-between">
        <Image
          source={require('@/assets/hkcrc.png')}
          style={{ width: 335, height: 39.39 }}
          contentFit="contain"
          transition={1000}
        />

        <View className="flex flex-row items-center gap-2">
          <View className="flex flex-row items-center gap-2">
            {!isLoginPage ? (
              <Button
                icon={robotStatus.robotDangerStatus ? 'pause' : 'play'}
                mode="contained"
                buttonColor="red"
                onPress={handleForcePause}>
                {t('common.softStop')}
              </Button>
            ) : null}

            <Button icon="lock" mode="contained" buttonColor="#041FA5C0" onPress={handleLockScreen}>
              {t('common.lockScreenTips')}
            </Button>

            {!isLoginPage ? (
              <TouchableOpacity
                className="flex flex-row items-center gap-2 rounded-full bg-white p-3 px-4"
                onPress={openWifiSetting}>
                <WifiHigh size={18} weight="bold" />
                <Text className="text-sm text-gray-800">
                  {robotStatus.currentConnectWifiSSID ? robotStatus.currentConnectWifiSSID : 'WiFi'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {!isSettingPage ? (
              <TouchableOpacity
                className="flex flex-row items-center gap-2 rounded-full bg-white p-3 px-4"
                onPress={gotoSetting}>
                <Gear size={18} weight="bold" />
                <Text className="text-sm text-gray-800">{t('common.settings')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {renderBatteryIcon()}
        </View>
      </View>

      <Portal>
        <Modal
          visible={wifiChooseListVisible}
          onDismiss={() => setWifiChooseListVisible(false)}
          contentContainerStyle={{
            backgroundColor: 'white',
            borderRadius: 15,
            paddingHorizontal: 20,
            paddingVertical: 20,
            marginHorizontal: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: width / 3,
          }}>
          <View className="w-full">
            <View className="mb-5 flex flex-row items-center justify-between">
              <View className="flex flex-row items-center justify-center">
                <Icon source="cog" size={22} />
                <Text className="mb-1 ml-2 text-2xl font-bold">{t('wifi.selectWifi')}</Text>
              </View>

              <TouchableOpacity onPress={() => handleRefreshWifiList('manual')}>
                <Icon source="refresh" size={22} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={wifiList}
              keyExtractor={(item) => item.BSSID}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="my-1 flex flex-row items-center justify-between gap-2 rounded-lg bg-gray-200 px-5 py-3.5"
                  onPress={() => handleWifiSelect(item.SSID)}>
                  <View className="flex flex-row items-center justify-center">
                    <Icon source="wifi" size={20} />
                    <Text className="text-md ml-2 text-gray-800">{item.SSID}</Text>
                    <Text className="ml-2 text-sm text-gray-600">({item.level}dBm)</Text>
                    {savedWifiPasswords[item.SSID] && (
                      <View style={{ marginLeft: 5 }}>
                        <Icon source="content-save" size={16} color="#4CAF50" />
                      </View>
                    )}
                  </View>
                  {robotStatus.currentConnectWifiSSID === item.SSID ? (
                    <Text className="text-md text-gray-800">{t('common.connected')}</Text>
                  ) : (
                    <Text className="text-md text-gray-800">{t('common.connect')}</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View className="mb-5 flex flex-col items-center justify-center gap-2 p-4">
                  <Icon source="wifi-off" size={24} />
                  <Text className="text-lg font-bold text-gray-800">{t('wifi.noWifiList')}</Text>
                </View>
              )}
              ListFooterComponent={() => (
                <View className="mt-3 flex flex-row justify-center p-1">
                  <Text className="text-center text-sm font-bold text-gray-500">
                    {t('wifi.noWifiListTips')}
                  </Text>
                </View>
              )}
            />
          </View>
        </Modal>

        {/* 使用已保存密码的确认对话框 */}
        <Dialog
          visible={savedPasswordDialogVisible}
          style={{ width: '80%', left: '0%', right: '0%', marginHorizontal: 'auto' }}
          onDismiss={() => setSavedPasswordDialogVisible(false)}>
          <Dialog.Title>
            {t('wifi.useSavedPasswordTips')} {currentSelectedWifi.current}?
          </Dialog.Title>
          <Dialog.Content>
            <Text>
              {t('wifi.useSavedPasswordTips')} {currentSelectedWifi.current}?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setSavedPasswordDialogVisible(false);
                setWifiPasswordDialogVisible(true);
              }}>
              {t('wifi.useNewPasswordTips')}
            </Button>
            <Button onPress={connectWithSavedPassword}>{t('wifi.useSavedPasswordTips')}</Button>
          </Dialog.Actions>
        </Dialog>

        {/* 输入Wi-Fi密码对话框 */}
        <Dialog
          visible={wifiPasswordDialogVisible}
          style={{ width: '80%', left: '0%', right: '0%', marginHorizontal: 'auto' }}
          onDismiss={() => setWifiPasswordDialogVisible(false)}>
          <Dialog.Title>
            {t('wifi.inputWifiPassword')} {currentSelectedWifi.current}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              placeholder={t('wifi.inputWifiPassword')}
              value={wifiPassword}
              onChangeText={setWifiPassword}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideWifiPasswordDialog}>{t('common.cancel')}</Button>
            <Button onPress={connectWithNewPassword}>{t('common.connect')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};