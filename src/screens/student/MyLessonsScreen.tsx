import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { MockDataService } from '../../services/mockDataService';
import { formatDate, formatTime, getUpcomingBookings, getPastBookings } from '../../utils/helpers';
import { Card } from '../../components/common/Card';
import { BottomTab } from '../../components/common/BottomTab';

type TabType = 'active' | 'past';

export const MyLessonsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { getUserBookings } = useBookingStore();
  const bookings = getUserBookings();
  const [activeTab, setActiveTab] = useState<TabType>('active');

  const upcomingBookings = getUpcomingBookings(bookings);
  const pastBookings = getPastBookings(bookings);

  const displayBookings = activeTab === 'active' ? upcomingBookings : pastBookings;

  const getDayName = (dateString: string): string => {
    const date = new Date(dateString);
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
  };

  const isUpcoming = (dateString: string, timeString: string): boolean => {
    const bookingDateTime = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    const diffDays = Math.ceil((bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  };

  // Debug: Log bookings to see what's happening
  React.useEffect(() => {
    const user = useAuthStore.getState().user;
    console.log('User:', user);
    console.log('All bookings:', bookings);
    console.log('Upcoming bookings:', upcomingBookings);
    console.log('Past bookings:', pastBookings);
  }, [bookings, upcomingBookings, pastBookings]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top App Bar */}
      <View style={[styles.header, { backgroundColor: colors.student.background.light + 'CC' }]}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>Derslerim</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Segmented Buttons */}
        <View style={styles.segmentedContainer}>
          <View style={styles.segmentedWrapper}>
            <TouchableOpacity
              style={[
                styles.segmentedButton,
                activeTab === 'active' && styles.segmentedButtonActive
              ]}
              onPress={() => setActiveTab('active')}
            >
              <Text style={[
                styles.segmentedButtonText,
                activeTab === 'active' && styles.segmentedButtonTextActive
              ]}>
                Aktif Dersler
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
                activeTab === 'past' && styles.segmentedButtonTextActive
              ]}>
                Geçmiş Dersler
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lesson List */}
        <View style={styles.lessonsList}>
          {displayBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Henüz bir dersiniz yok</Text>
              <Text style={styles.emptyStateText}>
                Yeni dersler keşfetmeye ve öğrenmeye hemen başlayın.
              </Text>
              <TouchableOpacity style={styles.emptyStateButton}>
                <Text style={styles.emptyStateButtonText}>Dersleri Keşfet</Text>
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
                <TouchableOpacity key={booking.id} activeOpacity={0.7}>
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
                          <Text style={styles.lessonTitle}>{lesson.title}</Text>
                          <Text style={styles.lessonInstructor}>
                            Eğitmen: {instructor?.name || 'Bilinmiyor'}
                          </Text>
                          <Text style={styles.lessonDateTime}>
                            {formatDate(booking.date)}, {dayName} - {formatTime(booking.time)}
                          </Text>
                          {isUpcomingSoon && activeTab === 'active' && (
                            <View style={styles.upcomingBadge}>
                              <Text style={styles.upcomingBadgeText}>Yaklaşıyor</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.lessonCardRight}>
                        <MaterialIcons 
                          name="chevron-right" 
                          size={24} 
                          color={colors.student.text.secondaryLight} 
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

      {/* Bottom Tab Navigator */}
      <View style={styles.bottomTabContainer}>
        <BottomTab
          items={[
            { 
              label: 'Ana Sayfa', 
              icon: <MaterialIcons name="home" size={24} />, 
              onPress: () => {
                navigation.navigate('Home' as never);
              } 
            },
            { 
              label: 'Derslerim', 
              icon: <MaterialIcons name="school" size={24} />, 
              onPress: () => {} 
            },
            { 
              label: 'Sohbet', 
              icon: <MaterialIcons name="chat-bubble-outline" size={24} />, 
              onPress: () => {} 
            },
            { 
              label: 'Profil', 
              icon: <MaterialIcons name="person-outline" size={24} />, 
              onPress: () => {} 
            },
          ]}
          activeIndex={1}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.student.background.light,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    paddingTop: spacing.md,
    zIndex: 20,
  },
  headerLeft: {
    width: 48,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
    textAlign: 'center',
    letterSpacing: -0.15,
  },
  headerRight: {
    width: 48,
  },
  segmentedContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmentedWrapper: {
    height: 40,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
    color: colors.student.text.secondaryLight,
  },
  segmentedButtonTextActive: {
    color: '#ffffff',
  },
  lessonsList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    paddingBottom: 100, // Bottom tab için alan
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
    color: colors.student.text.primaryLight,
  },
  lessonInstructor: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.student.text.secondaryLight,
  },
  lessonDateTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.student.text.secondaryLight,
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
    color: colors.student.text.primaryLight,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.student.text.secondaryLight,
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

