import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Card } from '../../components/common/Card';

interface SettingItem {
  id: string;
  icon: string;
  title: string;
  iconColor?: string;
  isDanger?: boolean;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
}

export const InstructorProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { isDarkMode, setDarkMode } = useThemeStore();
  const palette = getPalette('instructor', isDarkMode);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={{
          backgroundColor: colors.instructor.secondary,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: borderRadius.full,
          marginLeft: spacing.sm,
        }}>
          <Text style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.bold,
            color: '#ffffff',
          }}>
            EĞİTMEN
          </Text>
        </View>
      ),
    });
  }, [navigation]);

  const handleLogout = () => {
    logout();
    // Navigate to login screen if needed
  };

  const accountSettings: SettingItem[] = [
    {
      id: 'account',
      icon: 'person',
      title: 'Hesap Bilgileri',
      onPress: () => {},
    },
    {
      id: 'payment',
      icon: 'credit-card',
      title: 'Ödeme Yöntemleri',
      onPress: () => {},
    },
    {
      id: 'password',
      icon: 'lock',
      title: 'Şifre Değiştir',
      onPress: () => {},
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'notifications',
      icon: 'notifications',
      title: 'Bildirimler',
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#E5E7EB', true: colors.instructor.secondary }}
          thumbColor="#ffffff"
        />
      ),
    },
    {
      id: 'language',
      icon: 'language',
      title: 'Dil Seçimi',
      onPress: () => {},
    },
    {
      id: 'theme',
      icon: 'contrast',
      title: 'Görünüm',
      rightComponent: (
        <Switch
          value={isDarkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: '#E5E7EB', true: colors.instructor.secondary }}
          thumbColor="#ffffff"
        />
      ),
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      icon: 'help',
      title: 'Yardım Merkezi',
      onPress: () => {},
    },
    {
      id: 'about',
      icon: 'info',
      title: 'Hakkında',
      onPress: () => {},
    },
    {
      id: 'privacy',
      icon: 'shield',
      title: 'Gizlilik Politikası',
      onPress: () => {},
    },
    {
      id: 'logout',
      icon: 'logout',
      title: 'Çıkış Yap',
      isDanger: true,
      iconColor: '#e53e3e',
      onPress: handleLogout,
    },
  ];

  const renderSettingItem = (item: SettingItem, isLast: boolean = false) => (
    <View key={item.id}>
      <TouchableOpacity
        style={styles.settingItem}
        onPress={item.onPress}
        activeOpacity={0.7}
        disabled={!item.onPress}
      >
        <View style={styles.settingItemLeft}>
          <View
            style={[
              styles.settingIconContainer,
              {
                backgroundColor: item.isDanger
                  ? '#e53e3e20'
                  : item.iconColor
                  ? `${item.iconColor}20`
                  : `${colors.instructor.secondary}20`,
              },
            ]}
          >
            <MaterialIcons
              name={item.icon as any}
              size={24}
              color={item.isDanger ? '#e53e3e' : item.iconColor || colors.instructor.secondary}
            />
          </View>
          <Text
            style={[
              styles.settingItemText,
              item.isDanger && styles.settingItemTextDanger,
            ]}
          >
            {item.title}
          </Text>
        </View>
        <View style={styles.settingItemRight}>
          {item.rightComponent || (
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.instructor.text.lightSecondary}
            />
          )}
        </View>
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </View>
  );

  const renderSettingsCard = (title: string, items: SettingItem[]) => (
    <Card style={styles.settingsCard}>
      {title ? <Text style={styles.settingsCardTitle}>{title}</Text> : null}
      {items.map((item, index) => renderSettingItem(item, index === items.length - 1))}
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons
                name="person"
                size={48}
                color={colors.instructor.text.lightSecondary}
              />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: palette.text.primary }]}>{user?.name || 'Eğitmen'}</Text>
            <TouchableOpacity onPress={() => {
              (navigation as any).getParent()?.navigate('EditProfile');
            }}>
              <Text style={styles.editProfileLink}>Profili Düzenle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Switch to Student Mode Button */}
        <TouchableOpacity 
          style={styles.switchModeButton} 
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => {
            // Navigate to Student mode using CommonActions
            // Get root navigator to navigate between Student and Instructor
            const rootNavigation = navigation.getParent()?.getParent();
            if (rootNavigation) {
              rootNavigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Student' }],
                })
              );
            }
          }}
        >
          <Text style={styles.switchModeButtonText}>Öğrenci Moduna Geç</Text>
        </TouchableOpacity>

        {/* Account Settings */}
        {renderSettingsCard('Hesap Ayarları', accountSettings)}

        {/* Application Settings */}
        {renderSettingsCard('Uygulama Ayarları', appSettings)}

        {/* Support & Legal */}
        {renderSettingsCard('', supportSettings)}

        {/* Bottom spacing */}
        <View style={{ height: spacing.xl }} />
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    ...shadows.md,
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.instructor.card.light,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  profileInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.015,
  },
  editProfileLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.instructor.secondary,
  },
  switchModeButton: {
    height: 56,
    backgroundColor: colors.instructor.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
    zIndex: 10,
  },
  switchModeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
    letterSpacing: 0.015,
  },
  settingsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  settingsCardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.instructor.text.lightPrimary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    letterSpacing: -0.015,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItemText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.instructor.text.lightPrimary,
    flex: 1,
  },
  settingItemTextDanger: {
    color: '#e53e3e',
  },
  settingItemRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: spacing.md,
  },
});

