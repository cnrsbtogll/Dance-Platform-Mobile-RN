import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { MockDataService } from '../../services/mockDataService';
import { formatDate, formatTime, getUpcomingBookings, getPastBookings } from '../../utils/helpers';
import { Card } from '../../components/common/Card';

type TabType = 'active' | 'past';

export const MyLessonsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { getUserBookings } = useBookingStore();
  const bookings = getUserBookings();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);

  const upcomingBookings = getUpcomingBookings(bookings);
  const pastBookings = getPastBookings(bookings);

  const displayBookings = activeTab === 'active' ? upcomingBookings : pastBookings;

  const getDayName = (dateString: string): string => {
    const date = new Date(dateString);
    const days = [
      t('lessons.days.sunday'),
      t('lessons.days.monday'),
      t('lessons.days.tuesday'),
      t('lessons.days.wednesday'),
      t('lessons.days.thursday'),
      t('lessons.days.friday'),
      t('lessons.days.saturday'),
    ];
    return days[date.getDay()];
  };

  const isUpcoming = (dateString: string, timeString: string): boolean => {
    const bookingDateTime = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    const diffDays = Math.ceil((bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  // Debug: Log bookings to see what's happening
  useEffect(() => {
    const user = useAuthStore.getState().user;
    console.log('User:', user);
    console.log('All bookings:', bookings);
    console.log('Upcoming bookings:', upcomingBookings);
    console.log('Past bookings:', pastBookings);
  }, [bookings, upcomingBookings, pastBookings]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView style={[styles.scrollView, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
        {/* Segmented Buttons */}
        <View style={styles.segmentedContainer}>
          <View style={[styles.segmentedWrapper, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <TouchableOpacity
              style={[
                styles.segmentedButton,
                activeTab === 'active' && styles.segmentedButtonActive
              ]}
              onPress={() => setActiveTab('active')}
            >
              <Text style={[
                styles.segmentedButtonText,
                { color: activeTab === 'active' ? '#ffffff' : palette.text.secondary },
                activeTab === 'active' && styles.segmentedButtonTextActive
              ]}>
                {t('lessons.activeLessons')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentedButton,
                activeTab === 'past' && styles.segmentedButtonActive
              ]}
              onPress={() => setActiveTab('past')}
            >
              <Text style={[
                styles.segmentedButtonText,
                { color: activeTab === 'past' ? '#ffffff' : palette.text.secondary },
                activeTab === 'past' && styles.segmentedButtonTextActive
              ]}>
                {t('lessons.pastLessons')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lesson List */}
        <View style={styles.lessonsList}>
          {displayBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateTitle, { color: palette.text.primary }]}>{t('lessons.noLessonsYet')}</Text>
              <Text style={[styles.emptyStateText, { color: palette.text.secondary }]}>
                {t('lessons.discoverLessonsText')}
              </Text>
              <TouchableOpacity style={styles.emptyStateButton}>
                <Text style={styles.emptyStateButtonText}>{t('lessons.discoverLessons')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayBookings.map((booking) => {
              const lesson = MockDataService.getLessonById(booking.lessonId);
              const instructor = MockDataService.getInstructorForLesson(booking.lessonId);
              const dayName = getDayName(booking.date);
              const isUpcomingSoon = isUpcoming(booking.date, booking.time);

              if (!lesson) return null;

              return (
                <TouchableOpacity
                  key={booking.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    // Navigate to LessonDetail in the parent Stack Navigator
                    (navigation as any).getParent()?.navigate('LessonDetail', {
                      lessonId: booking.lessonId,
                      bookingId: booking.id,
                    });
                  }}
                >
                  <Card style={styles.lessonCard}>
                    <View style={styles.lessonCardContent}>
                      <View style={styles.lessonCardLeft}>
                        {lesson.imageUrl && (
                          <Image
                            source={{ uri: lesson.imageUrl }}
                            style={styles.lessonThumbnail}
                            resizeMode="cover"
                          />
                        )}
                        <View style={styles.lessonInfo}>
                          <Text style={[styles.lessonTitle, { color: palette.text.primary }]}>{lesson.title}</Text>
                          <Text style={[styles.lessonInstructor, { color: palette.text.secondary }]}>
                            {t('lessons.instructor')}: {instructor?.name || t('studentHome.unknown')}
                          </Text>
                          <Text style={[styles.lessonDateTime, { color: palette.text.secondary }]}>
                            {formatDate(booking.date)}, {dayName} - {formatTime(booking.time)}
                          </Text>
                          {isUpcomingSoon && activeTab === 'active' && (
                            <View style={styles.upcomingBadge}>
                              <Text style={styles.upcomingBadgeText}>{t('lessons.upcoming')}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.lessonCardRight}>
                        <MaterialIcons 
                          name="chevron-right" 
                          size={24} 
                          color={palette.text.secondary} 
                        />
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  segmentedContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmentedWrapper: {
    height: 40,
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: 2,
  },
  segmentedButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
  },
  segmentedButtonActive: {
    backgroundColor: '#4A90E2',
    ...shadows.sm,
  },
  segmentedButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  segmentedButtonTextActive: {
    color: '#ffffff',
  },
  lessonsList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  lessonCard: {
    marginBottom: spacing.sm,
  },
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  lessonCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  lessonThumbnail: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
  },
  lessonInfo: {
    flex: 1,
    gap: 2,
  },
  lessonTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  lessonInstructor: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  lessonDateTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  upcomingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 166, 35, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: 4,
  },
  upcomingBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: '#F5A623',
  },
  lessonCardRight: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  emptyStateButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  emptyStateButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  bottomTabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

