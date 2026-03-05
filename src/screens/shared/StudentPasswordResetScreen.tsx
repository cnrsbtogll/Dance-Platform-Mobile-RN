import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Platform,
    StatusBar,
    Animated,
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
import { spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { User } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────────────
interface StudentRow {
    user: User;
    mailSent: boolean;
    sending: boolean;
    error: string | null;
}

// ─── Toast ───────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error';
interface ToastState { visible: boolean; message: string; type: ToastType }

export const StudentPasswordResetScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { isDarkMode } = useThemeStore();

    const role = user?.role === 'school' ? 'school' : 'instructor';
    const palette = getPalette(role, isDarkMode);

    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });
    const toastOpacity = React.useRef(new Animated.Value(0)).current;

    // ── Header ──────────────────────────────────────────────────────────────────
    React.useEffect(() => {
        navigation.setOptions({
            headerTitle: t('studentPasswordReset.title'),
            headerStyle: { backgroundColor: palette.background },
            headerTintColor: palette.text.primary,
            headerTitleStyle: { fontWeight: 'bold' },
            headerShadowVisible: false,
        });
    }, [navigation, palette, t]);

    // ── Toast ───────────────────────────────────────────────────────────────────
    const showToast = useCallback((message: string, type: ToastType) => {
        setToast({ visible: true, message, type });
        Animated.sequence([
            Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(2800),
            Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, [toastOpacity]);

    // ── Load students ───────────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                if (!user?.id) return;
                setLoading(true);
                try {
                    const users = role === 'school'
                        ? await FirestoreService.getStudentsBySchool(user.id)
                        : await FirestoreService.getStudentsByInstructor(user.id);

                    setStudents(users.map(u => ({
                        user: u,
                        mailSent: false,
                        sending: false,
                        error: null,
                    })));
                } catch (err) {
                    console.error('[StudentPasswordResetScreen] load error:', err);
                } finally {
                    setLoading(false);
                }
            };
            load();
        }, [user?.id, role])
    );

    // ── Send reset email ────────────────────────────────────────────────────────
    const sendReset = async (index: number) => {
        const row = students[index];
        if (!row.user.email || !auth) return;

        setStudents(prev => {
            const next = [...prev];
            next[index] = { ...next[index], sending: true, error: null };
            return next;
        });

        try {
            await sendPasswordResetEmail(auth, row.user.email);
            setStudents(prev => {
                const next = [...prev];
                next[index] = { ...next[index], sending: false, mailSent: true };
                return next;
            });
            showToast(
                t('studentPasswordReset.mailSentTo', { email: row.user.email }),
                'success'
            );
        } catch (err: any) {
            const message = err?.code === 'auth/user-not-found'
                ? t('studentPasswordReset.userNotFound')
                : t('studentPasswordReset.sendFailed');

            setStudents(prev => {
                const next = [...prev];
                next[index] = { ...next[index], sending: false, error: message };
                return next;
            });
            showToast(message, 'error');
        }
    };

    // ── Filtered list ───────────────────────────────────────────────────────────
    const filteredStudents = students.filter(row => {
        const q = search.toLowerCase();
        const name = (row.user.name || row.user.displayName || '').toLowerCase();
        const email = (row.user.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
    });

    // ── Render row ──────────────────────────────────────────────────────────────
    const renderItem = ({ item, index }: { item: StudentRow; index: number }) => {
        const realIndex = students.indexOf(item);
        const initials = (item.user.name || item.user.displayName || '?')
            .split(' ')
            .map(p => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        return (
            <View style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}>
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: palette.primary + '20' }]}>
                    <Text style={[styles.avatarText, { color: palette.primary }]}>{initials}</Text>
                </View>

                {/* Info */}
                <View style={styles.info}>
                    <Text style={[styles.name, { color: palette.text.primary }]} numberOfLines={1}>
                        {item.user.name || item.user.displayName || '—'}
                    </Text>
                    <Text style={[styles.email, { color: palette.text.secondary }]} numberOfLines={1}>
                        {item.user.email || t('studentPasswordReset.noEmail')}
                    </Text>
                    {item.error && (
                        <Text style={styles.errorText} numberOfLines={1}>{item.error}</Text>
                    )}
                </View>

                {/* Action */}
                {item.mailSent ? (
                    <View style={[styles.sentBadge, { backgroundColor: '#10B981' + '20' }]}>
                        <MaterialIcons name="check-circle" size={18} color="#10B981" />
                        <Text style={styles.sentText}>{t('studentPasswordReset.sent')}</Text>
                    </View>
                ) : item.sending ? (
                    <ActivityIndicator size="small" color={palette.primary} style={{ width: 56 }} />
                ) : (
                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: palette.primary + '15', borderColor: palette.primary }]}
                        onPress={() => sendReset(realIndex)}
                        disabled={!item.user.email}
                    >
                        <MaterialIcons name="send" size={16} color={palette.primary} />
                        <Text style={[styles.sendBtnText, { color: palette.primary }]}>
                            {t('studentPasswordReset.send')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // ── Empty ───────────────────────────────────────────────────────────────────
    const renderEmpty = () => (
        <View style={styles.empty}>
            <MaterialIcons name="people-outline" size={52} color={palette.text.secondary} />
            <Text style={[styles.emptyText, { color: palette.text.secondary }]}>
                {loading ? t('common.loading') : t('studentPasswordReset.noStudents')}
            </Text>
        </View>
    );

    const toastBg = toast.type === 'success' ? '#10B981' : '#EF4444';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>

            {/* Search */}
            <View style={[styles.searchBar, {
                backgroundColor: palette.card,
                borderColor: palette.border,
            }]}>
                <MaterialIcons name="search" size={20} color={palette.text.secondary} />
                <TextInput
                    style={[styles.searchInput, { color: palette.text.primary }]}
                    placeholder={t('studentPasswordReset.searchPlaceholder')}
                    placeholderTextColor={palette.text.secondary + '80'}
                    value={search}
                    onChangeText={setSearch}
                    clearButtonMode="while-editing"
                    autoCapitalize="none"
                />
                {search.length > 0 && Platform.OS !== 'ios' && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <MaterialIcons name="close" size={18} color={palette.text.secondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Info banner */}
            <View style={[styles.infoBanner, {
                backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
                borderColor: isDarkMode ? '#334155' : '#BFDBFE',
            }]}>
                <MaterialIcons name="info-outline" size={16} color="#3B82F6" />
                <Text style={[styles.infoText, { color: palette.text.secondary }]}>
                    {t('studentPasswordReset.infoBanner')}
                </Text>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator color={palette.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={filteredStudents}
                    keyExtractor={item => item.user.id}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
            )}

            {toast.visible && (
                <Animated.View style={[styles.toast, { backgroundColor: toastBg, opacity: toastOpacity }]}>
                    <MaterialIcons
                        name={toast.type === 'success' ? 'check-circle' : 'error-outline'}
                        size={18}
                        color="#fff"
                    />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </Animated.View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.md,
        paddingHorizontal: spacing.md,
        height: 46,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        gap: spacing.sm,
    },
    searchInput: { flex: 1, fontSize: typography.fontSize.base },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    infoText: { flex: 1, fontSize: typography.fontSize.xs, lineHeight: 18 },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: spacing.md, flexGrow: 1 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: typography.fontSize.base, fontWeight: 'bold' },
    info: { flex: 1, gap: 2 },
    name: { fontSize: typography.fontSize.base, fontWeight: '600' },
    email: { fontSize: typography.fontSize.xs },
    errorText: { fontSize: typography.fontSize.xs, color: '#EF4444', marginTop: 2 },
    sentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    sentText: { color: '#10B981', fontSize: typography.fontSize.xs, fontWeight: 'bold' },
    sendBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1.5,
    },
    sendBtnText: { fontSize: typography.fontSize.xs, fontWeight: 'bold' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
    emptyText: { fontSize: typography.fontSize.base, textAlign: 'center' },
    toast: {
        position: 'absolute',
        bottom: 30,
        left: spacing.lg,
        right: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        elevation: 8,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    toastText: { color: '#fff', fontSize: typography.fontSize.sm, fontWeight: '600', flex: 1 },
});
