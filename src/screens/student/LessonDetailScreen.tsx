import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { MockDataService } from '../../services/mockDataService';
import { formatDate, formatTime, getDurationText, formatPrice, normalizeDaysOfWeek } from '../../utils/helpers';
import { useLessonStore } from '../../store/useLessonStore';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { FirestoreService } from '../../services/firebase/firestore';
import { getLessonImageSource } from '../../utils/imageHelper';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';

export const LessonDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const params = route.params as { lessonId?: string; bookingId?: string; isInstructor?: boolean } | undefined;
  const lessonId = params?.lessonId;
  const bookingId = params?.bookingId;
  const isInstructor = params?.isInstructor || false;
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);

  const { toggleFavorite, favoriteLessons, lessons } = useLessonStore();
  const { createBooking } = useBookingStore();
  const { user, isAuthenticated } = useAuthStore();

  // Get lesson from store instead of MockDataService
  const lesson = lessons.find(l => l.id === lessonId);

  const [instructor, setInstructor] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (lesson) {
        setIsLoadingDetails(true);
        try {
          // Fetch Instructor
          if (lesson.instructorId) {
            const instructorData = await FirestoreService.getInstructorById(lesson.instructorId);
            if (instructorData) {
              setInstructor(instructorData);
            }
          }

          // Fetch School
          const schoolId = lesson.location?.type === 'school' ? lesson.location.schoolId : lesson.schoolId;

          if (schoolId) {
            const schoolData = await FirestoreService.getDanceSchoolById(schoolId);
            if (schoolData) {
              setSchool(schoolData);
            }
          } else if (lesson.location?.type === 'custom') {
            setSchool(null); // Clear school if custom address
          }
        } catch (error) {
          console.error("Error fetching details:", error);
        } finally {
          setIsLoadingDetails(false);
        }
      }
    };

    fetchDetails();
  }, [lesson]);


  const booking = bookingId ? MockDataService.getBookingById(bookingId) : null;

  const isFavorite = lesson ? favoriteLessons.includes(lesson.id) : false;
  const [isRegistered, setIsRegistered] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(false);
  const isOwnLesson = isInstructor && lesson && user && lesson.instructorId === user.id;

  // Check if user logged in after clicking register button
  useFocusEffect(
    React.useCallback(() => {
      if (pendingRegistration && isAuthenticated && user && lesson) {
        // User logged in, navigate to payment screen
        setPendingRegistration(false);
        (navigation as any).navigate('Payment', {
          lessonId: lesson.id,
          date: new Date().toISOString().split('T')[0],
          time: '18:00',
        });
      }
    }, [isAuthenticated, user, pendingRegistration, lesson, navigation])
  );

  if (!lesson) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: palette.text.secondary }]}>{t('lessons.notFound')}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{t('lessons.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleRegister = () => {
    if (booking || isRegistered) {
      // Already registered
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      // Set pending registration flag and navigate to login screen
      setPendingRegistration(true);
      (navigation as any).navigate('Login');
      return;
    }

    // Navigate to payment screen
    (navigation as any).navigate('Payment', {
      lessonId: lesson.id,
      date: new Date().toISOString().split('T')[0], // Default to today, in real app get from date picker
      time: '18:00', // Default time, in real app get from time picker
    });
  };

  const handleEdit = () => {
    (navigation as any).navigate('EditLesson', { lessonId: lesson?.id });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <View style={[styles.navbar, { borderBottomColor: palette.border, backgroundColor: palette.background }]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back-ios-new" size={20} color={palette.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: palette.text.primary }]}>{t('lessons.details') || 'Lesson Details'}</Text>
        <View style={styles.navButton} />
      </View>
      <ScrollView style={[styles.scrollView, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          {lesson.imageUrl && (
            <Image
              source={getLessonImageSource(lesson.imageUrl)}
              style={styles.heroImage}
              resizeMode="cover"
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradientOverlay}
          />



          {/* Title Overlay */}
          <View style={styles.titleOverlay}>
            <Text style={styles.heroTitle}>{lesson.title || lesson.name}</Text>
            <Text style={styles.heroInstructor}>
              {t('lessons.instructor')}: {instructor?.displayName || lesson.instructorName || t('studentHome.unknown')}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={[styles.infoCard, { backgroundColor: palette.card }]}>
              <MaterialIcons name="calendar-today" size={32} color={colors.student.primary} />
              <Text style={[styles.infoCardLabel, { color: palette.text.primary }]}>{t('lessons.schedule')}</Text>
              <Text style={[styles.infoCardValue, { color: palette.text.secondary }]}>
                {(() => {
                  if (booking) return formatDate(booking.date);
                  if (Array.isArray(lesson.daysOfWeek) && lesson.daysOfWeek.length > 0) {
                    // Normalize days (convert Turkish to English keys if needed)
                    const normalizedDays = normalizeDaysOfWeek(lesson.daysOfWeek);
                    const translated = normalizedDays.map(day => t(`lessons.shortDays.${day}`)).join(', ');
                    return translated;
                  }
                  if (lesson.date) return formatDate(lesson.date);
                  if (typeof lesson.daysOfWeek === 'string') return lesson.daysOfWeek;
                  return t('lessons.notSpecified');
                })()}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: palette.card }]}>
              <MaterialIcons name="schedule" size={32} color={colors.student.primary} />
              <Text style={[styles.infoCardLabel, { color: palette.text.primary }]}>{t('lessons.time')}</Text>
              <Text style={[styles.infoCardValue, { color: palette.text.secondary }]}>
                {booking ? formatTime(booking.time) : lesson.time ? formatTime(lesson.time) : t('lessons.notSpecified')}
              </Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: palette.card }]}>
              <MaterialIcons name="hourglass-empty" size={32} color={colors.student.primary} />
              <Text style={[styles.infoCardLabel, { color: palette.text.primary }]}>{t('lessons.duration')}</Text>
              <Text style={[styles.infoCardValue, { color: palette.text.secondary }]}>{getDurationText(lesson.duration)}</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.lessonDescription')}</Text>
            <Text style={[styles.descriptionText, { color: palette.text.secondary }]}>{lesson.description}</Text>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.location')}</Text>
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={24} color={colors.student.primary} />
              <View style={styles.locationTextContainer}>
                {lesson.location?.type === 'custom' ? (
                  <Text style={[styles.locationName, { color: palette.text.primary }]}>
                    {lesson.location.customAddress}
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.locationName, { color: palette.text.primary }]}>
                      {school?.name || lesson.location?.schoolName || lesson.schoolName || t('common.loading')}
                    </Text>
                    <Text style={[styles.locationAddress, { color: palette.text.secondary }]}>
                      {school?.address
                        ? `${school.address}${school.city ? `, ${school.city}` : ''}`
                        : (school?.city || t('lessons.addressNotAvailable'))}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Bottom spacing for fixed bar */}
          <View style={{ height: 80 + insets.bottom }} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      {isOwnLesson ? (
        <SafeAreaView edges={['bottom']} style={[styles.bottomBarContainer, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.registerButton, { marginLeft: 0, flex: 1 }]}
              onPress={handleEdit}
            >
              <LinearGradient
                colors={[colors.instructor.secondary, colors.instructor.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButtonGradient}
              >
                <MaterialIcons name="edit" size={20} color="#ffffff" style={{ marginRight: spacing.xs }} />
                <Text style={styles.registerButtonText}>{t('lessons.editLessonButton')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView edges={['bottom']} style={[styles.bottomBarContainer, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
          <View style={styles.bottomBar}>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceLabel, { color: palette.text.secondary }]}>{t('lessons.fee')}</Text>
              <Text style={[styles.priceValue, { color: colors.student.primary }]}>
                {formatPrice(lesson.price)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isRegistered || !!booking}
            >
              <LinearGradient
                colors={['#4A90E2', '#5BA3F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButtonGradient}
              >
                <Text style={styles.registerButtonText}>
                  {booking || isRegistered ? t('lessons.registered') : t('lessons.register')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
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
  heroContainer: {
    height: 288,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonMargin: {
    marginLeft: spacing.sm,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    zIndex: 10,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
    lineHeight: 36,
  },
  heroInstructor: {
    fontSize: typography.fontSize.lg,
    color: '#ffffff',
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
  infoCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  infoCardLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  infoCardValue: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  descriptionText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: typography.fontSize.sm,
  },
  mapContainer: {
    height: 160,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: typography.fontWeight.bold,
  },
  registerButton: {
    flex: 1,
    marginLeft: spacing.md,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...shadows.lg,
  },
  registerButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  registerButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.md,
  },
  backButton: {
    fontSize: typography.fontSize.base,
    color: colors.student.primary,
    fontWeight: typography.fontWeight.medium,
  },
  navbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
});

