import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette(user?.role || 'student', isDarkMode);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: t('profile.privacyPolicy'),
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: palette.background }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={[styles.title, { color: palette.text.primary }]}>
            {t('privacyPolicy.title')}
          </Text>
          <Text style={[styles.lastUpdated, { color: palette.text.secondary }]}>
            {t('privacyPolicy.lastUpdated')} {new Date().toLocaleDateString()}
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('privacyPolicy.section1Title')}
          </Text>
          <Text style={[styles.content, { color: palette.text.secondary }]}>
            {t('privacyPolicy.section1Content')}
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('privacyPolicy.section2Title')}
          </Text>
          <Text style={[styles.content, { color: palette.text.secondary }]}>
            {t('privacyPolicy.section2Content')}
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('privacyPolicy.section3Title')}
          </Text>
          <Text style={[styles.content, { color: palette.text.secondary }]}>
            {t('privacyPolicy.section3Content')}
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('privacyPolicy.section4Title')}
          </Text>
          <Text style={[styles.content, { color: palette.text.secondary }]}>
            {t('privacyPolicy.section4Content')}
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('privacyPolicy.section5Title')}
          </Text>
          <Text style={[styles.content, { color: palette.text.secondary }]}>
            {t('privacyPolicy.section5Content')}
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('privacyPolicy.section6Title')}
          </Text>
          <Text style={[styles.content, { color: palette.text.secondary }]}>
            {t('privacyPolicy.section6Content')}
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('privacyPolicy.section7Title')}
          </Text>
          <Text style={[styles.content, { color: palette.text.secondary }]}>
            {t('privacyPolicy.section7Content')}
          </Text>

          <Text style={[styles.contactTitle, { color: palette.text.primary }]}>
            {t('privacyPolicy.contactTitle')}
          </Text>
          <Text style={[styles.content, { color: palette.text.secondary }]}>
            {t('privacyPolicy.contactContent')}
          </Text>
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
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  section: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    letterSpacing: -0.015,
  },
  lastUpdated: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    letterSpacing: -0.015,
  },
  content: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  contactTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});

