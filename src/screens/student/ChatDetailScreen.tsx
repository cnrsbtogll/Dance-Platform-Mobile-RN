import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { FirestoreService } from '../../services/firebase/firestore';
import { chatService, getConversationId } from '../../services/firebase/chat';
import { useAuthStore } from '../../store/useAuthStore';
import { formatNotificationTime } from '../../utils/helpers';
import { getAvatarSource } from '../../utils/imageHelper';
import { User } from '../../types/user';
import { Message } from '../../types/message';

interface HeaderTitleProps {
  partner: User | null;
  palette: ReturnType<typeof getPalette>;
  t: (key: string) => string;
}

// Create HeaderTitle component outside ChatDetailScreen to avoid closure issues
const HeaderTitle: React.FC<HeaderTitleProps> = ({ partner, palette, t }) => {
  if (!partner) return <Text style={[styles.headerName, { color: palette.text.primary }]}>{t('chat.user')}</Text>;

  return (
    <View style={styles.headerTitleContainer}>
      <Image
        source={getAvatarSource(partner.avatar, partner.id)}
        style={styles.headerAvatar}
      />
      <View style={styles.headerTitleText}>
        <Text style={[styles.headerName, { color: palette.text.primary }]} numberOfLines={1}>
          {partner.displayName || partner.name || t('chat.user')}
        </Text>
        <Text style={[styles.headerStatus, { color: palette.text.secondary }]} numberOfLines={1}>
          {partner.role === 'instructor' ? t('chat.instructor') : partner.role === 'school' ? t('chat.school') : t('chat.student')}
        </Text>
      </View>
    </View>
  );
};

