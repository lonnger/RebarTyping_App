import { NativeModules, Platform } from 'react-native';

type EspWifiPickerResult = {
  ssid?: string;
};

export type ConnectedEspWifiInfo = {
  ssid: string;
  rssi: number;
  timestamp: number;
};

type EspWifiPickerNativeModule = {
  requestEspWifi(prefix: string, password: string): Promise<EspWifiPickerResult>;
  connectToEspWifi(ssid: string, password: string): Promise<EspWifiPickerResult>;
  isVpnActive(): Promise<boolean>;
  getConnectedEspWifiInfo(): Promise<ConnectedEspWifiInfo | null>;
  releaseEspWifi(): Promise<void>;
};

const nativePicker = NativeModules.EspWifiPicker as EspWifiPickerNativeModule | undefined;
let espWifiConnectionInProgress = false;

export const setEspWifiConnectionInProgress = (inProgress: boolean) => {
  espWifiConnectionInProgress = inProgress;
};

export const isEspWifiConnectionInProgress = () => espWifiConnectionInProgress;

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

export const connectToEspWifiFromSystem = async (
  ssid: string,
  password: string
): Promise<EspWifiPickerResult> => {
  if (Platform.OS !== 'android') {
    throw new Error('The dedicated ESP WiFi connection is only available on Android.');
  }

  if (!nativePicker) {
    throw new Error('EspWifiPicker native module is unavailable. Rebuild the Android app.');
  }

  return nativePicker.connectToEspWifi(ssid, password);
};

export const isVpnActive = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (!nativePicker) {
    throw new Error('VPN detection native module is unavailable. Rebuild the Android app.');
  }

  return nativePicker.isVpnActive();
};

export const getConnectedEspWifiInfo = async (): Promise<ConnectedEspWifiInfo | null> => {
  if (Platform.OS !== 'android' || !nativePicker) {
    return null;
  }

  return nativePicker.getConnectedEspWifiInfo();
};

export const releaseEspWifiFromSystem = async (): Promise<void> => {
  if (Platform.OS === 'android' && nativePicker) {
    await nativePicker.releaseEspWifi();
  }
};
