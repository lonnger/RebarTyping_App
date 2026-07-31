import AsyncStorage from '@react-native-async-storage/async-storage';

export type IpCountryPayload = 'China' | 'Global';

const IP_COUNTRY_STORAGE_KEY = 'ip_country_payload';
const IP_LOCATION_INFO_STORAGE_KEY = 'ip_location_info';

export type IpLocationInfo = {
  ip: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  source: string;
  fetchedAt: number;
};

export const getCountryPayloadFromIpInfo = (country?: string, countryCode?: string): IpCountryPayload => {
  const normalizedCountry = country?.trim().toLowerCase();
  const normalizedCountryCode = countryCode?.trim().toUpperCase();

  if (normalizedCountryCode === 'CN' || normalizedCountry === 'china' || country === '中国') {
    return 'China';
  }

  return 'Global';
};

export const saveIpCountryPayload = async (payload: IpCountryPayload) => {
  await AsyncStorage.setItem(IP_COUNTRY_STORAGE_KEY, payload);
};

export const saveIpLocationInfo = async (info: IpLocationInfo) => {
  await AsyncStorage.setItem(IP_LOCATION_INFO_STORAGE_KEY, JSON.stringify(info));
};

export const getSavedIpLocationInfo = async (): Promise<IpLocationInfo | null> => {
  const storedInfo = await AsyncStorage.getItem(IP_LOCATION_INFO_STORAGE_KEY);
  if (!storedInfo) {
    return null;
  }

  try {
    const info = JSON.parse(storedInfo) as Partial<IpLocationInfo>;
    if (
      typeof info.ip !== 'string' ||
      typeof info.country !== 'string' ||
      typeof info.countryCode !== 'string' ||
      typeof info.latitude !== 'number' ||
      typeof info.longitude !== 'number' ||
      typeof info.source !== 'string' ||
      typeof info.fetchedAt !== 'number'
    ) {
      return null;
    }

    return info as IpLocationInfo;
  } catch {
    return null;
  }
};

export const getSavedIpCountryPayload = async (): Promise<IpCountryPayload | null> => {
  const payload = await AsyncStorage.getItem(IP_COUNTRY_STORAGE_KEY);

  if (payload === 'China' || payload === 'Global') {
    return payload;
  }

  // Migrate the country value saved by older app versions.
  if (payload === 'Board') {
    await AsyncStorage.setItem(IP_COUNTRY_STORAGE_KEY, 'Global');
    return 'Global';
  }

  return null;
};
