import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONLINE_LOGIN_VALIDITY_MS = 5 * 60 * 1000;
export const ONLINE_LOGIN_WARNING_MS = 4 * 60 * 1000;

const LAST_ONLINE_LOGIN_AT_STORAGE_KEY = 'last_online_login_at';

export type OnlineLoginSessionStatus = {
  expired: boolean;
  lastOnlineLoginAt: number | null;
  elapsedMs: number | null;
  reason: 'valid' | 'missing' | 'expired' | 'clock-rollback';
};

export const saveOnlineLoginAt = async (timestamp = Date.now()) => {
  await AsyncStorage.setItem(LAST_ONLINE_LOGIN_AT_STORAGE_KEY, String(timestamp));
};

export const getOnlineLoginAt = async (): Promise<number | null> => {
  const storedTimestamp = await AsyncStorage.getItem(LAST_ONLINE_LOGIN_AT_STORAGE_KEY);
  if (!storedTimestamp) {
    return null;
  }

  const timestamp = Number(storedTimestamp);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
};

export const clearOnlineLoginAt = async () => {
  await AsyncStorage.removeItem(LAST_ONLINE_LOGIN_AT_STORAGE_KEY);
};

export const getOnlineLoginSessionStatus = async (
  currentTimestamp = Date.now()
): Promise<OnlineLoginSessionStatus> => {
  const lastOnlineLoginAt = await getOnlineLoginAt();

  if (lastOnlineLoginAt === null) {
    return {
      expired: true,
      lastOnlineLoginAt: null,
      elapsedMs: null,
      reason: 'missing',
    };
  }

  const elapsedMs = currentTimestamp - lastOnlineLoginAt;
  if (elapsedMs < 0) {
    return {
      expired: true,
      lastOnlineLoginAt,
      elapsedMs,
      reason: 'clock-rollback',
    };
  }

  if (elapsedMs >= ONLINE_LOGIN_VALIDITY_MS) {
    return {
      expired: true,
      lastOnlineLoginAt,
      elapsedMs,
      reason: 'expired',
    };
  }

  return {
    expired: false,
    lastOnlineLoginAt,
    elapsedMs,
    reason: 'valid',
  };
};
