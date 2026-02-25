import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, TextInput, Modal, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { colors, spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { User } from '../../types';
import { getAvatarSource } from '../../utils/imageHelper';

export const PartnerSearchScreen: React.FC = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { isDarkMode } = useThemeStore();
    const { user: currentUser } = useAuthStore();
    const role = currentUser?.role === 'admin' || currentUser?.role === 'draft-instructor' || currentUser?.role === 'draft-school' ? 'student' : currentUser?.role || 'student';
    const palette = getPalette(role, isDarkMode);

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
            // Fetch students and instructors. 
            // Firestore 'in' query works for up to 10 values.
            const q = query(usersRef, where('role', 'in', ['student', 'instructor']));
            const querySnapshot = await getDocs(q);

            const fetchedUsers: User[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as User;
                // Don't show current user
                if (data.id !== currentUser?.id) {
                    fetchedUsers.push({ ...data, id: doc.id });
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
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const handleStartChat = (targetUser: User) => {
        if (!currentUser) {
            navigation.navigate('Login');
            return;
        }
        // Navigate to ChatDetail with target user params
        navigation.navigate('ChatDetail', {
            chatId: `temp_${Date.now()}`, // Temporary or let ChatDetail create it
            targetUserId: targetUser.id,
            targetUserName: targetUser.displayName || targetUser.name,
            targetUserAvatar: targetUser.avatar,
            isNewChat: true,
        });
    };

    const filteredUsers = users.filter(u => {
        // Search Query
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const name = (u.displayName || u.name || '').toLowerCase();
            const bio = (u.bio || '').toLowerCase();
            if (!name.includes(q) && !bio.includes(q)) return false;
        }

        // Filters
        if (activeRole !== 'all' && u.role !== activeRole) return false;
        if (activeGender !== 'all' && u.gender !== activeGender) return false;

        return true;
    });

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

    const renderUserItem = ({ item }: { item: User }) => {
        return (
            <View style={[styles.userCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Image
                    source={getAvatarSource(item.avatar)}
                    style={styles.avatar}
                />
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: palette.text.primary }]}>
                        {item.displayName || item.name}
                    </Text>
                    <Text style={[styles.userRole, { color: palette.text.secondary }]}>
                        {item.role === 'instructor' ? 'Eğitmen' : 'Öğrenci'}
                    </Text>
                    {item.bio ? (
                        <Text style={[styles.userBio, { color: palette.text.secondary }]} numberOfLines={2}>
                            {item.bio}
                        </Text>
                    ) : null}
                </View>
                <TouchableOpacity
                    style={[styles.chatBtn, { backgroundColor: palette.primary }]}
                    onPress={() => handleStartChat(item)}
                >
                    <MaterialIcons name="chat-bubble-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: palette.background }]}>
            {/* Search Bar */}
            <View style={styles.searchRowContainer}>
                <View style={[styles.searchContainer, { backgroundColor: palette.card, borderColor: palette.border }]}>
                    <MaterialIcons name="search" size={24} color={palette.text.secondary} />
                    <TextInput
                        style={[styles.searchInput, { color: palette.text.primary }]}
                        placeholder={t('navigation.partnerSearch') + "..."}
                        placeholderTextColor={palette.text.secondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="close" size={20} color={palette.text.secondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Button */}
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        { backgroundColor: palette.card, borderColor: palette.border },
                        (activeRole !== 'all' || activeGender !== 'all') && { borderColor: palette.primary, backgroundColor: palette.primary + '10' }
                    ]}
                    onPress={openFilters}
                >
                    <MaterialIcons
                        name="tune"
                        size={24}
                        color={(activeRole !== 'all' || activeGender !== 'all') ? palette.primary : palette.text.primary}
                    />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderUserItem}
                contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.primary]} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: palette.text.secondary }]}>
                                Kimse bulunamadı.
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
                                {['all', 'student', 'instructor'].map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[
                                            styles.filterOptionButton,
                                            { backgroundColor: palette.card, borderColor: palette.border },
                                            tempRole === status && [styles.filterOptionActive, { backgroundColor: palette.primary, borderColor: palette.primary }]
                                        ]}
                                        onPress={() => setTempRole(status as any)}
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
                                {['all', 'male', 'female'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.filterOptionButton,
                                            { backgroundColor: palette.card, borderColor: palette.border },
                                            tempGender === g && [styles.filterOptionActive, { backgroundColor: palette.primary, borderColor: palette.primary }]
                                        ]}
                                        onPress={() => setTempGender(g as any)}
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
        paddingHorizontal: spacing.md,
        height: 48,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginRight: spacing.sm,
    },
    filterButton: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchInput: {
        flex: 1,
        height: '100%',
        marginLeft: spacing.sm,
        fontSize: typography.fontSize.base,
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: spacing.md,
    },
    userInfo: {
        flex: 1,
        marginRight: spacing.sm,
    },
    userName: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
    },
    userRole: {
        fontSize: typography.fontSize.xs,
        marginTop: 2,
        marginBottom: 4,
    },
    userBio: {
        fontSize: typography.fontSize.sm,
    },
    chatBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: typography.fontSize.base,
    },
    // Modal Styles
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
    filterOptionActive: {
        // Active color specific styles are applied inline
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
