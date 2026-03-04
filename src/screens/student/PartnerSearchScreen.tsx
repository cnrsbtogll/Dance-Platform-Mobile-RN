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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = spacing.sm;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.md * 2 - CARD_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export const PartnerSearchScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useThemeStore();
    const { user: currentUser, isAuthenticated } = useAuthStore();
    const [pendingPartner, setPendingPartner] = useState<User | null>(null);
    const role = currentUser?.role === 'admin' || currentUser?.role === 'draft-instructor' || currentUser?.role === 'draft-school' ? 'student' : currentUser?.role || 'student';
    const palette = getPalette(role, isDarkMode);

    // Role-based visibility scoping:
    // instructor → sees everyone (student, instructor, draft-instructor)
    // student / draft-instructor / others → sees only student + draft-instructor
    const isVerifiedInstructor = currentUser?.role === 'instructor';
    const visibleRoles = isVerifiedInstructor
        ? ['student', 'instructor', 'draft-instructor']
        : ['student', 'draft-instructor'];

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter States
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeRole, setActiveRole] = useState<'all' | 'student' | 'instructor'>('all');
    const [activeGender, setActiveGender] = useState<'all' | 'male' | 'female' | 'other'>('all');

    // Temp Filter States (for Modal)
    const [tempRole, setTempRole] = useState<'all' | 'student' | 'instructor'>('all');
    const [tempGender, setTempGender] = useState<'all' | 'male' | 'female' | 'other'>('all');

    const fetchUsers = async () => {
        try {
            const usersRef = collection(db, 'users');
            // Scope query based on the viewer's role:
            // Verified instructors see all roles; students/draft-instructors see only student-tier roles.
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
                        danceStyles: data.danceStyles || [],
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
        // Re-fetch when user id or role changes (e.g. after login or role promotion)
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

    const handleOpenChat = (targetUser: User) => {
        if (!currentUser) {
            navigation.navigate('Login');
            return;
        }
        navigation.navigate('ChatDetail', {
            targetUserId: targetUser.id,
            targetUserName: targetUser.displayName || targetUser.name,
            targetUserAvatar: targetUser.avatar,
            isNewChat: true,
        });
    };

    const filteredUsers = users.filter(u => {
        // Respect visibility preference; users without the field are treated as visible (default true)
        if (u.isVisibleInPartnerSearch === false) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const name = (u.displayName || u.name || '').toLowerCase();
            const bio = (u.bio || '').toLowerCase();
            if (!name.includes(q) && !bio.includes(q)) return false;
        }
        if (activeRole !== 'all') {
            // When filtering by 'student', also include draft-instructors (they appear as students)
            if (activeRole === 'student') {
                if (u.role !== 'student' && u.role !== 'draft-instructor') return false;
            } else {
                if (u.role !== activeRole) return false;
            }
        }
        if (activeGender !== 'all' && u.gender !== activeGender) return false;
        return true;
    });

    // Filter modal role options: instructors can filter by 'instructor', students cannot
    const availableRoleFilters: Array<'all' | 'student' | 'instructor'> = isVerifiedInstructor
        ? ['all', 'student', 'instructor']
        : ['all', 'student'];

    const openFilters = () => {
        setTempRole(activeRole);
        setTempGender(activeGender);
        setShowFilterModal(true);
    };

    const applyFilters = () => {
        setActiveRole(tempRole);
        setActiveGender(tempGender);
        setShowFilterModal(false);
    };

    const resetFilters = () => {
        setTempRole('all');
        setTempGender('all');
    };

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
                    }
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
                                    }
                                }
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
                    { backgroundColor: item.role === 'instructor' ? colors.instructor.primary + '20' : item.role === 'school' ? colors.school.primary + '20' : colors.student.primary + '20' }
                ]}>
                    <Text style={[
                        styles.roleBadgeText,
                        { color: item.role === 'instructor' ? colors.instructor.primary : item.role === 'school' ? colors.school.primary : colors.student.primary }
                    ]}>
                        {/* draft-instructor users appear as students in the listing */}
                        {item.role === 'instructor' ? t('chat.instructor') : item.role === 'school' ? t('chat.school') : t('chat.student')}
                    </Text>
                </View>

                {/* Avatar */}
                <Image
                    source={getAvatarSource(item.avatar, item.id)}
                    style={styles.avatar}
                />

                {/* Name */}
                <Text style={[styles.userName, { color: palette.text.primary }]} numberOfLines={1}>
                    {item.displayName || item.name}
                </Text>

                {/* Bio */}
                {item.bio ? (
                    <Text style={[styles.userBio, { color: palette.text.secondary }]} numberOfLines={2}>
                        {item.bio}
                    </Text>
                ) : null}
            </TouchableOpacity>
        );
    };

    const hasActiveFilters = activeRole !== 'all' || activeGender !== 'all';

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
                        hasActiveFilters && { borderColor: palette.primary, backgroundColor: palette.primary + '15' }
                    ]}
                    onPress={openFilters}
                >
                    <MaterialIcons
                        name="tune"
                        size={22}
                        color={hasActiveFilters ? palette.primary : palette.text.primary}
                    />
                    {hasActiveFilters && <View style={[styles.filterDot, { backgroundColor: palette.primary }]} />}
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

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: palette.background, paddingBottom: insets.bottom || spacing.xl }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                            <TouchableOpacity onPress={resetFilters}>
                                <Text style={[styles.resetText, { color: palette.text.secondary }]}>
                                    {t('filters.reset')}
                                </Text>
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: palette.text.primary }]}>
                                {t('filters.title')}
                            </Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <MaterialIcons name="close" size={24} color={palette.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            {/* Role Filter */}
                            <Text style={[styles.filterSectionTitle, { color: palette.text.primary }]}>
                                {t('filters.role')}
                            </Text>
                            <View style={styles.filterOptionsContainer}>
                                {availableRoleFilters.map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[
                                            styles.filterOptionButton,
                                            { backgroundColor: palette.card, borderColor: palette.border },
                                            tempRole === status && { backgroundColor: palette.primary, borderColor: palette.primary }
                                        ]}
                                        onPress={() => setTempRole(status)}
                                    >
                                        <Text
                                            style={[
                                                styles.filterOptionText,
                                                { color: palette.text.primary },
                                                tempRole === status && { color: '#FFFFFF', fontWeight: 'bold' }
                                            ]}
                                        >
                                            {t(`filters.${status}`)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Gender Filter */}
                            <Text style={[styles.filterSectionTitle, { color: palette.text.primary, marginTop: spacing.xl }]}>
                                {t('filters.gender')}
                            </Text>
                            <View style={styles.filterOptionsContainer}>
                                {(['all', 'male', 'female'] as const).map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.filterOptionButton,
                                            { backgroundColor: palette.card, borderColor: palette.border },
                                            tempGender === g && { backgroundColor: palette.primary, borderColor: palette.primary }
                                        ]}
                                        onPress={() => setTempGender(g)}
                                    >
                                        <Text
                                            style={[
                                                styles.filterOptionText,
                                                { color: palette.text.primary },
                                                tempGender === g && { color: '#FFFFFF', fontWeight: 'bold' }
                                            ]}
                                        >
                                            {t(`filters.${g}`)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
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
    container: {
        flex: 1,
    },
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
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        marginLeft: spacing.sm,
        fontSize: typography.fontSize.sm,
    },
    filterButton: {
        width: 46,
        height: 46,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    filterDot: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
    },
    columnWrapper: {
        marginBottom: CARD_MARGIN,
    },
    // GRID CARD
    userCard: {
        width: CARD_WIDTH,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        padding: spacing.md,
        alignItems: 'center',
        overflow: 'hidden',
    },
    roleBadge: {
        alignSelf: 'flex-end',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        marginBottom: spacing.sm,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        marginBottom: spacing.sm,
    },
    userName: {
        fontSize: typography.fontSize.sm,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
    },
    userBio: {
        fontSize: typography.fontSize.xs,
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: spacing.sm,
        minHeight: 32,
    },
    messageCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.full,
        marginTop: 'auto',
    },
    messageCtaText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    emptyContainer: {
        paddingTop: 80,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    emptyText: {
        fontSize: typography.fontSize.base,
        textAlign: 'center',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    resetText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
    },
    modalScroll: {
        padding: spacing.md,
    },
    filterSectionTitle: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
        marginBottom: spacing.md,
    },
    filterOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    filterOptionButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        borderWidth: 1,
    },
    filterOptionText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    modalFooter: {
        padding: spacing.md,
        borderTopWidth: 1,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    },
    applyButton: {
        height: 56,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
});
