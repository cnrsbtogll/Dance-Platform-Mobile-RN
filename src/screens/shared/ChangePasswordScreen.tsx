import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/common/Card';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette(user?.role || 'student', isDarkMode);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: t('profile.changePassword'),
      headerTintColor: palette.text.primary,
      headerStyle: {
        backgroundColor: palette.background,
      },
      headerTitleStyle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: palette.text.primary,
      },
    });
  }, [navigation, isDarkMode, palette, t, user?.role]);

  const validateForm = (): boolean => {
    if (!currentPassword) {
      Alert.alert(t('common.error'), t('changePassword.enterCurrentPassword'));
      return false;
    }
    if (!newPassword) {
      Alert.alert(t('common.error'), t('changePassword.enterNewPassword'));
      return false;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('changePassword.passwordTooShort'));
      return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('changePassword.passwordsDoNotMatch'));
      return false;
    }
    if (currentPassword === newPassword) {
      Alert.alert(t('common.error'), t('changePassword.samePassword'));
      return false;
    }
    return true;
  };

  const handleChangePassword = () => {
    if (!validateForm()) return;

    // In real app, this would call API to change password
    Alert.alert(
      t('common.success'),
      t('changePassword.passwordChanged'),
      [
        {
          text: t('common.ok'),
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: palette.background }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('changePassword.title')}
          </Text>
          <Text style={[styles.sectionDescription, { color: palette.text.secondary }]}>
            {t('changePassword.description')}
          </Text>

          <Card style={[styles.formCard, { backgroundColor: palette.card }]}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>
                {t('changePassword.currentPassword')}
              </Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.passwordInput, { borderColor: palette.border, backgroundColor: palette.background, color: palette.text.primary }]}
                  placeholder={t('changePassword.currentPasswordPlaceholder')}
                  placeholderTextColor={palette.text.secondary}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <MaterialIcons
                    name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={palette.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>
                {t('changePassword.newPassword')}
              </Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.passwordInput, { borderColor: palette.border, backgroundColor: palette.background, color: palette.text.primary }]}
                  placeholder={t('changePassword.newPasswordPlaceholder')}
                  placeholderTextColor={palette.text.secondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <MaterialIcons
                    name={showNewPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={palette.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: palette.text.secondary }]}>
                {t('changePassword.confirmPassword')}
              </Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.passwordInput, { borderColor: palette.border, backgroundColor: palette.background, color: palette.text.primary }]}
                  placeholder={t('changePassword.confirmPasswordPlaceholder')}
                  placeholderTextColor={palette.text.secondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={palette.text.secondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View style={[styles.requirementsContainer, { backgroundColor: palette.background }]}>
              <Text style={[styles.requirementsTitle, { color: palette.text.secondary }]}>
                {t('changePassword.requirements')}
              </Text>
              <Text style={[styles.requirementItem, { color: palette.text.secondary }]}>
                • {t('changePassword.minLength')}
              </Text>
              <Text style={[styles.requirementItem, { color: palette.text.secondary }]}>
                • {t('changePassword.includeNumbers')}
              </Text>
            </View>
          </Card>

          {/* Change Password Button */}
          <TouchableOpacity
            style={[styles.changeButton, { backgroundColor: colors.student.primary }]}
            onPress={handleChangePassword}
            activeOpacity={0.8}
          >
            <Text style={styles.changeButtonText}>
              {t('changePassword.changePassword')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    letterSpacing: -0.015,
  },
  sectionDescription: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    width: '100%',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingRight: 48,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    ...shadows.sm,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: spacing.xs,
  },
  requirementsContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  requirementsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  requirementItem: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
  },
  changeButton: {
    width: '100%',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  changeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
});

