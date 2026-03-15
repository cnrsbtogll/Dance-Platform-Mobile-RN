import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, borderRadius, typography, spacing } from '../../utils/theme';

interface LocationBannerProps {
  city: string | null;
  onPressModify: () => void;
}

export const LocationBanner: React.FC<LocationBannerProps> = ({ city, onPressModify }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <MaterialIcons name="location-on" size={20} color={colors.student.primary} />
        <Text style={styles.text} numberOfLines={1}>
          {city 
            ? t('location.banner.active', { city, defaultValue: `📍 Bulunduğunuz ${city} ilindeki dans kursları listeleniyor` }) 
            : t('location.banner.empty', '📍 Tüm Türkiye\'deki dans kursları listeleniyor')}
        </Text>
      </View>
      <TouchableOpacity onPress={onPressModify} style={styles.modifyButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Text style={styles.modifyText}>{t('location.banner.modify', 'Değiştir')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${colors.student.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  text: {
    fontSize: typography.fontSize.sm,
    color: colors.student.text.primaryLight,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
    flexShrink: 1,
  },
  modifyButton: {
    paddingHorizontal: spacing.xs,
  },
  modifyText: {
    fontSize: typography.fontSize.sm,
    color: colors.student.primary,
    fontWeight: typography.fontWeight.bold,
  },
});
