import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, getPalette } from '../utils/theme';
import { useThemeStore } from '../store/useThemeStore';
import { InstructorHomeScreen } from '../screens/instructor/InstructorHomeScreen';
import { InstructorProfileScreen } from '../screens/instructor/InstructorProfileScreen';
import { InstructorLessonsScreen } from '../screens/instructor/InstructorLessonsScreen';
import { InstructorChatScreen } from '../screens/instructor/InstructorChatScreen';
import { CreateLessonScreen } from '../screens/instructor/CreateLessonScreen';
import { EditLessonScreen } from '../screens/instructor/EditLessonScreen';
import { LessonDetailScreen } from '../screens/student/LessonDetailScreen';
import { ChatDetailScreen } from '../screens/student/ChatDetailScreen';
import { NotificationScreen } from '../screens/shared/NotificationScreen';
import { EditProfileScreen } from '../screens/shared/EditProfileScreen';
import { useNotificationStore } from '../store/useNotificationStore';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tabs Navigator
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
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
          title: 'Ana Sayfa',
          headerShown: true,
          headerTitle: 'Ana Sayfa',
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
                EĞİTMEN
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
              Ana Sayfa
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
          title: 'Derslerim',
          headerShown: false,
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
        name="Messages"
        component={InstructorChatScreen}
        options={{
          title: 'Mesajlar',
          headerShown: false,
          tabBarLabel: ({ focused, color }) => (
            <Text style={{
              fontSize: typography.fontSize.xs,
              fontWeight: focused ? typography.fontWeight.bold : typography.fontWeight.medium,
              color,
            }}>
              Mesajlar
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat-bubble-outline" size={size} color={color} />
          ),
        }}
      /> */}
      <Tab.Screen
        name="Profile"
        component={InstructorProfileScreen}
        options={{
          title: 'Profil',
          headerShown: true,
          headerTitle: 'Profil',
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

// Root Stack Navigator
export const InstructorNavigator: React.FC = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        headerTintColor: colors.instructor.text.lightPrimary,
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
      {/* TODO: İlerideki geliştirmelerde tekrar eklenecek */}
      {/* <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ 
          headerShown: false,
          presentation: 'card',
        }}
      /> */}
      <Stack.Screen
        name="Notification"
        component={NotificationScreen}
        options={{ 
          headerShown: true,
          headerBackTitle: '',
          headerTintColor: colors.instructor.text.lightPrimary,
          headerStyle: {
            backgroundColor: colors.instructor.background.light,
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
          headerStyle: { backgroundColor: colors.instructor.background.light },
          headerTintColor: colors.instructor.text.lightPrimary,
        }}
      />
    </Stack.Navigator>
  );
};

