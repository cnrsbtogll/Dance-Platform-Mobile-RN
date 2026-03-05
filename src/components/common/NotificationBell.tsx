import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { getPalette, typography, borderRadius } from '../../utils/theme';

interface NotificationBellProps {
    role: 'student' | 'instructor' | 'school';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ role }) => {
    const navigation = useNavigation();
    const { unreadCount } = useNotificationStore();
    const { isDarkMode } = useThemeStore();
    const palette = getPalette(role, isDarkMode);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => (navigation as any).navigate('Notification')}
        >
            <MaterialIcons name="notifications-none" size={26} color={palette.text.primary} />
            {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeContainer: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#FF3B30',
        borderRadius: borderRadius.full,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: typography.fontWeight.bold,
    },
});
