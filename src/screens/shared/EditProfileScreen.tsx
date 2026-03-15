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

import { isValidPhoneNumber, internationalPhoneMask } from '../../utils/validation';
import MaskInput from 'react-native-mask-input';

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
    tempShowPhoneNumberToStudents,
    setTempName, setTempAvatar, setTempBio, setTempPhoneNumber,
    setTempSchoolName, setTempSchoolAddress, setTempContactNumber,
    setTempContactPerson, setTempInstagramHandle,
    setTempHeight, setTempWeight, setTempDanceStyles, setTempLevel,
    setTempGender, setTempAge, setTempCountry, setTempCity,
    setTempIsVisibleInPartnerSearch,
    setTempYearsOfTeaching, setTempCertificates,
    setTempShowPhoneNumberToStudents,
    loadFromUser, applyChanges,
  } = useProfileStore();

  const { danceStyles, loading: stylesLoading } = useDanceStyles();

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const { isDarkMode } = useThemeStore();
  const [highlightErrors, setHighlightErrors] = useState<boolean>((route.params as any)?.highlightErrors || false);

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
    if (isSchool) {
      if (!tempSchoolName.trim() || !tempCountry || !tempCity || !tempSchoolAddress.trim() || !tempContactNumber.trim() || !tempContactPerson.trim()) {
        setHighlightErrors(true);
        Alert.alert(t('common.error'), t('profile.requiredFieldsError') || 'Zorunlu alanları doldurmalısınız.');
        return;
      }
      if (!isValidPhoneNumber(tempContactNumber)) {
        setHighlightErrors(true);
        Alert.alert(t('common.error'), t('profile.invalidPhoneNumber'));
        return;
      }
    } else if (isInstructor) {
      if (!isValidPhoneNumber(tempPhoneNumber)) {
        setHighlightErrors(true);
        Alert.alert(t('common.error'), t('profile.invalidPhoneNumber'));
        return;
      }
    } else {
      // Student
      if (!tempGender || !tempCity || tempDanceStyles.length === 0) {
        setHighlightErrors(true);
        Alert.alert(t('common.error'), t('profile.requiredFieldsError') || 'Zorunlu alanları doldurmalısınız.');
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
    if (!user) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadingAvatar(true);
        setAvatarUploadProgress(0);

        try {
          const downloadUrl = await uploadAvatar(
            user.id,
            result.assets[0].uri,
            (progressInfo: UploadProgress) => {
              setAvatarUploadProgress(Math.round(progressInfo.percent));
            }
          );
          setTempAvatar(downloadUrl);
          setAvatarModalVisible(false);
        } catch (error) {
          Alert.alert(t('common.error'), t('profile.uploadError') || 'Profil fotoğrafı yüklenemedi.');
        }
      }
    } catch (error) {
      // Ignored
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

  // InputGroup as a separate function, memoized if possible, but actually it's fine just being a normal helper inside, wait!
  // If it's a Component inside a Component, React unmounts it on every render.
  // Converting it to a simple function that returns JSX
  const renderInputGroup = (
    label: string, value: string, onChangeText: (v: string) => void, placeholder?: string, multiline = false, keyboardType = 'default' as any, isRequired = false
  ) => {
    const hasError = highlightErrors && isRequired && !value.trim();

    if (keyboardType === 'phone-pad') {
      return (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: hasError ? '#ef4444' : palette.text.secondary }]}>
            {label} {isRequired && <Text style={{ color: '#ef4444' }}>*</Text>}
          </Text>
          <MaskInput
            style={[
              styles.input,
              { borderColor: hasError ? '#ef4444' : palette.border, backgroundColor: palette.card, color: palette.text.primary },
            ]}
            placeholder={placeholder || "+90 555 444 33 22"}
            placeholderTextColor={palette.text.secondary}
            value={value}
            onChangeText={onChangeText}
            keyboardType="phone-pad"
            mask={internationalPhoneMask}
          />
        </View>
      );
    }

    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: hasError ? '#ef4444' : palette.text.secondary }]}>
          {label} {isRequired && <Text style={{ color: '#ef4444' }}>*</Text>}
        </Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: hasError ? '#ef4444' : palette.border, backgroundColor: palette.card, color: palette.text.primary },
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
  };

  const renderLocationPicker = (isRequired = false) => {
    const hasError = highlightErrors && isRequired && (!tempCountry || !tempCity);
    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: hasError ? '#ef4444' : palette.text.secondary }]}>
          {t('location.countryLabel')} / {t('location.cityLabel')} {isRequired && <Text style={{ color: '#ef4444' }}>*</Text>}
        </Text>
        <TouchableOpacity
          style={[
            styles.input,
            styles.pickerButton,
            {
              borderColor: hasError ? '#ef4444' : palette.border,
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
    );
  };

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
          {renderInputGroup(
            isSchool ? (t('becomeSchool.schoolNamePlaceholder') || 'Okul Adı') : t('auth.firstName'),
            isSchool ? tempSchoolName : tempName,
            isSchool ? setTempSchoolName : setTempName,
            isSchool ? (t('becomeSchool.schoolNamePlaceholder') || 'Okul Adı') : t('profile.usernamePlaceholder'),
            false,
            'default',
            isSchool
          )}
        </Card>

        {/* — School Fields — */}
        {isSchool && (
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('school.onboardingTitle') || 'Okul Profili'}
            </Text>

            {/* Motivation banner for missing fields */}
            {highlightErrors && (!tempSchoolName.trim() || !tempCountry || !tempCity || !tempSchoolAddress.trim() || !tempContactNumber.trim() || !tempContactPerson.trim()) && (
              <View style={[styles.motivationBanner, { backgroundColor: '#fef2f2', borderColor: '#fecaca', marginBottom: spacing.md }]}>
                <MaterialIcons name="error-outline" size={18} color="#ef4444" />
                <Text style={[styles.motivationText, { color: '#ef4444' }]}>
                  {t('profile.requiredFieldsBannerSchool') || 'Lütfen kırmızı ile işaretli tüm zorunlu alanları doldurun.'}
                </Text>
              </View>
            )}

            {renderLocationPicker(true)}
            {renderInputGroup((t('becomeSchool.schoolAddressPlaceholder') || 'Adres').replace(' *', ''), tempSchoolAddress, setTempSchoolAddress, t('becomeSchool.schoolAddressPlaceholder') || 'Adres *', false, 'default', true)}
            {renderInputGroup(t('becomeSchool.contactNumberPlaceholder').replace(' *', ''), tempContactNumber, setTempContactNumber, t('becomeSchool.contactNumberPlaceholder'), false, 'phone-pad', true)}
            {renderInputGroup(t('becomeSchool.contactPersonPlaceholder').replace(' *', ''), tempContactPerson, setTempContactPerson, t('becomeSchool.contactPersonPlaceholder'), false, 'default', true)}
            {renderInputGroup(t('becomeSchool.instagramPlaceholder').replace(' (Opsiyonel)', '').replace(' (Optional)', ''), tempInstagramHandle, setTempInstagramHandle, t('becomeSchool.instagramPlaceholder'), false, 'default', false)}
            {renderInputGroup(t('onboarding.bioLabel'), tempBio, setTempBio, t('school.bioPlaceholder'), true)}
          </Card>
        )}

        {/* — Instructor Base Fields — */}
        {isInstructor && (
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('onboarding.basicInfoTitle')}
            </Text>

            <View style={[styles.motivationBanner, { backgroundColor: palette.primary + '12', borderColor: palette.primary + '40' }]}>
              <MaterialIcons name="info-outline" size={18} color={palette.primary} />
              <Text style={[styles.motivationText, { color: palette.primary }]}>
                {t('profile.phoneNumberInstructorReason')}
              </Text>
            </View>

            {renderInputGroup(
              t('onboarding.phoneLabel'),
              tempPhoneNumber,
              setTempPhoneNumber,
              t('onboarding.phonePlaceholder'),
              false,
              'phone-pad',
              true
            )}

            <View style={[styles.switchRow, { marginTop: spacing.sm, marginBottom: spacing.md }]}>
              <View style={styles.switchTextBlock}>
                <Text style={[styles.switchLabel, { color: palette.text.primary }]}>
                  {t('profile.showPhoneNumberToStudents')}
                </Text>
                <Text style={[styles.switchDesc, { color: palette.text.secondary }]}>
                  {t('profile.showPhoneNumberToStudentsDesc')}
                </Text>
              </View>
              <Switch
                value={tempShowPhoneNumberToStudents}
                onValueChange={setTempShowPhoneNumberToStudents}
                trackColor={{ false: palette.border, true: palette.primary + '80' }}
                thumbColor={tempShowPhoneNumberToStudents ? palette.primary : palette.text.secondary}
              />
            </View>

            {renderInputGroup(t('onboarding.bioLabel'), tempBio, setTempBio, t('onboarding.bioPlaceholder'), true)}
          </Card>
        )}

        {/* — Physical & Dance Info (all roles except school) — */}
        {!isSchool && (
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('profile.physicalInfo')}
            </Text>

            {/* Motivation banner */}
            {!isInstructor && (
              <View style={[styles.motivationBanner, { backgroundColor: palette.primary + '12', borderColor: palette.primary + '40' }]}>
                <MaterialIcons name="person-search" size={18} color={palette.primary} />
                <Text style={[styles.motivationText, { color: palette.primary }]}>
                  {t('profile.requiredFieldsBanner')}
                </Text>
              </View>
            )}

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
                        borderColor: (highlightErrors && !isInstructor && !tempGender) ? '#ef4444' : palette.border,
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
            {renderLocationPicker(!isInstructor)}

            {/* Age input */}
            {renderInputGroup(
              t('profile.ageLabel'),
              tempAge,
              setTempAge,
              t('profile.agePlaceholder'),
              false,
              'numeric'
            )}

            {/* Height & Weight row */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
                {renderInputGroup(t('profile.heightLabel'), tempHeight, setTempHeight, t('profile.heightPlaceholder'), false, 'numeric')}
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                {renderInputGroup(t('profile.weightLabel'), tempWeight, setTempWeight, t('profile.weightPlaceholder'), false, 'numeric')}
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
            {renderInputGroup(
              t('profile.yearsOfTeachingLabel'),
              tempYearsOfTeaching,
              setTempYearsOfTeaching,
              t('profile.yearsOfTeachingPlaceholder'),
              false,
              'numeric'
            )}
            {renderInputGroup(
              t('profile.certificatesLabel'),
              tempCertificates,
              setTempCertificates,
              t('profile.certificatesPlaceholder'),
              true
            )}
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
        selectedCountry={tempCountry || 'Türkiye'}
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