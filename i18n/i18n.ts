import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入语言文件
import cn from './locales/cn.json';
import en from './locales/en.json';
import hk from './locales/hk.json';

import { storage_config } from '@/constants';

// 定义资源
const resources = {
  cn: {
    translation: cn,
  },
  hk: {
    translation: hk,
  },
  en: {
    translation: en,
  },
};

// 初始化 i18next
i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // 默认语言
  fallbackLng: 'en', // 备用语言
  interpolation: {
    escapeValue: false, // 不转义 HTML
  },
  compatibilityJSON: 'v4',
  react: {
    useSuspense: false,
  },
});

// 加载保存的语言设置
export const loadSavedLanguage = async () => {
  try {
    const language = await AsyncStorage.getItem(storage_config.LOCAL_STORAGE_LANGUAGE);
    if (language) {
      await i18n.changeLanguage(language);
    }
  } catch (error) {
    console.error('Failed to load language from AsyncStorage', error);
  }
};

// 切换语言并保存设置
export const changeLanguage = async (lng: string) => {
  try {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem(storage_config.LOCAL_STORAGE_LANGUAGE, lng);
  } catch (error) {
    console.error('Failed to save language to AsyncStorage', error);
  }
};

// 初始加载语言
loadSavedLanguage();

export default i18n;
