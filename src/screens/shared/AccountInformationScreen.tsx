import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/common/Card';
import { formatDate } from '../../utils/helpers';

export const AccountInformationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette(user?.role || 'student', isDarkMode);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: t('profile.accountInfo'),
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

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: palette.text.primary }]}>
            {t('accountInfo.userNotFound')}
          </Text>
        </View>
      </View>
    );
  }

  const formatCreatedDate = (dateString: string): string => {
    const date = new Date(dateString);
    return formatDate(date.toISOString().split('T')[0]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: palette.background }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          {/* Personal Information */}
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>
            {t('accountInfo.personalInfo')}
          </Text>
          <Card style={[styles.infoCard, { backgroundColor: palette.card }]}>
            <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
              <View style={styles.infoRowLeft}>
                <MaterialIcons name="person" size={20} color={palette.text.secondary} />
                <Text style={[styles.infoLabel, { color: palette.text.secondary }]}>
                  {t('accountInfo.fullName')}
                </Text>
              </View>
              <Text style={[styles.infoValue, { color: palette.text.primary }]}>
                {user.name || t('profile.defaultName')}
              </Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
              <View style={styles.infoRowLeft}>
                <MaterialIcons name="email" size={20} color={palette.text.secondary} />
                <Text style={[styles.infoLabel, { color: palette.text.secondary }]}>
                  {t('auth.email')}
                </Text>
              </View>
              <Text style={[styles.infoValue, { color: palette.text.primary }]}>
                {user.email}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <MaterialIcons name="badge" size={20} color={palette.text.secondary} />
                <Text style={[styles.infoLabel, { color: palette.text.secondary }]}>
                  {t('accountInfo.role')}
                </Text>
              </View>
              <Text style={[styles.infoValue, { color: palette.text.primary }]}>
                {user.role === 'instructor' ? t('profile.instructor') : t('lessons.student')}
              </Text>
            </View>
          </Card>

          {/* Account Details */}
          <Text style={[styles.sectionTitle, { color: palette.text.primary, marginTop: spacing.lg }]}>
            {t('accountInfo.accountDetails')}
          </Text>
          <Card style={[styles.infoCard, { backgroundColor: palette.card }]}>
            <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
              <View style={styles.infoRowLeft}>
                <MaterialIcons name="calendar-today" size={20} color={palette.text.secondary} />
                <Text style={[styles.infoLabel, { color: palette.text.secondary }]}>
                  {t('accountInfo.memberSince')}
                </Text>
              </View>
              <Text style={[styles.infoValue, { color: palette.text.primary }]}>
                {formatCreatedDate(user.createdAt)}
              </Text>
            </View>
            {user.bio && (
              <View style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <MaterialIcons name="description" size={20} color={palette.text.secondary} />
                  <Text style={[styles.infoLabel, { color: palette.text.secondary }]}>
                    {t('accountInfo.bio')}
                  </Text>
                </View>
                <Text style={[styles.infoValue, { color: palette.text.primary, flex: 1, textAlign: 'right' }]}>
                  {user.bio}
                </Text>
              </View>
            )}
          </Card>

          {/* Statistics (if instructor) */}
          {user.role === 'instructor' && (
            <>
              <Text style={[styles.sectionTitle, { color: palette.text.primary, marginTop: spacing.lg }]}>
                {t('accountInfo.statistics')}
              </Text>
              <Card style={[styles.infoCard, { backgroundColor: palette.card }]}>
                {user.rating !== undefined && (
                  <View style={[styles.infoRow, { borderBottomColor: palette.border }]}>
                    <View style={styles.infoRowLeft}>
                      <MaterialIcons name="star" size={20} color={palette.text.secondary} />
                      <Text style={[styles.infoLabel, { color: palette.text.secondary }]}>
                        {t('lessons.rating')}
                      </Text>
                    </View>
                    <Text style={[styles.infoValue, { color: palette.text.primary }]}>
                      {user.rating.toFixed(1)} / 5.0
                    </Text>
                  </View>
                )}
                {user.totalLessons !== undefined && (
                  <View style={styles.infoRow}>
                    <View style={styles.infoRowLeft}>
                      <MaterialIcons name="school" size={20} color={palette.text.secondary} />
                      <Text style={[styles.infoLabel, { color: palette.text.secondary }]}>
                        {t('accountInfo.totalLessons')}
                      </Text>
                    </View>
                    <Text style={[styles.infoValue, { color: palette.text.primary }]}>
                      {user.totalLessons}
                    </Text>
                  </View>
                )}
              </Card>
            </>
          )}
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
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    letterSpacing: -0.015,
  },
  infoCard: {
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'right',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.md,
  },
});

