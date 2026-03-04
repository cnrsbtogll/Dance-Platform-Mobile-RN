import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
    RefreshControl, TextInput, Modal, ScrollView, Platform, Dimensions, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { User } from '../../types';
import { getAvatarSource } from '../../utils/imageHelper';
import { useDanceStyles } from '../../hooks/useDanceStyles';
import { DANCE_LEVELS } from '../../utils/constants';
import { ALL_COUNTRY_NAMES, getCitiesForCountry, DEFAULT_COUNTRY } from '../../utils/locations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = spacing.sm;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.md * 2 - CARD_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const AGE_RANGES = [
    { key: 'all', labelKey: 'filters.all' },
    { key: '18-25', label: '18–25' },
    { key: '26-35', label: '26–35' },
    { key: '36-45', label: '36–45' },
    { key: '46+', label: '46+' },
] as const;
type AgeRange = typeof AGE_RANGES[number]['key'];

export const PartnerSearchScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useThemeStore();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    const [pendingPartner, setPendingPartner] = useState<User | null>(null);
    const role = currentUser?.role === 'admin' || currentUser?.role === 'draft-instructor' || currentUser?.role === 'draft-school' ? 'student' : currentUser?.role || 'student';
    const palette = getPalette(role, isDarkMode);

    const isVerifiedInstructor = currentUser?.role === 'instructor';
    const visibleRoles = isVerifiedInstructor
        ? ['student', 'instructor', 'draft-instructor']
        : ['student', 'draft-instructor'];

    const { danceStyles: allDanceStyles } = useDanceStyles();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // ── Active Filters ──────────────────────────────────────────────────────
    const [activeRole, setActiveRole] = useState<'all' | 'student' | 'instructor'>('all');
    const [activeGender, setActiveGender] = useState<'all' | 'male' | 'female'>('all');
    const [activeDanceStyles, setActiveDanceStyles] = useState<string[]>([]);
    const [activeLevel, setActiveLevel] = useState<string>('all');
    const [activeAgeRange, setActiveAgeRange] = useState<AgeRange>('all');
    const [activeCountry, setActiveCountry] = useState<string>('all');
    const [activeCity, setActiveCity] = useState<string>('all');

    // ── Temp Filters (modal) ─────────────────────────────────────────────────
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [tempRole, setTempRole] = useState<'all' | 'student' | 'instructor'>('all');
    const [tempGender, setTempGender] = useState<'all' | 'male' | 'female'>('all');
    const [tempDanceStyles, setTempDanceStyles] = useState<string[]>([]);
    const [tempLevel, setTempLevel] = useState<string>('all');
    const [tempAgeRange, setTempAgeRange] = useState<AgeRange>('all');
    const [tempCountry, setTempCountry] = useState<string>('all');
    const [tempCity, setTempCity] = useState<string>('all');

    // ── Location sub-state for filter modal ──────────────────────────────────
    const [showCityList, setShowCityList] = useState(false);

    const fetchUsers = async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('role', 'in', visibleRoles));
            const querySnapshot = await getDocs(q);

            const fetchedUsers: User[] = [];
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data.id !== currentUser?.id && docSnap.id !== currentUser?.id) {
                    fetchedUsers.push({
                        ...data,
                        id: docSnap.id,
                        name: data.displayName || '',
                        displayName: data.displayName || '',
                        email: data.email || '',
                        role: data.role || 'student',
                        avatar: data.photoURL || data.avatar || null,
                        photoURL: data.photoURL || null,
                        bio: data.bio || '',
                        gender: data.gender || undefined,
                        age: data.age || undefined,
                        height: data.height || undefined,
                        weight: data.weight || undefined,
                        experience: data.experience || undefined,
                        city: data.city || undefined,
                        country: data.country || undefined,
                        danceStyles: data.danceStyles || [],
                        level: data.level || undefined,
                        rating: data.rating || undefined,
                        schoolName: data.schoolName || undefined,
                        instagramHandle: data.instagramHandle || undefined,
                        phoneNumber: data.phoneNumber || null,
                        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt?.toString?.() || new Date().toISOString(),
                    } as User);
                }
            });

            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Error fetching users for partner search:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentUser?.id, currentUser?.role]);

    useEffect(() => {
        if (isAuthenticated && pendingPartner) {
            navigation.navigate('PartnerDetail', { partner: pendingPartner });
            setPendingPartner(null);
        }
    }, [isAuthenticated, pendingPartner]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    // ── Filter logic ─────────────────────────────────────────────────────────
    const filteredUsers = users.filter(u => {
        if (u.isVisibleInPartnerSearch === false) return false;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const name = (u.displayName || u.name || '').toLowerCase();
            const bio = (u.bio || '').toLowerCase();
            if (!name.includes(q) && !bio.includes(q)) return false;
        }

        if (activeRole !== 'all') {
            if (activeRole === 'student') {
                if (u.role !== 'student' && u.role !== 'draft-instructor') return false;
            } else {
                if (u.role !== activeRole) return false;
            }
        }

        if (activeGender !== 'all' && u.gender !== activeGender) return false;

        if (activeDanceStyles.length > 0) {
            const userStyles = u.danceStyles || [];
            if (!activeDanceStyles.some(s => userStyles.includes(s))) return false;
        }

        if (activeLevel !== 'all' && u.level !== activeLevel) return false;

        if (activeAgeRange !== 'all' && u.age) {
            const age = Number(u.age);
            if (activeAgeRange === '18-25' && !(age >= 18 && age <= 25)) return false;
            if (activeAgeRange === '26-35' && !(age >= 26 && age <= 35)) return false;
            if (activeAgeRange === '36-45' && !(age >= 36 && age <= 45)) return false;
            if (activeAgeRange === '46+' && !(age >= 46)) return false;
        }

        if (activeCountry !== 'all' && u.country !== activeCountry) return false;
        if (activeCity !== 'all' && u.city !== activeCity) return false;

        return true;
    });

    const availableRoleFilters: Array<'all' | 'student' | 'instructor'> = isVerifiedInstructor
        ? ['all', 'student', 'instructor']
        : ['all', 'student'];

    const openFilters = () => {
        setTempRole(activeRole);
        setTempGender(activeGender);
        setTempDanceStyles([...activeDanceStyles]);
        setTempLevel(activeLevel);
        setTempAgeRange(activeAgeRange);
        setTempCountry(activeCountry);
        setTempCity(activeCity);
        setShowCityList(false);
        setShowFilterModal(true);
    };

    const applyFilters = () => {
        setActiveRole(tempRole);
        setActiveGender(tempGender);
        setActiveDanceStyles([...tempDanceStyles]);
        setActiveLevel(tempLevel);
        setActiveAgeRange(tempAgeRange);
        setActiveCountry(tempCountry);
        setActiveCity(tempCity);
        setShowFilterModal(false);
    };

    const resetFilters = () => {
        setTempRole('all');
        setTempGender('all');
        setTempDanceStyles([]);
        setTempLevel('all');
        setTempAgeRange('all');
        setTempCountry('all');
        setTempCity('all');
        setShowCityList(false);
    };

    const toggleTempDanceStyle = (style: string) => {
        setTempDanceStyles(prev =>
            prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
        );
    };

    const hasActiveFilters =
        activeRole !== 'all' || activeGender !== 'all' ||
        activeDanceStyles.length > 0 || activeLevel !== 'all' ||
        activeAgeRange !== 'all' || activeCountry !== 'all';

    const activeFilterCount =
        (activeRole !== 'all' ? 1 : 0) +
        (activeGender !== 'all' ? 1 : 0) +
        (activeDanceStyles.length > 0 ? 1 : 0) +
        (activeLevel !== 'all' ? 1 : 0) +
        (activeAgeRange !== 'all' ? 1 : 0) +
        (activeCountry !== 'all' ? 1 : 0);

    // Cities for selected country in filter
    const filterCities = tempCountry !== 'all' ? getCitiesForCountry(tempCountry) : [];

    // ── Chip helper ───────────────────────────────────────────────────────────
    const FilterChip = ({
        label, selected, onPress,
    }: { label: string; selected: boolean; onPress: () => void }) => (
        <TouchableOpacity
            style={[
                styles.filterChip,
                { backgroundColor: palette.card, borderColor: palette.border },
                selected && { backgroundColor: palette.primary, borderColor: palette.primary },
            ]}
            onPress={onPress}
        >
            <Text style={[
                styles.filterChipText,
                { color: palette.text.primary },
                selected && { color: '#fff', fontWeight: 'bold' as any },
            ]}>{label}</Text>
        </TouchableOpacity>
    );

    const SectionTitle = ({ label }: { label: string }) => (
        <Text style={[styles.filterSectionTitle, { color: palette.text.primary }]}>{label}</Text>
    );

    const renderUserCard = ({ item, index }: { item: User; index: number }) => {
        const isLeftColumn = index % 2 === 0;
        return (
            <TouchableOpacity
                style={[
                    styles.userCard,
                    {
                        backgroundColor: palette.card,
                        borderColor: palette.border,
                        marginRight: isLeftColumn ? CARD_MARGIN / 2 : 0,
                        marginLeft: isLeftColumn ? 0 : CARD_MARGIN / 2,
                    },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                    if (!isAuthenticated) {
                        Alert.alert(
                            t('partner.loginRequired'),
                            t('partner.loginRequiredDesc'),
                            [
                                { text: t('common.cancel'), style: 'cancel' },
                                {
                                    text: t('partner.login'),
                                    onPress: () => {
                                        setPendingPartner(item);
                                        navigation.navigate('Login');
                                    },
                                },
                            ]
                        );
                    } else {
                        navigation.navigate('PartnerDetail', { partner: item });
                    }
                }}
            >
                {/* Role badge */}
                <View style={[
                    styles.roleBadge,
                    { backgroundColor: item.role === 'instructor' ? colors.instructor.primary + '20' : colors.student.primary + '20' },
                ]}>
                    <Text style={[
                        styles.roleBadgeText,
                        { color: item.role === 'instructor' ? colors.instructor.primary : colors.student.primary },
                    ]}>
                        {item.role === 'instructor' ? t('chat.instructor') : t('chat.student')}
                    </Text>
                </View>

                <Image source={getAvatarSource(item.avatar, item.id)} style={styles.avatar} />

                <Text style={[styles.userName, { color: palette.text.primary }]} numberOfLines={1}>
                    {item.displayName || item.name}
                </Text>

                {/* City + dance styles preview */}
                {(item.city || (item.danceStyles && item.danceStyles.length > 0)) && (
                    <View style={styles.cardMeta}>
                        {item.city && (
                            <View style={styles.cardMetaRow}>
                                <MaterialIcons name="location-on" size={11} color={palette.text.secondary} />
                                <Text style={[styles.cardMetaText, { color: palette.text.secondary }]} numberOfLines={1}>
                                    {item.city}
                                </Text>
                            </View>
                        )}
                        {item.danceStyles && item.danceStyles.length > 0 && (
                            <View style={styles.cardMetaRow}>
                                <MaterialIcons name="music-note" size={11} color={palette.text.secondary} />
                                <Text style={[styles.cardMetaText, { color: palette.text.secondary }]} numberOfLines={1}>
                                    {item.danceStyles.slice(0, 2).join(', ')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {item.bio ? (
                    <Text style={[styles.userBio, { color: palette.text.secondary }]} numberOfLines={2}>
                        {item.bio}
                    </Text>
                ) : null}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: palette.background }]}>
            {/* Search Bar */}
            <View style={styles.searchRowContainer}>
                <View style={[styles.searchContainer, { backgroundColor: palette.card, borderColor: palette.border }]}>
                    <MaterialIcons name="search" size={22} color={palette.text.secondary} />
                    <TextInput
                        style={[styles.searchInput, { color: palette.text.primary }]}
                        placeholder={t('partnerSearch.searchPlaceholder') || 'Partner ara...'}
                        placeholderTextColor={palette.text.secondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="close" size={18} color={palette.text.secondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        { backgroundColor: palette.card, borderColor: palette.border },
                        hasActiveFilters && { borderColor: palette.primary, backgroundColor: palette.primary + '15' },
                    ]}
                    onPress={openFilters}
                >
                    <MaterialIcons name="tune" size={22} color={hasActiveFilters ? palette.primary : palette.text.primary} />
                    {hasActiveFilters && (
                        <View style={[styles.filterBadge, { backgroundColor: palette.primary }]}>
                            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Grid List */}
            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderUserCard}
                numColumns={NUM_COLUMNS}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.primary]} tintColor={palette.primary} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="people-outline" size={48} color={palette.text.secondary + '60'} />
                            <Text style={[styles.emptyText, { color: palette.text.secondary }]}>
                                {t('partnerSearch.noResults') || 'Kimse bulunamadı.'}
                            </Text>
                        </View>
                    ) : null
                }
            />

            {/* ── Filter Modal ──────────────────────────────────────────────────── */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: palette.background, paddingBottom: insets.bottom || spacing.xl }]}>
                        {/* Modal header */}
                        <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                            <TouchableOpacity onPress={resetFilters}>
                                <Text style={[styles.resetText, { color: palette.text.secondary }]}>{t('filters.reset')}</Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: palette.text.primary }]}>{t('filters.title')}</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <MaterialIcons name="close" size={24} color={palette.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>

                            {/* Role */}
                            <SectionTitle label={t('filters.role')} />
                            <View style={styles.chipRow}>
                                {availableRoleFilters.map(r => (
                                    <FilterChip key={r} label={t(`filters.${r}`)} selected={tempRole === r} onPress={() => setTempRole(r)} />
                                ))}
                            </View>

                            {/* Gender */}
                            <SectionTitle label={t('filters.gender')} />
                            <View style={styles.chipRow}>
                                {(['all', 'male', 'female'] as const).map(g => (
                                    <FilterChip key={g} label={t(`filters.${g}`)} selected={tempGender === g} onPress={() => setTempGender(g)} />
                                ))}
                            </View>

                            {/* Dance Styles — multi select */}
                            <SectionTitle label={t('profile.danceStylesLabel')} />
                            <View style={styles.chipRow}>
                                {allDanceStyles.map(style => (
                                    <FilterChip
                                        key={style}
                                        label={style}
                                        selected={tempDanceStyles.includes(style)}
                                        onPress={() => toggleTempDanceStyle(style)}
                                    />
                                ))}
                            </View>

                            {/* Level */}
                            <SectionTitle label={t('profile.levelLabel')} />
                            <View style={styles.chipRow}>
                                <FilterChip label={t('filters.all')} selected={tempLevel === 'all'} onPress={() => setTempLevel('all')} />
                                {DANCE_LEVELS.map(lvl => (
                                    <FilterChip
                                        key={lvl}
                                        label={t(`profile.level${lvl.charAt(0).toUpperCase() + lvl.slice(1)}`)}
                                        selected={tempLevel === lvl}
                                        onPress={() => setTempLevel(tempLevel === lvl ? 'all' : lvl)}
                                    />
                                ))}
                            </View>

                            {/* Age Range */}
                            <SectionTitle label={t('filters.ageRange') || 'Yaş Aralığı'} />
                            <View style={styles.chipRow}>
                                {AGE_RANGES.map(range => (
                                    <FilterChip
                                        key={range.key}
                                        label={range.key === 'all' ? t('filters.all') : range.label}
                                        selected={tempAgeRange === range.key}
                                        onPress={() => setTempAgeRange(range.key)}
                                    />
                                ))}
                            </View>

                            {/* Country */}
                            <SectionTitle label={t('location.countryLabel')} />
                            <View style={[styles.chipRow, { marginBottom: 0 }]}>
                                <FilterChip
                                    label={t('filters.all')}
                                    selected={tempCountry === 'all'}
                                    onPress={() => { setTempCountry('all'); setTempCity('all'); setShowCityList(false); }}
                                />
                                {ALL_COUNTRY_NAMES.slice(0, 6).map(country => (
                                    <FilterChip
                                        key={country}
                                        label={country}
                                        selected={tempCountry === country}
                                        onPress={() => {
                                            setTempCountry(country);
                                            setTempCity('all');
                                            setShowCityList(true);
                                        }}
                                    />
                                ))}
                            </View>
                            {/* More countries accordion */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.xs }}>
                                <View style={[styles.chipRow, { flexWrap: 'nowrap' }]}>
                                    {ALL_COUNTRY_NAMES.slice(6).map(country => (
                                        <FilterChip
                                            key={country}
                                            label={country}
                                            selected={tempCountry === country}
                                            onPress={() => {
                                                setTempCountry(country);
                                                setTempCity('all');
                                                setShowCityList(true);
                                            }}
                                        />
                                    ))}
                                </View>
                            </ScrollView>

                            {/* City — only if country selected */}
                            {showCityList && filterCities.length > 0 && (
                                <>
                                    <SectionTitle label={t('location.cityLabel')} />
                                    <View style={styles.chipRow}>
                                        <FilterChip label={t('filters.all')} selected={tempCity === 'all'} onPress={() => setTempCity('all')} />
                                        {filterCities.map(city => (
                                            <FilterChip
                                                key={city}
                                                label={city}
                                                selected={tempCity === city}
                                                onPress={() => setTempCity(tempCity === city ? 'all' : city)}
                                            />
                                        ))}
                                    </View>
                                </>
                            )}

                            <View style={{ height: spacing.xl }} />
                        </ScrollView>

                        <View style={[styles.modalFooter, { borderTopColor: palette.border }]}>
                            <TouchableOpacity
                                style={[styles.applyButton, { backgroundColor: palette.primary }]}
                                onPress={applyFilters}
                            >
                                <Text style={styles.applyButtonText}>{t('filters.apply')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.md,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        height: 46,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        gap: spacing.xs,
    },
    searchInput: {
        flex: 1,
        fontSize: typography.fontSize.base,
        paddingVertical: 0,
    },
    filterButton: {
        width: 46,
        height: 46,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    filterBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold' as any,
    },
    columnWrapper: {
        paddingHorizontal: spacing.md,
    },
    listContent: {
        paddingTop: spacing.sm,
    },
    userCard: {
        width: CARD_WIDTH,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: CARD_MARGIN,
        padding: spacing.sm,
        alignItems: 'center',
        overflow: 'hidden',
    },
    roleBadge: {
        borderRadius: borderRadius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        marginBottom: spacing.xs,
        alignSelf: 'flex-start',
    },
    roleBadgeText: {
        fontSize: typography.fontSize.xs,
        fontWeight: '600' as any,
    },
    avatar: {
        width: CARD_WIDTH * 0.55,
        height: CARD_WIDTH * 0.55,
        borderRadius: (CARD_WIDTH * 0.55) / 2,
        marginVertical: spacing.sm,
    },
    userName: {
        fontSize: typography.fontSize.base,
        fontWeight: '700' as any,
        textAlign: 'center',
    },
    cardMeta: {
        width: '100%',
        marginTop: 4,
        gap: 2,
    },
    cardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    cardMetaText: {
        fontSize: typography.fontSize.xs,
        flex: 1,
    },
    userBio: {
        fontSize: typography.fontSize.xs,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        gap: spacing.sm,
    },
    emptyText: {
        fontSize: typography.fontSize.base,
    },
    // ── Modal ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: '700' as any,
    },
    resetText: {
        fontSize: typography.fontSize.sm,
    },
    modalScroll: {
        padding: spacing.md,
    },
    filterSectionTitle: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700' as any,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    filterChip: {
        paddingVertical: 7,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    filterChipText: {
        fontSize: typography.fontSize.sm,
    },
    modalFooter: {
        padding: spacing.md,
        borderTopWidth: 1,
    },
    applyButton: {
        paddingVertical: 14,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#ffffff',
        fontWeight: '700' as any,
        fontSize: typography.fontSize.base,
    },
});
