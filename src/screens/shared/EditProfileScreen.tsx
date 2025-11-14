import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Modal, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../utils/theme';
import { Card } from '../../components/common/Card';
import { AVATARS } from '../../utils/avatars';
import { useProfileStore } from '../../store/useProfileStore';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { tempName, tempAvatar, setTempName, setTempAvatar, loadFromUser, applyChanges } = useProfileStore();
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  useEffect(() => {
    loadFromUser();
  }, [loadFromUser]);

  const handleSave = () => {
    applyChanges();
    (navigation as any).goBack();
  };

  const theme = colors.student;

  return (
    <View style={[styles.container, { backgroundColor: theme.background.light }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
          <View style={styles.avatarRow}>
            {tempAvatar ? (
              <Image source={{ uri: tempAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialIcons name="person" size={32} color={theme.text.secondaryLight} />
              </View>
            )}
            <TouchableOpacity style={styles.changeAvatarButton} onPress={() => setAvatarModalVisible(true)}>
              <Text style={styles.changeAvatarButtonText}>Avatar Seç</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad</Text>
            <TextInput
              style={styles.input}
              placeholder="Kullanıcı adı"
              placeholderTextColor={theme.text.secondaryLight}
              value={tempName}
              onChangeText={setTempName}
              autoCapitalize="words"
            />
          </View>
        </Card>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => (navigation as any).goBack()}>
            <Text style={styles.cancelText}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.saveText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={avatarModalVisible} animationType="slide" transparent onRequestClose={() => setAvatarModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card.light }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avatar Seç</Text>
              <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.text.primaryLight} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.avatarGrid}>
              {AVATARS.map((url) => (
                <TouchableOpacity key={url} style={styles.avatarItem} onPress={() => { setTempAvatar(url); setAvatarModalVisible(false); }}>
                  <Image source={{ uri: url }} style={styles.avatarImage} />
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
    backgroundColor: '#F0F2F5',
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
    color: colors.student.text.secondaryLight,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.student.border.light,
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.student.text.primaryLight,
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
    backgroundColor: '#EEF2F6',
  },
  saveButton: {
    backgroundColor: colors.student.primary,
  },
  cancelText: {
    color: colors.student.text.primaryLight,
    fontWeight: typography.fontWeight.medium,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: typography.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    gap: spacing.sm,
    justifyContent: 'center',
  },
  avatarItem: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});