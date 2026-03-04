import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../services/firebase/config';
import { spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

// ─── Toast helper ────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

// ─── Firebase error → i18n key ────────────────────────────────────────────────
const mapFirebaseError = (code: string, t: (key: string) => string): string => {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return t('changePassword.wrongCurrentPassword');
    case 'auth/network-request-failed':
      return t('changePassword.networkError');
    case 'auth/too-many-requests':
      return t('changePassword.tooManyRequests');
    default:
      return t('common.unknownError');
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();

  // @ts-ignore
  const mode = route.params?.mode || user?.role || 'student';
  const palette = getPalette(mode, isDarkMode);

  // ── Provider check ──────────────────────────────────────────────────────────
  const firebaseUser = auth?.currentUser;
  const providers = firebaseUser?.providerData.map((p) => p.providerId) ?? [];
  const isEmailPasswordUser = providers.includes('password');
  const isGoogleUser = providers.includes('google.com') && !isEmailPasswordUser;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // ── Toast state ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'info' });
  const toastOpacity = React.useRef(new Animated.Value(0)).current;

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast((prev) => ({ ...prev, visible: false })));
  }, [toastOpacity]);

  // ── Header ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      headerTitle: t('profile.changePassword'),
      headerTintColor: palette.text.primary,
      headerStyle: { backgroundColor: palette.background },
      headerTitleStyle: { fontWeight: 'bold' },
      headerShadowVisible: false,
    });
  }, [navigation, isDarkMode, palette, t]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateForm = (): boolean => {
    if (!currentPassword) { showToast(t('changePassword.enterCurrentPassword'), 'error'); return false; }
    if (!newPassword) { showToast(t('changePassword.enterNewPassword'), 'error'); return false; }
    if (newPassword.length < 6) { showToast(t('changePassword.passwordTooShort'), 'error'); return false; }
    if (newPassword !== confirmPassword) { showToast(t('changePassword.passwordsDoNotMatch'), 'error'); return false; }
    if (currentPassword === newPassword) { showToast(t('changePassword.samePassword'), 'error'); return false; }
    return true;
  };

  // ── Change Password ─────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!validateForm() || !firebaseUser || !user?.email) return;

    try {
      setIsChanging(true);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      showToast(t('changePassword.passwordChanged'), 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => navigation.goBack(), 1800);
    } catch (err: any) {
      showToast(mapFirebaseError(err?.code ?? '', t), 'error');
    } finally {
      setIsChanging(false);
    }
  };

  // ── Send Reset Email ────────────────────────────────────────────────────────
  const handleSendResetEmail = async () => {
    if (!user?.email || !auth) return;

    try {
      setIsSendingReset(true);
      await sendPasswordResetEmail(auth, user.email);
      showToast(t('changePassword.resetMailSent'), 'success');
    } catch (err: any) {
      showToast(t('changePassword.resetMailError'), 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const successColor = '#10B981';
  const canSubmit = !isChanging && currentPassword.length > 0 && newPassword.length >= 6 && confirmPassword.length > 0;

  // ── Input renderer ──────────────────────────────────────────────────────────
  const renderInput = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    showPass: boolean,
    setShowPass: (v: boolean) => void,
    inputKey: string,
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
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}>
          <MaterialIcons
            name="lock-outline"
            size={20}
            color={isFocused ? palette.primary : palette.text.secondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { color: palette.text.primary }]}
            value={value}
            onChangeText={setValue}
            secureTextEntry={!showPass}
            placeholderTextColor={palette.text.secondary + '80'}
            onFocus={() => setFocusedInput(inputKey)}
            onBlur={() => setFocusedInput(null)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeIcon}>
            <MaterialIcons
              name={showPass ? 'visibility' : 'visibility-off'}
              size={20}
              color={palette.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Toast color ─────────────────────────────────────────────────────────────
  const toastBg = toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6';

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Header icon ── */}
          <View style={styles.headerSection}>
            <View style={[styles.iconCircle, { backgroundColor: palette.primary + '15' }]}>
              <MaterialIcons name="security" size={32} color={palette.primary} />
            </View>
            <Text style={[styles.title, { color: palette.text.primary }]}>
              {t('changePassword.title')}
            </Text>
            <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
              {t('changePassword.description')}
            </Text>
          </View>

          {/* ── Google user info ── */}
          {isGoogleUser ? (
            <View style={[styles.googleBanner, {
              backgroundColor: isDarkMode ? '#1E293B' : '#F0F9FF',
              borderColor: isDarkMode ? '#334155' : '#BAE6FD',
            }]}>
              <View style={styles.googleBannerHeader}>
                <MaterialIcons name="info-outline" size={22} color="#0EA5E9" />
                <Text style={[styles.googleBannerTitle, { color: palette.text.primary }]}>
                  {t('changePassword.googleUserTitle')}
                </Text>
              </View>
              <Text style={[styles.googleBannerDesc, { color: palette.text.secondary }]}>
                {t('changePassword.googleUserDesc')}
              </Text>
            </View>
          ) : (
            /* ── Email/password form ── */
            <View style={styles.formSection}>
              {renderInput(t('changePassword.currentPassword'), currentPassword, setCurrentPassword, showCurrent, setShowCurrent, 'current')}
              {renderInput(t('changePassword.newPassword'), newPassword, setNewPassword, showNew, setShowNew, 'new')}

              {/* Requirements */}
              <View style={styles.requirements}>
                <View style={styles.reqItem}>
                  <MaterialIcons
                    name={isMinLength ? 'check-circle' : 'radio-button-unchecked'}
                    size={16}
                    color={isMinLength ? successColor : palette.text.secondary}
                  />
                  <Text style={[styles.reqText, { color: isMinLength ? palette.text.primary : palette.text.secondary }]}>
                    {t('changePassword.minLength')}
                  </Text>
                </View>
                <View style={styles.reqItem}>
                  <MaterialIcons
                    name={hasNumber ? 'check-circle' : 'radio-button-unchecked'}
                    size={16}
                    color={hasNumber ? successColor : palette.text.secondary}
                  />
                  <Text style={[styles.reqText, { color: hasNumber ? palette.text.primary : palette.text.secondary }]}>
                    {t('changePassword.includeNumbers')}
                  </Text>
                </View>
              </View>

              {renderInput(t('changePassword.confirmPassword'), confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, 'confirm')}
            </View>
          )}

          {/* ── Reset mail section (shown for all) ── */}
          <View style={[styles.resetSection, {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderColor: palette.border,
          }]}>
            <View style={styles.resetSectionHeader}>
              <MaterialIcons name="mail-outline" size={20} color={palette.text.secondary} />
              <Text style={[styles.resetSectionTitle, { color: palette.text.primary }]}>
                {t('changePassword.resetMailSection')}
              </Text>
            </View>
            <Text style={[styles.resetSectionDesc, { color: palette.text.secondary }]}>
              {isGoogleUser
                ? t('changePassword.googleUserResetDesc')
                : t('changePassword.resetMailDesc')}
            </Text>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: palette.primary }]}
              onPress={handleSendResetEmail}
              disabled={isSendingReset}
            >
              {isSendingReset ? (
                <ActivityIndicator size="small" color={palette.primary} />
              ) : (
                <>
                  <MaterialIcons name="send" size={16} color={palette.primary} />
                  <Text style={[styles.resetBtnText, { color: palette.primary }]}>
                    {t('changePassword.sendResetMail')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* ── Submit button (hidden for Google users) ── */}
        {!isGoogleUser && (
          <View style={[styles.footer, { borderTopColor: palette.border }]}>
            <TouchableOpacity
              style={[styles.button, {
                backgroundColor: palette.primary,
                opacity: canSubmit ? 1 : 0.6,
              }]}
              onPress={handleChangePassword}
              disabled={!canSubmit}
            >
              {isChanging ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('changePassword.changePassword')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Inline Toast ── */}
      {toast.visible && (
        <Animated.View style={[styles.toast, { backgroundColor: toastBg, opacity: toastOpacity }]}>
          <MaterialIcons
            name={toast.type === 'success' ? 'check-circle' : toast.type === 'error' ? 'error-outline' : 'info-outline'}
            size={18}
            color="#fff"
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerSection: { alignItems: 'center', marginBottom: spacing.xl },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  // Google banner
  googleBanner: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  googleBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  googleBannerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  googleBannerDesc: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  // Form
  formSection: { gap: spacing.md, marginBottom: spacing.lg },
  inputContainer: { gap: spacing.xs },
  label: { fontSize: typography.fontSize.sm, fontWeight: '600', marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: typography.fontSize.base, height: '100%' },
  eyeIcon: { padding: spacing.xs },
  requirements: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginVertical: spacing.xs,
    paddingHorizontal: 4,
  },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reqText: { fontSize: typography.fontSize.xs },
  // Reset section
  resetSection: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  resetSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resetSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
  },
  resetSectionDesc: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  resetBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
  },
  // Footer
  footer: { padding: spacing.lg, borderTopWidth: 1 },
  button: {
    height: 50,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: typography.fontSize.base, fontWeight: 'bold' },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 90,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
});
