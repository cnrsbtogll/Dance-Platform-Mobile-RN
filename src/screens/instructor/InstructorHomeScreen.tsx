import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { openWhatsApp } from '../../utils/whatsapp';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { appConfig } from '../../config/appConfig';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { FirestoreService } from '../../services/firebase/firestore';
import { useBookingStore } from '../../store/useBookingStore';
import { formatPrice, formatDate, formatTime } from '../../utils/helpers';
import { Card } from '../../components/common/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLessonImageSource } from '../../utils/imageHelper';
import { Lesson, Booking } from '../../types';
import { Alert } from 'react-native';

export const InstructorHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, refreshProfile } = useAuthStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('instructor', isDarkMode);
  const insets = useSafeAreaInsets();
  const { getUserBookings, fetchUserBookings } = useBookingStore();
  const instructorBookings = getUserBookings();

  const [instructorLessons, setInstructorLessons] = React.useState<Lesson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasSubmittedRequest, setHasSubmittedRequest] = React.useState(false);

  // Fetch instructor's lessons from Firestore
  useFocusEffect(
    React.useCallback(() => {
      const fetchLessons = async () => {
        if (!user || user.role !== 'instructor') {
          setInstructorLessons([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          const lessons = await FirestoreService.getLessonsByInstructor(user.id);
          setInstructorLessons(lessons);
        } catch (error) {
          console.error('Error fetching instructor lessons:', error);
          setInstructorLessons([]);
        } finally {
          setLoading(false);
        }
      };

      const checkRequestStatus = async () => {
        if (user?.id) {
          const status = await FirestoreService.getInstructorRequestStatus(user.id);
          setHasSubmittedRequest(!!status);
        }
      };

      refreshProfile();
      fetchLessons();
      fetchUserBookings();
      checkRequestStatus();
    }, [user?.id, user?.role, refreshProfile, fetchUserBookings])
  );



  // Calculate stats
  const stats = useMemo(() => {
    const activeInstructorBookings = instructorBookings.filter((b: any) => b.status !== 'cancelled');
    const activeLessonsCount = instructorLessons.filter(l => l.isActive).length;

    // @ts-ignore - Booking type might need update or mock implementation fix
    const totalStudents = new Set(activeInstructorBookings.map((b: any) => b.studentId)).size;
    const avgRating = instructorLessons.reduce((sum, l) => sum + l.rating, 0) / (instructorLessons.length || 1);

    // Calculate earnings
    const thisMonthEarnings = activeInstructorBookings
      .filter((b: any) => {
        const bookingDate = new Date(b.date);
        const now = new Date();
        return bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum: number, b: any) => sum + (b.price || 0), 0);

    const totalEarnings = activeInstructorBookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0);

    return {
      activeLessons: activeLessonsCount,
      totalStudents,
      avgRating: avgRating.toFixed(1),
      thisMonthEarnings,
      totalEarnings,
    };
  }, [instructorLessons, instructorBookings]);

  // Get active lessons
  const activeLessons = useMemo(() => {
    return instructorLessons.filter(l => l.isActive);
  }, [instructorLessons]);

  // Get upcoming bookings and recurring lessons
  const upcomingBookings = useMemo(() => {
    const now = new Date();

    // Get upcoming bookings and recurring lessons
    const oneWeekFromNow = new Date(now);
    oneWeekFromNow.setDate(now.getDate() + 7);

    // Get explicit bookings
    const explicitBookings = instructorBookings
      .filter(b => {
        // @ts-ignore
        const bookingDate = new Date(`${b.date}T${b.time}`);
        // @ts-ignore
        return bookingDate > now && bookingDate <= oneWeekFromNow && b.status !== 'cancelled';
      })
      .map(b => ({
        ...b,
        // @ts-ignore
        dateTime: new Date(`${b.date}T${b.time}`),
        isRecurring: false,
      }));

    // Get recurring lessons (lessons with daysOfWeek)
    const recurringLessons = activeLessons
      .filter(lesson => lesson.daysOfWeek && lesson.daysOfWeek.length > 0 && lesson.time)
      .flatMap(lesson => {
        const { getNextLessonOccurrence } = require('../../utils/helpers');
        // Fetch up to 7 occurrences to cover daily lessons for a week
        const nextOccurrences = getNextLessonOccurrence(lesson.daysOfWeek!, lesson.time!, 7);

        return nextOccurrences
          .filter((dateTime: Date) => dateTime <= oneWeekFromNow)
          .map((dateTime: Date) => ({
            id: `${lesson.id}-${dateTime.getTime()}`,
            lessonId: lesson.id,
            date: dateTime.toISOString().split('T')[0],
            time: dateTime.toTimeString().slice(0, 5),
            dateTime: dateTime,
            isRecurring: true,
            studentName: null,
            status: 'scheduled',
          }));
      });

    // Combine and sort by date/time
    const allUpcoming = [...explicitBookings, ...recurringLessons]
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()); // Remove limit, show all within week

    return allUpcoming;
  }, [instructorBookings, activeLessons]);

  useEffect(() => {
    if (user) {
      loadNotifications(user.id);
    }
  }, [user, loadNotifications]);

  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: palette.background,
      },
      headerTintColor: palette.text.primary,
      headerTitleStyle: {
        color: palette.text.primary,
      },
      headerLeft: () => (
        <View style={{
          backgroundColor: colors.instructor.secondary,
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
      headerRight: appConfig.features.notifications ? () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs }}
            onPress={() => {
              console.log('[InstructorHome] Header Add clicked. User:', user?.id, 'onboardingCompleted:', user?.onboardingCompleted);
              if (user && !user.onboardingCompleted) {
                Alert.alert(
                  t('instructor.profileIncomplete') || 'Profiliniz Eksik',
                  t('instructor.completeProfileBeforeLesson') || 'Ders oluşturabilmek için önce eğitmen profilinizi tamamlamanız gerekmektedir.',
                  [{
                    text: t('common.ok'),
                    onPress: () => {
                      // @ts-ignore
                      navigation.navigate('InstructorOnboarding');
                    }
                  }]
                );
              } else {
                (navigation as any).navigate('CreateLesson');
              }
            }}
          >
            <MaterialIcons
              name="add"
              size={28}
              color={palette.text.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }}
            onPress={() => {
              (navigation as any).getParent()?.navigate('Notification');
            }}
          >
            <View style={{ position: 'relative' }}>
              <MaterialIcons
                name="notifications"
                size={28}
                color={palette.text.primary}
              />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#e53e3e',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                  borderWidth: 2,
                  borderColor: palette.background,
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: typography.fontWeight.bold,
                    color: '#ffffff',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      ) : undefined,
    });
  }, [navigation, unreadCount, isDarkMode, palette, t]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView style={[styles.scrollView, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
        {/* Verification Banner */}
        {user?.role === 'draft-instructor' && (
          <View style={[styles.verificationBanner, { backgroundColor: isDarkMode ? palette.card : '#F0FDFA', borderColor: colors.instructor.primary }]}>
            <View style={styles.verificationBannerHeader}>
              <View style={[styles.infoIconContainer, { backgroundColor: colors.instructor.primary + '20' }]}>
                <MaterialIcons name="rocket-launch" size={20} color={colors.instructor.primary} />
              </View>
              <Text style={[styles.verificationBannerTitle, { color: palette.text.primary }]}>
                {t('instructor.verificationRequired') || 'Aramıza Hoş Geldiniz!'}
              </Text>
            </View>

            <Text style={[styles.verificationBannerText, { color: palette.text.secondary }]}>
              {t('instructor.verificationStepDesc') || 'Eğitmen olarak ders vermeye başlamanız için sadece 3 küçük adım kaldı. Hadi profilinizi hazırlayalım!'}
            </Text>

            <View style={styles.bannerActions}>
              <TouchableOpacity
                style={[
                  styles.onboardingButton,
                  { backgroundColor: user?.onboardingCompleted ? '#10B981' : colors.instructor.primary }
                ]}
                onPress={() => {
                  // @ts-ignore
                  navigation.navigate('InstructorOnboarding');
                }}
              >
                <View style={styles.buttonContent}>
                  <MaterialIcons
                    name={user?.onboardingCompleted ? "check-circle" : "person-outline"}
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.verificationButtonText}>
                    {user?.onboardingCompleted
                      ? (t('instructor.onboardingCompleted') || 'Profil Tamamlandı')
                      : (t('instructor.completeProfileButton') || 'Eğitmen Profilinizi Tamamlayın')}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.verificationButton,
                  { backgroundColor: user?.onboardingCompleted ? colors.instructor.secondary : '#E5E7EB' }
                ]}
                onPress={() => {
                  if (user?.onboardingCompleted) {
                    // @ts-ignore
                    navigation.navigate('Verification');
                  } else {
                    Alert.alert(
                      t('instructor.onboardingRequiredTitle') || 'Profil Tamamlanmadı',
                      t('instructor.onboardingRequiredDesc') || 'Doğrulama işlemine geçmeden önce lütfen profil bilgilerinizi (onboarding) tamamlayın.',
                      [{ text: t('common.ok') }]
                    );
                  }
                }}
                activeOpacity={user?.onboardingCompleted ? 0.7 : 1}
              >
                <View style={styles.buttonContent}>
                  <MaterialIcons
                    name="verified-user"
                    size={18}
                    color={user?.onboardingCompleted ? "#ffffff" : "#9CA3AF"}
                  />
                  <Text style={[styles.verificationButtonText, { color: user?.onboardingCompleted ? '#ffffff' : '#9CA3AF' }]}>
                    {t('instructor.verifyNow') || 'Kimlik & Sertifika Yükle'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.whatsappBannerButton,
                  { backgroundColor: hasSubmittedRequest ? '#25D366' : '#E5E7EB' }
                ]}
                onPress={() => {
                  if (hasSubmittedRequest) {
                    const waMessage = `${t('instructor.verificationWhatsappMessage')}${user?.id}`;
                    openWhatsApp('+90 0555 005 98 76', waMessage);
                  } else {
                    Alert.alert(
                      t('instructor.requestRequiredTitle') || 'Başvuru Yapılmadı',
                      t('instructor.requestRequiredDesc') || 'Destek ile iletişime geçmeden önce lütfen doğrulama belgelerinizi gönderin.',
                      [{ text: t('common.ok') }]
                    );
                  }
                }}
                activeOpacity={hasSubmittedRequest ? 0.7 : 1}
              >
                <View style={styles.buttonContent}>
                  <FontAwesome
                    name="whatsapp"
                    size={18}
                    color={hasSubmittedRequest ? "#ffffff" : "#9CA3AF"}
                  />
                  <Text style={[styles.whatsappBannerButtonText, { color: hasSubmittedRequest ? '#ffffff' : '#9CA3AF' }]}>
                    {t('instructor.contactSupportWhatsapp') || 'WhatsApp ile Hızlandır'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Earnings Card */}
        <View style={[styles.section, styles.earningsSection]}>
          <View style={[styles.earningsCard, { backgroundColor: palette.card }]}>
            <View style={styles.earningsContent}>
              <View style={styles.earningsHeader}>
                <View style={styles.earningsHeaderLeft}>
                  <Text style={[styles.earningsLabel, { color: palette.text.primary }]}>{t('instructorHome.earningsSummary')}</Text>
                  <Text style={[styles.earningsTitle, { color: palette.text.primary }]}>{t('instructorHome.thisMonthEarnings')}</Text>
                </View>
                <View style={[styles.earningsIconContainer, { backgroundColor: colors.instructor.secondary + '15' }]}>
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={32}
                    color={colors.instructor.secondary}
                  />
                </View>
              </View>
              <View style={styles.earningsRow}>
                <View style={styles.earningsAmountContainer}>
                  <Text style={[styles.earningsAmount, { color: isDarkMode ? '#E0E0E0' : colors.instructor.primary }]}>{formatPrice(stats.thisMonthEarnings, user?.currency)}</Text>
                  <Text style={[styles.earningsTotal, { color: palette.text.primary }]}>
                    {t('instructorHome.totalEarnings')}: {formatPrice(stats.totalEarnings, user?.currency)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => (navigation as any).navigate('EarningsDetails')}
                >
                  <Text style={styles.detailsButtonText}>{t('instructorHome.viewDetails')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.statLabel, { color: palette.text.primary }]}>{t('instructorHome.activeLessons')}</Text>
            <Text style={[styles.statValue, { color: isDarkMode ? '#E0E0E0' : colors.instructor.primary }]}>{stats.activeLessons}</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.statLabel, { color: palette.text.primary }]}>{t('instructorHome.totalStudents')}</Text>
            <Text style={[styles.statValue, { color: isDarkMode ? '#E0E0E0' : colors.instructor.primary }]}>{stats.totalStudents}</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.statLabel, { color: palette.text.primary }]}>{t('instructorHome.rating')}</Text>
            <Text style={[styles.statValue, { color: isDarkMode ? '#E0E0E0' : colors.instructor.primary }]}>{stats.avgRating}</Text>
          </Card>
        </View>

        {/* Upcoming Lessons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('instructorHome.upcomingLessons')}</Text>
          {upcomingBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: palette.text.secondary }]}>{t('instructorHome.noUpcomingLessons')}</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.upcomingScrollView}
              contentContainerStyle={styles.upcomingContent}
            >
              {upcomingBookings.map((booking: any) => {
                const lesson = instructorLessons.find(l => l.id === booking.lessonId);
                if (!lesson) return null;

                return (
                  <TouchableOpacity
                    key={booking.id}
                    style={[styles.upcomingCard, { backgroundColor: palette.card }]}
                    onPress={() => {
                      (navigation as any).navigate('LessonDetail', {
                        lessonId: lesson.id,
                        bookingId: booking.id,
                        isInstructor: true
                      });
                    }}
                  >
                    {lesson.imageUrl && (
                      <Image
                        source={getLessonImageSource(lesson.imageUrl)}
                        style={styles.upcomingImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.upcomingInfo}>
                      <Text style={[styles.upcomingTitle, { color: palette.text.primary }]} numberOfLines={1}>
                        {lesson.title}
                      </Text>
                      <Text style={[styles.upcomingStudent, { color: palette.text.secondary }]} numberOfLines={1}>
                        {booking.isRecurring
                          ? t('instructorHome.recurringLesson')
                          : (booking.studentName || t('instructorHome.student'))
                        }
                      </Text>
                      <View style={styles.upcomingDateTime}>
                        <MaterialIcons name="event" size={14} color={palette.text.secondary} />
                        <Text style={[styles.upcomingDateText, { color: palette.text.secondary }]}>
                          {formatDate(booking.date)}
                        </Text>
                        <MaterialIcons name="access-time" size={14} color={palette.text.secondary} style={{ marginLeft: 8 }} />
                        <Text style={[styles.upcomingTimeText, { color: palette.text.secondary }]}>
                          {formatTime(booking.time)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Active Lessons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('instructorHome.activeLessonsList')}</Text>
          {activeLessons.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: palette.text.secondary }]}>{t('instructorHome.noActiveLessons')}</Text>
            </View>
          ) : (
            <View style={styles.activeLessonsList}>
              {activeLessons.map((lesson) => {
                const activeLessonBookings = instructorBookings.filter((b: any) => b.lessonId === lesson.id && b.status !== 'cancelled');
                const enrolledCount = (lesson as any)?.participantStats?.total ?? activeLessonBookings.length;
                const maxStudents = (lesson as any).capacity || 12;

                return (
                  <TouchableOpacity
                    key={lesson.id}
                    style={[styles.activeLessonCard, { backgroundColor: palette.card }]}
                    onPress={() => {
                      (navigation as any).navigate('LessonDetail', {
                        lessonId: lesson.id,
                        isInstructor: true
                      });
                    }}
                  >
                    {lesson.imageUrl && (
                      <Image
                        source={getLessonImageSource(lesson.imageUrl)}
                        style={styles.activeLessonImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.activeLessonInfo}>
                      <Text style={[styles.activeLessonTitle, { color: palette.text.primary }]}>{lesson.title}</Text>
                      <Text style={[styles.activeLessonStudents, { color: palette.text.secondary }]}>
                        {t('instructorHome.studentsCount', { count: enrolledCount, max: maxStudents })}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={palette.text.secondary}
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
        style={[styles.fab, { backgroundColor: colors.instructor.primary }]}
        onPress={() => {
          console.log('[InstructorHome] FAB clicked. User:', user?.id, 'onboardingCompleted:', user?.onboardingCompleted);
          if (user && !user.onboardingCompleted) {
            Alert.alert(
              t('instructor.profileIncomplete') || 'Profiliniz Eksik',
              t('instructor.completeProfileBeforeLesson') || 'Ders oluşturabilmek için önce eğitmen profilinizi tamamlamanız gerekmektedir.',
              [{
                text: t('common.ok'),
                onPress: () => {
                  // @ts-ignore
                  navigation.navigate('InstructorOnboarding');
                }
              }]
            );
          } else {
            (navigation as any).navigate('CreateLesson');
          }
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
          <Text style={styles.fabText}>{t('instructorHome.createNewLesson')}</Text>
        </LinearGradient>
      </TouchableOpacity>
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
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  verificationBanner: {
    margin: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    ...shadows.md,
    elevation: 4,
  },
  verificationBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationBannerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  verificationBannerText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  bannerActions: {
    gap: spacing.sm,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  onboardingButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  verificationButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  whatsappBannerButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  verificationButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  whatsappBannerButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
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
  },
  earningsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
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
  },
  earningsTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
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
  },
  statValue: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
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
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
  },
  upcomingImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  upcomingInfo: {
    gap: spacing.xs,
  },
  upcomingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  upcomingDetails: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  upcomingStudent: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  upcomingDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  upcomingDateText: {
    fontSize: typography.fontSize.xs,
    marginLeft: 4,
  },
  upcomingTimeText: {
    fontSize: typography.fontSize.xs,
    marginLeft: 4,
  },
  activeLessonsList: {
    gap: spacing.sm,
  },
  activeLessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
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
  },
  activeLessonStudents: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 20,
    bottom: 10,
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
  },
});
