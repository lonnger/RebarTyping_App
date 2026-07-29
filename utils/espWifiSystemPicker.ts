import { NativeModules, Platform } from 'react-native';

type EspWifiPickerResult = {
  ssid?: string;
};

type EspWifiPickerNativeModule = {
  requestEspWifi(prefix: string, password: string): Promise<EspWifiPickerResult>;
  releaseEspWifi(): Promise<void>;
};

const nativePicker = NativeModules.EspWifiPicker as EspWifiPickerNativeModule | undefined;

export const requestEspWifiFromSystem = async (
  prefix: string,
  password: string
): Promise<EspWifiPickerResult> => {
  if (Platform.OS !== 'android') {
    throw new Error('The filtered system WiFi picker is only available on Android.');
  }

  if (!nativePicker) {
    throw new Error('EspWifiPicker native module is unavailable. Rebuild the Android app.');
  }

  return nativePicker.requestEspWifi(prefix, password);
};

export const releaseEspWifiFromSystem = async (): Promise<void> => {
  if (Platform.OS === 'android' && nativePicker) {
    await nativePicker.releaseEspWifi();
  }
};
