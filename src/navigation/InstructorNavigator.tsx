import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius, getPalette } from '../utils/theme';
import { useThemeStore } from '../store/useThemeStore';
import { InstructorHomeScreen } from '../screens/instructor/InstructorHomeScreen';
import { InstructorProfileScreen } from '../screens/instructor/InstructorProfileScreen';
import { InstructorLessonsScreen } from '../screens/instructor/InstructorLessonsScreen';
import { InstructorChatScreen } from '../screens/instructor/InstructorChatScreen';
import { CreateLessonScreen } from '../screens/instructor/CreateLessonScreen';
import { EditLessonScreen } from '../screens/instructor/EditLessonScreen';
import { EarningsDetailsScreen } from '../screens/instructor/EarningsDetailsScreen';
import { LessonDetailScreen } from '../screens/student/LessonDetailScreen';
import { ChatDetailScreen } from '../screens/student/ChatDetailScreen';
import { NotificationScreen } from '../screens/shared/NotificationScreen';
import { EditProfileScreen } from '../screens/shared/EditProfileScreen';
import { AccountInformationScreen } from '../screens/shared/AccountInformationScreen';
import { PaymentMethodsScreen } from '../screens/shared/PaymentMethodsScreen';
import { ChangePasswordScreen } from '../screens/shared/ChangePasswordScreen';
import { HelpCenterScreen } from '../screens/shared/HelpCenterScreen';
import { AboutScreen } from '../screens/shared/AboutScreen';
import { PrivacyPolicyScreen } from '../screens/shared/PrivacyPolicyScreen';
import { useNotificationStore } from '../store/useNotificationStore';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tabs Navigator
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('instructor', isDarkMode);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.secondary,
        tabBarInactiveTintColor: palette.text.secondary,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopWidth: 1,
          borderTopColor: palette.border,
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
        component={InstructorHomeScreen}
        options={{
          title: t('navigation.home'),
          headerShown: true,
          headerTitle: t('navigation.home'),
          headerLeft: () => (
            <View style={{
              backgroundColor: palette.secondary,
              paddingHorizontal: spacing.sm,
              paddingVertical: 4,
              borderRadius: borderRadius.full,
              marginLeft: spacing.sm,
            }}>
              <Text style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.bold,
                color: '#ffffff',
              }}>
                {t('instructor.badge')}
              </Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: palette.background,
          },
          headerTitleStyle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: palette.text.primary,
          },
          headerTintColor: palette.text.primary,
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              fontSize: typography.fontSize.xs,
              fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
              color,
            }}>
              {t('navigation.home')}
            </Text>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialIcons 
              name={focused ? "home" : "home"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Lessons"
        component={InstructorLessonsScreen}
        options={{
          title: t('instructor.lessons'),
          headerShown: false,
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              fontSize: typography.fontSize.xs,
              fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
              color,
            }}>
              {t('instructor.lessons')}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="school" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={InstructorChatScreen}
        options={{
          title: t('navigation.chat'),
          headerShown: false,
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              fontSize: typography.fontSize.xs,
              fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
              color,
            }}>
              {t('navigation.chat')}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat-bubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={InstructorProfileScreen}
        options={{
          title: t('navigation.profile'),
          headerShown: true,
          headerTitle: t('navigation.profile'),
          headerStyle: {
            backgroundColor: palette.background,
          },
          headerTitleStyle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: palette.text.primary,
          },
          headerTintColor: palette.text.primary,
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              fontSize: typography.fontSize.xs,
              fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
              color,
            }}>
              {t('navigation.profile')}
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

// Root Stack Navigator
export const InstructorNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('instructor', isDarkMode);
  
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
      <Stack.Screen
        name="CreateLesson"
        component={CreateLessonScreen}
        options={{ 
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="EditLesson"
        component={EditLessonScreen}
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
          headerTitle: '', // Will be set dynamically in ChatDetailScreen
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
          headerTitle: t('notifications.title'),
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
          headerTitle: t('profile.editProfile'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
        }}
      />
      <Stack.Screen
        name="EarningsDetails"
        component={EarningsDetailsScreen}
        options={{
          headerShown: true,
          headerTitle: t('instructorHome.earningsDetails'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="AccountInformation"
        component={AccountInformationScreen}
        options={{
          headerShown: true,
          headerTitle: t('profile.accountInfo'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{
          headerShown: true,
          headerTitle: t('profile.paymentMethods'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          headerShown: true,
          headerTitle: t('profile.changePassword'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{
          headerShown: true,
          headerTitle: t('profile.helpCenter'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerShown: true,
          headerTitle: t('profile.about'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          headerShown: true,
          headerTitle: t('profile.privacyPolicy'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

