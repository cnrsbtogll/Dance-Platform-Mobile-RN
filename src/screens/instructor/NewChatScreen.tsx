import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing, typography, borderRadius, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { MockDataService } from '../../services/mockDataService';
import { useAuthStore } from '../../store/useAuthStore';
import { getAvatarSource } from '../../utils/imageHelper';

export const InstructorNewChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('instructor', isDarkMode);
  const [searchQuery, setSearchQuery] = useState('');

  // Get students list (for instructors)
  const students = useMemo(() => {
    const allStudents = MockDataService.getUsersByRole('student');
    if (!searchQuery.trim()) {
      return allStudents.filter(student => student.id !== user?.id);
    }
    const query = searchQuery.toLowerCase();
    return allStudents.filter(
      student => 
        student.id !== user?.id &&
        (student.name.toLowerCase().includes(query) ||
         student.email.toLowerCase().includes(query) ||
         student.bio?.toLowerCase().includes(query))
    );
  }, [searchQuery, user]);

  const handleSelectUser = (studentId: string) => {
    (navigation as any).navigate('ChatDetail', {
      userId: studentId,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['top']}>
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={palette.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text.primary }]}>{t('chat.newChat')}</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
        <View style={[styles.searchBar, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <MaterialIcons name="search" size={20} color={palette.text.secondary} />
          <TextInput
            style={[styles.searchInput, { color: palette.text.primary }]}
            placeholder={t('chat.searchStudents')}
            placeholderTextColor={palette.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={palette.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Students List */}
      <ScrollView style={[styles.scrollView, { backgroundColor: palette.background }]} showsVerticalScrollIndicator={false}>
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons 
              name="person-search" 
              size={64} 
              color={palette.text.secondary + '80'} 
            />
            <Text style={[styles.emptyStateTitle, { color: palette.text.primary }]}>
              {searchQuery ? t('chat.noResults') : t('chat.noStudents')}
            </Text>
            <Text style={[styles.emptyStateText, { color: palette.text.secondary }]}>
              {searchQuery ? t('chat.noResultsDescription') : t('chat.noStudentsDescription')}
            </Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {students.map((student) => (
              <TouchableOpacity
                key={student.id}
                style={[styles.userItem, { backgroundColor: palette.card }]}
                activeOpacity={0.7}
                onPress={() => handleSelectUser(student.id)}
              >
                <View style={styles.userContent}>
                  <View style={styles.avatarContainer}>
                    <Image
                      source={getAvatarSource(student.avatar, student.id)}
                      style={styles.avatar}
                    />
                    <View style={[styles.onlineIndicator, { borderColor: palette.card }]} />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: palette.text.primary }]} numberOfLines={1}>
                      {student.name}
                    </Text>
                    <Text style={[styles.userSubtitle, { color: palette.text.secondary }]} numberOfLines={1}>
                      {t('chat.student')}
                    </Text>
                    {student.bio && (
                      <Text style={[styles.userBio, { color: palette.text.secondary }]} numberOfLines={1}>
                        {student.bio}
                      </Text>
                    )}
                  </View>
                  <MaterialIcons 
                    name="chevron-right" 
                    size={24} 
                    color={palette.text.secondary} 
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: -0.015,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
  },
  scrollView: {
    flex: 1,
  },
  usersList: {
    padding: spacing.xs,
    gap: spacing.xs,
  },
  userItem: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    minHeight: 72,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1ABC9C',
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  userName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  userSubtitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  userBio: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl * 2,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 300,
  },
});

