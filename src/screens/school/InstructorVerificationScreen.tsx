import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Animated,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FirestoreService } from '../../services/firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { spacing, typography, borderRadius, getPalette } from '../../utils/theme';

// ─── Types ───────────────────────────────────────────────────────────────────
interface RequestRow {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    userEmail: string;
    danceStyles: string[];
    experience: string;
    bio: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    reviewNote?: string;
    photoURL?: string;
}

type FilterTab = 'pending' | 'approved' | 'rejected';

// ─── Status chip ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    pending: { bg: '#FEF3C7', text: '#D97706', icon: 'schedule' as const },
    approved: { bg: '#D1FAE5', text: '#065F46', icon: 'check-circle' as const },
    rejected: { bg: '#FEE2E2', text: '#991B1B', icon: 'cancel' as const },
};

export const InstructorVerificationScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const { isDarkMode } = useThemeStore();

    const role = user?.role === 'school' ? 'school' : 'instructor';
    const palette = getPalette(role, isDarkMode);

    const [requests, setRequests] = useState<RequestRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<FilterTab>('pending');
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
    const toastOpacity = React.useRef(new Animated.Value(0)).current;

    // ── Header ──────────────────────────────────────────────────────────────────
    React.useEffect(() => {
        navigation.setOptions({
            headerTitle: t('instructorVerification.title'),
            headerStyle: { backgroundColor: palette.background },
            headerTintColor: palette.text.primary,
            headerTitleStyle: { fontWeight: 'bold' },
            headerShadowVisible: false,
        });
    }, [navigation, palette, t]);

    // ── Toast ───────────────────────────────────────────────────────────────────
    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ visible: true, message, type });
        Animated.sequence([
            Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(2800),
            Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setToast(prev => ({ ...prev, visible: false })));
    }, [toastOpacity]);

    // ── Load ────────────────────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                setLoading(true);
                try {
                    let data: RequestRow[];
                    if (user?.role === 'school' && user?.id) {
                        // Okul: SADECE kendi okuluna bağlı başvuruları görsün.
                        // Diğer okulların başvuruları veya genel başvurular görünmemeli.
                        const targetSchoolId = (user as any).schoolId || user.id;
                        data = await FirestoreService.getInstructorRequestsBySchool(targetSchoolId);
                    } else {
                        // Fallback: Admin görünümü veya genel instructor doğrulamaları (eğer schoolId yoksa)
                        data = await FirestoreService.getPendingInstructorRequests();
                    }
                    setRequests(data as RequestRow[]);
                } catch (err) {
                    console.error('[InstructorVerificationScreen] load error:', err);
                } finally {
                    setLoading(false);
                }
            };
            load();
        }, [user?.id, user?.role])
    );

    // ── Approve / Reject ────────────────────────────────────────────────────────
    const handleAction = (request: RequestRow, newStatus: 'approved' | 'rejected') => {
        const isApprove = newStatus === 'approved';
        Alert.alert(
            isApprove ? t('instructorVerification.approveConfirmTitle') : t('instructorVerification.rejectConfirmTitle'),
            isApprove
                ? t('instructorVerification.approveConfirmDesc', { name: `${request.firstName} ${request.lastName}` })
                : t('instructorVerification.rejectConfirmDesc', { name: `${request.firstName} ${request.lastName}` }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: isApprove ? t('instructorVerification.approve') : t('instructorVerification.reject'),
                    style: isApprove ? 'default' : 'destructive',
                    onPress: async () => {
                        setActionId(request.id);
                        try {
                            await FirestoreService.updateInstructorRequestStatus(
                                request.id,
                                newStatus,
                                request.userId,
                            );
                            setRequests(prev =>
                                prev.map(r => r.id === request.id ? { ...r, status: newStatus } : r)
                            );
                            showToast(
                                isApprove
                                    ? t('instructorVerification.approveSuccess', { name: request.firstName })
                                    : t('instructorVerification.rejectSuccess', { name: request.firstName }),
                                'success'
                            );
                        } catch (err) {
                            showToast(t('common.unknownError'), 'error');
                        } finally {
                            setActionId(null);
                        }
                    }
                }
            ]
        );
    };

    // ── Filtered list ───────────────────────────────────────────────────────────
    const filtered = requests.filter(r => {
        if (r.status !== activeTab) return false;
        const q = search.toLowerCase();
        if (!q) return true;
        const name = `${r.firstName} ${r.lastName}`.toLowerCase();
        const email = r.userEmail.toLowerCase();
        return name.includes(q) || email.includes(q);
    });

    const counts = {
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    // ── Render item ─────────────────────────────────────────────────────────────
    const renderItem = ({ item }: { item: RequestRow }) => {
        const colors = STATUS_COLORS[item.status];
        const isActing = actionId === item.id;
        const initials = `${item.firstName?.[0] ?? ''}${item.lastName?.[0] ?? ''}`.toUpperCase();
        const date = item.createdAt
            ? new Date(item.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';

        return (
            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
                {/* Top row */}
                <View style={styles.cardHeader}>
                    {item.photoURL ? (
                        <Image
                            source={{ uri: item.photoURL }}
                            style={[styles.avatar, { borderRadius: 24 }]}
                        />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: palette.primary + '20' }]}>
                            <Text style={[styles.avatarText, { color: palette.primary }]}>{initials}</Text>
                        </View>
                    )}

                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardName, { color: palette.text.primary }]} numberOfLines={1}>
                            {item.firstName} {item.lastName}
                        </Text>
                        <Text style={[styles.cardEmail, { color: palette.text.secondary }]} numberOfLines={1}>
                            {item.userEmail}
                        </Text>
                        <Text style={[styles.cardDate, { color: palette.text.secondary }]}>
                            {date}
                        </Text>
                    </View>

                    {/* Status chip */}
                    <View style={[styles.statusChip, { backgroundColor: colors.bg }]}>
                        <MaterialIcons name={colors.icon} size={14} color={colors.text} />
                        <Text style={[styles.statusText, { color: colors.text }]}>
                            {t(`instructorVerification.status.${item.status}`)}
                        </Text>
                    </View>
                </View>

                {/* Dance styles */}
                {item.danceStyles?.length > 0 && (
                    <View style={styles.tagsRow}>
                        {item.danceStyles.slice(0, 4).map(style => (
                            <View key={style} style={[styles.tag, { backgroundColor: palette.primary + '12' }]}>
                                <Text style={[styles.tagText, { color: palette.primary }]}>{style}</Text>
                            </View>
                        ))}
                        {item.danceStyles.length > 4 && (
                            <Text style={[styles.tagMore, { color: palette.text.secondary }]}>
                                +{item.danceStyles.length - 4}
                            </Text>
                        )}
                    </View>
                )}

                {/* Experience / Bio */}
                {item.experience ? (
                    <Text style={[styles.experience, { color: palette.text.secondary }]} numberOfLines={2}>
                        <Text style={{ fontWeight: '600' }}>{t('instructorVerification.experience')}: </Text>
                        {item.experience}
                    </Text>
                ) : null}

                {/* Actions — only shown when pending */}
                {item.status === 'pending' && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.rejectBtn, { borderColor: '#EF4444' }]}
                            onPress={() => handleAction(item, 'rejected')}
                            disabled={isActing}
                        >
                            {isActing ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <>
                                    <MaterialIcons name="close" size={16} color="#EF4444" />
                                    <Text style={styles.rejectBtnText}>{t('instructorVerification.reject')}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.approveBtn, { backgroundColor: '#10B981' }]}
                            onPress={() => handleAction(item, 'approved')}
                            disabled={isActing}
                        >
                            {isActing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <MaterialIcons name="check" size={16} color="#fff" />
                                    <Text style={styles.approveBtnText}>{t('instructorVerification.approve')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Review note */}
                {item.reviewNote ? (
                    <Text style={[styles.reviewNote, { color: palette.text.secondary, borderColor: palette.border }]}>
                        {item.reviewNote}
                    </Text>
                ) : null}
            </View>
        );
    };

    const TABS: FilterTab[] = ['pending', 'approved', 'rejected'];
    const toastBg = toast.type === 'success' ? '#10B981' : '#EF4444';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <MaterialIcons name="search" size={20} color={palette.text.secondary} />
                <TextInput
                    style={[styles.searchInput, { color: palette.text.primary }]}
                    placeholder={t('instructorVerification.searchPlaceholder')}
                    placeholderTextColor={palette.text.secondary + '80'}
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                />
            </View>

            {/* Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: palette.border }]}>
                {TABS.map(tab => {
                    const active = tab === activeTab;
                    const chipColor = STATUS_COLORS[tab];
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, active && { borderBottomColor: palette.primary, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: active ? palette.primary : palette.text.secondary },
                            ]}>
                                {t(`instructorVerification.tab.${tab}`)}
                            </Text>
                            {counts[tab] > 0 && (
                                <View style={[styles.tabBadge, { backgroundColor: active ? palette.primary : palette.border }]}>
                                    <Text style={[styles.tabBadgeText, { color: active ? '#fff' : palette.text.secondary }]}>
                                        {counts[tab]}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator color={palette.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    ListEmptyComponent={() => (
                        <View style={styles.empty}>
                            <MaterialIcons name="verified-user" size={52} color={palette.text.secondary} />
                            <Text style={[styles.emptyText, { color: palette.text.secondary }]}>
                                {t(`instructorVerification.empty.${activeTab}`)}
                            </Text>
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
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
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.md,
        height: 46,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        gap: spacing.sm,
    },
    searchInput: { flex: 1, fontSize: typography.fontSize.base },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        marginHorizontal: spacing.md,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: spacing.sm,
    },
    tabText: { fontSize: typography.fontSize.sm, fontWeight: '600' },
    tabBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    tabBadgeText: { fontSize: 11, fontWeight: 'bold' },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: spacing.md, flexGrow: 1 },
    card: {
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        padding: spacing.md,
        gap: spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: typography.fontSize.base, fontWeight: 'bold' },
    cardInfo: { flex: 1, gap: 2 },
    cardName: { fontSize: typography.fontSize.base, fontWeight: '700' },
    cardEmail: { fontSize: typography.fontSize.xs },
    cardDate: { fontSize: typography.fontSize.xs, marginTop: 2 },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        alignSelf: 'flex-start',
    },
    statusText: { fontSize: typography.fontSize.xs, fontWeight: '700' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: borderRadius.full,
    },
    tagText: { fontSize: typography.fontSize.xs, fontWeight: '600' },
    tagMore: { fontSize: typography.fontSize.xs, alignSelf: 'center' },
    experience: { fontSize: typography.fontSize.sm, lineHeight: 18 },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    rejectBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1.5,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.sm,
    },
    rejectBtnText: { color: '#EF4444', fontSize: typography.fontSize.sm, fontWeight: '700' },
    approveBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.sm,
    },
    approveBtnText: { color: '#fff', fontSize: typography.fontSize.sm, fontWeight: '700' },
    reviewNote: {
        fontSize: typography.fontSize.xs,
        lineHeight: 18,
        fontStyle: 'italic',
        paddingTop: spacing.xs,
        borderTopWidth: 1,
        marginTop: spacing.xs,
    },
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
