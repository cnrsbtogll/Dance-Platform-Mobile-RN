import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, FlatList, Switch, TextInput, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows, getPalette } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { useLessonStore } from '../../store/useLessonStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { MockDataService } from '../../services/mockDataService';
import { formatPrice } from '../../utils/helpers';
import { Card } from '../../components/common/Card';
import { SearchBar } from '../../components/common/SearchBar';
import { getLessonImageSource, getAvatarSource } from '../../utils/imageHelper';

export const StudentHomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);
  const insets = useSafeAreaInsets();
  const { lessons, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, toggleFavorite, favoriteLessons } = useLessonStore();
  const { unreadCount, loadNotifications } = useNotificationStore();
  const filteredLessons = lessons.filter(lesson => {
    if (selectedCategory && lesson.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!lesson.title.toLowerCase().includes(query) && 
          !lesson.description.toLowerCase().includes(query) &&
          !lesson.category.toLowerCase().includes(query)) return false;
    }
    if (minPrice !== null && lesson.price < minPrice) return false;
    if (maxPrice !== null && lesson.price > maxPrice) return false;
    if (lesson.rating < minRating) return false;
    if (maxDuration !== null && lesson.duration > maxDuration) return false;
    return true;
  });

  const categories = [t('studentHome.categoryAll'), 'Salsa', 'Bachata', 'Tango', 'Kizomba', 'Modern'];
  
  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDuration, setMaxDuration] = useState<number | null>(null);

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
            source={getAvatarSource(user?.avatar, user?.id)}
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
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: palette.primary }]}
            onPress={() => setShowFilterModal(true)}
          >
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
                      {(() => {
                        const instructor = MockDataService.getInstructorForLesson(lesson.id);
                        const currency = instructor?.currency || 'USD';
                        return formatPrice(lesson.price, currency);
                      })()}
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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: palette.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
              <Text style={[styles.modalTitle, { color: palette.text.primary }]}>{t('studentHome.filter')}</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <MaterialIcons name="close" size={24} color={palette.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: palette.text.primary }]}>
                  {t('studentHome.priceRange')}
                </Text>
                <View style={styles.priceInputContainer}>
                  <View style={styles.priceInput}>
                    <Text style={[styles.priceLabel, { color: palette.text.secondary }]}>
                      {t('studentHome.minPrice')}
                    </Text>
                    <TextInput
                      style={[styles.priceInputField, { backgroundColor: palette.background, color: palette.text.primary, borderColor: palette.border }]}
                      placeholder="0"
                      placeholderTextColor={palette.text.secondary}
                      keyboardType="numeric"
                      value={minPrice?.toString() || ''}
                      onChangeText={(text) => setMinPrice(text ? parseFloat(text) : null)}
                    />
                  </View>
                  <View style={styles.priceInput}>
                    <Text style={[styles.priceLabel, { color: palette.text.secondary }]}>
                      {t('studentHome.maxPrice')}
                    </Text>
                    <TextInput
                      style={[styles.priceInputField, { backgroundColor: palette.background, color: palette.text.primary, borderColor: palette.border }]}
                      placeholder="∞"
                      placeholderTextColor={palette.text.secondary}
                      keyboardType="numeric"
                      value={maxPrice?.toString() || ''}
                      onChangeText={(text) => setMaxPrice(text ? parseFloat(text) : null)}
                    />
                  </View>
                </View>
              </View>

              {/* Rating */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: palette.text.primary }]}>
                  {t('studentHome.minRating')}
                </Text>
                <View style={styles.ratingContainer}>
                  {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingChip,
                        { 
                          backgroundColor: minRating === rating ? palette.primary : palette.background,
                          borderColor: palette.border,
                        }
                      ]}
                      onPress={() => setMinRating(rating)}
                    >
                      <Text style={[
                        styles.ratingChipText,
                        { color: minRating === rating ? '#ffffff' : palette.text.primary }
                      ]}>
                        {rating > 0 ? `${rating}+` : t('studentHome.all')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Duration */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: palette.text.primary }]}>
                  {t('studentHome.maxDuration')}
                </Text>
                <View style={styles.durationContainer}>
                  {[30, 60, 90, 120, null].map((duration) => (
                    <TouchableOpacity
                      key={duration || 'all'}
                      style={[
                        styles.durationChip,
                        { 
                          backgroundColor: maxDuration === duration ? palette.primary : palette.background,
                          borderColor: palette.border,
                        }
                      ]}
                      onPress={() => setMaxDuration(duration)}
                    >
                      <Text style={[
                        styles.durationChipText,
                        { color: maxDuration === duration ? '#ffffff' : palette.text.primary }
                      ]}>
                        {duration ? `${duration} ${t('studentHome.minutes')}` : t('studentHome.all')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

            </ScrollView>

            <View style={[
              styles.modalFooter, 
              { 
                borderTopColor: palette.border,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              }
            ]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.resetButton, { backgroundColor: palette.background }]}
                onPress={() => {
                  setMinPrice(null);
                  setMaxPrice(null);
                  setMinRating(0);
                  setMaxDuration(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: palette.text.primary }]}>
                  {t('studentHome.reset')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton, { backgroundColor: palette.primary }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.modalButtonTextWhite}>
                  {t('studentHome.apply')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  modalBody: {
    padding: spacing.md,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterSectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  priceInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  priceInputField: {
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ratingChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  ratingChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  durationChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  switchSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    borderWidth: 1,
  },
  applyButton: {
    // backgroundColor set inline
  },
  modalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  modalButtonTextWhite: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#ffffff',
  },
});
