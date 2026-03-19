import { GlobalNotifierManager, NotifierConfig } from '@/components/notifier-global';

export const showNotifier = (config: NotifierConfig) => {
  GlobalNotifierManager.current?.show(config);
};

export const hideNotifier = () => {
  GlobalNotifierManager.current?.hide();
};

// 便捷方法
export const showSuccess = (title: string, message?: string, duration = 3000) => {
  showNotifier({
    title,
    message,
    type: 'success',
    duration,
  });
};

export const showError = (title: string, message?: string, duration = 4000) => {
  showNotifier({
    title,
    message,
    type: 'error',
    duration,
  });
};

export const showWarning = (title: string, message?: string, duration = 3500) => {
  showNotifier({
    title,
    message,
    type: 'warning',
    duration,
  });
};

export const showInfo = (title: string, message?: string, duration = 3000) => {
  showNotifier({
    title,
    message,
    type: 'info',
    duration,
  });
};
