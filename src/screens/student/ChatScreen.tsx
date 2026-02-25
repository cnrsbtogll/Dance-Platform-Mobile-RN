import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatNotificationTime } from '../../utils/helpers';
import { getAvatarSource } from '../../utils/imageHelper';
import { NotificationBell } from '../../components/common/NotificationBell';
import { chatService } from '../../services/firebase/chat';
import { Conversation } from '../../types/message';
import { User } from '../../types/user';

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);

  const [conversations, setConversations] = useState<(Conversation & { partner?: User })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsubscribe = chatService.subscribeToConversations(user.id, (data) => {
      setConversations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = (convoId: string) => {
    Alert.alert(
      t('chat.deleteConfirmTitle') || 'Sohbeti Gizle',
      t('chat.deleteConfirmDesc') || 'Bu sohbeti gizlemek istediğinize emin misiniz? Karşı taraf yeni mesaj gönderdiğinde tekrar görünür olur.',
      [
        { text: t('common.cancel') || 'İptal', style: 'cancel' },
        {
          text: t('common.delete') || 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (user) {
              await chatService.deleteConversation(convoId, user.id);
            }
          }
        }
      ]
    );
  };

  const formatMessageTime = (dateString: string): string => {
    return formatNotificationTime(dateString);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={palette.text.primary} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerTitle, { color: palette.text.primary }]}>{t('chat.title')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <NotificationBell role="student" />
        </View>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="chat-bubble-outline"
              size={64}
              color={palette.text.secondary + '80'}
            />
            <Text style={[styles.emptyStateTitle, { color: palette.text.primary }]}>{t('chat.noChats')}</Text>
            <Text style={[styles.emptyStateText, { color: palette.text.secondary }]}>
              {t('chat.noChatsDescription') || 'Henüz kimseyle mesajlaşmadınız. Partner bul sayfasından yeni bir sohbete başlayabilirsiniz.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: palette.primary }]}
              onPress={() => (navigation as any).navigate('PartnerSearch')}
            >
              <Text style={styles.emptyStateButtonText}>{t('chat.findInstructor') || 'Partner Bul'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.conversationsList}>
            {conversations.map((conversation) => {
              const partnerName = conversation.partner?.displayName || conversation.partner?.name || t('chat.user');
              const partnerRole = conversation.partner?.role;
              const unreadCount = conversation.unreadCount?.[user?.id || ''] || 0;
              const isInstructor = partnerRole === 'instructor';

              let roleTitle = t('chat.student');
              if (partnerRole === 'instructor') roleTitle = t('chat.instructor');
              if (partnerRole === 'school') roleTitle = 'Okul';

              const roleColor = isInstructor ? colors.instructor.primary : palette.text.secondary;

              return (
                <TouchableOpacity
                  key={conversation.id}
                  style={[styles.conversationItem, { backgroundColor: palette.card }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    const parentData = {
                      conversationId: conversation.id,
                      userId: conversation.partner?.id,
                    };
                    // Navigate to details
                    (navigation as any).getParent()?.navigate('ChatDetail', parentData);
                  }}
                  onLongPress={() => handleDelete(conversation.id)}
                >
                  <View style={styles.conversationContent}>
                    <View style={styles.avatarContainer}>
                      <Image
                        source={getAvatarSource(conversation.partner?.avatar, conversation.partner?.id)}
                        style={styles.avatar}
                      />
                    </View>
                    <View style={styles.messageInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.userName, { color: palette.text.primary }]} numberOfLines={1}>
                          {partnerName}
                        </Text>
                        <Text style={{ fontSize: 10, color: roleColor, borderWidth: 1, borderColor: roleColor, paddingHorizontal: 4, borderRadius: 4 }}>
                          {roleTitle}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.lastMessage,
                          { color: unreadCount > 0 ? palette.text.primary : palette.text.secondary },
                          unreadCount > 0 && { fontWeight: typography.fontWeight.bold }
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.lastMessageSenderId === user?.id ? 'Sen: ' : ''}
                        {conversation.lastMessage}
                      </Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <Text style={[styles.timeText, { color: unreadCount > 0 ? palette.primary : palette.text.secondary }]}>
                        {formatMessageTime(conversation.lastMessageAt)}
                      </Text>
                      {unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: palette.primary }]}>
                          <Text style={styles.unreadBadgeText}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    flexShrink: 0,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupAvatar: {
    backgroundColor: colors.student.primary,
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
    backgroundColor: colors.student.primary,
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
    backgroundColor: colors.student.primary,
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
    backgroundColor: colors.student.primary,
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
