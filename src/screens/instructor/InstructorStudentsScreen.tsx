import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase/config';
import { FirestoreService } from '../../services/firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { colors, spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { User, Booking, Lesson } from '../../types';

interface StudentEntry {
    user: User;
    lessons: Lesson[];
    bookingCount: number;
}

type ActionState = 'idle' | 'sending' | 'sent' | 'error';

export const InstructorStudentsScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette('instructor', isDarkMode);

    const [students, setStudents] = useState<StudentEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [actionStates, setActionStates] = useState<Record<string, { reset: ActionState; verify: ActionState }>>({});

    // ── Header ────────────────────────────────────────────────────────────────────
    React.useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerTitle: t('instructorStudents.title'),
            headerStyle: { backgroundColor: palette.background },
            headerTintColor: palette.text.primary,
            headerTitleStyle: { fontWeight: 'bold', color: palette.text.primary },
            headerShadowVisible: false,
        });
    }, [navigation, palette, t]);

    // ── Load students ─────────────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            if (!user?.id) return;
            const load = async () => {
                setLoading(true);
                try {
                    const [bookings, lessons] = await Promise.all([
                        FirestoreService.getBookingsByInstructor(user.id),
                        FirestoreService.getLessonsByInstructor(user.id),
                    ]);

                    // Unique students
                    const studentMap = new Map<string, { bookings: Booking[]; lessons: Set<string> }>();
                    bookings
                        .filter(b => b.status !== 'cancelled' && b.studentId)
                        .forEach(b => {
                            if (!studentMap.has(b.studentId)) {
                                studentMap.set(b.studentId, { bookings: [], lessons: new Set() });
                            }
                            const entry = studentMap.get(b.studentId)!;
                            entry.bookings.push(b);
                            if (b.lessonId) entry.lessons.add(b.lessonId);
                        });

                    // Fetch user profiles — silinmiş kullanıcılar (null) listede gösterilmez
                    const rawEntries = await Promise.all(
                        Array.from(studentMap.entries()).map(async ([studentId, data]) => {
                            const studentUser = await FirestoreService.getUserById(studentId);
                            if (!studentUser) return null; // Hesap silinmiş, atla
                            const enrolledLessons = lessons.filter(l => data.lessons.has(l.id));
                            return {
                                user: studentUser,
                                lessons: enrolledLessons,
                                bookingCount: data.bookings.length,
                            } as StudentEntry;
                        })
                    );

                    const entries = rawEntries.filter((e): e is StudentEntry => e !== null);

                    // Sort by name
                    entries.sort((a, b) => (a.user.name || '').localeCompare(b.user.name || '', 'tr'));
                    setStudents(entries);
                } catch (err) {
                    console.error('[InstructorStudentsScreen] load error:', err);
                } finally {
                    setLoading(false);
                }
            };
            load();
        }, [user?.id])
    );

    // ── Action helpers ────────────────────────────────────────────────────────────
    const setAction = (studentId: string, type: 'reset' | 'verify', state: ActionState) => {
        setActionStates(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId] ?? { reset: 'idle', verify: 'idle' }, [type]: state },
        }));
    };

    const handlePasswordReset = async (entry: StudentEntry) => {
        if (!entry.user.email) {
            Alert.alert(t('common.error'), t('instructorStudents.noEmail'));
            return;
        }
        Alert.alert(
            t('instructorStudents.resetTitle'),
            t('instructorStudents.resetDesc', { name: entry.user.name, email: entry.user.email }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('instructorStudents.send'),
                    onPress: async () => {
                        setAction(entry.user.id, 'reset', 'sending');
                        try {
                            await sendPasswordResetEmail(auth, entry.user.email!);
                            setAction(entry.user.id, 'reset', 'sent');
                            setTimeout(() => setAction(entry.user.id, 'reset', 'idle'), 3000);
                        } catch {
                            setAction(entry.user.id, 'reset', 'error');
                            setTimeout(() => setAction(entry.user.id, 'reset', 'idle'), 3000);
                        }
                    },
                },
            ]
        );
    };

    const handleEmailVerify = async (entry: StudentEntry) => {
        if (!entry.user.email) {
            Alert.alert(t('common.error'), t('instructorStudents.noEmail'));
            return;
        }
        // Firebase sendEmailVerification requires the user object — we send a custom reset flow instead
        Alert.alert(
            t('instructorStudents.verifyTitle'),
            t('instructorStudents.verifyDesc', { name: entry.user.name }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('instructorStudents.send'),
                    onPress: async () => {
                        setAction(entry.user.id, 'verify', 'sending');
                        try {
                            // En güvenli yol: password reset email aynı zamanda e-posta doğrulamaya yönlendirir
                            await sendPasswordResetEmail(auth, entry.user.email!);
                            setAction(entry.user.id, 'verify', 'sent');
                            setTimeout(() => setAction(entry.user.id, 'verify', 'idle'), 3000);
                        } catch {
                            setAction(entry.user.id, 'verify', 'error');
                            setTimeout(() => setAction(entry.user.id, 'verify', 'idle'), 3000);
                        }
                    },
                },
            ]
        );
    };

    // ── Filter ────────────────────────────────────────────────────────────────────
    const filtered = students.filter(e => {
        const q = search.toLowerCase();
        return (
            e.user.name?.toLowerCase().includes(q) ||
            e.user.email?.toLowerCase().includes(q)
        );
    });

    // ── Render student card ───────────────────────────────────────────────────────
    const renderItem = ({ item }: { item: StudentEntry }) => {
        const state = actionStates[item.user.id] ?? { reset: 'idle', verify: 'idle' };
        const avatarUrl = item.user.avatar || item.user.photoURL;

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
                onPress={() => {
                    // Öğrenci detay sayfasına git
                    (navigation as any).navigate('PartnerDetail', { userId: item.user.id });
                }}
                activeOpacity={0.8}
            >
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.instructor.primary + '20' }]}>
                            <Text style={[styles.avatarInitial, { color: colors.instructor.primary }]}>
                                {(item.user.name || '?').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <Text style={[styles.name, { color: palette.text.primary }]} numberOfLines={1}>
                        {item.user.name}
                    </Text>
                    <Text style={[styles.email, { color: palette.text.secondary }]} numberOfLines={1}>
                        {item.user.email}
                    </Text>
                    {item.lessons.length > 0 && (
                        <Text style={[styles.lessons, { color: palette.text.secondary }]} numberOfLines={2}>
                            {item.lessons.map(l => l.title).join(' · ')}
                        </Text>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <ActionBtn
                        icon="lock-reset"
                        state={state.reset}
                        color={colors.instructor.primary}
                        tooltip={t('instructorStudents.resetTooltip')}
                        onPress={() => handlePasswordReset(item)}
                    />
                    <ActionBtn
                        icon="mark-email-unread"
                        state={state.verify}
                        color="#F59E0B"
                        tooltip={t('instructorStudents.verifyTooltip')}
                        onPress={() => handleEmailVerify(item)}
                    />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <MaterialIcons name="search" size={20} color={palette.text.secondary} />
                <TextInput
                    style={[styles.searchInput, { color: palette.text.primary }]}
                    placeholder={t('instructorStudents.searchPlaceholder')}
                    placeholderTextColor={palette.text.secondary + '80'}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <MaterialIcons name="close" size={18} color={palette.text.secondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Count */}
            {!loading && (
                <Text style={[styles.countText, { color: palette.text.secondary }]}>
                    {t('instructorStudents.count', { count: filtered.length })}
                </Text>
            )}

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={colors.instructor.primary} />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.user.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.empty}>
                            <MaterialIcons name="people-outline" size={56} color={palette.text.secondary} />
                            <Text style={[styles.emptyText, { color: palette.text.secondary }]}>
                                {search ? t('instructorStudents.noResults') : t('instructorStudents.noStudents')}
                            </Text>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

// ── Small action button ───────────────────────────────────────────────────────
interface ActionBtnProps {
    icon: string;
    state: ActionState;
    color: string;
    tooltip: string;
    onPress: () => void;
}

const ActionBtn: React.FC<ActionBtnProps> = ({ icon, state, color, onPress }) => {
    const isLoading = state === 'sending';
    const isDone = state === 'sent';
    const isError = state === 'error';

    return (
        <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: color + '15', borderColor: color + '40' }]}
            onPress={onPress}
            disabled={isLoading}
            activeOpacity={0.7}
        >
            {isLoading ? (
                <ActivityIndicator size={14} color={color} />
            ) : isDone ? (
                <MaterialIcons name="check-circle" size={18} color="#10B981" />
            ) : isError ? (
                <MaterialIcons name="error-outline" size={18} color="#EF4444" />
            ) : (
                <MaterialIcons name={icon as any} size={18} color={color} />
            )}
        </TouchableOpacity>
    );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.md,
        marginBottom: spacing.xs,
        paddingHorizontal: spacing.md,
        height: 46,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        gap: spacing.sm,
    },
    searchInput: { flex: 1, fontSize: typography.fontSize.base },
    countText: {
        fontSize: typography.fontSize.xs,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: spacing.md, flexGrow: 1 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
    },
    avatarWrap: { position: 'relative' },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: { fontSize: 20, fontWeight: 'bold' },
    info: { flex: 1, gap: 3 },
    name: { fontSize: typography.fontSize.base, fontWeight: '700' },
    email: { fontSize: typography.fontSize.xs },
    lessons: { fontSize: typography.fontSize.xs, marginTop: 2, lineHeight: 16 },
    actions: { gap: spacing.xs },
    actionBtn: {
        width: 34,
        height: 34,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        paddingVertical: spacing.xxl * 2,
    },
    emptyText: { fontSize: typography.fontSize.base, textAlign: 'center' },
});
