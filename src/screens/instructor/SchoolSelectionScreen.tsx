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
import { FirestoreService } from '../../services/firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { spacing, typography, borderRadius, colors, getPalette } from '../../utils/theme';
import { DanceSchool } from '../../types';

export const SchoolSelectionScreen: React.FC = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { user, setUser } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette('instructor', isDarkMode);

    const [schools, setSchools] = useState<DanceSchool[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null); // schoolId being submitted
    const [search, setSearch] = useState('');

    // ── Header ──────────────────────────────────────────────────────────────────
    React.useEffect(() => {
        navigation.setOptions({
            headerTitle: t('schoolSelection.title'),
            headerStyle: { backgroundColor: palette.background },
            headerTintColor: palette.text.primary,
            headerTitleStyle: { fontWeight: 'bold' },
            headerShadowVisible: false,
        });
    }, [navigation, palette, t]);

    // ── Load approved schools ────────────────────────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                setLoading(true);
                try {
                    const data = await FirestoreService.getApprovedSchools();
                    setSchools(data);
                } catch (err) {
                    console.error('[SchoolSelectionScreen] load error:', err);
                } finally {
                    setLoading(false);
                }
            };
            load();
        }, [])
    );

    // ── Submit school approval request ───────────────────────────────────────────
    const handleSelect = (school: DanceSchool) => {
        // Aynı okula zaten pending başvuru varsa engelle
        if (
            user?.verificationStatus === 'pending' &&
            (user as any).schoolId === school.id
        ) {
            Alert.alert(
                t('schoolSelection.alreadyAppliedTitle') || 'Başvuru Zaten Gönderildi',
                t('schoolSelection.alreadyAppliedDesc', { school: school.name }) ||
                `${school.name} okuluna zaten bir başvurunuz bulunuyor. Başka bir okul seçebilir veya mevcut başvuruyu iptal edebilirsiniz.`,
                [{ text: t('common.ok') }]
            );
            return;
        }

        Alert.alert(
            t('schoolSelection.confirmTitle'),
            t('schoolSelection.confirmDesc', { school: school.name }),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('schoolSelection.apply'),
                    onPress: async () => {
                        if (!user?.id) return;
                        setSubmitting(school.id);

                        try {
                            const now = new Date().toISOString();
                            await FirestoreService.createVerificationRequest({
                                userId: user.id,
                                firstName: user.firstName || user.name?.split(' ')[0] || '',
                                lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
                                userEmail: user.email || '',
                                danceStyles: (user as any).danceStyles || [],
                                experience: (user as any).experience || '',
                                bio: (user as any).bio || '',
                                contactNumber: user.phoneNumber || '',
                                idDocumentUrl: '',    // School approval — no docs required
                                certDocumentUrl: '',
                                status: 'pending',
                                schoolId: school.id,
                                verificationMethod: 'school',
                                photoURL: user.photoURL || user.avatar || null,
                                createdAt: now,
                                updatedAt: now,
                            });

                            // Kullanıcının Firestore kaydını güncelle
                            await FirestoreService.updateUser(user.id, {
                                verificationStatus: 'pending',
                                verificationMethod: 'school',
                                schoolId: school.id,
                            } as any);

                            // Local state'i güncelle (banner hemen görünsün)
                            setUser({
                                ...user,
                                verificationStatus: 'pending',
                                verificationMethod: 'school',
                                schoolId: school.id,
                            } as any);

                            // Okula bildirim gönder
                            if (school.userId) {
                                const instructorName = (user.firstName || user.lastName)
                                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                    : (user as any).name || user.email?.split('@')[0] || 'Bir';

                                await FirestoreService.createNotification({
                                    userId: school.userId,
                                    title: t('notifications.newVerificationRequestTitle') || 'Yeni Eğitmen Başvurusu',
                                    message: t('notifications.newVerificationRequestDesc', { name: instructorName }),
                                    type: 'instructor_verification_request',
                                    isRead: false,
                                    createdAt: now,
                                    data: {
                                        instructorId: user.id
                                    }
                                });
                            }

                            Alert.alert(
                                t('schoolSelection.successTitle'),
                                t('schoolSelection.successDesc', { school: school.name }),
                                [{
                                    text: t('common.ok'),
                                    onPress: () => navigation.goBack(),
                                }]
                            );
                        } catch (err) {
                            console.error('[SchoolSelectionScreen] submit error:', err);
                            Alert.alert(t('common.error'), t('common.errorDesc'));
                        } finally {
                            setSubmitting(null);
                        }
                    }
                }
            ]
        );
    };

    // ── Filtered schools ─────────────────────────────────────────────────────────
    const filtered = schools.filter(s => {
        const q = search.toLowerCase();
        return (
            s.name?.toLowerCase().includes(q) ||
            (s as any).city?.toLowerCase().includes(q) ||
            (s as any).schoolAddress?.toLowerCase().includes(q)
        );
    });

    // ── Render item ──────────────────────────────────────────────────────────────
    const renderItem = ({ item }: { item: DanceSchool }) => {
        const isSubmitting = submitting === item.id;
        const initials = (item.name || '?').slice(0, 2).toUpperCase();
        const alreadyApplied =
            user?.verificationStatus === 'pending' && (user as any).schoolId === item.id;

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: palette.card,
                        borderColor: alreadyApplied ? '#F59E0B' : palette.border,
                        borderWidth: alreadyApplied ? 2 : 1,
                    },
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.8}
                disabled={!!submitting}
            >
                {/* Logo / Initials */}
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.logoWrap} />
                ) : (
                    <View style={[styles.logoWrap, { backgroundColor: colors.school.primary + '18' }]}>
                        <Text style={[styles.logoText, { color: colors.school.primary }]}>{initials}</Text>
                    </View>
                )}

                {/* Info */}
                <View style={styles.info}>
                    <Text style={[styles.schoolName, { color: palette.text.primary }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {((item as any).city || (item as any).schoolAddress) && (
                        <View style={styles.locationRow}>
                            <MaterialIcons name="location-on" size={13} color={palette.text.secondary} />
                            <Text style={[styles.location, { color: palette.text.secondary }]} numberOfLines={1}>
                                {(item as any).city || (item as any).schoolAddress}
                            </Text>
                        </View>
                    )}
                    {(item as any).danceStyles?.length > 0 && (
                        <Text style={[styles.styles_, { color: palette.text.secondary }]} numberOfLines={1}>
                            {(item as any).danceStyles.slice(0, 3).join(' · ')}
                        </Text>
                    )}
                    {alreadyApplied && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <MaterialIcons name="hourglass-top" size={12} color="#F59E0B" />
                            <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '600' }}>
                                {t('schoolSelection.pendingBadge') || 'Başvuruldu • Bekliyor'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Action */}
                {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.school.primary} />
                ) : alreadyApplied ? (
                    <MaterialIcons name="hourglass-top" size={22} color="#F59E0B" />
                ) : (
                    <MaterialIcons name="chevron-right" size={22} color={palette.text.secondary} />
                )}
            </TouchableOpacity>
        );
    };


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>

            {/* Info banner */}
            <View style={[styles.banner, {
                backgroundColor: isDarkMode ? '#1E293B' : '#EFF6FF',
                borderColor: isDarkMode ? '#334155' : '#BFDBFE',
            }]}>
                <MaterialIcons name="info-outline" size={16} color="#3B82F6" />
                <Text style={[styles.bannerText, { color: palette.text.secondary }]}>
                    {t('schoolSelection.infoBanner')}
                </Text>
            </View>

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <MaterialIcons name="search" size={20} color={palette.text.secondary} />
                <TextInput
                    style={[styles.searchInput, { color: palette.text.primary }]}
                    placeholder={t('schoolSelection.searchPlaceholder')}
                    placeholderTextColor={palette.text.secondary + '80'}
                    value={search}
                    onChangeText={setSearch}
                    autoCapitalize="none"
                />
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator color={colors.school.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.empty}>
                            <MaterialIcons name="school" size={52} color={palette.text.secondary} />
                            <Text style={[styles.emptyText, { color: palette.text.secondary }]}>
                                {t('schoolSelection.noSchools')}
                            </Text>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    banner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        margin: spacing.md,
        marginBottom: spacing.sm,
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    bannerText: { flex: 1, fontSize: typography.fontSize.xs, lineHeight: 18 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.md,
        height: 46,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        gap: spacing.sm,
    },
    searchInput: { flex: 1, fontSize: typography.fontSize.base },
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
    logoWrap: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    logoText: { fontSize: typography.fontSize.base, fontWeight: 'bold' },
    info: { flex: 1, gap: 3 },
    schoolName: { fontSize: typography.fontSize.base, fontWeight: '700' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    location: { fontSize: typography.fontSize.xs },
    styles_: { fontSize: typography.fontSize.xs },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
    emptyText: { fontSize: typography.fontSize.base, textAlign: 'center' },
});
