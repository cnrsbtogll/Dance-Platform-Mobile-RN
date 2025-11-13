import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography } from '../utils/theme';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { MyLessonsScreen } from '../screens/student/MyLessonsScreen';
import { ChatScreen } from '../screens/student/ChatScreen';
import { ChatDetailScreen } from '../screens/student/ChatDetailScreen';
import { ProfileScreen } from '../screens/student/ProfileScreen';
import { LessonDetailScreen } from '../screens/student/LessonDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tabs Navigator
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.student.primary,
        tabBarInactiveTintColor: colors.student.text.secondaryLight,
        tabBarStyle: {
          backgroundColor: colors.student.background.light,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={StudentHomeScreen}
        options={{
          title: 'Ana Sayfa',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.student.background.light,
          },
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              fontSize: typography.fontSize.xs,
              fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
              color,
            }}>
              Ana Sayfa
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyLessons"
        component={MyLessonsScreen}
        options={{
          title: 'Derslerim',
          headerShown: true,
          headerTitle: 'Derslerim',
          headerStyle: {
            backgroundColor: colors.student.background.light,
          },
          headerTitleStyle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.student.text.primaryLight,
          },
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              fontSize: typography.fontSize.xs,
              fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
              color,
            }}>
              Derslerim
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="school" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Sohbet',
          headerShown: false, // Custom header kullanıyoruz
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              fontSize: typography.fontSize.xs,
              fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
              color,
            }}>
              Sohbet
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat-bubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          headerShown: true,
          headerTitle: 'Profil',
          headerStyle: {
            backgroundColor: colors.student.background.light,
          },
          headerTitleStyle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.student.text.primaryLight,
          },
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              fontSize: typography.fontSize.xs,
              fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
              color,
            }}>
              Profil
            </Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name={focused ? "person" : "person-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root Stack Navigator (includes detail screens)
export const StudentNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LessonDetail"
        component={LessonDetailScreen}
        options={{ 
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ 
          headerShown: true,
          headerBackTitle: '',
          headerStyle: {
            backgroundColor: colors.student.background.light,
          },
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

