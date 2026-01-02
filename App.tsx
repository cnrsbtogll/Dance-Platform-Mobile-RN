import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/store/useThemeStore';
import { useAuthStore } from './src/store/useAuthStore';
import './src/utils/i18n'; // Initialize i18n
import { useEffect } from 'react';

export default function App() {
  const { isDarkMode } = useThemeStore();
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);
  
  return (
    <>
      <RootNavigator />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </>
  );
}
