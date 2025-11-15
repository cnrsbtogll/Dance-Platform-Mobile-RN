import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { MockDataService } from '../../services/mockDataService';
import { useAuthStore } from '../../store/useAuthStore';
import { formatDate, formatNotificationTime } from '../../utils/helpers';

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isGroup?: boolean;
  groupName?: string;
}

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);

  // Get conversations for current user
  const conversations = useMemo(() => {
    if (!user) return [];

    const messages = MockDataService.getMessages();
    const conversationMap = new Map<string, Conversation>();

    // Get all unique conversation partners
    messages.forEach((message) => {
      const partnerId = message.senderId === user.id ? message.receiverId : message.senderId;
      const partner = MockDataService.getUserById(partnerId);
      
      if (!partner) return;

      const conversationId = [user.id, partnerId].sort().join('_');
      
      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          userId: partnerId,
          userName: partner.role === 'instructor' 
            ? `${partner.name} - ${MockDataService.getLessonsByInstructor(partnerId)[0]?.category || t('chat.instructor')} ${t('chat.instructorSuffix')}`
            : `${t('chat.student')} - ${partner.name}`,
          userAvatar: partner.avatar || '',
          lastMessage: message.message,
          lastMessageTime: message.createdAt,
          unreadCount: 0,
          isOnline: Math.random() > 0.5, // Mock online status
        });
      } else {
        const conv = conversationMap.get(conversationId)!;
        const messageTime = new Date(message.createdAt);
        const lastTime = new Date(conv.lastMessageTime);
        
        if (messageTime > lastTime) {
          conv.lastMessage = message.message;
          conv.lastMessageTime = message.createdAt;
        }
        
        if (!message.isRead && message.receiverId === user.id) {
          conv.unreadCount++;
        }
      }
    });

    // Sort by last message time
    return Array.from(conversationMap.values()).sort((a, b) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
  }, [user, t]);

  const formatMessageTime = (dateString: string): string => {
    return formatNotificationTime(dateString);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="search" size={24} color={palette.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text.primary }]}>{t('chat.title')}</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="add-comment" size={24} color={palette.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons 
              name="chat-bubble-outline" 
              size={64} 
              color={palette.text.secondary + '80'} 
            />
            <Text style={[styles.emptyStateTitle, { color: palette.text.primary }]}>{t('chat.noChats')}</Text>
            <Text style={[styles.emptyStateText, { color: palette.text.secondary }]}>
              {t('chat.noChatsDescription')}
            </Text>
            <TouchableOpacity style={styles.emptyStateButton}>
              <Text style={styles.emptyStateButtonText}>{t('chat.findInstructor')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.conversationsList}>
            {conversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                style={[styles.conversationItem, { backgroundColor: palette.card }]}
                activeOpacity={0.7}
                onPress={() => {
                  (navigation as any).getParent()?.navigate('ChatDetail', {
                    conversationId: conversation.id,
                    userId: conversation.userId,
                  });
                }}
              >
                <View style={styles.conversationContent}>
                  <View style={styles.avatarContainer}>
                    {conversation.isGroup ? (
                      <View style={[styles.avatar, styles.groupAvatar]}>
                        <MaterialIcons name="groups" size={32} color="#ffffff" />
                      </View>
                    ) : (
                      <>
                        <Image
                          source={{ uri: conversation.userAvatar }}
                          style={styles.avatar}
                        />
                        {conversation.isOnline && (
                          <View style={[styles.onlineIndicator, { borderColor: palette.card }]} />
                        )}
                      </>
                    )}
                  </View>
                  <View style={styles.messageInfo}>
                    <Text style={[styles.userName, { color: palette.text.primary }]} numberOfLines={1}>
                      {conversation.userName}
                    </Text>
                    <Text style={[styles.lastMessage, { color: palette.text.secondary }]} numberOfLines={1}>
                      {conversation.lastMessage}
                    </Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={[styles.timeText, { color: palette.text.secondary }]}>
                      {formatMessageTime(conversation.lastMessageTime)}
                    </Text>
                    {conversation.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: -0.015,
  },
  scrollView: {
    flex: 1,
  },
  conversationsList: {
    padding: spacing.xs,
    gap: spacing.xs,
  },
  conversationItem: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    minHeight: 72,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupAvatar: {
    backgroundColor: '#1ABC9C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1ABC9C',
    borderWidth: 2,
  },
  messageInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  timeContainer: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1ABC9C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl * 2,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 300,
  },
  emptyStateButton: {
    marginTop: spacing.lg,
    backgroundColor: '#1ABC9C',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  emptyStateButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
});
