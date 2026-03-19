import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { DefaultTheme, PaperProvider } from 'react-native-paper';

import GlobalActivityIndicatorComponent from '@/components/activity-indicator-global';
import { Bootstrap } from '@/components/bootstrap';
import GlobalDialogComponent from '@/components/global-dialog';
import GlobalNotifierComponent from '@/components/notifier-global';
import GlobalSnackbarComponent from '@/components/snackbar-global';
import '@/i18n/i18n'; // 导入 i18n 配置

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#012641',
    secondary: '#012641',
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <Bootstrap />
      <Stack>
        <Stack.Screen name="(root)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" backgroundColor="#000" />
      <GlobalDialogComponent />
      <GlobalSnackbarComponent />
      <GlobalActivityIndicatorComponent />
      <GlobalNotifierComponent />
    </PaperProvider>
  );
}
