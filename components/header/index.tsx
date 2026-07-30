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
  Platform,
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
import { requestEspWifiFromSystem } from '@/utils/espWifiSystemPicker';

// Wi-Fi 密码存储键
const WIFI_PASSWORDS_STORAGE_KEY = 'wifi_passwords';
const WIFI_FORCE_SCAN_COOLDOWN_MS = 30_000;

export const Header = () => {
  const { top } = useSafeAreaInsets();
  const { setRobotStatus, robotStatus } = useStore((state) => state);
  const [wifiChooseListVisible, setWifiChooseListVisible] = useState(false);
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
  const [wifiConnecting, setWifiConnecting] = useState(false);
  const [espSystemPasswordDialogVisible, setEspSystemPasswordDialogVisible] = useState(false);
  const wifiPasswordsStorage = useAsyncStorage(WIFI_PASSWORDS_STORAGE_KEY);
  const [currentWifiSSID, setCurrentWifiSSID] = useState<string | null>(null);
  const hasShownRobotWifiPromptRef = useRef(false);
  const wifiRefreshInFlightRef = useRef(false);
  const lastForcedWifiScanAtRef = useRef(0);

  const { width } = Dimensions.get('screen');
  // 当前选择的WiFi SSID, 用于连接WiFi中间临时存储
  const currentSelectedWifi = useRef<string>('');
  const isRobotWifiSSID = (ssid: string) =>
    normalizeWifiSSID(ssid).startsWith(GlobalConst.wifiName);
  const normalizeWifiSSID = (ssid: string) => ssid.replace(/^"|"$/g, '');
  const getSavedRobotWifiPassword = () => {
    return Object.entries(savedWifiPasswords).find(([ssid]) =>
      normalizeWifiSSID(ssid).startsWith(GlobalConst.wifiName)
    )?.[1];
  };

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
  const getCachedWifiData = (ignoreAge: boolean = false): WifiEntry[] | null => {
    if (!wifiCache) return null;

    const { data, timestamp, source } = wifiCache;
    if (!Array.isArray(data)) return null;

    if (ignoreAge) return data;

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
    if (!Array.isArray(data)) {
      console.warn('[ROBOT_WIFI_CACHE] ignored non-array scan result', data);
      return;
    }

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
      const latestSavedPasswordsValue = await wifiPasswordsStorage.getItem();
      let latestSavedPasswords: { [ssid: string]: string } = {};
      if (latestSavedPasswordsValue) {
        try {
          latestSavedPasswords = JSON.parse(latestSavedPasswordsValue);
        } catch {
          console.warn('Saved WiFi passwords are invalid, replacing stored value');
        }
      }

      const newPasswords = { ...latestSavedPasswords, [ssid]: password };
      await wifiPasswordsStorage.setItem(JSON.stringify(newPasswords));
      setSavedWifiPasswords(newPasswords);
      return true;
    } catch (error) {
      console.error('saveWifiPassword error', error);
      return false;
    }
  };

  // 监听WiFi连接状态, 当WiFi连接状态为false时, 设置当前连接的WiFi SSID为空 ,提示重新连接
  useEffect(() => {
    // 监听来自机器人的WiFi事件
    const handleWifiEvent = (data: { eConnect: boolean }) => {
      if (!data.eConnect) {
        setCurrentWifiSSID('');
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

  const showRobotWifiPrompt = () => {
    if (isLoginPage || hasShownRobotWifiPromptRef.current) {
      return;
    }

    hasShownRobotWifiPromptRef.current = true;
    showNotifier({
      title: t('wifi.connectRobotWifiReminderTitle'),
      message: t('wifi.connectRobotWifiReminderMessage'),
      type: 'info',
      duration: 5000,
      onPress: () => { },
    });
  };

  // 定期检查WiFi连接状态
  useEffect(() => {
    let wifiCheckInterval: NodeJS.Timeout;

    const checkWifiStatus = async () => {
      try {
        if (wifiConnecting) {
          return;
        }

        const currentSSID = (await WifiManager.getCurrentWifiSSID()) || '';
        setCurrentWifiSSID(currentSSID);
        const previousSSID = robotStatus.currentConnectWifiSSID;
        const currentIsRobotWifi = isRobotWifiSSID(currentSSID);

        if (currentIsRobotWifi) {
          hasShownRobotWifiPromptRef.current = false;
        }

        // 如果之前有连接的WiFi，但现在获取不到SSID，说明断联了
        if (previousSSID && !currentIsRobotWifi) {
          handleWifiDisconnected(`WiFi "${previousSSID}" ${t('common.disconnected')}`);
        }
        // 如果检测到WiFi变化（切换到其他WiFi）
        else if (currentSSID && previousSSID && currentSSID !== previousSSID) {
          if (currentIsRobotWifi) {
            setRobotStatus({
              currentConnectWifiSSID: currentSSID,
            });
          } else {
            showNotifier({
              title: `${t('wifi.switchWifi')} ${currentSSID}`,
              message: t('wifi.notRobotWifi'),
              type: 'info',
              duration: 3000,
              onPress: () => { },
            });
          }
        }
        // 如果之前没有连接，现在检测到有连接
        else if (!previousSSID && currentIsRobotWifi) {
          setRobotStatus({
            currentConnectWifiSSID: currentSSID,
          });
        }
        else if (!previousSSID && !currentIsRobotWifi) {
          showRobotWifiPrompt();
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
  }, [isLoginPage, robotStatus.currentConnectWifiSSID, wifiConnecting]);

  // 处理WiFi断联的统一逻辑
  const handleWifiDisconnected = (reason: string) => {
    const previousSSID = robotStatus.currentConnectWifiSSID;

    // 更新连接状态
    setCurrentWifiSSID('');
    setRobotStatus({
      currentConnectWifiSSID: '',
    });

    // 显示断联提示
    showRobotWifiPrompt();

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

      await delayed(200);
      const robotConnected = await handleConnectToSocketAgain();

      showNotifier({
        title: robotConnected
          ? `${t('wifi.autoReconnect')} ${ssid} ${t('common.success')}`
          : t('errors.robotUnconnectedTips'),
        message: robotConnected ? '' : `${ssid} / TCP 8080`,
        type: robotConnected ? 'success' : 'error',
        duration: robotConnected ? 3000 : 5000,
        onPress: () => { },
      });
    } catch (error) {
      console.error('autoReconnectWifi error', error);
      GlobalActivityIndicatorManager.current?.hide();
      showNotifier({
        title: `${t('wifi.autoReconnect')} ${ssid} ${t('common.failed')}`,
        type: 'error',
        duration: 3000,
        onPress: () => { },
      });
    }
  };

  const gotoSetting = () => {
    if (!isSettingPage) {
      router.push('/(setting)');
    }
  };

  // 获取WiFi权限
  const getWifiPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const requiredPermissions = [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ...(Number(Platform.Version) >= 33
        ? [PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES]
        : []),
    ];

    const permissionResults = await PermissionsAndroid.requestMultiple(requiredPermissions);
    return requiredPermissions.every(
      (permission) => permissionResults[permission] === PermissionsAndroid.RESULTS.GRANTED
    );
  };

  const resolveSystemSelectedRobotSSID = async (nativeSSID?: string): Promise<string> => {
    const selectedSSID = normalizeWifiSSID(nativeSSID || '');
    if (selectedSSID.startsWith(GlobalConst.wifiName)) {
      return selectedSSID;
    }

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const currentSSID = normalizeWifiSSID((await WifiManager.getCurrentWifiSSID()) || '');
      if (currentSSID.startsWith(GlobalConst.wifiName)) {
        return currentSSID;
      }
      await delayed(250);
    }

    throw new Error('系统已连接 WiFi，但无法确认所选 ESP 网络名称');
  };

  const connectToSystemEspWifi = async (password: string): Promise<boolean> => {
    if (wifiConnecting) {
      return false;
    }

    try {
      setWifiConnecting(true);
      setWifiChooseListVisible(false);

      console.log('[ESP_SYSTEM_PICKER_OPEN]', {
        prefix: GlobalConst.wifiName,
      });
      const result = await requestEspWifiFromSystem(GlobalConst.wifiName, password);
      const selectedSSID = await resolveSystemSelectedRobotSSID(result.ssid);

      console.log('[ESP_SYSTEM_PICKER_SELECTED]', {
        ssid: selectedSSID,
      });
      currentSelectedWifi.current = selectedSSID;
      setCurrentWifiSSID(selectedSSID);
      setRobotStatus({
        currentConnectWifiSSID: selectedSSID,
        currentConnectWifiPassword: password,
      });

      const passwordSaved = await saveWifiPassword(selectedSSID, password);
      if (!passwordSaved) {
        console.warn('[ESP_SYSTEM_PICKER_PASSWORD_SAVE_FAILED]', {
          ssid: selectedSSID,
        });
      }

      await delayed(200);
      const robotConnected = await handleConnectToSocketAgain();
      showNotifier({
        title: robotConnected
          ? `${t('wifi.connectSuccess')}: ${selectedSSID}`
          : t('errors.robotUnconnectedTips'),
        message: robotConnected ? '' : `${selectedSSID} / TCP 8080`,
        type: robotConnected ? 'success' : 'error',
        duration: robotConnected ? 3000 : 5000,
        onPress: () => { },
      });

      return robotConnected;
    } catch (error: any) {
      if (error?.code === 'ESP_WIFI_UNAVAILABLE') {
        console.log('[ESP_SYSTEM_PICKER_CANCELLED_OR_UNAVAILABLE]');
        return false;
      }

      console.error('[ESP_SYSTEM_PICKER_ERROR]', error);
      const errorMessages: Record<string, string> = {
        ANDROID_VERSION_UNSUPPORTED: '当前 Android 版本不支持 ESP 系统选择窗口',
        ESP_WIFI_LOST: '所选 ESP WiFi 连接已断开',
        ESP_WIFI_REQUEST_FAILED: 'Android 无法打开 ESP WiFi 系统选择窗口',
      };
      showNotifier({
        title: t('wifi.connectFailed'),
        message: errorMessages[error?.code] || error?.message || '未知错误',
        type: 'error',
        duration: 5000,
        onPress: () => { },
      });
      return false;
    } finally {
      setWifiConnecting(false);
    }
  };

  const connectWithSystemEspPassword = async () => {
    if (!wifiPassword) {
      showNotifier({
        title: t('wifi.passwordEmptyOrWifiNotSelected'),
        type: 'error',
        duration: 3000,
        onPress: () => { },
      });
      return;
    }

    const password = wifiPassword;
    setEspSystemPasswordDialogVisible(false);
    const connected = await connectToSystemEspWifi(password);
    if (connected) {
      setWifiPassword('');
    }
  };

  // 打开WiFi设置
  const openWifiSetting = async () => {
    try {
      // 检查WiFi权限
      const hasPermission = await getWifiPermission();
      if (!hasPermission) {
        showNotifier({
          title: t('wifi.needWifiPermission'),
          type: 'error',
          duration: 3000,
          onPress: () => { },
        });
        return;
      }

      const cachedWifiList = getCachedWifiData(true);
      if (cachedWifiList) {
        applyRobotWifiList(cachedWifiList);
      }
      setWifiChooseListVisible(true);

      // Show cached results immediately, then synchronize with a fresh system scan.
      void handleRefreshWifiList('open');
    } catch (error: any) {
      console.error('打开WiFi设置失败:', error?.message || 'Unknown error');
      showNotifier({
        title: t('wifi.openWifiSettingFailed'),
        type: 'error',
        duration: 3000,
        onPress: () => { },
      });
    }
  };

  // 获取当前连接的WiFi SSID
  const fetchCurrentConnectWifiSSID = async () => {
    try {
      const connectedWifiSSID = (await WifiManager.getCurrentWifiSSID()) || '';
      setCurrentWifiSSID(connectedWifiSSID);

      if (isLoginPage) {
        return;
      }

      if (isRobotWifiSSID(connectedWifiSSID)) {
        setRobotStatus({
          currentConnectWifiSSID: connectedWifiSSID,
        });
        return;
      }

      setRobotStatus({
        currentConnectWifiSSID: '',
      });
    } catch (error) {
      console.warn('Unable to read system primary WiFi SSID', error);
    }
  };

  const handleConnectToSocketAgain = async (): Promise<boolean> => {
    GlobalActivityIndicatorManager.current?.show(t('wifi.reconnecting'), 0);

    try {
      await delayed(2000);
      return await globalGetConnect(true);
    } finally {
      GlobalActivityIndicatorManager.current?.hide();
    }
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
  const getRobotWifiList = (entries?: WifiEntry[] | null) => {
    const uniqueSSIDs = new Map<string, WifiEntry>();
    const normalizedEntries = Array.isArray(entries) ? entries : [];

    normalizedEntries.forEach((wifi) => {
      if (
        wifi.SSID &&
        wifi.SSID !== '(hidden SSID)' &&
        normalizeWifiSSID(wifi.SSID).startsWith(GlobalConst.wifiName)
      ) {
        const existing = uniqueSSIDs.get(wifi.SSID);
        if (!existing || wifi.level > existing.level) {
          uniqueSSIDs.set(wifi.SSID, wifi);
        }
      }
    });

    return Array.from(uniqueSSIDs.values())
      .sort((a, b) => b.level - a.level)
      .slice(0, 5);
  };

  const applyRobotWifiList = (entries?: WifiEntry[] | null) => {
    const filteredWifiList = getRobotWifiList(entries);
    if (filteredWifiList.length > 0) {
      setWifiList(filteredWifiList);
      return true;
    }
    return false;
  };

  const handleRefreshWifiList = async (type: 'auto' | 'open' | 'manual' = 'auto') => {
    if (wifiRefreshInFlightRef.current) {
      console.log('[ROBOT_WIFI_SCAN] refresh already in progress');
      return;
    }
    wifiRefreshInFlightRef.current = true;

    if (type === 'manual') {
      GlobalActivityIndicatorManager.current?.show(t('wifi.refreshingWifiList'), 1500);
    }

    let loadWifiList: WifiEntry[] = [];
    let latestSystemWifiList: WifiEntry[] = [];

    try {
      if (type === 'auto') {
        // 自动模式：优先使用缓存
        const cachedData = getCachedWifiData();
        if (cachedData && getRobotWifiList(cachedData).length > 0) {
          loadWifiList = cachedData;
        } else {
          // 缓存无效，获取系统缓存
          loadWifiList = await WifiManager.loadWifiList();
          if (loadWifiList && loadWifiList.length > 0) {
            updateWifiCache(loadWifiList, 'system');
          }
        }
      } else {
        try {
          const systemWifiList = await WifiManager.loadWifiList();
          if (Array.isArray(systemWifiList) && systemWifiList.length > 0) {
            latestSystemWifiList = systemWifiList;
            updateWifiCache(systemWifiList, 'system');
            if (applyRobotWifiList(systemWifiList)) {
              console.log('[ROBOT_WIFI_SCAN] displayed system scan results before forced scan');
            }
          }
        } catch (error) {
          console.warn('[ROBOT_WIFI_SCAN] unable to load system scan results', error);
        }

        const timeSinceLastForcedScan = Date.now() - lastForcedWifiScanAtRef.current;
        if (timeSinceLastForcedScan < WIFI_FORCE_SCAN_COOLDOWN_MS) {
          console.log('[ROBOT_WIFI_SCAN] active scan skipped during Android cooldown');
          return;
        }
        lastForcedWifiScanAtRef.current = Date.now();

        // 手动模式：尝试强制扫描，失败则使用最佳缓存
        try {
          const forcedScanPromise = WifiManager.reScanAndLoadWifiList();
          const forcedScanResult = await Promise.race<WifiEntry[] | null>([
            forcedScanPromise,
            delayed(5000).then(() => null),
          ]);

          if (forcedScanResult === null) {
            console.warn('[ROBOT_WIFI_SCAN] forced scan is slow; showing available system results');
            loadWifiList = await WifiManager.loadWifiList();
            void forcedScanPromise
              .then((lateWifiList) => {
                if (Array.isArray(lateWifiList) && lateWifiList.length > 0) {
                  updateWifiCache(lateWifiList, 'force');
                  applyRobotWifiList(lateWifiList);
                }
              })
              .catch((error) => {
                console.warn('[ROBOT_WIFI_SCAN] late forced scan failed', error);
              });
          } else if (Array.isArray(forcedScanResult)) {
            loadWifiList = forcedScanResult;
          } else {
            console.warn(
              '[ROBOT_WIFI_SCAN] forced scan was throttled or returned an invalid result; keeping existing list',
              forcedScanResult
            );
            const cachedData = getCachedWifiData(true);
            loadWifiList =
              latestSystemWifiList.length > 0
                ? latestSystemWifiList
                : Array.isArray(cachedData)
                  ? cachedData
                  : [];
          }

          if (loadWifiList && loadWifiList.length > 0) {
            updateWifiCache(loadWifiList, 'force');
          } else {
            console.log('强制扫描返回空列表，可能被系统节流，尝试使用缓存数据');
            const cachedData = getCachedWifiData(true);
            if (cachedData && cachedData.length > 0) {
              loadWifiList = cachedData;
            } else {
              loadWifiList = await WifiManager.loadWifiList();
              if (loadWifiList && loadWifiList.length > 0) {
                updateWifiCache(loadWifiList, 'system');
              }
            }
          }
        } catch (error) {
          console.log('强制扫描失败，使用缓存数据:', error);

          // 强制扫描失败，使用最佳可用缓存
          const cachedData = getCachedWifiData(true);
          if (cachedData && cachedData.length > 0) {
            loadWifiList = cachedData;
          } else {
            // 没有有效缓存，尝试系统缓存
            loadWifiList = await WifiManager.loadWifiList();
            if (loadWifiList && loadWifiList.length > 0) {
              updateWifiCache(loadWifiList, 'system');
            }
          }
        }
      }

      const normalizedWifiList = Array.isArray(loadWifiList) ? loadWifiList : [];
      if (!Array.isArray(loadWifiList)) {
        console.warn('WiFi list response is not an array:', loadWifiList);
      }

      // 处理和过滤WiFi数据
      const uniqueSSIDs = new Map();
      normalizedWifiList.forEach((wifi) => {
        if (
          wifi.SSID &&
          wifi.SSID !== '(hidden SSID)' &&
          normalizeWifiSSID(wifi.SSID).startsWith(GlobalConst.wifiName)
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

      if (filteredWifiList.length === 0 && type === 'manual') {
        showNotifier({
          title: t('wifi.noWifiList'),
          type: 'error',
          duration: 3000,
          onPress: () => { },
        });
      }

      if (filteredWifiList.length > 0) {
        setWifiList(filteredWifiList);
      } else {
        setWifiList((prevList) => {
          if (prevList && prevList.length > 0) {
            console.log('新获取的列表为空，保留当前显示的WiFi列表');
            return prevList;
          }
          return [];
        });
      }
    } catch (error) {
      console.error(t('wifi.wifiGetFailed'), error);

      setWifiList((prevList) => {
        if (prevList && prevList.length > 0) {
          return prevList;
        }
        return [];
      });

      if (type === 'manual') {
        showNotifier({
          title: t('wifi.wifiGetFailed'),
          type: 'error',
          duration: 3000,
          onPress: () => { },
        });
      }
    } finally {
      wifiRefreshInFlightRef.current = false;
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

    const connected = await connectToWifi(savedPassword);
    if (!connected) {
      setWifiPassword('');
      setWifiPasswordDialogVisible(true);
    }
  };

  // 使用新密码连接
  const connectWithNewPassword = async () => {
    if (currentSelectedWifi.current === '' || wifiPassword.length === 0) {
      showNotifier({
        title: t('wifi.passwordEmptyOrWifiNotSelected'),
        type: 'error',
        duration: 3000,
        onPress: () => { },
      });
      return;
    }

    const selectedSSID = currentSelectedWifi.current;
    const enteredPassword = wifiPassword;
    const connected = await connectToWifi(enteredPassword);
    if (!connected) {
      return;
    }

    // 仅在确认连接成功后保存密码
    const passwordSaved = await saveWifiPassword(selectedSSID, enteredPassword);
    if (!passwordSaved) {
      showNotifier({
        title: 'WiFi 已连接，但密码保存失败',
        type: 'warning',
        duration: 3000,
        onPress: () => { },
      });
    }

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
    const selectedSSID = currentSelectedWifi.current;

    try {
      if (wifiConnecting) {
        return false;
      }

      setWifiConnecting(true);

      const hasPermission = await getWifiPermission();
      if (!hasPermission) {
        throw new Error('缺少位置或附近 WiFi 权限');
      }

      setWifiChooseListVisible(false);
      GlobalActivityIndicatorManager.current?.show(
        `${t('common.connecting')} ${selectedSSID}...`,
        0
      );

      const selectedWifi = wifiList.find((wifi) => wifi.SSID === selectedSSID);
      console.log('[WIFI_CONNECT]', {
        ssid: selectedSSID,
        capabilities: selectedWifi?.capabilities,
        level: selectedWifi?.level,
      });

      let isAlreadyConnectedToSelectedWifi = false;
      try {
        const systemSSID = normalizeWifiSSID((await WifiManager.getCurrentWifiSSID()) || '');
        isAlreadyConnectedToSelectedWifi = systemSSID === normalizeWifiSSID(selectedSSID);
      } catch (error) {
        console.warn('[WIFI_CURRENT_SSID_CHECK_FAILED]', error);
      }

      if (isAlreadyConnectedToSelectedWifi) {
        console.log('[WIFI_ALREADY_CONNECTED]', { ssid: selectedSSID });
      } else {
        await WifiManager.connectToProtectedSSID(selectedSSID, password, true, false);
      }

      setCurrentWifiSSID(selectedSSID);
      setRobotStatus({
        currentConnectWifiSSID: selectedSSID,
        currentConnectWifiPassword: password,
      });

      await delayed(200);
      const robotConnected = await handleConnectToSocketAgain();

      showNotifier({
        title: robotConnected
          ? `${t('wifi.connectSuccess')}: ${selectedSSID}`
          : t('errors.robotUnconnectedTips'),
        message: robotConnected ? '' : `${selectedSSID} / TCP 8080`,
        type: robotConnected ? 'success' : 'error',
        duration: robotConnected ? 3000 : 5000,
        onPress: () => { },
      });

      return true;
    } catch (error: any) {
      console.error('connectToWifi error', error);
      GlobalActivityIndicatorManager.current?.hide();

      const errorMessages: Record<string, string> = {
        didNotFindNetwork:
          'Android 未批准或无法满足本次 ESP WiFi 连接请求，请确认系统连接弹窗并重试',
        authenticationErrorOccurred: 'WiFi 密码错误，请重新输入',
        timeoutOccurred: '连接 ESP WiFi 超时，请靠近设备后重试',
        locationPermissionMissing: '缺少位置或附近 WiFi 权限',
        locationServicesOff: '请先打开系统定位服务',
        android10ImmediatelyDroppedConnection: '系统在连接后立即断开了 ESP WiFi',
        unableToConnect: '系统无法连接到该 ESP WiFi',
      };

      showNotifier({
        title: t('wifi.connectFailed'),
        message: errorMessages[error?.code] || error?.message || '未知错误',
        type: 'error',
        duration: 5000,
        onPress: () => { },
      });
      return false;
    } finally {
      setWifiConnecting(false);
    }
  };

  const robotWifiButtonLabel =
    currentWifiSSID && isRobotWifiSSID(currentWifiSSID)
      ? currentWifiSSID
      : t('common.wifi');

  return (
  <View 
  className="flex w-full flex-col px-6" 
  style={{ paddingTop: top + 20 }}>
        <View className="flex w-full flex-row items-start justify-between">
        <View className="flex flex-col items-start gap-0">
          <Image
            source={require('@/assets/hkcrc.png')}
            style={{ width: 358, height: 44 }}
            contentFit="contain"
            transition={1000}
          />
        <View
          style={{
            width: 18,
            height: 44,
            marginTop: 0,
            backgroundColor: '#F5F5F5',
          }}
        />
        </View>

        <View className="flex flex-row items-center gap-2">
          <View className="flex flex-row items-center gap-2 pt-1">
            {!isLoginPage ? (
              <Button
                icon={robotStatus.robotDangerStatus ? 'pause' : 'play'}
                mode="contained"
                buttonColor="red"
                onPress={handleForcePause}>
                <Text>{t('common.softStop')}</Text>
              </Button>
            ) : null}

            <Button icon="lock" mode="contained" buttonColor="#041FA5C0" onPress={handleLockScreen}>
              <Text>{t('common.lockScreenTips')}</Text>
            </Button>

            {!isLoginPage ? (
              <TouchableOpacity
                className="flex flex-row items-center gap-2 rounded-full bg-white p-3 px-4"
                onPress={openWifiSetting}>
                <WifiHigh size={18} weight="bold" />
                <Text className="text-sm text-gray-800">
                  {robotWifiButtonLabel}
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
            <Button onPress={connectWithSavedPassword}>
              <Text>{t('wifi.useSavedPasswordTips')}</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Android 系统 ESP WiFi 选择窗口使用的通用密码 */}
        <Dialog
          visible={espSystemPasswordDialogVisible}
          style={{ width: '80%', left: '0%', right: '0%', marginHorizontal: 'auto' }}
          onDismiss={() => setEspSystemPasswordDialogVisible(false)}>
          <Dialog.Title>{t('wifi.inputWifiPassword')}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              placeholder={t('wifi.inputWifiPassword')}
              value={wifiPassword}
              secureTextEntry
              onChangeText={setWifiPassword}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              disabled={wifiConnecting}
              onPress={() => setEspSystemPasswordDialogVisible(false)}>
              <Text>{t('common.cancel')}</Text>
            </Button>
            <Button
              loading={wifiConnecting}
              disabled={wifiConnecting}
              onPress={connectWithSystemEspPassword}>
              <Text>{t('common.connect')}</Text>
            </Button>
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
              secureTextEntry
              onChangeText={setWifiPassword}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button disabled={wifiConnecting} onPress={hideWifiPasswordDialog}>
              <Text>{t('common.cancel')}</Text>
            </Button>
            <Button
              loading={wifiConnecting}
              disabled={wifiConnecting}
              onPress={connectWithNewPassword}>
              <Text>{t('common.connect')}</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};
