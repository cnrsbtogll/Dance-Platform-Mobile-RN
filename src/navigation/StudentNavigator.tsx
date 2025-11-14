import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, getPalette } from '../utils/theme';
import { useThemeStore } from '../store/useThemeStore';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { MyLessonsScreen } from '../screens/student/MyLessonsScreen';
import { ChatScreen } from '../screens/student/ChatScreen';
import { ChatDetailScreen } from '../screens/student/ChatDetailScreen';
import { ProfileScreen } from '../screens/student/ProfileScreen';
import { EditProfileScreen } from '../screens/shared/EditProfileScreen';
import { BecomeInstructorScreen } from '../screens/shared/BecomeInstructorScreen';
import { LoginScreen } from '../screens/shared/LoginScreen';
import { LessonDetailScreen } from '../screens/student/LessonDetailScreen';
import { PaymentScreen } from '../screens/student/PaymentScreen';
import { NotificationScreen } from '../screens/shared/NotificationScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tabs Navigator
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.text.secondary,
        tabBarStyle: {
          backgroundColor: palette.background,
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
            backgroundColor: palette.background,
          },
          headerTintColor: palette.text.primary,
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
            backgroundColor: palette.background,
          },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: palette.text.primary,
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
      {/* TODO: İlerideki geliştirmelerde tekrar eklenecek */}
      {/* <Tab.Screen
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
      /> */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          headerShown: true,
          headerTitle: 'Profil',
          headerStyle: {
            backgroundColor: palette.background,
          },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: palette.text.primary,
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
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);
  
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        headerTintColor: palette.text.primary,
        headerStyle: {
          backgroundColor: palette.background,
        },
      }}
    >
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
      {/* TODO: İlerideki geliştirmelerde tekrar eklenecek */}
      {/* <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ 
          headerShown: true,
          headerBackTitle: '',
          headerTintColor: colors.student.text.primaryLight,
          headerStyle: {
            backgroundColor: colors.student.background.light,
          },
          presentation: 'card',
        }}
      /> */}
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ 
          headerShown: true,
          headerBackTitle: '',
          headerTintColor: palette.text.primary,
          headerStyle: {
            backgroundColor: palette.background,
          },
          headerTitleStyle: {
            color: palette.text.primary,
          },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Notification"
        component={NotificationScreen}
        options={{ 
          headerShown: true,
          headerBackTitle: '',
          headerTintColor: palette.text.primary,
          headerStyle: {
            backgroundColor: palette.background,
          },
          headerTitleStyle: {
            color: palette.text.primary,
          },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Profili Düzenle',
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
        }}
      />
      <Stack.Screen
        name="BecomeInstructor"
        component={BecomeInstructorScreen}
        options={{
          headerShown: true,
          headerTitle: 'Eğitmen Ol',
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: true,
          headerTitle: 'Giriş / Kayıt',
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
        }}
      />
    </Stack.Navigator>
  );
};

