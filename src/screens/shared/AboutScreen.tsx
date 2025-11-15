import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { appConfig } from '../../config/appConfig';
import { Card } from '../../components/common/Card';

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette(user?.role || 'student', isDarkMode);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: t('profile.about'),
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
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: palette.background }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Logo/Icon - En üstte */}
        <View style={styles.logoContainer}>
          <Image
            source={
              appConfig.brand === 'feriha'
                ? require('../../../assets/splash-feriha.png')
                : require('../../../assets/splash.png')
            }
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appVersion, { color: palette.text.secondary }]}>
            {t('about.version')} 1.0.0
          </Text>
        </View>

        <View style={styles.section}>

          {/* App Description */}
          <Card style={[styles.infoCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('about.aboutApp')}
            </Text>
            <Text style={[styles.description, { color: palette.text.secondary }]}>
              {appConfig.brand === 'codecanyon'
                ? t('about.descriptionCodecanyon')
                : t('about.description')}
            </Text>
          </Card>

          {/* Features */}
          <Card style={[styles.infoCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('about.features')}
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={20} color={colors.student.primary} />
                <Text style={[styles.featureText, { color: palette.text.secondary }]}>
                  {t('about.feature1')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={20} color={colors.student.primary} />
                <Text style={[styles.featureText, { color: palette.text.secondary }]}>
                  {t('about.feature2')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={20} color={colors.student.primary} />
                <Text style={[styles.featureText, { color: palette.text.secondary }]}>
                  {t('about.feature3')}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check-circle" size={20} color={colors.student.primary} />
                <Text style={[styles.featureText, { color: palette.text.secondary }]}>
                  {t('about.feature4')}
                </Text>
              </View>
            </View>
          </Card>

          {/* Contact Info */}
          <Card style={[styles.infoCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
              {t('about.contact')}
            </Text>
            <View style={styles.contactItem}>
              <MaterialIcons name="email" size={20} color={palette.text.secondary} />
              <Text style={[styles.contactText, { color: palette.text.secondary }]}>
                cnrsbtogll@gmail.com
              </Text>
            </View>
            <View style={styles.contactItem}>
              <MaterialIcons name="phone" size={20} color={palette.text.secondary} />
              <Text style={[styles.contactText, { color: palette.text.secondary }]}>
                +90 555 005 9876
              </Text>
            </View>
          </Card>

          {/* Copyright */}
          <Text style={[styles.copyright, { color: palette.text.secondary }]}>
            {appConfig.brand === 'codecanyon'
              ? t('about.copyrightCodecanyon')
              : t('about.copyright')}
          </Text>
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
  scrollContent: {
    paddingTop: 0,
  },
  section: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: 0,
    paddingTop: 0,
  },
  logoImage: {
    width: 220,
    height: 220,
    marginBottom: 0,
  },
  appVersion: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    marginTop: -spacing.md,
  },
  infoCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    letterSpacing: -0.015,
  },
  description: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: 24,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
  },
  copyright: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});

