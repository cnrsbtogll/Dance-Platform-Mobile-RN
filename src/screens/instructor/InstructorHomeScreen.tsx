import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { MockDataService } from '../../services/mockDataService';
import { useBookingStore } from '../../store/useBookingStore';
import { formatPrice, formatDate, formatTime } from '../../utils/helpers';
import { Card } from '../../components/common/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const InstructorHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  // Get instructor's lessons
  const instructorLessons = useMemo(() => {
    if (!user || user.role !== 'instructor') return [];
    return MockDataService.getLessonsByInstructor(user.id);
  }, [user]);

  // Get instructor's bookings
  const instructorBookings = useMemo(() => {
    if (!user || user.role !== 'instructor') return [];
    return MockDataService.getBookingsByInstructor(user.id);
  }, [user]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeLessons = instructorLessons.filter(l => l.isActive).length;
    const totalStudents = new Set(instructorBookings.map(b => b.studentId)).size;
    const avgRating = instructorLessons.reduce((sum, l) => sum + l.rating, 0) / (instructorLessons.length || 1);
    
    // Calculate earnings (mock data)
    const thisMonthEarnings = instructorBookings
      .filter(b => {
        const bookingDate = new Date(b.date);
        const now = new Date();
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, b) => sum + b.price, 0);
    
    const totalEarnings = instructorBookings.reduce((sum, b) => sum + b.price, 0);

    return {
      activeLessons,
      totalStudents,
      avgRating: avgRating.toFixed(1),
      thisMonthEarnings,
      totalEarnings,
    };
  }, [instructorLessons, instructorBookings]);

  // Get upcoming bookings (next 3)
  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return instructorBookings
      .filter(b => {
        const bookingDate = new Date(`${b.date}T${b.time}`);
        return bookingDate > now && b.status !== 'cancelled';
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`).getTime();
        const dateB = new Date(`${b.date}T${b.time}`).getTime();
        return dateA - dateB;
      })
      .slice(0, 3);
  }, [instructorBookings]);

  // Get active lessons
  const activeLessons = useMemo(() => {
    return instructorLessons.filter(l => l.isActive);
  }, [instructorLessons]);

  // If user is not instructor, set instructor1 as default for development
  useEffect(() => {
    if (!user || user.role !== 'instructor') {
      const instructor1 = MockDataService.getUserById('instructor1');
      if (instructor1) {
        useAuthStore.getState().setUser(instructor1);
      }
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Earnings Card */}
        <View style={[styles.section, styles.earningsSection]}>
          <View style={styles.earningsCard}>
            <View style={styles.earningsContent}>
              <View style={styles.earningsHeader}>
                <View style={styles.earningsHeaderLeft}>
                  <Text style={styles.earningsLabel}>Kazanç Özeti</Text>
                  <Text style={styles.earningsTitle}>Bu Ayki Kazancınız</Text>
                </View>
                <View style={styles.earningsIconContainer}>
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={32}
                    color={colors.instructor.secondary}
                  />
                </View>
              </View>
              <View style={styles.earningsRow}>
                <View style={styles.earningsAmountContainer}>
                  <Text style={styles.earningsAmount}>{formatPrice(stats.thisMonthEarnings)}</Text>
                  <Text style={styles.earningsTotal}>
                    Toplam Kazanç: {formatPrice(stats.totalEarnings)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>Detayları Gör</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Aktif Dersler</Text>
            <Text style={styles.statValue}>{stats.activeLessons}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Toplam Öğrenci</Text>
            <Text style={styles.statValue}>{stats.totalStudents}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Değerlendirme</Text>
            <Text style={styles.statValue}>{stats.avgRating}</Text>
          </Card>
        </View>

        {/* Upcoming Lessons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yaklaşan Derslerin</Text>
          {upcomingBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Yaklaşan ders bulunmuyor</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.upcomingScrollView}
              contentContainerStyle={styles.upcomingContent}
            >
              {upcomingBookings.map((booking) => {
                const lesson = MockDataService.getLessonById(booking.lessonId);
                const student = MockDataService.getUserById(booking.studentId);
                if (!lesson) return null;

                return (
                  <View key={booking.id} style={styles.upcomingCard}>
                    {lesson.imageUrl && (
                      <Image
                        source={{ uri: lesson.imageUrl }}
                        style={styles.upcomingImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.upcomingInfo}>
                      <Text style={styles.upcomingTitle}>{lesson.title}</Text>
                      <Text style={styles.upcomingDetails}>
                        {formatDate(booking.date)}, {formatTime(booking.time)} - {student?.name || 'Öğrenci'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Active Lessons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yayındaki Derslerin</Text>
          {activeLessons.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Yayında ders bulunmuyor</Text>
            </View>
          ) : (
            <View style={styles.activeLessonsList}>
              {activeLessons.map((lesson) => {
                const lessonBookings = instructorBookings.filter(b => b.lessonId === lesson.id);
                const enrolledCount = lessonBookings.length;
                const maxStudents = 12; // Mock max students

                return (
                  <TouchableOpacity
                    key={lesson.id}
                    style={styles.activeLessonCard}
                    onPress={() => {
                      (navigation as any).navigate('LessonDetail', { 
                        lessonId: lesson.id,
                        isInstructor: true 
                      });
                    }}
                  >
                    {lesson.imageUrl && (
                      <Image
                        source={{ uri: lesson.imageUrl }}
                        style={styles.activeLessonImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.activeLessonInfo}>
                      <Text style={styles.activeLessonTitle}>{lesson.title}</Text>
                      <Text style={styles.activeLessonStudents}>
                        {enrolledCount}/{maxStudents} Öğrenci
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={colors.instructor.text.lightSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottom spacing for FAB */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // Navigate to create lesson
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.instructor.secondary, colors.instructor.secondary]}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialIcons name="add" size={28} color="#ffffff" />
          <Text style={styles.fabText}>Yeni Ders Oluştur</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.instructor.background.light,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  earningsSection: {
    marginTop: spacing.md,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsCard: {
    marginBottom: 0,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.instructor.card.light,
    ...shadows.md,
    elevation: 4,
  },
  earningsContent: {
    width: '100%',
    padding: spacing.md,
    gap: spacing.md,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  earningsHeaderLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  earningsIconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.instructor.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.instructor.text.lightSecondary,
  },
  earningsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.instructor.text.lightPrimary,
    letterSpacing: -0.015,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  earningsAmountContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.instructor.primary,
  },
  earningsTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.instructor.text.lightSecondary,
  },
  detailsButton: {
    backgroundColor: colors.instructor.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    minWidth: 84,
  },
  detailsButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: '#ffffff',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 158,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: 0,
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.instructor.text.lightPrimary,
  },
  statValue: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.instructor.primary,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.instructor.text.lightPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.015,
  },
  upcomingScrollView: {
    marginHorizontal: -spacing.md,
  },
  upcomingContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  upcomingCard: {
    width: 256,
    gap: spacing.sm,
    backgroundColor: colors.instructor.card.light,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    ...shadows.md,
    elevation: 4,
  },
  upcomingImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.xl,
  },
  upcomingInfo: {
    gap: spacing.xs,
  },
  upcomingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.instructor.text.lightPrimary,
  },
  upcomingDetails: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.instructor.text.lightSecondary,
  },
  activeLessonsList: {
    gap: spacing.sm,
  },
  activeLessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.instructor.card.light,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    elevation: 4,
  },
  activeLessonImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
  },
  activeLessonInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  activeLessonTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.instructor.text.lightPrimary,
  },
  activeLessonStudents: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.instructor.text.lightSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 20,
    bottom: 10 ,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.lg,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  fabText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.instructor.text.lightSecondary,
  },
});
