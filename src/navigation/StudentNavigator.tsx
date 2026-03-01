import React from 'react';
import { Text, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, getPalette } from '../utils/theme';
import { useThemeStore } from '../store/useThemeStore';
import { appConfig } from '../config/appConfig';
import { StudentHomeScreen } from '../screens/student/StudentHomeScreen';
import { MyLessonsScreen } from '../screens/student/MyLessonsScreen';
import { ChatScreen } from '../screens/student/ChatScreen';
import { ChatDetailScreen } from '../screens/student/ChatDetailScreen';
import { NewChatScreen } from '../screens/student/NewChatScreen';
import { PartnerSearchScreen } from '../screens/student/PartnerSearchScreen';
import { ProfileScreen } from '../screens/student/ProfileScreen';
import { EditProfileScreen } from '../screens/shared/EditProfileScreen';
import { BecomeInstructorScreen } from '../screens/shared/BecomeInstructorScreen';
import { BecomeSchoolScreen } from '../screens/shared/BecomeSchoolScreen';
import { LoginScreen } from '../screens/shared/LoginScreen';
import { LessonDetailScreen } from '../screens/student/LessonDetailScreen';
import { PaymentScreen } from '../screens/student/PaymentScreen';
import { NotificationScreen } from '../screens/shared/NotificationScreen';
import { AccountInformationScreen } from '../screens/shared/AccountInformationScreen';
import { PaymentMethodsScreen } from '../screens/shared/PaymentMethodsScreen';
import { ChangePasswordScreen } from '../screens/shared/ChangePasswordScreen';
import { HelpCenterScreen } from '../screens/shared/HelpCenterScreen';
import { AboutScreen } from '../screens/shared/AboutScreen';
import { PrivacyPolicyScreen } from '../screens/shared/PrivacyPolicyScreen';
import { NotificationBell } from '../components/common/NotificationBell';
import { FloatingChatButton } from '../components/common/FloatingChatButton';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tabs Navigator
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);

  return (
    <View style={{ flex: 1 }}>
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
            title: t('navigation.home'),
            headerShown: true,
            headerRight: () => <NotificationBell role="student" />,
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
                {t('navigation.home')}
              </Text>
            ),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="PartnerSearch"
          component={PartnerSearchScreen}
          options={{
            title: t('navigation.partnerSearch'),
            headerShown: true,
            headerStyle: {
              backgroundColor: palette.background,
            },
            headerTintColor: palette.text.primary,
            headerRight: () => <NotificationBell role="student" />,
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
                {t('navigation.partnerSearch')}
              </Text>
            ),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="people" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="MyLessons"
          component={MyLessonsScreen}
          options={{
            title: t('navigation.myLessons'),
            headerShown: true,
            headerRight: () => <NotificationBell role="student" />,
            headerTitle: t('navigation.myLessons'),
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
                {t('navigation.myLessons')}
              </Text>
            ),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="school" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: t('navigation.profile'),
            headerShown: true,
            headerTitle: t('navigation.profile'),
            headerStyle: {
              backgroundColor: palette.background,
            },
            headerTintColor: palette.text.primary,
            headerRight: () => <NotificationBell role="student" />,
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
      {appConfig.features.chat && <FloatingChatButton role="student" unreadCount={0} />}
    </View>
  );
};

// Root Stack Navigator (includes detail screens)
export const StudentNavigator: React.FC = () => {
  const { t } = useTranslation();
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
          headerShown: true,
          headerTitle: t('lessons.details'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: { color: palette.text.primary },
          presentation: 'card',
        }}
      />
      {appConfig.features.chat && (
        <>
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ navigation: nav }) => ({
              headerShown: true,
              headerTitle: t('navigation.chat'),
              headerBackTitle: '',
              headerStyle: { backgroundColor: palette.background },
              headerTintColor: palette.text.primary,
              headerTitleStyle: {
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: palette.text.primary,
              },
              headerRight: () => <NotificationBell role="student" />,
              presentation: 'card',
            })}
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
            name="NewChat"
            component={NewChatScreen}
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
        </>
      )}
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
      {appConfig.features.notifications && (
        <Stack.Screen
          name="Notification"
          component={NotificationScreen}
          initialParams={{ mode: 'student' }}
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
      )}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        initialParams={{ mode: 'student' }}
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
        name="BecomeInstructor"
        component={BecomeInstructorScreen}
        initialParams={{ mode: 'student' }}
        options={{
          headerShown: true,
          headerTitle: t('becomeInstructor.title'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
        }}
      />
      <Stack.Screen
        name="BecomeSchool"
        component={BecomeSchoolScreen}
        initialParams={{ mode: 'student' }}
        options={{
          headerShown: true,
          headerTitle: t('becomeSchool.title'),
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
        initialParams={{ mode: 'student' }}
        options={{
          headerShown: true,
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
        }}
      />
      <Stack.Screen
        name="AccountInformation"
        component={AccountInformationScreen}
        initialParams={{ mode: 'student' }}
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
        initialParams={{ mode: 'student' }}
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
        initialParams={{ mode: 'student' }}
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
        initialParams={{ mode: 'student' }}
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
        initialParams={{ mode: 'student' }}
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
        initialParams={{ mode: 'student' }}
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

