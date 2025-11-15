import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch, Modal } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { isDarkMode, setDarkMode, language, setLanguage } = useThemeStore();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const palette = getPalette('student', isDarkMode);

  const handleLogout = () => {
    logout();
    // Navigate to login screen if needed
  };

  const handleSwitchToInstructorMode = () => {
    // Navigate to Instructor mode using CommonActions
    const rootNavigation = navigation.getParent()?.getParent();
    if (rootNavigation) {
      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Instructor' }],
        })
      );
    }
  };

  const accountSettings: SettingItem[] = [
    {
      id: 'account',
      icon: 'person',
      title: t('profile.accountInfo'),
      onPress: () => (navigation as any).navigate('AccountInformation'),
    },
    {
      id: 'payment',
      icon: 'credit-card',
      title: t('profile.paymentMethods'),
      onPress: () => (navigation as any).navigate('PaymentMethods'),
    },
    {
      id: 'password',
      icon: 'lock',
      title: t('profile.changePassword'),
      onPress: () => (navigation as any).navigate('ChangePassword'),
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'notifications',
      icon: 'notifications',
      title: t('profile.notifications'),
      rightComponent: (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#E5E7EB', true: colors.student.primary }}
          thumbColor="#ffffff"
        />
      ),
    },
    {
      id: 'language',
      icon: 'language',
      title: t('profile.language'),
      onPress: () => setLanguageModalVisible(true),
      rightComponent: (
        <View style={styles.languageValueContainer}>
          <Text style={[styles.languageValue, { color: palette.text.secondary }]}>
            {language === 'tr' ? t('profile.turkish') : t('profile.english')}
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={palette.text.secondary}
          />
        </View>
      ),
    },
    {
      id: 'theme',
      icon: 'contrast',
      title: t('profile.darkMode'),
      rightComponent: (
        <Switch
          value={isDarkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: '#E5E7EB', true: colors.student.primary }}
          thumbColor="#ffffff"
        />
      ),
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      icon: 'help',
      title: t('profile.helpCenter'),
      onPress: () => (navigation as any).navigate('HelpCenter'),
    },
    {
      id: 'about',
      icon: 'info',
      title: t('profile.about'),
      onPress: () => (navigation as any).navigate('About'),
    },
    {
      id: 'privacy',
      icon: 'shield',
      title: t('profile.privacyPolicy'),
      onPress: () => (navigation as any).navigate('PrivacyPolicy'),
    },
    {
      id: 'logout',
      icon: 'logout',
      title: t('profile.logout'),
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
                  : '#48C9B020',
              },
            ]}
          >
            <MaterialIcons
              name={item.icon as any}
              size={24}
              color={item.isDanger ? '#e53e3e' : item.iconColor || '#48C9B0'}
            />
          </View>
          <Text
            style={[
              styles.settingItemText,
              { color: item.isDanger ? '#e53e3e' : palette.text.primary },
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
              color={palette.text.secondary}
            />
          )}
        </View>
      </TouchableOpacity>
      {!isLast && <View style={[styles.divider, { backgroundColor: palette.border }]} />}
    </View>
  );

  const renderSettingsCard = (title: string, items: SettingItem[]) => (
    <Card style={styles.settingsCard}>
      {title ? <Text style={[styles.settingsCardTitle, { color: palette.text.primary }]}>{title}</Text> : null}
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
            <View style={[styles.avatarPlaceholder, { backgroundColor: palette.card }]}>
              <MaterialIcons
                name="person"
                size={48}
                color={palette.text.secondary}
              />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: palette.text.primary }]}>
              {user?.name || t('profile.defaultName')}
            </Text>
            {isAuthenticated && user && (
              <TouchableOpacity onPress={() => {
                (navigation as any).getParent()?.navigate('EditProfile');
              }}>
                <Text style={[styles.editProfileLink, { color: '#48C9B0' }]}>{t('profile.editProfile')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Switch to Instructor Mode Button - if user is instructor */}
        {isAuthenticated && user?.role === 'instructor' && (
          <TouchableOpacity 
            style={styles.switchModeButton} 
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleSwitchToInstructorMode}
          >
            <Text style={styles.switchModeButtonText}>{t('profile.switchToInstructorMode')}</Text>
          </TouchableOpacity>
        )}

        {/* Become Instructor Button - if user is student or not logged in */}
        {(!isAuthenticated || user?.role === 'student') && (
          <TouchableOpacity 
            style={styles.switchModeButton} 
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => {
              (navigation as any).getParent()?.navigate('BecomeInstructor');
            }}
          >
            <Text style={styles.switchModeButtonText}>{t('profile.becomeInstructor')}</Text>
          </TouchableOpacity>
        )}

        {/* Account Settings */}
        {renderSettingsCard(t('profile.accountSettings'), accountSettings)}

        {/* Application Settings */}
        {renderSettingsCard(t('profile.appSettings'), appSettings)}

        {/* Support & Legal */}
        {renderSettingsCard('', supportSettings)}

        {/* Bottom spacing */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: palette.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text.primary }]}>
                {t('profile.language')}
              </Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={palette.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'tr' && { backgroundColor: `${colors.student.primary}20` },
              ]}
              onPress={() => {
                setLanguage('tr');
                setLanguageModalVisible(false);
              }}
            >
              <Text style={[styles.languageOptionText, { color: palette.text.primary }]}>
                {t('profile.turkish')}
              </Text>
              {language === 'tr' && (
                <MaterialIcons name="check" size={24} color={colors.student.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'en' && { backgroundColor: `${colors.student.primary}20` },
              ]}
              onPress={() => {
                setLanguage('en');
                setLanguageModalVisible(false);
              }}
            >
              <Text style={[styles.languageOptionText, { color: palette.text.primary }]}>
                {t('profile.english')}
              </Text>
              {language === 'en' && (
                <MaterialIcons name="check" size={24} color={colors.student.primary} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    color: '#48C9B0',
  },
  switchModeButton: {
    height: 56,
    backgroundColor: colors.student.primary,
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
    marginHorizontal: spacing.md,
  },
  languageValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  languageValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  languageOptionText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
});
