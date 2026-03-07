import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { navigationRef } from '../navigation/navigationRef';
import { useAuthStore } from '../store/useAuthStore';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// A helper function to properly handle errors instead of throwing them unhandled
const handleRegistrationError = (errorMessage: string) => {
  console.warn(`[PushNotifications] ${errorMessage}`);
};

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthStore();

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  const lastResponse = Notifications.useLastNotificationResponse();

  // Handle Case where app is opened from a notification (Cold start or background)
  useEffect(() => {
    if (lastResponse && lastResponse.notification && lastResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      const navigateToNotification = () => {
        if (navigationRef.isReady()) {
          const role = user?.role;
          const targetStack = (role === 'instructor' || role === 'draft-instructor') ? 'Instructor' : 
                             (role === 'school' || role === 'draft-school') ? 'School' : 'Student';
          
          navigationRef.navigate(targetStack as any, { 
            screen: 'Notification',
            params: { mode: role === 'instructor' ? 'instructor' : 'student' }
          } as any);
        } else {
          setTimeout(navigateToNotification, 1000);
        }
      };
      
      // Delay to avoid being overwritten by RootNavigator reset
      setTimeout(navigateToNotification, 2000);
    }
  }, [lastResponse, user?.role]);

  useEffect(() => {
    // 1. Register for Push Notifications
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          setExpoPushToken(token);
        }
      })
      .catch((err) => {
        console.error('[PushNotifications] Registration error:', err);
        setError(err);
        handleRegistrationError(err.message);
      });

    // 2. Setup listeners for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      if (navigationRef.isReady()) {
        const role = user?.role;
        const targetStack = (role === 'instructor' || role === 'draft-instructor') ? 'Instructor' : 
                           (role === 'school' || role === 'draft-school') ? 'School' : 'Student';
        
        navigationRef.navigate(targetStack as any, { 
          screen: 'Notification',
          params: { mode: role === 'instructor' ? 'instructor' : 'student' }
        } as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.role]);

  return {
    expoPushToken,
    notification,
    error,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    if (!projectId) {
      handleRegistrationError('Project ID not found in app configuration');
      return;
    }

    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}
