import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StudentNavigator } from './StudentNavigator';
import { InstructorNavigator } from './InstructorNavigator';
import { SchoolNavigator } from './SchoolNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { User } from '../types';
import { useNotificationStore } from '../store/useNotificationStore';
import { EmailVerificationBanner } from '../components/common/EmailVerificationBanner';
import { useEmailVerification } from '../hooks/useEmailVerification';
import { navigationRef } from './navigationRef';

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { loadNotifications } = useNotificationStore();

  const previousUserRef = useRef<User | null>(null);

  // Load notifications globally when user is signed in
  useEffect(() => {
    if (user?.id) {
      loadNotifications(user.id);
    }
  }, [user?.id, loadNotifications]);

  // Handle dynamic navigation based on user role
  useEffect(() => {
    const prevUser = previousUserRef.current;

    if (navigationRef.isReady()) {
      // 1. Instructor Login
      const isInstructorRole = user?.role === 'instructor' || user?.role === 'draft-instructor';
      const wasInstructorRole = prevUser?.role === 'instructor' || prevUser?.role === 'draft-instructor';

      const isSchoolRole = user?.role === 'school' || user?.role === 'draft-school';
      const wasSchoolRole = prevUser?.role === 'school' || prevUser?.role === 'draft-school';

      if (isInstructorRole && !wasInstructorRole) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Instructor' }],
        });
      }

      if (isSchoolRole && !wasSchoolRole) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'School' }],
        });
      }

      // 2. Logout / Delete Account / Downgrade (User becomes null, or role changes to student)
      if ((!user || user.role === 'student') && (wasInstructorRole || wasSchoolRole)) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Student' }],
        });
      }

      // 3. Explicit check for null user (Logout/Delete from any state)
      if (!user && prevUser) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Student' }],
        });
      }
    }

    // Update ref
    previousUserRef.current = user;
  }, [user]);

  // Auto-login an instructor user for testing - hem login olmuş hem eğitmen olmuş kullanıcı


  const getInitialRoute = () => {
    if (user?.role === 'instructor' || user?.role === 'draft-instructor') return 'Instructor';
    if (user?.role === 'school' || user?.role === 'draft-school') return 'School';
    return 'Student';
  };

  const { shouldShowBanner } = useEmailVerification();

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={styles.root}>
        <EmailVerificationBanner isVisible={shouldShowBanner} />
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={getInitialRoute()}
        >
          <Stack.Screen name="Student" component={StudentNavigator} />
          <Stack.Screen name="Instructor" component={InstructorNavigator} />
          <Stack.Screen name="School" component={SchoolNavigator} />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
