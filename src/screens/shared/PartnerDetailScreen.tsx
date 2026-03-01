import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';
import { getPalette, typography, spacing, borderRadius } from '../../utils/theme';
import { User } from '../../types/user';
import { getAvatarSource } from '../../utils/imageHelper';

type PartnerDetailRouteParams = {
  partner: User;
};

export const PartnerDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const partner = (route.params as PartnerDetailRouteParams)?.partner;

  const palette = getPalette('student', isDarkMode);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: partner?.displayName || partner?.name || t('chat.user'),
      headerShown: true,
      headerStyle: { backgroundColor: palette.background, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: palette.border },
      headerTintColor: palette.text.primary,
      headerBackTitle: '',
    });
  }, [navigation, partner, palette]);

  if (!partner) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: palette.text.primary }}>Kullanıcı bulunamadı.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: palette.primary }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roleText = partner.role === 'instructor'
    ? t('chat.instructor')
    : partner.role === 'school'
      ? 'Okul'
      : t('chat.student');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Profile Area */}
        <View style={[styles.headerArea, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Image
            source={getAvatarSource(partner.avatar, partner.id)}
            style={styles.avatarLarge}
          />
          <Text style={[styles.nameText, { color: palette.text.primary }]}>
            {partner.displayName || partner.name}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: palette.primary + '15' }]}>
            <Text style={[styles.roleText, { color: palette.primary }]}>{roleText}</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsArea}>
          <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>Hakkında</Text>
          <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.bioText, { color: partner.bio ? palette.text.primary : palette.text.secondary }]}>
              {partner.bio || 'Henüz bir biyografi eklenmemiş.'}
            </Text>
          </View>

          {(partner.gender || partner.rating || false) ? (
            <View style={[styles.statsRow, { borderColor: palette.border }]}>
              {partner.gender ? (
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: palette.text.secondary }]}>Cinsiyet</Text>
                  <Text style={[styles.statValue, { color: palette.text.primary }]}>
                    {partner.gender === 'male' ? 'Erkek' : partner.gender === 'female' ? 'Kadın' : 'Diğer'}
                  </Text>
                </View>
              ) : null}
              {partner.rating ? (
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: palette.text.secondary }]}>Puan</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                    <Text style={[styles.statValue, { color: palette.text.primary }]}>
                      {partner.rating}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {partner.schoolName ? (
            <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border, marginTop: spacing.md }]}>
              <Text style={[styles.statLabel, { color: palette.text.secondary, marginBottom: 4 }]}>Okulu</Text>
              <Text style={[styles.statValue, { color: palette.text.primary }]}>{partner.schoolName}</Text>
            </View>
          ) : null}

          {partner.instagramHandle ? (
            <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <AntDesign name="instagram" size={20} color={palette.primary} />
              <Text style={[styles.statValue, { color: palette.text.primary }]}>{partner.instagramHandle}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.footer, { backgroundColor: palette.background, borderTopColor: palette.border }]}>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: palette.primary }]}
          activeOpacity={0.8}
          onPress={() => {
            (navigation as any).navigate('ChatDetail', {
              targetUserId: partner.id,
              targetUserName: partner.displayName || partner.name,
              targetUserAvatar: partner.avatar,
              isNewChat: true,
            });
          }}
        >
          <MaterialIcons name="chat" size={20} color="#ffffff" />
          <Text style={styles.ctaButtonText}>{t('detail.contact') || 'İletişime Geç'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for bottom fixed footer
  },
  headerArea: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: spacing.md,
  },
  nameText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  roleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  detailsArea: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  bioText: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
});
