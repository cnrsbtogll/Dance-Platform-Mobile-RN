import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing, typography, borderRadius, getPalette, shadows } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/common/Card';
import { formatDate } from '../../utils/helpers';
import { getAvatarSource } from '../../utils/imageHelper';

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
      headerShadowVisible: false,
    });
  }, [navigation, isDarkMode, palette, t]);

  if (!user) return null;

  const formatCreatedDate = (dateString?: any): string => {
    if (!dateString) return '';
    if (dateString && typeof dateString === 'object' && dateString.seconds) {
      try {
        const date = new Date(dateString.seconds * 1000);
        return formatDate(date.toISOString().split('T')[0]);
      } catch (e) { return ''; }
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return String(dateString);
      return formatDate(date.toISOString().split('T')[0]);
    } catch (e) { return String(dateString || ''); }
  };

  const InfoItem = ({ icon, label, value, isLast = false }: { icon: keyof typeof MaterialIcons.glyphMap, label: string, value: string, isLast?: boolean }) => (
    <View style={[styles.infoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
        <MaterialIcons name={icon} size={20} color={palette.text.secondary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: palette.text.secondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: palette.text.primary }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile Header */}
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: palette.card }]}>
            <Image
              source={getAvatarSource(user.photoURL)}
              style={styles.avatar}
            />
          </View>
          <Text style={[styles.name, { color: palette.text.primary }]}>{user.name || t('profile.defaultName')}</Text>
          <Text style={[styles.email, { color: palette.text.secondary }]}>{user.email}</Text>

          <View style={[styles.roleBadge, { backgroundColor: palette.primary + '20' }]}>
            <Text style={[styles.roleText, { color: palette.primary }]}>
              {user.role === 'instructor' ? t('profile.instructor') : t('lessons.student')}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('accountInfo.accountDetails')}</Text>
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
            <InfoItem icon="person" label={t('accountInfo.fullName')} value={user.name || '-'} />
            <InfoItem icon="email" label={t('auth.email')} value={user.email} />
            <InfoItem icon="calendar-today" label={t('accountInfo.memberSince')} value={formatCreatedDate(user.createdAt)} isLast={!user.bio} />
          </Card>
        </View>

        {/* Bio Section */}
        {user.bio && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('accountInfo.bio')}</Text>
            <Card style={[styles.card, { backgroundColor: palette.card }]}>
              <Text style={[styles.bioText, { color: palette.text.primary }]}>{user.bio}</Text>
            </Card>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
    ...shadows.md,
    padding: 2, // Border effect
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 4,
  },
  email: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  bioText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    padding: spacing.md,
  },
});
