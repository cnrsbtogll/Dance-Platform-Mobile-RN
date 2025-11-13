import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../utils/theme';
import { InstructorHomeScreen } from '../screens/instructor/InstructorHomeScreen';
import { InstructorProfileScreen } from '../screens/instructor/InstructorProfileScreen';
import { InstructorLessonsScreen } from '../screens/instructor/InstructorLessonsScreen';
import { InstructorChatScreen } from '../screens/instructor/InstructorChatScreen';
import { CreateLessonScreen } from '../screens/instructor/CreateLessonScreen';
import { EditLessonScreen } from '../screens/instructor/EditLessonScreen';
import { LessonDetailScreen } from '../screens/student/LessonDetailScreen';
import { ChatDetailScreen } from '../screens/student/ChatDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tabs Navigator
const MainTabs: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.instructor.secondary,
        tabBarInactiveTintColor: colors.instructor.text.lightSecondary,
        tabBarStyle: {
          backgroundColor: colors.instructor.card.light,
          borderTopWidth: 1,
          borderTopColor: colors.instructor.border.light,
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
          headerTitle: 'Ana Sayfa (Eğitmen Modu)',
          headerLeft: () => (
            <TouchableOpacity
              style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm }}
              onPress={() => {}}
            >
              <MaterialIcons
                name="menu"
                size={28}
                color={colors.instructor.text.lightPrimary}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }}
              onPress={() => {}}
            >
              <MaterialIcons
                name="notifications"
                size={28}
                color={colors.instructor.text.lightPrimary}
              />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colors.instructor.background.light,
          },
          headerTitleStyle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.instructor.text.lightPrimary,
          },
          headerTintColor: colors.instructor.text.lightPrimary,
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
      <Tab.Screen
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
      />
      <Tab.Screen
        name="Profile"
        component={InstructorProfileScreen}
        options={{
          title: 'Profil',
          headerShown: true,
          headerTitle: 'Profil',
          headerStyle: {
            backgroundColor: colors.instructor.background.light,
          },
          headerTitleStyle: {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.instructor.text.lightPrimary,
          },
          headerTintColor: colors.instructor.text.lightPrimary,
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
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ 
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
};

