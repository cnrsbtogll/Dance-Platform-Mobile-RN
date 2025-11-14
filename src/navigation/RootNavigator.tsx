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

  // Set instructor user for testing instructor home screen
  useEffect(() => {
    if (!user) {
      const instructorUser = MockDataService.getUserById('instructor1');
      if (instructorUser) {
        setUser(instructorUser);
      }
    }
  }, [user, setUser]);

  // Navigate to Instructor mode for testing
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName="Instructor"
      >
        <Stack.Screen name="Student" component={StudentNavigator} />
        <Stack.Screen name="Instructor" component={InstructorNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

