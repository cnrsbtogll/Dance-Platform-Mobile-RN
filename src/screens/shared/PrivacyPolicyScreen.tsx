import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, getPalette, shadows } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/common/Card';

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
      headerShadowVisible: false,
    });
  }, [navigation, isDarkMode, palette, t]);

  const sections = [
    { id: '1', icon: 'info-outline', title: t('privacyPolicy.section1Title'), content: t('privacyPolicy.section1Content') },
    { id: '2', icon: 'settings-suggest', title: t('privacyPolicy.section2Title'), content: t('privacyPolicy.section2Content') },
    { id: '3', icon: 'share', title: t('privacyPolicy.section3Title'), content: t('privacyPolicy.section3Content') },
    { id: '4', icon: 'security', title: t('privacyPolicy.section4Title'), content: t('privacyPolicy.section4Content') },
    { id: '5', icon: 'cookie', title: t('privacyPolicy.section5Title'), content: t('privacyPolicy.section5Content') },
    { id: '6', icon: 'how-to-reg', title: t('privacyPolicy.section6Title'), content: t('privacyPolicy.section6Content') },
    { id: '7', icon: 'history', title: t('privacyPolicy.section7Title'), content: t('privacyPolicy.section7Content') },
  ];

  const lastUpdatedDate = new Date().toLocaleDateString();

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: palette.primary + '15' }]}>
            <MaterialIcons name="privacy-tip" size={32} color={palette.primary} />
          </View>
          <Text style={[styles.title, { color: palette.text.primary }]}>{t('privacyPolicy.title')}</Text>
          <Text style={[styles.lastUpdated, { color: palette.text.secondary }]}>
            {t('privacyPolicy.lastUpdated')} {lastUpdatedDate}
          </Text>
        </View>

        <View style={styles.sectionsContainer}>
          {sections.map((section) => (
            <View key={section.id} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: palette.card }]}>
                  <MaterialIcons name={section.icon as any} size={20} color={palette.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
                  {section.title}
                </Text>
              </View>
              <Card style={[styles.sectionCard, { backgroundColor: palette.card }]}>
                <Text style={[styles.content, { color: palette.text.secondary }]}>
                  {section.content}
                </Text>
              </Card>
            </View>
          ))}

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: palette.card }]}>
                <MaterialIcons name="mail-outline" size={20} color={palette.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
                {t('privacyPolicy.contactTitle')}
              </Text>
            </View>
            <Card style={[styles.sectionCard, { backgroundColor: palette.card }]}>
              <Text style={[styles.content, { color: palette.text.secondary }]}>
                {t('privacyPolicy.contactContent')}
              </Text>
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
  },
  sectionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  sectionContainer: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 4,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  sectionCard: {
    padding: spacing.md,
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  content: {
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
  },
});
