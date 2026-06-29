import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { openWhatsApp } from '../../utils/whatsapp';
import { chatService } from '../../services/firebase/chat';
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
import { VerificationGateModal } from '../../components/common/VerificationGateModal';

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
  const [verificationMethod, setVerificationMethod] = React.useState<'school' | 'document' | null>(null);
  const [gateVisible, setGateVisible] = React.useState(false);
  const [pendingSchoolName, setPendingSchoolName] = React.useState<string | null>(null);
  const [schoolMessageSending, setSchoolMessageSending] = React.useState(false);
  const [requestSchoolId, setRequestSchoolId] = React.useState<string | null>(null);

  const handleSchoolChat = async () => {
    const activeSchoolId = user?.schoolId || requestSchoolId;
    if (!activeSchoolId || !user?.id) return;
    setSchoolMessageSending(true);
    try {
      // 1. Okulun asıl User ID'sini al (schools koleksiyonundaki userId veya ownerId alanı)
      const schoolOwnerUserId = await FirestoreService.getSchoolOwnerUserId(activeSchoolId);

      // 2. Daha önce hiç mesaj gönderilmediyse otomatik bir açılış mesajı gönder
      const autoMsg = t('instructor.schoolChatAutoMessage') || `Merhaba, eğitmenlik doğrulama talebimi gönderdim. Onay sürecini hızlandırmanıza yardımcı olabilir misiniz?`;
      await chatService.sendMessage(user.id, schoolOwnerUserId, autoMsg);
      
      // 3. Chat ekranına asıl User ID ile yönlendir
      (navigation as any).navigate('ChatDetail', { userId: schoolOwnerUserId });
    } catch (_) {
      // Hata durumunda fallback olarak mevcut activeSchoolId ile yönlendir
      (navigation as any).navigate('ChatDetail', { userId: activeSchoolId });
    } finally {
      setSchoolMessageSending(false);
    }
  };

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
          const result = await FirestoreService.getInstructorRequestStatus(user.id);
          setHasSubmittedRequest(!!result);
          setVerificationMethod(result?.verificationMethod ?? null);
          setRequestSchoolId(result?.schoolId ?? null);

          // Okul adını getir (user.schoolId veya request'teki schoolId)
          const activeSchoolId = user.schoolId || result?.schoolId;
          if (activeSchoolId) {
            try {
              const school = await FirestoreService.getUserById(activeSchoolId);
              setPendingSchoolName((school as any)?.schoolName || (school as any)?.name || null);
            } catch (_) {
              setPendingSchoolName(null);
            }
          }
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
      headerTitle: '',
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
              (navigation as any).navigate('CreateLesson');
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
                name="notifications-none"
                size={24}
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
      {/* Verification Gate Modal */}
      <VerificationGateModal
        visible={gateVisible}
        onClose={() => setGateVisible(false)}
        alreadyRequestedMethod={verificationMethod}
        onSchoolApproval={() => {
          setGateVisible(false);
          if (verificationMethod === 'school') {
            Alert.alert(
              t('schoolSelection.alreadyAppliedTitle') || 'Başvuru Zaten Gönderildi',
              t('schoolSelection.alreadyAppliedDesc', { school: pendingSchoolName || '' }),
              [{ text: t('common.ok') }]
            );
          } else {
            // @ts-ignore
            navigation.navigate('SchoolSelection');
          }
        }}
        onDocumentApproval={() => {
          setGateVisible(false);
          if (verificationMethod === 'document') {
            Alert.alert(
              t('schoolSelection.alreadyAppliedTitle') || 'Başvuru Zaten Gönderildi',
              t('instructor.alreadyAppliedDocDesc') || 'Belge doğrulama talebiniz zaten alındı. Belgelerinizi güncellemek istiyor musunuz?',
              [
                { text: t('common.no'), style: 'cancel' },
                {
                  text: t('common.yes'),
                  onPress: () => {
                    // @ts-ignore
                    navigation.navigate('Verification');
                  }
                }
              ]
            );
          } else {
            // @ts-ignore
            navigation.navigate('Verification');
          }
        }}
      />

      <ScrollView style={[styles.scrollView, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
        {/* Verification Banner — tüm draft-instructor'lar için tek standart banner */}
        {user?.role === 'draft-instructor' && (() => {
          const isProfileComplete = !!(user?.name && user?.phoneNumber);
          // verificationMethod: Firestore request state || user document alanı
          const activeVerificationMethod = verificationMethod || (user as any)?.verificationMethod;
          // hasSubmittedRequest: local state || user document pending kontrolü
          const isRequestActive = hasSubmittedRequest || user?.verificationStatus === 'pending';
          const waEnabled = isRequestActive && activeVerificationMethod === 'document';
          const activeSchoolId = user?.schoolId || requestSchoolId;
          const schoolChatEnabled = isRequestActive && activeVerificationMethod === 'school' && !!activeSchoolId;

          const handleVerifyButton = () => {
            if (!isProfileComplete) {
              Alert.alert(
                t('instructor.onboardingRequiredTitle') || 'Profil Tamamlanmadı',
                t('instructor.onboardingRequiredDesc') || 'Doğrulama işlemine geçmeden önce profilinizi tamamlayın.',
                [{ text: t('common.ok') }]
              );
              return;
            }
            setGateVisible(true);
          };

          const handleWhatsApp = async () => {
            const waMessage = `${t('instructor.verificationWhatsappMessage') || 'Merhaba, eğitmen başvurumu hızlandırmak istiyorum.'} (ID: ${user?.id})`;
            await openWhatsApp('+90 0555 005 98 76', waMessage);
          };



          return (
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
                {t('instructor.verificationStepDesc') || 'Eğitmen olarak kurs vermeye başlamanız için sadece birkaç küçük adım kaldı.'}
              </Text>

              <View style={styles.bannerActions}>

                {/* ── Adım 1: Profil Tamamla ── */}
                <TouchableOpacity
                  style={[
                    styles.bannerStepButton,
                    { backgroundColor: isProfileComplete ? '#10B981' : colors.instructor.primary },
                  ]}
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('EditProfile', { highlightErrors: true });
                  }}
                  activeOpacity={0.82}
                >
                  <View style={styles.bannerStepRow}>
                    <View style={[
                      styles.bannerStepIconWrap,
                      { backgroundColor: isProfileComplete ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)' },
                    ]}>
                      <MaterialIcons
                        name={isProfileComplete ? 'check-circle' : 'person-outline'}
                        size={18}
                        color="#ffffff"
                      />
                    </View>
                    <Text style={styles.bannerStepLabel}>
                      {isProfileComplete
                        ? (t('instructor.onboardingCompleted') || 'Profil Tamamlandı')
                        : (t('instructor.completeProfileButton') || 'Eğitmen Profilinizi Tamamlayın')}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* ── Adım 2: Doğrulama Talebi (buton + değiştir linki tek kart) ── */}
                <View style={[
                  styles.bannerStepCard,
                  {
                    backgroundColor: !isProfileComplete
                      ? '#E5E7EB'
                      : hasSubmittedRequest
                        ? '#10B981'
                        : colors.instructor.secondary,
                    // Alt köşeleri: link varsa düz, yoksa yuvarlatılmış
                    borderBottomLeftRadius: hasSubmittedRequest ? 0 : borderRadius.lg,
                    borderBottomRightRadius: hasSubmittedRequest ? 0 : borderRadius.lg,
                  },
                ]}>
                  <TouchableOpacity
                    onPress={handleVerifyButton}
                    activeOpacity={isProfileComplete ? 0.82 : 1}
                    style={styles.bannerStepRow}
                  >
                    <View style={[
                      styles.bannerStepIconWrap,
                      { backgroundColor: !isProfileComplete ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.2)' },
                    ]}>
                      <MaterialIcons
                        name={hasSubmittedRequest ? 'check-circle' : 'verified-user'}
                        size={18}
                        color={!isProfileComplete ? '#9CA3AF' : '#ffffff'}
                      />
                    </View>
                    <Text style={[styles.bannerStepLabel, { color: !isProfileComplete ? '#9CA3AF' : '#ffffff' }]}>
                      {hasSubmittedRequest
                        ? (t('instructor.verificationRequestSent') || 'Doğrulama Talebi Gönderildi')
                        : (t('instructor.verifyNow') || 'Kimlik & Sertifika Yükle')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* "Alt şerit" — adım 2 kartına bağlı alt aksiyon satırı */}
                {isRequestActive && (
                  <View style={[styles.changeMethodStrip, { backgroundColor: '#0D9488', flexDirection: 'row', gap: 12 }]}>
                    {/* Okul doğrulaması seçildiyse → Okul değiştir linki */}
                    {activeVerificationMethod === 'school' && (
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        onPress={() => (navigation as any).navigate('SchoolSelection')}
                        activeOpacity={0.75}
                      >
                        <MaterialIcons name="school" size={12} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.changeMethodStripText}>
                          {t('instructor.changeSchool') || 'Okul değiştir'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {/* Ayraç */}
                    {activeVerificationMethod === 'school' && (
                      <Text style={[styles.changeMethodStripText, { opacity: 0.4 }]}>|</Text>
                    )}
                    {/* Her zaman: Yöntemi değiştir */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      onPress={() => setGateVisible(true)}
                      activeOpacity={0.75}
                    >
                      <MaterialIcons name="swap-horiz" size={12} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.changeMethodStripText}>
                        {t('instructor.changeMethod') || 'Yöntemi değiştir'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── Adım 3: WhatsApp veya Okul Chat ── */}
                {!schoolChatEnabled ? (
                  <TouchableOpacity
                    style={[
                      styles.bannerStepButton,
                      {
                        backgroundColor: waEnabled ? '#25D366' : '#E5E7EB',
                        opacity: waEnabled ? 1 : 0.75,
                      },
                    ]}
                    onPress={waEnabled ? handleWhatsApp : undefined}
                    activeOpacity={waEnabled ? 0.82 : 1}
                    disabled={!waEnabled}
                  >
                    <View style={styles.bannerStepRow}>
                      <View style={[
                        styles.bannerStepIconWrap,
                        { backgroundColor: waEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)' },
                      ]}>
                        <FontAwesome
                          name="whatsapp"
                          size={18}
                          color={waEnabled ? '#ffffff' : '#9CA3AF'}
                        />
                      </View>
                      <Text style={[styles.bannerStepLabel, { color: waEnabled ? '#ffffff' : '#9CA3AF' }]}>
                        {t('instructor.contactSupportWhatsapp') || 'WhatsApp ile Hızlandır'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.bannerStepButton,
                      { backgroundColor: schoolMessageSending ? '#6B7280' : colors.instructor.secondary },
                    ]}
                    onPress={handleSchoolChat}
                    activeOpacity={0.82}
                    disabled={schoolMessageSending}
                  >
                    <View style={styles.bannerStepRow}>
                      <View style={[styles.bannerStepIconWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <MaterialIcons name="forum" size={18} color="#ffffff" />
                      </View>
                      <Text style={[styles.bannerStepLabel, { color: '#ffffff' }]}>
                        {schoolMessageSending
                          ? (t('common.loading') || 'Açılıyor...')
                          : (t('instructor.contactSchoolAndBoost') || 'Okul ile İletişime Geç')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* ── Eğitmenlik Başvurusundan Vazgeç ── */}
                {isRequestActive && (
                  <TouchableOpacity
                    style={[styles.changeMethodStrip, {
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: '#EF444440',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                      marginTop: 2,
                    }]}
                    activeOpacity={0.75}
                    onPress={() => {
                      Alert.alert(
                        t('instructor.cancelRequestTitle') || 'Başvuruyu İptal Et',
                        t('instructor.cancelRequestDesc') || 'Eğitmenlik başvurunuzu iptal etmek istediğinizden emin misiniz? Hesabınız öğrenci moduna geri dönecek.',
                        [
                          { text: t('common.cancel'), style: 'cancel' },
                          {
                            text: t('common.confirm') || 'Evet, İptal Et',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                await FirestoreService.cancelInstructorRequest(user!.id);
                                await refreshProfile();
                                // Öğrenci ana sayfasına dön — stack sıfırla
                                (navigation as any).reset({
                                  index: 0,
                                  routes: [{ name: 'MainTabs' }],
                                });
                              } catch {
                                Alert.alert(t('common.error'), t('common.errorDesc'));
                              }
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <MaterialIcons name="close" size={12} color="#EF4444" />
                    <Text style={[styles.changeMethodStripText, { color: '#EF4444' }]}>
                      {t('instructor.cancelRequest') || 'Eğitmenlik başvurumu iptal et'}
                    </Text>
                  </TouchableOpacity>
                )}

              </View>
            </View>
          );
        })()}


        {/* Earnings Card */}
        <View style={[styles.section, styles.earningsSection]}>
          <TouchableOpacity
            style={[styles.earningsCard, { backgroundColor: palette.card, paddingVertical: spacing.md }]}
            activeOpacity={0.8}
            onPress={() => (navigation as any).navigate('EarningsDetails')}
          >
            <View style={styles.earningsContent}>
              <View style={styles.earningsHeader}>
                <View style={styles.earningsHeaderLeft}>
                  <Text style={[styles.earningsLabel, { color: palette.text.primary }]}>{t('instructorHome.earningsSummary')}</Text>
                  <Text style={[styles.earningsTitle, { color: palette.text.primary }]}>{t('instructorHome.thisMonthEarnings')}</Text>
                </View>
                <View
                  style={[styles.earningsIconContainer, { backgroundColor: colors.instructor.secondary + '15' }]}
                >
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
                <View style={styles.detailsButton}>
                  <Text style={styles.detailsButtonText}>{t('instructorHome.viewDetails')}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('Lessons', { initialTab: 'active' })}
          >
            <Card style={[styles.statCard, { backgroundColor: palette.card, minWidth: 0 }]}>
              <Text style={[styles.statLabel, { color: palette.text.primary }]}>{t('instructorHome.activeLessons')}</Text>
              <Text style={[styles.statValue, { color: isDarkMode ? '#E0E0E0' : colors.instructor.primary }]}>{stats.activeLessons}</Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('InstructorStudents')}
          >
            <Card style={[styles.statCard, { backgroundColor: palette.card, borderColor: colors.instructor.primary + '30', borderWidth: 1, minWidth: 0 }]}>
              <Text style={[styles.statLabel, { color: palette.text.primary }]}>{t('instructorHome.totalStudents')}</Text>
              <Text style={[styles.statValue, { color: isDarkMode ? '#E0E0E0' : colors.instructor.primary }]}>{stats.totalStudents}</Text>
            </Card>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Card style={[styles.statCard, { backgroundColor: palette.card, minWidth: 0 }]}>
              <Text style={[styles.statLabel, { color: palette.text.primary }]}>{t('instructorHome.rating')}</Text>
              <Text style={[styles.statValue, { color: isDarkMode ? '#E0E0E0' : colors.instructor.primary }]}>{stats.avgRating}</Text>
            </Card>
          </View>
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
                const maxParticipants = lesson.maxParticipants || 12;

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
                        {t('instructorHome.studentsCount', { count: enrolledCount, max: maxParticipants })}
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
        <View style={{ height: 80 }} />
      </ScrollView >

      {/* FAB for Creating Lesson */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: palette.secondary, shadowColor: palette.secondary }]}
        onPress={() => {
          (navigation as any).navigate('CreateLesson');
        }}
      >
        <View style={styles.fabGradient}>
          <MaterialIcons name="add" size={24} color="#ffffff" />
          <Text style={styles.fabText}>{t('instructorHome.addLesson') || 'Kurs Ekle'}</Text>
        </View>
      </TouchableOpacity>
    </View >
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
  // ── Banner Step Buttons ────────────────────────────────
  bannerStepButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  bannerStepCard: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  bannerStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: spacing.md,
  },
  bannerStepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerStepLabel: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
    letterSpacing: 0.1,
  },
  // ── "Yöntemi Değiştir" alt şerit ──────────────────────
  changeMethodStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    marginTop: 0,
  },
  changeMethodStripText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.2,
  },
  // ── Legacy (kullanılmayan eski stiller - temizlendi) ───
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
    color: '#ffffff',
  },
  whatsappBannerButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  changeMethodBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginLeft: spacing.xs,
  },
  changeMethodText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  changeMethodLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: -spacing.xs,
    paddingVertical: spacing.xs,
  },
  changeMethodLinkText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textDecorationLine: 'underline',
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
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    padding: spacing.sm,
    gap: 4,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    height: 36, // İki satıra izin verir ama kartı bozmaz
  },
  statValue: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginTop: 2,
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
    right: 20,
    zIndex: 20,
    bottom: 20,
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
  pendingBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pendingBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  pendingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBannerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  pendingBannerDesc: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginLeft: 34 + spacing.sm,
  },
  changeSchoolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginLeft: 34 + spacing.sm,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#F59E0B15',
    borderRadius: borderRadius.full,
  },
  changeSchoolText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#F59E0B',
  },
});
