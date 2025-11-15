import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { MockDataService } from '../../services/mockDataService';
import { useAuthStore } from '../../store/useAuthStore';
import { formatNotificationTime } from '../../utils/helpers';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  lessonId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const ChatDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const params = route.params as { conversationId?: string; userId?: string } | undefined;
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  
  const conversationId = params?.conversationId;
  const partnerId = params?.userId || (conversationId ? conversationId.split('_').find(id => id !== user?.id) : null);
  
  const partner = partnerId ? MockDataService.getUserById(partnerId) : null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (!user || !partnerId) return;

    // Get all messages between current user and partner
    const allMessages = MockDataService.getMessages();
    const conversationMessages = allMessages
      .filter(msg => 
        (msg.senderId === user.id && msg.receiverId === partnerId) ||
        (msg.senderId === partnerId && msg.receiverId === user.id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    setMessages(conversationMessages);
  }, [user, partnerId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (!partner) return;
    
    navigation.setOptions({
      headerBackTitle: '',
      headerTintColor: palette.text.primary,
      headerStyle: {
        backgroundColor: palette.background,
      },
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Image
            source={{ uri: partner.avatar || '' }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerTitleText}>
            <Text style={[styles.headerName, { color: palette.text.primary }]} numberOfLines={1}>
              {partner.name}
            </Text>
            <Text style={[styles.headerStatus, { color: palette.text.secondary }]} numberOfLines={1}>
              {partner.role === 'instructor' ? t('chat.instructor') : t('chat.online')}
            </Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {}}
        >
          <MaterialIcons
            name="more-vert"
            size={24}
            color={palette.text.primary}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, partner, palette, t]);

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

  const handleSend = () => {
    if (!inputText.trim() || !user || !partnerId) return;

    const newMessage: Message = {
      id: `message_${Date.now()}`,
      senderId: user.id,
      receiverId: partnerId,
      message: inputText.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  if (!partner) {
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={[styles.messagesContainer, { backgroundColor: palette.background }]}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
        {messages.length === 0 ? (
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
          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            <TouchableOpacity style={styles.attachButton}>
              <MaterialIcons
                name="attach-file"
                size={24}
                color={palette.text.secondary}
              />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { backgroundColor: palette.card, color: palette.text.primary }]}
              placeholder={t('chat.typeMessage')}
              placeholderTextColor={palette.text.secondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: inputText.trim() ? palette.primary : palette.card },
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <MaterialIcons
                name="send"
                size={24}
                color={inputText.trim() ? '#ffffff' : palette.text.secondary}
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
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitleText: {
    flex: 1,
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
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
    maxHeight: 100,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
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
});

