import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatNotificationTime } from '../../utils/helpers';
import { Notification, NotificationType } from '../../types';
import { Card } from '../../components/common/Card';

const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'booking_confirmed':
      return 'check-circle';
    case 'booking_cancelled':
      return 'cancel';
    case 'new_message':
      return 'chat-bubble';
    case 'payment_received':
      return 'payment';
    case 'new_review':
      return 'star';
    case 'lesson_reminder':
      return 'schedule';
    case 'lesson_updated':
      return 'edit';
    case 'new_booking':
      return 'event';
    case 'system':
      return 'info';
    default:
      return 'notifications';
  }
};

const getNotificationIconColor = (type: NotificationType, isRead: boolean): string => {
  if (isRead) {
    return colors.student.text.secondaryLight;
  }
  
  switch (type) {
    case 'booking_confirmed':
    case 'payment_received':
      return '#1ABC9C';
    case 'booking_cancelled':
      return '#e53e3e';
    case 'new_message':
      return '#4A90E2';
    case 'new_review':
      return '#FFB800';
    case 'lesson_reminder':
      return '#9B59B6';
    case 'lesson_updated':
      return '#3498DB';
    case 'new_booking':
      return '#1ABC9C';
    case 'system':
      return '#95A5A6';
    default:
      return colors.student.primary;
  }
};

export const NotificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    if (user) {
      loadNotifications(user.id);
    }
  }, [user, loadNotifications]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Bildirimler',
      headerStyle: {
        backgroundColor: user?.role === 'instructor' 
          ? colors.instructor.background.light 
          : colors.student.background.light,
      },
      headerTitleStyle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: user?.role === 'instructor' 
          ? colors.instructor.text.lightPrimary 
          : colors.student.text.primaryLight,
      },
      headerTintColor: user?.role === 'instructor' 
        ? colors.instructor.text.lightPrimary 
        : colors.student.text.primaryLight,
      headerRight: () => (
        unreadCount > 0 ? (
          <TouchableOpacity
            style={{ marginRight: spacing.md }}
            onPress={() => {
              if (user) {
                markAllAsRead(user.id);
              }
            }}
          >
            <Text style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: user?.role === 'instructor' 
                ? colors.instructor.secondary 
                : colors.student.primary,
            }}>
              Tümünü Okundu İşaretle
            </Text>
          </TouchableOpacity>
        ) : null
      ),
    });
  }, [navigation, user, unreadCount, markAllAsRead]);

  const { isDarkMode } = useThemeStore();
  const theme = user?.role === 'instructor' ? colors.instructor : colors.student;
  const palette = getPalette(user?.role === 'instructor' ? 'instructor' : 'student', isDarkMode);
  const isInstructor = user?.role === 'instructor';

  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.isRead);
  }, [notifications]);

  const readNotifications = useMemo(() => {
    return notifications.filter(n => n.isRead);
  }, [notifications]);

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead && user) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.lessonId) {
      (navigation as any).navigate('LessonDetail', {
        lessonId: notification.lessonId,
        isInstructor: isInstructor,
      });
    } else if (notification.type === 'new_message') {
      // Navigate to chat if implemented
      // (navigation as any).navigate('ChatDetail', { ... });
    }
  };

  if (notifications.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
        <View style={styles.emptyState}>
          <MaterialIcons 
            name="notifications-none" 
            size={64} 
            color={(isInstructor ? colors.instructor.text.lightSecondary : colors.student.text.secondaryLight) + '80'} 
          />
          <Text style={[styles.emptyStateTitle, { color: isInstructor ? colors.instructor.text.lightPrimary : colors.student.text.primaryLight }]}>
            Bildirim Yok
          </Text>
          <Text style={[styles.emptyStateText, { color: isInstructor ? colors.instructor.text.lightSecondary : colors.student.text.secondaryLight }]}>
            Henüz bildiriminiz bulunmuyor.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}> 
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <View style={[styles.section, styles.firstSection]}>
            <Text style={[styles.sectionTitle, { color: isInstructor ? colors.instructor.text.lightPrimary : colors.student.text.primaryLight }]}>
              Okunmamış ({unreadNotifications.length})
            </Text>
            <View style={styles.notificationsList}>
              {unreadNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[styles.notificationItem, { backgroundColor: palette.card }, !notification.isRead && styles.unreadNotification]}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notificationIconContainer, { backgroundColor: getNotificationIconColor(notification.type, notification.isRead) + '15' }]}>
                    <MaterialIcons
                      name={getNotificationIcon(notification.type) as any}
                      size={24}
                      color={getNotificationIconColor(notification.type, notification.isRead)}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[styles.notificationTitle, { color: palette.text.primary }]} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    <Text style={[styles.notificationMessage, { color: palette.text.secondary }]} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={[styles.notificationTime, { color: palette.text.secondary }]}>
                      {formatNotificationTime(notification.createdAt)}
                    </Text>
                  </View>
                  {!notification.isRead && (
                    <View style={[styles.unreadDot, { backgroundColor: isInstructor ? colors.instructor.secondary : colors.student.primary }]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Read Notifications */}
        {readNotifications.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isInstructor ? colors.instructor.text.lightPrimary : colors.student.text.primaryLight }]}>
              Daha Önce
            </Text>
            <View style={styles.notificationsList}>
              {readNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[styles.notificationItem, { backgroundColor: palette.card }]}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.notificationIconContainer, { backgroundColor: getNotificationIconColor(notification.type, notification.isRead) + '15' }]}>
                    <MaterialIcons
                      name={getNotificationIcon(notification.type) as any}
                      size={24}
                      color={getNotificationIconColor(notification.type, notification.isRead)}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={[styles.notificationTitle, { color: palette.text.primary }]} numberOfLines={1}>
                      {notification.title}
                    </Text>
                    <Text style={[styles.notificationMessage, { color: palette.text.secondary }]} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={[styles.notificationTime, { color: palette.text.secondary }]}>
                      {formatNotificationTime(notification.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 0,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  firstSection: {
    marginTop: 0,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  notificationsList: {
    gap: spacing.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    gap: spacing.md,
    ...shadows.sm,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.student.primary,
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: spacing.xs,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl * 2,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 300,
  },
});

