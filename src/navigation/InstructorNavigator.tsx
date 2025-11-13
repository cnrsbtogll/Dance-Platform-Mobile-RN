import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { InstructorHomeScreen } from '../screens/instructor/InstructorHomeScreen';

const Stack = createStackNavigator();

export const InstructorNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Home"
        component={InstructorHomeScreen}
      />
    </Stack.Navigator>
  );
};

