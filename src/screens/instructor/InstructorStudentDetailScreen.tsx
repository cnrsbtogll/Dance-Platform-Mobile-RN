import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase/config';
import { FirestoreService } from '../../services/firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { colors, spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { User, Booking, Lesson } from '../../types';

type ActionState = 'idle' | 'sending' | 'sent' | 'error';

interface BookingWithLesson extends Booking {
    lesson?: Lesson | null;
}

export const InstructorStudentDetailScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { t } = useTranslation();
    const { user: instructor } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette('instructor', isDarkMode);

    // Params: studentId (string) veya student (User objesi)
    const params = route.params as { studentId?: string; student?: User };
    const [student, setStudent] = useState<User | null>(params.student ?? null);
    const [bookings, setBookings] = useState<BookingWithLesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [resetState, setResetState] = useState<ActionState>('idle');
    const [verifyState, setVerifyState] = useState<ActionState>('idle');

    // ── Header ──────────────────────────────────────────────────────────────────
    React.useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTitle: student?.name || t('studentDetail.title'),
            headerStyle: { backgroundColor: palette.background },
            headerTintColor: palette.text.primary,
            headerTitleStyle: { fontWeight: 'bold', color: palette.text.primary },
            headerShadowVisible: false,
        });
    }, [navigation, palette, student?.name, t]);

    // ── Load data ────────────────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                setLoading(true);
                try {
                    const studentId = params.studentId ?? params.student?.id;
                    if (!studentId) return;

                    // Öğrenci profilini yükle (eğer nesne verilmemişse)
                    if (!student) {
                        const fetched = await FirestoreService.getUserById(studentId);
                        setStudent(fetched);
                    }

                    // Bu öğrencinin tüm booking'lerini çek
                    const allBookings = await FirestoreService.getBookingsByStudent(studentId);

                    // Sadece bu eğitmene ait booking'leri filtrele
                    const mine = allBookings.filter(
                        b => b.instructorId === instructor?.id && b.status !== 'cancelled'
                    );

                    // Ders bilgilerini ekle
                    const enriched: BookingWithLesson[] = await Promise.all(
                        mine.map(async b => ({
                            ...b,
                            lesson: b.lessonId ? await FirestoreService.getLessonById(b.lessonId) : null,
                        }))
                    );

                    // Tarihe göre en yeni önce
                    enriched.sort((a, b) => {
                        const da = new Date(a.date || a.createdAt || 0).getTime();
                        const db_ = new Date(b.date || b.createdAt || 0).getTime();
                        return db_ - da;
                    });

                    setBookings(enriched);
                } catch (err) {
                    console.error('[StudentDetail] load error:', err);
                } finally {
                    setLoading(false);
                }
            };
            load();
        }, [params.studentId, params.student?.id, instructor?.id])
    );

    // ── Mail aksiyonları ─────────────────────────────────────────────────────────
    const sendAction = async (
        type: 'reset' | 'verify',
        setState: (s: ActionState) => void
    ) => {
        if (!student?.email) {
            Alert.alert(t('common.error'), t('instructorStudents.noEmail'));
            return;
        }
        const titleKey = type === 'reset' ? 'instructorStudents.resetTitle' : 'instructorStudents.verifyTitle';
        const descKey = type === 'reset' ? 'instructorStudents.resetDesc' : 'instructorStudents.verifyDesc';

        Alert.alert(
            t(titleKey),
            t(descKey, { name: student.name, email: student.email }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('instructorStudents.send'),
                    onPress: async () => {
                        setState('sending');
                        try {
                            await sendPasswordResetEmail(auth, student.email!);
                            setState('sent');
                            setTimeout(() => setState('idle'), 3000);
                        } catch {
                            setState('error');
                            setTimeout(() => setState('idle'), 3000);
                        }
                    },
                },
            ]
        );
    };

    const handleWhatsApp = () => {
        const phone = (student as any)?.phone || student?.phoneNumber;
        if (!phone) {
            Alert.alert(t('common.error'), t('studentDetail.noPhone') || 'This student does not have a phone number.');
            return;
        }
        let phoneStr = phone.replace(/[^0-9+]/g, '');
        if (!phoneStr.startsWith('+')) {
            if (phoneStr.startsWith('0')) {
                phoneStr = '+90' + phoneStr.substring(1);
            } else {
                phoneStr = '+90' + phoneStr;
            }
        }
        const url = `whatsapp://send?phone=${phoneStr}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Error', 'WhatsApp is not installed on your device.');
            }
        });
    };

    const handlePhoneCall = () => {
        const phone = (student as any)?.phone || student?.phoneNumber;
        if (!phone) {
            Alert.alert(t('common.error'), t('studentDetail.noPhone') || 'This student does not have a phone number.');
            return;
        }
        const url = `tel:${phone.replace(/[^0-9+]/g, '')}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Unable to make phone calls.');
            }
        });
    };

    const handleInAppChat = () => {
        if (!student) return;
        (navigation as any).navigate('ChatDetail', {
            targetUserId: student.id,
            recipientName: student.name,
            recipientRole: student.role
        });
    };

    // ── Helpers ──────────────────────────────────────────────────────────────────
    const avatarUrl = student?.avatar || student?.photoURL;
    const totalSessions = bookings.length;
    const uniqueLessons = [...new Map(bookings.map(b => [b.lessonId, b.lesson])).values()].filter(Boolean);
    const firstBooking = [...bookings].sort((a, b) =>
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    )[0];

    // ── Stat pill ─────────────────────────────────────────────────────────────────
    const StatPill = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
        <View style={[styles.statPill, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <MaterialIcons name={icon as any} size={18} color={colors.instructor.primary} />
            <Text style={[styles.statValue, { color: palette.text.primary }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: palette.text.secondary }]}>{label}</Text>
        </View>
    );

    const ActionButton = ({
        icon, label, state, color, onPress, IconComponent = MaterialIcons, subLabel
    }: { icon: string; label: string; state?: ActionState; color: string; onPress: () => void; IconComponent?: any, subLabel?: string }) => (
        <TouchableOpacity
            style={[styles.actionBtn, { borderColor: palette.text.primary }]}
            onPress={onPress}
            disabled={state === 'sending'}
            activeOpacity={0.75}
        >
            {state === 'sending' ? (
                <ActivityIndicator size={16} color={palette.text.primary} />
            ) : state === 'sent' ? (
                <MaterialIcons name="check-circle" size={18} color="#10B981" />
            ) : state === 'error' ? (
                <MaterialIcons name="error-outline" size={18} color="#EF4444" />
            ) : (
                <IconComponent name={icon as any} size={20} color={palette.text.primary} />
            )}
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.actionBtnText, { color: palette.text.primary }]}>{label}</Text>
                {subLabel && <Text style={{ color: palette.text.primary, fontSize: 11, marginTop: 4, opacity: 0.8 }}>{subLabel}</Text>}
            </View>
            <View style={{ width: 20 }} />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.loader, { backgroundColor: palette.background }]}>
                <ActivityIndicator size="large" color={colors.instructor.primary} />
            </View>
        );
    }

    if (!student) {
        return (
            <View style={[styles.loader, { backgroundColor: palette.background }]}>
                <Text style={{ color: palette.text.secondary }}>{t('studentDetail.notFound')}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ── Profile Card ── */}
                <View style={[styles.profileCard, { backgroundColor: palette.card }]}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.instructor.primary + '20' }]}>
                            <Text style={[styles.avatarInitial, { color: colors.instructor.primary }]}>
                                {(student.name || '?').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.studentName, { color: palette.text.primary }]}>{student.name}</Text>
                    {student.email && (
                        <Text style={[styles.studentEmail, { color: palette.text.secondary }]}>{student.email}</Text>
                    )}
                    {student.city && (
                        <View style={styles.cityRow}>
                            <MaterialIcons name="location-on" size={13} color={palette.text.secondary} />
                            <Text style={[styles.cityText, { color: palette.text.secondary }]}>{student.city}</Text>
                        </View>
                    )}
                </View>

                {/* ── Stats ── */}
                <View style={styles.statsRow}>
                    <StatPill icon="event" label={t('studentDetail.sessions')} value={String(totalSessions)} />
                    <StatPill icon="school" label={t('studentDetail.courses')} value={String(uniqueLessons.length)} />
                    {firstBooking && (
                        <StatPill
                            icon="calendar-today"
                            label={t('studentDetail.since')}
                            value={new Date(firstBooking.createdAt || 0).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}
                        />
                    )}
                </View>

                {/* ── Enrolled Courses ── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
                        {t('studentDetail.enrolledCourses')}
                    </Text>
                    {uniqueLessons.length === 0 ? (
                        <Text style={[styles.empty, { color: palette.text.secondary }]}>{t('studentDetail.noCourses')}</Text>
                    ) : (
                        uniqueLessons.map(lesson => lesson && (
                            <View key={lesson.id} style={[styles.lessonRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                <View style={[styles.lessonDot, { backgroundColor: colors.instructor.primary }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.lessonTitle, { color: palette.text.primary }]} numberOfLines={1}>
                                        {lesson.title}
                                    </Text>
                                    <Text style={[styles.lessonSub, { color: palette.text.secondary }]}>
                                        {bookings.filter(b => b.lessonId === lesson.id).length} {t('studentDetail.session')}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* ── Booking History ── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
                        {t('studentDetail.bookingHistory')}
                    </Text>
                    {bookings.length === 0 ? (
                        <Text style={[styles.empty, { color: palette.text.secondary }]}>{t('studentDetail.noBookings')}</Text>
                    ) : (
                        bookings.map(b => (
                            <View key={b.id} style={[styles.bookingRow, { backgroundColor: palette.card, borderColor: palette.border }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.bookingLesson, { color: palette.text.primary }]} numberOfLines={1}>
                                        {b.lesson?.title || t('common.unknownLesson')}
                                    </Text>
                                    <Text style={[styles.bookingDate, { color: palette.text.secondary }]}>
                                        {b.date
                                            ? new Date(b.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                                            : '—'
                                        }
                                    </Text>
                                </View>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: b.status === 'completed' ? '#10B98118' : '#F59E0B18' },
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        { color: b.status === 'completed' ? '#10B981' : '#F59E0B' },
                                    ]}>
                                        {t(`booking.${b.status}`) || b.status}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* ── Actions ── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
                        {t('studentDetail.actions')}
                    </Text>

                    <View style={[styles.actionsRow, { marginBottom: spacing.md }]}>
                        <ActionButton
                            icon="chat"
                            label={t('studentDetail.chatInApp') || 'Feriha\'dan Mesaj At'}
                            color={colors.instructor.primary}
                            onPress={handleInAppChat}
                        />
                        <ActionButton
                            icon="whatsapp"
                            label="WhatsApp"
                            subLabel={(student as any)?.phone || student?.phoneNumber}
                            color="#25D366"
                            IconComponent={MaterialCommunityIcons}
                            onPress={handleWhatsApp}
                        />
                        <ActionButton
                            icon="phone"
                            label={t('common.call') || 'Ara'}
                            subLabel={(student as any)?.phone || student?.phoneNumber}
                            color="#10B981"
                            onPress={handlePhoneCall}
                        />
                    </View>

                    <Text style={[styles.sectionTitle, { color: palette.text.primary, fontSize: typography.fontSize.sm, marginTop: spacing.md }]}>
                        {t('studentDetail.accountActions') || 'Account Management'}
                    </Text>
                    <View style={styles.actionsRow}>
                        <ActionButton
                            icon="lock-reset"
                            label={t('instructorStudents.resetTitle')}
                            state={resetState}
                            color={colors.instructor.secondary}
                            onPress={() => sendAction('reset', setResetState)}
                        />
                        <ActionButton
                            icon="mark-email-unread"
                            label={t('instructorStudents.verifyTitle')}
                            state={verifyState}
                            color="#F59E0B"
                            onPress={() => sendAction('verify', setVerifyState)}
                        />
                    </View>
                </View>

                <View style={{ height: spacing.xl }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    profileCard: {
        alignItems: 'center',
        padding: spacing.xl,
        paddingBottom: spacing.lg,
        gap: 6,
    },
    avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 6 },
    avatarPlaceholder: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    },
    avatarInitial: { fontSize: 32, fontWeight: 'bold' },
    studentName: { fontSize: typography.fontSize.xl, fontWeight: 'bold' },
    studentEmail: { fontSize: typography.fontSize.sm },
    cityRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    cityText: { fontSize: typography.fontSize.xs },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    statPill: {
        flex: 1,
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        gap: 3,
    },
    statValue: { fontSize: typography.fontSize.lg, fontWeight: 'bold' },
    statLabel: { fontSize: typography.fontSize.xs, textAlign: 'center' },
    section: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: '700',
        marginBottom: spacing.sm,
    },
    empty: { fontSize: typography.fontSize.sm },
    lessonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.xs,
    },
    lessonDot: { width: 8, height: 8, borderRadius: 4 },
    lessonTitle: { fontSize: typography.fontSize.sm, fontWeight: '600' },
    lessonSub: { fontSize: typography.fontSize.xs },
    bookingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.xs,
    },
    bookingLesson: { fontSize: typography.fontSize.sm, fontWeight: '600' },
    bookingDate: { fontSize: typography.fontSize.xs, marginTop: 2 },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
    },
    statusText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
    actionsRow: { gap: spacing.sm, flexDirection: 'column' },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    actionBtnText: { fontSize: typography.fontSize.sm, fontWeight: '600' },
});
