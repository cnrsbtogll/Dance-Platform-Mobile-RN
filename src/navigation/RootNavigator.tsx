import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StudentNavigator } from './StudentNavigator';
import { InstructorNavigator } from './InstructorNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { MockDataService } from '../services/mockDataService';

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { user } = useAuthStore();
  const navigationRef = useRef<any>(null);

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

