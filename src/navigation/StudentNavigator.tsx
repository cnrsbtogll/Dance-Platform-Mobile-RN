import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { MyLessonsScreen } from '../screens/student/MyLessonsScreen';

const Stack = createStackNavigator();

export const StudentNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Home"
        component={StudentHomeScreen}
      />
      <Stack.Screen
        name="MyLessons"
        component={MyLessonsScreen}
      />
    </Stack.Navigator>
  );
};

