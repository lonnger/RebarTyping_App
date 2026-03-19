import { createRef, forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

type GlobalDialogConfig = {
  title: string;
  content: string;
  callback: () => void;
};

export const GlobalDialogManager: React.RefObject<{
  show: (config: GlobalDialogConfig) => void;
  hide: () => void;
} | null> = createRef();

const GlobalDialog = forwardRef((_: any, ref: any) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<GlobalDialogConfig>({
    title: '',
    content: '',
    callback: () => {},
  });

  const showDialog = (config: GlobalDialogConfig) => {
    setConfig(config);
    setVisible(true);
  };

  const hideDialog = () => setVisible(false);

  useImperativeHandle(
    ref,
    () => ({
      show: showDialog,
      hide: hideDialog,
    }),
    [showDialog, hideDialog]
  );

  const checkedCallback = () => {
    hideDialog();
    config?.callback();
  };

  return (
    <Portal>
      <Dialog
        style={{ width: '80%', left: '0%', right: '0%', marginHorizontal: 'auto' }}
        visible={visible}
        onDismiss={hideDialog}>
        <Dialog.Title>{config.title}</Dialog.Title>
        <Dialog.Content>
          <Text>{config.content}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={hideDialog}>{t('common.cancel')}</Button>
          <Button onPress={checkedCallback}>{t('common.confirm')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
});

const GlobalDialogComponent = () => <GlobalDialog ref={GlobalDialogManager} />;

export default GlobalDialogComponent;
