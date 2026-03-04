import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, Modal, ScrollView, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { Card } from '../../components/common/Card';
import { AVATARS } from '../../utils/avatars';
import { useProfileStore } from '../../store/useProfileStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getAvatarSource } from '../../utils/imageHelper';
import { uploadAvatar, UploadProgress } from '../../services/storageService';
import { DANCE_LEVELS, DanceLevel } from '../../utils/constants';
import { useDanceStyles } from '../../hooks/useDanceStyles';
import { LocationPickerModal } from '../../components/common/LocationPickerModal';
import { DEFAULT_COUNTRY } from '../../utils/locations';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    tempName, tempAvatar, tempBio, tempPhoneNumber,
    tempSchoolName, tempSchoolAddress, tempContactNumber,
    tempContactPerson, tempInstagramHandle,
    tempHeight, tempWeight, tempDanceStyles, tempLevel,
    tempGender, tempAge, tempCountry, tempCity,
    tempIsVisibleInPartnerSearch,
    tempYearsOfTeaching, tempCertificates,
    setTempName, setTempAvatar, setTempBio, setTempPhoneNumber,
    setTempSchoolName, setTempSchoolAddress, setTempContactNumber,
    setTempContactPerson, setTempInstagramHandle,
    setTempHeight, setTempWeight, setTempDanceStyles, setTempLevel,
    setTempGender, setTempAge, setTempCountry, setTempCity,
    setTempIsVisibleInPartnerSearch,
    setTempYearsOfTeaching, setTempCertificates,
    loadFromUser, applyChanges,
  } = useProfileStore();

  const { danceStyles, loading: stylesLoading } = useDanceStyles();

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
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
    // Validate required fields for matching
    if (!isSchool) {
      if (!tempGender || !tempCity || tempDanceStyles.length === 0) {
        Alert.alert(t('common.error'), t('profile.requiredFieldsError'));
        return;
      }
    }
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

  const handlePickAvatarFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionRequired') || 'İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || !result.assets?.[0]) return;
    if (!user?.id) return;
    setAvatarModalVisible(false);
    setUploadingAvatar(true);
    setAvatarUploadProgress(0);
    try {
      const onProgress = (p: UploadProgress) => setAvatarUploadProgress(p.percent);
      const publicUrl = await uploadAvatar(user.id, result.assets[0].uri, onProgress);
      setTempAvatar(publicUrl);
    } catch (err: any) {
      Alert.alert('Yükleme Hatası', err.message || 'Profil fotoğrafı yüklenemedi.');
    } finally {
      setUploadingAvatar(false);
      setAvatarUploadProgress(0);
    }
  };

  const toggleDanceStyle = (style: string) => {
    if (tempDanceStyles.includes(style)) {
      setTempDanceStyles(tempDanceStyles.filter(s => s !== style));
    } else {
      setTempDanceStyles([...tempDanceStyles, style]);
    }
  };

  const levelLabelKey: Record<DanceLevel, string> = {
    beginner: 'profile.levelBeginner',
    intermediate: 'profile.levelIntermediate',
    advanced: 'profile.levelAdvanced',
    professional: 'profile.levelProfessional',
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

        {/* — Avatar & Name — */}
        <Card style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('profile.profileInfo')}
          </Text>
          <View style={styles.avatarRow}>
            <View>
              <Image
                source={getAvatarSource(tempAvatar, useAuthStore.getState().user?.id || undefined)}
                style={styles.avatar}
              />
              {uploadingAvatar && (
                <View style={styles.avatarUploadOverlay}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              )}
            </View>
            <View style={styles.avatarButtons}>
              <TouchableOpacity
                style={[styles.changeAvatarButton, { backgroundColor: palette.secondary }]}
                onPress={() => setAvatarModalVisible(true)}
                disabled={uploadingAvatar}
              >
                <Text style={styles.changeAvatarButtonText}>{t('profile.selectAvatar')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.changeAvatarButton, { backgroundColor: palette.border, marginTop: spacing.xs }]}
                onPress={handlePickAvatarFromGallery}
                disabled={uploadingAvatar}
              >
                <Text style={[styles.changeAvatarButtonText, { color: palette.text.primary }]}>
                  {uploadingAvatar ? `Yükleniyor ${avatarUploadProgress}%` : 'Galeriden Yükle'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <InputGroup
            label={t('auth.firstName')}
            value={tempName}
            onChangeText={setTempName}
            placeholder={t('profile.usernamePlaceholder')}
          />
        </Card>

        {/* — School Fields — */}
        {isSchool && (
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('school.onboardingTitle')}
            </Text>
            <InputGroup label={t('becomeSchool.schoolNamePlaceholder').replace(' *', '')} value={tempSchoolName} onChangeText={setTempSchoolName} placeholder={t('becomeSchool.schoolNamePlaceholder')} />
            <InputGroup label={t('becomeSchool.schoolAddressPlaceholder').replace(' *', '')} value={tempSchoolAddress} onChangeText={setTempSchoolAddress} placeholder={t('becomeSchool.schoolAddressPlaceholder')} />
            <InputGroup label={t('becomeSchool.contactNumberPlaceholder').replace(' *', '')} value={tempContactNumber} onChangeText={setTempContactNumber} placeholder={t('becomeSchool.contactNumberPlaceholder')} keyboardType="phone-pad" />
            <InputGroup label={t('becomeSchool.contactPersonPlaceholder').replace(' *', '')} value={tempContactPerson} onChangeText={setTempContactPerson} placeholder={t('becomeSchool.contactPersonPlaceholder')} />
            <InputGroup label={t('becomeSchool.instagramPlaceholder').replace(' (Opsiyonel)', '').replace(' (Optional)', '')} value={tempInstagramHandle} onChangeText={setTempInstagramHandle} placeholder={t('becomeSchool.instagramPlaceholder')} />
            <InputGroup label={t('onboarding.bioLabel')} value={tempBio} onChangeText={setTempBio} placeholder={t('school.bioPlaceholder')} multiline />
          </Card>
        )}

        {/* — Instructor Base Fields — */}
        {isInstructor && (
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('onboarding.basicInfoTitle')}
            </Text>
            <InputGroup label={t('onboarding.phoneLabel')} value={tempPhoneNumber} onChangeText={setTempPhoneNumber} placeholder={t('onboarding.phonePlaceholder')} keyboardType="phone-pad" />
            <InputGroup label={t('onboarding.bioLabel')} value={tempBio} onChangeText={setTempBio} placeholder={t('onboarding.bioPlaceholder')} multiline />
          </Card>
        )}

        {/* — Physical & Dance Info (all roles except school) — */}
        {!isSchool && (
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('profile.physicalInfo')}
            </Text>

            {/* Motivation banner */}
            <View style={[styles.motivationBanner, { backgroundColor: palette.primary + '12', borderColor: palette.primary + '40' }]}>
              <MaterialIcons name="person-search" size={18} color={palette.primary} />
              <Text style={[styles.motivationText, { color: palette.primary }]}>
                {t('profile.requiredFieldsBanner')}
              </Text>
            </View>

            {/* Gender chips — REQUIRED */}
            <Text style={[styles.label, { color: palette.text.secondary, marginBottom: spacing.sm }]}>
              {t('profile.genderLabel')}
            </Text>
            <View style={[styles.chipRow, { marginBottom: spacing.md }]}>
              {(['male', 'female'] as const).map((g) => {
                const selected = tempGender === g;
                const labelKey = g === 'male' ? 'profile.genderMale' : 'profile.genderFemale';
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.chip,
                      {
                        borderColor: !tempGender ? '#ef4444' : palette.border,
                        backgroundColor: palette.card,
                      },
                      selected && { backgroundColor: palette.primary, borderColor: palette.primary },
                    ]}
                    onPress={() => setTempGender(selected ? '' : g)}
                  >
                    <Text style={[styles.chipText, { color: selected ? '#fff' : palette.text.primary }]}>
                      {t(labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Country + City picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>
                {t('location.countryLabel')} / {t('location.cityLabel')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.pickerButton,
                  {
                    borderColor: !tempCountry ? '#ef4444' : palette.border,
                    backgroundColor: palette.card,
                  },
                ]}
                onPress={() => setLocationPickerVisible(true)}
              >
                <MaterialIcons name="location-on" size={18} color={palette.text.secondary} />
                <Text style={[
                  styles.pickerButtonText,
                  { color: tempCountry || tempCity ? palette.text.primary : palette.text.secondary },
                ]}>
                  {tempCountry
                    ? (tempCity ? `${tempCountry} · ${tempCity}` : tempCountry)
                    : (t('location.selectCountry') || 'Ülke Seç...')}
                </Text>
                <MaterialIcons name="chevron-right" size={18} color={palette.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Age input */}
            <InputGroup
              label={t('profile.ageLabel')}
              value={tempAge}
              onChangeText={setTempAge}
              placeholder={t('profile.agePlaceholder')}
              keyboardType="numeric"
            />

            {/* Height & Weight row */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={[styles.label, { color: palette.text.secondary }]}>{t('profile.heightLabel')}</Text>
                <TextInput
                  style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                  placeholder={t('profile.heightPlaceholder')}
                  placeholderTextColor={palette.text.secondary}
                  value={tempHeight}
                  onChangeText={setTempHeight}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: palette.text.secondary }]}>{t('profile.weightLabel')}</Text>
                <TextInput
                  style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                  placeholder={t('profile.weightPlaceholder')}
                  placeholderTextColor={palette.text.secondary}
                  value={tempWeight}
                  onChangeText={setTempWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Dance Level chips */}
            <Text style={[styles.label, { color: palette.text.secondary, marginBottom: spacing.sm }]}>
              {t('profile.levelLabel')}
            </Text>
            <View style={styles.chipRow}>
              {DANCE_LEVELS.map((lvl) => {
                const selected = tempLevel === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    style={[
                      styles.chip,
                      { borderColor: palette.border, backgroundColor: palette.card },
                      selected && { backgroundColor: palette.primary, borderColor: palette.primary },
                    ]}
                    onPress={() => setTempLevel(selected ? '' : lvl as DanceLevel)}
                  >
                    <Text style={[styles.chipText, { color: selected ? '#fff' : palette.text.primary }]}>
                      {t(levelLabelKey[lvl])}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Dance Styles multi-select chips */}
            <Text style={[styles.label, { color: palette.text.secondary, marginTop: spacing.md, marginBottom: 4 }]}>
              {t('profile.danceStylesLabel')}
            </Text>
            <Text style={[styles.hint, { color: palette.text.secondary }]}>
              {t('profile.danceStylesHint')}
            </Text>
            <View style={[styles.chipRow, { marginTop: spacing.sm }]}>
              {stylesLoading
                ? <ActivityIndicator size="small" color={palette.primary} />
                : danceStyles.map((style) => {
                  const selected = tempDanceStyles.includes(style);
                  return (
                    <TouchableOpacity
                      key={style}
                      style={[
                        styles.chip,
                        { borderColor: palette.border, backgroundColor: palette.card },
                        selected && { backgroundColor: palette.primary, borderColor: palette.primary },
                      ]}
                      onPress={() => toggleDanceStyle(style)}
                    >
                      <Text style={[styles.chipText, { color: selected ? '#fff' : palette.text.primary }]}>
                        {style}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              }
            </View>
          </Card>
        )}

        {/* — Instructor Extra Fields — */}
        {isInstructor && (
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('profile.instructorInfo')}
            </Text>
            <InputGroup
              label={t('profile.yearsOfTeachingLabel')}
              value={tempYearsOfTeaching}
              onChangeText={setTempYearsOfTeaching}
              placeholder={t('profile.yearsOfTeachingPlaceholder')}
              keyboardType="numeric"
            />
            <InputGroup
              label={t('profile.certificatesLabel')}
              value={tempCertificates}
              onChangeText={setTempCertificates}
              placeholder={t('profile.certificatesPlaceholder')}
              multiline
            />
          </Card>
        )}

        {/* — Privacy: Partner Search Visibility — */}
        {!isSchool && (
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('profile.privacySettings')}
            </Text>
            <View style={styles.switchRow}>
              <View style={styles.switchTextBlock}>
                <Text style={[styles.switchLabel, { color: palette.text.primary }]}>
                  {t('profile.visibleInPartnerSearch')}
                </Text>
                <Text style={[styles.switchDesc, { color: palette.text.secondary }]}>
                  {t('profile.visibleInPartnerSearchDesc')}
                </Text>
              </View>
              <Switch
                value={tempIsVisibleInPartnerSearch}
                onValueChange={setTempIsVisibleInPartnerSearch}
                trackColor={{ false: palette.border, true: palette.primary + '80' }}
                thumbColor={tempIsVisibleInPartnerSearch ? palette.primary : palette.text.secondary}
              />
            </View>
          </Card>
        )}

        {/* — Action Buttons — */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton, { backgroundColor: palette.border }]}
            onPress={() => (navigation as any).goBack()}
          >
            <Text style={[styles.cancelText, { color: palette.text.primary }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton, { backgroundColor: palette.secondary }]}
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

      {/* Age input — standalone, below location picker */}
      {!isSchool && (
        <View style={[styles.card, { backgroundColor: 'transparent', paddingTop: 0 }]}>
          {/* age placed inside physicalInfo card: rendered via InputGroup below */}
        </View>
      )}

      {/* LocationPickerModal */}
      <LocationPickerModal
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        selectedCountry={tempCountry || DEFAULT_COUNTRY}
        selectedCity={tempCity}
        onConfirm={(country, city) => {
          setTempCountry(country);
          setTempCity(city);
        }}
      />

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
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarButtons: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  avatarUploadOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
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
  rowInputs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    marginBottom: 0,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchTextBlock: { flex: 1 },
  switchLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  switchDesc: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
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
  motivationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  motivationText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    fontWeight: '500' as any,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingVertical: spacing.sm,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  ageInput: {
    marginTop: spacing.sm,
  },
});