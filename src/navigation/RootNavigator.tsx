import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StudentNavigator } from './StudentNavigator';
import { InstructorNavigator } from './InstructorNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { MockDataService } from '../services/mockDataService';
import { User } from '../types';

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const navigationRef = useRef<any>(null);

  const previousUserRef = useRef<User | null>(null);

  // Handle dynamic navigation based on user role
  useEffect(() => {
    const prevUser = previousUserRef.current;

    if (navigationRef.current) {
      // 1. Instructor Login
      const isInstructorRole = user?.role === 'instructor' || user?.role === 'draft-instructor';
      const wasInstructorRole = prevUser?.role === 'instructor' || prevUser?.role === 'draft-instructor';

      if (isInstructorRole && !wasInstructorRole) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Instructor' }],
        });
      }

      // 2. Logout / Delete Account / Downgrade (User becomes null, or role changes to student)
      if ((!user || user.role === 'student') && wasInstructorRole) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Student' }],
        });
      }

      // 3. Explicit check for null user (Logout/Delete from any state)
      if (!user && prevUser) {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Student' }],
        });
      }
    }

    // Update ref
    previousUserRef.current = user;
  }, [user]);

  // Auto-login an instructor user for testing - hem login olmuş hem eğitmen olmuş kullanıcı


  const initialRouteName = (user?.role === 'instructor' || user?.role === 'draft-instructor') ? 'Instructor' : 'Student';

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRouteName}
      >
        <Stack.Screen name="Student" component={StudentNavigator} />
        <Stack.Screen name="Instructor" component={InstructorNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

