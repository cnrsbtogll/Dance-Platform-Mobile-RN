import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';

const Stack = createStackNavigator();

export const StudentNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Home"
        component={StudentHomeScreen}
      />
    </Stack.Navigator>
  );
};

