import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { openWhatsApp } from '../../utils/whatsapp';
import { Card } from '../../components/common/Card';

export const BecomeInstructorScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const palette = getPalette('student', isDarkMode);
  const phone = '+90 555 005 9876';
  const message = 'Merhaba dance platform uygulamanıza eğitmen olarak kayıt yaptırmak istiyorum';

  const handleCreateAccount = () => {
    // Navigate to login/register screen
    (navigation as any).getParent()?.navigate('Login');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <MaterialIcons name="school" size={24} color={colors.student.primary} />
          <Text style={[styles.title, { color: palette.text.primary }]}>Eğitmen Ol</Text>
        </View>
        <Text style={[styles.description, { color: palette.text.secondary }]}>
          Dans eğitimi verin, öğrencilerinizle buluşun ve kazanç sağlayın.
        </Text>

        {/* Step 1: Create Account */}
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNumber, styles.stepNumberActive]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={[styles.stepTitle, { color: palette.text.primary }]}>
              Hesap Oluşturun
            </Text>
          </View>
          <Text style={[styles.stepDescription, { color: palette.text.secondary }]}>
            Eğitmen olmak için önce hesabınızı oluşturmanız gerekmektedir.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.student.primary }]}
            onPress={handleCreateAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Hesap Oluştur</Text>
          </TouchableOpacity>
        </View>

        {/* Step 2: WhatsApp Contact */}
        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepNumber, isAuthenticated ? styles.stepNumberActive : styles.stepNumberInactive]}>
              <Text style={[styles.stepNumberText, !isAuthenticated && styles.stepNumberTextInactive]}>2</Text>
            </View>
            <Text style={[styles.stepTitle, { color: isAuthenticated ? palette.text.primary : palette.text.secondary }]}>
              WhatsApp ile İletişime Geçin
            </Text>
          </View>
          <Text style={[styles.stepDescription, { color: palette.text.secondary }]}>
            {isAuthenticated 
              ? 'Eğitmen olarak ders açmak ve öğrencilerle buluşmak için bizimle iletişime geçin.'
              : 'Hesabınızı oluşturduktan sonra WhatsApp üzerinden bizimle iletişime geçebilirsiniz.'}
          </Text>
          {!isAuthenticated && (
            <View style={styles.warningContainer}>
              <MaterialIcons name="info-outline" size={20} color={colors.student.primary} />
              <Text style={[styles.warningText, { color: colors.student.primary }]}>
                Önce hesap oluşturmalısınız
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.whatsappButton,
              !isAuthenticated && [styles.buttonDisabled, { backgroundColor: palette.border }]
            ]}
            onPress={() => isAuthenticated && openWhatsApp(phone, message)}
            disabled={!isAuthenticated}
            activeOpacity={0.8}
          >
            <FontAwesome 
              name="whatsapp" 
              size={20} 
              color={isAuthenticated ? '#ffffff' : palette.text.secondary} 
            />
            <Text style={[
              styles.whatsappText,
              !isAuthenticated && { color: palette.text.secondary }
            ]}>
              WhatsApp ile İletişime Geç
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  description: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.xl,
  },
  stepContainer: {
    marginBottom: spacing.xl,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberActive: {
    backgroundColor: colors.student.primary,
  },
  stepNumberInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepNumberText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  stepNumberTextInactive: {
    color: '#9CA3AF',
  },
  stepTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  stepDescription: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  primaryButton: {
    width: '100%',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  warningText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#25D366',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  whatsappText: {
    color: '#ffffff',
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.base,
  },
});