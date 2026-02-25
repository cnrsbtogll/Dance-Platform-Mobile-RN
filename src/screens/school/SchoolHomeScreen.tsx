import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
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
import { Lesson } from '../../types';

export const SchoolHomeScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { user, refreshProfile } = useAuthStore();
    const { unreadCount, loadNotifications } = useNotificationStore();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette('school', isDarkMode);
    const insets = useSafeAreaInsets();
    const { getUserBookings, fetchUserBookings } = useBookingStore();
    const schoolBookings = getUserBookings(); // For schools, we'll assume it fetches school's bookings

    const [schoolLessons, setSchoolLessons] = React.useState<Lesson[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [hasSubmittedRequest, setHasSubmittedRequest] = React.useState(false);

    // Fetch school's lessons from Firestore
    useFocusEffect(
        React.useCallback(() => {
            const fetchLessons = async () => {
                if (!user || (user.role !== 'school' && user.role !== 'draft-school')) {
                    setSchoolLessons([]);
                    setLoading(false);
                    return;
                }

                try {
                    setLoading(true);
                    // Fetch lessons directly associated with this school via schoolId
                    const lessons = await FirestoreService.getLessonsBySchool(user.id);
                    setSchoolLessons(lessons);
                } catch (error) {
                    console.error('Error fetching school lessons:', error);
                    setSchoolLessons([]);
                } finally {
                    setLoading(false);
                }
            };

            const checkRequestStatus = async () => {
                if (user?.id) {
                    const status = await FirestoreService.getSchoolRequestStatus(user.id);
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
        const activeBookings = schoolBookings.filter((b: any) => b.status !== 'cancelled');
        const activeLessonsCount = schoolLessons.filter(l => l.isActive).length;

        const totalStudents = new Set(activeBookings.map((b: any) => b.studentId)).size;
        const avgRating = schoolLessons.reduce((sum, l) => sum + l.rating, 0) / (schoolLessons.length || 1);

        // Calculate earnings
        const thisMonthEarnings = activeBookings
            .filter((b: any) => {
                const bookingDate = new Date(b.date);
                const now = new Date();
                return bookingDate.getMonth() === now.getMonth() &&
                    bookingDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum: number, b: any) => sum + (b.price || 0), 0);

        const totalEarnings = activeBookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0);

        return {
            activeLessons: activeLessonsCount,
            totalStudents,
            avgRating: avgRating.toFixed(1),
            thisMonthEarnings,
            totalEarnings,
        };
    }, [schoolLessons, schoolBookings]);

    // Get active lessons
    const activeLessons = useMemo(() => {
        return schoolLessons.filter(l => l.isActive);
    }, [schoolLessons]);

    // Upcoming lessons for school
    const upcomingBookings = useMemo(() => {
        const now = new Date();
        const oneWeekFromNow = new Date(now);
        oneWeekFromNow.setDate(now.getDate() + 7);

        const explicitBookings = schoolBookings
            .filter(b => {
                const bookingDate = new Date(`${b.date}T${b.time}`);
                return bookingDate > now && bookingDate <= oneWeekFromNow && b.status !== 'cancelled';
            })
            .map(b => ({
                ...b,
                dateTime: new Date(`${b.date}T${b.time}`),
                isRecurring: false,
            }));

        const recurringLessons = activeLessons
            .filter(lesson => lesson.daysOfWeek && lesson.daysOfWeek.length > 0 && lesson.time)
            .flatMap(lesson => {
                const { getNextLessonOccurrence } = require('../../utils/helpers');
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

        return [...explicitBookings, ...recurringLessons]
            .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    }, [schoolBookings, activeLessons]);

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
                    backgroundColor: colors.school.primary,
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
                        {t('school.badge') || 'OKUL'}
                    </Text>
                </View>
            ),
        });
    }, [navigation, unreadCount, isDarkMode, palette, t]);

    return (
        <View style={[styles.container, { backgroundColor: palette.background }]}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Verification Banner */}
                {user?.role === 'draft-school' && (
                    <View style={[styles.verificationBanner, { backgroundColor: isDarkMode ? palette.card : '#FDF4FF', borderColor: colors.school.primary }]}>
                        <View style={styles.verificationBannerHeader}>
                            <View style={[styles.infoIconContainer, { backgroundColor: colors.school.primary + '20' }]}>
                                <MaterialIcons name="rocket-launch" size={20} color={colors.school.primary} />
                            </View>
                            <Text style={[styles.verificationBannerTitle, { color: palette.text.primary }]}>
                                {!user?.onboardingCompleted
                                    ? (t('school.completeProfileTitle') || 'Profilinizi Tamamlayın')
                                    : user?.verificationStatus === 'pending'
                                        ? t('school.verificationPendingTitle')
                                        : t('school.verificationRequired')}
                            </Text>
                        </View>

                        <Text style={[styles.verificationBannerText, { color: palette.text.secondary }]}>
                            {!user?.onboardingCompleted
                                ? (t('school.completeProfileDesc') || 'Panelin tüm özelliklerini kullanabilmek için lütfen okul bilgilerinizi eksiksiz doldurun.')
                                : user?.verificationStatus === 'pending'
                                    ? t('school.verificationPendingDesc')
                                    : t('school.verificationStepDesc')}
                        </Text>

                        <View style={styles.bannerActions}>
                            {!user?.onboardingCompleted ? (
                                <TouchableOpacity
                                    style={[styles.onboardingButton, { backgroundColor: colors.school.primary }]}
                                    onPress={() => (navigation as any).navigate('SchoolOnboarding')}
                                >
                                    <View style={styles.buttonContent}>
                                        <MaterialIcons name="business" size={18} color="#ffffff" />
                                        <Text style={styles.verificationButtonText}>{t('school.completeProfileButton')}</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                user?.verificationStatus !== 'pending' && user?.verificationStatus !== 'verified' && (
                                    <TouchableOpacity
                                        style={[styles.onboardingButton, { backgroundColor: colors.school.primary }]}
                                        onPress={() => (navigation as any).navigate('SchoolVerification')}
                                    >
                                        <View style={styles.buttonContent}>
                                            <MaterialIcons name="verified-user" size={18} color="#ffffff" />
                                            <Text style={styles.verificationButtonText}>{t('school.uploadDocumentsButton')}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.whatsappBannerButton,
                                    { backgroundColor: user?.onboardingCompleted ? '#25D366' : '#E5E7EB' }
                                ]}
                                onPress={() => {
                                    if (!user?.onboardingCompleted) {
                                        Alert.alert(
                                            t('common.info') || 'Bilgi',
                                            t('school.completeProfileFirst') || 'Lütfen önce okul profilinizi tamamlayın.',
                                            [{ text: t('common.ok') }]
                                        );
                                    } else {
                                        const waMessage = `${t('becomeSchool.whatsappMessage') || 'Merhaba, Dance Platform uygulamasında Dans Okulu açmak istiyorum'} (Kullanıcı ID: ${user?.id})`;
                                        openWhatsApp('+90 0555 005 98 76', waMessage);
                                    }
                                }}
                                activeOpacity={user?.onboardingCompleted ? 0.7 : 1}
                            >
                                <View style={styles.buttonContent}>
                                    <FontAwesome
                                        name="whatsapp"
                                        size={18}
                                        color={(hasSubmittedRequest && user?.verificationStatus === 'pending') ? "#ffffff" : "#9CA3AF"}
                                    />
                                    <Text style={[styles.whatsappBannerButtonText, { color: (hasSubmittedRequest && user?.verificationStatus === 'pending') ? '#ffffff' : '#9CA3AF' }]}>
                                        {t('instructor.contactSupportWhatsapp')}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Earnings Card */}
                <View style={[styles.section, { marginTop: spacing.md }]}>
                    <View style={[styles.earningsCard, { backgroundColor: palette.card }]}>
                        <View style={styles.earningsContent}>
                            <View style={styles.earningsHeader}>
                                <View style={styles.earningsHeaderLeft}>
                                    <Text style={[styles.earningsLabel, { color: palette.text.primary }]}>{t('instructorHome.earningsSummary')}</Text>
                                    <Text style={[styles.earningsTitle, { color: palette.text.primary }]}>{t('instructorHome.thisMonthEarnings')}</Text>
                                </View>
                                <View style={[styles.earningsIconContainer, { backgroundColor: colors.school.primary + '15' }]}>
                                    <MaterialIcons
                                        name="account-balance-wallet"
                                        size={32}
                                        color={colors.school.primary}
                                    />
                                </View>
                            </View>
                            <View style={styles.earningsRow}>
                                <View style={styles.earningsAmountContainer}>
                                    <Text style={[styles.earningsAmount, { color: colors.school.primary }]}>{formatPrice(stats.thisMonthEarnings, user?.currency)}</Text>
                                    <Text style={[styles.earningsTotal, { color: palette.text.primary }]}>
                                        {t('instructorHome.totalEarnings')}: {formatPrice(stats.totalEarnings, user?.currency)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.detailsButton, { backgroundColor: colors.school.primary }]}
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
                        <Text style={[styles.statLabel, { color: palette.text.primary }]}>{t('school.activeLessons') || 'Aktif Kurslar'}</Text>
                        <Text style={[styles.statValue, { color: colors.school.primary }]}>{stats.activeLessons}</Text>
                    </Card>
                    <Card style={[styles.statCard, { backgroundColor: palette.card }]}>
                        <Text style={[styles.statLabel, { color: palette.text.primary }]}>{t('school.totalStudents') || 'Kayıtlı Öğrenci'}</Text>
                        <Text style={[styles.statValue, { color: colors.school.primary }]}>{stats.totalStudents}</Text>
                    </Card>
                    <Card style={[styles.statCard, { backgroundColor: palette.card }]}>
                        <Text style={[styles.statLabel, { color: palette.text.primary }]}>{t('instructorHome.rating')}</Text>
                        <Text style={[styles.statValue, { color: colors.school.primary }]}>{stats.avgRating}</Text>
                    </Card>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('school.quickActions') || 'Hızlı İşlemler'}</Text>
                    <View style={styles.quickActionsGrid}>
                        <TouchableOpacity
                            style={[styles.quickActionButton, { backgroundColor: colors.school.primary }]}
                            onPress={() => {
                                if (user && !user.onboardingCompleted) {
                                    Alert.alert(
                                        t('instructor.onboardingRequiredTitle') || 'Profil Tamamlanmadı',
                                        t('school.onboardingRequiredDesc') || 'Kurs oluşturmadan önce lütfen okul profilinizi tamamlayın.',
                                        [{ text: t('common.ok'), onPress: () => (navigation as any).navigate('SchoolOnboarding') }]
                                    );
                                } else {
                                    (navigation as any).navigate('CreateLesson');
                                }
                            }}
                        >
                            <MaterialIcons name="add-circle-outline" size={24} color="#ffffff" />
                            <Text style={styles.quickActionText}>{t('school.createLesson') || 'Kurs Oluştur'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.quickActionButton, { backgroundColor: colors.school.secondary }]}
                            onPress={() => Alert.alert('Gelecek Özellik', 'Eğitmen yönetimi yakında eklenecek.')}
                        >
                            <MaterialIcons name="people-outline" size={24} color="#ffffff" />
                            <Text style={styles.quickActionText}>{t('school.addInstructor') || 'Eğitmen Ekle'}</Text>
                        </TouchableOpacity>
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
                                const lesson = schoolLessons.find(l => l.id === booking.lessonId);
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

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
    verificationBanner: { margin: spacing.md, marginTop: spacing.sm, padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 1, ...shadows.md, elevation: 4 },
    verificationBannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
    infoIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    verificationBannerTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, flex: 1 },
    verificationBannerText: { fontSize: typography.fontSize.sm, lineHeight: 22, marginBottom: spacing.lg },
    bannerActions: { gap: spacing.sm },
    buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    onboardingButton: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', ...shadows.sm },
    whatsappBannerButton: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', ...shadows.sm },
    whatsappBannerButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
    verificationButtonText: { color: '#ffffff', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
    earningsCard: { borderRadius: borderRadius.xl, ...shadows.md, elevation: 4 },
    earningsContent: { padding: spacing.md, gap: spacing.md },
    earningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    earningsHeaderLeft: { flex: 1, gap: spacing.xs },
    earningsIconContainer: { width: 60, height: 60, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
    earningsLabel: { fontSize: typography.fontSize.sm },
    earningsTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold },
    earningsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.sm },
    earningsAmountContainer: { flex: 1, gap: spacing.xs },
    earningsAmount: { fontSize: 28, fontWeight: typography.fontWeight.bold },
    earningsTotal: { fontSize: typography.fontSize.base },
    detailsButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg },
    detailsButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: '#ffffff' },
    statsContainer: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.lg, flexWrap: 'wrap' },
    statCard: { flex: 1, minWidth: 100, padding: spacing.md, gap: spacing.sm, alignItems: 'flex-start' },
    statLabel: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium },
    statValue: { fontSize: 24, fontWeight: typography.fontWeight.bold },
    sectionTitle: { fontSize: 20, fontWeight: typography.fontWeight.bold, marginBottom: spacing.md },
    quickActionsGrid: { flexDirection: 'row', gap: spacing.md },
    quickActionButton: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, ...shadows.sm },
    quickActionText: { color: '#ffffff', fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },
    upcomingScrollView: { marginHorizontal: -spacing.md },
    upcomingContent: { paddingHorizontal: spacing.md, gap: spacing.md },
    upcomingCard: { width: 220, borderRadius: borderRadius.xl, padding: spacing.sm, ...shadows.sm },
    upcomingImage: { width: '100%', height: 120, borderRadius: borderRadius.lg },
    upcomingInfo: { padding: spacing.xs, gap: spacing.xs },
    upcomingTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
    upcomingDateTime: { flexDirection: 'row', alignItems: 'center' },
    upcomingDateText: { fontSize: 10, marginLeft: 4 },
    upcomingTimeText: { fontSize: 10, marginLeft: 4 },
    emptyState: { padding: spacing.xl, alignItems: 'center' },
    emptyStateText: { fontSize: typography.fontSize.sm },
    notificationBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#e53e3e', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2 },
    notificationBadgeText: { fontSize: 10, fontWeight: typography.fontWeight.bold, color: '#ffffff' },
});
