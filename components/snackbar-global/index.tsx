import { createRef, forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Snackbar } from 'react-native-paper';

type GlobalSnackbarConfig = {
  content: string;
  action?: string | null;
  actionCallback?: () => void;
};

export const GlobalSnackbarManager: React.RefObject<{
  show: (config: GlobalSnackbarConfig) => void;
  hide: () => void;
} | null> = createRef();

const GlobalSnackbar = forwardRef((_: any, ref: any) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<GlobalSnackbarConfig>({
    content: '',
    action: t('common.confirm'),
    actionCallback: () => {},
  });

  const showSnackbar = (config: GlobalSnackbarConfig) => {
    setConfig(config);
    setVisible(true);
  };

  const hideSnackbar = () => setVisible(false);

  useImperativeHandle(
    ref,
    () => ({
      show: showSnackbar,
      hide: hideSnackbar,
    }),
    [showSnackbar, hideSnackbar]
  );

  return (
    <Snackbar
      style={{
        width: '60%',
        borderRadius: 50,
        paddingHorizontal: 20,
        marginHorizontal: 'auto',
      }}
      visible={visible}
      onDismiss={hideSnackbar}
      action={{
        label: config?.action == null ? t('common.confirm') : config?.action,
        textColor: '#ffffff',
        onPress: () => {
          hideSnackbar();
          config?.actionCallback?.();
        },
      }}>
      {config.content}
    </Snackbar>
  );
});

const GlobalSnackbarComponent = () => <GlobalSnackbar ref={GlobalSnackbarManager} />;

export default GlobalSnackbarComponent;
