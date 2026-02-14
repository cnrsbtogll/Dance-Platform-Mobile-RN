import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

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

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: t('profile.changePassword'),
      headerTintColor: palette.text.primary,
      headerStyle: { backgroundColor: palette.background },
      headerTitleStyle: { fontWeight: 'bold' },
      headerShadowVisible: false,
    });
  }, [navigation, isDarkMode, palette, t]);

  const validateForm = (): boolean => {
    if (!currentPassword) { Alert.alert(t('common.error'), t('changePassword.enterCurrentPassword')); return false; }
    if (!newPassword) { Alert.alert(t('common.error'), t('changePassword.enterNewPassword')); return false; }
    if (newPassword.length < 6) { Alert.alert(t('common.error'), t('changePassword.passwordTooShort')); return false; }
    if (newPassword !== confirmPassword) { Alert.alert(t('common.error'), t('changePassword.passwordsDoNotMatch')); return false; }
    if (currentPassword === newPassword) { Alert.alert(t('common.error'), t('changePassword.samePassword')); return false; }
    return true;
  };

  const handleChangePassword = () => {
    if (!validateForm()) return;
    Alert.alert(t('common.success'), t('changePassword.passwordChanged'), [{ text: t('common.ok'), onPress: () => navigation.goBack() }]);
  };

  const renderInput = (
    label: string,
    value: string,
    setValue: (text: string) => void,
    showPass: boolean,
    setShowPass: (show: boolean) => void,
    placeholder: string,
    inputKey: string
  ) => {
    const isFocused = focusedInput === inputKey;
    return (
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: palette.text.secondary }]}>{label}</Text>
        <View style={[
          styles.inputWrapper,
          {
            backgroundColor: palette.card,
            borderColor: isFocused ? palette.primary : palette.border,
            borderWidth: isFocused ? 1.5 : 1
          }
        ]}>
          <MaterialIcons name="lock-outline" size={20} color={isFocused ? palette.primary : palette.text.secondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: palette.text.primary }]}
            value={value}
            onChangeText={setValue}
            secureTextEntry={!showPass}
            placeholder={placeholder}
            placeholderTextColor={palette.text.secondary + '80'}
            onFocus={() => setFocusedInput(inputKey)}
            onBlur={() => setFocusedInput(null)}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeIcon}>
            <MaterialIcons name={showPass ? "visibility" : "visibility-off"} size={20} color={palette.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const isMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const successColor = '#10B981';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.headerSection}>
            <View style={[styles.iconCircle, { backgroundColor: palette.primary + '15' }]}>
              <MaterialIcons name="security" size={32} color={palette.primary} />
            </View>
            <Text style={[styles.title, { color: palette.text.primary }]}>{t('changePassword.title')}</Text>
            <Text style={[styles.subtitle, { color: palette.text.secondary }]}>{t('changePassword.description')}</Text>
          </View>

          <View style={styles.formSection}>
            {renderInput(t('changePassword.currentPassword'), currentPassword, setCurrentPassword, showCurrentPassword, setShowCurrentPassword, '******', 'current')}

            {renderInput(t('changePassword.newPassword'), newPassword, setNewPassword, showNewPassword, setShowNewPassword, 'Tw7!mP$', 'new')}

            {/* Dynamic Requirements */}
            <View style={styles.requirements}>
              <View style={styles.reqItem}>
                <MaterialIcons name={isMinLength ? "check-circle" : "radio-button-unchecked"} size={16} color={isMinLength ? successColor : palette.text.secondary} />
                <Text style={[styles.reqText, { color: isMinLength ? palette.text.primary : palette.text.secondary }]}>{t('changePassword.minLength')}</Text>
              </View>
              <View style={styles.reqItem}>
                <MaterialIcons name={hasNumber ? "check-circle" : "radio-button-unchecked"} size={16} color={hasNumber ? successColor : palette.text.secondary} />
                <Text style={[styles.reqText, { color: hasNumber ? palette.text.primary : palette.text.secondary }]}>{t('changePassword.includeNumbers')}</Text>
              </View>
            </View>

            {renderInput(t('changePassword.confirmPassword'), confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword, 'Tw7!mP$', 'confirm')}
          </View>

        </ScrollView>

        <View style={[styles.footer, { borderTopColor: palette.border }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: palette.primary, opacity: (!currentPassword || !newPassword || !confirmPassword) ? 0.7 : 1 }]}
            onPress={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            <Text style={styles.buttonText}>{t('changePassword.changePassword')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  headerSection: { alignItems: 'center', marginBottom: spacing.xl },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  title: { fontSize: typography.fontSize.xl, fontWeight: 'bold', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.fontSize.sm, textAlign: 'center', paddingHorizontal: spacing.xl },
  formSection: { gap: spacing.md },
  inputContainer: { gap: spacing.xs },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, height: 50 },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: typography.fontSize.base, height: '100%' },
  eyeIcon: { padding: spacing.xs },
  requirements: { flexDirection: 'row', gap: spacing.lg, marginVertical: spacing.xs, paddingHorizontal: 4 },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reqText: { fontSize: typography.fontSize.xs },
  footer: { padding: spacing.lg, borderTopWidth: 1 },
  button: { height: 50, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3 },
  buttonText: { color: '#fff', fontSize: typography.fontSize.base, fontWeight: 'bold' },
});
