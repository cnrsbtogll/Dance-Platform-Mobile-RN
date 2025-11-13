import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StudentNavigator } from './StudentNavigator';
import { InstructorNavigator } from './InstructorNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { MockDataService } from '../services/mockDataService';

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Mock: Auto-login as student (user1) for development
    if (!user) {
      const defaultUser = MockDataService.getUserById('user1');
      if (defaultUser) {
        setUser(defaultUser);
      }
    }
  }, [user, setUser]);

  // Direkt öğrenci ana sayfasına yönlendir (login gerekmez)
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName="Student"
      >
        <Stack.Screen name="Student" component={StudentNavigator} />
        <Stack.Screen name="Instructor" component={InstructorNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