export const ChatDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const params = route.params as { conversationId?: string; userId?: string; targetUserId?: string; chatId?: string; } | undefined;
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const role: 'student' | 'instructor' | 'school' = (user?.role === 'admin' || user?.role === 'draft-school' || user?.role === 'school') ? 'school' : (user?.role === 'draft-instructor' || user?.role === 'instructor') ? 'instructor' : 'student';
  const palette = getPalette(role, isDarkMode);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const conversationIdParam = params?.conversationId || params?.chatId;
  const initialPartnerId = params?.userId || params?.targetUserId || (conversationIdParam ? conversationIdParam.split('_').find(id => id !== user?.id) : null);
  const partnerId = initialPartnerId;
  const conversationId = conversationIdParam?.startsWith('temp_') ? '' : (conversationIdParam || (user?.id && partnerId ? getConversationId(user.id, partnerId) : ''));

  const [partner, setPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Count consecutive sent messages at the end without a partner reply
  const consecutiveUnreplied = useMemo(() => {
    if (!user) return 0;
    let count = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === user.id) {
        count++;
      } else {
        // Partner replied — reset streak
        break;
      }
    }
    return count;
  }, [messages, user]);

  const isMessageBlocked = consecutiveUnreplied >= 3;

  // Fetch partner info
  useEffect(() => {
    if (partnerId) {
      FirestoreService.getUserById(partnerId).then((fetchedUser) => {
        if (fetchedUser) setPartner(fetchedUser as User);
      });
    }
  }, [partnerId]);

  // Subscribe to messages
  useEffect(() => {
    if (!user || !conversationId) return;

    setLoadingMessages(true);
    const unsubscribe = chatService.subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [user, conversationId]);

  // Mark as read when entering or messages update
  useFocusEffect(
    React.useCallback(() => {
      if (user && conversationId && messages.length > 0) {
        chatService.markAsRead(conversationId, user.id);
      }
    }, [user, conversationId, messages.length])
  );

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, [messages.length]);

  // Update header when screen is focused or partner changes
  const updateHeader = React.useCallback(() => {
    navigation.setOptions({
      headerBackTitle: '',
      headerTintColor: palette.text.primary,
      headerStyle: {
        backgroundColor: palette.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
      },
      headerTitle: () => <HeaderTitle partner={partner} palette={palette} t={t} />,
      headerTitleAlign: 'left',
      headerTitleContainerStyle: {
        marginLeft: Platform.OS === 'ios' ? 0 : -10,
        flex: 1
      },
    });
  }, [navigation, partner, palette, t]);

  useLayoutEffect(() => {
    updateHeader();
  }, [updateHeader]);

  useFocusEffect(
    React.useCallback(() => {
      updateHeader();
    }, [updateHeader])
  );

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return t('chat.now');
    } else if (diffMinutes < 60) {
      return t('chat.minutesAgo', { count: diffMinutes });
    } else if (diffHours < 24) {
      return t('chat.hoursAgo', { count: diffHours });
    } else if (diffDays === 1) {
      return t('common.yesterday');
    } else if (diffDays < 7) {
      const dayNames = [
        t('common.days.sunday'),
        t('common.days.monday'),
        t('common.days.tuesday'),
        t('common.days.wednesday'),
        t('common.days.thursday'),
        t('common.days.friday'),
        t('common.days.saturday'),
      ];
      return dayNames[date.getDay()];
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}.${month}`;
    }
  };

  const formatMessageDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('common.today');
    } else if (diffDays === 1) {
      return t('common.yesterday');
    } else {
      const dayNames = [
        t('common.days.sunday'),
        t('common.days.monday'),
        t('common.days.tuesday'),
        t('common.days.wednesday'),
        t('common.days.thursday'),
        t('common.days.friday'),
        t('common.days.saturday'),
      ];
      const dayName = dayNames[date.getDay()];
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${dayName}, ${day}.${month}`;
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage: Message | null): boolean => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt);
    const previousDate = new Date(previousMessage.createdAt);

    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user || !partnerId || isMessageBlocked) return;

    const messageToSend = inputText.trim();
    setInputText('');

    try {
      await chatService.sendMessage(user.id, partnerId, messageToSend);
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  if (!partnerId) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: palette.text.primary }]}>{t('chat.userNotFound')}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: palette.primary }]}>{t('chat.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={[styles.messagesContainer, { backgroundColor: palette.background }]}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingMessages ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="chat-bubble-outline"
                size={64}
                color={palette.text.secondary + '80'}
              />
              <Text style={[styles.emptyStateText, { color: palette.text.secondary }]}>
                {t('chat.noMessages')}
              </Text>
            </View>
          ) : (
            messages.map((message, index) => {
              const isSent = message.senderId === user?.id;
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <View style={styles.dateSeparator}>
                      <Text style={[styles.dateSeparatorText, { color: palette.text.secondary, backgroundColor: palette.background }]}>
                        {formatMessageDate(message.createdAt)}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageWrapper,
                      isSent ? styles.messageWrapperSent : styles.messageWrapperReceived,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isSent ? { backgroundColor: palette.primary } : { backgroundColor: palette.card },
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isSent ? styles.messageTextSent : { color: palette.text.primary },
                        ]}
                      >
                        {message.message}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          isSent ? styles.messageTimeSent : { color: palette.text.secondary },
                        ]}
                      >
                        {formatMessageTime(message.createdAt)}
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              );
            })
          )}
        </ScrollView>

        {/* Input Area */}
        <SafeAreaView edges={['bottom']} style={[styles.inputSafeArea, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
          {isMessageBlocked && (
            <View style={[styles.blockedBanner, { backgroundColor: palette.primary + '18', borderBottomColor: palette.border }]}>
              <MaterialIcons name="info-outline" size={16} color={palette.primary} />
              <Text style={[styles.blockedBannerText, { color: palette.primary }]}>
                {t('chat.messageLimit') || '3 mesaj gönderdiniz ve yanıt bekliyorsunuz. Karşı taraf yanıt verince yazabilirsiniz.'}
              </Text>
            </View>
          )}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton} disabled={isMessageBlocked}>
              <MaterialIcons
                name="attach-file"
                size={24}
                color={isMessageBlocked ? palette.text.secondary + '40' : palette.text.secondary}
              />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: palette.card, color: palette.text.primary },
                isMessageBlocked && { opacity: 0.5 }
              ]}
              placeholder={isMessageBlocked
                ? (t('chat.waitingReply') || 'Yanıt bekleniyor...')
                : t('chat.typeMessage')
              }
              placeholderTextColor={palette.text.secondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isMessageBlocked}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: (!isMessageBlocked && inputText.trim()) ? palette.primary : palette.card },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isMessageBlocked}
            >
              <MaterialIcons
                name="send"
                size={24}
                color={(!isMessageBlocked && inputText.trim()) ? '#ffffff' : palette.text.secondary + '60'}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingBottom: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexShrink: 0,
  },
  headerTitleText: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  headerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  headerStatus: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  headerRemoveText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dateSeparatorText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  messageWrapper: {
    marginBottom: spacing.xs,
  },
  messageWrapperSent: {
    alignItems: 'flex-end',
  },
  messageWrapperReceived: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },
  messageTextSent: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  messageTimeSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputSafeArea: {
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl * 2,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.md,
  },
  backButton: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  blockedBannerText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 16,
  },
});

