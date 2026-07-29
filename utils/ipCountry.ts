import AsyncStorage from '@react-native-async-storage/async-storage';

export type IpCountryPayload = 'China' | 'Board';

const IP_COUNTRY_STORAGE_KEY = 'ip_country_payload';

export const getCountryPayloadFromIpInfo = (country?: string, countryCode?: string): IpCountryPayload => {
  const normalizedCountry = country?.trim().toLowerCase();
  const normalizedCountryCode = countryCode?.trim().toUpperCase();

  if (normalizedCountryCode === 'CN' || normalizedCountry === 'china' || country === '中国') {
    return 'China';
  }

  return 'Board';
};

export const saveIpCountryPayload = async (payload: IpCountryPayload) => {
  await AsyncStorage.setItem(IP_COUNTRY_STORAGE_KEY, payload);
};

export const getSavedIpCountryPayload = async (): Promise<IpCountryPayload | null> => {
  const payload = await AsyncStorage.getItem(IP_COUNTRY_STORAGE_KEY);

  if (payload === 'China' || payload === 'Board') {
    return payload;
  }

  return null;
};
