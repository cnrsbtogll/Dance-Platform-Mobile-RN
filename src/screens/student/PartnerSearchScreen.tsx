import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
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
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const name = (u.displayName || u.name || '').toLowerCase();
        const bio = (u.bio || '').toLowerCase();
        return name.includes(q) || bio.includes(q);
    });

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
        <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
            {/* Search Bar */}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.md,
        paddingHorizontal: spacing.md,
        height: 48,
        borderRadius: borderRadius.md,
        borderWidth: 1,
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
});
