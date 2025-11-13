import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { MockDataService } from '../../services/mockDataService';
import { useAuthStore } from '../../store/useAuthStore';

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
  const params = route.params as { conversationId?: string; userId?: string } | undefined;
  const { user } = useAuthStore();
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
    navigation.setOptions({
      headerBackTitle: '',
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <Image
            source={{ uri: partner?.avatar || '' }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerTitleText}>
            <Text style={styles.headerName} numberOfLines={1}>
              {partner?.name || 'Kullanıcı'}
            </Text>
            <Text style={styles.headerStatus} numberOfLines={1}>
              {partner?.role === 'instructor' ? 'Eğitmen' : 'Çevrimiçi'}
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
            color={colors.student.text.primaryLight}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, partner]);

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Şimdi';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} dk önce`;
    } else if (diffHours < 24) {
      return `${diffHours} saat önce`;
    } else if (diffDays === 1) {
      return 'Dün';
    } else if (diffDays < 7) {
      const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      return days[date.getDay()];
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
      return 'Bugün';
    } else if (diffDays === 1) {
      return 'Dün';
    } else {
      const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const dayName = days[date.getDay()];
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
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Kullanıcı bulunamadı</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="chat-bubble-outline"
              size={64}
              color={colors.student.text.secondaryLight + '80'}
            />
            <Text style={styles.emptyStateText}>
              Henüz mesaj yok. İlk mesajınızı gönderin!
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
                    <Text style={styles.dateSeparatorText}>
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
                      isSent ? styles.messageBubbleSent : styles.messageBubbleReceived,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isSent ? styles.messageTextSent : styles.messageTextReceived,
                      ]}
                    >
                      {message.message}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isSent ? styles.messageTimeSent : styles.messageTimeReceived,
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
        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            <TouchableOpacity style={styles.attachButton}>
              <MaterialIcons
                name="attach-file"
                size={24}
                color={colors.student.text.secondaryLight}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Mesaj yazın..."
              placeholderTextColor={colors.student.text.secondaryLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <MaterialIcons
                name="send"
                size={24}
                color={inputText.trim() ? '#ffffff' : colors.student.text.secondaryLight}
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
    backgroundColor: colors.student.background.light,
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
    color: colors.student.text.primaryLight,
  },
  headerStatus: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    color: colors.student.text.secondaryLight,
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
    color: colors.student.text.secondaryLight,
    backgroundColor: colors.student.background.light,
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
    ...shadows.sm,
  },
  messageBubbleSent: {
    backgroundColor: colors.student.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  messageBubbleReceived: {
    backgroundColor: colors.student.card.light,
    borderBottomLeftRadius: borderRadius.sm,
  },
  messageText: {
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },
  messageTextSent: {
    color: '#ffffff',
  },
  messageTextReceived: {
    color: colors.student.text.primaryLight,
  },
  messageTime: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  messageTimeSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeReceived: {
    color: colors.student.text.secondaryLight,
  },
  inputSafeArea: {
    backgroundColor: colors.student.background.light,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
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
    backgroundColor: colors.student.card.light,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.student.text.primaryLight,
    ...shadows.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.student.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: colors.student.card.light,
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
    color: colors.student.text.secondaryLight,
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
    color: colors.student.text.primaryLight,
    marginBottom: spacing.md,
  },
  backButton: {
    fontSize: typography.fontSize.base,
    color: colors.student.primary,
    fontWeight: typography.fontWeight.medium,
  },
});

