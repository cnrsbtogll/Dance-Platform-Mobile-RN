import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

interface QuickReplyModalProps {
  visible: boolean;
  studentName: string;
  onSend: (message: string) => void;
  onSkip: () => void;
}

export const QuickReplyModal: React.FC<QuickReplyModalProps> = ({
  visible,
  studentName,
  onSend,
  onSkip,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const { user } = useAuthStore();

  const isSchoolRoles = ['draft-school', 'school'];
  const isSchool = user?.role ? isSchoolRoles.includes(user.role) : false;
  const palette = getPalette(isSchool ? 'school' : 'instructor', isDarkMode);

  const defaultMessage = t('chat.welcomeModal.defaultMessage');
  const [message, setMessage] = useState(defaultMessage);

  // Reset message whenever modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setMessage(t('chat.welcomeModal.defaultMessage'));
    }
  }, [visible, t]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onSkip}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { backgroundColor: palette.background, borderColor: palette.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: palette.border }]}>
            <View style={[styles.iconBadge, { backgroundColor: palette.primary + '18' }]}>
              <MaterialIcons name="chat-bubble-outline" size={20} color={palette.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: palette.text.primary }]}>
                {t('chat.welcomeModal.title')}
              </Text>
              <Text style={[styles.desc, { color: palette.text.secondary }]}>
                {studentName}
              </Text>
            </View>
          </View>

          {/* Message Input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: palette.card,
                color: palette.text.primary,
                borderColor: palette.border,
              },
            ]}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholder={t('chat.typeMessage')}
            placeholderTextColor={palette.text.secondary}
            maxLength={500}
          />

          {/* Actions */}
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: palette.primary }]}
            onPress={handleSend}
            disabled={!message.trim()}
            activeOpacity={0.85}
          >
            <MaterialIcons name="send" size={18} color="#ffffff" />
            <Text style={styles.sendButtonText}>{t('chat.welcomeModal.send')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.7}>
            <Text style={[styles.skipButtonText, { color: palette.text.secondary }]}>
              {t('chat.welcomeModal.skip')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  desc: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    minHeight: 110,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
