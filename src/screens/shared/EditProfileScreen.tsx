import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, Modal, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { Card } from '../../components/common/Card';
import { AVATARS } from '../../utils/avatars';
import { useProfileStore } from '../../store/useProfileStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getAvatarSource } from '../../utils/imageHelper';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    tempName, tempAvatar, tempBio, tempPhoneNumber,
    tempSchoolName, tempSchoolAddress, tempContactNumber,
    tempContactPerson, tempInstagramHandle,
    setTempName, setTempAvatar, setTempBio, setTempPhoneNumber,
    setTempSchoolName, setTempSchoolAddress, setTempContactNumber,
    setTempContactPerson, setTempInstagramHandle,
    loadFromUser, applyChanges,
  } = useProfileStore();

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isDarkMode } = useThemeStore();

  // @ts-ignore
  const mode = route.params?.mode || user?.role || 'student';
  const palette = getPalette(
    mode === 'school' || mode === 'draft-school' ? 'school'
      : mode === 'instructor' || mode === 'draft-instructor' ? 'instructor'
        : 'student',
    isDarkMode
  );

  const isSchool = user?.role === 'school' || user?.role === 'draft-school';
  const isInstructor = user?.role === 'instructor' || user?.role === 'draft-instructor';

  useEffect(() => {
    loadFromUser();
  }, [loadFromUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await applyChanges();
      (navigation as any).goBack();
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setSaving(false);
    }
  };

  const InputGroup = ({
    label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' as any,
  }: {
    label: string; value: string; onChangeText: (v: string) => void;
    placeholder?: string; multiline?: boolean; keyboardType?: any;
  }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: palette.text.secondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary },
          multiline && styles.inputMultiline,
        ]}
        placeholder={placeholder || label}
        placeholderTextColor={palette.text.secondary}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* Avatar Section */}
        <Card style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('profile.profileInfo')}
          </Text>
          <View style={styles.avatarRow}>
            <Image
              source={getAvatarSource(tempAvatar, useAuthStore.getState().user?.id || undefined)}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={[styles.changeAvatarButton, { backgroundColor: palette.primary }]}
              onPress={() => setAvatarModalVisible(true)}
            >
              <Text style={styles.changeAvatarButtonText}>{t('profile.selectAvatar')}</Text>
            </TouchableOpacity>
          </View>

          {/* Display Name */}
          <InputGroup
            label={t('auth.firstName')}
            value={tempName}
            onChangeText={setTempName}
            placeholder={t('profile.usernamePlaceholder')}
          />
        </Card>

        {/* School Fields */}
        {isSchool && (
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('school.onboardingTitle')}
            </Text>

            <InputGroup
              label={t('becomeSchool.schoolNamePlaceholder').replace(' *', '')}
              value={tempSchoolName}
              onChangeText={setTempSchoolName}
              placeholder={t('becomeSchool.schoolNamePlaceholder')}
            />
            <InputGroup
              label={t('becomeSchool.schoolAddressPlaceholder').replace(' *', '')}
              value={tempSchoolAddress}
              onChangeText={setTempSchoolAddress}
              placeholder={t('becomeSchool.schoolAddressPlaceholder')}
            />
            <InputGroup
              label={t('becomeSchool.contactNumberPlaceholder').replace(' *', '')}
              value={tempContactNumber}
              onChangeText={setTempContactNumber}
              placeholder={t('becomeSchool.contactNumberPlaceholder')}
              keyboardType="phone-pad"
            />
            <InputGroup
              label={t('becomeSchool.contactPersonPlaceholder').replace(' *', '')}
              value={tempContactPerson}
              onChangeText={setTempContactPerson}
              placeholder={t('becomeSchool.contactPersonPlaceholder')}
            />
            <InputGroup
              label={t('becomeSchool.instagramPlaceholder').replace(' (Opsiyonel)', '').replace(' (Optional)', '')}
              value={tempInstagramHandle}
              onChangeText={setTempInstagramHandle}
              placeholder={t('becomeSchool.instagramPlaceholder')}
            />
            <InputGroup
              label={t('onboarding.bioLabel')}
              value={tempBio}
              onChangeText={setTempBio}
              placeholder={t('school.bioPlaceholder')}
              multiline
            />
          </Card>
        )}

        {/* Instructor Fields */}
        {isInstructor && (
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('onboarding.basicInfoTitle')}
            </Text>
            <InputGroup
              label={t('onboarding.phoneLabel')}
              value={tempPhoneNumber}
              onChangeText={setTempPhoneNumber}
              placeholder={t('onboarding.phonePlaceholder')}
              keyboardType="phone-pad"
            />
            <InputGroup
              label={t('onboarding.bioLabel')}
              value={tempBio}
              onChangeText={setTempBio}
              placeholder={t('onboarding.bioPlaceholder')}
              multiline
            />
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, { backgroundColor: palette.border }]}
            onPress={() => (navigation as any).goBack()}
          >
            <Text style={[styles.cancelText, { color: palette.text.primary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton, { backgroundColor: palette.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveText}>{t('common.save')}</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Avatar Modal */}
      <Modal
        visible={avatarModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}>
          <View style={[styles.modalContent, { backgroundColor: palette.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text.primary }]}>{t('profile.selectAvatar')}</Text>
              <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={palette.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.avatarGrid} showsVerticalScrollIndicator={false}>
              {AVATARS.map((url, index) => (
                <TouchableOpacity
                  key={`${url}-${index}`}
                  style={[styles.avatarItem, { backgroundColor: palette.border }]}
                  onPress={() => { setTempAvatar(url); setAvatarModalVisible(false); }}
                >
                  <Image source={{ uri: url }} style={styles.avatarImage} resizeMode="cover" />
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
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  card: {
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    ...shadows.sm,
  },
  changeAvatarButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  changeAvatarButtonText: {
    color: '#ffffff',
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm,
  },
  inputGroup: { marginBottom: spacing.md },
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    minHeight: 44,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    ...shadows.sm,
  },
  cancelButton: {},
  saveButton: {},
  cancelText: { fontWeight: typography.fontWeight.medium },
  saveText: { color: '#ffffff', fontWeight: typography.fontWeight.bold },
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
    maxHeight: '80%',
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
    ...shadows.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});