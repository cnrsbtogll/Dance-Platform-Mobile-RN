import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Platform } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { appConfig } from '../../config/appConfig';
import { authService } from '../../services/backendService';
import { signInWithGoogle, signInWithApple, statusCodes } from '../../services/firebase/auth';
import { Alert } from 'react-native';
import { getFirebaseErrorKey } from '../../utils/firebaseErrorMessages';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const { login, setUser } = useAuthStore();
  const palette = getPalette('student', isDarkMode);
  const route = useRoute<any>();
  const [isSignUp, setIsSignUp] = useState(route.params?.mode !== 'login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Update mode when params change
  useEffect(() => {
    if (route.params?.mode) {
      setIsSignUp(route.params.mode !== 'login');
    }
  }, [route.params?.mode]);


  // Update header title when switching between login/signup
  useEffect(() => {
    navigation.setOptions({
      headerTitle: isSignUp ? t('auth.signUp') : t('auth.login'),
    });
  }, [isSignUp, navigation, t]);

  const handleCreateAccount = async () => {
    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    try {
      // name variable constructed for other purposes if needed, or remove if unused
      const result = await authService.register(email, password, firstName, lastName);

      if (result.success) {
        // After successful registration, the store's initialize() 
        // will handle the onAuthStateChanged and set the user.
        navigation.goBack();
      } else {
        if (result.error) {
          const errorKey = getFirebaseErrorKey(result.error.code);
          Alert.alert(t('common.error'), t(errorKey));
        } else {
          Alert.alert(t('common.error'), t('auth.registrationFailed'));
        }
      }
    } catch (error: any) {
      console.error('[LoginScreen] Registration error:', error);
      const errorKey = error.code ? getFirebaseErrorKey(error.code) : 'auth.errors.unknown';
      Alert.alert(t('common.error'), t(errorKey));
    }
  };


  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      const currentUser = useAuthStore.getState().user;

      if (currentUser?.role === 'instructor') {
        // Reset navigation to Instructor stack
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Instructor' }],
          })
        );
      } else {
        navigation.goBack();
      }
    } else {
      // Handle error
      if (result.error) {
        const errorKey = getFirebaseErrorKey(result.error.code);
        Alert.alert(t('common.error'), t(errorKey));
      } else {
        Alert.alert(t('common.error'), t('auth.errors.unknown'));
      }
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        // Navigation is handled by the auth state listener in RootNavigator (if exists) 
        // OR we need to manually navigate like in handleLogin
        const currentUser = useAuthStore.getState().user; // State might not be updated yet due to async
        // For safety, let's just goBack for now, or copy handleLogin logic if possible.
        // But better pattern:
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('[LoginScreen] Google login error', error);

      if (error.message === 'GOOGLE_SIGN_IN_NOT_SUPPORTED_IN_EXPO_GO') {
        Alert.alert(t('common.notice'), t('auth.googleSignInNotSupportedInExpoGo'));
        return;
      }

      // Check for cancellation code from GoogleSignin (statusCodes.SIGN_IN_CANCELLED is not directly exported to JS easily without import, but error.code is available)
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.message?.includes('cancelled')) {
      } else {
        Alert.alert(t('common.error'), t('auth.loginError'));
      }
    }
  };

  const handleAppleLogin = async () => {
    try {
      const user = await signInWithApple();
      if (user) {
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('[LoginScreen] Apple login error', error);
      if (error.code === 'ERR_REQUEST_CANCELED' || error.message?.includes('canceled')) {
      } else {
        Alert.alert(t('common.error'), t('auth.loginError'));
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={
              appConfig.brand === 'feriha'
                ? require('../../../assets/icons/splash-icon-dark.png')
                : require('../../../assets/splash.png')
            }
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Title and Description */}
        <View style={styles.textContainer}>
          <Text style={[styles.headline, { color: palette.text.primary }]}>
            {t('auth.loginTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
            {t('auth.loginSubtitle')}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {isSignUp && (
            <>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                  placeholder={t('auth.firstName')}
                  placeholderTextColor={palette.text.secondary}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                  placeholder={t('auth.lastName')}
                  placeholderTextColor={palette.text.secondary}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </>
          )}
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
              placeholder={t('auth.email')}
              placeholderTextColor={palette.text.secondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
              placeholder={t('auth.password')}
              placeholderTextColor={palette.text.secondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          {isSignUp && (
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                placeholder={t('auth.confirmPassword')}
                placeholderTextColor={palette.text.secondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.student.primary }]}
            onPress={isSignUp ? handleCreateAccount : handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {isSignUp ? t('auth.createAccount') : t('auth.login')}
            </Text>
          </TouchableOpacity>

          {!isSignUp && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.student.primary }]}
              onPress={() => setIsSignUp(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.student.primary }]}>
                {t('auth.createAccount')}
              </Text>
            </TouchableOpacity>
          )}

          {isSignUp && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.student.primary }]}
              onPress={() => setIsSignUp(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.student.primary }]}>
                {t('auth.alreadyHaveAccount')}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
            <Text style={[styles.dividerText, { color: palette.text.secondary }]}>{t('common.or')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, { borderColor: palette.border }]}
              onPress={handleGoogleLogin}
            >
              <AntDesign name="google" size={24} color={palette.text.primary} />
              <Text style={[styles.socialButtonText, { color: palette.text.primary }]}>Google</Text>
            </TouchableOpacity>
            {/* Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialButton, { borderColor: palette.border }]}
                onPress={handleAppleLogin}
              >
                <MaterialIcons name="apple" size={24} color={palette.text.primary} />
                <Text style={[styles.socialButtonText, { color: palette.text.primary }]}>Apple</Text>
              </TouchableOpacity>
            ) */}
          </View>
        </View>

        {/* Terms and Privacy */}
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: palette.text.secondary }]}>
            {t('auth.termsAndPrivacy', {
              terms: '',
              privacy: '',
            }).split('{{terms}}')[0]}
            <Text style={[styles.termsLink, { color: colors.student.primary }]}>
              {t('auth.terms')}
            </Text>
            {' '}{t('common.or')}{' '}
            <Text style={[styles.termsLink, { color: colors.student.primary }]}>
              {t('auth.privacy')}
            </Text>
            {' '}{t('auth.termsAndPrivacy', {
              terms: '',
              privacy: '',
            }).split('{{privacy}}')[1]}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  illustrationContainer: {
    width: '100%',
    height: 120,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    width: '100%',
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  headline: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  inputGroup: {
    width: '100%',
  },
  input: {
    width: '100%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    ...shadows.sm,
  },
  buttonsContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  primaryButton: {
    width: '100%',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  secondaryButton: {
    width: '100%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: typography.fontSize.sm,
    paddingHorizontal: spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.sm,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  socialButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  termsContainer: {
    width: '100%',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  termsText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: typography.fontWeight.medium,
  },
});

