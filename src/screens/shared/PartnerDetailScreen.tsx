import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';
import { colors, getPalette, typography, spacing, borderRadius } from '../../utils/theme';
import { User } from '../../types/user';
import { getAvatarSource } from '../../utils/imageHelper';
import { useAuthStore } from '../../store/useAuthStore';

type PartnerDetailRouteParams = { partner: User };

/** Returns true if the viewer's profile has the required matching fields */
const isProfileComplete = (user: User | null): boolean => {
  if (!user) return false;
  return !!(
    user.gender &&
    user.city &&
    user.danceStyles &&
    user.danceStyles.length > 0
  );
};

export const PartnerDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { isDarkMode } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const partner = (route.params as PartnerDetailRouteParams)?.partner;

  const palette = getPalette('student', isDarkMode);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: partner?.displayName || partner?.name || t('chat.user'),
      headerShown: true,
      headerStyle: {
        backgroundColor: palette.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
      },
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

  // ─── Profile Gate ────────────────────────────────────────────────────────────
  const profileComplete = isProfileComplete(currentUser as User);
  const isVisible = currentUser ? (currentUser as User).isVisibleInPartnerSearch !== false : true;

  if (!profileComplete || !isVisible) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
        {/* Blurred preview header */}
        <View style={[styles.gateHeader, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.gateAvatarWrapper}>
            <Image
              source={getAvatarSource(partner.avatar, partner.id)}
              style={styles.gateAvatar}
              blurRadius={20}
            />
            <View style={styles.gateAvatarOverlay}>
              <MaterialIcons name="lock" size={32} color="#fff" />
            </View>
          </View>
          <Text style={[styles.gateName, { color: palette.text.secondary }]}>
            {'● ● ● ● ●'}
          </Text>
        </View>

        {/* Gate card */}
        <View style={[styles.gateCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <MaterialIcons name="person-search" size={40} color={palette.primary} style={{ marginBottom: spacing.md }} />

          <Text style={[styles.gateTitle, { color: palette.text.primary }]}>
            {t('profile.requiredFieldsTitle')}
          </Text>
          <Text style={[styles.gateDesc, { color: palette.text.secondary }]}>
            {t('profile.requiredFieldsBanner')}
          </Text>

          {/* Checklist */}
          <View style={styles.checkList}>
            <CheckRow
              done={!!(currentUser as User)?.gender}
              label={t('profile.genderLabel').replace(' *', '')}
              palette={palette}
            />
            <CheckRow
              done={!!(currentUser as User)?.city}
              label={t('profile.cityLabel').replace(' *', '')}
              palette={palette}
            />
            <CheckRow
              done={!!((currentUser as User)?.danceStyles?.length)}
              label={t('profile.danceStylesLabel')}
              palette={palette}
            />
            <CheckRow
              done={(currentUser as User)?.isVisibleInPartnerSearch !== false}
              label={t('profile.visibleInPartnerSearch')}
              palette={palette}
            />
          </View>

          <TouchableOpacity
            style={[styles.gateButton, { backgroundColor: palette.primary }]}
            onPress={() => (navigation as any).navigate('EditProfile')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="edit" size={18} color="#fff" />
            <Text style={styles.gateButtonText}>{t('profile.completeProfile')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────────

  const roleText = partner.role === 'instructor'
    ? t('chat.instructor')
    : partner.role === 'school'
      ? t('chat.school')
      : t('chat.student');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Profile Area */}
        <View style={[styles.headerArea, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Image
            source={getAvatarSource(partner.avatar, partner.id)}
            style={styles.avatarLarge}
          />
          <Text style={[styles.nameText, { color: palette.text.primary }]}>
            {partner.displayName || partner.name}
          </Text>
          <View style={[
            styles.roleBadge,
            {
              backgroundColor: partner.role === 'instructor'
                ? colors.instructor.primary + '15'
                : partner.role === 'school'
                  ? colors.school.primary + '15'
                  : colors.student.primary + '15',
            },
          ]}>
            <Text style={[
              styles.roleText,
              {
                color: partner.role === 'instructor'
                  ? colors.instructor.primary
                  : partner.role === 'school'
                    ? colors.school.primary
                    : colors.student.primary,
              },
            ]}>{roleText}</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsArea}>
          {/* Bio */}
          {partner.bio ? (
            <>
              <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>{t('detail.about')}</Text>
              <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Text style={[styles.bioText, { color: palette.text.primary }]}>{partner.bio}</Text>
              </View>
            </>
          ) : null}

          {/* Stats Grid */}
          {(() => {
            const stats: { label: string; value: string; icon?: string }[] = [];
            if (partner.gender) {
              stats.push({
                label: t('detail.gender') || 'Cinsiyet',
                value: partner.gender === 'male' ? (t('detail.male') || 'Erkek') : (t('detail.female') || 'Kadın'),
                icon: 'person',
              });
            }
            if (partner.age) {
              stats.push({ label: t('detail.age') || 'Yaş', value: `${partner.age}`, icon: 'cake' });
            }
            if (partner.height) {
              stats.push({ label: t('detail.height') || 'Boy', value: `${partner.height} cm`, icon: 'height' });
            }
            if (partner.weight) {
              stats.push({ label: t('detail.weight') || 'Kilo', value: `${partner.weight} kg`, icon: 'fitness-center' });
            }
            if (partner.rating) {
              stats.push({ label: t('detail.rating') || 'Puan', value: `${partner.rating}`, icon: 'star' });
            }
            if (partner.experience) {
              stats.push({ label: t('detail.experience') || 'Deneyim', value: partner.experience, icon: 'timeline' });
            }
            if (partner.city) {
              stats.push({ label: t('detail.city') || 'Şehir', value: partner.city, icon: 'location-on' });
            }
            if (stats.length === 0) return null;
            return (
              <View style={[styles.statsGrid, { marginTop: spacing.md }]}>
                {stats.map((stat, index) => (
                  <View key={index} style={[styles.statsGridItem, { backgroundColor: palette.card, borderColor: palette.border }]}>
                    <MaterialIcons name={stat.icon as any} size={18} color={stat.icon === 'star' ? '#FFD700' : palette.primary} />
                    <Text style={[styles.statLabel, { color: palette.text.secondary }]}>{stat.label}</Text>
                    <Text style={[styles.statValue, { color: palette.text.primary }]}>{stat.value}</Text>
                  </View>
                ))}
              </View>
            );
          })()}

          {/* Dance Styles */}
          {partner.danceStyles && partner.danceStyles.length > 0 ? (
            <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border, marginTop: spacing.md }]}>
              <Text style={[styles.statLabel, { color: palette.text.secondary, marginBottom: 8 }]}>{t('detail.danceStyles') || 'Dans Stilleri'}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {partner.danceStyles.map((style, idx) => (
                  <View key={idx} style={[styles.danceStyleTag, { backgroundColor: palette.primary + '15' }]}>
                    <Text style={{ color: palette.primary, fontSize: typography.fontSize.sm, fontWeight: '600' as any }}>{style}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* School */}
          {partner.schoolName ? (
            <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <MaterialIcons name="school" size={20} color={palette.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statLabel, { color: palette.text.secondary, marginBottom: 2 }]}>{t('detail.school') || 'Okul'}</Text>
                <Text style={[styles.statValue, { color: palette.text.primary }]}>{partner.schoolName}</Text>
              </View>
            </View>
          ) : null}

          {/* Instagram */}
          {partner.instagramHandle ? (
            <View style={[styles.infoCard, { backgroundColor: palette.card, borderColor: palette.border, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <AntDesign name="instagram" size={20} color={palette.primary} />
              <Text style={[styles.statValue, { color: palette.text.primary }]}>@{partner.instagramHandle.replace('@', '')}</Text>
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
          <Text style={styles.ctaButtonText}>{t('detail.contact')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Small helper component ───────────────────────────────────────────────────
const CheckRow: React.FC<{
  done: boolean;
  label: string;
  palette: ReturnType<typeof getPalette>;
}> = ({ done, label, palette }) => (
  <View style={styles.checkRow}>
    <MaterialIcons
      name={done ? 'check-circle' : 'radio-button-unchecked'}
      size={20}
      color={done ? '#22c55e' : palette.text.secondary}
    />
    <Text style={[
      styles.checkLabel,
      { color: done ? palette.text.primary : palette.text.secondary },
    ]}>
      {label}
    </Text>
  </View>
);
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl },

  // ── Gate ──
  gateHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
  },
  gateAvatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    marginBottom: spacing.sm,
  },
  gateAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  gateAvatarOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    letterSpacing: 4,
  },
  gateCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  gateTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  gateDesc: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  checkList: {
    width: '100%',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkLabel: {
    fontSize: typography.fontSize.base,
  },
  gateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
  },
  gateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.fontSize.base,
  },

  // ── Normal detail ──
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
  detailsArea: { padding: spacing.lg },
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
  statLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: 4,
  },
  statValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statsGridItem: {
    width: '47%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  danceStyleTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: Platform.OS === 'android' ? spacing.lg : spacing.md,
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
