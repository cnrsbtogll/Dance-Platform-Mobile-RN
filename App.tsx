import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/store/useThemeStore';
import { useAuthStore } from './src/store/useAuthStore';
import './src/utils/i18n'; // Initialize i18n
import { useEffect } from 'react';
import { usePushNotifications } from './src/hooks/usePushNotifications';

export default function App() {
  const { isDarkMode } = useThemeStore();
  const { initialize, updatePushToken, user } = useAuthStore();
  const { expoPushToken } = usePushNotifications();

  // Initialize listeners
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Synchronize Push Token once it's granted AND user is logged in
  useEffect(() => {
    if (expoPushToken && user) {
      updatePushToken(expoPushToken);
    }
  }, [expoPushToken, user?.id, updatePushToken]);

  return (
    <>
      <RootNavigator />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </>
  );
}
