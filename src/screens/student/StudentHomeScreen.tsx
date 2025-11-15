import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useLessonStore } from '../../store/useLessonStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { MockDataService } from '../../services/mockDataService';
import { formatPrice } from '../../utils/helpers';
import { Card } from '../../components/common/Card';
import { SearchBar } from '../../components/common/SearchBar';
import { getLessonImageSource } from '../../utils/imageHelper';

export const StudentHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);
  const { lessons, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, toggleFavorite, favoriteLessons } = useLessonStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const filteredLessons = lessons.filter(lesson => {
    if (selectedCategory && lesson.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return lesson.title.toLowerCase().includes(query) || 
             lesson.description.toLowerCase().includes(query) ||
             lesson.category.toLowerCase().includes(query);
    }
    return true;
  });

  const categories = [t('studentHome.categoryAll'), 'Salsa', 'Bachata', 'Tango', 'Kizomba'];

  useEffect(() => {
    if (user) {
      loadNotifications(user.id);
    }
  }, [user, loadNotifications]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: user?.avatar || '' }}
            style={styles.avatar}
          />
          <Text style={[styles.headerTitle, { color: palette.text.primary }] }>
            {t('studentHome.greeting', { name: user?.name?.split(' ')[0] || 'Ahmet' })}
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => {
            (navigation as any).getParent()?.navigate('Notification');
          }}
        >
          <View style={{ position: 'relative' }}>
            <MaterialIcons
              name="notifications"
              size={24}
              color={palette.text.primary}
            />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { borderColor: palette.background }]}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ),
      headerTitle: '',
    });
  }, [navigation, user, unreadCount, isDarkMode]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Search Bar & Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBarWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('studentHome.searchPlaceholder')}
            />
          </View>
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: palette.primary }]}>
            <MaterialIcons name="tune" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Category Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
          contentContainerStyle={styles.chipsContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
                style={[
                styles.chip,
                { backgroundColor: (selectedCategory === category || (category === t('studentHome.categoryAll') && !selectedCategory)) ? palette.primary : palette.card }
              ]}
              onPress={() => setSelectedCategory(category === t('studentHome.categoryAll') ? null : category)}
            >
              <Text style={[
                styles.chipText,
                { color: (selectedCategory === category || (category === t('studentHome.categoryAll') && !selectedCategory)) ? '#ffffff' : palette.text.secondary }
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lessons List */}
        <View style={styles.lessonsContainer}>
          {filteredLessons.map((lesson) => {
            const instructor = MockDataService.getInstructorForLesson(lesson.id);
            const isFavorite = favoriteLessons.includes(lesson.id);
            
            return (
              <TouchableOpacity
                key={lesson.id}
                activeOpacity={0.7}
                onPress={() => {
                  // Navigate to LessonDetail in the parent Stack Navigator
                  (navigation as any).getParent()?.navigate('LessonDetail', {
                    lessonId: lesson.id,
                  });
                }}
              >
              <Card style={styles.lessonCard}>
                <View style={styles.lessonImageContainer}>
                  {lesson.imageUrl && (
                    <Image
                      source={getLessonImageSource(lesson.imageUrl)}
                      style={styles.lessonImage}
                      resizeMode="cover"
                    />
                  )}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(lesson.id)}
                  >
                    <MaterialIcons 
                      name={isFavorite ? "favorite" : "favorite-border"} 
                      size={24} 
                      color="#ffffff" 
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.lessonContent}>
                  <Text style={[styles.instructorName, { color: palette.text.secondary }]}>
                    {t('studentHome.instructorLabel')}: {instructor?.name || t('studentHome.unknown')}
                  </Text>
                  <Text style={[styles.lessonTitle, { color: palette.text.primary }]}>{lesson.title}</Text>
                  <View style={styles.lessonFooter}>
                    <View style={styles.ratingContainer}>
                      <AntDesign name="star" size={20} color={colors.student.secondary} />
                      <Text style={[styles.rating, { color: palette.text.primary }] }>
                        {lesson.rating.toFixed(1)} <Text style={[styles.reviewCount, { color: palette.text.secondary }]}>({lesson.reviewCount})</Text>
                      </Text>
                    </View>
                    <Text style={[styles.price, { color: palette.text.primary }]}>
                      {formatPrice(lesson.price)}
                      <Text style={[styles.priceUnit, { color: palette.text.secondary }]}> {t('studentHome.priceUnit')}</Text>
                    </Text>
                  </View>
                </View>
              </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.student.background.light,
  },
  scrollView: {
    flex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
    letterSpacing: -0.15,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e53e3e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.student.background.light,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchBarWrapper: {
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.student.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsContainer: {
    paddingVertical: spacing.sm,
  },
  chipsContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.student.card.light,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  chipActive: {
    backgroundColor: colors.student.primary,
  },
  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.student.text.primaryLight,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  lessonsContainer: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  lessonCard: {
    marginBottom: spacing.md,
  },
  lessonImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  lessonImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    fontSize: 20,
  },
  lessonContent: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  instructorName: {
    fontSize: typography.fontSize.sm,
    color: colors.student.text.secondaryLight,
  },
  lessonTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
  },
  lessonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  star: {
    fontSize: 20,
  },
  rating: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.student.text.primaryLight,
  },
  reviewCount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.student.text.secondaryLight,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.student.text.primaryLight,
  },
  priceUnit: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.student.text.secondaryLight,
  },
});
