import { useEffect, useRef, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import {
  getOnlineLoginSessionStatus,
  ONLINE_LOGIN_VALIDITY_MS,
  ONLINE_LOGIN_WARNING_MS,
} from '@/utils/loginSession';

type SessionExpiryWarningProps = {
  isLoginPage: boolean;
};

export const SessionExpiryWarning = ({ isLoginPage }: SessionExpiryWarningProps) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const lastLoggedStateRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const refreshVisibility = async () => {
      if (isLoginPage) {
        if (mounted) {
          setVisible(false);
        }
        return;
      }

      try {
        const sessionStatus = await getOnlineLoginSessionStatus();
        const remainingMs =
          sessionStatus.elapsedMs === null
            ? 0
            : Math.max(0, ONLINE_LOGIN_VALIDITY_MS - sessionStatus.elapsedMs);
        const nextRemainingMinutes = Math.ceil(remainingMs / 60_000);
        const shouldShow =
          !sessionStatus.expired &&
          sessionStatus.lastOnlineLoginAt !== null &&
          sessionStatus.elapsedMs !== null &&
          sessionStatus.elapsedMs >= ONLINE_LOGIN_VALIDITY_MS - ONLINE_LOGIN_WARNING_MS;

        const warningStateKey = `${sessionStatus.reason}:${shouldShow}:${nextRemainingMinutes}`;
        if (__DEV__ && lastLoggedStateRef.current !== warningStateKey) {
          lastLoggedStateRef.current = warningStateKey;
          console.log('[ONLINE_LOGIN_WARNING_STATUS]', {
            elapsedMs: sessionStatus.elapsedMs,
            remainingMinutes: nextRemainingMinutes,
            warningStartsAtMs: ONLINE_LOGIN_VALIDITY_MS - ONLINE_LOGIN_WARNING_MS,
            visible: shouldShow,
            reason: sessionStatus.reason,
          });
        }

        if (mounted) {
          setVisible(shouldShow);
          setRemainingMinutes(nextRemainingMinutes);
        }
      } catch (error) {
        console.warn('Unable to check login expiry warning', error);
        if (mounted) {
          setVisible(false);
          setRemainingMinutes(0);
        }
      }
    };

    refreshVisibility();
    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' || nextAppState === 'background') {
        refreshVisibility();
      }
    });

    return () => {
      mounted = false;
      appStateListener.remove();
    };
  }, [isLoginPage]);

  if (!visible) {
    return <View style={{ height: 44 }} />;
  }

  return (
    <View
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
      pointerEvents="none"
      style={{
        width: 358,
        minHeight: 44,
        marginTop: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#B45309',
        backgroundColor: '#FDE68A',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      <Icon source="clock-alert-outline" size={22} color="#92400E" />
      <Text
        style={{
          marginLeft: 8,
          color: '#78350F',
          fontSize: 15,
          fontWeight: '800',
          flexShrink: 1,
        }}>
        {t('errors.sessionExpiringSoon', {
          minutes: remainingMinutes,
        })}
      </Text>
    </View>
  );
};
