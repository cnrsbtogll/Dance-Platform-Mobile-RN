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
      if (user?.role === 'instructor' && prevUser?.role !== 'instructor') {
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Instructor' }],
        });
      }
      // 2. Instructor Logout -> Go to Login
      else if (!user && prevUser?.role === 'instructor') {
        navigationRef.current.reset({
          index: 0,
          routes: [{
            name: 'Student',
            state: {
              routes: [
                { name: 'MainTabs' },
                { name: 'Login', params: { mode: 'login' } }
              ],
              index: 1,
            }
          }],
        });
      }
      // 3. Student Logout (or other logout) -> Student Home
      else if (!user && prevUser) {
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


  // Determine initial route based on user role
  // If user is instructor, start with Instructor mode
  // Otherwise, start with Student mode
  const initialRouteName = user?.role === 'instructor' ? 'Instructor' : 'Student';

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

