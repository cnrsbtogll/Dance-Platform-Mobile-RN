import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { login, setUser } = useAuthStore();
  const palette = getPalette('student', isDarkMode);
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Update header title when switching between login/signup
  useEffect(() => {
    navigation.setOptions({
      headerTitle: isSignUp ? 'Hesap Oluştur' : 'Giriş Yap',
    });
  }, [isSignUp, navigation]);

  const handleCreateAccount = async () => {
    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      // Show error message - in real app use Alert or Toast
      return;
    }
    
    if (password !== confirmPassword) {
      // Show error message - passwords don't match
      return;
    }
    
    // Mock: Create account and auto-login
    // In real app, this would call Firebase Auth
    const mockUser = {
      id: `user_${Date.now()}`,
      name: `${firstName} ${lastName}`,
      email: email,
      role: 'student' as const,
      avatar: '',
      bio: '',
      rating: 0,
      totalLessons: 0,
      createdAt: new Date().toISOString(),
    };
    setUser(mockUser);
    navigation.goBack();
  };

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      navigation.goBack();
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
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZDbnf1_BcJpeGVAiB82q62bj9gF-jZ3vF-3Xgx7nBrahcw7B-XjftsO-2q1TdxaCJgv1zq_YLmIikUlvRXmrjRr8J7p7HRpUi6QY-7HXNi89ZrAoUarJ4YIVJAMVWWGWCdk4-AwotV7jmdKBlI1hVffZCkDPCySd-TDhvb6GagMdBlNVOXubiUxh-LcC6HH4Kv7CeF8s50hMhXGOg63xZC4rvq9_nhvmb4QtMpOuCCpRCvQtyQ77szSweIg_unHz1oypoeuQrt1xr' }}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Title and Description */}
        <View style={styles.textContainer}>
          <Text style={[styles.headline, { color: palette.text.primary }]}>
            Dans Tutkunuza Bir Adım Daha Yaklaşın
          </Text>
          <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
            En iyi eğitmenlerle tanışın ve dans etmeyi öğrenin.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {isSignUp && (
            <>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                  placeholder="Ad"
                  placeholderTextColor={palette.text.secondary}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={[styles.input, { borderColor: palette.border, backgroundColor: palette.card, color: palette.text.primary }]}
                  placeholder="Soyad"
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
              placeholder="E-posta"
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
              placeholder="Şifre"
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
                placeholder="Şifre Tekrar"
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
              {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
            </Text>
          </TouchableOpacity>

          {!isSignUp && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.student.primary }]}
              onPress={() => setIsSignUp(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.student.primary }]}>
                Hesap Oluştur
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
                Zaten hesabım var
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
            <Text style={[styles.dividerText, { color: palette.text.secondary }]}>veya</Text>
            <View style={[styles.dividerLine, { backgroundColor: palette.border }]} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={[styles.socialButton, { borderColor: palette.border }]}>
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.socialIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { borderColor: palette.border }]}>
              <MaterialIcons name="apple" size={24} color={palette.text.primary} />
              <Text style={[styles.socialButtonText, { color: palette.text.primary }]}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms and Privacy */}
        <View style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: palette.text.secondary }]}>
            Devam ederek{' '}
            <Text style={[styles.termsLink, { color: colors.student.primary }]}>
              Kullanım Koşullarımızı
            </Text>
            {' '}ve{' '}
            <Text style={[styles.termsLink, { color: colors.student.primary }]}>
              Gizlilik Politikamızı
            </Text>
            {' '}kabul etmiş olursunuz.
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

