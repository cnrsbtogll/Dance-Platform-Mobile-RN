import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { Card } from '../../components/common/Card';
import { AVATARS } from '../../utils/avatars';
import { useProfileStore } from '../../store/useProfileStore';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { tempName, tempAvatar, setTempName, setTempAvatar, loadFromUser, applyChanges } = useProfileStore();
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);

  useEffect(() => {
    loadFromUser();
  }, [loadFromUser]);

  const handleSave = () => {
    applyChanges();
    (navigation as any).goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      <ScrollView style={[styles.scrollView, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('profile.profileInfo')}</Text>
          <View style={styles.avatarRow}>
            {tempAvatar ? (
              <Image source={{ uri: tempAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: palette.border }]}>
                <MaterialIcons name="person" size={32} color={palette.text.secondary} />
              </View>
            )}
            <TouchableOpacity style={styles.changeAvatarButton} onPress={() => setAvatarModalVisible(true)}>
              <Text style={styles.changeAvatarButtonText}>{t('profile.selectAvatar')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: palette.text.secondary }]}>{t('auth.firstName')}</Text>
            <TextInput
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
              placeholder={t('profile.usernamePlaceholder')}
              placeholderTextColor={palette.text.secondary}
              value={tempName}
              onChangeText={setTempName}
              autoCapitalize="words"
            />
          </View>
        </Card>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton, { backgroundColor: palette.border }]} onPress={() => (navigation as any).goBack()}>
            <Text style={[styles.cancelText, { color: palette.text.primary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.saveText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={avatarModalVisible} animationType="slide" transparent onRequestClose={() => setAvatarModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}>
          <View style={[styles.modalContent, { backgroundColor: palette.card }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text.primary }]}>{t('profile.selectAvatar')}</Text>
              <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={palette.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              contentContainerStyle={styles.avatarGrid}
              showsVerticalScrollIndicator={false}
            >
              {AVATARS.map((url, index) => (
                <TouchableOpacity 
                  key={`${url}-${index}`} 
                  style={styles.avatarItem} 
                  onPress={() => { 
                    setTempAvatar(url); 
                    setAvatarModalVisible(false); 
                  }}
                >
                  <Image 
                    source={{ uri: url }} 
                    style={styles.avatarImage} 
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    ...shadows.sm,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeAvatarButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.student.primary,
  },
  changeAvatarButtonText: {
    color: '#ffffff',
    fontWeight: typography.fontWeight.medium,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  cancelButton: {
  },
  saveButton: {
    backgroundColor: colors.student.primary,
  },
  cancelText: {
    fontWeight: typography.fontWeight.medium,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: typography.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-start',
    padding: spacing.sm,
  },
  avatarItem: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    backgroundColor: colors.light.border,
    ...shadows.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});