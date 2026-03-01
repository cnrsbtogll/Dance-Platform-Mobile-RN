import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius, getPalette } from '../utils/theme';
import { useThemeStore } from '../store/useThemeStore';
import { appConfig } from '../config/appConfig';
import { InstructorHomeScreen } from '../screens/instructor/InstructorHomeScreen';
import { InstructorProfileScreen } from '../screens/instructor/InstructorProfileScreen';
import { InstructorLessonsScreen } from '../screens/instructor/InstructorLessonsScreen';
import { InstructorChatScreen } from '../screens/instructor/InstructorChatScreen';
import { VerificationScreen } from '../screens/instructor/Verification/VerificationScreen';
import { InstructorNewChatScreen } from '../screens/instructor/NewChatScreen';
import { PartnerSearchScreen } from '../screens/student/PartnerSearchScreen';
import { CreateLessonScreen } from '../screens/instructor/CreateLessonScreen';
import { EditLessonScreen } from '../screens/instructor/EditLessonScreen';
import { EarningsDetailsScreen } from '../screens/instructor/EarningsDetailsScreen';
import { LessonDetailScreen } from '../screens/student/LessonDetailScreen';
import { ChatDetailScreen } from '../screens/student/ChatDetailScreen';
import { NotificationScreen } from '../screens/shared/NotificationScreen';
import { EditProfileScreen } from '../screens/shared/EditProfileScreen';
import { AccountInformationScreen } from '../screens/shared/AccountInformationScreen';
import { InstructorOnboardingScreen } from '../screens/instructor/Onboarding/InstructorOnboardingScreen';
import { PaymentMethodsScreen } from '../screens/shared/PaymentMethodsScreen';
import { ChangePasswordScreen } from '../screens/shared/ChangePasswordScreen';
import { HelpCenterScreen } from '../screens/shared/HelpCenterScreen';
import { AboutScreen } from '../screens/shared/AboutScreen';
import { PrivacyPolicyScreen } from '../screens/shared/PrivacyPolicyScreen';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationBell } from '../components/common/NotificationBell';
import { FloatingChatButton } from '../components/common/FloatingChatButton';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tabs Navigator
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('instructor', isDarkMode);
  const { user } = useAuthStore();

  return (
    <View style={{ flex: 1 }}>
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
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (!user) {
                e.preventDefault();
              }
            },
          })}
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
            headerRight: () => <NotificationBell role="instructor" />,
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
                color: !user ? (isDarkMode ? '#555555' : '#D1D5DB') : color,
              }}>
                {t('navigation.home')}
              </Text>
            ),
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialIcons
                name={focused ? "home" : "home"}
                size={size}
                color={!user ? (isDarkMode ? '#555555' : '#D1D5DB') : color}
              />
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
            headerTitleStyle: {
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: palette.text.primary,
            },
            headerTintColor: palette.text.primary,
            headerRight: () => <NotificationBell role="instructor" />,
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
          name="Lessons"
          component={InstructorLessonsScreen}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              if (!user) {
                e.preventDefault();
              }
            },
          })}
          options={{
            title: t('instructor.lessons'),
            headerShown: false,
            tabBarLabel: ({ focused, color }) => (
              <Text style={{
                fontSize: typography.fontSize.xs,
                fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
                color: !user ? (isDarkMode ? '#555555' : '#D1D5DB') : color,
              }}>
                {t('instructor.lessons')}
              </Text>
            ),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="school" size={size} color={!user ? (isDarkMode ? '#555555' : '#D1D5DB') : color} />
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
      {appConfig.features.chat && <FloatingChatButton role="instructor" unreadCount={0} />}
    </View>
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
          headerShown: true,
          headerTitle: t('lessons.details'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: { color: palette.text.primary },
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="InstructorOnboarding"
        component={InstructorOnboardingScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Prevent swiping back
        }}
      />
      <Stack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="CreateLesson"
        component={CreateLessonScreen}
        options={{
          headerShown: true,
          headerTitle: t('lessons.createLesson'),
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
        name="EditLesson"
        component={EditLessonScreen}
        options={{
          headerShown: true,
          headerTitle: t('lessons.editLesson'),
          headerBackTitle: '',
          headerStyle: { backgroundColor: palette.background },
          headerTintColor: palette.text.primary,
          headerTitleStyle: {
            color: palette.text.primary,
          },
          presentation: 'card',
        }}
      />
      {appConfig.features.chat && (
        <>
          <Stack.Screen
            name="Chat"
            component={InstructorChatScreen}
            options={{
              headerShown: true,
              headerTitle: t('chat.title'),
              headerBackTitle: '',
              headerStyle: { backgroundColor: palette.background },
              headerTintColor: palette.text.primary,
              headerTitleStyle: {
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: palette.text.primary,
              },
              headerRight: () => <NotificationBell role="instructor" />,
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
            name="NewChat"
            component={InstructorNewChatScreen}
            options={{
              headerShown: false,
              presentation: 'card',
            }}
          />
        </>
      )}
      {appConfig.features.notifications && (
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
      )}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        initialParams={{ mode: 'instructor' }}
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
        initialParams={{ mode: 'instructor' }}
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
        initialParams={{ mode: 'instructor' }}
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
        initialParams={{ mode: 'instructor' }}
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
        initialParams={{ mode: 'instructor' }}
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
        initialParams={{ mode: 'instructor' }}
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
        initialParams={{ mode: 'instructor' }}
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

