import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Modal, FlatList, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';

import { formatDate, formatTime, getDurationText, formatPrice, normalizeDaysOfWeek } from '../../utils/helpers';
import { useLessonStore } from '../../store/useLessonStore';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuthStore } from '../../store/useAuthStore';
import { FirestoreService } from '../../services/firebase/firestore';
import { getLessonImageSource, getAvatarSource } from '../../utils/imageHelper';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { Booking } from '../../types';

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
  const { createBooking, pendingRegistrationLessonId, setPendingRegistrationLessonId } = useBookingStore();
  const { user, isAuthenticated, setUser } = useAuthStore();

  const [lesson, setLesson] = useState<any>(lessons.find(l => l.id === lessonId) || null);
  const [loadingLesson, setLoadingLesson] = useState(!lesson);

  useEffect(() => {
    const fetchLessonData = async () => {
      // First try to find in store
      const storeLesson = lessons.find(l => l.id === lessonId);
      if (storeLesson) {
        setLesson(storeLesson);
        setLoadingLesson(false);
        return;
      }

      // If not in store, fetch from Firestore
      if (lessonId) {
        try {
          setLoadingLesson(true);
          const fetchedLesson = await FirestoreService.getLessonById(lessonId);
          if (fetchedLesson) {
            setLesson(fetchedLesson);
          }
        } catch (error) {
          console.error("Error fetching lesson:", error);
        } finally {
          setLoadingLesson(false);
        }
      }
    };

    fetchLessonData();
  }, [lessonId, lessons]);

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




  const isFavorite = lesson ? favoriteLessons.includes(lesson.id) : false;
  const [isRegistered, setIsRegistered] = useState(false);

  const [booking, setBooking] = useState<Booking | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      const refreshData = async () => {
        // 1. Refresh Lesson Data (to update participant counts)
        if (lessonId) {
          try {
            const fetchedLesson = await FirestoreService.getLessonById(lessonId);
            if (isMounted && fetchedLesson) {
              setLesson(fetchedLesson);
            }
          } catch (error) {
            console.error("Error refreshing lesson:", error);
          }
        }

        // 2. Check Booking Status
        if (user) {
          try {
            let foundBooking: Booking | null = null;
            if (bookingId) {
              foundBooking = await FirestoreService.getBookingById(bookingId);
            } else if (lessonId) {
              foundBooking = await FirestoreService.getUserBookingForLesson(user.id, lessonId);
            }

            if (isMounted) {
              if (foundBooking && foundBooking.status !== 'cancelled') {
                setBooking(foundBooking);
                setIsRegistered(true);
              } else {
                setBooking(null);
                setIsRegistered(false);
              }
            }
          } catch (error) {
            console.error("Error checking booking:", error);
          }
        }
      };

      refreshData();

      return () => {
        isMounted = false;
      };
    }, [user, bookingId, lessonId])
  );


  // Instructor için ders sahibi kontrolü
  const isOwnLesson = isInstructor && lesson?.instructorId === user?.id;

  // Registered Students
  const [enrolledStudents, setEnrolledStudents] = useState<Booking[]>([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Gender Selection Modal State
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  // Fetch enrolled students if instructor viewing own lesson
  // Sync participant stats and fetch enrolled students (if instructor)
  useEffect(() => {
    let isMounted = true;
    if (lesson?.id) {
      const fetchStudentsAndSync = async () => {
        if (isOwnLesson) setLoadingStudents(true);
        try {
          const bookings = await FirestoreService.getBookingsByLesson(lesson.id);

          if (!isMounted) return;

          // If instructor, show the student list
          if (isOwnLesson) {
            setEnrolledStudents(bookings);
            setLoadingStudents(false);
          }

          // AUTO-SYNC: Check if stats need update (Self-Healing logic)
          // Calculate real stats from active bookings
          const activeBookings = bookings.filter(b => b.status !== 'cancelled');
          const realTotal = activeBookings.length;
          const currentTotal = lesson.participantStats?.total || 0;

          // Check consistency
          if (currentTotal !== realTotal || !lesson.participantStats) {
            console.log('Syncing participant stats for lesson:', lesson.id);
            let male = 0, female = 0, other = 0;

            activeBookings.forEach(b => {
              const g = b.studentGender || 'other';
              if (g === 'male') male++;
              else if (g === 'female') female++;
              else other++;
            });

            const newStats = { male, female, other, total: realTotal };

            // Update local lesson state to reflect changes immediately
            setLesson((prev: any) => ({
              ...prev,
              currentParticipants: realTotal,
              participantStats: newStats
            }));

            // Background update to Firestore
            FirestoreService.updateLesson(lesson.id, {
              participantStats: newStats,
              currentParticipants: realTotal,
              updatedAt: new Date().toISOString()
            }).catch(err => console.error('Stats sync error:', err));
          }
        } catch (error) {
          console.error('Error in stats sync:', error);
          if (isOwnLesson) setLoadingStudents(false);
        }
      };

      fetchStudentsAndSync();
    }

    return () => { isMounted = false; };
  }, [lessonId, isOwnLesson]); // Removed lesson from dependency to avoid loop if we update lesson inside

  // Check if user logged in after clicking register button
  useFocusEffect(
    React.useCallback(() => {
      if (pendingRegistrationLessonId) {
        console.log('[LessonDetail] useFocusEffect Pending Check', {
          pendingRegistrationLessonId,
          currentLessonId: lesson.id,
          isAuthenticated,
          hasUser: !!user,
          gender: user?.gender
        });
      }
      if (pendingRegistrationLessonId === lesson.id && isAuthenticated && user && lesson) {
        // Check Gender before proceeding
        if (!user.gender || user.gender === 'other') {
          setShowGenderModal(true);
          setPendingRegistrationLessonId(null);
          return;
        }

        // User logged in and has gender info, proceed to direct registration
        setPendingRegistrationLessonId(null);

        (async () => {
          try {
            const date = lesson.date || new Date().toISOString().split('T')[0];
            const time = lesson.time || '18:00';
            const price = lesson.price || 0;

            const result = await createBooking(lesson.id, date, time, price);

            if (result) {
              setBooking(result);
              setIsRegistered(true);

              // Update local lesson stats immediately
              const gender = user.gender || 'other';
              setLesson((prevLesson: any) => ({
                ...prevLesson,
                currentParticipants: (prevLesson.currentParticipants || 0) + 1,
                participantStats: {
                  ...prevLesson.participantStats,
                  total: (prevLesson.participantStats?.total || 0) + 1,
                  [gender]: (prevLesson.participantStats?.[gender] || 0) + 1
                }
              }));

              Alert.alert(
                t('common.success'),
                t('lessons.registrationSuccess') || 'Registration successful!',
                [{ text: 'OK' }]
              );
            }
          } catch (error) {
            console.error('Registration failed:', error);
            Alert.alert(t('common.error'), t('lessons.registrationFailed') || 'Registration failed. Please try again.');
          }
        })();
      }
    }, [isAuthenticated, user, pendingRegistrationLessonId, lesson, navigation, setPendingRegistrationLessonId])
  );

  if (loadingLesson) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

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

  const handleDirectRegistration = async () => {
    if (!lesson || !user) return;

    try {
      const date = lesson.date || new Date().toISOString().split('T')[0];
      const time = lesson.time || '18:00';
      const price = lesson.price || 0;

      const result = await createBooking(lesson.id, date, time, price);

      if (result) {
        setBooking(result);
        setIsRegistered(true);

        // Update local lesson stats immediately
        const gender = user.gender || 'other';
        setLesson((prevLesson: any) => ({
          ...prevLesson,
          currentParticipants: (prevLesson.currentParticipants || 0) + 1,
          participantStats: {
            ...prevLesson.participantStats,
            total: (prevLesson.participantStats?.total || 0) + 1,
            [gender]: (prevLesson.participantStats?.[gender] || 0) + 1
          }
        }));

        Alert.alert(
          t('common.success'),
          t('lessons.registrationSuccess') || 'Registration successful!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Registration failed:', error);
      Alert.alert(t('common.error'), t('lessons.registrationFailed') || 'Registration failed. Please try again.');
    }
  };

  const confirmGenderUpdate = async () => {
    if (!selectedGender || !user) return;

    try {
      // Update in Firestore
      await FirestoreService.updateUser(user.id, { gender: selectedGender });

      // Update local state immediately
      const updatedUser = { ...user, gender: selectedGender };
      setUser(updatedUser);

      // Close modal and proceed
      setShowGenderModal(false);
      handleDirectRegistration();
    } catch (error) {
      console.error('Failed to update gender:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleUnsubscribe = () => {
    if (!booking) return;

    Alert.alert(
      t('lessons.cancelRegistrationTitle') || 'Cancel Registration',
      t('lessons.cancelRegistrationConfirm') || 'Are you sure you want to cancel your registration for this lesson?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Update status to cancelled in Firestore
              await FirestoreService.updateBookingStatus(booking.id, 'cancelled');

              // Calculate new stats
              const gender = user?.gender || 'other';
              const currentTotal = lesson.participantStats?.total || 0;
              const currentGenderCount = lesson.participantStats?.[gender] || 0;
              const currentParticipants = lesson.currentParticipants || 0;

              const newTotal = Math.max(currentTotal - 1, 0);
              const newGenderCount = Math.max(currentGenderCount - 1, 0);
              const newCurrentParticipants = Math.max(currentParticipants - 1, 0);

              const newStats = {
                ...lesson.participantStats,
                total: newTotal,
                [gender]: newGenderCount
              };

              // Update stats in Firestore
              await FirestoreService.updateLesson(lesson.id, {
                participantStats: newStats,
                currentParticipants: newCurrentParticipants,
                updatedAt: new Date().toISOString()
              });

              // Update local state
              setBooking(null);
              setIsRegistered(false);

              setLesson((prevLesson: any) => ({
                ...prevLesson,
                currentParticipants: newCurrentParticipants,
                participantStats: newStats
              }));

              Alert.alert(t('common.success'), t('lessons.cancelSuccess') || 'Registration cancelled successfully.');
            } catch (error) {
              console.error('Cancellation failed:', error);
              Alert.alert(t('common.error'), t('lessons.cancelFailed') || 'Failed to cancel registration.');
            }
          }
        }
      ]
    );
  };

  const handleRegister = () => {
    console.log('[LessonDetail] handleRegister called', {
      isAuthenticated,
      userId: user?.id,
      gender: user?.gender
    });

    if (booking || isRegistered) {
      handleUnsubscribe();
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      setPendingRegistrationLessonId(lesson.id);
      (navigation as any).navigate('Login');
      return;
    }

    // Check Gender
    console.log('[LessonDetail] Checking gender:', user?.gender);
    if (!user.gender || user.gender === 'other') {
      console.log('[LessonDetail] Gender missing or other, showing modal');
      setShowGenderModal(true);
      return;
    }
    console.log('[LessonDetail] Proceeding to payment');

    handleDirectRegistration();
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

          {/* Participant Stats */}
          {(lesson.participantStats) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.participants') || 'Participants'}</Text>
              <TouchableOpacity
                style={[styles.participantsCard, { backgroundColor: palette.card }]}
                activeOpacity={isOwnLesson ? 0.7 : 1}
                onPress={() => isOwnLesson && setShowStudentsModal(true)}
              >
                <View style={styles.participantStat}>
                  <MaterialIcons name="group" size={24} color={colors.student.primary} />
                  <Text style={[styles.statValue, { color: palette.text.primary }]}>{lesson.participantStats.total}</Text>
                  <Text style={[styles.statLabel, { color: palette.text.secondary }]}>{t('lessons.total') || 'Total'}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: palette.border }]} />
                <View style={styles.participantStat}>
                  <MaterialIcons name="female" size={24} color="#E91E63" />
                  <Text style={[styles.statValue, { color: palette.text.primary }]}>{lesson.participantStats.female}</Text>
                  <Text style={[styles.statLabel, { color: palette.text.secondary }]}>{t('lessons.female') || 'Female'}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: palette.border }]} />
                <View style={styles.participantStat}>
                  <MaterialIcons name="male" size={24} color="#2196F3" />
                  <Text style={[styles.statValue, { color: palette.text.primary }]}>{lesson.participantStats.male}</Text>
                  <Text style={[styles.statLabel, { color: palette.text.secondary }]}>{t('lessons.male') || 'Male'}</Text>
                </View>

                {/* Visual indicator for instructor */}
                {isOwnLesson && (
                  <View style={{ position: 'absolute', right: 8, top: 8 }}>
                    <MaterialIcons name="list" size={16} color={palette.text.secondary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

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

          {/* Instructor Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('lessons.instructor')}</Text>
            <TouchableOpacity
              style={[styles.instructorCard, { backgroundColor: palette.card }]}
              onPress={() => {
                // Navigate to instructor profile if needed
                // (navigation as any).navigate('InstructorProfile', { instructorId: instructor?.id });
              }}
              activeOpacity={0.9}
            >
              <Image
                source={getAvatarSource(instructor?.photoURL, instructor?.displayName)}
                style={styles.instructorAvatar}
              />
              <View style={styles.instructorInfo}>
                <Text style={[styles.instructorName, { color: palette.text.primary }]}>
                  {instructor?.displayName || lesson.instructorName || t('studentHome.unknown')}
                </Text>
                <Text style={[styles.instructorRole, { color: palette.text.secondary }]}>
                  {t('profile.instructor')}
                </Text>
              </View>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={20} color="#FFB800" />
                <Text style={[styles.ratingText, { color: palette.text.primary }]}>
                  {instructor?.rating ? instructor.rating.toFixed(1) : '5.0'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom spacing for fixed bar */}
          <View style={{ height: 80 + insets.bottom }} />
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      {isOwnLesson ? (
        <SafeAreaView edges={['bottom']} style={[styles.bottomBarContainer, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
          <View style={styles.bottomBar}>
            <View style={{ flex: 1, marginRight: spacing.sm, justifyContent: 'center' }}>
              <Text style={[styles.priceValue, { color: colors.instructor.primary, fontSize: 20 }]}>
                {formatPrice(lesson.price)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, { flex: 1.2 }]}
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

          {/* Students List Modal */}
          <Modal
            visible={showStudentsModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowStudentsModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: palette.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                  <Text style={[styles.modalTitle, { color: palette.text.primary }]}>
                    {t('lessons.enrolledStudentsList') || 'Enrolled Students'} ({enrolledStudents.length})
                  </Text>
                  <TouchableOpacity onPress={() => setShowStudentsModal(false)} style={styles.closeButton}>
                    <MaterialIcons name="close" size={24} color={palette.text.primary} />
                  </TouchableOpacity>
                </View>

                {loadingStudents ? (
                  <ActivityIndicator size="large" color={colors.instructor.primary} style={{ marginTop: 20 }} />
                ) : enrolledStudents.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: palette.text.secondary }]}>
                      {t('lessons.noStudentsEnrolled') || 'No students enrolled yet.'}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={enrolledStudents}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <View style={[styles.studentItem, { borderBottomColor: palette.border }]}>
                        <Image
                          source={getAvatarSource(null, item.studentName)}
                          style={styles.studentAvatar}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.studentName, { color: palette.text.primary }]}>
                            {item.studentName || t('studentHome.unknown')}
                          </Text>
                          <Text style={[styles.studentDate, { color: palette.text.secondary }]}>
                            {formatDate(item.createdAt)}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: item.status === 'confirmed' ? '#E8F5E9' : '#FFF3E0' }]}>
                          <Text style={[styles.statusText, { color: item.status === 'confirmed' ? '#2E7D32' : '#EF6C00' }]}>
                            {item.status}
                          </Text>
                        </View>
                      </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  />
                )}
              </View>
            </View>
          </Modal>

          {/* Gender Selection Modal */}
          <Modal
            visible={showGenderModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowGenderModal(false)}
          >
            <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 20 }]}>
              <View style={[styles.modalContent, { backgroundColor: palette.background, maxHeight: 'auto', borderRadius: 16, padding: 24, width: '100%' }]}>
                <Text style={[styles.modalTitle, { color: palette.text.primary, textAlign: 'center', marginBottom: 12 }]}>
                  {t('lessons.genderSelectionTitle')}
                </Text>

                <Text style={{ color: palette.text.secondary, textAlign: 'center', marginBottom: 24, fontSize: 14, lineHeight: 20 }}>
                  {t('lessons.genderSelectionReason')}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                  <TouchableOpacity
                    onPress={() => setSelectedGender('female')}
                    style={{
                      flex: 1,
                      marginRight: 8,
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: selectedGender === 'female' ? '#E91E63' : palette.border,
                      backgroundColor: selectedGender === 'female' ? '#FCE4EC' : palette.card,
                      alignItems: 'center'
                    }}
                  >
                    <MaterialIcons name="female" size={32} color="#E91E63" />
                    <Text style={{ marginTop: 8, fontWeight: '600', color: palette.text.primary }}>{t('lessons.female')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedGender('male')}
                    style={{
                      flex: 1,
                      marginLeft: 8,
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: selectedGender === 'male' ? '#2196F3' : palette.border,
                      backgroundColor: selectedGender === 'male' ? '#E3F2FD' : palette.card,
                      alignItems: 'center'
                    }}
                  >
                    <MaterialIcons name="male" size={32} color="#2196F3" />
                    <Text style={{ marginTop: 8, fontWeight: '600', color: palette.text.primary }}>{t('lessons.male')}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={confirmGenderUpdate}
                  disabled={!selectedGender}
                  style={{
                    backgroundColor: selectedGender ? palette.primary : '#E0E0E0',
                    padding: 16,
                    borderRadius: 12,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                    {t('lessons.saveAndRegister')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

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
            >
              <LinearGradient
                colors={booking || isRegistered ? ['#FF5252', '#FF5252'] : [palette.primary, palette.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerButtonGradient}
              >
                <Text style={styles.registerButtonText}>
                  {booking || isRegistered ? (t('lessons.cancelRegistration') || 'Cancel Registration') : t('lessons.register')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )
      }
      <Modal
        visible={showGenderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'center', padding: 20 }]}>
          <View style={[styles.modalContent, { backgroundColor: palette.background, maxHeight: 'auto', borderRadius: 16, padding: 24, width: '100%' }]}>
            <Text style={[styles.modalTitle, { color: palette.text.primary, textAlign: 'center', marginBottom: 12 }]}>
              {t('lessons.genderSelectionTitle')}
            </Text>

            <Text style={{ color: palette.text.secondary, textAlign: 'center', marginBottom: 24, fontSize: 14, lineHeight: 20 }}>
              {t('lessons.genderSelectionReason')}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
              <TouchableOpacity
                onPress={() => setSelectedGender('female')}
                style={{
                  flex: 1,
                  marginRight: 8,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selectedGender === 'female' ? '#E91E63' : palette.border,
                  backgroundColor: selectedGender === 'female' ? '#FCE4EC' : palette.card,
                  alignItems: 'center'
                }}
              >
                <MaterialIcons name="female" size={32} color="#E91E63" />
                <Text style={{ marginTop: 8, fontWeight: '600', color: palette.text.primary }}>{t('lessons.female')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedGender('male')}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selectedGender === 'male' ? '#2196F3' : palette.border,
                  backgroundColor: selectedGender === 'male' ? '#E3F2FD' : palette.card,
                  alignItems: 'center'
                }}
              >
                <MaterialIcons name="male" size={32} color="#2196F3" />
                <Text style={{ marginTop: 8, fontWeight: '600', color: palette.text.primary }}>{t('lessons.male')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={confirmGenderUpdate}
              disabled={!selectedGender}
              style={{
                backgroundColor: selectedGender ? palette.primary : '#E0E0E0',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                {t('lessons.saveAndRegister')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView >
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
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  instructorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  instructorRole: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.lg,
    gap: 4,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    height: '70%',
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  studentName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  studentDate: {
    fontSize: typography.fontSize.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
  },
  participantsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.xs,
  },
  participantStat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: spacing.sm,
  },
});

