import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius, getPalette } from '../utils/theme';
import { useThemeStore } from '../store/useThemeStore';
import { appConfig } from '../config/appConfig';
import { SchoolHomeScreen } from '../screens/school/SchoolHomeScreen';
import { InstructorProfileScreen } from '../screens/instructor/InstructorProfileScreen';
import { InstructorChatScreen } from '../screens/instructor/InstructorChatScreen';
import { InstructorStudentsScreen } from '../screens/instructor/InstructorStudentsScreen';
import { InstructorStudentDetailScreen } from '../screens/instructor/InstructorStudentDetailScreen';
import { PartnerDetailScreen } from '../screens/shared/PartnerDetailScreen';
import { ChatDetailScreen } from '../screens/student/ChatDetailScreen';
import { NotificationScreen } from '../screens/shared/NotificationScreen';
import { EditProfileScreen } from '../screens/shared/EditProfileScreen';
import { AccountInformationScreen } from '../screens/shared/AccountInformationScreen';
import { PaymentMethodsScreen } from '../screens/shared/PaymentMethodsScreen';
import { ChangePasswordScreen } from '../screens/shared/ChangePasswordScreen';
import { HelpCenterScreen } from '../screens/shared/HelpCenterScreen';
import { SchoolLessonsScreen } from '../screens/school/SchoolLessonsScreen';
import { SchoolOnboardingScreen } from '../screens/school/SchoolOnboardingScreen';
import { SchoolVerificationScreen } from '../screens/school/SchoolVerificationScreen';
import { EarningsDetailsScreen } from '../screens/instructor/EarningsDetailsScreen';
import { LessonDetailScreen } from '../screens/student/LessonDetailScreen';
import { CreateLessonScreen } from '../screens/instructor/CreateLessonScreen';
import { EditLessonScreen } from '../screens/instructor/EditLessonScreen';
import { AboutScreen } from '../screens/shared/AboutScreen';
import { NotificationBell } from '../components/common/NotificationBell';
import { PrivacyPolicyScreen } from '../screens/shared/PrivacyPolicyScreen';
import { useAuthStore } from '../store/useAuthStore';
import { FloatingChatButton } from '../components/common/FloatingChatButton';
import { StudentPasswordResetScreen } from '../screens/shared/StudentPasswordResetScreen';
import { InstructorVerificationScreen } from '../screens/school/InstructorVerificationScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tabs Navigator
const MainTabs: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette('school', isDarkMode);
    const { user } = useAuthStore();

    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.school.primary,
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
                    component={SchoolHomeScreen}
                    options={{
                        title: t('navigation.schoolHome'),
                        headerShown: true,
                        headerTitle: '',
                        headerLeft: () => (
                            <View style={{
                                backgroundColor: colors.school.primary,
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
                                    {t('school.badge') || 'OKUL'}
                                </Text>
                            </View>
                        ),
                        headerRight: () => <NotificationBell role="school" />,
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
                                {t('navigation.schoolHome')}
                            </Text>
                        ),
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="home" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="InstructorStudents"
                    component={InstructorStudentsScreen}
                    options={{
                        title: t('instructorStudents.title'),
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
                        headerRight: () => <NotificationBell role="school" />,
                        tabBarLabel: ({ focused, color }) => (
                            <Text style={{
                                fontSize: typography.fontSize.xs,
                                fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
                                color,
                            }}>
                                {t('instructorStudents.title')}
                            </Text>
                        ),
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="groups" size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Lessons"
                    component={SchoolLessonsScreen}
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
                        headerRight: () => <NotificationBell role="school" />,
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
            {appConfig.features.chat && <FloatingChatButton role="school" unreadCount={0} />}
        </View>
    );
};

// Root Stack Navigator
export const SchoolNavigator: React.FC = () => {
    const { t } = useTranslation();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette('school', isDarkMode);

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
                name="PartnerDetail"
                component={PartnerDetailScreen}
                options={{ headerShown: false, presentation: 'card' }}
            />
            {appConfig.features.chat && (
                <>
                    <Stack.Screen
                        name="Chat"
                        component={InstructorChatScreen}
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
                            headerTitle: '',
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
                initialParams={{ mode: 'school' }}
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
                name="SchoolOnboarding"
                component={SchoolOnboardingScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="SchoolVerification"
                component={SchoolVerificationScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="AccountInformation"
                component={AccountInformationScreen}
                initialParams={{ mode: 'school' }}
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
                initialParams={{ mode: 'school' }}
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
                initialParams={{ mode: 'school' }}
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
                initialParams={{ mode: 'school' }}
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
                initialParams={{ mode: 'school' }}
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
                initialParams={{ mode: 'school' }}
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
            <Stack.Screen
                name="CreateLesson"
                component={CreateLessonScreen}
                initialParams={{ mode: 'school' }}
                options={{
                    headerShown: true,
                    headerTitle: t('lessons.createNewLesson'),
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: palette.background },
                    headerTintColor: palette.text.primary,
                    headerTitleStyle: { color: palette.text.primary },
                }}
            />
            <Stack.Screen
                name="EditLesson"
                component={EditLessonScreen}
                initialParams={{ mode: 'school' }}
                options={{
                    headerShown: true,
                    headerTitle: t('lessons.editLesson'),
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: palette.background },
                    headerTintColor: palette.text.primary,
                    headerTitleStyle: { color: palette.text.primary },
                }}
            />
            <Stack.Screen
                name="LessonDetail"
                component={LessonDetailScreen}
                initialParams={{ mode: 'school' }}
                options={{
                    headerShown: true,
                    headerTitle: t('lessons.details'),
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: palette.background },
                    headerTintColor: palette.text.primary,
                    headerTitleStyle: { color: palette.text.primary },
                }}
            />
            <Stack.Screen
                name="EarningsDetails"
                component={EarningsDetailsScreen}
                initialParams={{ mode: 'school' }}
                options={{
                    headerShown: true,
                    headerTitle: t('instructorHome.earningsSummary'),
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: palette.background },
                    headerTintColor: palette.text.primary,
                    headerTitleStyle: { color: palette.text.primary },
                }}
            />
            <Stack.Screen
                name="StudentPasswordReset"
                component={StudentPasswordResetScreen}
                options={{
                    headerShown: true,
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: palette.background },
                    headerTintColor: palette.text.primary,
                    headerTitleStyle: { color: palette.text.primary },
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="InstructorStudentDetail"
                component={InstructorStudentDetailScreen}
                options={{
                    headerShown: true,
                    headerTitle: t('instructorStudents.studentDetail') || 'Öğrenci Detayı',
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: palette.background },
                    headerTintColor: palette.text.primary,
                    headerTitleStyle: { color: palette.text.primary },
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="InstructorVerification"
                component={InstructorVerificationScreen}
                options={{
                    headerShown: true,
                    headerBackTitle: '',
                    headerStyle: { backgroundColor: palette.background },
                    headerTintColor: palette.text.primary,
                    headerTitleStyle: { color: palette.text.primary },
                    presentation: 'card',
                }}
            />
        </Stack.Navigator>
    );
};
