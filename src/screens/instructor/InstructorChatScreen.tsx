import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { MockDataService } from '../../services/mockDataService';
import { useAuthStore } from '../../store/useAuthStore';
import { formatDate } from '../../utils/helpers';

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

export const InstructorChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  // Get conversations for current user (instructor)
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
          userName: partner.role === 'student' 
            ? `Öğrenci - ${partner.name}`
            : `${partner.name} - ${MockDataService.getLessonsByInstructor(partnerId)[0]?.category || 'Eğitmen'} Eğitmeni`,
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
  }, [user]);

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } else if (diffDays === 1) {
      return 'Dün';
    } else if (diffDays < 7) {
      const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      return days[date.getDay()];
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="search" size={24} color={colors.instructor.text.lightPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="add-comment" size={24} color={colors.instructor.text.lightPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons 
              name="chat-bubble-outline" 
              size={64} 
              color={colors.instructor.text.lightSecondary + '80'} 
            />
            <Text style={styles.emptyStateTitle}>Henüz mesaj yok</Text>
            <Text style={styles.emptyStateText}>
              Öğrencilerinizle iletişime geçmek için mesajlarınızı buradan takip edebilirsiniz.
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsList}>
            {conversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                style={styles.conversationItem}
                activeOpacity={0.7}
                onPress={() => {
                  (navigation as any).navigate('ChatDetail', {
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
                        {conversation.userAvatar ? (
                          <Image
                            source={{ uri: conversation.userAvatar }}
                            style={styles.avatar}
                          />
                        ) : (
                          <View style={[styles.avatar, styles.placeholderAvatar]}>
                            <MaterialIcons name="person" size={32} color={colors.instructor.text.lightSecondary} />
                          </View>
                        )}
                        {conversation.isOnline && (
                          <View style={styles.onlineIndicator} />
                        )}
                      </>
                    )}
                  </View>
                  <View style={styles.messageInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {conversation.userName}
                    </Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {conversation.lastMessage}
                    </Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
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
    backgroundColor: colors.instructor.background.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    backgroundColor: colors.instructor.background.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.instructor.border.light,
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
    color: colors.instructor.text.lightPrimary,
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
    backgroundColor: colors.instructor.card.light,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    minHeight: 72,
    ...shadows.sm,
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
  placeholderAvatar: {
    backgroundColor: colors.instructor.background.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatar: {
    backgroundColor: colors.instructor.secondary,
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
    borderColor: colors.instructor.card.light,
  },
  messageInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.instructor.text.lightPrimary,
  },
  lastMessage: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.instructor.text.lightSecondary,
  },
  timeContainer: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    color: colors.instructor.text.lightSecondary,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.instructor.secondary,
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
    color: colors.instructor.text.lightPrimary,
    marginTop: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    color: colors.instructor.text.lightSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 300,
  },
});

