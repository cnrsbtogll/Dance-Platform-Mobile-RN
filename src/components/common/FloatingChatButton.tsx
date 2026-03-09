import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { getPalette, shadows, typography } from '../../utils/theme';
import { chatService } from '../../services/firebase/chat';

interface FloatingChatButtonProps {
    role: 'student' | 'instructor' | 'school';
    unreadCount?: number;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ role, unreadCount = 0 }) => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette(role, isDarkMode);

    const [localUnreadCount, setLocalUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.id) {
            setLocalUnreadCount(0);
            return;
        }

        const unsubscribe = chatService.subscribeToConversations(user.id, (data) => {
            let count = 0;
            data.forEach(convo => {
                const convoUnread = convo.unreadCount?.[user.id] || 0;
                if (convoUnread > 0) {
                    count++; // Sohbet (conversation) bazlı badge: Okunmamış mesajı olan KULLANICI / SOHBET sayısı
                }
            });
            setLocalUnreadCount(count);
        });

        return () => unsubscribe();
    }, [user?.id]);

    const handlePress = () => {
        if (!user) {
            // Require login
            // Actually we just navigate to Login via ChatScreen handling or directly
            // Here we assume ChatScreen handles the auth guard or we handle it here
            navigation.navigate('Login', { mode: 'login' });
            return;
        }
        navigation.navigate('Chat');
    };

    const finalUnreadCount = unreadCount > 0 ? unreadCount : localUnreadCount;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: role === 'instructor' ? palette.secondary : palette.primary, bottom: insets.bottom + 80 },
                shadows.md
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <MaterialIcons name="chat-bubble" size={24} color="#FFFFFF" />
            {finalUnreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{finalUnreadCount > 99 ? '99+' : finalUnreadCount}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.bold,
    },
});
